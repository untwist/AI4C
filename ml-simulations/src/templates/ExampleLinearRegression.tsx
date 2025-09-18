import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './ExampleLinearRegression.css';

// ============================================================================
// EXAMPLE: LINEAR REGRESSION SIMULATION
// This shows how to use the template system for a real simulation
// ============================================================================

// 1. DEFINE DATA INTERFACES
interface DataPoint {
    id: string;
    x: number;
    y: number;
    predicted?: number;
    residual?: number;
    color: string;
}

interface RegressionParameters {
    learningRate: number;
    epochs: number;
    showLine: boolean;
    showResiduals: boolean;
}

const ExampleLinearRegression: React.FC = () => {
    // 2. SETUP REFS AND STATE
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State for data points
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [parameters, setParameters] = useState<RegressionParameters>({
        learningRate: 0.01,
        epochs: 100,
        showLine: true,
        showResiduals: false
    });

    // State for visualization controls
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    // State for results
    const [results, setResults] = useState({
        slope: 0,
        intercept: 0,
        rSquared: 0,
        mse: 0
    });

    // 3. ALGORITHM FUNCTIONS
    const generateRandomData = (): DataPoint[] => {
        const points: DataPoint[] = [];
        const trueSlope = 2;
        const trueIntercept = 10;

        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 100;
            const y = trueSlope * x + trueIntercept + (Math.random() - 0.5) * 20;
            points.push({
                id: `point_${i}`,
                x: x,
                y: y,
                color: '#3b82f6'
            });
        }

        return points;
    };

    const calculateLinearRegression = (points: DataPoint[]) => {
        const n = points.length;
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared
        const yMean = sumY / n;
        const ssRes = points.reduce((sum, p) => {
            const predicted = slope * p.x + intercept;
            return sum + Math.pow(p.y - predicted, 2);
        }, 0);
        const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
        const rSquared = 1 - (ssRes / ssTot);

        // Calculate MSE
        const mse = ssRes / n;

        return { slope, intercept, rSquared, mse };
    };

    const runRegression = () => {
        setIsAnimating(true);

        const regressionResults = calculateLinearRegression(dataPoints);
        setResults(regressionResults);

        // Update data points with predictions
        const updatedPoints = dataPoints.map(point => ({
            ...point,
            predicted: regressionResults.slope * point.x + regressionResults.intercept,
            residual: point.y - (regressionResults.slope * point.x + regressionResults.intercept)
        }));

        setDataPoints(updatedPoints);

        setTimeout(() => {
            setIsAnimating(false);
        }, 1000);
    };

    // 4. D3 VISUALIZATION
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
        const xExtent = d3.extent(dataPoints, d => d.x) as [number, number];
        const yExtent = d3.extent(dataPoints, d => d.y) as [number, number];

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

        // Draw regression line if enabled
        if (parameters.showLine && results.slope !== 0) {
            const line = d3.line<number>()
                .x(d => xScale(d))
                .y(d => yScale(results.slope * d + results.intercept));

            const xRange = [xExtent[0], xExtent[1]];

            g.append("path")
                .datum(xRange)
                .attr("class", "regression-line")
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", "#ef4444")
                .style("stroke-width", 3)
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
            .attr('r', 6)
            .style('fill', d => d.color)
            .style('stroke', '#374151')
            .style('stroke-width', 2)
            .style('opacity', 0.8);

        // Draw residuals if enabled
        if (parameters.showResiduals) {
            g.selectAll('.residual-line')
                .data(dataPoints)
                .enter()
                .append('line')
                .attr('class', 'residual-line')
                .attr('x1', d => xScale(d.x))
                .attr('y1', d => yScale(d.y))
                .attr('x2', d => xScale(d.x))
                .attr('y2', d => yScale(d.predicted || d.y))
                .style('stroke', '#f59e0b')
                .style('stroke-width', 2)
                .style('opacity', 0.7);
        }

        // Add labels if enabled
        if (showLabels) {
            g.selectAll('.data-label')
                .data(dataPoints)
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

    // 5. EFFECTS
    useEffect(() => {
        const initialData = generateRandomData();
        setDataPoints(initialData);
    }, []);

    useEffect(() => {
        drawVisualization();
    }, [dataPoints, parameters, showGrid, showLabels, results]);

    // 6. EVENT HANDLERS
    const handleParameterChange = (key: keyof RegressionParameters, value: any) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    const resetSimulation = () => {
        const newData = generateRandomData();
        setDataPoints(newData);
        setResults({ slope: 0, intercept: 0, rSquared: 0, mse: 0 });
    };

    // 7. RENDER
    return (
        <div className="example-linear-regression fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">Linear Regression Simulator</h1>
                    <p className="page-description">
                        Explore how linear regression finds the best-fit line through data points.
                        Adjust parameters and see how the algorithm minimizes prediction errors.
                    </p>
                </div>

                {/* STANDARDIZED SIMULATION LAYOUT */}
                <div className="simulation-layout">
                    {/* VISUALIZATION PANEL */}
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Regression Analysis</h2>
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
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                    </div>

                    {/* CONTROLS PANEL */}
                    <div className="controls-panel">
                        {/* PARAMETER CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Regression Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Learning Rate</label>
                                        <input
                                            type="range"
                                            min="0.001"
                                            max="0.1"
                                            step="0.001"
                                            value={parameters.learningRate}
                                            onChange={(e) => handleParameterChange('learningRate', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.learningRate.toFixed(3)}</span>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Epochs</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="500"
                                            step="10"
                                            value={parameters.epochs}
                                            onChange={(e) => handleParameterChange('epochs', parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.epochs}</span>
                                    </div>

                                    <div className="checkbox-group">
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={parameters.showLine}
                                                onChange={(e) => handleParameterChange('showLine', e.target.checked)}
                                            />
                                            Show Regression Line
                                        </label>
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={parameters.showResiduals}
                                                onChange={(e) => handleParameterChange('showResiduals', e.target.checked)}
                                            />
                                            Show Residuals
                                        </label>
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
                                    <button
                                        onClick={runRegression}
                                        className="btn btn-primary"
                                        disabled={isAnimating}
                                    >
                                        {isAnimating ? 'Calculating...' : 'Run Regression'}
                                    </button>
                                    <button
                                        onClick={resetSimulation}
                                        className="btn btn-secondary"
                                        disabled={isAnimating}
                                    >
                                        Generate New Data
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RESULTS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Regression Results</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    <div className="result-item">
                                        <span className="result-label">Slope:</span>
                                        <span className="result-value">{results.slope.toFixed(3)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Intercept:</span>
                                        <span className="result-value">{results.intercept.toFixed(3)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">R²:</span>
                                        <span className="result-value">{results.rSquared.toFixed(3)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">MSE:</span>
                                        <span className="result-value">{results.mse.toFixed(3)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STANDARDIZED EXPLANATION SECTION */}
                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Linear Regression</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>How Linear Regression Works</h4>
                                <p>
                                    Linear regression finds the best straight line through your data points by minimizing
                                    the sum of squared errors. The algorithm calculates the slope and intercept that
                                    best predict the y-values from the x-values.
                                </p>

                                <h4>Key Concepts</h4>
                                <ul>
                                    <li><strong>Slope:</strong> How much y changes for each unit change in x</li>
                                    <li><strong>Intercept:</strong> The y-value when x equals zero</li>
                                    <li><strong>R-squared:</strong> Measures how well the line fits the data (0-1)</li>
                                    <li><strong>MSE:</strong> Mean squared error - average prediction error</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Sales Forecasting:</strong> Predict sales based on advertising spend</li>
                                    <li><strong>Price Prediction:</strong> Estimate house prices from square footage</li>
                                    <li><strong>Risk Assessment:</strong> Predict loan defaults from credit scores</li>
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

export default ExampleLinearRegression;
