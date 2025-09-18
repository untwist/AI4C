import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './CentralLimitTheorem.css';


interface PopulationData {
    id: string;
    value: number;
    color: string;
}

interface SampleStats {
    sampleNumber: number;
    mean: number;
    size: number;
    values: number[];
}

const CentralLimitTheorem: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const histogramSvgRef = useRef<SVGSVGElement>(null);
    const [selectedDistribution, setSelectedDistribution] = useState<string>('uniform');
    const [sampleSize, setSampleSize] = useState<number>(30);
    const [numSamples, setNumSamples] = useState<number>(100);
    const [animationSpeed, setAnimationSpeed] = useState<number>(100);
    const [showPopulation, setShowPopulation] = useState<boolean>(true);
    const [showNormalOverlay, setShowNormalOverlay] = useState<boolean>(true);
    const [populationData, setPopulationData] = useState<PopulationData[]>([]);
    const [sampleMeans, setSampleMeans] = useState<number[]>([]);
    const [currentSample, setCurrentSample] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isStopped, setIsStopped] = useState<boolean>(false);
    const [fastMode, setFastMode] = useState<boolean>(false);
    const [showTips, setShowTips] = useState<boolean>(false);

    // Distribution configurations
    const distributions = {
        uniform: {
            name: 'Uniform Distribution',
            description: 'All values equally likely - like rolling a fair die',
            color: '#3b82f6',
            generate: (count: number) => Array.from({ length: count }, () => Math.random() * 100)
        },
        exponential: {
            name: 'Exponential Distribution',
            description: 'Skewed distribution - like waiting times or service durations',
            color: '#10b981',
            generate: (count: number) => Array.from({ length: count }, () => -Math.log(1 - Math.random()) * 20)
        },
        bimodal: {
            name: 'Bimodal Distribution',
            description: 'Two distinct peaks - like heights of men and women combined',
            color: '#f59e0b',
            generate: (count: number) => Array.from({ length: count }, () => {
                const isFirstMode = Math.random() < 0.5;
                return isFirstMode
                    ? 20 + Math.random() * 20 + (Math.random() - 0.5) * 10
                    : 60 + Math.random() * 20 + (Math.random() - 0.5) * 10;
            })
        },
        skewed: {
            name: 'Right-Skewed Distribution',
            description: 'Most values low, few high - like income or house prices',
            color: '#ef4444',
            generate: (count: number) => Array.from({ length: count }, () => Math.pow(Math.random(), 2) * 100)
        },
        normal: {
            name: 'Normal Distribution',
            description: 'Bell curve - like heights, test scores, or measurement errors',
            color: '#8b5cf6',
            generate: (count: number) => Array.from({ length: count }, () => {
                // Box-Muller transform for normal distribution
                const u1 = Math.random();
                const u2 = Math.random();
                const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                return 50 + z0 * 15; // Mean 50, std dev 15
            })
        }
    };

    // Generate population data
    const generatePopulation = (distribution: string, size: number = 1000) => {
        const generator = distributions[distribution as keyof typeof distributions];
        const values = generator.generate(size);

        return values.map((value, index) => ({
            id: `pop_${index}`,
            value: Math.max(0, Math.min(100, value)), // Clamp to 0-100 range
            color: generator.color
        }));
    };

    // Take a random sample from population
    const takeSample = (population: PopulationData[], size: number): PopulationData[] => {
        const shuffled = [...population].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, size);
    };

    // Calculate sample mean
    const calculateSampleMean = (sample: PopulationData[]): number => {
        return sample.reduce((sum, point) => sum + point.value, 0) / sample.length;
    };

    // Run sampling simulation
    const runSamplingSimulation = async () => {
        if (isRunning) return;

        setIsRunning(true);
        setIsStopped(false);
        setCurrentSample(0);
        setSampleMeans([]);

        const newSampleMeans: number[] = [];
        const newSampleStats: SampleStats[] = [];

        // Process samples in batches for better performance
        const batchSize = fastMode ? Math.max(1, Math.floor(numSamples / 5)) : Math.max(1, Math.floor(numSamples / 20)); // Update every 20% in fast mode, 5% in normal mode

        for (let i = 0; i < numSamples; i++) {
            // Check if simulation was stopped
            if (isStopped) {
                break;
            }

            const sample = takeSample(populationData, sampleSize);
            const mean = calculateSampleMean(sample);

            newSampleMeans.push(mean);
            newSampleStats.push({
                sampleNumber: i + 1,
                mean: mean,
                size: sampleSize,
                values: sample.map(p => p.value)
            });

            // Update UI in batches for better performance
            if ((i + 1) % batchSize === 0 || i === numSamples - 1) {
                setCurrentSample(i + 1);
                setSampleMeans([...newSampleMeans]);

                // Only add delay for visual effect, not for every sample
                if (animationSpeed > 0 && !fastMode) {
                    await new Promise(resolve => setTimeout(resolve, animationSpeed));
                }
            }
        }

        setIsRunning(false);
    };

    // Stop sampling simulation
    const stopSamplingSimulation = () => {
        setIsStopped(true);
        setIsRunning(false);
    };

    // Reset simulation
    const resetSimulation = () => {
        setSampleMeans([]);
        setCurrentSample(0);
        setIsRunning(false);
        setIsStopped(false);
    };

    // Initialize population when distribution changes
    useEffect(() => {
        const newPopulation = generatePopulation(selectedDistribution);
        setPopulationData(newPopulation);
        resetSimulation();
    }, [selectedDistribution]);

    // Draw population visualization
    useEffect(() => {
        if (!svgRef.current || !showPopulation) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const containerWidth = 800;
        const containerHeight = 400;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };

        svg
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("border", "1px solid #e5e7eb")
            .style("border-radius", "8px")
            .style("background", "white");

        // Create histogram
        const histogram = d3.histogram()
            .domain([0, 100])
            .thresholds(20);

        const bins = histogram(populationData.map(d => d.value));

        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([margin.left, containerWidth - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length) || 1])
            .range([containerHeight - margin.bottom, margin.top]);

        // Draw histogram bars
        svg.selectAll(".histogram-bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "histogram-bar")
            .attr("x", d => xScale(d.x0 || 0))
            .attr("y", d => yScale(d.length))
            .attr("width", d => xScale(d.x1 || 0) - xScale(d.x0 || 0))
            .attr("height", d => containerHeight - margin.bottom - yScale(d.length))
            .style("fill", distributions[selectedDistribution as keyof typeof distributions].color)
            .style("opacity", 0.7)
            .style("stroke", "#374151")
            .style("stroke-width", 1);

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

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
            .text("Value");

        svg.append("text")
            .attr("x", 15)
            .attr("y", containerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90, 15, " + (containerHeight / 2) + ")")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text("Frequency");

        // Add title
        svg.append("text")
            .attr("x", containerWidth / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(`Population Distribution: ${distributions[selectedDistribution as keyof typeof distributions].name}`);

    }, [populationData, selectedDistribution, showPopulation]);

    // Draw sample means histogram
    useEffect(() => {
        if (!histogramSvgRef.current || sampleMeans.length === 0) return;

        const svg = d3.select(histogramSvgRef.current);
        svg.selectAll("*").remove();

        const containerWidth = 800;
        const containerHeight = 400;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };

        svg
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("border", "1px solid #e5e7eb")
            .style("border-radius", "8px")
            .style("background", "white");

        // Create histogram for sample means
        const histogram = d3.histogram()
            .domain(d3.extent(sampleMeans) as [number, number])
            .thresholds(15);

        const bins = histogram(sampleMeans);

        const xScale = d3.scaleLinear()
            .domain(d3.extent(sampleMeans) as [number, number])
            .range([margin.left, containerWidth - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length) || 1])
            .range([containerHeight - margin.bottom, margin.top]);

        // Draw histogram bars
        svg.selectAll(".histogram-bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "histogram-bar")
            .attr("x", d => xScale(d.x0 || 0))
            .attr("y", d => yScale(d.length))
            .attr("width", d => xScale(d.x1 || 0) - xScale(d.x0 || 0))
            .attr("height", d => containerHeight - margin.bottom - yScale(d.length))
            .style("fill", "#3b82f6")
            .style("opacity", 0.7)
            .style("stroke", "#374151")
            .style("stroke-width", 1);

        // Add normal distribution overlay if enabled
        if (showNormalOverlay && sampleMeans.length > 0) {
            const mean = sampleMeans.reduce((sum, m) => sum + m, 0) / sampleMeans.length;
            const variance = sampleMeans.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / sampleMeans.length;
            const stdDev = Math.sqrt(variance);

            // Calculate the maximum frequency to scale the normal curve appropriately
            const maxFrequency = d3.max(bins, d => d.length) || 1;

            const normalData = d3.range(xScale.domain()[0], xScale.domain()[1], 0.5).map(x => ({
                x: x,
                y: (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
                    Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2)) *
                    maxFrequency
            }));

            const line = d3.line<{ x: number, y: number }>()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y));

            svg.append("path")
                .datum(normalData)
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", "#ef4444")
                .style("stroke-width", 3)
                .style("stroke-dasharray", "5,5");
        }

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

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
            .text("Sample Mean");

        svg.append("text")
            .attr("x", 15)
            .attr("y", containerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90, 15, " + (containerHeight / 2) + ")")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text("Frequency");

        // Add title
        svg.append("text")
            .attr("x", containerWidth / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(`Distribution of Sample Means (n=${sampleSize})`);

    }, [sampleMeans, showNormalOverlay, sampleSize]);

    return (
        <div className="central-limit-theorem fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Central Limit Theorem Simulator</h1>
                    <p className="page-description">
                        Discover one of statistics' most powerful concepts through interactive visualization.
                        Watch how sample means from any distribution converge to a normal distribution,
                        regardless of the original population shape.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Population Distribution</h2>
                            <div className="simulation-stats">
                                <span className="stat">Population Size: {populationData.length}</span>
                                <span className="stat">Samples Taken: {currentSample}</span>
                                <span className="stat">Sample Size: {sampleSize}</span>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="population-svg"></svg>
                        </div>

                        <div className="visualization-header">
                            <h2 className="visualization-title">Distribution of Sample Means</h2>
                            <div className="simulation-stats">
                                <span className="stat">Mean of Means: {sampleMeans.length > 0 ? (sampleMeans.reduce((sum, m) => sum + m, 0) / sampleMeans.length).toFixed(2) : 'N/A'}</span>
                                <span className="stat">Std Dev: {sampleMeans.length > 1 ? Math.sqrt(sampleMeans.reduce((sum, m) => sum + Math.pow(m - (sampleMeans.reduce((sum, m) => sum + m, 0) / sampleMeans.length), 2), 0) / sampleMeans.length).toFixed(2) : 'N/A'}</span>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={histogramSvgRef} className="histogram-svg"></svg>
                        </div>

                        <div className="algorithm-controls-section">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Simulation Controls</h3>
                                </div>
                                <div className="card-body">
                                    <div className="algorithm-controls">
                                        <button
                                            onClick={runSamplingSimulation}
                                            className="btn btn-primary"
                                            disabled={isRunning}
                                        >
                                            {isRunning ? 'Running...' : 'Start Sampling Simulation'}
                                        </button>
                                        {isRunning && (
                                            <button
                                                onClick={stopSamplingSimulation}
                                                className="btn btn-secondary"
                                            >
                                                Stop Simulation
                                            </button>
                                        )}
                                        <button
                                            onClick={resetSimulation}
                                            className="btn btn-outline"
                                            disabled={isRunning}
                                        >
                                            Reset Simulation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Population Distribution</h3>
                            </div>
                            <div className="card-body">
                                <div className="distribution-controls">
                                    <label className="label">Choose Distribution</label>
                                    <select
                                        value={selectedDistribution}
                                        onChange={(e) => setSelectedDistribution(e.target.value)}
                                        className="input"
                                    >
                                        <option value="uniform">Uniform</option>
                                        <option value="exponential">Exponential</option>
                                        <option value="bimodal">Bimodal</option>
                                        <option value="skewed">Right-Skewed</option>
                                        <option value="normal">Normal</option>
                                    </select>
                                    <p className="distribution-description">
                                        {distributions[selectedDistribution as keyof typeof distributions].description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Sampling Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Sample Size (n)</label>
                                        <input
                                            type="range"
                                            min="5"
                                            max="100"
                                            step="5"
                                            value={sampleSize}
                                            onChange={(e) => setSampleSize(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{sampleSize}</span>
                                        <small className="parameter-help">Number of observations per sample</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Number of Samples</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="500"
                                            step="10"
                                            value={numSamples}
                                            onChange={(e) => setNumSamples(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{numSamples}</span>
                                        <small className="parameter-help">How many samples to take</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Animation Speed</label>
                                        <input
                                            type="range"
                                            min="100"
                                            max="2000"
                                            step="100"
                                            value={animationSpeed}
                                            onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{animationSpeed}ms</span>
                                        <small className="parameter-help">Speed of sampling animation</small>
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
                                            checked={showPopulation}
                                            onChange={(e) => setShowPopulation(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Population Distribution
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={showNormalOverlay}
                                            onChange={(e) => setShowNormalOverlay(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Normal Distribution Overlay
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={fastMode}
                                            onChange={(e) => setFastMode(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Fast Mode (No Animation)
                                    </label>
                                    {!showTips && (
                                        <label className="control-label show-tips-control">
                                            <button
                                                className="show-tips-btn-inline"
                                                onClick={() => setShowTips(true)}
                                            >
                                                Show Tips
                                            </button>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Simulation Statistics</h3>
                            </div>
                            <div className="card-body">
                                {sampleMeans.length > 0 && (
                                    <div className="performance-metrics">
                                        <div className="metric">
                                            <span className="metric-label">Population Mean:</span>
                                            <span className="metric-value">
                                                {(populationData.reduce((sum, p) => sum + p.value, 0) / populationData.length).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Sample Mean:</span>
                                            <span className="metric-value">
                                                {(sampleMeans.reduce((sum, m) => sum + m, 0) / sampleMeans.length).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Standard Error:</span>
                                            <span className="metric-value">
                                                {Math.sqrt(sampleMeans.reduce((sum, m) => sum + Math.pow(m - (sampleMeans.reduce((sum, m) => sum + m, 0) / sampleMeans.length), 2), 0) / sampleMeans.length).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Theoretical SE:</span>
                                            <span className="metric-value">
                                                {(Math.sqrt(populationData.reduce((sum, p) => sum + Math.pow(p.value - (populationData.reduce((sum, p) => sum + p.value, 0) / populationData.length), 2), 0) / populationData.length) / Math.sqrt(sampleSize)).toFixed(2)}
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
                                            <strong>Start with any distribution</strong>
                                            <p>Begin with any population distribution - uniform, skewed, bimodal, etc.</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Take random samples</strong>
                                            <p>Repeatedly sample n observations from the population</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Calculate sample means</strong>
                                            <p>Compute the mean of each sample</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">4</div>
                                        <div className="step-content">
                                            <strong>Watch the magic</strong>
                                            <p>Sample means form a normal distribution, regardless of original shape!</p>
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
                            <h3 className="card-title">Understanding the Central Limit Theorem</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is the Central Limit Theorem?</h4>
                                <p>
                                    The Central Limit Theorem (CLT) is one of the most important theorems in statistics. It states that
                                    when you take repeated samples from any population and calculate the sample means, those means
                                    will form a normal (bell-shaped) distribution, regardless of the original population's shape.
                                </p>

                                <h4>Key Concepts</h4>
                                <ul>
                                    <li><strong>Sample Mean:</strong> The average of observations in a single sample</li>
                                    <li><strong>Sampling Distribution:</strong> The distribution of sample means from repeated sampling</li>
                                    <li><strong>Standard Error:</strong> The standard deviation of the sampling distribution</li>
                                    <li><strong>Convergence:</strong> How sample means approach normality as sample size increases</li>
                                    <li><strong>Independence:</strong> Each sample must be independent of others</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Quality Control:</strong> Monitoring manufacturing processes and detecting defects</li>
                                    <li><strong>Medical Research:</strong> Testing drug effectiveness across patient groups</li>
                                    <li><strong>Market Research:</strong> Estimating customer satisfaction from survey samples</li>
                                    <li><strong>Financial Analysis:</strong> Risk assessment and portfolio optimization</li>
                                    <li><strong>Election Polling:</strong> Predicting election outcomes from voter samples</li>
                                    <li><strong>Scientific Studies:</strong> Drawing conclusions from experimental data</li>
                                </ul>

                                <h4>When the CLT Applies</h4>
                                <ul>
                                    <li><strong>Large enough samples:</strong> Generally n ≥ 30, but depends on population shape</li>
                                    <li><strong>Independent observations:</strong> Each sample point doesn't influence others</li>
                                    <li><strong>Finite variance:</strong> Population has a defined standard deviation</li>
                                    <li><strong>Random sampling:</strong> Each observation has equal chance of selection</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Distribution Types Explained</h3>
                        </div>
                        <div className="card-body">
                            <div className="distribution-analysis">
                                <div className="distribution-grid">
                                    <div className="distribution-item">
                                        <h5>Uniform Distribution</h5>
                                        <p>
                                            All values are equally likely, like rolling a fair die. This creates a flat distribution
                                            where every outcome has the same probability. Despite this flat shape, sample means
                                            still converge to normality.
                                        </p>
                                        <div className="distribution-examples">
                                            <strong>Examples:</strong> Dice rolls, lottery numbers, random number generation
                                        </div>
                                    </div>

                                    <div className="distribution-item">
                                        <h5>Exponential Distribution</h5>
                                        <p>
                                            Highly skewed with most values near zero and a long tail. Common in waiting times,
                                            service durations, and failure times. The CLT still applies despite the extreme skewness.
                                        </p>
                                        <div className="distribution-examples">
                                            <strong>Examples:</strong> Customer service wait times, equipment failure times, radioactive decay
                                        </div>
                                    </div>

                                    <div className="distribution-item">
                                        <h5>Bimodal Distribution</h5>
                                        <p>
                                            Two distinct peaks, like combining two different populations. Despite having two modes,
                                            sample means from this distribution still form a normal distribution.
                                        </p>
                                        <div className="distribution-examples">
                                            <strong>Examples:</strong> Heights of men and women combined, test scores from two classes
                                        </div>
                                    </div>

                                    <div className="distribution-item">
                                        <h5>Right-Skewed Distribution</h5>
                                        <p>
                                            Most values are low with a few very high values. Common in income, house prices, and
                                            other economic data. The CLT works even with this extreme asymmetry.
                                        </p>
                                        <div className="distribution-examples">
                                            <strong>Examples:</strong> Income distribution, house prices, company revenues
                                        </div>
                                    </div>

                                    <div className="distribution-item">
                                        <h5>Normal Distribution</h5>
                                        <p>
                                            The classic bell curve. When sampling from a normal distribution, sample means
                                            are also normally distributed, but with different parameters.
                                        </p>
                                        <div className="distribution-examples">
                                            <strong>Examples:</strong> Heights, test scores, measurement errors, IQ scores
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Mathematical Foundation</h3>
                        </div>
                        <div className="card-body">
                            <div className="mathematical-content">
                                <h4>The CLT Formula</h4>
                                <div className="formula-box">
                                    <p>If X₁, X₂, ..., Xₙ are independent random variables from any distribution with mean μ and variance σ², then:</p>
                                    <div className="formula">
                                        <strong>X̄ ~ N(μ, σ²/n)</strong>
                                    </div>
                                    <p>Where X̄ is the sample mean and n is the sample size.</p>
                                </div>

                                <h4>Key Mathematical Properties</h4>
                                <div className="properties-grid">
                                    <div className="property-item">
                                        <h5>Mean of Sample Means</h5>
                                        <p>The mean of the sampling distribution equals the population mean: <strong>μₓ̄ = μ</strong></p>
                                    </div>
                                    <div className="property-item">
                                        <h5>Standard Error</h5>
                                        <p>The standard deviation of sample means: <strong>σₓ̄ = σ/√n</strong></p>
                                    </div>
                                    <div className="property-item">
                                        <h5>Convergence Rate</h5>
                                        <p>Larger sample sizes lead to faster convergence to normality</p>
                                    </div>
                                    <div className="property-item">
                                        <h5>Shape Independence</h5>
                                        <p>The original distribution shape doesn't affect the final normal shape</p>
                                    </div>
                                </div>

                                <h4>Practical Implications</h4>
                                <ul>
                                    <li><strong>Confidence Intervals:</strong> We can estimate population parameters using sample statistics</li>
                                    <li><strong>Hypothesis Testing:</strong> Test claims about population parameters using sample data</li>
                                    <li><strong>Quality Control:</strong> Monitor processes and detect when they go out of control</li>
                                    <li><strong>Risk Assessment:</strong> Model uncertainty in financial and business decisions</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Limitations and Best Practices</h3>
                        </div>
                        <div className="card-body">
                            <div className="limitations-content">
                                <h4>When the CLT Works Well</h4>
                                <ul>
                                    <li><strong>Large samples:</strong> Generally n ≥ 30, but may need larger n for very skewed distributions</li>
                                    <li><strong>Independent observations:</strong> Each sample point doesn't influence others</li>
                                    <li><strong>Finite variance:</strong> Population has a defined standard deviation</li>
                                    <li><strong>Random sampling:</strong> Each observation has equal chance of selection</li>
                                </ul>

                                <h4>Common Limitations</h4>
                                <ul>
                                    <li><strong>Small samples:</strong> CLT may not apply with very small sample sizes</li>
                                    <li><strong>Heavy tails:</strong> Distributions with extreme outliers may need larger samples</li>
                                    <li><strong>Dependent data:</strong> Time series or clustered data violates independence</li>
                                    <li><strong>Infinite variance:</strong> Some distributions don't have finite variance</li>
                                </ul>

                                <h4>Best Practices</h4>
                                <ul>
                                    <li><strong>Check assumptions:</strong> Verify independence and random sampling</li>
                                    <li><strong>Use appropriate sample sizes:</strong> Larger n for more skewed distributions</li>
                                    <li><strong>Visualize your data:</strong> Plot histograms to check for normality</li>
                                    <li><strong>Consider alternatives:</strong> Use non-parametric methods when CLT doesn't apply</li>
                                    <li><strong>Bootstrap methods:</strong> Alternative approach for small or non-normal samples</li>
                                </ul>

                                <h4>Alternative Approaches</h4>
                                <ul>
                                    <li><strong>Bootstrap sampling:</strong> Resample from your data to estimate sampling distribution</li>
                                    <li><strong>Non-parametric tests:</strong> Use methods that don't assume normality</li>
                                    <li><strong>Transformations:</strong> Apply log or other transformations to achieve normality</li>
                                    <li><strong>Robust statistics:</strong> Use methods less sensitive to outliers</li>
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

export default CentralLimitTheorem;
