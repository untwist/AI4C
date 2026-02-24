import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import './DiffusionModel.css';

// ---------------------------------------------------------------------------
// Constants (32x32 image)
// ---------------------------------------------------------------------------
const IMG_SIZE = 32;
const IMG_PIXELS = IMG_SIZE * IMG_SIZE; // 1024
const EMBED_DIM = 16;
const HIDDEN_DIM = 512;
const INPUT_DIM = IMG_PIXELS + EMBED_DIM;
const PIXEL_SCALE = 8; // each pixel drawn as 8x8 -> 256x256 display

// Seeded RNG for reproducibility
function createSeededRandom(seed: number) {
    return function () {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

function randn(rand: () => number): number {
    const u1 = rand();
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function idx(x: number, y: number): number {
    return y * IMG_SIZE + x;
}

// ---------------------------------------------------------------------------
// Preset 32x32 grayscale images (x0)
// ---------------------------------------------------------------------------
function imageCircle(): number[] {
    const out = new Array(IMG_PIXELS).fill(0);
    const cx = 16;
    const cy = 16;
    const r = 12;
    for (let y = 0; y < IMG_SIZE; y++) {
        for (let x = 0; x < IMG_SIZE; x++) {
            const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            out[idx(x, y)] = d <= r ? 1 : 0;
        }
    }
    return out;
}

function imageSquare(): number[] {
    const out = new Array(IMG_PIXELS).fill(0);
    for (let y = 8; y < 24; y++) {
        for (let x = 8; x < 24; x++) {
            out[idx(x, y)] = 1;
        }
    }
    return out;
}

function imageTriangle(): number[] {
    const out = new Array(IMG_PIXELS).fill(0);
    // Triangle: (16,6), (6,26), (26,26)
    for (let y = 0; y < IMG_SIZE; y++) {
        for (let x = 0; x < IMG_SIZE; x++) {
            const t = 1 - y / 26;
            const left = 6 + (16 - 6) * t;
            const right = 26 - (26 - 16) * t;
            if (y <= 26 && x >= left && x <= right) out[idx(x, y)] = 1;
        }
    }
    return out;
}

function imageCross(): number[] {
    const out = new Array(IMG_PIXELS).fill(0);
    const c = 16;
    const w = 4;
    for (let i = 0; i < IMG_SIZE; i++) {
        for (let d = -w; d <= w; d++) {
            if (c + d >= 0 && c + d < IMG_SIZE) {
                out[idx(c + d, i)] = 1;
                out[idx(i, c + d)] = 1;
            }
        }
    }
    return out;
}

function imageRing(): number[] {
    const out = new Array(IMG_PIXELS).fill(0);
    const cx = 16;
    const cy = 16;
    const rOut = 12;
    const rIn = 6;
    for (let y = 0; y < IMG_SIZE; y++) {
        for (let x = 0; x < IMG_SIZE; x++) {
            const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            out[idx(x, y)] = d <= rOut && d >= rIn ? 1 : 0;
        }
    }
    return out;
}

function imageDiamond(): number[] {
    const out = new Array(IMG_PIXELS).fill(0);
    const cx = 16;
    const cy = 16;
    const h = 10;
    for (let y = 0; y < IMG_SIZE; y++) {
        for (let x = 0; x < IMG_SIZE; x++) {
            const dy = Math.abs(y - cy);
            const dx = Math.abs(x - cx);
            if (dx + dy <= h) out[idx(x, y)] = 1;
        }
    }
    return out;
}

function imageHeart(): number[] {
    const out = new Array(IMG_PIXELS).fill(0);
    const cx = 16;
    const cy = 14;
    for (let y = 0; y < IMG_SIZE; y++) {
        for (let x = 0; x < IMG_SIZE; x++) {
            const nx = (x - cx) / 12;
            const ny = (y - cy) / 12;
            const v = nx * nx + (ny - Math.sqrt(Math.abs(nx)) * 0.5) ** 2;
            if (v <= 1) out[idx(x, y)] = 1;
        }
    }
    return out;
}

const PRESETS: { id: string; name: string; fn: () => number[] }[] = [
    { id: 'circle', name: 'Circle', fn: imageCircle },
    { id: 'square', name: 'Square', fn: imageSquare },
    { id: 'triangle', name: 'Triangle', fn: imageTriangle },
    { id: 'cross', name: 'Cross', fn: imageCross },
    { id: 'ring', name: 'Ring', fn: imageRing },
    { id: 'diamond', name: 'Diamond', fn: imageDiamond },
    { id: 'heart', name: 'Heart', fn: imageHeart }
];

// All preset images for training (precomputed)
function getAllPresetImages(): number[][] {
    return PRESETS.map(p => p.fn());
}

// ---------------------------------------------------------------------------
// Draw 32x32 image to canvas
// ---------------------------------------------------------------------------
function drawImageGrid(
    canvas: HTMLCanvasElement | null,
    data: number[],
    cellSize: number = PIXEL_SCALE,
    normalize: boolean = false
): void {
    if (!canvas || data.length !== IMG_PIXELS) return;
    const size = IMG_SIZE * cellSize;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let toDraw = data;
    if (normalize) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        toDraw = data.map(v => (v - min) / range);
    }
    for (let i = 0; i < IMG_PIXELS; i++) {
        const x = (i % IMG_SIZE) * cellSize;
        const y = Math.floor(i / IMG_SIZE) * cellSize;
        const v = Math.max(0, Math.min(1, toDraw[i]));
        const g = Math.round(v * 255);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(x, y, cellSize, cellSize);
    }
}

// ---------------------------------------------------------------------------
// Noise schedule
// ---------------------------------------------------------------------------
type ScheduleType = 'linear' | 'cosine';

// Target: alpha_bar at t=T should be small so x_T is essentially pure noise.
const ALPHA_BAR_T_MIN = 0.01;

function getNoiseSchedule(T: number, schedule: ScheduleType): { alphaBar: number[]; alpha: number[]; beta: number[] } {
    const alpha: number[] = [];
    const beta: number[] = [];
    if (schedule === 'linear') {
        // Linear in alpha_bar: decay from 1 to ALPHA_BAR_T_MIN so that at t=T we get ~pure noise.
        const alphaBar: number[] = [1];
        for (let t = 1; t <= T; t++) {
            const frac = t / T;
            alphaBar.push(1 - (1 - ALPHA_BAR_T_MIN) * frac);
        }
        alpha[0] = 1;
        beta[0] = 0;
        for (let t = 1; t <= T; t++) {
            alpha.push(alphaBar[t] / alphaBar[t - 1]);
            beta.push(1 - alpha[t]);
        }
        return { alphaBar, alpha, beta };
    } else {
        // Cosine schedule (already decays to a small value at T)
        const s = 0.008;
        const f0 = Math.cos((s / (1 + s)) * (Math.PI / 2)) ** 2;
        const alphaBar: number[] = [1];
        for (let t = 1; t <= T; t++) {
            const tNorm = t / T;
            const f = Math.cos(((tNorm + s) / (1 + s)) * (Math.PI / 2)) ** 2;
            alphaBar.push(f / f0);
        }
        alpha[0] = 1;
        beta[0] = 0;
        for (let t = 1; t <= T; t++) {
            alpha.push(alphaBar[t] / alphaBar[t - 1]);
            beta.push(1 - alpha[t]);
        }
        return { alphaBar, alpha, beta };
    }
}

// ---------------------------------------------------------------------------
// Forward process
// ---------------------------------------------------------------------------
function forward(
    x0: number[],
    t: number,
    epsilon: number[],
    alphaBar: number[]
): number[] {
    const ab = alphaBar[t];
    const sqrtAb = Math.sqrt(ab);
    const sqrt1mAb = Math.sqrt(1 - ab);
    return x0.map((v, i) => sqrtAb * v + sqrt1mAb * epsilon[i]);
}

// ---------------------------------------------------------------------------
// MLP: input (x_t + t_embed) -> predicted noise (1024)
// ---------------------------------------------------------------------------
function embedTimestep(t: number, T: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < EMBED_DIM; i++) {
        out.push(Math.sin((2 * Math.PI * (i + 1) * t) / T));
    }
    return out;
}

interface MLPWeights {
    W1: number[][];
    b1: number[];
    W2: number[][];
    b2: number[];
}

function initMLP(seed: number): MLPWeights {
    const rand = createSeededRandom(seed);
    const scale1 = 0.05;
    const W1: number[][] = [];
    for (let i = 0; i < INPUT_DIM; i++) {
        W1.push([]);
        for (let j = 0; j < HIDDEN_DIM; j++) W1[i].push((rand() - 0.5) * 2 * scale1);
    }
    const b1: number[] = [];
    for (let j = 0; j < HIDDEN_DIM; j++) b1.push(0);
    const scale2 = 0.05;
    const W2: number[][] = [];
    for (let i = 0; i < HIDDEN_DIM; i++) {
        W2.push([]);
        for (let j = 0; j < IMG_PIXELS; j++) W2[i].push((rand() - 0.5) * 2 * scale2);
    }
    const b2: number[] = [];
    for (let j = 0; j < IMG_PIXELS; j++) b2.push(0);
    return { W1, b1, W2, b2 };
}

function mlpForward(weights: MLPWeights, x_t: number[], t: number, T: number): number[] {
    const emb = embedTimestep(t, T);
    const input = [...x_t, ...emb];
    const h1: number[] = [];
    for (let j = 0; j < HIDDEN_DIM; j++) {
        let v = weights.b1[j];
        for (let i = 0; i < INPUT_DIM; i++) v += input[i] * weights.W1[i][j];
        h1.push(Math.max(0, v));
    }
    const out: number[] = [];
    for (let j = 0; j < IMG_PIXELS; j++) {
        let v = weights.b2[j];
        for (let i = 0; i < HIDDEN_DIM; i++) v += h1[i] * weights.W2[i][j];
        out.push(v);
    }
    return out;
}

function trainStepCorrect(
    x0: number[],
    T: number,
    schedule: ScheduleType,
    weights: MLPWeights,
    lr: number,
    rand: () => number
): number {
    const t = Math.floor(1 + rand() * (T - 1));
    const { alphaBar } = getNoiseSchedule(T, schedule);
    const epsilon: number[] = [];
    for (let i = 0; i < IMG_PIXELS; i++) epsilon.push(randn(rand));
    const x_t = forward(x0, t, epsilon, alphaBar);
    const emb = embedTimestep(t, T);
    const input = [...x_t, ...emb];

    const h1: number[] = [];
    for (let j = 0; j < HIDDEN_DIM; j++) {
        let v = weights.b1[j];
        for (let i = 0; i < INPUT_DIM; i++) v += input[i] * weights.W1[i][j];
        h1.push(Math.max(0, v));
    }
    const pred: number[] = [];
    for (let j = 0; j < IMG_PIXELS; j++) {
        let v = weights.b2[j];
        for (let i = 0; i < HIDDEN_DIM; i++) v += h1[i] * weights.W2[i][j];
        pred.push(v);
    }

    let loss = 0;
    const dOut: number[] = [];
    for (let i = 0; i < IMG_PIXELS; i++) {
        const d = (2 / IMG_PIXELS) * (pred[i] - epsilon[i]);
        dOut.push(d);
        loss += (pred[i] - epsilon[i]) ** 2;
    }
    loss /= IMG_PIXELS;

    const dH1: number[] = [];
    for (let i = 0; i < HIDDEN_DIM; i++) {
        let g = 0;
        for (let j = 0; j < IMG_PIXELS; j++) g += dOut[j] * weights.W2[i][j];
        dH1.push(h1[i] > 0 ? g : 0);
    }

    for (let i = 0; i < HIDDEN_DIM; i++)
        for (let j = 0; j < IMG_PIXELS; j++)
            weights.W2[i][j] -= lr * dOut[j] * h1[i];
    for (let j = 0; j < IMG_PIXELS; j++) weights.b2[j] -= lr * dOut[j];
    for (let i = 0; i < INPUT_DIM; i++)
        for (let j = 0; j < HIDDEN_DIM; j++)
            weights.W1[i][j] -= lr * dH1[j] * input[i];
    for (let j = 0; j < HIDDEN_DIM; j++) weights.b1[j] -= lr * dH1[j];

    return loss;
}

// ---------------------------------------------------------------------------
// Reverse step
// ---------------------------------------------------------------------------
function reverseStep(
    x_t: number[],
    t: number,
    predNoise: number[],
    schedule: ScheduleType,
    T: number,
    rand: () => number
): number[] {
    const { alphaBar, alpha, beta } = getNoiseSchedule(T, schedule);
    const ab = alphaBar[t];
    const abPrev = t > 1 ? alphaBar[t - 1] : 1;
    const at = alpha[t];
    const bt = beta[t];
    const sigma2 = (1 - abPrev) / (1 - ab) * bt;
    const sigma = Math.sqrt(Math.max(sigma2, 0));
    const mean: number[] = [];
    for (let i = 0; i < IMG_PIXELS; i++) {
        mean.push((1 / Math.sqrt(at)) * (x_t[i] - (bt / Math.sqrt(1 - ab)) * predNoise[i]));
    }
    if (t <= 1) return mean;
    return mean.map(m => m + sigma * randn(rand));
}

// ---------------------------------------------------------------------------
// Sample from model
// ---------------------------------------------------------------------------
function sample(
    weights: MLPWeights,
    T: number,
    numSteps: number,
    schedule: ScheduleType,
    seed: number
): number[][] {
    const rand = createSeededRandom(seed);
    let x: number[] = [];
    for (let i = 0; i < IMG_PIXELS; i++) x.push(randn(rand));
    const steps: number[] = [];
    if (numSteps <= 1) {
        steps.push(T);
    } else {
        const stepSize = (T - 1) / (numSteps - 1);
        for (let s = 0; s < numSteps; s++) {
            const t = Math.max(1, Math.round(T - s * stepSize));
            steps.push(t);
        }
    }
    const trajectory: number[][] = [x.slice()];
    for (let i = 0; i < steps.length; i++) {
        const t = steps[i];
        const pred = mlpForward(weights, x, t, T);
        x = reverseStep(x, t, pred, schedule, T, rand);
        trajectory.push(x.slice());
    }
    return trajectory;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const DiffusionModel: React.FC = () => {
    const forwardCanvas0Ref = useRef<HTMLCanvasElement>(null);
    const forwardCanvas1Ref = useRef<HTMLCanvasElement>(null);
    const lossSvgRef = useRef<SVGSVGElement>(null);
    const inferCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<'forward' | 'training' | 'inference'>('forward');
    const [preset, setPreset] = useState('circle');
    const [forwardT, setForwardT] = useState(0);
    const [T, setT] = useState(50);
    const [schedule, setSchedule] = useState<ScheduleType>('linear');
    const [learningRate, setLearningRate] = useState(0.02);
    const [epochs, setEpochs] = useState(500);
    const [isTraining, setIsTraining] = useState(false);
    const [lossHistory, setLossHistory] = useState<number[]>([]);
    const [weights, setWeights] = useState<MLPWeights | null>(null);
    const [useDefaultModel, setUseDefaultModel] = useState(true);
    const [inferSteps, setInferSteps] = useState(50);
    const [inferSeed, setInferSeed] = useState(42);
    const [generatedImage, setGeneratedImage] = useState<number[] | null>(null);
    const [isSampling, setIsSampling] = useState(false);
    const [inferTrajectory, setInferTrajectory] = useState<number[][]>([]);

    const scheduleParams = getNoiseSchedule(T, schedule);
    const x0 = PRESETS.find(p => p.id === preset)?.fn() ?? imageCircle();
    const forwardEpsilon = useRef<number[]>([]);
    if (forwardEpsilon.current.length !== IMG_PIXELS) {
        const r = createSeededRandom(12345);
        forwardEpsilon.current = [];
        for (let i = 0; i < IMG_PIXELS; i++) forwardEpsilon.current.push(randn(r));
    }
    const x_t_forward = forward(x0, forwardT, forwardEpsilon.current, scheduleParams.alphaBar);

    // Draw forward process (two image grids)
    useEffect(() => {
        if (activeTab !== 'forward') return;
        drawImageGrid(forwardCanvas0Ref.current, x0);
        drawImageGrid(forwardCanvas1Ref.current, x_t_forward);
    }, [activeTab, preset, forwardT, x0, x_t_forward]);

    // Draw loss curve
    useEffect(() => {
        if (!lossSvgRef.current || activeTab !== 'training') return;
        const svg = d3.select(lossSvgRef.current);
        svg.selectAll('*').remove();
        const w = 560;
        const h = 280;
        const margin = { top: 20, right: 20, bottom: 36, left: 44 };
        const g = svg.attr('width', w).attr('height', h).append('g').attr('transform', `translate(${margin.left},${margin.top})`);
        const innerW = w - margin.left - margin.right;
        const innerH = h - margin.top - margin.bottom;
        if (lossHistory.length === 0) {
            g.append('text').attr('x', innerW / 2).attr('y', innerH / 2).attr('text-anchor', 'middle').attr('fill', 'var(--secondary-500)').text('Click Train to see loss');
            return;
        }
        const validLosses = lossHistory.filter(l => Number.isFinite(l) && l > 0);
        const yMin = validLosses.length ? Math.min(...validLosses) : 0;
        const yMax = validLosses.length ? Math.max(...validLosses) : 0.1;
        const yDomainMin = Math.max(0, yMin - (yMax - yMin) * 0.05);
        const yDomainMax = Math.max(yMax * 1.05, yDomainMin + 0.01);
        const xScale = d3.scaleLinear().domain([0, lossHistory.length - 1]).range([0, innerW]);
        const yScale = d3.scaleLinear().domain([yDomainMin, yDomainMax]).range([innerH, 0]);
        const line = d3.line<number>().x((_, i) => xScale(i)).y(d => yScale(Number.isFinite(d) ? d : 0)).curve(d3.curveMonotoneX);
        g.append('path').datum(lossHistory).attr('fill', 'none').attr('stroke', 'var(--primary-600)').attr('stroke-width', 2).attr('d', line);
        g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(xScale).ticks(6));
        g.append('g').call(d3.axisLeft(yScale).ticks(5));
    }, [activeTab, lossHistory]);

    // Draw inference image (normalize so structure is visible even if values are not in [0,1])
    useEffect(() => {
        if (activeTab !== 'inference') return;
        const img = inferTrajectory.length > 0 ? inferTrajectory[inferTrajectory.length - 1] : generatedImage;
        if (img && img.length === IMG_PIXELS) drawImageGrid(inferCanvasRef.current, img, PIXEL_SCALE, true);
    }, [activeTab, generatedImage, inferTrajectory]);

    const handleTrain = useCallback(() => {
        setIsTraining(true);
        setLossHistory([]);
        const w = weights ?? initMLP(0);
        setWeights(w);
        const rand = createSeededRandom(Date.now() % 100000);
        const presetImages = getAllPresetImages();
        let iter = 0;
        const maxIter = Math.max(500, epochs * 18);
        const runChunk = () => {
            const chunkLosses: number[] = [];
            const chunk = 15;
            for (let i = 0; i < chunk && iter < maxIter; i++) {
                const x0 = presetImages[Math.floor(rand() * presetImages.length)];
                const loss = trainStepCorrect(x0, T, schedule, w, learningRate, rand);
                iter++;
                chunkLosses.push(loss);
            }
            setLossHistory(prev => [...prev, ...chunkLosses].slice(-2500));
            if (iter < maxIter) setTimeout(runChunk, 0);
            else {
                setIsTraining(false);
                setWeights({ ...w });
                setUseDefaultModel(false);
            }
        };
        runChunk();
    }, [T, schedule, learningRate, epochs, weights]);

    const handleSample = useCallback(() => {
        const useTrained = !useDefaultModel;
        const w = useTrained ? weights : null;
        setIsSampling(true);
        setGeneratedImage(null);
        setInferTrajectory([]);
        const modelToUse = w ?? null;
        const runSchedule = schedule;
        const runT = T;
        const runSteps = inferSteps;
        const runSeed = inferSeed;
        const getDefaultModel = (): MLPWeights => {
            const defaultW = initMLP(0);
            const presetImages = getAllPresetImages();
            const rand = createSeededRandom(1000);
            const defaultModelSteps = 2500;
            for (let i = 0; i < defaultModelSteps; i++) {
                const x0 = presetImages[Math.floor(rand() * presetImages.length)];
                trainStepCorrect(x0, runT, runSchedule, defaultW, 0.02, rand);
            }
            return defaultW;
        };
        const doSample = () => {
            const model = modelToUse ?? getDefaultModel();
            const traj = sample(model, runT, runSteps, runSchedule, runSeed);
            setInferTrajectory(traj);
            setGeneratedImage(traj[traj.length - 1]);
            setIsSampling(false);
        };
        setTimeout(doSample, 0);
    }, [useDefaultModel, weights, T, schedule, inferSteps, inferSeed]);

    return (
        <div className="diffusion-model">
            <header className="page-header">
                <h1 className="page-title">Diffusion Model Tutorial</h1>
                <p className="page-description">
                    Learn how diffusion models work: add noise (forward), learn to reverse it (training), then generate images by denoising (inference). Explore each step with the interactive demo below.
                </p>
            </header>

            <section className="explanation-section">
                <div className="explanation-content">
                    <h3>What is a diffusion model?</h3>
                    <p>
                        A diffusion model learns to generate data by first learning how to destroy it. We gradually add noise to real data (here, images) until it becomes pure random noise (the forward process), then train a network to reverse that process. At inference time we start from random noise and iteratively denoise to produce new samples.
                    </p>
                    <h4>The forward process (adding noise)</h4>
                    <p>
                        We take an image x_0 and add Gaussian noise over T timesteps. At step t, the noisy version is x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * epsilon, where epsilon is standard Gaussian noise. As t increases, alpha_bar_t decreases, so the image fades and noise dominates. This process has no trainable parameters.
                    </p>
                    <h4>The reverse process (denoising)</h4>
                    <p>
                        Going from noise back to data would require knowing the conditional distribution of the previous step given the current noisy state, which we do not have in closed form. Instead we train a model (e.g. a small neural network) to approximate this, typically by predicting the noise that was added.
                    </p>
                    <h4>Training</h4>
                    <p>
                        We take real images x_0, pick a random timestep t, add noise to get x_t, and train the network to predict the noise (or equivalently x_0). The loss is mean squared error between the predicted and true noise. Predicting the noise is equivalent to modeling the reverse process because from x_t and the predicted noise we can estimate x_0 and then take a reverse step.
                    </p>
                    <h4>Inference (sampling)</h4>
                    <p>
                        We start from random noise x_T and for timestep t from T down to 1 use the model to predict the noise, then compute the previous step using the noise schedule (e.g. DDPM). More steps usually give higher-quality samples but take longer.
                    </p>
                    <h4>Summary</h4>
                    <ul>
                        <li>Forward: add noise to data over T steps until it becomes noise.</li>
                        <li>Training: learn to predict the added noise at any timestep.</li>
                        <li>Inference: start from noise and iteratively denoise using the learned model.</li>
                    </ul>
                </div>
            </section>

            <div className="demo-tabs">
                <button type="button" className={`demo-tab ${activeTab === 'forward' ? 'active' : ''}`} onClick={() => setActiveTab('forward')}>Forward process</button>
                <button type="button" className={`demo-tab ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>Training</button>
                <button type="button" className={`demo-tab ${activeTab === 'inference' ? 'active' : ''}`} onClick={() => setActiveTab('inference')}>Inference</button>
            </div>

            <div className="simulation-layout" ref={containerRef}>
                <div className="visualization-panel">
                    <div className="visualization-header">
                        <h2 className="visualization-title">
                            {activeTab === 'forward' && 'Forward: image to noise'}
                            {activeTab === 'training' && 'Training loss'}
                            {activeTab === 'inference' && 'Generated image'}
                        </h2>
                        {activeTab === 'forward' && (
                            <div className="visualization-controls">
                                <label className="control-label">
                                    <span>Image:</span>
                                    <select className="input" value={preset} onChange={e => setPreset(e.target.value)}>
                                        {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </label>
                                <label className="control-label">
                                    <span>Timestep t:</span>
                                    <input type="range" className="slider" min={0} max={T} value={forwardT} onChange={e => setForwardT(Number(e.target.value))} />
                                    <span className="value-display">{forwardT}</span>
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="visualization-container">
                        {activeTab === 'forward' && (
                            <div className="image-grid-row">
                                <div className="image-grid-cell">
                                    <span className="image-label">Original (x_0)</span>
                                    <canvas ref={forwardCanvas0Ref} className="diffusion-canvas" width={IMG_SIZE * PIXEL_SCALE} height={IMG_SIZE * PIXEL_SCALE} />
                                </div>
                                <div className="image-grid-cell">
                                    <span className="image-label">Noisy (x_t)</span>
                                    <canvas ref={forwardCanvas1Ref} className="diffusion-canvas" width={IMG_SIZE * PIXEL_SCALE} height={IMG_SIZE * PIXEL_SCALE} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'training' && <svg ref={lossSvgRef} className="simulation-svg" />}
                        {activeTab === 'inference' && (
                            <div className="image-grid-row">
                                <div className="image-grid-cell">
                                    <canvas ref={inferCanvasRef} className="diffusion-canvas" width={IMG_SIZE * PIXEL_SCALE} height={IMG_SIZE * PIXEL_SCALE} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="controls-panel">
                    {activeTab === 'forward' && (
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Forward process</h3></div>
                            <div className="card-body">
                                <p className="explanation-content">Move the timestep slider to see the image (left) become noisier (right) as t increases. At t = T the image is essentially pure noise.</p>
                            </div>
                        </div>
                    )}
                    {activeTab === 'training' && (
                        <>
                            <div className="card">
                                <div className="card-header"><h3 className="card-title">Training parameters</h3></div>
                                <div className="card-body">
                                    <div className="parameter-controls">
                                        <div className="input-group">
                                            <label className="label">Steps T</label>
                                            <input type="number" className="input" min={20} max={200} value={T} onChange={e => setT(Number(e.target.value))} />
                                        </div>
                                        <div className="input-group">
                                            <label className="label">Noise schedule</label>
                                            <select className="input" value={schedule} onChange={e => setSchedule(e.target.value as ScheduleType)}>
                                                <option value="linear">Linear</option>
                                                <option value="cosine">Cosine</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="label">Learning rate</label>
                                            <input type="number" className="input" step={0.005} min={0.001} max={0.1} value={learningRate} onChange={e => setLearningRate(Number(e.target.value))} />
                                        </div>
                                        <div className="input-group">
                                            <label className="label">Epochs</label>
                                            <input type="number" className="input" min={50} max={500} value={epochs} onChange={e => setEpochs(Number(e.target.value))} />
                                        </div>
                                        <button type="button" className="btn btn-primary" onClick={handleTrain} disabled={isTraining}>
                                            {isTraining ? 'Training...' : 'Train model'}
                                        </button>
                                        {isTraining && <p className="status-message">Training in browser (1-2 min); loss updates above.</p>}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === 'inference' && (
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Inference</h3></div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Sampling steps</label>
                                        <input type="number" className="input" min={5} max={T} value={inferSteps} onChange={e => setInferSteps(Number(e.target.value))} />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Seed</label>
                                        <input type="number" className="input" value={inferSeed} onChange={e => setInferSeed(Number(e.target.value))} />
                                    </div>
                                    <label className="control-label">
                                        <input type="checkbox" checked={useDefaultModel} onChange={e => setUseDefaultModel(e.target.checked)} />
                                        <span>Use default model (first run may take up to a minute)</span>
                                    </label>
                                    {!useDefaultModel && <p className="status-message">Using your trained model. Train first in the Training tab if you see a black image.</p>}
                                    <button type="button" className="btn btn-primary" onClick={handleSample} disabled={isSampling}>
                                        {isSampling ? 'Sampling...' : 'Generate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <section className="copyright-section">
                <div className="copyright-notice">
                    <p>Built for SVA Continuing Education. Diffusion Model Tutorial.</p>
                </div>
            </section>
        </div>
    );
};

export default DiffusionModel;
