import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import './ZTest.css';

interface ZTestParameters {
    testType: 'one-sample' | 'two-sample';
    populationMean: number;
    sampleMean: number;
    populationStdDev: number;
    sampleSize: number;
    sample2Mean?: number;
    sample2Size?: number;
    alpha: number;
    tailType: 'one-tailed' | 'two-tailed';
}

interface ZTestResults {
    zStatistic: number;
    pValue: number;
    criticalValue: number;
    confidenceInterval: [number, number];
    decision: 'reject' | 'fail-to-reject';
}

const ZTest: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    const [parameters, setParameters] = useState<ZTestParameters>({
        testType: 'one-sample',
        populationMean: 100,
        sampleMean: 105,
        populationStdDev: 15,
        sampleSize: 30,
        alpha: 0.05,
        tailType: 'two-tailed'
    });

    const [results, setResults] = useState<ZTestResults>({
        zStatistic: 0,
        pValue: 0,
        criticalValue: 1.96,
        confidenceInterval: [0, 0],
        decision: 'fail-to-reject'
    });

    // Calculate z-test
    const calculateZTest = (params: ZTestParameters): ZTestResults => {
        let zStatistic: number;
        let standardError: number;

        if (params.testType === 'one-sample') {
            standardError = params.populationStdDev / Math.sqrt(params.sampleSize);
            zStatistic = (params.sampleMean - params.populationMean) / standardError;
        } else {
            // Two-sample z-test
            const n1 = params.sampleSize;
            const n2 = params.sample2Size || params.sampleSize;
            standardError = Math.sqrt(
                (params.populationStdDev * params.populationStdDev) / n1 +
                (params.populationStdDev * params.populationStdDev) / n2
            );
            zStatistic = (params.sampleMean - (params.sample2Mean || params.populationMean)) / standardError;
        }

        // Calculate critical value
        const criticalValue = params.tailType === 'one-tailed' ? 1.645 : 1.96;

        // Calculate P-value (approximation)
        const pValue = params.tailType === 'one-tailed'
            ? 1 - d3.cumsum([0, ...Array(1000).fill(0.001)].map((_, i) => {
                const x = -4 + i * 0.008;
                return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * 0.008;
            })).find((cum, i) => -4 + i * 0.008 >= Math.abs(zStatistic)) || 0
            : 2 * (1 - d3.cumsum([0, ...Array(1000).fill(0.001)].map((_, i) => {
                const x = -4 + i * 0.008;
                return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * 0.008;
            })).find((cum, i) => -4 + i * 0.008 >= Math.abs(zStatistic)) || 0);

        // Calculate confidence interval
        const margin = criticalValue * standardError;
        const confidenceInterval: [number, number] = params.testType === 'one-sample'
            ? [params.sampleMean - margin, params.sampleMean + margin]
            : [(params.sampleMean - (params.sample2Mean || params.populationMean)) - margin,
               (params.sampleMean - (params.sample2Mean || params.populationMean)) + margin];

        const decision = pValue <= params.alpha ? 'reject' : 'fail-to-reject';

        return {
            zStatistic,
            pValue,
            criticalValue,
            confidenceInterval,
            decision
        };
    };

    useEffect(() => {
        const newResults = calculateZTest(parameters);
        setResults(newResults);
    }, [parameters]);

    // Draw visualization
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 500;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([-4, 4])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 0.5])
            .range([innerHeight, 0]);

        // Generate normal distribution data
        const normalData = d3.range(-4, 4, 0.01).map(x => ({
            x,
            y: (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x)
        }));

        // Create area generator
        const area = d3.area<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(d.y))
            .curve(d3.curveBasis);

        // Draw the standard normal distribution
        g.append("path")
            .datum(normalData)
            .attr("fill", "#3b82f6")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", area);

        // Draw rejection regions
        const criticalValue = results.criticalValue;
        if (parameters.tailType === 'two-tailed') {
            // Left tail
            const leftReject = normalData.filter(d => d.x <= -criticalValue);
            if (leftReject.length > 0) {
                const leftRegion = [
                    {x: -4, y: 0},
                    ...leftReject,
                    {x: -criticalValue, y: 0}
                ];
                g.append("path")
                    .datum(leftRegion)
                    .attr("fill", "#ef4444")
                    .attr("fill-opacity", 0.5)
                    .attr("stroke", "#dc2626")
                    .attr("stroke-width", 2)
                    .attr("d", area);
            }
            // Right tail
            const rightReject = normalData.filter(d => d.x >= criticalValue);
            if (rightReject.length > 0) {
                const rightRegion = [
                    {x: criticalValue, y: 0},
                    ...rightReject,
                    {x: 4, y: 0}
                ];
                g.append("path")
                    .datum(rightRegion)
                    .attr("fill", "#ef4444")
                    .attr("fill-opacity", 0.5)
                    .attr("stroke", "#dc2626")
                    .attr("stroke-width", 2)
                    .attr("d", area);
            }
        } else {
            // One-tailed (right tail)
            const reject = normalData.filter(d => d.x >= criticalValue);
            if (reject.length > 0) {
                const rejectRegion = [
                    {x: criticalValue, y: 0},
                    ...reject,
                    {x: 4, y: 0}
                ];
                g.append("path")
                    .datum(rejectRegion)
                    .attr("fill", "#ef4444")
                    .attr("fill-opacity", 0.5)
                    .attr("stroke", "#dc2626")
                    .attr("stroke-width", 2)
                    .attr("d", area);
            }
        }

        // Draw critical value lines
        if (parameters.tailType === 'two-tailed') {
            g.append("line")
                .attr("x1", xScale(-criticalValue))
                .attr("x2", xScale(-criticalValue))
                .attr("y1", 0)
                .attr("y2", innerHeight)
                .attr("stroke", "#f59e0b")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5");
        }
        g.append("line")
            .attr("x1", xScale(criticalValue))
            .attr("x2", xScale(criticalValue))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");

        // Draw z-statistic line
        const zStat = results.zStatistic;
        g.append("line")
            .attr("x1", xScale(zStat))
            .attr("x2", xScale(zStat))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8,4");

        // Add labels
        g.append("text")
            .attr("x", xScale(zStat))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`Z = ${zStat.toFixed(2)}`);

        g.append("text")
            .attr("x", xScale(zStat))
            .attr("y", yScale(0.4))
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", results.decision === 'reject' ? "#dc2626" : "#16a34a")
            .text(`P = ${results.pValue.toFixed(4)}`);

        if (parameters.tailType === 'two-tailed') {
            g.append("text")
                .attr("x", xScale(-criticalValue))
                .attr("y", innerHeight + 25)
                .attr("text-anchor", "middle")
                .attr("font-size", "11px")
                .attr("font-weight", "600")
                .attr("fill", "#d97706")
                .text(`-${criticalValue.toFixed(2)}`);
        }
        g.append("text")
            .attr("x", xScale(criticalValue))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", "#d97706")
            .text(`${parameters.tailType === 'one-tailed' ? '' : '±'}${criticalValue.toFixed(2)}`);

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .attr("color", "#64748b");

        g.append("g")
            .call(yAxis)
            .attr("color", "#64748b");

        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text("Z-Score (Standard Normal Distribution)");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text("Probability Density");
    };

    useEffect(() => {
        drawVisualization();
    }, [parameters, results]);

    return (
        <div className="z-test fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Z-Test Simulator</h1>
                    <p className="page-description">
                        Interactive z-test for testing population means when the population standard deviation is known.
                        Explore one-sample and two-sample z-tests with real-time calculations.
                    </p>
                </div>

                <div className="improved-simulation-layout">
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Z-Test Distribution</h2>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                        <div className="compact-performance">
                            <h4>Test Results</h4>
                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span className="performance-label">Z-Statistic:</span>
                                    <span className="performance-value">{results.zStatistic.toFixed(3)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">P-Value:</span>
                                    <span className="performance-value">{results.pValue.toFixed(4)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Critical Value:</span>
                                    <span className="performance-value">±{results.criticalValue.toFixed(2)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Decision:</span>
                                    <span className="performance-value" style={{color: results.decision === 'reject' ? '#dc2626' : '#16a34a'}}>
                                        {results.decision === 'reject' ? 'Reject H0' : 'Fail to Reject H0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Test Configuration</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Test Type</label>
                                        <select
                                            value={parameters.testType}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                testType: e.target.value as 'one-sample' | 'two-sample'
                                            }))}
                                            className="input"
                                        >
                                            <option value="one-sample">One-Sample Z-Test</option>
                                            <option value="two-sample">Two-Sample Z-Test</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Population Mean (μ₀)</label>
                                        <input
                                            type="number"
                                            value={parameters.populationMean}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                populationMean: parseFloat(e.target.value) || 0
                                            }))}
                                            className="input"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Sample Mean (x̄)</label>
                                        <input
                                            type="number"
                                            value={parameters.sampleMean}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                sampleMean: parseFloat(e.target.value) || 0
                                            }))}
                                            className="input"
                                        />
                                    </div>
                                    {parameters.testType === 'two-sample' && (
                                        <div className="input-group">
                                            <label className="label">Sample 2 Mean (x̄₂)</label>
                                            <input
                                                type="number"
                                                value={parameters.sample2Mean || parameters.populationMean}
                                                onChange={(e) => setParameters(prev => ({
                                                    ...prev,
                                                    sample2Mean: parseFloat(e.target.value) || 0
                                                }))}
                                                className="input"
                                            />
                                        </div>
                                    )}
                                    <div className="input-group">
                                        <label className="label">Population Std Dev (σ)</label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={parameters.populationStdDev}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                populationStdDev: parseFloat(e.target.value) || 0.1
                                            }))}
                                            className="input"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Sample Size (n)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={parameters.sampleSize}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                sampleSize: parseInt(e.target.value) || 1
                                            }))}
                                            className="input"
                                        />
                                    </div>
                                    {parameters.testType === 'two-sample' && (
                                        <div className="input-group">
                                            <label className="label">Sample 2 Size (n₂)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={parameters.sample2Size || parameters.sampleSize}
                                                onChange={(e) => setParameters(prev => ({
                                                    ...prev,
                                                    sample2Size: parseInt(e.target.value) || 1
                                                }))}
                                                className="input"
                                            />
                                        </div>
                                    )}
                                    <div className="input-group">
                                        <label className="label">Significance Level (α)</label>
                                        <input
                                            type="range"
                                            min="0.01"
                                            max="0.2"
                                            step="0.01"
                                            value={parameters.alpha}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                alpha: parseFloat(e.target.value)
                                            }))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.alpha.toFixed(2)}</span>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Tail Type</label>
                                        <select
                                            value={parameters.tailType}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                tailType: e.target.value as 'one-tailed' | 'two-tailed'
                                            }))}
                                            className="input"
                                        >
                                            <option value="two-tailed">Two-Tailed</option>
                                            <option value="one-tailed">One-Tailed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Confidence Interval</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    <div className="result-item">
                                        <span className="result-label">95% CI:</span>
                                        <span className="result-value">
                                            [{results.confidenceInterval[0].toFixed(2)}, {results.confidenceInterval[1].toFixed(2)}]
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Z-Tests</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is a Z-Test?</h4>
                                <p>
                                    A z-test is a statistical test used to determine whether two population means are different
                                    when the population variance is known and the sample size is large (typically n ≥ 30).
                                    It uses the standard normal distribution (z-distribution) to calculate test statistics.
                                </p>

                                <h4>When to Use a Z-Test</h4>
                                <ul>
                                    <li>Population standard deviation (σ) is known</li>
                                    <li>Sample size is large (n ≥ 30) or population is normally distributed</li>
                                    <li>Data are independent and randomly sampled</li>
                                    <li>Testing a hypothesis about a population mean</li>
                                </ul>

                                <h4>One-Sample Z-Test</h4>
                                <p>
                                    Tests whether a sample mean differs significantly from a known population mean.
                                    Formula: z = (x̄ - μ₀) / (σ / √n)
                                </p>
                                <p><strong>Example:</strong> Testing if a new teaching method improves test scores compared to the national average.</p>

                                <h4>Two-Sample Z-Test</h4>
                                <p>
                                    Tests whether two independent sample means differ significantly.
                                    Formula: z = (x̄₁ - x̄₂) / √(σ²/n₁ + σ²/n₂)
                                </p>
                                <p><strong>Example:</strong> Comparing average test scores between two different schools.</p>

                                <h4>Interpreting Results</h4>
                                <ul>
                                    <li><strong>Z-statistic:</strong> Measures how many standard deviations the sample mean is from the population mean</li>
                                    <li><strong>P-value:</strong> Probability of observing this result if the null hypothesis is true</li>
                                    <li><strong>Critical value:</strong> Threshold for rejecting the null hypothesis</li>
                                    <li><strong>Decision:</strong> Reject H0 if |z| &gt; critical value or if p-value ≤ α</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Quality Control:</strong> Testing if production batches meet specifications</li>
                                    <li><strong>Education:</strong> Comparing student performance across different programs</li>
                                    <li><strong>Healthcare:</strong> Testing if a treatment changes patient outcomes</li>
                                    <li><strong>Marketing:</strong> Comparing customer satisfaction between two products</li>
                                </ul>

                                <h4>Z-Test vs T-Test</h4>
                                <p>
                                    Use z-test when population variance is known. Use t-test when population variance is unknown
                                    and must be estimated from the sample. T-tests are more commonly used in practice.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="related-topics">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Related Topics</h3>
                        </div>
                        <div className="card-body">
                            <div className="related-links">
                                <Link to="/hypothesis-testing" className="related-link">Hypothesis Testing Overview</Link>
                                <Link to="/t-test" className="related-link">T-Test Simulator</Link>
                                <Link to="/p-values" className="related-link">P-Values Tutorial</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="copyright-section">
                    <div className="copyright-notice">
                        <p>&copy; 2025, Todd Brous. All rights reserved.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ZTest;

