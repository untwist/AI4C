import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './NormalDistribution.css';


interface Dataset {
    name: string;
    description: string;
    mean: number;
    stdDev: number;
    color: string;
    realWorldContext: string;
}

const NormalDistribution: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedDataset, setSelectedDataset] = useState<string>('height');
    const [mean, setMean] = useState<number>(170);
    const [stdDev, setStdDev] = useState<number>(10);
    const [sampleSize, setSampleSize] = useState<number>(1000);
    const [showTheoretical, setShowTheoretical] = useState<boolean>(true);
    const [showHistogram, setShowHistogram] = useState<boolean>(true);
    const [showEmpirical, setShowEmpirical] = useState<boolean>(true);
    const [showPercentiles, setShowPercentiles] = useState<boolean>(false);
    const [generatedData, setGeneratedData] = useState<number[]>([]);
    const [percentiles, setPercentiles] = useState<{ [key: string]: number }>({});

    // Sample datasets representing real-world normal distributions
    const datasets: { [key: string]: Dataset } = {
        height: {
            name: 'Human Height',
            description: 'Adult male height distribution - classic example of normal distribution',
            mean: 170,
            stdDev: 10,
            color: '#3b82f6',
            realWorldContext: 'Height follows normal distribution due to genetic and environmental factors combining additively'
        },
        iq: {
            name: 'IQ Scores',
            description: 'Intelligence quotient scores with mean 100 and standard deviation 15',
            mean: 100,
            stdDev: 15,
            color: '#10b981',
            realWorldContext: 'IQ tests are designed to follow normal distribution for standardized comparison'
        },
        temperature: {
            name: 'Body Temperature',
            description: 'Human body temperature in Celsius with slight variation',
            mean: 36.8,
            stdDev: 0.4,
            color: '#f59e0b',
            realWorldContext: 'Body temperature varies normally around the set point due to homeostatic mechanisms'
        },
        test: {
            name: 'Test Scores',
            description: 'Standardized test scores with mean 75 and standard deviation 12',
            mean: 75,
            stdDev: 12,
            color: '#ef4444',
            realWorldContext: 'Educational assessments are designed to create normal distributions for fair comparison'
        },
        weight: {
            name: 'Birth Weight',
            description: 'Newborn baby weights in grams',
            mean: 3200,
            stdDev: 500,
            color: '#8b5cf6',
            realWorldContext: 'Birth weight follows normal distribution due to multiple genetic and environmental factors'
        }
    };

    // Dataset-specific ranges for realistic parameter control
    const datasetRanges = {
        height: { meanMin: 140, meanMax: 200, stdDevMin: 5, stdDevMax: 20 },
        iq: { meanMin: 70, meanMax: 130, stdDevMin: 5, stdDevMax: 25 },
        temperature: { meanMin: 35, meanMax: 39, stdDevMin: 0.1, stdDevMax: 1.0 },
        test: { meanMin: 40, meanMax: 100, stdDevMin: 5, stdDevMax: 20 },
        weight: { meanMin: 2000, meanMax: 4500, stdDevMin: 200, stdDevMax: 800 }
    };

    // Dataset-specific x-axis ranges for fixed visualization
    const datasetXAxisRanges = {
        height: { min: 120, max: 220, unit: 'cm' },
        iq: { min: 40, max: 160, unit: 'IQ Score' },
        temperature: { min: 34, max: 40, unit: '°C' },
        test: { min: 20, max: 120, unit: 'Points' },
        weight: { min: 1000, max: 5000, unit: 'grams' }
    };

    // Generate normal distribution data using Box-Muller transform
    const generateNormalData = (mean: number, stdDev: number, n: number): number[] => {
        const data: number[] = [];

        for (let i = 0; i < n; i += 2) {
            // Box-Muller transform
            const u1 = Math.random();
            const u2 = Math.random();

            const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

            data.push(mean + stdDev * z0);
            if (i + 1 < n) {
                data.push(mean + stdDev * z1);
            }
        }

        return data;
    };

    // Calculate theoretical normal distribution
    const calculateTheoreticalNormal = (x: number, mean: number, stdDev: number): number => {
        const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
        return coefficient * Math.exp(exponent);
    };

    // Calculate percentiles
    const calculatePercentiles = (data: number[]): { [key: string]: number } => {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;

        return {
            '5th': sorted[Math.floor(0.05 * n)],
            '10th': sorted[Math.floor(0.10 * n)],
            '25th': sorted[Math.floor(0.25 * n)],
            '50th': sorted[Math.floor(0.50 * n)],
            '75th': sorted[Math.floor(0.75 * n)],
            '90th': sorted[Math.floor(0.90 * n)],
            '95th': sorted[Math.floor(0.95 * n)]
        };
    };

    // Generate data when parameters change
    useEffect(() => {
        const newData = generateNormalData(mean, stdDev, sampleSize);
        setGeneratedData(newData);
        setPercentiles(calculatePercentiles(newData));
    }, [mean, stdDev, sampleSize]);

    // Update parameters when dataset changes
    useEffect(() => {
        const dataset = datasets[selectedDataset];
        if (dataset) {
            setMean(dataset.mean);
            setStdDev(dataset.stdDev);
        }
    }, [selectedDataset]);

    // Draw visualization
    useEffect(() => {
        if (!svgRef.current || generatedData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const containerWidth = 800;
        const containerHeight = 500;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };

        // Create main SVG
        svg
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("border", "1px solid #e5e7eb")
            .style("border-radius", "8px")
            .style("background", "white");

        // Use fixed x-axis range for each dataset
        const xAxisRange = datasetXAxisRanges[selectedDataset as keyof typeof datasetXAxisRanges];
        const xMin = xAxisRange.min;
        const xMax = xAxisRange.max;

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([margin.left, containerWidth - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([containerHeight - margin.bottom, margin.top]);

        // Create axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format(".1f"));
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d3.format(".2f"));

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
            .text(`Value (${datasetXAxisRanges[selectedDataset as keyof typeof datasetXAxisRanges].unit})`);

        svg.append("text")
            .attr("x", 15)
            .attr("y", containerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90, 15, " + (containerHeight / 2) + ")")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text("Density");

        // Draw histogram if enabled
        if (showHistogram) {
            const histogram = d3.histogram()
                .domain([xMin, xMax])
                .thresholds(30);

            const bins = histogram(generatedData);
            const maxCount = d3.max(bins, d => d.length) || 1;

            svg.selectAll(".histogram-bar")
                .data(bins)
                .enter()
                .append("rect")
                .attr("class", "histogram-bar")
                .attr("x", d => xScale(d.x0 || 0))
                .attr("y", d => yScale(d.length / maxCount))
                .attr("width", d => xScale(d.x1 || 0) - xScale(d.x0 || 0))
                .attr("height", d => containerHeight - margin.bottom - yScale(d.length / maxCount))
                .style("fill", datasets[selectedDataset].color)
                .style("opacity", 0.6)
                .style("stroke", "#ffffff")
                .style("stroke-width", "1px");
        }

        // Draw theoretical normal curve if enabled
        if (showTheoretical) {
            const line = d3.line<{ x: number, y: number }>()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y));

            const theoreticalData = [];
            const step = (xMax - xMin) / 200;
            for (let x = xMin; x <= xMax; x += step) {
                const density = calculateTheoreticalNormal(x, mean, stdDev);
                theoreticalData.push({ x, y: density });
            }

            svg.append("path")
                .datum(theoreticalData)
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", "#ef4444")
                .style("stroke-width", "3px")
                .style("stroke-dasharray", "5,5");
        }

        // Draw empirical curve if enabled
        if (showEmpirical) {
            const histogram = d3.histogram()
                .domain([xMin, xMax])
                .thresholds(30);

            const bins = histogram(generatedData);
            const maxCount = d3.max(bins, d => d.length) || 1;

            const line = d3.line<{ x: number, y: number }>()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y))
                .curve(d3.curveMonotoneX);

            const empiricalData = bins.map(bin => ({
                x: (bin.x0! + bin.x1!) / 2,
                y: bin.length / maxCount
            }));

            svg.append("path")
                .datum(empiricalData)
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", datasets[selectedDataset].color)
                .style("stroke-width", "3px");
        }

        // Draw percentiles if enabled
        if (showPercentiles) {
            const percentileValues = Object.entries(percentiles);
            percentileValues.forEach(([label, value]) => {
                const x = xScale(value);

                svg.append("line")
                    .attr("x1", x)
                    .attr("y1", margin.top)
                    .attr("x2", x)
                    .attr("y2", containerHeight - margin.bottom)
                    .style("stroke", "#f59e0b")
                    .style("stroke-width", "2px")
                    .style("stroke-dasharray", "3,3")
                    .style("opacity", 0.7);

                svg.append("text")
                    .attr("x", x)
                    .attr("y", margin.top - 10)
                    .attr("text-anchor", "middle")
                    .style("font-size", "11px")
                    .style("font-weight", "600")
                    .style("fill", "#f59e0b")
                    .text(label);
            });
        }

        // Add mean line
        svg.append("line")
            .attr("x1", xScale(mean))
            .attr("y1", margin.top)
            .attr("x2", xScale(mean))
            .attr("y2", containerHeight - margin.bottom)
            .style("stroke", "#374151")
            .style("stroke-width", "2px")
            .style("stroke-dasharray", "8,4");

        // Add mean label
        svg.append("text")
            .attr("x", xScale(mean))
            .attr("y", margin.top - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text("Mean");

        // Add statistics
        const stats = {
            mean: mean.toFixed(2),
            stdDev: stdDev.toFixed(2),
            sampleSize: generatedData.length,
            empiricalMean: (generatedData.reduce((a, b) => a + b, 0) / generatedData.length).toFixed(2),
            empiricalStdDev: Math.sqrt(generatedData.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / generatedData.length).toFixed(2)
        };

        svg.append("text")
            .attr("x", containerWidth - margin.right - 10)
            .attr("y", margin.top + 20)
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(`μ = ${stats.mean}`);

        svg.append("text")
            .attr("x", containerWidth - margin.right - 10)
            .attr("y", margin.top + 40)
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(`σ = ${stats.stdDev}`);

        svg.append("text")
            .attr("x", containerWidth - margin.right - 10)
            .attr("y", margin.top + 60)
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(`n = ${stats.sampleSize}`);

    }, [generatedData, mean, stdDev, showTheoretical, showHistogram, showEmpirical, showPercentiles, selectedDataset, percentiles]);

    return (
        <div className="normal-distribution fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Normal Distribution Simulator</h1>
                    <p className="page-description">
                        Explore the most important probability distribution in statistics.
                        See how the bell curve emerges from random processes and understand
                        its fundamental role in data analysis and machine learning.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Distribution Visualization</h2>
                            <div className="distribution-stats">
                                <span className="stat">Mean: {mean.toFixed(2)}</span>
                                <span className="stat">Std Dev: {stdDev.toFixed(2)}</span>
                                <span className="stat">Samples: {sampleSize}</span>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="distribution-svg"></svg>
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
                                        <option value="height">Human Height</option>
                                        <option value="iq">IQ Scores</option>
                                        <option value="temperature">Body Temperature</option>
                                        <option value="test">Test Scores</option>
                                        <option value="weight">Birth Weight</option>
                                    </select>
                                    <p className="dataset-description">
                                        {datasets[selectedDataset]?.description}
                                    </p>
                                    <div className="dataset-context">
                                        <strong>Real-world context:</strong> {datasets[selectedDataset]?.realWorldContext}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Distribution Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Mean (μ)</label>
                                        <input
                                            type="range"
                                            min={datasetRanges[selectedDataset as keyof typeof datasetRanges].meanMin}
                                            max={datasetRanges[selectedDataset as keyof typeof datasetRanges].meanMax}
                                            step={selectedDataset === 'temperature' ? "0.1" : "1"}
                                            value={mean}
                                            onChange={(e) => setMean(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{mean.toFixed(selectedDataset === 'temperature' ? 1 : 0)} {datasetXAxisRanges[selectedDataset as keyof typeof datasetXAxisRanges].unit}</span>
                                        <small className="parameter-help">Center of the distribution</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Standard Deviation (σ)</label>
                                        <input
                                            type="range"
                                            min={datasetRanges[selectedDataset as keyof typeof datasetRanges].stdDevMin}
                                            max={datasetRanges[selectedDataset as keyof typeof datasetRanges].stdDevMax}
                                            step={selectedDataset === 'temperature' ? "0.1" : "1"}
                                            value={stdDev}
                                            onChange={(e) => setStdDev(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{stdDev.toFixed(selectedDataset === 'temperature' ? 1 : 0)} {datasetXAxisRanges[selectedDataset as keyof typeof datasetXAxisRanges].unit}</span>
                                        <small className="parameter-help">Spread of the distribution</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Sample Size</label>
                                        <input
                                            type="range"
                                            min="100"
                                            max="5000"
                                            step="100"
                                            value={sampleSize}
                                            onChange={(e) => setSampleSize(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{sampleSize}</span>
                                        <small className="parameter-help">Number of data points to generate</small>
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
                                            checked={showTheoretical}
                                            onChange={(e) => setShowTheoretical(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Theoretical Curve
                                    </label>
                                    <small className="control-help">
                                        Display the mathematical normal distribution curve
                                    </small>

                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={showHistogram}
                                            onChange={(e) => setShowHistogram(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Histogram
                                    </label>
                                    <small className="control-help">
                                        Display data as histogram bars
                                    </small>

                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={showEmpirical}
                                            onChange={(e) => setShowEmpirical(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Empirical Curve
                                    </label>
                                    <small className="control-help">
                                        Display smoothed curve from actual data
                                    </small>

                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={showPercentiles}
                                            onChange={(e) => setShowPercentiles(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Percentiles
                                    </label>
                                    <small className="control-help">
                                        Display percentile markers (5th, 25th, 50th, 75th, 95th)
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Distribution Statistics</h3>
                            </div>
                            <div className="card-body">
                                <div className="statistics-display">
                                    <div className="statistic-item">
                                        <span className="statistic-label">Theoretical Mean:</span>
                                        <span className="statistic-value">{mean.toFixed(2)}</span>
                                    </div>
                                    <div className="statistic-item">
                                        <span className="statistic-label">Empirical Mean:</span>
                                        <span className="statistic-value">
                                            {(generatedData.reduce((a, b) => a + b, 0) / generatedData.length).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="statistic-item">
                                        <span className="statistic-label">Theoretical Std Dev:</span>
                                        <span className="statistic-value">{stdDev.toFixed(2)}</span>
                                    </div>
                                    <div className="statistic-item">
                                        <span className="statistic-label">Empirical Std Dev:</span>
                                        <span className="statistic-value">
                                            {Math.sqrt(generatedData.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / generatedData.length).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Percentiles</h3>
                            </div>
                            <div className="card-body">
                                <div className="percentiles-display">
                                    {Object.entries(percentiles).map(([label, value]) => (
                                        <div key={label} className="percentile-item">
                                            <span className="percentile-label">{label} Percentile:</span>
                                            <span className="percentile-value">{value.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
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
                                            <strong>Generate random data</strong>
                                            <p>Use Box-Muller transform to generate normally distributed random numbers</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Create histogram</strong>
                                            <p>Group data into bins and count frequencies</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Compare with theory</strong>
                                            <p>Overlay the mathematical normal distribution curve</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">4</div>
                                        <div className="step-content">
                                            <strong>Analyze statistics</strong>
                                            <p>Calculate mean, standard deviation, and percentiles</p>
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
                            <h3 className="card-title">How to Use This Simulation</h3>
                        </div>
                        <div className="card-body">
                            <div className="usage-instructions">
                                <h4>Interactive Controls</h4>
                                <ul>
                                    <li><strong>Dataset Selection:</strong> Choose from real-world examples like human height, IQ scores, or body temperature</li>
                                    <li><strong>Parameters:</strong> Adjust the mean (μ) and standard deviation (σ) to see how they affect the curve shape</li>
                                    <li><strong>Sample Size:</strong> Change the number of data points to see how sample size affects the histogram</li>
                                    <li><strong>Visualization Options:</strong> Toggle between theoretical curve, histogram, empirical curve, and percentiles</li>
                                </ul>

                                <h4>Key Features to Explore</h4>
                                <ul>
                                    <li><strong>Bell Curve Shape:</strong> Notice how the curve is symmetric around the mean</li>
                                    <li><strong>Standard Deviation Effect:</strong> Wider curves indicate more spread in the data</li>
                                    <li><strong>68-95-99.7 Rule:</strong> Approximately 68% of data falls within 1 standard deviation of the mean</li>
                                    <li><strong>Percentiles:</strong> Use the percentile markers to understand data distribution</li>
                                    <li><strong>Theoretical vs Empirical:</strong> Compare the mathematical curve with actual generated data</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding the Normal Distribution</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is the Normal Distribution?</h4>
                                <p>
                                    The normal distribution, also known as the Gaussian distribution, is the most important
                                    probability distribution in statistics. It's characterized by its bell-shaped curve
                                    and is defined by just two parameters: the mean (μ) and standard deviation (σ).
                                </p>

                                <h4>Mathematical Formula</h4>
                                <div className="formula">
                                    f(x) = (1/σ√(2π)) × e^(-(x-μ)²/(2σ²))
                                </div>

                                <h4>Key Properties</h4>
                                <ul>
                                    <li><strong>Symmetric:</strong> The curve is perfectly symmetric around the mean</li>
                                    <li><strong>Bell-shaped:</strong> Highest density at the mean, decreasing toward tails</li>
                                    <li><strong>68-95-99.7 Rule:</strong> 68% within 1σ, 95% within 2σ, 99.7% within 3σ</li>
                                    <li><strong>Central Limit Theorem:</strong> Sums of random variables tend to be normal</li>
                                    <li><strong>Maximum Entropy:</strong> Normal distribution has maximum entropy for given mean and variance</li>
                                </ul>

                                <h4>Understanding the Mean (μ) - The Center of the Universe</h4>
                                <div className="concept-explanation">
                                    <h5>What is the Mean?</h5>
                                    <p>
                                        The mean is the "average" value - the balancing point of your data. Think of it like the center of gravity
                                        on a seesaw. If you placed all your data points on a number line, the mean is where you'd put the fulcrum
                                        to make the seesaw perfectly balanced.
                                    </p>

                                    <h5>How to Calculate the Mean</h5>
                                    <div className="calculation-steps">
                                        <p><strong>Step 1:</strong> Add up all your numbers</p>
                                        <p><strong>Step 2:</strong> Count how many numbers you have</p>
                                        <p><strong>Step 3:</strong> Divide the sum by the count</p>
                                        <div className="formula">
                                            Mean = (Sum of all values) ÷ (Number of values)
                                        </div>
                                    </div>

                                    <h5>Intuitive Understanding</h5>
                                    <div className="intuitive-examples">
                                        <div className="example-item">
                                            <h6>Real Estate Example:</h6>
                                            <p>
                                                If you have house prices: $200k, $300k, $400k, $500k, $600k<br />
                                                Mean = ($200k + $300k + $400k + $500k + $600k) ÷ 5 = $400k<br />
                                                <em>The "typical" house price is $400k - this is your center point.</em>
                                            </p>
                                        </div>

                                        <div className="example-item">
                                            <h6>Test Scores Example:</h6>
                                            <p>
                                                If students scored: 70, 80, 85, 90, 95<br />
                                                Mean = (70 + 80 + 85 + 90 + 95) ÷ 5 = 84<br />
                                                <em>The "average" student scored 84 - this represents the class performance.</em>
                                            </p>
                                        </div>
                                    </div>

                                    <h5>Why the Mean Matters in Normal Distributions</h5>
                                    <p>
                                        In a normal distribution, the mean is where the bell curve peaks - it's the most likely value.
                                        The curve is perfectly symmetric around the mean, meaning:
                                    </p>
                                    <ul>
                                        <li>Half the data falls below the mean, half above</li>
                                        <li>The mean is the "typical" or "expected" value</li>
                                        <li>It's the center of the 68-95-99.7 rule</li>
                                    </ul>
                                </div>

                                <h4>Understanding Standard Deviation (σ) - The Measure of Spread</h4>
                                <div className="concept-explanation">
                                    <h5>What is Standard Deviation?</h5>
                                    <p>
                                        Standard deviation tells you how "spread out" your data is. Think of it as measuring the
                                        "typical distance" that data points are from the mean. It's like measuring how far people
                                        typically sit from the center of a room.
                                    </p>

                                    <h5>How to Calculate Standard Deviation</h5>
                                    <div className="calculation-steps">
                                        <p><strong>Step 1:</strong> Find the mean of your data</p>
                                        <p><strong>Step 2:</strong> For each data point, find how far it is from the mean (subtract mean from each value)</p>
                                        <p><strong>Step 3:</strong> Square each of these differences (this makes them all positive)</p>
                                        <p><strong>Step 4:</strong> Find the average of these squared differences (this is called variance)</p>
                                        <p><strong>Step 5:</strong> Take the square root of the variance</p>
                                        <div className="formula">
                                            σ = √(Σ(x - μ)² ÷ n)
                                        </div>
                                    </div>

                                    <h5>Intuitive Understanding</h5>
                                    <div className="intuitive-examples">
                                        <div className="example-item">
                                            <h6>Dart Throwing Example:</h6>
                                            <p>
                                                <strong>Small Standard Deviation:</strong> All your darts land close to the bullseye<br />
                                                <strong>Large Standard Deviation:</strong> Your darts are scattered all over the board<br />
                                                <em>Standard deviation measures your "consistency" or "accuracy"</em>
                                            </p>
                                        </div>

                                        <div className="example-item">
                                            <h6>Test Scores Example:</h6>
                                            <p>
                                                <strong>Small σ (σ = 5):</strong> Most students scored between 80-90<br />
                                                <strong>Large σ (σ = 20):</strong> Students scored anywhere from 40-120<br />
                                                <em>Standard deviation tells you how "spread out" the grades are</em>
                                            </p>
                                        </div>
                                    </div>

                                    <h5>What Standard Deviation Looks Like</h5>
                                    <div className="visual-explanation">
                                        <div className="std-dev-example">
                                            <h6>Small Standard Deviation (σ = 2)</h6>
                                            <p>Data points are clustered tightly around the mean - the bell curve is tall and narrow</p>

                                            <h6>Medium Standard Deviation (σ = 5)</h6>
                                            <p>Data points are moderately spread out - the bell curve has a moderate width</p>

                                            <h6>Large Standard Deviation (σ = 10)</h6>
                                            <p>Data points are widely scattered - the bell curve is short and wide</p>
                                        </div>
                                    </div>

                                    <h5>The 68-95-99.7 Rule</h5>
                                    <p>
                                        This is the magic of normal distributions! No matter what the mean and standard deviation are:
                                    </p>
                                    <ul>
                                        <li><strong>68%</strong> of data falls within 1 standard deviation of the mean</li>
                                        <li><strong>95%</strong> of data falls within 2 standard deviations of the mean</li>
                                        <li><strong>99.7%</strong> of data falls within 3 standard deviations of the mean</li>
                                    </ul>
                                    <p>
                                        <em>Example:</em> If mean = 100 and σ = 15, then 68% of values are between 85-115,
                                        95% are between 70-130, and 99.7% are between 55-145.
                                    </p>
                                </div>

                                <h4>Understanding Sample Size (n) - The Power of Numbers</h4>
                                <div className="concept-explanation">
                                    <h5>What is Sample Size?</h5>
                                    <p>
                                        Sample size is simply how many data points you have. But it's incredibly important!
                                        Think of it like taking a survey - the more people you ask, the more confident you can be
                                        about your results.
                                    </p>

                                    <h5>Why Sample Size Matters</h5>
                                    <div className="sample-size-effects">
                                        <div className="effect-item">
                                            <h6>Small Sample (n = 10)</h6>
                                            <p>
                                                <strong>Problem:</strong> Your histogram might look jagged and irregular<br />
                                                <strong>Why:</strong> Not enough data points to fill all the "bins" smoothly<br />
                                                <strong>Result:</strong> Hard to see the true pattern
                                            </p>
                                        </div>

                                        <div className="effect-item">
                                            <h6>Medium Sample (n = 100)</h6>
                                            <p>
                                                <strong>Improvement:</strong> Histogram starts to look more bell-shaped<br />
                                                <strong>Why:</strong> More data points fill in the gaps<br />
                                                <strong>Result:</strong> Pattern becomes clearer
                                            </p>
                                        </div>

                                        <div className="effect-item">
                                            <h6>Large Sample (n = 1000+)</h6>
                                            <p>
                                                <strong>Excellent:</strong> Histogram looks very smooth and bell-shaped<br />
                                                <strong>Why:</strong> Lots of data points create a smooth curve<br />
                                                <strong>Result:</strong> Clear normal distribution pattern emerges
                                            </p>
                                        </div>
                                    </div>

                                    <h5>The Law of Large Numbers</h5>
                                    <p>
                                        This is a fundamental principle in statistics: <strong>As your sample size increases,
                                            your sample statistics get closer to the true population parameters.</strong>
                                    </p>

                                    <div className="law-examples">
                                        <div className="example-item">
                                            <h6>Coin Flipping Example:</h6>
                                            <p>
                                                <strong>10 flips:</strong> You might get 7 heads (70%) - not very close to 50%<br />
                                                <strong>100 flips:</strong> You might get 52 heads (52%) - closer to 50%<br />
                                                <strong>1000 flips:</strong> You might get 498 heads (49.8%) - very close to 50%<br />
                                                <em>More flips = more accurate estimate of true probability</em>
                                            </p>
                                        </div>

                                        <div className="example-item">
                                            <h6>Height Measurement Example:</h6>
                                            <p>
                                                <strong>10 people:</strong> Mean might be 168cm (just by chance)<br />
                                                <strong>100 people:</strong> Mean might be 171cm (closer to true average)<br />
                                                <strong>1000 people:</strong> Mean might be 170.2cm (very close to true average)<br />
                                                <em>More people = more accurate estimate of true average height</em>
                                            </p>
                                        </div>
                                    </div>

                                    <h5>Sample Size vs. Accuracy Trade-off</h5>
                                    <div className="trade-off-explanation">
                                        <h6>The Sweet Spot</h6>
                                        <ul>
                                            <li><strong>Too Small (n &lt; 30):</strong> Results are unreliable, patterns unclear</li>
                                            <li><strong>Good Size (n = 100-500):</strong> Clear patterns, reliable statistics</li>
                                            <li><strong>Very Large (n &gt; 1000):</strong> Excellent accuracy, but diminishing returns</li>
                                        </ul>

                                        <h6>Cost vs. Benefit</h6>
                                        <p>
                                            In real research, larger samples cost more money and time. The goal is to find the
                                            minimum sample size that gives you reliable results. For normal distributions,
                                            n = 100-500 is usually sufficient to see clear patterns.
                                        </p>
                                    </div>
                                </div>

                                <h4>Common Student Misconceptions</h4>
                                <div className="misconceptions">
                                    <div className="misconception-item">
                                        <h5>"Mean is always the most common value"</h5>
                                        <p><strong>Truth:</strong> Mean is the average, not necessarily the most frequent. In normal distributions, the mean happens to be the most likely value, but this isn't always true for other distributions.</p>
                                    </div>

                                    <div className="misconception-item">
                                        <h5>"Standard deviation is just the range divided by 4"</h5>
                                        <p><strong>Truth:</strong> Standard deviation measures typical distance from the mean, not the total spread. While there's a rough relationship (range ≈ 4σ for normal distributions), they measure different things.</p>
                                    </div>

                                    <div className="misconception-item">
                                        <h5>"Bigger sample size always means better results"</h5>
                                        <p><strong>Truth:</strong> While larger samples are generally better, there are diminishing returns. A sample of 1000 isn't necessarily much better than 500, but both are much better than 10.</p>
                                    </div>

                                    <div className="misconception-item">
                                        <h5>"If data looks normal, it must be normal"</h5>
                                        <p><strong>Truth:</strong> Visual inspection isn't enough. Many distributions can look roughly bell-shaped but aren't truly normal. Statistical tests can help determine if data is actually normal.</p>
                                    </div>
                                </div>

                                <h4>Important: Simulation vs. Real-World Data Analysis</h4>
                                <div className="simulation-vs-reality">
                                    <div className="reality-explanation">
                                        <h5>In the Real World:</h5>
                                        <ul>
                                            <li><strong>We don't set parameters:</strong> We collect data and discover the mean and standard deviation through analysis</li>
                                            <li><strong>Data comes first:</strong> Scientists measure actual birth weights, heights, IQ scores, etc.</li>
                                            <li><strong>Statistics reveal patterns:</strong> We calculate the mean (170cm) and standard deviation (10cm) from real measurements</li>
                                            <li><strong>Distribution emerges:</strong> The normal curve appears naturally from the data</li>
                                        </ul>
                                    </div>

                                    <div className="simulation-explanation">
                                        <h5>In This Simulation:</h5>
                                        <ul>
                                            <li><strong>We set parameters:</strong> You can adjust the mean and standard deviation to see what happens</li>
                                            <li><strong>Educational purpose:</strong> This helps you understand how these parameters affect the distribution shape</li>
                                            <li><strong>What-if scenarios:</strong> "What would the distribution look like if the mean was 180cm instead of 170cm?"</li>
                                            <li><strong>Conceptual learning:</strong> You're learning the relationship between parameters and distribution shape</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="real-world-process">
                                    <h5>Real-World Statistical Process:</h5>
                                    <ol>
                                        <li><strong>Collect Data:</strong> Measure 1000 newborn babies' weights</li>
                                        <li><strong>Calculate Statistics:</strong> Find mean = 3200g, standard deviation = 500g</li>
                                        <li><strong>Discover Pattern:</strong> The data forms a bell curve around 3200g</li>
                                        <li><strong>Make Predictions:</strong> Use the distribution to predict future birth weights</li>
                                    </ol>
                                </div>

                                <h4>Why is it so Important?</h4>
                                <ul>
                                    <li><strong>Natural Phenomena:</strong> Many natural processes follow normal distributions</li>
                                    <li><strong>Statistical Inference:</strong> Foundation for hypothesis testing and confidence intervals</li>
                                    <li><strong>Machine Learning:</strong> Assumption in many algorithms (linear regression, neural networks)</li>
                                    <li><strong>Quality Control:</strong> Used in manufacturing and process control</li>
                                    <li><strong>Risk Management:</strong> Financial modeling and risk assessment</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <div className="applications-grid">
                                    <div className="application-item">
                                        <h5>Quality Control</h5>
                                        <p>Manufacturing processes use normal distributions to set quality standards and detect defects. Control charts monitor whether processes stay within normal variation.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>Medical Research</h5>
                                        <p>Clinical trials assume normal distributions for drug effectiveness, blood pressure measurements, and other biological variables to determine statistical significance.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>Financial Modeling</h5>
                                        <p>Stock returns, option pricing, and risk management models often assume normal distributions for portfolio optimization and risk assessment.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>Machine Learning</h5>
                                        <p>Many ML algorithms assume normal distributions in features. Data preprocessing often includes normalization to make data more normally distributed.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>Market Research</h5>
                                        <p>Consumer behavior, survey responses, and market data often follow normal distributions, enabling better predictions and segmentation.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>Genetics</h5>
                                        <p>Many genetic traits follow normal distributions due to the combined effect of multiple genes, making it crucial for genetic research and personalized medicine.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedDataset === 'height' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Human Height Distribution - Real-World Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Why Height Follows Normal Distribution</h4>
                                    <p>
                                        Human height is one of the best examples of normal distribution in nature. This occurs because
                                        height is influenced by many independent factors (genetics, nutrition, environment) that
                                        combine additively, satisfying the conditions of the Central Limit Theorem.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>Genetic Factors</h5>
                                            <p>
                                                Height is influenced by hundreds of genes, each contributing a small amount.
                                                The combined effect of these genetic factors creates a normal distribution.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Environmental Factors</h5>
                                            <p>
                                                Nutrition, healthcare, and living conditions also affect height.
                                                These factors combine with genetics to create the bell curve.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Statistical Properties</h5>
                                            <p>
                                                Adult male height typically has mean ~170cm and standard deviation ~10cm.
                                                This means 68% of men are between 160-180cm tall.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Practical Applications</h4>
                                        <ul>
                                            <li><strong>Clothing Industry:</strong> Size charts based on normal distribution of body measurements</li>
                                            <li><strong>Furniture Design:</strong> Ergonomic designs for average height ranges</li>
                                            <li><strong>Sports Analytics:</strong> Performance analysis and talent identification</li>
                                            <li><strong>Medical Screening:</strong> Growth charts and health assessments</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'iq' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">IQ Scores - Standardized Intelligence Testing</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding IQ Score Distribution</h4>
                                    <p>
                                        IQ tests are specifically designed to produce normal distributions with mean 100 and
                                        standard deviation 15. This standardization allows for meaningful comparisons across
                                        different populations and age groups.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>Test Design</h5>
                                            <p>
                                                IQ tests are carefully calibrated to ensure normal distribution.
                                                Questions are selected and weighted to create the desired statistical properties.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Score Interpretation</h5>
                                            <p>
                                                Scores are interpreted relative to the normal distribution:
                                                68% score between 85-115, 95% between 70-130, and 99.7% between 55-145.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Research Applications</h5>
                                            <p>
                                                Normal distribution enables statistical analysis in psychology,
                                                education research, and cognitive science studies.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Real-World Applications</h4>
                                        <ul>
                                            <li><strong>Educational Assessment:</strong> Identifying learning needs and gifted programs</li>
                                            <li><strong>Clinical Psychology:</strong> Diagnosing cognitive impairments and developmental disorders</li>
                                            <li><strong>Employment Testing:</strong> Job placement and career counseling</li>
                                            <li><strong>Research Studies:</strong> Cognitive development and intelligence research</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'temperature' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Body Temperature - Biological Homeostasis</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Why Body Temperature is Normally Distributed</h4>
                                    <p>
                                        Human body temperature follows a normal distribution around 36.8°C (98.2°F) with
                                        small standard deviation due to homeostatic mechanisms. This tight control is
                                        essential for optimal physiological function.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>Medical Significance</h5>
                                            <p>
                                                Normal body temperature range is 36.1-37.2°C (97-99°F).
                                                Temperatures outside this range may indicate illness or infection.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Homeostatic Control</h5>
                                            <p>
                                                The body maintains temperature through sweating, shivering, and blood vessel
                                                dilation. These mechanisms keep temperature within narrow normal ranges.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Clinical Applications</h5>
                                            <p>
                                                Understanding normal temperature distribution helps in fever detection,
                                                treatment monitoring, and medical diagnosis.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Healthcare Applications</h4>
                                        <ul>
                                            <li><strong>Medical Diagnosis:</strong> Fever detection and illness monitoring</li>
                                            <li><strong>Clinical Research:</strong> Drug effectiveness and treatment outcomes</li>
                                            <li><strong>Public Health:</strong> Disease surveillance and outbreak detection</li>
                                            <li><strong>Wearable Technology:</strong> Continuous health monitoring devices</li>
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
                                <h4>When Normal Distribution Assumptions Work</h4>
                                <ul>
                                    <li><strong>Large sample sizes:</strong> Central Limit Theorem applies with sufficient data</li>
                                    <li><strong>Independent observations:</strong> Data points don't influence each other</li>
                                    <li><strong>Additive factors:</strong> Multiple independent factors combine linearly</li>
                                    <li><strong>Continuous variables:</strong> Measurements that can take any value in a range</li>
                                </ul>

                                <h4>Common Limitations</h4>
                                <ul>
                                    <li><strong>Skewed data:</strong> Income, house prices often have long right tails</li>
                                    <li><strong>Bounded variables:</strong> Percentages, proportions have natural limits</li>
                                    <li><strong>Small samples:</strong> May not follow normal distribution</li>
                                    <li><strong>Outliers:</strong> Extreme values can distort the distribution</li>
                                </ul>

                                <h4>Best Practices</h4>
                                <ul>
                                    <li><strong>Check assumptions:</strong> Use Q-Q plots and normality tests</li>
                                    <li><strong>Transform data:</strong> Log, square root, or Box-Cox transformations</li>
                                    <li><strong>Robust methods:</strong> Use non-parametric alternatives when appropriate</li>
                                    <li><strong>Visual inspection:</strong> Always plot your data before analysis</li>
                                </ul>

                                <h4>Alternative Distributions</h4>
                                <ul>
                                    <li><strong>Log-normal:</strong> For positively skewed data (income, stock prices)</li>
                                    <li><strong>Exponential:</strong> For waiting times and failure rates</li>
                                    <li><strong>Beta:</strong> For proportions and percentages</li>
                                    <li><strong>Gamma:</strong> For skewed positive data</li>
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

export default NormalDistribution;
