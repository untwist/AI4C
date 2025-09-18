import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './LinearRegression.css';

interface DataPoint {
    x: number;
    y: number;
    id: string;
}

interface RegressionResult {
    slope: number;
    intercept: number;
    rSquared: number;
    residuals: number[];
    predictions: number[];
}

interface Dataset {
    name: string;
    description: string;
    xLabel: string;
    yLabel: string;
    data: DataPoint[];
    color: string;
}

const LinearRegression: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedDataset, setSelectedDataset] = useState<string>('housing');
    const [learningRate, setLearningRate] = useState<number>(0.01);
    const [iterations, setIterations] = useState<number>(100);
    const [regularization, setRegularization] = useState<number>(0);
    const [showResiduals, setShowResiduals] = useState<boolean>(false);
    const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);

    // Sample datasets
    const datasets: { [key: string]: Dataset } = {
        housing: {
            name: 'Housing Prices',
            description: 'House size vs price relationship with realistic market data',
            xLabel: 'Size (sq ft)',
            yLabel: 'Price ($)',
            color: '#3b82f6',
            data: [
                { x: 1200, y: 250000, id: '1' },
                { x: 1500, y: 320000, id: '2' },
                { x: 1800, y: 380000, id: '3' },
                { x: 2000, y: 420000, id: '4' },
                { x: 2200, y: 450000, id: '5' },
                { x: 1600, y: 350000, id: '6' },
                { x: 1900, y: 400000, id: '7' },
                { x: 2100, y: 430000, id: '8' },
                { x: 1400, y: 300000, id: '9' },
                { x: 1700, y: 370000, id: '10' },
                { x: 2300, y: 480000, id: '11' },
                { x: 1300, y: 280000, id: '12' },
                { x: 2000, y: 410000, id: '13' },
                { x: 1800, y: 390000, id: '14' },
                { x: 1500, y: 330000, id: '15' },
                { x: 2500, y: 520000, id: '16' },
                { x: 1100, y: 240000, id: '17' },
                { x: 2400, y: 500000, id: '18' },
                { x: 1650, y: 360000, id: '19' },
                { x: 1950, y: 405000, id: '20' }
            ]
        },
        stock: {
            name: 'Stock Analysis',
            description: 'Company revenue vs stock price correlation',
            xLabel: 'Revenue (M$)',
            yLabel: 'Stock Price ($)',
            color: '#10b981',
            data: [
                { x: 100, y: 25, id: '1' },
                { x: 150, y: 35, id: '2' },
                { x: 200, y: 45, id: '3' },
                { x: 250, y: 55, id: '4' },
                { x: 300, y: 65, id: '5' },
                { x: 120, y: 28, id: '6' },
                { x: 180, y: 42, id: '7' },
                { x: 220, y: 48, id: '8' },
                { x: 280, y: 58, id: '9' },
                { x: 320, y: 68, id: '10' },
                { x: 90, y: 22, id: '11' },
                { x: 160, y: 38, id: '12' },
                { x: 210, y: 46, id: '13' },
                { x: 270, y: 56, id: '14' },
                { x: 310, y: 66, id: '15' },
                { x: 350, y: 75, id: '16' },
                { x: 80, y: 20, id: '17' },
                { x: 190, y: 40, id: '18' },
                { x: 240, y: 52, id: '19' },
                { x: 290, y: 62, id: '20' }
            ]
        },
        temperature: {
            name: 'Temperature vs Ice Cream',
            description: 'Temperature correlation with ice cream sales',
            xLabel: 'Temperature (°F)',
            yLabel: 'Sales ($)',
            color: '#f59e0b',
            data: [
                { x: 65, y: 120, id: '1' },
                { x: 70, y: 150, id: '2' },
                { x: 75, y: 180, id: '3' },
                { x: 80, y: 220, id: '4' },
                { x: 85, y: 260, id: '5' },
                { x: 68, y: 135, id: '6' },
                { x: 72, y: 165, id: '7' },
                { x: 78, y: 195, id: '8' },
                { x: 82, y: 235, id: '9' },
                { x: 87, y: 275, id: '10' },
                { x: 63, y: 110, id: '11' },
                { x: 77, y: 185, id: '12' },
                { x: 83, y: 245, id: '13' },
                { x: 88, y: 285, id: '14' },
                { x: 71, y: 160, id: '15' },
                { x: 90, y: 300, id: '16' },
                { x: 62, y: 105, id: '17' },
                { x: 76, y: 175, id: '18' },
                { x: 84, y: 250, id: '19' },
                { x: 89, y: 290, id: '20' }
            ]
        }
    };

    // Simple linear regression using gradient descent
    const performLinearRegression = (data: DataPoint[], learningRate: number, iterations: number, regularization: number): RegressionResult => {
        let slope = 0;
        let intercept = 0;
        const n = data.length;

        // Normalize data for better convergence
        const xValues = data.map(d => d.x);
        const yValues = data.map(d => d.y);
        const xMean = xValues.reduce((a, b) => a + b, 0) / n;
        const yMean = yValues.reduce((a, b) => a + b, 0) / n;
        const xStd = Math.sqrt(xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / n);
        const yStd = Math.sqrt(yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / n);

        // Normalize data
        const normalizedData = data.map(d => ({
            x: (d.x - xMean) / xStd,
            y: (d.y - yMean) / yStd
        }));

        // Gradient descent
        for (let i = 0; i < iterations; i++) {
            let slopeGradient = 0;
            let interceptGradient = 0;

            normalizedData.forEach(point => {
                const prediction = slope * point.x + intercept;
                const error = prediction - point.y;
                slopeGradient += error * point.x;
                interceptGradient += error;
            });

            slopeGradient /= n;
            interceptGradient /= n;

            // Add regularization
            slopeGradient += regularization * slope;
            interceptGradient += regularization * intercept;

            slope -= learningRate * slopeGradient;
            intercept -= learningRate * interceptGradient;
        }

        // Denormalize coefficients
        const denormalizedSlope = slope * (yStd / xStd);
        const denormalizedIntercept = yMean - denormalizedSlope * xMean;

        // Calculate predictions and residuals
        const predictions = data.map(d => denormalizedSlope * d.x + denormalizedIntercept);
        const residuals = data.map((d, i) => d.y - predictions[i]);

        // Calculate R-squared
        const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
        const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        const rSquared = 1 - (ssRes / ssTot);

        return {
            slope: denormalizedSlope,
            intercept: denormalizedIntercept,
            rSquared,
            residuals,
            predictions
        };
    };

    // Perform regression when parameters change
    useEffect(() => {
        const dataset = datasets[selectedDataset];
        if (dataset) {
            console.log('🔄 Performing linear regression:', {
                dataset: selectedDataset,
                learningRate,
                iterations,
                regularization,
                dataPoints: dataset.data.length
            });

            const result = performLinearRegression(dataset.data, learningRate, iterations, regularization);
            setRegressionResult(result);

            console.log('✅ Regression completed:', {
                slope: result.slope,
                intercept: result.intercept,
                rSquared: result.rSquared
            });
        }
    }, [selectedDataset, learningRate, iterations, regularization]);

    // Draw visualization
    useEffect(() => {
        if (!regressionResult || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const dataset = datasets[selectedDataset];
        const containerWidth = 700;
        const containerHeight = 450;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };

        // Create main SVG
        svg
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("border", "1px solid #e5e7eb")
            .style("border-radius", "8px")
            .style("background", "white");

        // Create scales
        const xExtent = d3.extent(dataset.data, d => d.x) as [number, number];
        const yExtent = d3.extent(dataset.data, d => d.y) as [number, number];

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([margin.left, containerWidth - margin.right]);

        const yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([containerHeight - margin.bottom, margin.top]);

        // Create axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format(".0f"));
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d3.format(".0f"));

        svg.append("g")
            .attr("transform", `translate(0, ${containerHeight - margin.bottom})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#6b7280");

        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#6b7280");

        // Add axis labels
        svg.append("text")
            .attr("x", containerWidth / 2)
            .attr("y", containerHeight - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(dataset.xLabel);

        svg.append("text")
            .attr("x", 15)
            .attr("y", containerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90, 15, " + (containerHeight / 2) + ")")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(dataset.yLabel);

        // Draw regression line
        const line = d3.line<{ x: number, y: number }>()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y));

        const lineData = [
            { x: xExtent[0], y: regressionResult.slope * xExtent[0] + regressionResult.intercept },
            { x: xExtent[1], y: regressionResult.slope * xExtent[1] + regressionResult.intercept }
        ];

        svg.append("path")
            .datum(lineData)
            .attr("d", line)
            .style("fill", "none")
            .style("stroke", "#ef4444")
            .style("stroke-width", "3px")
            .style("stroke-dasharray", "5,5");

        // Draw data points
        svg.selectAll(".data-point")
            .data(dataset.data)
            .enter()
            .append("circle")
            .attr("class", "data-point")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 6)
            .style("fill", dataset.color)
            .style("stroke", "#ffffff")
            .style("stroke-width", "2px")
            .style("cursor", "pointer")
            .on("mouseover", function (_, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8);

                // Show tooltip
                const tooltip = svg.append("g")
                    .attr("class", "tooltip")
                    .style("pointer-events", "none");

                tooltip.append("rect")
                    .attr("x", xScale(d.x) - 30)
                    .attr("y", yScale(d.y) - 25)
                    .attr("width", 60)
                    .attr("height", 20)
                    .attr("rx", 4)
                    .style("fill", "#1f2937")
                    .style("opacity", 0.9);

                tooltip.append("text")
                    .attr("x", xScale(d.x))
                    .attr("y", yScale(d.y) - 12)
                    .attr("text-anchor", "middle")
                    .style("font-size", "11px")
                    .style("fill", "white")
                    .text(`(${d.x}, ${d.y})`);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 6);

                svg.selectAll(".tooltip").remove();
            });

        // Draw residuals if enabled
        if (showResiduals) {
            dataset.data.forEach((point, i) => {
                const prediction = regressionResult.predictions[i];

                svg.append("line")
                    .attr("x1", xScale(point.x))
                    .attr("y1", yScale(point.y))
                    .attr("x2", xScale(point.x))
                    .attr("y2", yScale(prediction))
                    .style("stroke", "#f59e0b")
                    .style("stroke-width", "2px")
                    .style("opacity", 0.7);
            });
        }

        // Add equation and R-squared
        const equationText = `y = ${regressionResult.slope.toFixed(2)}x + ${regressionResult.intercept.toFixed(2)}`;
        const rSquaredText = `R² = ${regressionResult.rSquared.toFixed(3)}`;

        svg.append("text")
            .attr("x", containerWidth - margin.right - 10)
            .attr("y", margin.top + 20)
            .attr("text-anchor", "end")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(equationText);

        svg.append("text")
            .attr("x", containerWidth - margin.right - 10)
            .attr("y", margin.top + 40)
            .attr("text-anchor", "end")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(rSquaredText);

    }, [regressionResult, selectedDataset, showResiduals]);

    return (
        <div className="linear-regression fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Linear Regression Visualizer</h1>
                    <p className="page-description">
                        Explore linear relationships in data through interactive regression analysis.
                        See how the algorithm finds the best-fit line and understand the mathematics behind it.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Regression Analysis</h2>
                            <div className="regression-stats">
                                {regressionResult && (
                                    <>
                                        <span className="stat">R²: {regressionResult.rSquared.toFixed(3)}</span>
                                        <span className="stat">Slope: {regressionResult.slope.toFixed(2)}</span>
                                        <span className="stat">Intercept: {regressionResult.intercept.toFixed(2)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="visualization-container">
                            <div className="visualization-instructions">
                                <strong>💡 Tips:</strong> Hover over points to see values • Toggle residuals to see prediction errors
                            </div>
                            <svg ref={svgRef} className="regression-svg"></svg>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Dataset Selection</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-controls">
                                    <label className="label">Choose Dataset</label>
                                    <select
                                        value={selectedDataset}
                                        onChange={(e) => setSelectedDataset(e.target.value)}
                                        className="input"
                                    >
                                        <option value="housing">Housing Prices</option>
                                        <option value="stock">Stock Analysis</option>
                                        <option value="temperature">Temperature vs Ice Cream</option>
                                    </select>
                                    <p className="dataset-description">
                                        {datasets[selectedDataset]?.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Algorithm Parameters</h3>
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
                                            value={learningRate}
                                            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{learningRate.toFixed(3)}</span>
                                        <small className="parameter-help">Controls how fast the algorithm learns</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Iterations</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="1000"
                                            step="10"
                                            value={iterations}
                                            onChange={(e) => setIterations(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{iterations}</span>
                                        <small className="parameter-help">Number of training iterations</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Regularization</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.1"
                                            step="0.001"
                                            value={regularization}
                                            onChange={(e) => setRegularization(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{regularization.toFixed(3)}</span>
                                        <small className="parameter-help">Prevents overfitting (0 = no regularization)</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Visualization Options</h3>
                            </div>
                            <div className="card-body">
                                <div className="visualization-controls">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={showResiduals}
                                            onChange={(e) => setShowResiduals(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Residuals
                                    </label>
                                    <small className="control-help">
                                        Display vertical lines showing prediction errors
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Model Performance</h3>
                            </div>
                            <div className="card-body">
                                {regressionResult && (
                                    <div className="performance-metrics">
                                        <div className="metric">
                                            <span className="metric-label">R-squared:</span>
                                            <span className="metric-value">{regressionResult.rSquared.toFixed(3)}</span>
                                            <div className="metric-bar">
                                                <div
                                                    className="metric-fill"
                                                    style={{ width: `${regressionResult.rSquared * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Mean Absolute Error:</span>
                                            <span className="metric-value">
                                                {(regressionResult.residuals.reduce((sum, r) => sum + Math.abs(r), 0) / regressionResult.residuals.length).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Root Mean Square Error:</span>
                                            <span className="metric-value">
                                                {Math.sqrt(regressionResult.residuals.reduce((sum, r) => sum + r * r, 0) / regressionResult.residuals.length).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">How It Works</h3>
                            </div>
                            <div className="card-body">
                                <div className="explanation-steps">
                                    <div className="step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <strong>Start with random line</strong>
                                            <p>Begin with random slope and intercept values</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Calculate errors</strong>
                                            <p>Measure how far predictions are from actual values</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Update parameters</strong>
                                            <p>Adjust slope and intercept to reduce errors</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">4</div>
                                        <div className="step-content">
                                            <strong>Repeat until convergence</strong>
                                            <p>Continue until the line fits the data best</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Linear Regression</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is Linear Regression?</h4>
                                <p>
                                    Linear regression is a statistical method that finds the best straight line through a set of data points.
                                    It's one of the most fundamental algorithms in machine learning and data science, used to understand
                                    relationships between variables and make predictions.
                                </p>

                                <h4>Key Concepts</h4>
                                <ul>
                                    <li><strong>Slope:</strong> How much y changes for each unit change in x</li>
                                    <li><strong>Intercept:</strong> The value of y when x is zero</li>
                                    <li><strong>R-squared:</strong> Measures how well the line fits the data (0-1 scale)</li>
                                    <li><strong>Residuals:</strong> The difference between actual and predicted values</li>
                                    <li><strong>Gradient Descent:</strong> The algorithm that finds the best line</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Real Estate:</strong> Predicting house prices based on size, location, features</li>
                                    <li><strong>Finance:</strong> Stock price prediction, risk assessment</li>
                                    <li><strong>Marketing:</strong> Sales forecasting, customer lifetime value</li>
                                    <li><strong>Healthcare:</strong> Drug dosage calculations, treatment outcomes</li>
                                    <li><strong>Sports:</strong> Player performance analysis, game predictions</li>
                                </ul>

                                <h4>When to Use Linear Regression</h4>
                                <ul>
                                    <li><strong>Linear relationships:</strong> When variables have a straight-line relationship</li>
                                    <li><strong>Prediction:</strong> When you need to forecast future values</li>
                                    <li><strong>Understanding:</strong> When you want to quantify relationships</li>
                                    <li><strong>Baseline model:</strong> As a starting point for more complex algorithms</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {selectedDataset === 'housing' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Housing Market Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding the Housing Dataset</h4>
                                    <p>
                                        This dataset simulates real housing market data where we're trying to predict house prices
                                        based on square footage. In real estate, size is often the strongest predictor of price,
                                        but other factors like location, age, and amenities also play important roles.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>🏠 Size vs Price Relationship</h5>
                                            <p>
                                                Generally, larger houses cost more, but the relationship isn't always perfectly linear.
                                                The slope tells us how much the price increases per square foot.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>📈 Market Trends</h5>
                                            <p>
                                                The intercept represents the base price for a house with zero square feet (theoretical),
                                                while the slope shows the price per square foot in this market.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>🎯 Prediction Accuracy</h5>
                                            <p>
                                                R-squared values close to 1 indicate a strong linear relationship, while lower values
                                                suggest other factors (location, age, amenities) also affect price.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Real Estate Applications</h4>
                                        <ul>
                                            <li><strong>Property Valuation:</strong> Estimate market value for listings</li>
                                            <li><strong>Investment Analysis:</strong> Identify undervalued properties</li>
                                            <li><strong>Market Research:</strong> Understand local price trends</li>
                                            <li><strong>Insurance:</strong> Calculate replacement costs</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'stock' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Stock Market Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding the Stock Dataset</h4>
                                    <p>
                                        This dataset shows the relationship between company revenue and stock price. In finance,
                                        revenue is often a key indicator of company performance, but stock prices are influenced
                                        by many other factors including market sentiment, growth prospects, and industry trends.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>💰 Revenue Impact</h5>
                                            <p>
                                                The slope shows how much the stock price increases for each million in revenue.
                                                This helps investors understand the market's valuation of revenue growth.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>📊 Market Efficiency</h5>
                                            <p>
                                                High R-squared values suggest the market efficiently prices companies based on revenue,
                                                while lower values indicate other factors (growth potential, market share) matter more.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>🎯 Investment Strategy</h5>
                                            <p>
                                                Investors can use this model to identify potentially undervalued or overvalued stocks
                                                based on their revenue-to-price ratio compared to the market average.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Financial Applications</h4>
                                        <ul>
                                            <li><strong>Valuation Models:</strong> Estimate fair stock prices</li>
                                            <li><strong>Investment Screening:</strong> Identify investment opportunities</li>
                                            <li><strong>Risk Assessment:</strong> Understand price sensitivity to revenue</li>
                                            <li><strong>Portfolio Management:</strong> Balance revenue-based and growth stocks</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'temperature' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Temperature vs Ice Cream Sales</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding the Temperature Dataset</h4>
                                    <p>
                                        This dataset demonstrates a classic example of correlation in business analytics.
                                        Ice cream sales naturally increase with temperature, but the relationship isn't perfect
                                        due to factors like location, competition, and customer preferences.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>🌡️ Weather Impact</h5>
                                            <p>
                                                The slope shows how much sales increase per degree of temperature rise.
                                                This helps businesses plan inventory and staffing based on weather forecasts.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>📈 Seasonal Planning</h5>
                                            <p>
                                                The intercept represents base sales at zero temperature (theoretical),
                                                while the slope helps predict sales during different weather conditions.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>🎯 Business Strategy</h5>
                                            <p>
                                                High R-squared values indicate temperature is a strong predictor, while lower values
                                                suggest other factors (location, marketing, competition) also affect sales.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Retail Applications</h4>
                                        <ul>
                                            <li><strong>Inventory Management:</strong> Stock levels based on weather forecasts</li>
                                            <li><strong>Staffing:</strong> Schedule more employees on hot days</li>
                                            <li><strong>Marketing:</strong> Promote ice cream during warm weather</li>
                                            <li><strong>Location Planning:</strong> Choose store locations in warmer climates</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Limitations and Best Practices</h3>
                        </div>
                        <div className="card-body">
                            <div className="limitations-content">
                                <h4>When Linear Regression Works Well</h4>
                                <ul>
                                    <li><strong>Linear relationships:</strong> When variables have a straight-line relationship</li>
                                    <li><strong>Continuous data:</strong> Both input and output are numerical</li>
                                    <li><strong>Independent observations:</strong> Data points don't influence each other</li>
                                    <li><strong>Normal distribution:</strong> Residuals are normally distributed</li>
                                </ul>

                                <h4>Common Limitations</h4>
                                <ul>
                                    <li><strong>Non-linear relationships:</strong> Can't capture curved or complex patterns</li>
                                    <li><strong>Outliers:</strong> Extreme values can skew the line significantly</li>
                                    <li><strong>Correlation vs causation:</strong> Doesn't prove that one variable causes the other</li>
                                    <li><strong>Overfitting:</strong> Can memorize training data instead of learning patterns</li>
                                </ul>

                                <h4>Best Practices</h4>
                                <ul>
                                    <li><strong>Check assumptions:</strong> Verify linearity, normality, and independence</li>
                                    <li><strong>Handle outliers:</strong> Investigate and potentially remove extreme values</li>
                                    <li><strong>Feature engineering:</strong> Transform variables to create linear relationships</li>
                                    <li><strong>Cross-validation:</strong> Test on unseen data to avoid overfitting</li>
                                    <li><strong>Regularization:</strong> Use L1/L2 regularization to prevent overfitting</li>
                                </ul>

                                <h4>Alternative Approaches</h4>
                                <ul>
                                    <li><strong>Polynomial regression:</strong> For curved relationships</li>
                                    <li><strong>Multiple regression:</strong> When you have multiple input variables</li>
                                    <li><strong>Ridge/Lasso regression:</strong> For handling multicollinearity</li>
                                    <li><strong>Non-linear models:</strong> Random forests, neural networks for complex patterns</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright Notice */}
                <section className="copyright-section">
                    <div className="copyright-notice">
                        <p>&copy; 2025, Todd Brous. All rights reserved.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default LinearRegression;
