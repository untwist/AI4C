import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import './HypothesisTesting.css';

interface TestLink {
    id: string;
    title: string;
    path: string;
    description: string;
    category: 'test' | 'tutorial';
}

const HypothesisTesting: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const errorVizRef = useRef<SVGSVGElement>(null);

    const [alpha, setAlpha] = useState<number>(0.05);
    const [showNullDist, setShowNullDist] = useState<boolean>(true);
    const [showAltDist, setShowAltDist] = useState<boolean>(true);

    const testLinks: TestLink[] = [
        {
            id: 'z-test',
            title: 'Z-Test',
            path: '/z-test',
            description: 'Test for means when population variance is known',
            category: 'test'
        },
        {
            id: 't-test',
            title: 'T-Test',
            path: '/t-test',
            description: 'Test for comparing means with unknown variance',
            category: 'test'
        },
        {
            id: 'chi-square-test',
            title: 'Chi-Square Test',
            path: '/chi-square-test',
            description: 'Test for independence and goodness-of-fit',
            category: 'test'
        },
        {
            id: 'anova',
            title: 'ANOVA',
            path: '/anova',
            description: 'Analysis of Variance for comparing multiple groups',
            category: 'test'
        },
        {
            id: 'p-values',
            title: 'P-Values Tutorial',
            path: '/p-values',
            description: 'Understanding P-values and statistical significance',
            category: 'tutorial'
        },
        {
            id: 'e-values',
            title: 'E-Values Tutorial',
            path: '/e-values',
            description: 'Learn about E-values as an alternative to P-values',
            category: 'tutorial'
        }
    ];

    // Draw hypothesis testing flow diagram
    const drawFlowDiagram = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 550;
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Define flow steps with better sizing for text
        const steps = [
            { id: 1, x: 80, y: 40, text: ['State Hypotheses', '(H0 and H1)'], width: 140, height: 70 },
            { id: 2, x: 280, y: 40, text: ['Choose', 'Significance Level', '(α)'], width: 140, height: 70 },
            { id: 3, x: 480, y: 40, text: ['Select', 'Test Statistic'], width: 140, height: 70 },
            { id: 4, x: 80, y: 180, text: ['Calculate', 'Test Statistic'], width: 140, height: 70 },
            { id: 5, x: 280, y: 180, text: ['Find', 'P-value'], width: 140, height: 70 },
            { id: 6, x: 480, y: 180, text: ['Make', 'Decision'], width: 140, height: 70 },
            { id: 7, x: 280, y: 320, text: ['Reject H0', 'or', 'Fail to Reject H0'], width: 160, height: 80 }
        ];

        // Add arrowhead marker definition (once)
        const defs = svg.append("defs");
        defs.append("marker")
            .attr("id", "arrowhead")
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("refX", 9)
            .attr("refY", 3)
            .attr("orient", "auto")
            .append("polygon")
            .attr("points", "0 0, 10 3, 0 6")
            .attr("fill", "#3b82f6");

        // Draw arrows
        const arrows = [
            { from: steps[0], to: steps[1] },
            { from: steps[1], to: steps[2] },
            { from: steps[2], to: steps[3] },
            { from: steps[3], to: steps[4] },
            { from: steps[4], to: steps[5] },
            { from: steps[5], to: steps[6] }
        ];

        arrows.forEach(arrow => {
            g.append("line")
                .attr("x1", arrow.from.x + arrow.from.width / 2)
                .attr("y1", arrow.from.y + arrow.from.height / 2)
                .attr("x2", arrow.to.x + arrow.to.width / 2)
                .attr("y2", arrow.to.y + arrow.to.height / 2)
                .attr("stroke", "#3b82f6")
                .attr("stroke-width", 2)
                .attr("marker-end", "url(#arrowhead)");
        });

        // Draw step boxes with proper multi-line text
        steps.forEach(step => {
            const group = g.append("g");

            group.append("rect")
                .attr("x", step.x)
                .attr("y", step.y)
                .attr("width", step.width)
                .attr("height", step.height)
                .attr("fill", "#dbeafe")
                .attr("stroke", "#3b82f6")
                .attr("stroke-width", 2)
                .attr("rx", 8);

            // Create text element with multiple lines
            const textElement = group.append("text")
                .attr("x", step.x + step.width / 2)
                .attr("y", step.y + step.height / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-size", "11px")
                .attr("font-weight", "600")
                .attr("fill", "#1e40af");

            // Calculate line spacing based on number of lines
            const lineHeight = 14;
            const totalHeight = (step.text.length - 1) * lineHeight;
            const startY = step.y + step.height / 2 - totalHeight / 2 + lineHeight / 2;

            // Add each line as a tspan
            step.text.forEach((line, index) => {
                textElement.append("tspan")
                    .attr("x", step.x + step.width / 2)
                    .attr("dy", index === 0 ? 0 : lineHeight)
                    .text(line);
            });
        });
    };

    // Draw Type I and Type II error visualization
    const drawErrorVisualization = () => {
        if (!errorVizRef.current) return;

        const svg = d3.select(errorVizRef.current);
        svg.selectAll("*").remove();

        const width = 700;
        const height = 400;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Parameters
        const nullMean = 0;
        const altMean = 2;
        const stdDev = 1;
        const criticalValue = d3.quantile(d3.range(-4, 4, 0.01).map(x => 
            Math.exp(-0.5 * Math.pow((x - nullMean) / stdDev, 2))
        ), 1 - alpha) || 1.645;

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([-4, 6])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 0.5])
            .range([innerHeight, 0]);

        // Generate normal distribution data
        const generateNormal = (mean: number, stdDev: number, domain: number[]) => {
            return d3.range(domain[0], domain[1], 0.01).map(x => ({
                x,
                y: (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                   Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2))
            }));
        };

        const nullData = generateNormal(nullMean, stdDev, [-4, 6]);
        const altData = generateNormal(altMean, stdDev, [-4, 6]);

        // Create area generators
        const areaNull = d3.area<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(d.y))
            .curve(d3.curveBasis);

        const areaAlt = d3.area<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(d.y))
            .curve(d3.curveBasis);

        // Draw null distribution
        if (showNullDist) {
            g.append("path")
                .datum(nullData)
                .attr("fill", "#3b82f6")
                .attr("fill-opacity", 0.3)
                .attr("stroke", "#3b82f6")
                .attr("stroke-width", 2)
                .attr("d", areaNull);

            // Type I error region (reject H0 when H0 is true)
            const type1Data = nullData.filter(d => d.x >= criticalValue);
            if (type1Data.length > 0) {
                g.append("path")
                    .datum([{x: criticalValue, y: 0}, ...type1Data, {x: 6, y: 0}])
                    .attr("fill", "#ef4444")
                    .attr("fill-opacity", 0.5)
                    .attr("stroke", "#dc2626")
                    .attr("stroke-width", 2)
                    .attr("d", areaNull);
            }
        }

        // Draw alternative distribution
        if (showAltDist) {
            g.append("path")
                .datum(altData)
                .attr("fill", "#10b981")
                .attr("fill-opacity", 0.3)
                .attr("stroke", "#10b981")
                .attr("stroke-width", 2)
                .attr("d", areaAlt);

            // Type II error region (fail to reject H0 when H1 is true)
            const type2Data = altData.filter(d => d.x < criticalValue);
            if (type2Data.length > 0) {
                g.append("path")
                    .datum([{x: -4, y: 0}, ...type2Data, {x: criticalValue, y: 0}])
                    .attr("fill", "#f59e0b")
                    .attr("fill-opacity", 0.5)
                    .attr("stroke", "#d97706")
                    .attr("stroke-width", 2)
                    .attr("d", areaAlt);
            }
        }

        // Draw critical value line
        g.append("line")
            .attr("x1", xScale(criticalValue))
            .attr("x2", xScale(criticalValue))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");

        // Add labels
        g.append("text")
            .attr("x", xScale(criticalValue))
            .attr("y", innerHeight + 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`Critical Value (α = ${alpha})`);

        if (showNullDist) {
            g.append("text")
                .attr("x", xScale(nullMean))
                .attr("y", yScale(0.4) - 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "600")
                .attr("fill", "#1e40af")
                .text("H0 Distribution");

            g.append("text")
                .attr("x", xScale(criticalValue + 1))
                .attr("y", yScale(0.1))
                .attr("font-size", "11px")
                .attr("font-weight", "600")
                .attr("fill", "#dc2626")
                .text("Type I Error");
        }

        if (showAltDist) {
            g.append("text")
                .attr("x", xScale(altMean))
                .attr("y", yScale(0.4) - 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "600")
                .attr("fill", "#059669")
                .text("H1 Distribution");

            g.append("text")
                .attr("x", xScale(criticalValue - 1))
                .attr("y", yScale(0.2))
                .attr("font-size", "11px")
                .attr("font-weight", "600")
                .attr("fill", "#d97706")
                .text("Type II Error");
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
            .text("Test Statistic");

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
        drawFlowDiagram();
        drawErrorVisualization();
    }, [alpha, showNullDist, showAltDist]);

    return (
        <div className="hypothesis-testing fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Hypothesis Testing</h1>
                    <p className="page-description">
                        Learn the fundamentals of hypothesis testing, a cornerstone of statistical inference.
                        Explore different statistical tests and understand how to make data-driven decisions.
                    </p>
                </div>

                <div className="improved-simulation-layout">
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Hypothesis Testing Process</h2>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Error Types Visualization</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
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
                                    <div className="checkbox-group">
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={showNullDist}
                                                onChange={(e) => setShowNullDist(e.target.checked)}
                                            />
                                            Show Null Distribution (H0)
                                        </label>
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={showAltDist}
                                                onChange={(e) => setShowAltDist(e.target.checked)}
                                            />
                                            Show Alternative Distribution (H1)
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="additional-visualizations">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Type I and Type II Errors</h3>
                        </div>
                        <div className="card-body">
                            <div className="visualization-container">
                                <svg ref={errorVizRef} className="simulation-svg"></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="test-links-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Statistical Tests</h3>
                        </div>
                        <div className="card-body">
                            <div className="test-links-grid">
                                {testLinks.filter(link => link.category === 'test').map(link => (
                                    <Link key={link.id} to={link.path} className="test-link-card">
                                        <h4 className="test-link-title">{link.title}</h4>
                                        <p className="test-link-description">{link.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Tutorials</h3>
                        </div>
                        <div className="card-body">
                            <div className="test-links-grid">
                                {testLinks.filter(link => link.category === 'tutorial').map(link => (
                                    <Link key={link.id} to={link.path} className="test-link-card">
                                        <h4 className="test-link-title">{link.title}</h4>
                                        <p className="test-link-description">{link.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Hypothesis Testing</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is Hypothesis Testing?</h4>
                                <p>
                                    Hypothesis testing is a statistical method used to make decisions about population parameters
                                    based on sample data. It provides a structured framework for evaluating whether observed
                                    differences or relationships in data are statistically significant or due to random chance.
                                </p>

                                <h4>The Hypothesis Testing Process</h4>
                                <ol className="instruction-list">
                                    <li><strong>State Hypotheses:</strong> Formulate the null hypothesis (H0) and alternative hypothesis (H1). The null hypothesis typically represents "no effect" or "no difference."</li>
                                    <li><strong>Choose Significance Level:</strong> Select α (alpha), the probability of making a Type I error. Common values are 0.05, 0.01, or 0.10.</li>
                                    <li><strong>Select Test Statistic:</strong> Choose the appropriate statistical test based on your data type and research question.</li>
                                    <li><strong>Calculate Test Statistic:</strong> Compute the test statistic from your sample data.</li>
                                    <li><strong>Find P-value:</strong> Determine the probability of observing your test statistic (or more extreme) if the null hypothesis is true.</li>
                                    <li><strong>Make Decision:</strong> Compare the P-value to α. If P-value ≤ α, reject H0; otherwise, fail to reject H0.</li>
                                    <li><strong>Draw Conclusion:</strong> State your conclusion in the context of the original research question.</li>
                                </ol>

                                <h4>Type I and Type II Errors</h4>
                                <ul>
                                    <li><strong>Type I Error (α):</strong> Rejecting the null hypothesis when it is actually true. This is a false positive. The significance level α controls the probability of Type I errors.</li>
                                    <li><strong>Type II Error (β):</strong> Failing to reject the null hypothesis when it is actually false. This is a false negative. The power of a test (1 - β) is the probability of correctly rejecting a false null hypothesis.</li>
                                </ul>

                                <h4>Choosing the Right Test</h4>
                                <p>Different statistical tests are appropriate for different situations:</p>
                                <ul>
                                    <li><strong>Z-Test:</strong> Use when population variance is known and sample size is large</li>
                                    <li><strong>T-Test:</strong> Use when population variance is unknown and sample size is small</li>
                                    <li><strong>Chi-Square Test:</strong> Use for categorical data and testing independence</li>
                                    <li><strong>ANOVA:</strong> Use when comparing means across three or more groups</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Medical Research:</strong> Testing whether a new drug is more effective than a placebo</li>
                                    <li><strong>Quality Control:</strong> Determining if a manufacturing process meets specifications</li>
                                    <li><strong>Marketing:</strong> Evaluating whether a new advertising campaign increases sales</li>
                                    <li><strong>Education:</strong> Assessing whether a new teaching method improves student performance</li>
                                </ul>

                                <h4>Common Pitfalls</h4>
                                <ul>
                                    <li><strong>Confusing statistical significance with practical significance:</strong> A statistically significant result may not be practically meaningful</li>
                                    <li><strong>Multiple testing problem:</strong> Conducting many tests increases the chance of Type I errors</li>
                                    <li><strong>P-hacking:</strong> Manipulating data or analysis to achieve significant results</li>
                                    <li><strong>Misinterpreting P-values:</strong> P-values do not tell you the probability that H0 is true</li>
                                </ul>
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

export default HypothesisTesting;

