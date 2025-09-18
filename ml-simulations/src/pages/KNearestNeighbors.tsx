import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './KNearestNeighbors.css';

// ============================================================================
// K NEAREST NEIGHBORS SIMULATION
// ============================================================================
// Interactive KNN classifier with real-time visualization
// ============================================================================

// 1. DATA INTERFACES
// ============================================================================
interface DataPoint {
    id: string;
    x: number;
    y: number;
    label: number;
    color: string;
    isTestPoint?: boolean;
}

interface KNNParameters {
    k: number;
    distanceMetric: 'euclidean' | 'manhattan' | 'minkowski';
    showDecisionBoundary: boolean;
    showNearestNeighbors: boolean;
    showDistanceLines: boolean;
}

interface KNNResult {
    predictions: number[];
    nearestNeighbors: { point: DataPoint, distance: number }[];
    decisionBoundary: { x: number, y: number, label: number }[];
}

interface Dataset {
    name: string;
    description: string;
    xLabel: string;
    yLabel: string;
    data: DataPoint[];
    color0: string;
    color1: string;
    color2?: string;
}

// 2. KNN SIMULATION COMPONENT
// ============================================================================
const KNearestNeighbors: React.FC = () => {
    // 3. SETUP REFS AND STATE
    // ============================================================================
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State for simulation data
    const [selectedDataset, setSelectedDataset] = useState<string>('moons');
    const [trainingData, setTrainingData] = useState<DataPoint[]>([]);
    const [testPoints, setTestPoints] = useState<DataPoint[]>([]);
    const [parameters, setParameters] = useState<KNNParameters>({
        k: 3,
        distanceMetric: 'euclidean',
        showDecisionBoundary: true,
        showNearestNeighbors: true,
        showDistanceLines: true
    });

    // State for visualization controls
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [dimensions, setDimensions] = useState<{ width: number, height: number }>({ width: 800, height: 600 });

    // State for results/metrics
    const [results, setResults] = useState<KNNResult>({
        predictions: [],
        nearestNeighbors: [],
        decisionBoundary: []
    });

    // State for interaction
    const [selectedTestPoint, setSelectedTestPoint] = useState<DataPoint | null>(null);
    const [isPlacingPoint, setIsPlacingPoint] = useState(false);

    // 4. DATASET DEFINITIONS
    // ============================================================================
    const datasets: { [key: string]: Dataset } = {
        moons: {
            name: 'Two Moons',
            description: 'Non-linearly separable data with moon-shaped clusters',
            xLabel: 'Feature 1',
            yLabel: 'Feature 2',
            data: [],
            color0: '#3b82f6',
            color1: '#ef4444'
        },
        circles: {
            name: 'Concentric Circles',
            description: 'Concentric circular patterns with different radii',
            xLabel: 'Feature 1',
            yLabel: 'Feature 2',
            data: [],
            color0: '#8b5cf6',
            color1: '#f59e0b'
        },
        linear: {
            name: 'Linear Separation',
            description: 'Linearly separable data with clear boundary',
            xLabel: 'Feature 1',
            yLabel: 'Feature 2',
            data: [],
            color0: '#6366f1',
            color1: '#ec4899'
        }
    };

    // 5. ALGORITHM FUNCTIONS
    // ============================================================================
    const calculateDistance = (point1: DataPoint, point2: DataPoint, metric: string): number => {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;

        switch (metric) {
            case 'euclidean':
                return Math.sqrt(dx * dx + dy * dy);
            case 'manhattan':
                return Math.abs(dx) + Math.abs(dy);
            case 'minkowski':
                const p = 3;
                return Math.pow(Math.pow(Math.abs(dx), p) + Math.pow(Math.abs(dy), p), 1 / p);
            default:
                return Math.sqrt(dx * dx + dy * dy);
        }
    };

    const findNearestNeighbors = (testPoint: DataPoint, trainingData: DataPoint[], k: number): { point: DataPoint, distance: number }[] => {
        const distances = trainingData.map(point => ({
            point,
            distance: calculateDistance(testPoint, point, parameters.distanceMetric)
        }));

        return distances
            .sort((a, b) => a.distance - b.distance)
            .slice(0, k);
    };

    const classifyPoint = (testPoint: DataPoint, trainingData: DataPoint[], k: number): number => {
        const neighbors = findNearestNeighbors(testPoint, trainingData, k);
        const labelCounts: { [key: number]: number } = {};

        neighbors.forEach(neighbor => {
            const label = neighbor.point.label;
            labelCounts[label] = (labelCounts[label] || 0) + 1;
        });

        // Return the most common label
        return parseInt(Object.keys(labelCounts).reduce((a, b) =>
            labelCounts[parseInt(a)] > labelCounts[parseInt(b)] ? a : b
        ));
    };

    const generateDecisionBoundary = (trainingData: DataPoint[], k: number): { x: number, y: number, label: number }[] => {
        const boundary: { x: number, y: number, label: number }[] = [];
        const gridSize = 15;
        const xMin = Math.min(...trainingData.map(d => d.x)) - 0.1;
        const xMax = Math.max(...trainingData.map(d => d.x)) + 0.1;
        const yMin = Math.min(...trainingData.map(d => d.y)) - 0.1;
        const yMax = Math.max(...trainingData.map(d => d.y)) + 0.1;

        const xStep = (xMax - xMin) / gridSize;
        const yStep = (yMax - yMin) / gridSize;

        for (let i = 0; i <= gridSize; i++) {
            for (let j = 0; j <= gridSize; j++) {
                const x = xMin + i * xStep;
                const y = yMin + j * yStep;
                const testPoint: DataPoint = { id: `boundary-${i}-${j}`, x, y, label: 0, color: '' };
                const label = classifyPoint(testPoint, trainingData, k);
                boundary.push({ x, y, label });
            }
        }

        return boundary;
    };

    const runKNNClassification = () => {
        setIsAnimating(true);

        const newResults: KNNResult = {
            predictions: [],
            nearestNeighbors: [],
            decisionBoundary: []
        };

        // Classify test points
        if (testPoints.length > 0) {
            const predictions = testPoints.map(point => classifyPoint(point, trainingData, parameters.k));
            newResults.predictions = predictions;

            // Update test points with their predicted labels and colors
            setTestPoints(prev => prev.map((point, index) => ({
                ...point,
                label: predictions[index],
                color: predictions[index] === 0 ? datasets[selectedDataset].color0 :
                    datasets[selectedDataset].color1
            })));
        }

        // Generate decision boundary
        if (parameters.showDecisionBoundary) {
            newResults.decisionBoundary = generateDecisionBoundary(trainingData, parameters.k);
        }

        setResults(newResults);

        setTimeout(() => {
            setIsAnimating(false);
        }, 500);
    };

    // 6. DATA GENERATION
    // ============================================================================
    const generateMoonsData = (): DataPoint[] => {
        const data: DataPoint[] = [];
        const n = 50;

        for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI;
            const radius = 0.3 + Math.random() * 0.2;
            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.1;
            const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.1;

            data.push({
                id: `moon-${i}`,
                x: x + 0.5,
                y: y + 0.5,
                label: 0,
                color: datasets.moons.color0
            });
        }

        for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI;
            const radius = 0.3 + Math.random() * 0.2;
            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.1;
            const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.1;

            data.push({
                id: `moon-${i + n}`,
                x: -x + 0.5,
                y: -y + 0.5,
                label: 1,
                color: datasets.moons.color1
            });
        }

        return data;
    };

    const generateCirclesData = (): DataPoint[] => {
        const data: DataPoint[] = [];
        const n = 40;

        // Inner circle
        for (let i = 0; i < n; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.random() * 0.15;
            const x = Math.cos(angle) * radius + 0.5;
            const y = Math.sin(angle) * radius + 0.5;

            data.push({
                id: `circle-inner-${i}`,
                x,
                y,
                label: 0,
                color: datasets.circles.color0
            });
        }

        // Outer circle
        for (let i = 0; i < n; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = 0.25 + Math.random() * 0.15;
            const x = Math.cos(angle) * radius + 0.5;
            const y = Math.sin(angle) * radius + 0.5;

            data.push({
                id: `circle-outer-${i}`,
                x,
                y,
                label: 1,
                color: datasets.circles.color1
            });
        }

        return data;
    };

    const generateLinearData = (): DataPoint[] => {
        const data: DataPoint[] = [];
        const n = 50;

        for (let i = 0; i < n; i++) {
            const x = Math.random();
            const y = Math.random();
            const label = x + y > 1 ? 1 : 0;

            data.push({
                id: `linear-${i}`,
                x,
                y,
                label,
                color: label === 0 ? datasets.linear.color0 : datasets.linear.color1
            });
        }

        return data;
    };

    const generateDataset = (datasetName: string): DataPoint[] => {
        switch (datasetName) {
            case 'moons':
                return generateMoonsData();
            case 'circles':
                return generateCirclesData();
            case 'linear':
                return generateLinearData();
            default:
                return generateMoonsData();
        }
    };

    // 7. D3 VISUALIZATION
    // ============================================================================
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = dimensions.width;
        const height = dimensions.height;
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
            .domain([0, 1])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 1])
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

        // Draw decision boundary
        if (parameters.showDecisionBoundary && results.decisionBoundary.length > 0) {
            const boundaryData = results.decisionBoundary;
            const uniqueLabels = [...new Set(boundaryData.map(d => d.label))];

            uniqueLabels.forEach(label => {
                const labelData = boundaryData.filter(d => d.label === label);
                const color = label === 0 ? datasets[selectedDataset].color0 :
                    datasets[selectedDataset].color1;

                g.selectAll(`.boundary-${label}`)
                    .data(labelData)
                    .enter()
                    .append('circle')
                    .attr('class', `boundary-${label}`)
                    .attr('cx', d => xScale(d.x))
                    .attr('cy', d => yScale(d.y))
                    .attr('r', 3)
                    .style('fill', color)
                    .style('opacity', 0.2);
            });
        }

        // Draw training data points
        g.selectAll('.training-point')
            .data(trainingData)
            .enter()
            .append('circle')
            .attr('class', 'training-point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 4)
            .style('fill', d => d.color)
            .style('stroke', '#374151')
            .style('stroke-width', 1)
            .style('opacity', 0.8);

        // Draw test points
        g.selectAll('.test-point')
            .data(testPoints)
            .enter()
            .append('circle')
            .attr('class', 'test-point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 6)
            .style('fill', d => d.color)
            .style('stroke', '#1f2937')
            .style('stroke-width', 2)
            .style('opacity', 0.9)
            .style('cursor', 'pointer')
            .on('click', (_, d) => {
                setSelectedTestPoint(d);
                const neighbors = findNearestNeighbors(d, trainingData, parameters.k);
                setResults(prev => ({
                    ...prev,
                    nearestNeighbors: neighbors
                }));
            });

        // Draw distance lines to nearest neighbors
        if (parameters.showDistanceLines && selectedTestPoint && results.nearestNeighbors.length > 0) {
            g.selectAll('.distance-line')
                .data(results.nearestNeighbors)
                .join(
                    enter => enter.append('line')
                        .attr('class', 'distance-line')
                        .attr('x1', () => xScale(selectedTestPoint.x))
                        .attr('y1', () => yScale(selectedTestPoint.y))
                        .attr('x2', d => xScale(d.point.x))
                        .attr('y2', d => yScale(d.point.y))
                        .style('stroke', '#ef4444')
                        .style('stroke-width', 2)
                        .style('stroke-dasharray', '3,3')
                        .style('opacity', 0.7),
                    update => update
                        .attr('x1', () => xScale(selectedTestPoint.x))
                        .attr('y1', () => yScale(selectedTestPoint.y))
                        .attr('x2', d => xScale(d.point.x))
                        .attr('y2', d => yScale(d.point.y)),
                    exit => exit.remove()
                );
        } else {
            // Clear distance lines if not showing
            g.selectAll('.distance-line').remove();
        }

        // Add labels if enabled
        if (showLabels) {
            g.selectAll('.data-label')
                .data(trainingData.slice(0, 10)) // Show only first 10 labels to avoid clutter
                .join(
                    enter => enter.append('text')
                        .attr('class', 'data-label')
                        .attr('x', d => xScale(d.x) + 8)
                        .attr('y', d => yScale(d.y) - 8)
                        .text(d => d.id)
                        .style('font-size', '10px')
                        .style('fill', '#374151')
                        .style('pointer-events', 'none'),
                    update => update
                        .attr('x', d => xScale(d.x) + 8)
                        .attr('y', d => yScale(d.y) - 8),
                    exit => exit.remove()
                );
        } else {
            // Clear labels if not showing
            g.selectAll('.data-label').remove();
        }

        // Add click handler for placing test points
        g.append('rect')
            .attr('class', 'click-handler')
            .attr('width', innerWidth)
            .attr('height', innerHeight)
            .attr('fill', isPlacingPoint ? 'rgba(59, 130, 246, 0.1)' : 'transparent')
            .style('pointer-events', 'all')
            .style('cursor', isPlacingPoint ? 'crosshair' : 'default')
            .on('click', (event) => {
                if (isPlacingPoint) {
                    const [x, y] = d3.pointer(event, g.node());
                    const xValue = xScale.invert(x);
                    const yValue = yScale.invert(y);

                    const newTestPoint: DataPoint = {
                        id: `test-${Date.now()}`,
                        x: xValue,
                        y: yValue,
                        label: 0,
                        color: '#6b7280',
                        isTestPoint: true
                    };

                    setTestPoints(prev => [...prev, newTestPoint]);
                    setIsPlacingPoint(false);
                }
            });
    };

    // 8. EFFECTS FOR VISUALIZATION UPDATES
    // ============================================================================
    useEffect(() => {
        const newData = generateDataset(selectedDataset);
        setTrainingData(newData);
        setTestPoints([]);
        setResults({ predictions: [], nearestNeighbors: [], decisionBoundary: [] });
    }, [selectedDataset]);

    useEffect(() => {
        drawVisualization();
    }, [trainingData, testPoints, parameters, results, selectedTestPoint, showGrid, showLabels, dimensions, isPlacingPoint]);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: Math.min(800, rect.width - 40), height: 600 });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 9. EVENT HANDLERS
    // ============================================================================
    const handleParameterChange = (key: keyof KNNParameters, value: any) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    const resetSimulation = () => {
        setTestPoints([]);
        setSelectedTestPoint(null);
        setResults({ predictions: [], nearestNeighbors: [], decisionBoundary: [] });
        setIsPlacingPoint(false);
    };

    const clearTestPoints = () => {
        setTestPoints([]);
        setSelectedTestPoint(null);
        setResults(prev => ({
            ...prev,
            predictions: [],
            nearestNeighbors: []
        }));
    };

    // 10. RENDER SIMULATION
    // ============================================================================
    return (
        <div className="k-nearest-neighbors fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">K Nearest Neighbors Explorer</h1>
                    <p className="page-description">
                        Explore the K-Nearest Neighbors algorithm through interactive visualization.
                        Place test points and see how the algorithm classifies them based on their nearest neighbors.
                    </p>
                </div>

                {/* STANDARDIZED SIMULATION LAYOUT */}
                <div className="simulation-layout">
                    {/* VISUALIZATION PANEL */}
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">KNN Classification</h2>
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
                            </div>
                        </div>
                        <div className="visualization-container" ref={containerRef}>
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                    </div>

                    {/* CONTROLS PANEL */}
                    <div className="controls-panel">
                        {/* DATASET SELECTION CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Dataset</h3>
                            </div>
                            <div className="card-body">
                                <div className="input-group">
                                    <label className="label">Select Dataset</label>
                                    <select
                                        value={selectedDataset}
                                        onChange={(e) => setSelectedDataset(e.target.value)}
                                        className="input"
                                    >
                                        <option value="moons">Two Moons</option>
                                        <option value="circles">Concentric Circles</option>
                                        <option value="linear">Linear Separation</option>
                                    </select>
                                </div>
                                <p className="dataset-description">
                                    {datasets[selectedDataset].description}
                                </p>
                            </div>
                        </div>

                        {/* PARAMETER CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">KNN Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">K Value: {parameters.k}</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="1"
                                            value={parameters.k}
                                            onChange={(e) => handleParameterChange('k', parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <div className="slider-labels">
                                            <span>1</span>
                                            <span>10</span>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Distance Metric</label>
                                        <select
                                            value={parameters.distanceMetric}
                                            onChange={(e) => handleParameterChange('distanceMetric', e.target.value)}
                                            className="input"
                                        >
                                            <option value="euclidean">Euclidean</option>
                                            <option value="manhattan">Manhattan</option>
                                            <option value="minkowski">Minkowski</option>
                                        </select>
                                    </div>

                                    <div className="checkbox-group">
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={parameters.showDecisionBoundary}
                                                onChange={(e) => handleParameterChange('showDecisionBoundary', e.target.checked)}
                                            />
                                            Show Decision Boundary
                                        </label>
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={parameters.showDistanceLines}
                                                onChange={(e) => handleParameterChange('showDistanceLines', e.target.checked)}
                                            />
                                            Show Distance Lines
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* INTERACTION CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Interaction</h3>
                            </div>
                            <div className="card-body">
                                <div className="interaction-controls">
                                    <button
                                        onClick={() => setIsPlacingPoint(!isPlacingPoint)}
                                        className={`btn ${isPlacingPoint ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        {isPlacingPoint ? 'Click to Place Point' : 'Place Test Point'}
                                    </button>
                                    <button
                                        onClick={clearTestPoints}
                                        className="btn btn-secondary"
                                    >
                                        Clear Test Points
                                    </button>
                                    <button
                                        onClick={runKNNClassification}
                                        className="btn btn-primary"
                                        disabled={isAnimating}
                                    >
                                        {isAnimating ? 'Classifying...' : 'Run Classification'}
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

                        {/* RESULTS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Results</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    <div className="result-item">
                                        <span className="result-label">Test Points:</span>
                                        <span className="result-value">{testPoints.length}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">K Value:</span>
                                        <span className="result-value">{parameters.k}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Distance Metric:</span>
                                        <span className="result-value">{parameters.distanceMetric}</span>
                                    </div>
                                </div>

                                {selectedTestPoint && results.nearestNeighbors.length > 0 && (
                                    <div className="nearest-neighbors">
                                        <h4>Nearest Neighbors</h4>
                                        <div className="neighbors-list">
                                            {results.nearestNeighbors.map((neighbor, index) => (
                                                <div key={index} className="neighbor-item">
                                                    <span className="neighbor-label">#{index + 1}</span>
                                                    <span className="neighbor-distance">
                                                        {neighbor.distance.toFixed(3)}
                                                    </span>
                                                    <span className="neighbor-class">
                                                        Class {neighbor.point.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ENHANCED EDUCATIONAL SECTION */}
                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding K-Nearest Neighbors (KNN)</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is K-Nearest Neighbors?</h4>
                                <p>
                                    K-Nearest Neighbors (KNN) is one of the simplest machine learning algorithms.
                                    Think of it like asking your neighbors for advice - when you need to make a decision,
                                    you look at what your closest neighbors are doing and follow the majority.
                                    KNN works the same way with data points.
                                </p>

                                <h4>Step-by-Step Guide: How to Use This Tool</h4>

                                <h5>Step 1: Choose Your Dataset</h5>
                                <p>
                                    <strong>Two Moons:</strong> Non-linear data that curves like crescent moons.
                                    This shows how KNN can handle complex patterns that straight lines can't separate.
                                </p>
                                <p>
                                    <strong>Concentric Circles:</strong> Data arranged in circles within circles.
                                    This demonstrates how KNN can find patterns in circular arrangements.
                                </p>
                                <p>
                                    <strong>Linear Separation:</strong> Data that can be separated by a straight line.
                                    This is the simplest case where KNN works very well.
                                </p>

                                <h5>Step 2: Understand the K Value</h5>
                                <p>
                                    The <strong>K value</strong> is the number of nearest neighbors the algorithm considers when making a decision:
                                </p>
                                <ul>
                                    <li><strong>K = 1:</strong> Only looks at the single closest neighbor. Very sensitive to noise and outliers.</li>
                                    <li><strong>K = 3:</strong> Looks at the 3 closest neighbors and takes a majority vote. Good balance.</li>
                                    <li><strong>K = 5 or higher:</strong> More stable but may miss important local patterns.</li>
                                </ul>
                                <p>
                                    <strong>Why this matters:</strong> Lower K values create more complex, wiggly decision boundaries that can overfit to noise.
                                    Higher K values create smoother boundaries that are more stable but may miss important details.
                                </p>

                                <h5>Step 3: Place Test Points</h5>
                                <ol>
                                    <li>Click the <strong>"Place Test Point"</strong> button</li>
                                    <li>Notice the visualization gets a blue tint and your cursor becomes a crosshair</li>
                                    <li>Click anywhere on the visualization to place a gray test point</li>
                                    <li>You can place multiple test points to see how different locations get classified</li>
                                </ol>
                                <p>
                                    <strong>What you're doing:</strong> These gray points represent new, unknown data that you want to classify.
                                    In real life, this could be a new customer, a new medical case, or a new image you want to identify.
                                </p>

                                <h5>Step 4: Run Classification</h5>
                                <ol>
                                    <li>Click <strong>"Run Classification"</strong> to classify all your test points</li>
                                    <li>Watch as your gray test points change color (blue or red) based on their predicted class</li>
                                    <li>Toggle <strong>"Show Decision Boundary"</strong> to see the colored regions showing where each class would be predicted</li>
                                </ol>
                                <p>
                                    <strong>What's happening:</strong> For each test point, the algorithm finds its K nearest training points,
                                    looks at their colors (classes), and assigns the test point the color that appears most often among its neighbors.
                                </p>

                                <h5>Step 5: Explore the Results</h5>
                                <ol>
                                    <li>Click on any classified test point to see its nearest neighbors</li>
                                    <li>Red dashed lines will appear showing the connections to the K nearest training points</li>
                                    <li>Check the "Nearest Neighbors" section to see the distances and classes of each neighbor</li>
                                    <li>Try different K values to see how the decision boundary changes</li>
                                </ol>

                                <h5>Step 6: Experiment with Distance Metrics</h5>
                                <p>
                                    <strong>Euclidean Distance:</strong> Straight-line distance (like measuring with a ruler).
                                    Good for most cases and what we use in everyday life.
                                </p>
                                <p>
                                    <strong>Manhattan Distance:</strong> Distance following a grid pattern (like walking city blocks).
                                    Less sensitive to outliers and good for data with many dimensions.
                                </p>
                                <p>
                                    <strong>Minkowski Distance:</strong> A generalization that includes both Euclidean and Manhattan as special cases.
                                </p>

                                <h4>Understanding the Algorithm</h4>

                                <h5>How KNN Makes Decisions</h5>
                                <p>
                                    Imagine you're trying to decide which college to attend. You might ask your 3 closest friends
                                    (K=3) what they think, and go with the majority opinion. KNN works the same way:
                                </p>
                                <ol>
                                    <li><strong>Measure Distances:</strong> Calculate how far the new point is from all training points</li>
                                    <li><strong>Find K Nearest:</strong> Identify the K closest training points</li>
                                    <li><strong>Count Votes:</strong> See which class appears most often among these neighbors</li>
                                    <li><strong>Make Decision:</strong> Assign the new point to the most common class</li>
                                </ol>

                                <h5>Why KNN is Important</h5>
                                <ul>
                                    <li><strong>Simple to Understand:</strong> No complex math - just finding nearest neighbors</li>
                                    <li><strong>No Training Required:</strong> Unlike other algorithms, KNN doesn't need to "learn" from data first</li>
                                    <li><strong>Works with Any Data:</strong> Can handle any type of features (numbers, categories, etc.)</li>
                                    <li><strong>Interpretable:</strong> You can always see exactly why a decision was made</li>
                                </ul>

                                <h4>Real-World Applications</h4>

                                <h5>Recommendation Systems</h5>
                                <p>
                                    <strong>Netflix/Amazon:</strong> "People who liked this also liked..." - finds users with similar viewing/purchasing patterns.
                                </p>

                                <h5>Medical Diagnosis</h5>
                                <p>
                                    <strong>Disease Classification:</strong> Compare a patient's symptoms to similar cases in the database to predict the most likely diagnosis.
                                </p>

                                <h5>Image Recognition</h5>
                                <p>
                                    <strong>Photo Tagging:</strong> Facebook's automatic face recognition finds similar faces in your photos.
                                </p>

                                <h5>Credit Scoring</h5>
                                <p>
                                    <strong>Loan Approval:</strong> Banks compare new applicants to similar customers to assess risk.
                                </p>

                                <h4>Common Pitfalls and Tips</h4>

                                <h5>Choosing the Right K</h5>
                                <ul>
                                    <li><strong>Start with K = 3 or 5:</strong> Good default values for most problems</li>
                                    <li><strong>Avoid even K values:</strong> Can lead to ties when classes are split equally</li>
                                    <li><strong>Consider your data size:</strong> K should be much smaller than your total number of training examples</li>
                                </ul>

                                <h5>When KNN Works Well</h5>
                                <ul>
                                    <li>Small to medium datasets (less than 10,000 examples)</li>
                                    <li>Data with clear patterns and not too much noise</li>
                                    <li>When you need to understand why decisions were made</li>
                                    <li>When you have time to compute distances for each new prediction</li>
                                </ul>

                                <h5>When to Use Other Algorithms</h5>
                                <ul>
                                    <li>Very large datasets (KNN becomes slow)</li>
                                    <li>High-dimensional data (curse of dimensionality)</li>
                                    <li>When you need very fast predictions</li>
                                    <li>When data has many irrelevant features</li>
                                </ul>

                                <h4>Key Takeaways</h4>
                                <p>
                                    KNN is a powerful, intuitive algorithm that's perfect for learning machine learning concepts.
                                    By experimenting with different K values, distance metrics, and datasets, you'll develop an
                                    intuitive understanding of how classification works and when different approaches are most effective.
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

export default KNearestNeighbors;