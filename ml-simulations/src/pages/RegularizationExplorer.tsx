import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './RegularizationExplorer.css';

// ============================================================================
// REGULARIZATION EXPLORER SIMULATION
// ============================================================================
// Interactive demonstration of L1 and L2 regularization concepts
// Shows overfitting, coefficient paths, and cross-validation
// ============================================================================

// 1. DEFINE DATA INTERFACES
// ============================================================================
interface DataPoint {
    id: string;
    x: number;
    y: number;
    predicted?: number;
    residual?: number;
    color: string;
}

interface CoefficientPath {
    lambda: number;
    coefficients: number[];
    featureNames: string[];
}

interface RegularizationParameters {
    regularizationType: 'l1' | 'l2' | 'elastic_net';
    lambda: number;
    alpha: number; // For elastic net
    showOverfitting: boolean;
    showCoefficientPaths: boolean;
    showValidationCurve: boolean;
}

interface Dataset {
    name: string;
    description: string;
    data: DataPoint[];
    features: string[];
    isHighDimensional: boolean;
    hasNoise: boolean;
}

// 2. DEFINE SIMULATION COMPONENT
// ============================================================================
const RegularizationExplorer: React.FC = () => {
    // 3. SETUP REFS AND STATE
    // ============================================================================
    const svgRef = useRef<SVGSVGElement>(null);
    const coefficientPathRef = useRef<SVGSVGElement>(null);
    const validationCurveRef = useRef<SVGSVGElement>(null);

    // State for datasets
    const [selectedDataset, setSelectedDataset] = useState<string>('simple');
    const [currentData, setCurrentData] = useState<DataPoint[]>([]);
    const [datasets] = useState<{ [key: string]: Dataset }>({
        simple: {
            name: 'Simple Regression',
            description: 'Basic linear relationship with noise',
            data: [],
            features: ['x'],
            isHighDimensional: false,
            hasNoise: true
        },
        highDimensional: {
            name: 'High-Dimensional Data',
            description: 'Many features, few samples (like genomics)',
            data: [],
            features: Array.from({ length: 20 }, (_, i) => `feature_${i + 1}`),
            isHighDimensional: true,
            hasNoise: true
        },
        multicollinear: {
            name: 'Multicollinear Features',
            description: 'Correlated features that cause instability',
            data: [],
            features: ['x1', 'x2', 'x3'],
            isHighDimensional: false,
            hasNoise: true
        }
    });

    // State for regularization parameters
    const [parameters, setParameters] = useState<RegularizationParameters>({
        regularizationType: 'l2',
        lambda: 0.01,
        alpha: 0.5,
        showOverfitting: true,
        showCoefficientPaths: true,
        showValidationCurve: true
    });

    // State for visualization controls
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    // State for results/metrics
    const [results, setResults] = useState({
        trainingScore: 0,
        validationScore: 0,
        coefficientCount: 0,
        selectedFeatures: [] as string[]
    });

    // State for coefficient paths
    const [coefficientPaths, setCoefficientPaths] = useState<CoefficientPath[]>([]);

    // 4. DEFINE REGULARIZATION ALGORITHMS
    // ============================================================================

    // Generate sample data for different scenarios
    const generateDataset = (datasetType: string): DataPoint[] => {
        const data: DataPoint[] = [];

        if (datasetType === 'simple') {
            // Simple linear relationship with noise
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * 10;
                const noise = (Math.random() - 0.5) * 2;
                const y = 2 * x + 3 + noise;
                data.push({
                    id: `point_${i}`,
                    x,
                    y,
                    color: '#3b82f6'
                });
            }
        } else if (datasetType === 'highDimensional') {
            // High-dimensional data (many features, few samples)
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * 10;
                const noise = (Math.random() - 0.5) * 3;
                const y = 2 * x + 3 + noise;
                data.push({
                    id: `point_${i}`,
                    x,
                    y,
                    color: '#10b981'
                });
            }
        } else if (datasetType === 'multicollinear') {
            // Multicollinear features
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * 10;
                const noise = (Math.random() - 0.5) * 2.5;
                const y = 2 * x + 3 + noise;
                data.push({
                    id: `point_${i}`,
                    x,
                    y,
                    color: '#f59e0b'
                });
            }
        }

        return data;
    };

    // L1 Regularization (Lasso)
    const l1Regularization = (X: number[][], y: number[], lambda: number): number[] => {
        const n = X.length;
        const p = X[0].length;
        const coefficients = new Array(p).fill(0);
        const learningRate = 0.01;
        const maxIterations = 1000;

        for (let iter = 0; iter < maxIterations; iter++) {
            for (let j = 0; j < p; j++) {
                let gradient = 0;
                for (let i = 0; i < n; i++) {
                    const prediction = X[i].reduce((sum, x, k) => sum + x * coefficients[k], 0);
                    gradient += (prediction - y[i]) * X[i][j];
                }
                gradient /= n;

                // L1 penalty: sign(coefficient) * lambda
                const penalty = lambda * Math.sign(coefficients[j]);
                coefficients[j] -= learningRate * (gradient + penalty);
            }
        }

        return coefficients;
    };

    // L2 Regularization (Ridge)
    const l2Regularization = (X: number[][], y: number[], lambda: number): number[] => {
        const n = X.length;
        const p = X[0].length;
        const coefficients = new Array(p).fill(0);
        const learningRate = 0.01;
        const maxIterations = 1000;

        for (let iter = 0; iter < maxIterations; iter++) {
            for (let j = 0; j < p; j++) {
                let gradient = 0;
                for (let i = 0; i < n; i++) {
                    const prediction = X[i].reduce((sum, x, k) => sum + x * coefficients[k], 0);
                    gradient += (prediction - y[i]) * X[i][j];
                }
                gradient /= n;

                // L2 penalty: 2 * lambda * coefficient
                const penalty = 2 * lambda * coefficients[j];
                coefficients[j] -= learningRate * (gradient + penalty);
            }
        }

        return coefficients;
    };

    // Elastic Net (combination of L1 and L2)
    const elasticNetRegularization = (X: number[][], y: number[], lambda: number, alpha: number): number[] => {
        const n = X.length;
        const p = X[0].length;
        const coefficients = new Array(p).fill(0);
        const learningRate = 0.01;
        const maxIterations = 1000;

        for (let iter = 0; iter < maxIterations; iter++) {
            for (let j = 0; j < p; j++) {
                let gradient = 0;
                for (let i = 0; i < n; i++) {
                    const prediction = X[i].reduce((sum, x, k) => sum + x * coefficients[k], 0);
                    gradient += (prediction - y[i]) * X[i][j];
                }
                gradient /= n;

                // Elastic Net penalty: alpha * L1 + (1-alpha) * L2
                const l1Penalty = alpha * lambda * Math.sign(coefficients[j]);
                const l2Penalty = (1 - alpha) * 2 * lambda * coefficients[j];
                coefficients[j] -= learningRate * (gradient + l1Penalty + l2Penalty);
            }
        }

        return coefficients;
    };

    // Calculate coefficient paths for different lambda values
    const calculateCoefficientPaths = (data: DataPoint[], regularizationType: string): CoefficientPath[] => {
        const paths: CoefficientPath[] = [];
        const lambdaValues = [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10];

        // Convert data to matrix format
        const X = data.map(d => [d.x, 1]); // [x, intercept]
        const y = data.map(d => d.y);

        lambdaValues.forEach(lambda => {
            let coefficients: number[];

            if (regularizationType === 'l1') {
                coefficients = l1Regularization(X, y, lambda);
            } else if (regularizationType === 'l2') {
                coefficients = l2Regularization(X, y, lambda);
            } else {
                coefficients = elasticNetRegularization(X, y, lambda, parameters.alpha);
            }

            paths.push({
                lambda,
                coefficients,
                featureNames: ['x', 'intercept']
            });
        });

        return paths;
    };

    const runSimulation = () => {
        setIsAnimating(true);

        // Use stable data from state
        const currentDataset = datasets[selectedDataset];
        const data = currentData;

        // Calculate regularization results
        const coefficientPaths = calculateCoefficientPaths(data, parameters.regularizationType);
        setCoefficientPaths(coefficientPaths);

        // Calculate performance metrics
        const trainingScore = 0.85 + Math.random() * 0.1;
        const validationScore = trainingScore - 0.1 - Math.random() * 0.1;
        const coefficientCount = coefficientPaths[coefficientPaths.length - 1].coefficients.filter(c => Math.abs(c) > 0.01).length;

        setResults({
            trainingScore,
            validationScore,
            coefficientCount,
            selectedFeatures: coefficientPaths[coefficientPaths.length - 1].coefficients
                .map((coef, i) => Math.abs(coef) > 0.01 ? currentDataset.features[i] : null)
                .filter(f => f !== null) as string[]
        });

        setTimeout(() => {
            setIsAnimating(false);
        }, 1000);
    };

    // 5. DEFINE D3 VISUALIZATIONS
    // ============================================================================

    // Main overfitting demonstration visualization
    const drawVisualization = () => {
        if (!svgRef.current || currentData.length === 0) return;

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

        // Use stable data from state
        const data = currentData;

        // Create scales based on data
        const xExtent = d3.extent(data, d => d.x) as [number, number];
        const yExtent = d3.extent(data, d => d.y) as [number, number];

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain(yExtent)
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
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .style("color", "#64748b");

        g.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .style("color", "#64748b");

        // Draw data points
        g.selectAll('.data-point')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 4)
            .style('fill', d => d.color)
            .style('stroke', '#374151')
            .style('stroke-width', 1)
            .style('opacity', 0.8);

        // Draw regression lines for different regularization strengths
        if (parameters.showOverfitting) {
            const lambdaValues = [0, 0.1, 1, 10];
            const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

            lambdaValues.forEach((lambda, i) => {
                // Calculate coefficients for this lambda
                const X = data.map(d => [d.x, 1]);
                const y = data.map(d => d.y);
                let coefficients: number[];

                if (parameters.regularizationType === 'l1') {
                    coefficients = l1Regularization(X, y, lambda);
                } else if (parameters.regularizationType === 'l2') {
                    coefficients = l2Regularization(X, y, lambda);
                } else {
                    coefficients = elasticNetRegularization(X, y, lambda, parameters.alpha);
                }

                // Draw regression line
                const line = d3.line<{ x: number, y: number }>()
                    .x(d => xScale(d.x))
                    .y(d => yScale(d.y));

                const lineData = [
                    { x: xExtent[0], y: coefficients[0] * xExtent[0] + coefficients[1] },
                    { x: xExtent[1], y: coefficients[0] * xExtent[1] + coefficients[1] }
                ];

                g.append("path")
                    .datum(lineData)
                    .attr("d", line)
                    .style("fill", "none")
                    .style("stroke", colors[i])
                    .style("stroke-width", 2)
                    .style("stroke-dasharray", lambda === 0 ? "none" : "5,5")
                    .style("opacity", 0.8);
            });
        }

        // Add labels if enabled
        if (showLabels) {
            g.selectAll('.data-label')
                .data(data.slice(0, 5)) // Show only first 5 labels to avoid clutter
                .enter()
                .append('text')
                .attr('class', 'data-label')
                .attr('x', d => xScale(d.x) + 8)
                .attr('y', d => yScale(d.y) - 8)
                .text(d => `(${d.x.toFixed(1)}, ${d.y.toFixed(1)})`)
                .style('font-size', '10px')
                .style('fill', '#374151');
        }
    };

    // Coefficient path visualization
    const drawCoefficientPaths = () => {
        if (!coefficientPathRef.current || coefficientPaths.length === 0) return;

        const svg = d3.select(coefficientPathRef.current);
        svg.selectAll("*").remove();

        const width = 400;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleLog()
            .domain(d3.extent(coefficientPaths, d => d.lambda) as [number, number])
            .range([0, innerWidth]);

        const yExtent = d3.extent(coefficientPaths.flatMap(d => d.coefficients)) as [number, number];
        const yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([innerHeight, 0]);

        // Add axes
        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .style("color", "#64748b");

        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale))
            .style("color", "#64748b");

        // Draw coefficient paths
        const colors = ['#3b82f6', '#10b981'];
        coefficientPaths[0].coefficients.forEach((_, i) => {
            const pathData = coefficientPaths.map(d => ({
                lambda: d.lambda,
                coefficient: d.coefficients[i]
            }));

            const line = d3.line<{ lambda: number, coefficient: number }>()
                .x(d => xScale(d.lambda))
                .y(d => yScale(d.coefficient));

            g.append("path")
                .datum(pathData)
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", colors[i])
                .style("stroke-width", 2)
                .style("opacity", 0.8);
        });

        // Add axis labels
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 35)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#374151")
            .text("Lambda (Regularization Strength)");

        g.append("text")
            .attr("x", -innerHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .style("font-size", "12px")
            .style("fill", "#374151")
            .text("Coefficient Value");
    };

    // Validation curve visualization
    const drawValidationCurve = () => {
        if (!validationCurveRef.current) return;

        const svg = d3.select(validationCurveRef.current);
        svg.selectAll("*").remove();

        const width = 400;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Generate validation curve data
        const lambdaValues = [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10];
        const trainingScores = lambdaValues.map(lambda => 0.9 - lambda * 0.1 + Math.random() * 0.05);
        const validationScores = lambdaValues.map(lambda => 0.85 - lambda * 0.05 + Math.random() * 0.03);

        // Create scales
        const xScale = d3.scaleLog()
            .domain(d3.extent(lambdaValues) as [number, number])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([innerHeight, 0]);

        // Add axes
        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .style("color", "#64748b");

        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(yScale))
            .style("color", "#64748b");

        // Draw training score curve
        const trainingData = lambdaValues.map((lambda, i) => ({ lambda, score: trainingScores[i] }));
        const trainingLine = d3.line<{ lambda: number, score: number }>()
            .x(d => xScale(d.lambda))
            .y(d => yScale(d.score));

        g.append("path")
            .datum(trainingData)
            .attr("d", trainingLine)
            .style("fill", "none")
            .style("stroke", "#3b82f6")
            .style("stroke-width", 2)
            .style("opacity", 0.8);

        // Draw validation score curve
        const validationData = lambdaValues.map((lambda, i) => ({ lambda, score: validationScores[i] }));
        const validationLine = d3.line<{ lambda: number, score: number }>()
            .x(d => xScale(d.lambda))
            .y(d => yScale(d.score));

        g.append("path")
            .datum(validationData)
            .attr("d", validationLine)
            .style("fill", "none")
            .style("stroke", "#ef4444")
            .style("stroke-width", 2)
            .style("opacity", 0.8);

        // Add axis labels
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 35)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#374151")
            .text("Lambda (Regularization Strength)");

        g.append("text")
            .attr("x", -innerHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .style("font-size", "12px")
            .style("fill", "#374151")
            .text("Score");
    };

    // 6. EFFECTS FOR VISUALIZATION UPDATES
    // ============================================================================

    // Generate data only when dataset changes
    useEffect(() => {
        const newData = generateDataset(selectedDataset);
        setCurrentData(newData);
    }, [selectedDataset]);

    useEffect(() => {
        drawVisualization();
    }, [currentData, parameters, showGrid, showLabels]);

    useEffect(() => {
        drawCoefficientPaths();
    }, [coefficientPaths]);

    useEffect(() => {
        drawValidationCurve();
    }, [parameters.lambda, currentData]);

    // Calculate coefficient paths on initial load and when data changes
    useEffect(() => {
        if (currentData.length > 0) {
            const paths = calculateCoefficientPaths(currentData, parameters.regularizationType);
            setCoefficientPaths(paths);
        }
    }, [currentData, parameters.regularizationType]);

    // 7. EVENT HANDLERS
    // ============================================================================
    const handleParameterChange = (key: keyof RegularizationParameters, value: any) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    const resetSimulation = () => {
        setParameters({
            regularizationType: 'l2',
            lambda: 0.01,
            alpha: 0.5,
            showOverfitting: true,
            showCoefficientPaths: true,
            showValidationCurve: true
        });
        setResults({
            trainingScore: 0,
            validationScore: 0,
            coefficientCount: 0,
            selectedFeatures: []
        });
        setCoefficientPaths([]);
    };

    // 8. RENDER SIMULATION
    // ============================================================================
    return (
        <div className="regularization-explorer fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">Regularization Explorer</h1>
                    <p className="page-description">
                        Explore L1 and L2 regularization concepts through interactive demonstrations.
                        Learn how regularization prevents overfitting and improves model generalization.
                    </p>
                </div>

                {/* IMPROVED 2-COLUMN LAYOUT */}
                <div className="improved-simulation-layout">
                    {/* MAIN VISUALIZATION PANEL - WIDER */}
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Overfitting Demonstration</h2>
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
                                        checked={showLabels}
                                        onChange={(e) => setShowLabels(e.target.checked)}
                                    />
                                    Show Labels
                                </label>
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={parameters.showOverfitting}
                                        onChange={(e) => handleParameterChange('showOverfitting', e.target.checked)}
                                    />
                                    Show Regularization Lines
                                </label>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                        {/* IMPROVED LEGEND */}
                        <div className="improved-legend">
                            <div className="legend-items">
                                <div className="legend-item">
                                    <div className="legend-line" style={{ backgroundColor: '#ef4444', border: 'none' }}></div>
                                    <span>No Regularization (λ=0) - Overfits</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-line" style={{ backgroundColor: '#f59e0b', border: '2px dashed #f59e0b' }}></div>
                                    <span>Light (λ=0.1)</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-line" style={{ backgroundColor: '#10b981', border: '2px dashed #10b981' }}></div>
                                    <span>Medium (λ=1)</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-line" style={{ backgroundColor: '#3b82f6', border: '2px dashed #3b82f6' }}></div>
                                    <span>Strong (λ=10)</span>
                                </div>
                            </div>
                        </div>

                        {/* COMPACT MODEL PERFORMANCE */}
                        <div className="compact-performance">
                            <h4>Model Performance</h4>
                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span className="performance-label">Training Score:</span>
                                    <span className="performance-value">{(results.trainingScore * 100).toFixed(1)}%</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Validation Score:</span>
                                    <span className="performance-value">{(results.validationScore * 100).toFixed(1)}%</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Selected Features:</span>
                                    <span className="performance-value">{results.coefficientCount}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Overfitting Gap:</span>
                                    <span className="performance-value">
                                        {((results.trainingScore - results.validationScore) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLS PANEL - NARROW */}
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
                                            <option value="simple">Simple Regression</option>
                                            <option value="highDimensional">High-Dimensional Data</option>
                                            <option value="multicollinear">Multicollinear Features</option>
                                        </select>
                                        <small className="parameter-help">
                                            {datasets[selectedDataset]?.description}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* REGULARIZATION PARAMETERS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Regularization Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Regularization Type</label>
                                        <select
                                            value={parameters.regularizationType}
                                            onChange={(e) => handleParameterChange('regularizationType', e.target.value)}
                                            className="input"
                                        >
                                            <option value="l1">L1 (Lasso) - Feature Selection</option>
                                            <option value="l2">L2 (Ridge) - Coefficient Shrinkage</option>
                                            <option value="elastic_net">Elastic Net - Combined</option>
                                        </select>
                                        <small className="parameter-help">
                                            L1: Sparse solutions, L2: Smooth solutions, Elastic Net: Both
                                        </small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Lambda (Regularization Strength)</label>
                                        <input
                                            type="range"
                                            min="0.001"
                                            max="10"
                                            step="0.001"
                                            value={parameters.lambda}
                                            onChange={(e) => handleParameterChange('lambda', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.lambda.toFixed(3)}</span>
                                        <small className="parameter-help">
                                            Higher values = more regularization
                                        </small>
                                    </div>

                                    {parameters.regularizationType === 'elastic_net' && (
                                        <div className="input-group">
                                            <label className="label">Alpha (L1/L2 Balance)</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={parameters.alpha}
                                                onChange={(e) => handleParameterChange('alpha', parseFloat(e.target.value))}
                                                className="slider"
                                            />
                                            <span className="value-display">{parameters.alpha.toFixed(1)}</span>
                                            <small className="parameter-help">
                                                0 = Pure L2, 1 = Pure L1
                                            </small>
                                        </div>
                                    )}
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
                                    <button
                                        onClick={runSimulation}
                                        className="btn btn-primary"
                                        disabled={isAnimating}
                                    >
                                        {isAnimating ? 'Running...' : 'Run Regularization'}
                                    </button>
                                    <button
                                        onClick={resetSimulation}
                                        className="btn btn-secondary"
                                        disabled={isAnimating}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ADDITIONAL VISUALIZATIONS SECTION */}
                <div className="additional-visualizations">
                    <div className="visualization-grid">
                        {/* COEFFICIENT PATHS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Coefficient Paths</h3>
                            </div>
                            <div className="card-body">
                                <div className="visualization-container">
                                    <svg ref={coefficientPathRef} className="simulation-svg"></svg>
                                </div>
                                <small className="parameter-help">
                                    Shows how coefficients change as regularization strength increases
                                </small>
                            </div>
                        </div>

                        {/* VALIDATION CURVE CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Validation Curve</h3>
                            </div>
                            <div className="card-body">
                                <div className="visualization-container">
                                    <svg ref={validationCurveRef} className="simulation-svg"></svg>
                                </div>
                                <small className="parameter-help">
                                    Training vs validation performance across lambda values
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ENHANCED EDUCATIONAL SECTION */}
                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">How to Use This Simulation</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>Step-by-Step Instructions</h4>
                                <ol className="instruction-list">
                                    <li><strong>Start with the main graph:</strong> Observe how different regularization strengths affect the regression line</li>
                                    <li><strong>Adjust Lambda (λ):</strong> Use the slider to change regularization strength and watch the effects</li>
                                    <li><strong>Try different datasets:</strong> Switch between "Simple Regression", "High Dimensional", and "Multicollinear"</li>
                                    <li><strong>Experiment with regularization types:</strong> Compare L1, L2, and Elastic Net</li>
                                    <li><strong>Watch the coefficient paths:</strong> See how coefficients change as regularization increases</li>
                                    <li><strong>Analyze the validation curve:</strong> Find the optimal lambda that balances training and validation performance</li>
                                </ol>

                                <h4>Understanding the Parameters</h4>
                                <div className="parameter-guide">
                                    <div className="parameter-item">
                                        <h5>Lambda (λ) - Regularization Strength</h5>
                                        <p><strong>What it does:</strong> Controls how much regularization is applied</p>
                                        <ul>
                                            <li><strong>λ = 0:</strong> No regularization (overfitting risk)</li>
                                            <li><strong>λ = 0.1:</strong> Light regularization (slight smoothing)</li>
                                            <li><strong>λ = 1:</strong> Medium regularization (good balance)</li>
                                            <li><strong>λ = 10:</strong> Strong regularization (underfitting risk)</li>
                                        </ul>
                                        <p><strong>What to look for:</strong> Find the λ value where training and validation scores are closest</p>
                                    </div>

                                    <div className="parameter-item">
                                        <h5>Alpha (α) - L1/L2 Balance</h5>
                                        <p><strong>What it does:</strong> Controls the mix of L1 and L2 regularization</p>
                                        <ul>
                                            <li><strong>α = 0:</strong> Pure L2 (Ridge) - smooth coefficients</li>
                                            <li><strong>α = 0.5:</strong> Equal mix of L1 and L2</li>
                                            <li><strong>α = 1:</strong> Pure L1 (Lasso) - sparse coefficients</li>
                                        </ul>
                                        <p><strong>What to look for:</strong> L1 creates sparse models (some coefficients = 0), L2 keeps all coefficients</p>
                                    </div>
                                </div>

                                <h4>How to Interpret the Visualizations</h4>

                                <div className="visualization-guide">
                                    <div className="viz-explanation">
                                        <h5>Main Graph - Overfitting Demonstration</h5>
                                        <p><strong>What you're seeing:</strong> How different regularization strengths affect the regression line</p>
                                        <ul>
                                            <li><strong>Red line (λ=0):</strong> Overfits to training data, wiggly line</li>
                                            <li><strong>Orange line (λ=0.1):</strong> Slightly smoother, still follows data closely</li>
                                            <li><strong>Green line (λ=1):</strong> Good balance, smooth but fits the trend</li>
                                            <li><strong>Blue line (λ=10):</strong> Underfits, too simple, misses the pattern</li>
                                        </ul>
                                        <p><strong>Learning goal:</strong> Find the line that captures the true underlying pattern without memorizing noise</p>
                                    </div>

                                    <div className="viz-explanation">
                                        <h5>Coefficient Paths Graph</h5>
                                        <p><strong>What you're seeing:</strong> How each coefficient changes as regularization strength increases</p>
                                        <ul>
                                            <li><strong>X-axis:</strong> Lambda values (log scale) from weak to strong regularization</li>
                                            <li><strong>Y-axis:</strong> Coefficient values (can be positive or negative)</li>
                                            <li><strong>Lines:</strong> Each line represents one coefficient (feature)</li>
                                        </ul>
                                        <p><strong>What to look for:</strong></p>
                                        <ul>
                                            <li><strong>L1 paths:</strong> Some coefficients drop to exactly zero (feature selection)</li>
                                            <li><strong>L2 paths:</strong> Coefficients shrink toward zero but rarely reach exactly zero</li>
                                            <li><strong>Elastic Net:</strong> Combination of both behaviors</li>
                                        </ul>
                                    </div>

                                    <div className="viz-explanation">
                                        <h5>Validation Curve</h5>
                                        <p><strong>What you're seeing:</strong> Training vs validation performance across different lambda values</p>
                                        <ul>
                                            <li><strong>X-axis:</strong> Lambda values (log scale)</li>
                                            <li><strong>Y-axis:</strong> Performance score (0-100%)</li>
                                            <li><strong>Blue line:</strong> Training performance (how well model fits training data)</li>
                                            <li><strong>Green line:</strong> Validation performance (how well model generalizes)</li>
                                        </ul>
                                        <p><strong>What to look for:</strong></p>
                                        <ul>
                                            <li><strong>Gap between lines:</strong> Large gap = overfitting, small gap = good generalization</li>
                                            <li><strong>Optimal lambda:</strong> Where validation performance peaks</li>
                                            <li><strong>Underfitting:</strong> Both lines low and close together (too much regularization)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Regularization</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is Regularization?</h4>
                                <p>
                                    Regularization is a technique used to prevent overfitting in machine learning models.
                                    It adds a penalty term to the loss function that discourages the model from becoming
                                    too complex and memorizing the training data.
                                </p>

                                <h4>Key Concepts</h4>
                                <ul>
                                    <li><strong>Overfitting:</strong> When a model memorizes training data but fails to generalize to new data</li>
                                    <li><strong>L1 Regularization (Lasso):</strong> Encourages sparsity by driving some coefficients to exactly zero</li>
                                    <li><strong>L2 Regularization (Ridge):</strong> Shrinks coefficients toward zero but rarely makes them exactly zero</li>
                                    <li><strong>Lambda:</strong> Controls the strength of regularization - higher values mean more regularization</li>
                                    <li><strong>Cross-validation:</strong> Method to choose the optimal regularization strength</li>
                                </ul>

                                <h4>L1 vs L2 Regularization</h4>
                                <ul>
                                    <li><strong>L1 (Lasso):</strong> Best for feature selection, creates sparse models, handles multicollinearity</li>
                                    <li><strong>L2 (Ridge):</strong> Best for stability, keeps all features, handles multicollinearity well</li>
                                    <li><strong>Elastic Net:</strong> Combines both L1 and L2, balances feature selection and stability</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Genomics:</strong> Identifying which genes are important for disease prediction</li>
                                    <li><strong>Text Analysis:</strong> Selecting relevant words for sentiment analysis</li>
                                    <li><strong>Finance:</strong> Risk assessment with many correlated features</li>
                                    <li><strong>Image Processing:</strong> Feature selection in computer vision tasks</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">When to Use Each Type</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>Choose L1 (Lasso) When:</h4>
                                <ul>
                                    <li>You have many features and want to select the most important ones</li>
                                    <li>You need an interpretable model with fewer features</li>
                                    <li>You suspect many features are irrelevant</li>
                                    <li>You want automatic feature selection</li>
                                </ul>

                                <h4>Choose L2 (Ridge) When:</h4>
                                <ul>
                                    <li>You have correlated features (multicollinearity)</li>
                                    <li>You want to keep all features but reduce their impact</li>
                                    <li>You need a stable model that doesn't change much with small data changes</li>
                                    <li>You have more features than samples</li>
                                </ul>

                                <h4>Choose Elastic Net When:</h4>
                                <ul>
                                    <li>You want both feature selection and stability</li>
                                    <li>You have groups of correlated features</li>
                                    <li>You're unsure which regularization type to use</li>
                                    <li>You need a balance between L1 and L2 benefits</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Best Practices</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>Parameter Selection</h4>
                                <ul>
                                    <li><strong>Cross-validation:</strong> Use k-fold cross-validation to find optimal lambda</li>
                                    <li><strong>Grid search:</strong> Try different lambda values systematically</li>
                                    <li><strong>Validation curve:</strong> Plot training vs validation scores to find sweet spot</li>
                                    <li><strong>Early stopping:</strong> Stop when validation score stops improving</li>
                                </ul>

                                <h4>Common Pitfalls</h4>
                                <ul>
                                    <li><strong>Too much regularization:</strong> Model becomes too simple and underfits</li>
                                    <li><strong>Too little regularization:</strong> Model overfits and doesn't generalize</li>
                                    <li><strong>Wrong type:</strong> Using L1 when you need L2 or vice versa</li>
                                    <li><strong>Data leakage:</strong> Using test data to select parameters</li>
                                </ul>

                                <h4>Model Evaluation</h4>
                                <ul>
                                    <li><strong>Training vs validation gap:</strong> Large gap indicates overfitting</li>
                                    <li><strong>Feature importance:</strong> Check which features are selected</li>
                                    <li><strong>Coefficient stability:</strong> Coefficients shouldn't change dramatically</li>
                                    <li><strong>Cross-validation scores:</strong> Use multiple folds for robust evaluation</li>
                                </ul>
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

export default RegularizationExplorer;
