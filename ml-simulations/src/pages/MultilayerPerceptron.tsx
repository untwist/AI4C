import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import './MultilayerPerceptron.css';

// ============================================================================
// MULTI-LAYER PERCEPTRON EXPLORER
// ============================================================================
// 2-layer MLP: input (2) -> hidden (configurable) -> output (1)
// Forward/backward propagation, decision boundary, network diagram
// ============================================================================

interface DataPoint {
    id: string;
    x: number;
    y: number;
    label: number;
    color: string;
}

interface Dataset {
    name: string;
    description: string;
    data: DataPoint[];
    color0: string;
    color1: string;
}

interface MLPWeights {
    W_h: number[][];   // hiddenSize x 2
    b_h: number[];     // hiddenSize
    W_o: number[];     // hiddenSize
    b_o: number;
}

interface ActivationTrace {
    input: number[];
    hidden: number[];
    output: number;
    prediction: number;
}

interface LastGradients {
    dW_o: number[];
    db_o: number;
    dW_h: number[][];
    db_h: number[];
}

const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

function createMLPWeights(hiddenSize: number): MLPWeights {
    const scale = 0.5;
    const W_h: number[][] = [];
    for (let i = 0; i < hiddenSize; i++) {
        W_h.push([(Math.random() - 0.5) * 2 * scale, (Math.random() - 0.5) * 2 * scale]);
    }
    const b_h = Array.from({ length: hiddenSize }, () => (Math.random() - 0.5) * 2 * scale);
    const W_o = Array.from({ length: hiddenSize }, () => (Math.random() - 0.5) * 2 * scale);
    const b_o = (Math.random() - 0.5) * 2 * scale;
    return { W_h, b_h, W_o, b_o };
}

function forward(weights: MLPWeights, x: number, y: number): ActivationTrace {
    const input = [x, y];
    const hidden: number[] = [];
    for (let i = 0; i < weights.W_h.length; i++) {
        const z = weights.b_h[i] + weights.W_h[i][0] * x + weights.W_h[i][1] * y;
        hidden.push(sigmoid(z));
    }
    let z_o = weights.b_o;
    for (let i = 0; i < weights.W_o.length; i++) z_o += weights.W_o[i] * hidden[i];
    const output = sigmoid(z_o);
    const prediction = output >= 0.5 ? 1 : 0;
    return { input, hidden, output, prediction };
}

function trainOneEpoch(
    weights: MLPWeights,
    data: DataPoint[],
    lr: number
): { weights: MLPWeights; loss: number; lastGradients: LastGradients | null } {
    const hiddenSize = weights.W_h.length;
    const dW_h: number[][] = weights.W_h.map(row => row.map(() => 0));
    const db_h = new Array(hiddenSize).fill(0);
    const dW_o = new Array(hiddenSize).fill(0);
    let db_o = 0;
    let totalLoss = 0;

    data.forEach(point => {
        const { hidden, output } = forward(weights, point.x, point.y);
        const y = point.label;
        const p = output;
        totalLoss += -(y * Math.log(p + 1e-8) + (1 - y) * Math.log(1 - p + 1e-8));

        const d_out = p - y;
        for (let i = 0; i < hiddenSize; i++) {
            dW_o[i] += d_out * hidden[i];
        }
        db_o += d_out;

        const d_hidden: number[] = [];
        for (let i = 0; i < hiddenSize; i++) {
            const ds = d_out * weights.W_o[i] * hidden[i] * (1 - hidden[i]);
            d_hidden.push(ds);
            db_h[i] += ds;
            dW_h[i][0] += ds * point.x;
            dW_h[i][1] += ds * point.y;
        }
    });

    const n = data.length;
    const newWeights: MLPWeights = {
        W_h: weights.W_h.map((row, i) => [
            row[0] - lr * dW_h[i][0] / n,
            row[1] - lr * dW_h[i][1] / n
        ]),
        b_h: weights.b_h.map((b, i) => b - lr * db_h[i] / n),
        W_o: weights.W_o.map((w, i) => w - lr * dW_o[i] / n),
        b_o: weights.b_o - lr * db_o / n
    };

    const lastGradients: LastGradients = {
        dW_o: dW_o.map(v => v / n),
        db_o: db_o / n,
        dW_h: dW_h.map(row => row.map(v => v / n)),
        db_h: db_h.map(v => v / n)
    };

    return { weights: newWeights, loss: totalLoss / n, lastGradients };
}

function accuracy(weights: MLPWeights, data: DataPoint[]): number {
    let correct = 0;
    data.forEach(point => {
        const { prediction } = forward(weights, point.x, point.y);
        if (prediction === point.label) correct++;
    });
    return data.length === 0 ? 0 : correct / data.length;
}

const DATASETS: Record<string, Dataset> = {
    'and-gate': {
        name: 'AND Gate',
        description: 'Classic AND logic gate - linearly separable',
        data: [
            { id: '1', x: 0, y: 0, label: 0, color: '#ef4444' },
            { id: '2', x: 0, y: 1, label: 0, color: '#ef4444' },
            { id: '3', x: 1, y: 0, label: 0, color: '#ef4444' },
            { id: '4', x: 1, y: 1, label: 1, color: '#22c55e' }
        ],
        color0: '#ef4444',
        color1: '#22c55e'
    },
    'or-gate': {
        name: 'OR Gate',
        description: 'Classic OR logic gate - linearly separable',
        data: [
            { id: '1', x: 0, y: 0, label: 0, color: '#ef4444' },
            { id: '2', x: 0, y: 1, label: 1, color: '#22c55e' },
            { id: '3', x: 1, y: 0, label: 1, color: '#22c55e' },
            { id: '4', x: 1, y: 1, label: 1, color: '#22c55e' }
        ],
        color0: '#ef4444',
        color1: '#22c55e'
    },
    'xor-gate': {
        name: 'XOR Gate',
        description: 'XOR logic gate - not linearly separable; needs hidden layer',
        data: [
            { id: '1', x: 0, y: 0, label: 0, color: '#ef4444' },
            { id: '2', x: 0, y: 1, label: 1, color: '#22c55e' },
            { id: '3', x: 1, y: 0, label: 1, color: '#22c55e' },
            { id: '4', x: 1, y: 1, label: 0, color: '#ef4444' }
        ],
        color0: '#ef4444',
        color1: '#22c55e'
    }
};

const GRID_RES = 50;
const X_MIN = -0.5;
const X_MAX = 1.5;
const Y_MIN = -0.5;
const Y_MAX = 1.5;

const MultilayerPerceptron: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const networkSvgRef = useRef<SVGSVGElement>(null);

    const [selectedDataset, setSelectedDataset] = useState<string>('xor-gate');
    const [dataPoints, setDataPoints] = useState<DataPoint[]>(DATASETS['xor-gate'].data);
    const [hiddenSize, setHiddenSize] = useState(4);
    const [learningRate, setLearningRate] = useState(0.5);
    const [epochs, setEpochs] = useState(500);
    const [weights, setWeights] = useState<MLPWeights>(() => createMLPWeights(4));
    const [isTraining, setIsTraining] = useState(false);
    const [trainEpochsDone, setTrainEpochsDone] = useState(0);
    const [lastLoss, setLastLoss] = useState<number | null>(null);
    const [lastGradients, setLastGradients] = useState<LastGradients | null>(null);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [showDecisionBoundary, setShowDecisionBoundary] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [showGradients, setShowGradients] = useState(false);

    const currentDataset = DATASETS[selectedDataset] ?? DATASETS['xor-gate'];

    useEffect(() => {
        setDataPoints(currentDataset.data);
        setSelectedPointIndex(null);
    }, [selectedDataset]);

    const reinitWeights = useCallback(() => {
        setWeights(createMLPWeights(hiddenSize));
        setTrainEpochsDone(0);
        setLastLoss(null);
        setLastGradients(null);
    }, [hiddenSize]);

    useEffect(() => {
        reinitWeights();
    }, [hiddenSize]);

    const train = useCallback(() => {
        if (dataPoints.length === 0) return;
        setIsTraining(true);
        setLastGradients(null);
        let w = { ...weights, W_h: weights.W_h.map(r => [...r]), b_h: [...weights.b_h], W_o: [...weights.W_o] };
        let step = 0;
        let lastG: LastGradients | null = null;
        let loss = 0;

        const run = () => {
            for (let i = 0; i < 50 && step < epochs; i++) {
                const result = trainOneEpoch(w, dataPoints, learningRate);
                w = result.weights;
                loss = result.loss;
                lastG = result.lastGradients;
                step++;
            }
            setWeights(w);
            setTrainEpochsDone(step);
            setLastLoss(loss);
            setLastGradients(lastG);
            if (step < epochs) {
                setTimeout(run, 0);
            } else {
                setIsTraining(false);
            }
        };
        run();
    }, [dataPoints, learningRate, epochs, weights]);

    const selectedTrace: ActivationTrace | null =
        selectedPointIndex != null && dataPoints[selectedPointIndex]
            ? forward(weights, dataPoints[selectedPointIndex].x, dataPoints[selectedPointIndex].y)
            : null;

    const gridPredictions = useCallback((w: MLPWeights) => {
        const cells: { x: number; y: number; pred: number }[] = [];
        for (let i = 0; i <= GRID_RES; i++) {
            for (let j = 0; j <= GRID_RES; j++) {
                const x = X_MIN + (X_MAX - X_MIN) * (i / GRID_RES);
                const y = Y_MIN + (Y_MAX - Y_MIN) * (j / GRID_RES);
                const { prediction } = forward(w, x, y);
                cells.push({ x, y, pred: prediction });
            }
        }
        return cells;
    }, []);

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const xScale = d3.scaleLinear().domain([X_MIN, X_MAX]).range([0, innerWidth]);
        const yScale = d3.scaleLinear().domain([Y_MIN, Y_MAX]).range([innerHeight, 0]);

        const g = svg
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        if (showGrid) {
            g.append('g')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(() => ''))
                .attr('class', 'grid')
                .style('stroke', 'var(--secondary-200)');
            g.append('g')
                .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''))
                .attr('class', 'grid')
                .style('stroke', 'var(--secondary-200)');
        }

        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .style('color', 'var(--secondary-600)');
        g.append('g')
            .call(d3.axisLeft(yScale))
            .style('color', 'var(--secondary-600)');

        if (showDecisionBoundary) {
            const cells = gridPredictions(weights);
            const cellWidth = innerWidth / GRID_RES;
            const cellHeight = innerHeight / GRID_RES;
            g.selectAll('.boundary-cell')
                .data(cells)
                .enter()
                .append('rect')
                .attr('class', 'boundary-cell')
                .attr('x', d => xScale(d.x))
                .attr('y', d => yScale(d.y + (Y_MAX - Y_MIN) / GRID_RES))
                .attr('width', cellWidth + 1)
                .attr('height', cellHeight + 1)
                .attr('fill', d => (d.pred === 1 ? currentDataset.color1 : currentDataset.color0))
                .attr('opacity', 0.25);
        }

        g.selectAll('.data-point')
            .data(dataPoints)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 8)
            .style('fill', d => d.color)
            .style('stroke', 'var(--secondary-800)')
            .style('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('click', (_, d) => {
                const idx = dataPoints.findIndex(p => p.id === d.id);
                setSelectedPointIndex(idx >= 0 ? idx : null);
            });

        g.selectAll('.data-label')
            .data(dataPoints)
            .enter()
            .append('text')
            .attr('class', 'data-label')
            .attr('x', d => xScale(d.x) + 12)
            .attr('y', d => yScale(d.y) - 12)
            .text(d => d.label.toString())
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', 'var(--secondary-800)');
    }, [weights, dataPoints, showDecisionBoundary, showGrid, currentDataset.color0, currentDataset.color1, gridPredictions]);

    useEffect(() => {
        if (!networkSvgRef.current) return;
        const svg = d3.select(networkSvgRef.current);
        svg.selectAll('*').remove();

        const width = 400;
        const height = 220;
        const inputY = height / 2;
        const hiddenYs = (n: number) => {
            const arr: number[] = [];
            for (let i = 0; i < n; i++) arr.push((height / (n + 1)) * (i + 1));
            return arr;
        };
        const nH = weights.W_h.length;
        const xInput = 60;
        const xHidden = 180;
        const xOutput = 340;
        const inputXs = [xInput, xInput];
        const inputYs = [inputY - 30, inputY + 30];
        const hYs = hiddenYs(nH);
        const outY = height / 2;

        const g = svg.attr('width', width).attr('height', height).append('g');

        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < nH; j++) {
                const stroke = weights.W_h[j][i] >= 0 ? 'var(--success-500)' : 'var(--error-500)';
                g.append('line')
                    .attr('x1', inputXs[i] + 20)
                    .attr('y1', inputYs[i])
                    .attr('x2', xHidden - 20)
                    .attr('y2', hYs[j])
                    .style('stroke', stroke)
                    .style('stroke-width', 2)
                    .style('opacity', 0.8);
            }
        }
        for (let j = 0; j < nH; j++) {
            const stroke = weights.W_o[j] >= 0 ? 'var(--success-500)' : 'var(--error-500)';
            g.append('line')
                .attr('x1', xHidden + 20)
                .attr('y1', hYs[j])
                .attr('x2', xOutput - 20)
                .attr('y2', outY)
                .style('stroke', stroke)
                .style('stroke-width', 2)
                .style('opacity', 0.8);
        }

        [[xInput, inputY - 30, 'x'], [xInput, inputY + 30, 'y']].forEach(([x, y, label]) => {
            g.append('circle').attr('cx', x).attr('cy', y).attr('r', 18).style('fill', 'var(--primary-500)').style('stroke', 'var(--secondary-700)').style('stroke-width', 2);
            g.append('text').attr('x', x).attr('y', y).attr('text-anchor', 'middle').attr('dy', '0.35em').text(String(label)).style('fill', 'white').style('font-weight', 'bold').style('font-size', '14px');
        });
        hYs.forEach((y, i) => {
            g.append('circle').attr('cx', xHidden).attr('cy', y).attr('r', 16).style('fill', 'var(--accent-500)').style('stroke', 'var(--secondary-700)').style('stroke-width', 2);
            g.append('text').attr('x', xHidden).attr('y', y).attr('text-anchor', 'middle').attr('dy', '0.35em').text(`h${i + 1}`).style('fill', 'white').style('font-size', '12px');
        });
        g.append('circle').attr('cx', xOutput).attr('cy', outY).attr('r', 18).style('fill', 'var(--secondary-700)').style('stroke', 'var(--secondary-800)').style('stroke-width', 2);
        g.append('text').attr('x', xOutput).attr('y', outY).attr('text-anchor', 'middle').attr('dy', '0.35em').text('out').style('fill', 'white').style('font-size', '12px');

        g.append('text').attr('x', xInput).attr('y', 20).text('Input').style('font-size', '11px').style('font-weight', 'bold').style('fill', 'var(--secondary-700)');
        g.append('text').attr('x', xHidden).attr('y', 20).text('Hidden').style('font-size', '11px').style('font-weight', 'bold').style('fill', 'var(--secondary-700)');
        g.append('text').attr('x', xOutput).attr('y', 20).text('Output').style('font-size', '11px').style('font-weight', 'bold').style('fill', 'var(--secondary-700)');
    }, [weights]);

    const acc = accuracy(weights, dataPoints);

    return (
        <div className="multilayer-perceptron fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Multi-layer Perceptron Explorer</h1>
                    <p className="page-description">
                        Explore how multiple layers create complex, non-linear decision boundaries.
                        Train a 2-layer network on AND, OR, and XOR and see forward and backward propagation in action.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Decision Boundary</h2>
                            <div className="visualization-controls">
                                <label className="control-label">
                                    <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
                                    Show Grid
                                </label>
                                <label className="control-label">
                                    <input type="checkbox" checked={showDecisionBoundary} onChange={e => setShowDecisionBoundary(e.target.checked)} />
                                    Decision Boundary
                                </label>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg" />
                        </div>
                        <p className="visualization-hint">Click a point to see its forward-pass activations below.</p>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Dataset</h3>
                            </div>
                            <div className="card-body">
                                <div className="input-group">
                                    <label className="label">Choose Dataset</label>
                                    <select value={selectedDataset} onChange={e => setSelectedDataset(e.target.value)} className="input">
                                        <option value="and-gate">AND Gate</option>
                                        <option value="or-gate">OR Gate</option>
                                        <option value="xor-gate">XOR Gate</option>
                                    </select>
                                </div>
                                <p className="text-sm text-secondary-600">{currentDataset.description}</p>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Network & Training</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Hidden neurons</label>
                                        <input
                                            type="range"
                                            min="2"
                                            max="6"
                                            step="1"
                                            value={hiddenSize}
                                            onChange={e => setHiddenSize(parseInt(e.target.value, 10))}
                                            className="slider"
                                        />
                                        <span className="value-display">{hiddenSize}</span>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Learning rate</label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.05"
                                            value={learningRate}
                                            onChange={e => setLearningRate(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{learningRate.toFixed(2)}</span>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Epochs</label>
                                        <input
                                            type="range"
                                            min="100"
                                            max="2000"
                                            step="100"
                                            value={epochs}
                                            onChange={e => setEpochs(parseInt(e.target.value, 10))}
                                            className="slider"
                                        />
                                        <span className="value-display">{epochs}</span>
                                    </div>
                                </div>
                                <div className="algorithm-controls">
                                    <button onClick={train} className="btn btn-primary" disabled={isTraining || dataPoints.length === 0}>
                                        {isTraining ? 'Training...' : 'Train'}
                                    </button>
                                    <button onClick={reinitWeights} className="btn btn-secondary" disabled={isTraining}>
                                        Reset Weights
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Results</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    <div className="result-item">
                                        <span className="result-label">Accuracy</span>
                                        <span className="result-value">{(acc * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Epochs run</span>
                                        <span className="result-value">{trainEpochsDone}</span>
                                    </div>
                                    {lastLoss != null && (
                                        <div className="result-item">
                                            <span className="result-label">Last loss (BCE)</span>
                                            <span className="result-value">{lastLoss.toFixed(4)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="network-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Network Diagram</h3>
                        </div>
                        <div className="card-body network-diagram-wrap">
                            <svg ref={networkSvgRef} className="network-svg" />
                        </div>
                        <p className="card-hint">Green edges: positive weight. Red edges: negative weight.</p>
                    </div>
                </div>

                <div className="forward-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Forward Pass (selected point)</h3>
                        </div>
                        <div className="card-body">
                            {selectedTrace && selectedPointIndex != null && dataPoints[selectedPointIndex] ? (
                                <div className="forward-trace">
                                    <p className="forward-point">
                                        Point: ({dataPoints[selectedPointIndex].x}, {dataPoints[selectedPointIndex].y}) → label {dataPoints[selectedPointIndex].label}
                                    </p>
                                    <p className="forward-values">
                                        Input: [{selectedTrace.input.map(v => v.toFixed(2)).join(', ')}] → Hidden: [{selectedTrace.hidden.map(v => v.toFixed(3)).join(', ')}] → Output: {selectedTrace.output.toFixed(3)} → Pred: {selectedTrace.prediction}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-secondary-600">Click a data point in the plot to see its forward-pass activations.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="backward-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Backward Pass (last step gradients)</h3>
                        </div>
                        <div className="card-body">
                            <label className="control-label">
                                <input type="checkbox" checked={showGradients} onChange={e => setShowGradients(e.target.checked)} />
                                Show gradients after training
                            </label>
                            {showGradients && lastGradients && (
                                <div className="gradients-display">
                                    <p className="gradients-intro">How much each weight was updated in the last epoch (gradient direction):</p>
                                    <p className="gradients-output"><strong>Output layer:</strong> dW_o = [{lastGradients.dW_o.map(v => v.toFixed(4)).join(', ')}], db_o = {lastGradients.db_o.toFixed(4)}</p>
                                    <p className="gradients-output"><strong>Hidden layer:</strong> dW_h rows and db_h computed from backprop through sigmoid.</p>
                                </div>
                            )}
                            {showGradients && !lastGradients && !isTraining && (
                                <p className="text-sm text-secondary-600">Train the network once to see last-step gradients.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Why Multiple Layers?</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>From linear to non-linear</h4>
                                <p>
                                    A single-layer perceptron can only learn linear decision boundaries. The XOR problem is not linearly separable:
                                    no single line can separate the two classes. Adding a hidden layer with non-linear activations (sigmoid) allows
                                    the network to learn curved boundaries and solve XOR.
                                </p>
                                <h4>Forward propagation</h4>
                                <p>
                                    Inputs flow through the hidden layer (each neuron computes a weighted sum and applies sigmoid), then the output
                                    layer produces a probability. Click a point to see its activations at each layer.
                                </p>
                                <h4>Backward propagation</h4>
                                <p>
                                    During training, the loss (binary cross-entropy) is minimized by gradient descent. Backpropagation computes
                                    how much each weight contributed to the error and updates weights in the direction that reduces the loss.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultilayerPerceptron;
