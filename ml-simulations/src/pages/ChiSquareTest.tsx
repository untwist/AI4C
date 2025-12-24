import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import './ChiSquareTest.css';

interface ChiSquareParameters {
    testType: 'independence' | 'goodness-of-fit';
    observed: number[][];
    expected?: number[][];
    alpha: number;
}

interface ChiSquareResults {
    chiSquare: number;
    degreesOfFreedom: number;
    pValue: number;
    criticalValue: number;
    decision: 'reject' | 'fail-to-reject';
}

const ChiSquareTest: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    const [parameters, setParameters] = useState<ChiSquareParameters>({
        testType: 'independence',
        observed: [[20, 30], [25, 25]],
        alpha: 0.05
    });

    const [results, setResults] = useState<ChiSquareResults>({
        chiSquare: 0,
        degreesOfFreedom: 1,
        pValue: 0,
        criticalValue: 3.841,
        decision: 'fail-to-reject'
    });

    // Calculate chi-square test
    const calculateChiSquare = (params: ChiSquareParameters): ChiSquareResults => {
        const observed = params.observed;
        let expected: number[][];
        let degreesOfFreedom: number;

        if (params.testType === 'independence') {
            // Calculate expected frequencies for independence test
            const rowSums = observed.map(row => row.reduce((a, b) => a + b, 0));
            const colSums = observed[0].map((_, colIdx) => observed.reduce((sum, row) => sum + row[colIdx], 0));
            const total = rowSums.reduce((a, b) => a + b, 0);

            expected = observed.map((row, rowIdx) =>
                row.map((_, colIdx) => (rowSums[rowIdx] * colSums[colIdx]) / total)
            );

            degreesOfFreedom = (observed.length - 1) * (observed[0].length - 1);
        } else {
            // Goodness-of-fit: assume uniform distribution
            const total = observed.flat().reduce((a, b) => a + b, 0);
            const expectedValue = total / observed.flat().length;
            expected = observed.map(row => row.map(() => expectedValue));
            degreesOfFreedom = observed.flat().length - 1;
        }

        // Calculate chi-square statistic
        let chiSquare = 0;
        for (let i = 0; i < observed.length; i++) {
            for (let j = 0; j < observed[i].length; j++) {
                const diff = observed[i][j] - expected[i][j];
                chiSquare += (diff * diff) / expected[i][j];
            }
        }

        // Approximate critical value (simplified)
        const criticalValue = degreesOfFreedom === 1 ? 3.841 :
                             degreesOfFreedom === 2 ? 5.991 :
                             degreesOfFreedom === 3 ? 7.815 :
                             degreesOfFreedom === 4 ? 9.488 : 12.59;

        // Approximate P-value (simplified)
        const pValue = chiSquare > criticalValue ? 0.01 : 0.05;

        const decision = pValue <= params.alpha ? 'reject' : 'fail-to-reject';

        return {
            chiSquare,
            degreesOfFreedom,
            pValue,
            criticalValue,
            decision
        };
    };

    useEffect(() => {
        const newResults = calculateChiSquare(parameters);
        setResults(newResults);
    }, [parameters]);

    // Draw chi-square distribution visualization
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

        const df = results.degreesOfFreedom;
        const maxX = Math.max(results.chiSquare * 1.5, results.criticalValue * 1.5, 15);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, maxX])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 0.3])
            .range([innerHeight, 0]);

        // Generate chi-square distribution data (approximation)
        const chiSquareData = d3.range(0, maxX, 0.1).map(x => {
            if (x === 0) return { x, y: 0 };
            // Simplified chi-square PDF approximation
            const y = Math.pow(x, df/2 - 1) * Math.exp(-x/2) / (Math.pow(2, df/2) * gamma(df/2));
            return { x, y: y || 0 };
        });

        // Normalize
        const maxY = d3.max(chiSquareData, d => d.y) || 1;
        chiSquareData.forEach(d => d.y = (d.y / maxY) * 0.25);

        // Create area generator
        const area = d3.area<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(d.y))
            .curve(d3.curveBasis);

        // Draw chi-square distribution
        g.append("path")
            .datum(chiSquareData)
            .attr("fill", "#3b82f6")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", area);

        // Draw rejection region
        const reject = chiSquareData.filter(d => d.x >= results.criticalValue);
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

        // Draw chi-square statistic line
        g.append("line")
            .attr("x1", xScale(results.chiSquare))
            .attr("x2", xScale(results.chiSquare))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8,4");

        // Add labels
        g.append("text")
            .attr("x", xScale(results.chiSquare))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`χ² = ${results.chiSquare.toFixed(2)}`);

        g.append("text")
            .attr("x", xScale(results.chiSquare))
            .attr("y", yScale(0.2))
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
            .text(`Chi-Square Value (df = ${df})`);

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

    // Gamma function approximation
    const gamma = (z: number): number => {
        if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
        z -= 1;
        let x = 0.99999999999980993;
        const coefficients = [
            676.5203681218851, -1259.1392167224028, 771.32342877765313,
            -176.61502916214059, 12.507343278686905, -0.13857109526572012,
            9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        for (let i = 0; i < coefficients.length; i++) {
            x += coefficients[i] / (z + i + 1);
        }
        const t = z + coefficients.length - 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    };

    useEffect(() => {
        drawVisualization();
    }, [parameters, results]);

    const updateCell = (row: number, col: number, value: number) => {
        const newObserved = parameters.observed.map((r, ri) =>
            r.map((c, ci) => (ri === row && ci === col) ? Math.max(0, value) : c)
        );
        setParameters(prev => ({ ...prev, observed: newObserved }));
    };

    return (
        <div className="chi-square-test fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Chi-Square Test Simulator</h1>
                    <p className="page-description">
                        Interactive chi-square test for testing independence and goodness-of-fit.
                        Explore contingency tables and categorical data analysis.
                    </p>
                </div>

                <div className="improved-simulation-layout">
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Chi-Square Distribution</h2>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                        <div className="compact-performance">
                            <h4>Test Results</h4>
                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span className="performance-label">Chi-Square:</span>
                                    <span className="performance-value">{results.chiSquare.toFixed(3)}</span>
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
                                                testType: e.target.value as 'independence' | 'goodness-of-fit'
                                            }))}
                                            className="input"
                                        >
                                            <option value="independence">Test for Independence</option>
                                            <option value="goodness-of-fit">Goodness-of-Fit Test</option>
                                        </select>
                                    </div>
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
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Contingency Table</h3>
                            </div>
                            <div className="card-body">
                                <div ref={tableRef} className="contingency-table">
                                    <table>
                                        <tbody>
                                            {parameters.observed.map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    {row.map((cell, colIdx) => (
                                                        <td key={colIdx}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={cell}
                                                                onChange={(e) => updateCell(rowIdx, colIdx, parseInt(e.target.value) || 0)}
                                                                className="table-input"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Chi-Square Tests</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is a Chi-Square Test?</h4>
                                <p>
                                    A chi-square test is used to determine if there is a significant association between
                                    categorical variables or if observed frequencies match expected frequencies.
                                </p>

                                <h4>Types of Chi-Square Tests</h4>
                                <ul>
                                    <li><strong>Test for Independence:</strong> Tests if two categorical variables are independent</li>
                                    <li><strong>Goodness-of-Fit Test:</strong> Tests if observed frequencies match expected frequencies</li>
                                </ul>

                                <h4>When to Use Chi-Square Tests</h4>
                                <ul>
                                    <li>Data are categorical (nominal or ordinal)</li>
                                    <li>Observations are independent</li>
                                    <li>Expected frequencies are at least 5 in each cell</li>
                                    <li>Testing relationships between categorical variables</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Survey Research:</strong> Testing if responses vary by demographic groups</li>
                                    <li><strong>Medical Research:</strong> Testing if treatment outcomes vary by patient characteristics</li>
                                    <li><strong>Marketing:</strong> Testing if purchase behavior varies by customer segments</li>
                                    <li><strong>Quality Control:</strong> Testing if defect rates vary by production line</li>
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
                                <Link to="/anova" className="related-link">ANOVA Simulator</Link>
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

export default ChiSquareTest;

