import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './PerceptronLearning.css';

// ============================================================================
// PERCEPTRON LEARNING SIMULATOR
// ============================================================================
// Interactive simulation of the perceptron learning algorithm
// Designed for high school and college students learning neural networks
// ============================================================================

// 1. DATA INTERFACES
// ============================================================================
interface DataPoint {
    id: string;
    x: number;
    y: number;
    label: number; // 0 or 1
    color: string;
}

interface PerceptronWeights {
    w0: number; // bias
    w1: number; // weight for x
    w2: number; // weight for y
}

interface PerceptronResult {
    weights: PerceptronWeights;
    accuracy: number;
    iterations: number;
    converged: boolean;
    decisionBoundary: { x: number, y: number }[];
}

interface Dataset {
    name: string;
    description: string;
    data: DataPoint[];
    color0: string;
    color1: string;
    linearlySeparable: boolean;
}

// 2. PERCEPTRON LEARNING SIMULATOR COMPONENT
// ============================================================================
const PerceptronLearning: React.FC = () => {
    // 3. SETUP REFS AND STATE
    // ============================================================================
    const svgRef = useRef<SVGSVGElement>(null);

    // State for simulation data
    const [selectedDataset, setSelectedDataset] = useState<string>('and-gate');
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [parameters, setParameters] = useState({
        learningRate: 0.1,
        maxIterations: 100,
        showStepByStep: false
    });

    // State for visualization controls
    const [showGrid, setShowGrid] = useState(true);
    const [showDecisionBoundary, setShowDecisionBoundary] = useState(true);
    const [showWeights, setShowWeights] = useState(true);
    const [isLearning, setIsLearning] = useState(false);

    // State for step-by-step learning
    const [stepByStepMode, setStepByStepMode] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [learningHistory, setLearningHistory] = useState<PerceptronResult[]>([]);
    const [currentPoint, setCurrentPoint] = useState<DataPoint | null>(null);
    const [currentError, setCurrentError] = useState<number>(0);

    // State for results/metrics
    const [results, setResults] = useState<PerceptronResult>({
        weights: { w0: 0, w1: 0, w2: 0 },
        accuracy: 0,
        iterations: 0,
        converged: false,
        decisionBoundary: []
    });

    // 4. DATASET DEFINITIONS
    // ============================================================================
    const datasets: Record<string, Dataset> = {
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
            color1: '#22c55e',
            linearlySeparable: true
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
            color1: '#22c55e',
            linearlySeparable: true
        },
        'xor-gate': {
            name: 'XOR Gate',
            description: 'XOR logic gate - NOT linearly separable',
            data: [
                { id: '1', x: 0, y: 0, label: 0, color: '#ef4444' },
                { id: '2', x: 0, y: 1, label: 1, color: '#22c55e' },
                { id: '3', x: 1, y: 0, label: 1, color: '#22c55e' },
                { id: '4', x: 1, y: 1, label: 0, color: '#ef4444' }
            ],
            color0: '#ef4444',
            color1: '#22c55e',
            linearlySeparable: false
        },
        'custom': {
            name: 'Custom Dataset',
            description: 'Add your own data points by clicking on the plot',
            data: [],
            color0: '#ef4444',
            color1: '#22c55e',
            linearlySeparable: true
        }
    };

    // 5. PERCEPTRON ALGORITHM FUNCTIONS
    // ============================================================================
    const predict = (point: DataPoint, weights: PerceptronWeights): number => {
        const z = weights.w0 + weights.w1 * point.x + weights.w2 * point.y;
        return z > 0 ? 1 : 0;
    };

    const calculateAccuracy = (weights: PerceptronWeights, data: DataPoint[]): number => {
        let correct = 0;
        data.forEach(point => {
            const prediction = predict(point, weights);
            if (prediction === point.label) correct++;
        });
        return correct / data.length;
    };

    const calculateDecisionBoundary = (weights: PerceptronWeights): { x: number, y: number }[] => {
        if (weights.w2 === 0) return [];

        const boundary = [];
        for (let x = -0.5; x <= 1.5; x += 0.01) {
            const y = -(weights.w0 + weights.w1 * x) / weights.w2;
            if (y >= -0.5 && y <= 1.5) {
                boundary.push({ x, y });
            }
        }
        return boundary;
    };

    const trainPerceptron = (data: DataPoint[], learningRate: number, maxIterations: number): PerceptronResult => {
        let weights: PerceptronWeights = { w0: 0, w1: 0, w2: 0 };
        let converged = false;
        let iterations = 0;

        for (let epoch = 0; epoch < maxIterations; epoch++) {
            let hasError = false;

            data.forEach(point => {
                const prediction = predict(point, weights);
                const error = point.label - prediction;

                if (error !== 0) {
                    hasError = true;
                    weights.w0 += learningRate * error;
                    weights.w1 += learningRate * error * point.x;
                    weights.w2 += learningRate * error * point.y;
                }
            });

            if (!hasError) {
                converged = true;
                iterations = epoch + 1;
                break;
            }
        }

        if (!converged) {
            iterations = maxIterations;
        }

        const accuracy = calculateAccuracy(weights, data);
        const decisionBoundary = calculateDecisionBoundary(weights);

        return {
            weights,
            accuracy,
            iterations,
            converged,
            decisionBoundary
        };
    };

    // 6. SIMULATION FUNCTIONS
    // ============================================================================
    const runSimulation = () => {
        if (dataPoints.length === 0) return;

        if (stepByStepMode) {
            // Initialize step-by-step learning
            setCurrentStep(0);
            setLearningHistory([]);
            setCurrentPoint(null);
            setCurrentError(0);
            setIsLearning(true);
            startStepByStepLearning();
        } else {
            // Regular learning
            setIsLearning(true);
            setTimeout(() => {
                const result = trainPerceptron(dataPoints, parameters.learningRate, parameters.maxIterations);
                setResults(result);
                setIsLearning(false);
            }, 1000);
        }
    };

    const startStepByStepLearning = () => {
        let weights: PerceptronWeights = { w0: 0, w1: 0, w2: 0 };
        let step = 0;
        const history: PerceptronResult[] = [];

        const processStep = () => {
            if (step >= parameters.maxIterations) {
                setIsLearning(false);
                return;
            }

            let hasError = false;
            let processedPoint: DataPoint | null = null;
            let error = 0;

            dataPoints.forEach((point) => {
                const prediction = predict(point, weights);
                const pointError = point.label - prediction;

                if (pointError !== 0) {
                    hasError = true;
                    processedPoint = point;
                    error = pointError;

                    // Update weights
                    weights.w0 += parameters.learningRate * pointError;
                    weights.w1 += parameters.learningRate * pointError * point.x;
                    weights.w2 += parameters.learningRate * pointError * point.y;

                    return; // Process one point per step
                }
            });

            const accuracy = calculateAccuracy(weights, dataPoints);
            const decisionBoundary = calculateDecisionBoundary(weights);
            const converged = !hasError;

            const result: PerceptronResult = {
                weights: { ...weights },
                accuracy,
                iterations: step + 1,
                converged,
                decisionBoundary
            };

            history.push(result);
            setLearningHistory([...history]);
            setResults(result);
            setCurrentPoint(processedPoint);
            setCurrentError(error);
            setCurrentStep(step);

            if (converged || step >= parameters.maxIterations - 1) {
                setIsLearning(false);
            } else {
                step++;
                setTimeout(processStep, 1000); // Wait 1 second between steps
            }
        };

        processStep();
    };

    const nextStep = () => {
        if (currentStep < learningHistory.length - 1) {
            const nextStepIndex = currentStep + 1;
            setCurrentStep(nextStepIndex);
            setResults(learningHistory[nextStepIndex]);
        }
    };

    const previousStep = () => {
        if (currentStep > 0) {
            const prevStepIndex = currentStep - 1;
            setCurrentStep(prevStepIndex);
            setResults(learningHistory[prevStepIndex]);
        }
    };

    const resetSimulation = () => {
        setResults({
            weights: { w0: 0, w1: 0, w2: 0 },
            accuracy: 0,
            iterations: 0,
            converged: false,
            decisionBoundary: []
        });
    };

    const addDataPoint = (event: React.MouseEvent<SVGSVGElement>) => {
        if (selectedDataset !== 'custom') return;

        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const x = (event.clientX - rect.left - 40) / (rect.width - 80) * 2 - 0.5;
        const y = 1.5 - (event.clientY - rect.top - 40) / (rect.height - 80) * 2;

        if (x < -0.5 || x > 1.5 || y < -0.5 || y > 1.5) return;

        const newPoint: DataPoint = {
            id: `custom-${Date.now()}`,
            x: Math.round(x * 10) / 10,
            y: Math.round(y * 10) / 10,
            label: 0, // Default to class 0
            color: '#ef4444'
        };

        setDataPoints(prev => [...prev, newPoint]);
    };

    const toggleDataPointLabel = (pointId: string) => {
        if (selectedDataset !== 'custom') return;

        setDataPoints(prev => prev.map(point =>
            point.id === pointId
                ? {
                    ...point,
                    label: point.label === 0 ? 1 : 0,
                    color: point.label === 0 ? '#22c55e' : '#ef4444'
                }
                : point
        ));
    };

    // 7. D3 VISUALIZATION
    // ============================================================================
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([-0.5, 1.5])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([-0.5, 1.5])
            .range([innerHeight, 0]);

        // Add grid if enabled
        if (showGrid) {
            const xAxisGrid = d3.axisBottom(xScale)
                .tickSize(-innerHeight)
                .tickFormat(() => "");

            const yAxisGrid = d3.axisLeft(yScale)
                .tickSize(-innerWidth)
                .tickFormat(() => "");

            g.append("g")
                .attr("class", "grid")
                .attr("transform", `translate(0,${innerHeight})`)
                .call(xAxisGrid)
                .style("stroke", "#e2e8f0")
                .style("stroke-width", 1);

            g.append("g")
                .attr("class", "grid")
                .call(yAxisGrid)
                .style("stroke", "#e2e8f0")
                .style("stroke-width", 1);
        }

        // Add axes
        const xAxis = d3.axisBottom(xScale)
            .tickValues([0, 0.5, 1]);
        const yAxis = d3.axisLeft(yScale)
            .tickValues([0, 0.5, 1]);

        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .style("color", "#64748b");

        g.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .style("color", "#64748b");

        // Draw decision boundary if enabled
        if (showDecisionBoundary && results.decisionBoundary.length > 0) {
            const line = d3.line<{ x: number, y: number }>()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y));

            g.append("path")
                .datum(results.decisionBoundary)
                .attr("class", "decision-boundary")
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", "#3b82f6")
                .style("stroke-width", 2)
                .style("stroke-dasharray", "5,5");
        }

        // Draw data points
        g.selectAll('.data-point')
            .data(dataPoints)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 8)
            .style('fill', d => d.color)
            .style('stroke', '#374151')
            .style('stroke-width', 2)
            .style('opacity', 0.8)
            .style('cursor', selectedDataset === 'custom' ? 'pointer' : 'default')
            .on('click', (_, d) => {
                if (selectedDataset === 'custom') {
                    toggleDataPointLabel(d.id);
                }
            });

        // Add labels for data points
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
            .style('fill', '#374151');

        // Draw weight vector if enabled
        if (showWeights && results.weights.w1 !== 0 && results.weights.w2 !== 0) {
            const centerX = innerWidth / 2;
            const centerY = innerHeight / 2;
            const scale = 50;

            g.append("line")
                .attr("class", "weight-vector")
                .attr("x1", centerX)
                .attr("y1", centerY)
                .attr("x2", centerX + results.weights.w1 * scale)
                .attr("y2", centerY - results.weights.w2 * scale)
                .style("stroke", "#f59e0b")
                .style("stroke-width", 3)
                .style("marker-end", "url(#arrowhead)");

            // Add arrowhead marker
            svg.append("defs")
                .append("marker")
                .attr("id", "arrowhead")
                .attr("markerWidth", 10)
                .attr("markerHeight", 7)
                .attr("refX", 9)
                .attr("refY", 3.5)
                .attr("orient", "auto")
                .append("polygon")
                .attr("points", "0 0, 10 3.5, 0 7")
                .style("fill", "#f59e0b");
        }
    };

    // 8. EFFECTS FOR VISUALIZATION UPDATES
    // ============================================================================
    useEffect(() => {
        const dataset = datasets[selectedDataset];
        setDataPoints(dataset.data);
        resetSimulation();
    }, [selectedDataset]);

    useEffect(() => {
        drawVisualization();
    }, [dataPoints, results, showGrid, showDecisionBoundary, showWeights]);

    // 9. EVENT HANDLERS
    // ============================================================================
    const handleParameterChange = (key: string, value: any) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    // 10. RENDER THE SIMULATION
    // ============================================================================
    return (
        <div className="perceptron-learning fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">Perceptron Learning Simulator</h1>
                    <p className="page-description">
                        Explore the foundation of neural networks with the perceptron learning algorithm.
                        Watch how a single-layer perceptron learns to classify data points and understand
                        the limitations of linear separability.
                    </p>
                </div>

                {/* STANDARDIZED SIMULATION LAYOUT */}
                <div className="simulation-layout">
                    {/* VISUALIZATION PANEL */}
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Perceptron Learning Visualization</h2>
                            <div className="visualization-controls">
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={showGrid}
                                        onChange={(e) => setShowGrid(e.target.checked)}
                                    />
                                    Show Grid
                                </label>
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={showDecisionBoundary}
                                        onChange={(e) => setShowDecisionBoundary(e.target.checked)}
                                    />
                                    Decision Boundary
                                </label>
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={showWeights}
                                        onChange={(e) => setShowWeights(e.target.checked)}
                                    />
                                    Weight Vector
                                </label>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg
                                ref={svgRef}
                                className="simulation-svg"
                                onClick={addDataPoint}
                                style={{ cursor: selectedDataset === 'custom' ? 'crosshair' : 'default' }}
                            ></svg>
                        </div>
                    </div>

                    {/* CONTROLS PANEL */}
                    <div className="controls-panel">
                        {/* DATASET SELECTION CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Dataset Selection</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Choose Dataset</label>
                                        <select
                                            value={selectedDataset}
                                            onChange={(e) => setSelectedDataset(e.target.value)}
                                            className="input"
                                        >
                                            <option value="and-gate">AND Gate</option>
                                            <option value="or-gate">OR Gate</option>
                                            <option value="xor-gate">XOR Gate</option>
                                            <option value="custom">Custom Dataset</option>
                                        </select>
                                    </div>
                                    <p className="text-sm text-secondary-600">
                                        {datasets[selectedDataset].description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* PARAMETER CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Learning Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Learning Rate</label>
                                        <input
                                            type="range"
                                            min="0.01"
                                            max="1"
                                            step="0.01"
                                            value={parameters.learningRate}
                                            onChange={(e) => handleParameterChange('learningRate', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.learningRate.toFixed(2)}</span>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Max Iterations</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="500"
                                            step="10"
                                            value={parameters.maxIterations}
                                            onChange={(e) => handleParameterChange('maxIterations', parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.maxIterations}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ALGORITHM CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Algorithm Controls</h3>
                            </div>
                            <div className="card-body">
                                <div className="algorithm-controls">
                                    <div className="checkbox-group">
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={stepByStepMode}
                                                onChange={(e) => setStepByStepMode(e.target.checked)}
                                            />
                                            Step-by-Step Learning
                                        </label>
                                    </div>

                                    <button
                                        onClick={runSimulation}
                                        className="btn btn-primary"
                                        disabled={isLearning || dataPoints.length === 0}
                                    >
                                        {isLearning ? 'Processing...' : 'Train Perceptron'}
                                    </button>

                                    {stepByStepMode && learningHistory.length > 0 && (
                                        <div className="step-controls">
                                            <button
                                                onClick={previousStep}
                                                className="btn btn-secondary"
                                                disabled={currentStep === 0 || isLearning}
                                            >
                                                Previous Step
                                            </button>
                                            <span className="step-counter">
                                                Step {currentStep + 1} of {learningHistory.length}
                                                {results.converged && " (Complete)"}
                                            </span>
                                            <button
                                                onClick={nextStep}
                                                className="btn btn-secondary"
                                                disabled={currentStep >= learningHistory.length - 1 || isLearning}
                                            >
                                                {isLearning ? 'Processing...' :
                                                    currentStep >= learningHistory.length - 1 ? 'Complete' :
                                                        'Next Step'}
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={resetSimulation}
                                        className="btn btn-secondary"
                                        disabled={isLearning}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RESULTS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Learning Results</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    <div className="result-item">
                                        <span className="result-label">Accuracy:</span>
                                        <span className="result-value">{(results.accuracy * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Iterations:</span>
                                        <span className="result-value">{results.iterations}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Converged:</span>
                                        <span className="result-value">{results.converged ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Weights:</span>
                                        <span className="result-value">
                                            [{results.weights.w0.toFixed(2)}, {results.weights.w1.toFixed(2)}, {results.weights.w2.toFixed(2)}]
                                        </span>
                                    </div>

                                    {stepByStepMode && currentPoint && (
                                        <>
                                            <div className="result-item">
                                                <span className="result-label">Processing Point:</span>
                                                <span className="result-value">({currentPoint.x}, {currentPoint.y}) → {currentPoint.label}</span>
                                            </div>
                                            <div className="result-item">
                                                <span className="result-label">Error:</span>
                                                <span className="result-value">{currentError}</span>
                                            </div>
                                            <div className="result-item">
                                                <span className="result-label">Prediction:</span>
                                                <span className="result-value">{predict(currentPoint, results.weights)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ENHANCED EXPLANATION SECTION */}
                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding the Perceptron Learning Algorithm</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is a Perceptron?</h4>
                                <p>
                                    A perceptron is the simplest type of artificial neural network - think of it as a single "neuron"
                                    that can learn to make decisions. It was invented in 1957 by Frank Rosenblatt and was one of the first
                                    attempts to create artificial intelligence. The perceptron takes multiple inputs, weighs them, and makes
                                    a binary decision (yes/no, 0/1, true/false).
                                </p>

                                <p>
                                    <strong>Real-world analogy:</strong> Imagine you're deciding whether to go to a movie. You consider
                                    factors like: Is it a good movie? (input 1), Is it cheap? (input 2), Do you have time? (input 3).
                                    Each factor has a different importance (weight) to you, and you make a final decision based on
                                    the weighted combination of all factors.
                                </p>

                                <h4>The Mathematical Foundation</h4>
                                <p>
                                    The perceptron uses a simple mathematical formula to make decisions:
                                </p>
                                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #e2e8f0' }}>
                                    <strong>Perceptron Formula:</strong><br />
                                    <code>prediction = w₀ + w₁×x + w₂×y</code><br />
                                    <code>output = 1 if prediction &gt; 0, otherwise 0</code>
                                </div>

                                <p>
                                    <strong>Breaking this down:</strong>
                                </p>
                                <ul>
                                    <li><strong>w₀ (bias):</strong> A constant that shifts the decision boundary up or down</li>
                                    <li><strong>w₁, w₂ (weights):</strong> How important each input (x, y) is to the decision</li>
                                    <li><strong>x, y:</strong> The input features (coordinates of our data points)</li>
                                    <li><strong>Threshold:</strong> If the weighted sum is positive, predict class 1; if negative, predict class 0</li>
                                </ul>

                                <h4>How Does the Perceptron Learn? (Step-by-Step)</h4>
                                <p>
                                    The perceptron learning algorithm is like a student learning from mistakes:
                                </p>

                                <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #0ea5e9' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#0c4a6e' }}>Step 1: Initialize</h5>
                                    <p style={{ margin: '0' }}>Start with random weights (usually all zeros): w₀ = 0, w₁ = 0, w₂ = 0</p>
                                </div>

                                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #22c55e' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#166534' }}>Step 2: Make a Prediction</h5>
                                    <p style={{ margin: '0' }}>For each data point, calculate: prediction = w₀ + w₁×x + w₂×y</p>
                                    <p style={{ margin: '8px 0 0 0' }}>If prediction &gt; 0, guess class 1; if prediction &le; 0, guess class 0</p>
                                </div>

                                <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #f59e0b' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#92400e' }}>Step 3: Calculate the Error</h5>
                                    <p style={{ margin: '0' }}>Compare your guess with the correct answer:</p>
                                    <p style={{ margin: '8px 0 0 0' }}><strong>Error = Correct Answer - Your Guess</strong></p>
                                    <p style={{ margin: '8px 0 0 0' }}>If you're right, error = 0 (no change needed)</p>
                                    <p style={{ margin: '8px 0 0 0' }}>If you're wrong, error = ±1 (weights need adjustment)</p>
                                </div>

                                <div style={{ backgroundColor: '#fce7f3', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #ec4899' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#be185d' }}>Step 4: Update the Weights</h5>
                                    <p style={{ margin: '0' }}>If you made a mistake, adjust the weights:</p>
                                    <p style={{ margin: '8px 0 0 0' }}><strong>New w₀ = Old w₀ + Learning Rate × Error</strong></p>
                                    <p style={{ margin: '8px 0 0 0' }}><strong>New w₁ = Old w₁ + Learning Rate × Error × x</strong></p>
                                    <p style={{ margin: '8px 0 0 0' }}><strong>New w₂ = Old w₂ + Learning Rate × Error × y</strong></p>
                                </div>

                                <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #9ca3af' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#374151' }}>Step 5: Repeat</h5>
                                    <p style={{ margin: '0' }}>Go through all data points again and again until:</p>
                                    <p style={{ margin: '8px 0 0 0' }}>• All points are classified correctly (success!)</p>
                                    <p style={{ margin: '8px 0 0 0' }}>• Maximum iterations reached (might not be possible)</p>
                                </div>

                                <h4>Understanding the Decision Boundary</h4>
                                <p>
                                    The decision boundary is the line that separates the two classes. It's defined by the equation:
                                </p>
                                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #e2e8f0' }}>
                                    <strong>Decision Boundary Equation:</strong><br />
                                    <code>w₀ + w₁×x + w₂×y = 0</code><br />
                                    <code>Solving for y: y = -(w₀ + w₁×x) / w₂</code>
                                </div>

                                <p>
                                    <strong>Why this matters:</strong> Points on one side of this line are classified as class 0,
                                    points on the other side as class 1. As the perceptron learns, this line moves and rotates
                                    until it correctly separates all the data points.
                                </p>

                                <h4>Key Concepts Explained</h4>

                                <h5>Linear Separability</h5>
                                <p>
                                    <strong>Definition:</strong> Data is linearly separable if you can draw a single straight line
                                    that perfectly separates the two classes.
                                </p>
                                <ul>
                                    <li><strong>AND Gate:</strong> ✅ Linearly separable (can draw a line to separate 0s from 1s)</li>
                                    <li><strong>OR Gate:</strong> ✅ Linearly separable (can draw a line to separate 0s from 1s)</li>
                                    <li><strong>XOR Gate:</strong> ❌ NOT linearly separable (impossible to draw a single line)</li>
                                </ul>

                                <h5>Learning Rate</h5>
                                <p>
                                    The learning rate controls how big steps the algorithm takes when updating weights:
                                </p>
                                <ul>
                                    <li><strong>Too high (e.g., 1.0):</strong> Takes big steps, might overshoot the solution</li>
                                    <li><strong>Too low (e.g., 0.01):</strong> Takes tiny steps, learns very slowly</li>
                                    <li><strong>Just right (e.g., 0.1):</strong> Balances speed and accuracy</li>
                                </ul>

                                <h5>Weight Vector</h5>
                                <p>
                                    The weight vector [w₁, w₂] points in the direction perpendicular to the decision boundary.
                                    It shows which direction the perceptron is "looking" to make its decisions.
                                </p>

                                <h4>Why the XOR Gate Fails (This is Important!)</h4>
                                <p>
                                    The XOR gate is the classic example of a problem that a single perceptron cannot solve.
                                    Here's why:
                                </p>

                                <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #fca5a5' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>XOR Truth Table:</h5>
                                    <p style={{ margin: '0' }}>Input (0,0) → Output 0</p>
                                    <p style={{ margin: '0' }}>Input (0,1) → Output 1</p>
                                    <p style={{ margin: '0' }}>Input (1,0) → Output 1</p>
                                    <p style={{ margin: '0' }}>Input (1,1) → Output 0</p>
                                </div>

                                <p>
                                    <strong>The Problem:</strong> Try to draw a single straight line that separates the 0s from the 1s.
                                    You can't! The 0s are at opposite corners (0,0) and (1,1), and the 1s are at the other corners (0,1) and (1,0).
                                    No single line can separate them.
                                </p>

                                <p>
                                    <strong>Historical Significance:</strong> This limitation was discovered in 1969 by Minsky and Papert,
                                    and it led to the "AI winter" - a period when people thought neural networks were useless.
                                    It wasn't until the 1980s that researchers discovered that multi-layer networks could solve XOR.
                                </p>

                                <h4>Real-World Applications</h4>
                                <p>
                                    While single perceptrons have limitations, they're still useful for:
                                </p>
                                <ul>
                                    <li><strong>Email Spam Detection:</strong> Based on simple features like number of exclamation marks, presence of certain words</li>
                                    <li><strong>Medical Diagnosis:</strong> Simple yes/no decisions based on clear symptoms</li>
                                    <li><strong>Quality Control:</strong> Pass/fail decisions in manufacturing</li>
                                    <li><strong>Basic Pattern Recognition:</strong> Simple image classification tasks</li>
                                </ul>

                                <h4>Try These Experiments</h4>
                                <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid #0ea5e9' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#0c4a6e' }}>Learning Experiments:</h5>
                                    <ul style={{ margin: '0' }}>
                                        <li><strong>Start with AND Gate:</strong> Watch the perceptron learn this simple pattern</li>
                                        <li><strong>Try OR Gate:</strong> See how it handles a different but still separable pattern</li>
                                        <li><strong>Experiment with XOR:</strong> Watch it struggle and fail - this is the key learning moment!</li>
                                        <li><strong>Create Custom Data:</strong> Add your own points and see if the perceptron can learn them</li>
                                        <li><strong>Adjust Learning Rate:</strong> See how it affects the learning speed and accuracy</li>
                                    </ul>
                                </div>

                                <h4>What's Next? Multi-Layer Perceptrons</h4>
                                <p>
                                    The perceptron's limitation with XOR led to the development of multi-layer perceptrons (MLPs),
                                    which are the foundation of modern neural networks. By adding hidden layers, we can solve
                                    non-linearly separable problems like XOR.
                                </p>

                                <p>
                                    <strong>Key Takeaway:</strong> The perceptron's failure with XOR is not a bug - it's a feature!
                                    It teaches us about the fundamental limitations of single-layer networks and why we need
                                    more complex architectures for real-world problems.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STANDARDIZED COPYRIGHT NOTICE */}
                <section className="copyright-section">
                    <div className="copyright-notice">
                        <p>&copy; 2025, Todd Brous. All rights reserved.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PerceptronLearning;
