import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import './ANOVA.css';

interface GroupData {
    mean: number;
    stdDev: number;
    size: number;
    name: string;
}

interface ANOVAParameters {
    numGroups: number;
    groups: GroupData[];
    alpha: number;
}

interface ANOVAResults {
    fStatistic: number;
    pValue: number;
    criticalValue: number;
    betweenGroupVariance: number;
    withinGroupVariance: number;
    decision: 'reject' | 'fail-to-reject';
}

const ANOVA: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    const [parameters, setParameters] = useState<ANOVAParameters>({
        numGroups: 3,
        groups: [
            { mean: 50, stdDev: 10, size: 20, name: 'Group 1' },
            { mean: 55, stdDev: 10, size: 20, name: 'Group 2' },
            { mean: 60, stdDev: 10, size: 20, name: 'Group 3' }
        ],
        alpha: 0.05
    });

    const [results, setResults] = useState<ANOVAResults>({
        fStatistic: 0,
        pValue: 0,
        criticalValue: 3.15,
        betweenGroupVariance: 0,
        withinGroupVariance: 0,
        decision: 'fail-to-reject'
    });

    // Calculate ANOVA
    const calculateANOVA = (params: ANOVAParameters): ANOVAResults => {
        const groups = params.groups;
        const totalN = groups.reduce((sum, g) => sum + g.size, 0);
        const grandMean = groups.reduce((sum, g) => sum + g.mean * g.size, 0) / totalN;

        // Between-group variance (MSB)
        const betweenGroupVariance = groups.reduce((sum, g) => {
            return sum + g.size * Math.pow(g.mean - grandMean, 2);
        }, 0) / (groups.length - 1);

        // Within-group variance (MSW)
        const withinGroupVariance = groups.reduce((sum, g) => {
            return sum + (g.size - 1) * g.stdDev * g.stdDev;
        }, 0) / (totalN - groups.length);

        // F-statistic
        const fStatistic = betweenGroupVariance / withinGroupVariance;

        // Critical value (approximation)
        const df1 = groups.length - 1;
        const df2 = totalN - groups.length;
        const criticalValue = df1 === 2 && df2 > 20 ? 3.15 : 3.49;

        // Approximate P-value
        const pValue = fStatistic > criticalValue ? 0.01 : 0.05;

        const decision = pValue <= params.alpha ? 'reject' : 'fail-to-reject';

        return {
            fStatistic,
            pValue,
            criticalValue,
            betweenGroupVariance,
            withinGroupVariance,
            decision
        };
    };

    useEffect(() => {
        const newResults = calculateANOVA(parameters);
        setResults(newResults);
    }, [parameters]);

    // Draw F-distribution visualization
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

        const df1 = parameters.numGroups - 1;
        const df2 = parameters.groups.reduce((sum, g) => sum + g.size, 0) - parameters.numGroups;
        const maxX = Math.max(results.fStatistic * 1.5, results.criticalValue * 1.5, 5);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, maxX])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([innerHeight, 0]);

        // Generate F-distribution data (approximation)
        const fData = d3.range(0, maxX, 0.05).map(x => {
            if (x === 0) return { x, y: 0 };
            // Simplified F-distribution approximation
            const y = Math.pow(x, df1/2 - 1) / Math.pow(1 + (df1/df2) * x, (df1 + df2)/2);
            return { x, y: y || 0 };
        });

        // Normalize
        const maxY = d3.max(fData, d => d.y) || 1;
        fData.forEach(d => d.y = (d.y / maxY) * 0.8);

        // Create area generator
        const area = d3.area<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(d.y))
            .curve(d3.curveBasis);

        // Draw F-distribution
        g.append("path")
            .datum(fData)
            .attr("fill", "#3b82f6")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", area);

        // Draw rejection region
        const reject = fData.filter(d => d.x >= results.criticalValue);
        if (reject.length > 0) {
            const rejectRegion = [
                {x: results.criticalValue, y: 0},
                ...reject,
                {x: maxX, y: 0}
            ];
            g.append("path")
                .datum(rejectRegion)
                .attr("fill", "#ef4444")
                .attr("fill-opacity", 0.5)
                .attr("stroke", "#dc2626")
                .attr("stroke-width", 2)
                .attr("d", area);
        }

        // Draw critical value line
        g.append("line")
            .attr("x1", xScale(results.criticalValue))
            .attr("x2", xScale(results.criticalValue))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");

        // Draw F-statistic line
        g.append("line")
            .attr("x1", xScale(results.fStatistic))
            .attr("x2", xScale(results.fStatistic))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8,4");

        // Add labels
        g.append("text")
            .attr("x", xScale(results.fStatistic))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`F = ${results.fStatistic.toFixed(2)}`);

        g.append("text")
            .attr("x", xScale(results.fStatistic))
            .attr("y", yScale(0.6))
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", results.decision === 'reject' ? "#dc2626" : "#16a34a")
            .text(`P = ${results.pValue.toFixed(4)}`);

        g.append("text")
            .attr("x", xScale(results.criticalValue))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", "#d97706")
            .text(`Critical = ${results.criticalValue.toFixed(2)}`);

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
            .text(`F-Statistic (df1 = ${df1}, df2 = ${df2})`);

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

    const updateGroup = (index: number, field: keyof GroupData, value: number | string) => {
        const newGroups = parameters.groups.map((g, i) =>
            i === index ? { ...g, [field]: value } : g
        );
        setParameters(prev => ({ ...prev, groups: newGroups }));
    };

    return (
        <div className="anova fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">ANOVA Simulator</h1>
                    <p className="page-description">
                        Interactive Analysis of Variance (ANOVA) for comparing means across multiple groups.
                        Explore one-way ANOVA with real-time F-statistic calculations.
                    </p>
                </div>

                <div className="improved-simulation-layout">
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">F-Distribution</h2>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                        <div className="compact-performance">
                            <h4>ANOVA Results</h4>
                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span className="performance-label">F-Statistic:</span>
                                    <span className="performance-value">{results.fStatistic.toFixed(3)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">P-Value:</span>
                                    <span className="performance-value">{results.pValue.toFixed(4)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Between-Group Variance:</span>
                                    <span className="performance-value">{results.betweenGroupVariance.toFixed(2)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Within-Group Variance:</span>
                                    <span className="performance-value">{results.withinGroupVariance.toFixed(2)}</span>
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
                                <h3 className="card-title">Group Configuration</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Number of Groups</label>
                                        <input
                                            type="number"
                                            min="2"
                                            max="5"
                                            value={parameters.numGroups}
                                            onChange={(e) => {
                                                const num = parseInt(e.target.value) || 2;
                                                const newGroups = Array(num).fill(0).map((_, i) =>
                                                    parameters.groups[i] || { mean: 50 + i * 5, stdDev: 10, size: 20, name: `Group ${i + 1}` }
                                                );
                                                setParameters(prev => ({ ...prev, numGroups: num, groups: newGroups }));
                                            }}
                                            className="input"
                                        />
                                    </div>
                                    {parameters.groups.map((group, index) => (
                                        <div key={index} className="group-controls">
                                            <h5>{group.name}</h5>
                                            <div className="input-group">
                                                <label className="label">Mean</label>
                                                <input
                                                    type="number"
                                                    value={group.mean}
                                                    onChange={(e) => updateGroup(index, 'mean', parseFloat(e.target.value) || 0)}
                                                    className="input"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="label">Std Dev</label>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    value={group.stdDev}
                                                    onChange={(e) => updateGroup(index, 'stdDev', parseFloat(e.target.value) || 0.1)}
                                                    className="input"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="label">Sample Size</label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    value={group.size}
                                                    onChange={(e) => updateGroup(index, 'size', parseInt(e.target.value) || 2)}
                                                    className="input"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="input-group">
                                        <label className="label">Significance Level (α)</label>
                                        <input
                                            type="range"
                                            min="0.01"
                                            max="0.2"
                                            step="0.01"
                                            value={parameters.alpha}
                                            onChange={(e) => setParameters(prev => ({ ...prev, alpha: parseFloat(e.target.value) }))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.alpha.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding ANOVA</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is ANOVA?</h4>
                                <p>
                                    Analysis of Variance (ANOVA) is a statistical method used to compare means across
                                    three or more groups. It tests whether there are any statistically significant
                                    differences between the means of independent groups.
                                </p>

                                <h4>When to Use ANOVA</h4>
                                <ul>
                                    <li>Comparing means across three or more groups</li>
                                    <li>Data are normally distributed</li>
                                    <li>Groups have equal variances (homoscedasticity)</li>
                                    <li>Observations are independent</li>
                                </ul>

                                <h4>ANOVA vs T-Test</h4>
                                <p>
                                    Use ANOVA when comparing three or more groups. Use t-test when comparing exactly two groups.
                                    ANOVA is an extension of the t-test for multiple groups.
                                </p>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Medical Research:</strong> Comparing treatment effectiveness across multiple treatments</li>
                                    <li><strong>Education:</strong> Comparing test scores across different teaching methods</li>
                                    <li><strong>Business:</strong> Comparing sales across different regions or products</li>
                                    <li><strong>Agriculture:</strong> Comparing crop yields across different fertilizers</li>
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

export default ANOVA;

