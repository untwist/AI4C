import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import './TTest.css';

interface TTestParameters {
    testType: 'one-sample' | 'two-sample' | 'paired';
    populationMean: number;
    sampleMean: number;
    sampleStdDev: number;
    sampleSize: number;
    sample2Mean?: number;
    sample2StdDev?: number;
    sample2Size?: number;
    alpha: number;
    tailType: 'one-tailed' | 'two-tailed';
}

interface TTestResults {
    tStatistic: number;
    degreesOfFreedom: number;
    pValue: number;
    criticalValue: number;
    confidenceInterval: [number, number];
    decision: 'reject' | 'fail-to-reject';
}

// Approximate t-distribution CDF
const tCDF = (t: number, df: number): number => {
    // Simplified approximation using normal distribution for large df
    if (df > 30) {
        return d3.cumsum([0, ...Array(1000).fill(0.001)].map((_, i) => {
            const x = -4 + i * 0.008;
            return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * 0.008;
        })).find((_, i) => -4 + i * 0.008 >= Math.abs(t)) || 0;
    }
    // For smaller df, use approximation
    const z = t * Math.sqrt(df / (df + t * t));
    return d3.cumsum([0, ...Array(1000).fill(0.001)].map((_, i) => {
        const x = -4 + i * 0.008;
        return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * 0.008;
    })).find((_, i) => -4 + i * 0.008 >= Math.abs(z)) || 0;
};

const TTest: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    const [parameters, setParameters] = useState<TTestParameters>({
        testType: 'one-sample',
        populationMean: 100,
        sampleMean: 105,
        sampleStdDev: 12,
        sampleSize: 20,
        alpha: 0.05,
        tailType: 'two-tailed'
    });

    const [results, setResults] = useState<TTestResults>({
        tStatistic: 0,
        degreesOfFreedom: 19,
        pValue: 0,
        criticalValue: 2.093,
        confidenceInterval: [0, 0],
        decision: 'fail-to-reject'
    });

    // Calculate t-test
    const calculateTTest = (params: TTestParameters): TTestResults => {
        let tStatistic: number;
        let degreesOfFreedom: number;
        let standardError: number;

        if (params.testType === 'one-sample') {
            standardError = params.sampleStdDev / Math.sqrt(params.sampleSize);
            tStatistic = (params.sampleMean - params.populationMean) / standardError;
            degreesOfFreedom = params.sampleSize - 1;
        } else if (params.testType === 'two-sample') {
            const n1 = params.sampleSize;
            const n2 = params.sample2Size || params.sampleSize;
            const s1 = params.sampleStdDev;
            const s2 = params.sample2StdDev || params.sampleStdDev;
            
            // Pooled standard error
            const pooledStd = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2));
            standardError = pooledStd * Math.sqrt(1/n1 + 1/n2);
            tStatistic = (params.sampleMean - (params.sample2Mean || params.populationMean)) / standardError;
            degreesOfFreedom = n1 + n2 - 2;
        } else {
            // Paired t-test
            const diff = params.sampleMean - (params.sample2Mean || params.populationMean);
            standardError = params.sampleStdDev / Math.sqrt(params.sampleSize);
            tStatistic = diff / standardError;
            degreesOfFreedom = params.sampleSize - 1;
        }

        // Approximate critical value (simplified)
        const criticalValue = params.tailType === 'one-tailed'
            ? (degreesOfFreedom > 30 ? 1.645 : 1.729)
            : (degreesOfFreedom > 30 ? 1.96 : 2.093);

        // Calculate P-value
        const oneTailP = 1 - tCDF(Math.abs(tStatistic), degreesOfFreedom);
        const pValue = params.tailType === 'one-tailed' ? oneTailP : oneTailP * 2;

        // Calculate confidence interval
        const margin = criticalValue * standardError;
        const confidenceInterval: [number, number] = params.testType === 'one-sample'
            ? [params.sampleMean - margin, params.sampleMean + margin]
            : [(params.sampleMean - (params.sample2Mean || params.populationMean)) - margin,
               (params.sampleMean - (params.sample2Mean || params.populationMean)) + margin];

        const decision = pValue <= params.alpha ? 'reject' : 'fail-to-reject';

        return {
            tStatistic,
            degreesOfFreedom,
            pValue,
            criticalValue,
            confidenceInterval,
            decision
        };
    };

    useEffect(() => {
        const newResults = calculateTTest(parameters);
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

        // Generate t-distribution data (approximation)
        const df = results.degreesOfFreedom;
        const tData = d3.range(-4, 4, 0.01).map(x => {
            // Simplified t-distribution approximation
            const factor = df > 30 ? 1 : (df / (df + x * x));
            const y = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * factor;
            return { x, y };
        });

        // Normalize
        const maxY = d3.max(tData, d => d.y) || 1;
        tData.forEach(d => d.y = d.y / maxY * 0.4);

        // Create area generator
        const area = d3.area<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(d.y))
            .curve(d3.curveBasis);

        // Draw the t-distribution
        g.append("path")
            .datum(tData)
            .attr("fill", "#3b82f6")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", area);

        // Draw rejection regions
        const criticalValue = results.criticalValue;
        if (parameters.tailType === 'two-tailed') {
            const leftReject = tData.filter(d => d.x <= -criticalValue);
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
            const rightReject = tData.filter(d => d.x >= criticalValue);
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
            const reject = tData.filter(d => d.x >= criticalValue);
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

        // Draw t-statistic line
        const tStat = results.tStatistic;
        g.append("line")
            .attr("x1", xScale(tStat))
            .attr("x2", xScale(tStat))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8,4");

        // Add labels
        g.append("text")
            .attr("x", xScale(tStat))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`t = ${tStat.toFixed(2)}`);

        g.append("text")
            .attr("x", xScale(tStat))
            .attr("y", yScale(0.3))
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
            .text(`T-Score (t-distribution, df = ${results.degreesOfFreedom})`);

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
        <div className="t-test fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">T-Test Simulator</h1>
                    <p className="page-description">
                        Interactive t-test for comparing means when population variance is unknown.
                        Explore one-sample, two-sample, and paired t-tests with real-time calculations.
                    </p>
                </div>

                <div className="improved-simulation-layout">
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">T-Test Distribution</h2>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                        <div className="compact-performance">
                            <h4>Test Results</h4>
                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span className="performance-label">T-Statistic:</span>
                                    <span className="performance-value">{results.tStatistic.toFixed(3)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Degrees of Freedom:</span>
                                    <span className="performance-value">{results.degreesOfFreedom}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">P-Value:</span>
                                    <span className="performance-value">{results.pValue.toFixed(4)}</span>
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
                                                testType: e.target.value as 'one-sample' | 'two-sample' | 'paired'
                                            }))}
                                            className="input"
                                        >
                                            <option value="one-sample">One-Sample T-Test</option>
                                            <option value="two-sample">Two-Sample T-Test</option>
                                            <option value="paired">Paired T-Test</option>
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
                                    {(parameters.testType === 'two-sample' || parameters.testType === 'paired') && (
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
                                        <label className="label">Sample Std Dev (s)</label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={parameters.sampleStdDev}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                sampleStdDev: parseFloat(e.target.value) || 0.1
                                            }))}
                                            className="input"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Sample Size (n)</label>
                                        <input
                                            type="number"
                                            min="2"
                                            value={parameters.sampleSize}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                sampleSize: parseInt(e.target.value) || 2
                                            }))}
                                            className="input"
                                        />
                                    </div>
                                    {(parameters.testType === 'two-sample') && (
                                        <>
                                            <div className="input-group">
                                                <label className="label">Sample 2 Std Dev (s₂)</label>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    value={parameters.sample2StdDev || parameters.sampleStdDev}
                                                    onChange={(e) => setParameters(prev => ({
                                                        ...prev,
                                                        sample2StdDev: parseFloat(e.target.value) || 0.1
                                                    }))}
                                                    className="input"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="label">Sample 2 Size (n₂)</label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    value={parameters.sample2Size || parameters.sampleSize}
                                                    onChange={(e) => setParameters(prev => ({
                                                        ...prev,
                                                        sample2Size: parseInt(e.target.value) || 2
                                                    }))}
                                                    className="input"
                                                />
                                            </div>
                                        </>
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
                            <h3 className="card-title">Understanding T-Tests</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is a T-Test?</h4>
                                <p>
                                    A t-test is a statistical test used to determine if there is a significant difference
                                    between the means of two groups or between a sample mean and a known population mean.
                                    It uses the t-distribution, which accounts for uncertainty when the population variance is unknown.
                                </p>

                                <h4>When to Use a T-Test</h4>
                                <ul>
                                    <li>Population standard deviation is unknown</li>
                                    <li>Sample size is small (n &lt; 30) or population is normally distributed</li>
                                    <li>Data are independent and randomly sampled</li>
                                    <li>Testing a hypothesis about population means</li>
                                </ul>

                                <h4>Types of T-Tests</h4>
                                <ul>
                                    <li><strong>One-Sample T-Test:</strong> Compares sample mean to a known population mean</li>
                                    <li><strong>Two-Sample T-Test:</strong> Compares means of two independent groups</li>
                                    <li><strong>Paired T-Test:</strong> Compares means of paired observations (before/after, matched pairs)</li>
                                </ul>

                                <h4>T-Test vs Z-Test</h4>
                                <p>
                                    Use t-test when population variance is unknown. Use z-test when population variance is known.
                                    T-tests are more commonly used in practice because population variance is rarely known.
                                </p>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Medical Research:</strong> Testing if a treatment changes patient outcomes</li>
                                    <li><strong>Education:</strong> Comparing test scores between different teaching methods</li>
                                    <li><strong>Business:</strong> Comparing sales between two marketing campaigns</li>
                                    <li><strong>Quality Control:</strong> Testing if production batches meet specifications</li>
                                </ul>
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
                                <Link to="/z-test" className="related-link">Z-Test Simulator</Link>
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

export default TTest;

