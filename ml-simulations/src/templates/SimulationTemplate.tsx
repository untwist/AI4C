import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './SimulationTemplate.css';

// ============================================================================
// STANDARDIZED SIMULATION TEMPLATE
// ============================================================================
// This template provides a consistent structure for all ML simulations
// Copy this file and customize it for your specific simulation
// ============================================================================

// 1. DEFINE YOUR DATA INTERFACES
// ============================================================================
interface YourDataPoint {
    id: string;
    // Add your specific data properties here
    x: number;
    y: number;
    label?: string;
    color?: string;
}

interface YourParameters {
    // Add your simulation parameters here
    parameter1: number;
    parameter2: string;
    parameter3: boolean;
}

// 2. DEFINE YOUR SIMULATION COMPONENT
// ============================================================================
const YourSimulationName: React.FC = () => {
    // 3. SETUP REFS AND STATE
    // ============================================================================
    const svgRef = useRef<SVGSVGElement>(null);
    // State for your simulation data
    const [dataPoints] = useState<YourDataPoint[]>([]);
    const [parameters, setParameters] = useState<YourParameters>({
        parameter1: 0.5,
        parameter2: 'default',
        parameter3: true
    });

    // State for visualization controls
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    // State for results/metrics
    const [results, setResults] = useState({
        metric1: 0,
        metric2: 0,
        accuracy: 0
    });

    // 4. DEFINE YOUR ALGORITHM FUNCTIONS
    // ============================================================================
    const calculateYourAlgorithm = (data: YourDataPoint[]) => {
        // Implement your specific algorithm here
        // This is where the core ML logic goes
        return {
            processedData: data,
            metrics: {
                metric1: Math.random(),
                metric2: Math.random(),
                accuracy: Math.random()
            }
        };
    };

    const runSimulation = () => {
        setIsAnimating(true);

        // Your simulation logic here
        const result = calculateYourAlgorithm(dataPoints);
        setResults(result.metrics);

        setTimeout(() => {
            setIsAnimating(false);
        }, 1000);
    };

    // 5. DEFINE YOUR D3 VISUALIZATION
    // ============================================================================
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([innerHeight, 0]);

        // Add grid if enabled
        if (showGrid) {
            const xAxisGrid = d3.axisBottom(xScale)
                .tickSize(-innerHeight)
                .tickFormat(() => "");

            const yAxisGrid = d3.axisLeft(yScale)
                .tickSize(-innerWidth)
                .tickFormat(() => "");

            g.append("g")
                .attr("class", "grid")
                .attr("transform", `translate(0,${innerHeight})`)
                .call(xAxisGrid)
                .style("stroke", "#e2e8f0")
                .style("stroke-width", 1);

            g.append("g")
                .attr("class", "grid")
                .call(yAxisGrid)
                .style("stroke", "#e2e8f0")
                .style("stroke-width", 1);
        }

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .style("color", "#64748b");

        g.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .style("color", "#64748b");

        // Draw your data points
        g.selectAll('.data-point')
            .data(dataPoints)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 4)
            .style('fill', d => d.color || '#3b82f6')
            .style('stroke', '#374151')
            .style('stroke-width', 1)
            .style('opacity', 0.8);

        // Add labels if enabled
        if (showLabels) {
            g.selectAll('.data-label')
                .data(dataPoints)
                .enter()
                .append('text')
                .attr('class', 'data-label')
                .attr('x', d => xScale(d.x) + 8)
                .attr('y', d => yScale(d.y) - 8)
                .text(d => d.label || d.id)
                .style('font-size', '12px')
                .style('fill', '#374151');
        }
    };

    // 6. EFFECTS FOR VISUALIZATION UPDATES
    // ============================================================================
    useEffect(() => {
        drawVisualization();
    }, [dataPoints, parameters, showGrid, showLabels]);

    // 7. EVENT HANDLERS
    // ============================================================================
    const handleParameterChange = (key: keyof YourParameters, value: any) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    const resetSimulation = () => {
        setParameters({
            parameter1: 0.5,
            parameter2: 'default',
            parameter3: true
        });
        setResults({ metric1: 0, metric2: 0, accuracy: 0 });
    };

    // 8. RENDER YOUR SIMULATION
    // ============================================================================
    return (
        <div className="your-simulation-name fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">Your Simulation Name</h1>
                    <p className="page-description">
                        Brief description of what this simulation does and what students will learn.
                        Keep it concise but informative.
                    </p>
                </div>

                {/* STANDARDIZED SIMULATION LAYOUT */}
                <div className="simulation-layout">
                    {/* VISUALIZATION PANEL */}
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Your Visualization Title</h2>
                            <div className="visualization-controls">
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={showGrid}
                                        onChange={(e) => setShowGrid(e.target.checked)}
                                    />
                                    Show Grid
                                </label>
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={showLabels}
                                        onChange={(e) => setShowLabels(e.target.checked)}
                                    />
                                    Show Labels
                                </label>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                    </div>

                    {/* CONTROLS PANEL */}
                    <div className="controls-panel">
                        {/* PARAMETER CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Simulation Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Parameter 1</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={parameters.parameter1}
                                            onChange={(e) => handleParameterChange('parameter1', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.parameter1.toFixed(1)}</span>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Parameter 2</label>
                                        <select
                                            value={parameters.parameter2}
                                            onChange={(e) => handleParameterChange('parameter2', e.target.value)}
                                            className="input"
                                        >
                                            <option value="option1">Option 1</option>
                                            <option value="option2">Option 2</option>
                                            <option value="option3">Option 3</option>
                                        </select>
                                    </div>

                                    <div className="checkbox-group">
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={parameters.parameter3}
                                                onChange={(e) => handleParameterChange('parameter3', e.target.checked)}
                                            />
                                            Enable Feature
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ALGORITHM CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Algorithm Controls</h3>
                            </div>
                            <div className="card-body">
                                <div className="algorithm-controls">
                                    <button
                                        onClick={runSimulation}
                                        className="btn btn-primary"
                                        disabled={isAnimating}
                                    >
                                        {isAnimating ? 'Running...' : 'Run Simulation'}
                                    </button>
                                    <button
                                        onClick={resetSimulation}
                                        className="btn btn-secondary"
                                        disabled={isAnimating}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RESULTS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Results</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    <div className="result-item">
                                        <span className="result-label">Metric 1:</span>
                                        <span className="result-value">{results.metric1.toFixed(3)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Metric 2:</span>
                                        <span className="result-value">{results.metric2.toFixed(3)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Accuracy:</span>
                                        <span className="result-value">{(results.accuracy * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STANDARDIZED EXPLANATION SECTION */}
                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Your Algorithm</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>How It Works</h4>
                                <p>
                                    Explain the core concepts of your algorithm here. Use clear,
                                    accessible language that students can understand.
                                </p>

                                <h4>Key Concepts</h4>
                                <ul>
                                    <li><strong>Concept 1:</strong> Explanation of the first key concept</li>
                                    <li><strong>Concept 2:</strong> Explanation of the second key concept</li>
                                    <li><strong>Concept 3:</strong> Explanation of the third key concept</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Application 1:</strong> How this algorithm is used in practice</li>
                                    <li><strong>Application 2:</strong> Another real-world use case</li>
                                    <li><strong>Application 3:</strong> Industry applications</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STANDARDIZED COPYRIGHT NOTICE */}
                <section className="copyright-section">
                    <div className="copyright-notice">
                        <p>&copy; 2025, Todd Brous. All rights reserved.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default YourSimulationName;
