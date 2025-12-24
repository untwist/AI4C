import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import './EValues.css';

interface EValueParameters {
    testStatistic: number;
    pValue: number;
    alpha: number;
}

interface EValueResults {
    eValue: number;
    interpretation: string;
}

const EValues: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const comparisonRef = useRef<SVGSVGElement>(null);

    const [parameters, setParameters] = useState<EValueParameters>({
        testStatistic: 2.0,
        pValue: 0.05,
        alpha: 0.05
    });

    const [results, setResults] = useState<EValueResults>({
        eValue: 1.0,
        interpretation: 'No evidence against null hypothesis'
    });

    // Calculate E-value (simplified approximation)
    const calculateEValue = (params: EValueParameters): EValueResults => {
        // E-value is approximately 1/p for small p-values
        // This is a simplified calculation
        const eValue = params.pValue > 0 ? Math.min(1 / params.pValue, 100) : 100;
        
        let interpretation: string;
        if (eValue >= 20) {
            interpretation = 'Strong evidence against null hypothesis';
        } else if (eValue >= 5) {
            interpretation = 'Moderate evidence against null hypothesis';
        } else if (eValue >= 1) {
            interpretation = 'Weak evidence against null hypothesis';
        } else {
            interpretation = 'No evidence against null hypothesis';
        }

        return { eValue, interpretation };
    };

    useEffect(() => {
        const newResults = calculateEValue(parameters);
        setResults(newResults);
    }, [parameters]);

    // Draw E-value visualization
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 400;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const maxE = Math.max(results.eValue * 1.2, 10);
        const eValue = results.eValue;

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, maxE])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([innerHeight, 0]);

        // Draw E-value regions
        const regions = [
            { start: 0, end: 1, color: '#10b981', label: 'No Evidence' },
            { start: 1, end: 5, color: '#f59e0b', label: 'Weak Evidence' },
            { start: 5, end: 20, color: '#ef4444', label: 'Moderate Evidence' },
            { start: 20, end: maxE, color: '#dc2626', label: 'Strong Evidence' }
        ];

        regions.forEach(region => {
            if (region.end <= maxE) {
                g.append("rect")
                    .attr("x", xScale(region.start))
                    .attr("y", 0)
                    .attr("width", xScale(region.end) - xScale(region.start))
                    .attr("height", innerHeight)
                    .attr("fill", region.color)
                    .attr("opacity", 0.2)
                    .attr("stroke", region.color)
                    .attr("stroke-width", 1);
            }
        });

        // Draw E-value line
        g.append("line")
            .attr("x1", xScale(eValue))
            .attr("x2", xScale(eValue))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8,4");

        // Add labels
        g.append("text")
            .attr("x", xScale(eValue))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`E-value = ${eValue.toFixed(2)}`);

        g.append("text")
            .attr("x", xScale(eValue))
            .attr("y", innerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(results.interpretation);

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).ticks(5);

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
            .text("E-Value");
    };

    // Draw comparison chart
    const drawComparison = () => {
        if (!comparisonRef.current) return;

        const svg = d3.select(comparisonRef.current);
        svg.selectAll("*").remove();

        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const pValue = parameters.pValue;
        const eValue = results.eValue;

        // Create scales
        const xScale = d3.scaleBand()
            .domain(['P-Value', 'E-Value'])
            .range([0, innerWidth])
            .padding(0.3);

        const yScale = d3.scaleLinear()
            .domain([0, Math.max(pValue * 1.2, eValue * 1.2)])
            .range([innerHeight, 0]);

        // Draw bars
        const bars = [
            { label: 'P-Value', value: pValue, color: '#3b82f6' },
            { label: 'E-Value', value: eValue, color: '#10b981' }
        ];

        g.selectAll('.bar')
            .data(bars)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.label) || 0)
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => innerHeight - yScale(d.value))
            .attr('fill', d => d.color)
            .attr('opacity', 0.7)
            .attr('stroke', d => d.color)
            .attr('stroke-width', 2);

        // Add value labels
        g.selectAll('.bar-label')
            .data(bars)
            .enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('x', d => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.value) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .attr('fill', '#1e293b')
            .text(d => d.value.toFixed(4));

        // Add axis
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).ticks(5);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .attr("color", "#64748b");

        g.append("g")
            .call(yAxis)
            .attr("color", "#64748b");

        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 35)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text("P-Value vs E-Value");
    };

    useEffect(() => {
        drawVisualization();
        drawComparison();
    }, [parameters, results]);

    return (
        <div className="e-values fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Understanding E-Values</h1>
                    <p className="page-description">
                        Learn about E-values, a modern alternative to P-values that provides a more intuitive
                        measure of evidence against the null hypothesis.
                    </p>
                </div>

                <div className="improved-simulation-layout">
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">E-Value Visualization</h2>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                        <div className="compact-performance">
                            <h4>Current Results</h4>
                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span className="performance-label">E-Value:</span>
                                    <span className="performance-value">{results.eValue.toFixed(2)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">P-Value:</span>
                                    <span className="performance-value">{parameters.pValue.toFixed(4)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Interpretation:</span>
                                    <span className="performance-value">{results.interpretation}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">P-Value</label>
                                        <input
                                            type="range"
                                            min="0.001"
                                            max="0.2"
                                            step="0.001"
                                            value={parameters.pValue}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                pValue: parseFloat(e.target.value)
                                            }))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.pValue.toFixed(4)}</span>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Test Statistic</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="4"
                                            step="0.1"
                                            value={parameters.testStatistic}
                                            onChange={(e) => setParameters(prev => ({
                                                ...prev,
                                                testStatistic: parseFloat(e.target.value)
                                            }))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.testStatistic.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Comparison</h3>
                            </div>
                            <div className="card-body">
                                <div className="visualization-container">
                                    <svg ref={comparisonRef} className="simulation-svg"></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding E-Values</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What are E-Values?</h4>
                                <p>
                                    E-values are a modern alternative to P-values that provide a more intuitive measure
                                    of evidence against the null hypothesis. An E-value represents the expected number
                                    of times you would observe evidence at least as strong against the null hypothesis
                                    if the null hypothesis were true.
                                </p>

                                <h4>E-Values vs P-Values</h4>
                                <ul>
                                    <li><strong>Interpretation:</strong> E-values are easier to interpret - larger values indicate stronger evidence</li>
                                    <li><strong>Multiple Testing:</strong> E-values handle multiple testing more naturally</li>
                                    <li><strong>Sequential Testing:</strong> E-values can be used in sequential testing without adjustment</li>
                                    <li><strong>Relationship:</strong> E-value ≈ 1/P-value for small P-values</li>
                                </ul>

                                <h4>Interpreting E-Values</h4>
                                <ul>
                                    <li><strong>E-value &lt; 1:</strong> No evidence against the null hypothesis</li>
                                    <li><strong>1 ≤ E-value &lt; 5:</strong> Weak evidence against the null hypothesis</li>
                                    <li><strong>5 ≤ E-value &lt; 20:</strong> Moderate evidence against the null hypothesis</li>
                                    <li><strong>E-value ≥ 20:</strong> Strong evidence against the null hypothesis</li>
                                </ul>

                                <h4>Advantages of E-Values</h4>
                                <ul>
                                    <li>More intuitive interpretation than P-values</li>
                                    <li>Better handling of multiple testing problems</li>
                                    <li>Can be used in sequential testing without adjustment</li>
                                    <li>Provide a continuous measure of evidence</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Clinical Trials:</strong> Evaluating treatment effectiveness with sequential monitoring</li>
                                    <li><strong>Genomics:</strong> Testing multiple hypotheses in gene expression studies</li>
                                    <li><strong>Quality Control:</strong> Sequential monitoring of production processes</li>
                                    <li><strong>A/B Testing:</strong> Continuous monitoring of website experiments</li>
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
                                <Link to="/p-values" className="related-link">P-Values Tutorial</Link>
                                <Link to="/t-test" className="related-link">T-Test Simulator</Link>
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

export default EValues;

