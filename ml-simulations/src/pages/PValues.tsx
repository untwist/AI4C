import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import './PValues.css';

interface PValueScenario {
    id: string;
    name: string;
    testStatistic: number;
    interpretation: string;
    conclusion: string;
}

const PValues: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const comparisonRef = useRef<SVGSVGElement>(null);

    const [testStatistic, setTestStatistic] = useState<number>(1.96);
    const [alpha, setAlpha] = useState<number>(0.05);
    const [tailType, setTailType] = useState<'one-tailed' | 'two-tailed'>('two-tailed');
    const [showPValue, setShowPValue] = useState<boolean>(true);
    const [showCritical, setShowCritical] = useState<boolean>(true);

    const scenarios: PValueScenario[] = [
        {
            id: 'very-low',
            name: 'Very Low P-value (p < 0.001)',
            testStatistic: 3.5,
            interpretation: 'Very strong evidence against the null hypothesis',
            conclusion: 'Highly significant - reject H0'
        },
        {
            id: 'low',
            name: 'Low P-value (p < 0.05)',
            testStatistic: 2.0,
            interpretation: 'Strong evidence against the null hypothesis',
            conclusion: 'Significant - reject H0'
        },
        {
            id: 'borderline',
            name: 'Borderline P-value (p ≈ 0.05)',
            testStatistic: 1.96,
            interpretation: 'Moderate evidence - decision depends on context',
            conclusion: 'Borderline - consider effect size and context'
        },
        {
            id: 'high',
            name: 'High P-value (p > 0.05)',
            testStatistic: 1.0,
            interpretation: 'Weak evidence against the null hypothesis',
            conclusion: 'Not significant - fail to reject H0'
        }
    ];

    // Calculate P-value for standard normal distribution
    const calculatePValue = (z: number, tailType: 'one-tailed' | 'two-tailed'): number => {
        if (tailType === 'one-tailed') {
            return 1 - d3.cumsum([0, ...Array(1000).fill(0.001)].map((_, i) => {
                const x = -4 + i * 0.008;
                return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * 0.008;
            })).find((cum, i) => -4 + i * 0.008 >= z) || 0;
        } else {
            // Two-tailed: multiply by 2
            const oneTail = 1 - d3.cumsum([0, ...Array(1000).fill(0.001)].map((_, i) => {
                const x = -4 + i * 0.008;
                return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * 0.008;
            })).find((cum, i) => -4 + i * 0.008 >= Math.abs(z)) || 0;
            return oneTail * 2;
        }
    };

    // Draw P-value visualization
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

        // Draw the normal distribution
        g.append("path")
            .datum(normalData)
            .attr("fill", "#3b82f6")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", area);

        // Calculate P-value region
        const pValue = calculatePValue(testStatistic, tailType);
        let pValueData: {x: number, y: number}[] = [];

        if (tailType === 'one-tailed') {
            // Right tail
            pValueData = normalData.filter(d => d.x >= testStatistic);
        } else {
            // Two tails
            pValueData = normalData.filter(d => Math.abs(d.x) >= Math.abs(testStatistic));
        }

        // Draw P-value region
        if (showPValue && pValueData.length > 0) {
            if (tailType === 'one-tailed') {
                const regionData = [
                    {x: testStatistic, y: 0},
                    ...pValueData,
                    {x: 4, y: 0}
                ];
                g.append("path")
                    .datum(regionData)
                    .attr("fill", "#ef4444")
                    .attr("fill-opacity", 0.6)
                    .attr("stroke", "#dc2626")
                    .attr("stroke-width", 2)
                    .attr("d", area);
            } else {
                // Left tail
                const leftData = normalData.filter(d => d.x <= -Math.abs(testStatistic));
                if (leftData.length > 0) {
                    const leftRegion = [
                        {x: -4, y: 0},
                        ...leftData,
                        {x: -Math.abs(testStatistic), y: 0}
                    ];
                    g.append("path")
                        .datum(leftRegion)
                        .attr("fill", "#ef4444")
                        .attr("fill-opacity", 0.6)
                        .attr("stroke", "#dc2626")
                        .attr("stroke-width", 2)
                        .attr("d", area);
                }
                // Right tail
                const rightRegion = [
                    {x: Math.abs(testStatistic), y: 0},
                    ...pValueData,
                    {x: 4, y: 0}
                ];
                g.append("path")
                    .datum(rightRegion)
                    .attr("fill", "#ef4444")
                    .attr("fill-opacity", 0.6)
                    .attr("stroke", "#dc2626")
                    .attr("stroke-width", 2)
                    .attr("d", area);
            }
        }

        // Draw critical value lines
        if (showCritical) {
            const criticalValue = tailType === 'one-tailed' ? 1.645 : 1.96;
            
            if (tailType === 'two-tailed') {
                // Left critical value
                g.append("line")
                    .attr("x1", xScale(-criticalValue))
                    .attr("x2", xScale(-criticalValue))
                    .attr("y1", 0)
                    .attr("y2", innerHeight)
                    .attr("stroke", "#f59e0b")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "5,5");
            }
            
            // Right critical value
            g.append("line")
                .attr("x1", xScale(criticalValue))
                .attr("x2", xScale(criticalValue))
                .attr("y1", 0)
                .attr("y2", innerHeight)
                .attr("stroke", "#f59e0b")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5");
        }

        // Draw test statistic line
        g.append("line")
            .attr("x1", xScale(testStatistic))
            .attr("x2", xScale(testStatistic))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8,4");

        // Add labels
        g.append("text")
            .attr("x", xScale(testStatistic))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`Test Statistic = ${testStatistic.toFixed(2)}`);

        g.append("text")
            .attr("x", xScale(testStatistic))
            .attr("y", yScale(0.4))
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", "#dc2626")
            .text(`P-value = ${pValue.toFixed(4)}`);

        if (showCritical) {
            const criticalValue = tailType === 'one-tailed' ? 1.645 : 1.96;
            if (tailType === 'two-tailed') {
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
                .text(`${tailType === 'one-tailed' ? '' : '±'}${criticalValue.toFixed(2)}`);
        }

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

    // Draw P-value comparison chart
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

        const pValue = calculatePValue(testStatistic, tailType);
        const isSignificant = pValue <= alpha;

        // Create scales
        const xScale = d3.scaleBand()
            .domain(['P-value', 'α (Significance Level)'])
            .range([0, innerWidth])
            .padding(0.3);

        const yScale = d3.scaleLinear()
            .domain([0, Math.max(pValue, alpha) * 1.2])
            .range([innerHeight, 0]);

        // Draw bars
        const bars = [
            { label: 'P-value', value: pValue, color: isSignificant ? '#ef4444' : '#10b981' },
            { label: 'α (Significance Level)', value: alpha, color: '#f59e0b' }
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
            .text("Comparison");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -45)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text("Value");
    };

    useEffect(() => {
        drawVisualization();
        drawComparison();
    }, [testStatistic, alpha, tailType, showPValue, showCritical]);

    const currentPValue = calculatePValue(testStatistic, tailType);
    const isSignificant = currentPValue <= alpha;

    return (
        <div className="p-values fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Understanding P-Values</h1>
                    <p className="page-description">
                        Learn what P-values are, how to interpret them, and common misconceptions.
                        P-values are fundamental to hypothesis testing and statistical inference.
                    </p>
                </div>

                <div className="improved-simulation-layout">
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">P-Value Visualization</h2>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                        <div className="compact-performance">
                            <h4>Current Results</h4>
                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span className="performance-label">P-value:</span>
                                    <span className="performance-value">{currentPValue.toFixed(4)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Significance Level (α):</span>
                                    <span className="performance-value">{alpha.toFixed(2)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Test Statistic:</span>
                                    <span className="performance-value">{testStatistic.toFixed(2)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Decision:</span>
                                    <span className="performance-value" style={{color: isSignificant ? '#dc2626' : '#16a34a'}}>
                                        {isSignificant ? 'Reject H0' : 'Fail to Reject H0'}
                                    </span>
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
                                        <label className="label">Test Statistic (Z-score)</label>
                                        <input
                                            type="range"
                                            min="-3"
                                            max="3"
                                            step="0.1"
                                            value={testStatistic}
                                            onChange={(e) => setTestStatistic(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{testStatistic.toFixed(2)}</span>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Significance Level (α)</label>
                                        <input
                                            type="range"
                                            min="0.01"
                                            max="0.2"
                                            step="0.01"
                                            value={alpha}
                                            onChange={(e) => setAlpha(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{alpha.toFixed(2)}</span>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Test Type</label>
                                        <select
                                            value={tailType}
                                            onChange={(e) => setTailType(e.target.value as 'one-tailed' | 'two-tailed')}
                                            className="input"
                                        >
                                            <option value="two-tailed">Two-Tailed</option>
                                            <option value="one-tailed">One-Tailed</option>
                                        </select>
                                    </div>
                                    <div className="checkbox-group">
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={showPValue}
                                                onChange={(e) => setShowPValue(e.target.checked)}
                                            />
                                            Show P-value Region
                                        </label>
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={showCritical}
                                                onChange={(e) => setShowCritical(e.target.checked)}
                                            />
                                            Show Critical Values
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">P-Value Comparison</h3>
                            </div>
                            <div className="card-body">
                                <div className="visualization-container">
                                    <svg ref={comparisonRef} className="simulation-svg"></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="scenarios-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">P-Value Scenarios</h3>
                        </div>
                        <div className="card-body">
                            <div className="scenarios-grid">
                                {scenarios.map(scenario => {
                                    const scenarioPValue = calculatePValue(scenario.testStatistic, tailType);
                                    const scenarioSignificant = scenarioPValue <= alpha;
                                    return (
                                        <div key={scenario.id} className="scenario-card">
                                            <h4 className="scenario-title">{scenario.name}</h4>
                                            <div className="scenario-stats">
                                                <div className="scenario-stat">
                                                    <span className="scenario-label">Test Statistic:</span>
                                                    <span className="scenario-value">{scenario.testStatistic.toFixed(2)}</span>
                                                </div>
                                                <div className="scenario-stat">
                                                    <span className="scenario-label">P-value:</span>
                                                    <span className="scenario-value">{scenarioPValue.toFixed(4)}</span>
                                                </div>
                                                <div className="scenario-stat">
                                                    <span className="scenario-label">Decision:</span>
                                                    <span className="scenario-value" style={{color: scenarioSignificant ? '#dc2626' : '#16a34a'}}>
                                                        {scenarioSignificant ? 'Reject H0' : 'Fail to Reject H0'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="scenario-interpretation"><strong>Interpretation:</strong> {scenario.interpretation}</p>
                                            <p className="scenario-conclusion"><strong>Conclusion:</strong> {scenario.conclusion}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding P-Values</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is a P-Value?</h4>
                                <p>
                                    A P-value is the probability of observing a test statistic as extreme as (or more extreme than)
                                    the one calculated from your sample data, assuming that the null hypothesis is true.
                                </p>
                                <p>
                                    In simpler terms, the P-value tells you: "If the null hypothesis were true, what's the probability
                                    I would see results this extreme (or more extreme) by chance alone?"
                                </p>

                                <h4>How to Interpret P-Values</h4>
                                <ul>
                                    <li><strong>P-value &lt; 0.001:</strong> Very strong evidence against the null hypothesis</li>
                                    <li><strong>0.001 ≤ P-value &lt; 0.01:</strong> Strong evidence against the null hypothesis</li>
                                    <li><strong>0.01 ≤ P-value &lt; 0.05:</strong> Moderate evidence against the null hypothesis</li>
                                    <li><strong>0.05 ≤ P-value &lt; 0.10:</strong> Weak evidence against the null hypothesis</li>
                                    <li><strong>P-value ≥ 0.10:</strong> Little to no evidence against the null hypothesis</li>
                                </ul>

                                <h4>What P-Values Are NOT</h4>
                                <ul>
                                    <li><strong>NOT the probability that H0 is true:</strong> P-values don't tell you the probability that your hypothesis is wrong</li>
                                    <li><strong>NOT the probability of making a Type I error:</strong> That's α (alpha), which you set before the test</li>
                                    <li><strong>NOT a measure of effect size:</strong> A small P-value doesn't mean a large effect</li>
                                    <li><strong>NOT the probability that results are due to chance:</strong> P-values assume H0 is true</li>
                                </ul>

                                <h4>P-Value vs Significance Level (α)</h4>
                                <p>
                                    The significance level (α) is a threshold you choose before conducting your test (commonly 0.05).
                                    Compare your P-value to α:
                                </p>
                                <ul>
                                    <li><strong>If P-value ≤ α:</strong> Reject the null hypothesis (results are statistically significant)</li>
                                    <li><strong>If P-value &gt; α:</strong> Fail to reject the null hypothesis (results are not statistically significant)</li>
                                </ul>

                                <h4>One-Tailed vs Two-Tailed Tests</h4>
                                <ul>
                                    <li><strong>Two-Tailed Test:</strong> Tests for differences in either direction. P-value is the probability in both tails combined.</li>
                                    <li><strong>One-Tailed Test:</strong> Tests for differences in one specific direction. P-value is the probability in one tail only.</li>
                                </ul>
                                <p>
                                    Two-tailed tests are more conservative and are generally preferred unless you have a strong
                                    theoretical reason to test in only one direction.
                                </p>

                                <h4>Common Misconceptions</h4>
                                <ul>
                                    <li><strong>P-value = 0.05 is a magic threshold:</strong> It's a convention, not a rule. Context matters.</li>
                                    <li><strong>Small P-value = Large effect:</strong> P-values measure evidence, not effect size.</li>
                                    <li><strong>P-value &gt; 0.05 = No effect:</strong> You can't prove the null hypothesis is true.</li>
                                    <li><strong>P-value tells you if results are "real":</strong> P-values only tell you about statistical significance, not practical importance.</li>
                                </ul>

                                <h4>P-Value and Effect Size</h4>
                                <p>
                                    A statistically significant result (small P-value) doesn't necessarily mean a practically important result.
                                    Always consider effect size alongside P-values:
                                </p>
                                <ul>
                                    <li>A large sample can produce a small P-value even with a tiny effect</li>
                                    <li>A small sample might fail to detect a large, important effect</li>
                                    <li>Always report both P-values and effect sizes in your results</li>
                                </ul>

                                <h4>Multiple Testing Problem</h4>
                                <p>
                                    When conducting multiple hypothesis tests, the chance of at least one Type I error increases.
                                    If you test 20 hypotheses at α = 0.05, you'd expect about 1 false positive even if all null hypotheses are true.
                                </p>
                                <p>
                                    Solutions include:
                                </p>
                                <ul>
                                    <li>Bonferroni correction: Divide α by the number of tests</li>
                                    <li>False Discovery Rate (FDR) control</li>
                                    <li>Pre-registering your hypotheses</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Medical Research:</strong> Testing if a new treatment is more effective than existing treatments</li>
                                    <li><strong>Quality Control:</strong> Determining if a manufacturing process meets specifications</li>
                                    <li><strong>A/B Testing:</strong> Comparing two versions of a website or product feature</li>
                                    <li><strong>Scientific Research:</strong> Evaluating whether experimental results support a hypothesis</li>
                                </ul>

                                <h4>Best Practices</h4>
                                <ul>
                                    <li>Set your significance level (α) before collecting data</li>
                                    <li>Report exact P-values, not just "p &lt; 0.05"</li>
                                    <li>Always report effect sizes alongside P-values</li>
                                    <li>Consider confidence intervals in addition to P-values</li>
                                    <li>Be transparent about all tests conducted, not just significant ones</li>
                                    <li>Don't use P-values as the sole criterion for decision-making</li>
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
                                <Link to="/e-values" className="related-link">E-Values Tutorial</Link>
                                <Link to="/z-test" className="related-link">Z-Test Simulator</Link>
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

export default PValues;

