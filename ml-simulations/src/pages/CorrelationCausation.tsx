import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './CorrelationCausation.css';

// ============================================================================
// CORRELATION SIMULATION
// ============================================================================
// Interactive simulation to teach students about correlation through
// hands-on data exploration and real-time analysis
// ============================================================================

// 1. DATA INTERFACES
// ============================================================================
interface DataPoint {
    id: string;
    x: number;
    y: number;
    label: string;
    category: 'correlation' | 'causation' | 'spurious';
    confoundingVariable?: string;
    explanation: string;
    color: string;
}

interface Dataset {
    name: string;
    description: string;
    xLabel: string;
    yLabel: string;
    correlation: number;
    causation: 'none' | 'direct' | 'indirect' | 'spurious';
    confoundingVariables: string[];
    realWorldContext: string;
    dataPoints: DataPoint[];
}

interface SimulationParameters {
    selectedDataset: string;
    showConfoundingVariables: boolean;
    showTrendLine: boolean;
    showCorrelationCoefficient: boolean;
    animationSpeed: number;
}

// 2. SAMPLE DATASETS
// ============================================================================
const sampleDatasets: Dataset[] = [
    {
        name: 'Ice Cream & Drowning',
        description: 'Classic example of spurious correlation',
        xLabel: 'Ice Cream Sales (gallons)',
        yLabel: 'Drowning Deaths',
        correlation: 0.85,
        causation: 'spurious',
        confoundingVariables: ['Temperature', 'Season', 'Swimming Activity'],
        realWorldContext: 'Both ice cream sales and drowning increase in hot weather',
        dataPoints: [
            { id: '1', x: 50, y: 12, label: 'Jan', category: 'spurious', explanation: 'Cold weather, low ice cream sales, few swimmers', color: '#3b82f6' },
            { id: '2', x: 65, y: 18, label: 'Feb', category: 'spurious', explanation: 'Still cold, moderate ice cream, few swimmers', color: '#3b82f6' },
            { id: '3', x: 80, y: 25, label: 'Mar', category: 'spurious', explanation: 'Spring weather, more ice cream, more swimmers', color: '#3b82f6' },
            { id: '4', x: 120, y: 35, label: 'Apr', category: 'spurious', explanation: 'Warmer weather, high ice cream sales, many swimmers', color: '#3b82f6' },
            { id: '5', x: 150, y: 45, label: 'May', category: 'spurious', explanation: 'Hot weather, peak ice cream sales, peak swimming', color: '#3b82f6' },
            { id: '6', x: 180, y: 55, label: 'Jun', category: 'spurious', explanation: 'Summer heat, maximum ice cream, maximum swimming', color: '#3b82f6' },
            { id: '7', x: 200, y: 65, label: 'Jul', category: 'spurious', explanation: 'Peak summer, peak ice cream, peak swimming activity', color: '#3b82f6' },
            { id: '8', x: 190, y: 60, label: 'Aug', category: 'spurious', explanation: 'Still hot, high ice cream, high swimming', color: '#3b82f6' },
            { id: '9', x: 160, y: 40, label: 'Sep', category: 'spurious', explanation: 'Cooling weather, moderate ice cream, fewer swimmers', color: '#3b82f6' },
            { id: '10', x: 100, y: 25, label: 'Oct', category: 'spurious', explanation: 'Cool weather, low ice cream, few swimmers', color: '#3b82f6' },
            { id: '11', x: 70, y: 15, label: 'Nov', category: 'spurious', explanation: 'Cold weather, minimal ice cream, minimal swimming', color: '#3b82f6' },
            { id: '12', x: 45, y: 10, label: 'Dec', category: 'spurious', explanation: 'Winter weather, no ice cream, no swimming', color: '#3b82f6' }
        ]
    },
    {
        name: 'Shoe Size & Reading Ability',
        description: 'Age as a confounding variable',
        xLabel: 'Shoe Size',
        yLabel: 'Reading Test Score',
        correlation: 0.78,
        causation: 'spurious',
        confoundingVariables: ['Age', 'Developmental Stage', 'School Grade'],
        realWorldContext: 'Both shoe size and reading ability increase with age',
        dataPoints: [
            { id: '1', x: 3, y: 20, label: 'Age 4', category: 'spurious', explanation: 'Small feet, basic reading skills', color: '#ef4444' },
            { id: '2', x: 4, y: 35, label: 'Age 5', category: 'spurious', explanation: 'Growing feet, learning to read', color: '#ef4444' },
            { id: '3', x: 5, y: 50, label: 'Age 6', category: 'spurious', explanation: 'Larger feet, better reading', color: '#ef4444' },
            { id: '4', x: 6, y: 65, label: 'Age 7', category: 'spurious', explanation: 'Bigger feet, improved reading', color: '#ef4444' },
            { id: '5', x: 7, y: 80, label: 'Age 8', category: 'spurious', explanation: 'Even bigger feet, advanced reading', color: '#ef4444' },
            { id: '6', x: 8, y: 90, label: 'Age 9', category: 'spurious', explanation: 'Large feet, excellent reading', color: '#ef4444' },
            { id: '7', x: 9, y: 95, label: 'Age 10', category: 'spurious', explanation: 'Very large feet, expert reading', color: '#ef4444' }
        ]
    },
    {
        name: 'Temperature & Ice Cream Sales',
        description: 'Direct causation example',
        xLabel: 'Temperature (°F)',
        yLabel: 'Ice Cream Sales (gallons)',
        correlation: 0.92,
        causation: 'direct',
        confoundingVariables: [],
        realWorldContext: 'Hot weather directly causes increased ice cream sales',
        dataPoints: [
            { id: '1', x: 32, y: 10, label: '32°F', category: 'causation', explanation: 'Freezing weather, no ice cream demand', color: '#22c55e' },
            { id: '2', x: 45, y: 25, label: '45°F', category: 'causation', explanation: 'Cold weather, minimal ice cream sales', color: '#22c55e' },
            { id: '3', x: 60, y: 50, label: '60°F', category: 'causation', explanation: 'Cool weather, some ice cream sales', color: '#22c55e' },
            { id: '4', x: 75, y: 100, label: '75°F', category: 'causation', explanation: 'Warm weather, good ice cream sales', color: '#22c55e' },
            { id: '5', x: 85, y: 150, label: '85°F', category: 'causation', explanation: 'Hot weather, high ice cream demand', color: '#22c55e' },
            { id: '6', x: 95, y: 200, label: '95°F', category: 'causation', explanation: 'Very hot weather, peak ice cream sales', color: '#22c55e' }
        ]
    },
    {
        name: 'Interactive Experiment',
        description: 'Drag points to explore correlation and causation',
        xLabel: 'Variable X',
        yLabel: 'Variable Y',
        correlation: 0.0,
        causation: 'none',
        confoundingVariables: [],
        realWorldContext: 'Experiment with your own data to understand correlation',
        dataPoints: [
            { id: '1', x: 20, y: 30, label: 'Point 1', category: 'correlation', explanation: 'Drag me to see how correlation changes', color: '#8b5cf6' },
            { id: '2', x: 40, y: 50, label: 'Point 2', category: 'correlation', explanation: 'Move me to explore relationships', color: '#8b5cf6' },
            { id: '3', x: 60, y: 70, label: 'Point 3', category: 'correlation', explanation: 'Drag to create your own pattern', color: '#8b5cf6' },
            { id: '4', x: 80, y: 90, label: 'Point 4', category: 'correlation', explanation: 'Experiment with different positions', color: '#8b5cf6' },
            { id: '5', x: 100, y: 110, label: 'Point 5', category: 'correlation', explanation: 'See how correlation changes', color: '#8b5cf6' },
            { id: '6', x: 120, y: 130, label: 'Point 6', category: 'correlation', explanation: 'Create your own dataset', color: '#8b5cf6' },
            { id: '7', x: 140, y: 150, label: 'Point 7', category: 'correlation', explanation: 'Drag and analyze', color: '#8b5cf6' },
            { id: '8', x: 160, y: 170, label: 'Point 8', category: 'correlation', explanation: 'Explore correlation vs causation', color: '#8b5cf6' }
        ]
    }
];

// 3. CORRELATION VS CAUSATION COMPONENT
// ============================================================================
const CorrelationCausation: React.FC = () => {
    // 4. SETUP REFS AND STATE
    // ============================================================================
    const svgRef = useRef<SVGSVGElement>(null);
    const [currentDataset, setCurrentDataset] = useState<Dataset>(sampleDatasets[0]);
    const [parameters, setParameters] = useState<SimulationParameters>({
        selectedDataset: 'Ice Cream & Drowning',
        showConfoundingVariables: false,
        showTrendLine: true,
        showCorrelationCoefficient: true,
        animationSpeed: 1
    });

    // State for visualization controls
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    // State for results/metrics
    const [results, setResults] = useState({
        correlationCoefficient: 0,
        causationType: 'none',
        confoundingVariables: [] as string[],
        explanation: ''
    });

    // State for draggable data points
    const [isDragging, setIsDragging] = useState(false);
    const [draggedPoint, setDraggedPoint] = useState<string | null>(null);

    // 5. ALGORITHM FUNCTIONS
    // ============================================================================
    const calculateCorrelation = (data: DataPoint[]): number => {
        if (data.length < 2) return 0;

        const n = data.length;
        const sumX = data.reduce((sum, point) => sum + point.x, 0);
        const sumY = data.reduce((sum, point) => sum + point.y, 0);
        const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
        const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
        const sumY2 = data.reduce((sum, point) => sum + point.y * point.y, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    };

    const runSimulation = () => {
        setIsAnimating(true);

        const correlation = calculateCorrelation(currentDataset.dataPoints);
        setResults({
            correlationCoefficient: correlation,
            causationType: currentDataset.causation,
            confoundingVariables: currentDataset.confoundingVariables,
            explanation: currentDataset.realWorldContext
        });

        setTimeout(() => {
            setIsAnimating(false);
        }, 1000);
    };

    // 6. D3 VISUALIZATION
    // ============================================================================
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 60, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xExtent = d3.extent(currentDataset.dataPoints, d => d.x) as [number, number];
        const yExtent = d3.extent(currentDataset.dataPoints, d => d.y) as [number, number];

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([0, innerWidth])
            .nice();

        const yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([innerHeight, 0])
            .nice();

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

        // Add axis labels
        g.append("text")
            .attr("class", "axis-label")
            .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + 45})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#374151")
            .text(currentDataset.xLabel);

        g.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (innerHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#374151")
            .text(currentDataset.yLabel);

        // Add trend line if enabled
        if (parameters.showTrendLine) {
            const correlation = calculateCorrelation(currentDataset.dataPoints);
            const xMean = d3.mean(currentDataset.dataPoints, d => d.x) || 0;
            const yMean = d3.mean(currentDataset.dataPoints, d => d.y) || 0;
            const xStd = d3.deviation(currentDataset.dataPoints, d => d.x) || 1;
            const yStd = d3.deviation(currentDataset.dataPoints, d => d.y) || 1;

            const slope = correlation * (yStd / xStd);
            const intercept = yMean - slope * xMean;

            const line = d3.line<DataPoint>()
                .x(d => xScale(d.x))
                .y(d => yScale(slope * d.x + intercept));

            g.append("path")
                .datum(currentDataset.dataPoints)
                .attr("class", "trend-line")
                .attr("d", line)
                .style("stroke", "#ef4444")
                .style("stroke-width", 2)
                .style("stroke-dasharray", "5,5")
                .style("opacity", 0.8);
        }

        // Draw data points
        const points = g.selectAll('.data-point')
            .data(currentDataset.dataPoints)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 6)
            .style('fill', d => d.color)
            .style('stroke', '#374151')
            .style('stroke-width', 2)
            .style('opacity', 0.8)
            .style('cursor', 'pointer');

        // Add drag functionality for Interactive Experiment dataset
        if (parameters.selectedDataset === 'Interactive Experiment') {
            const drag = d3.drag<SVGCircleElement, DataPoint>()
                .on('start', function (event, d) {
                    setIsDragging(true);
                    setDraggedPoint(d.id);
                    d3.select(this)
                        .transition()
                        .duration(100)
                        .attr('r', 8)
                        .style('opacity', 1);

                    // Store the initial mouse position and point position
                    (d as any).startMouseX = event.x;
                    (d as any).startMouseY = event.y;
                    (d as any).startPointX = d.x;
                    (d as any).startPointY = d.y;
                })
                .on('drag', function (event, d) {
                    // Calculate the change in mouse position
                    const deltaX = event.x - (d as any).startMouseX;
                    const deltaY = event.y - (d as any).startMouseY;

                    // Convert the delta to data coordinates
                    const deltaDataX = xScale.invert(deltaX) - xScale.invert(0);
                    const deltaDataY = yScale.invert(deltaY) - yScale.invert(0);

                    // Calculate new position based on original position + delta
                    const newX = (d as any).startPointX + deltaDataX;
                    const newY = (d as any).startPointY + deltaDataY;

                    // Update the visual position
                    d3.select(this)
                        .attr('cx', xScale(newX))
                        .attr('cy', yScale(newY));

                    // Update the data point in the dataset without triggering re-render
                    const pointIndex = currentDataset.dataPoints.findIndex(p => p.id === d.id);
                    if (pointIndex !== -1) {
                        currentDataset.dataPoints[pointIndex].x = newX;
                        currentDataset.dataPoints[pointIndex].y = newY;
                    }
                })
                .on('end', function (_, d) {
                    // Clean up the stored values first
                    delete (d as any).startMouseX;
                    delete (d as any).startMouseY;
                    delete (d as any).startPointX;
                    delete (d as any).startPointY;

                    // Update the visual position to match the final data position
                    d3.select(this)
                        .attr('cx', xScale(d.x))
                        .attr('cy', yScale(d.y))
                        .transition()
                        .duration(200)
                        .attr('r', 6)
                        .style('opacity', 0.8);

                    // Just set dragging to false - let the existing useEffect handle the analysis
                    setIsDragging(false);
                    setDraggedPoint(null);
                });

            points.call(drag);
        }

        // Add interactivity (only for non-draggable datasets)
        if (parameters.selectedDataset !== 'Interactive Experiment') {
            points
                .on('mouseover', function (_, d) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('r', 8)
                        .style('opacity', 1);

                    // Show tooltip
                    const tooltip = g.append('g')
                        .attr('class', 'tooltip')
                        .style('opacity', 0);

                    tooltip.append('rect')
                        .attr('x', xScale(d.x) + 10)
                        .attr('y', yScale(d.y) - 10)
                        .attr('width', 200)
                        .attr('height', 60)
                        .attr('rx', 4)
                        .style('fill', '#1f2937')
                        .style('opacity', 0.9);

                    tooltip.append('text')
                        .attr('x', xScale(d.x) + 20)
                        .attr('y', yScale(d.y) + 5)
                        .style('fill', 'white')
                        .style('font-size', '12px')
                        .text(d.label);

                    tooltip.append('text')
                        .attr('x', xScale(d.x) + 20)
                        .attr('y', yScale(d.y) + 20)
                        .style('fill', 'white')
                        .style('font-size', '10px')
                        .text(d.explanation);

                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);
                })
                .on('mouseout', function () {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('r', 6)
                        .style('opacity', 0.8);

                    g.selectAll('.tooltip').remove();
                });
        } else {
            // For Interactive Experiment, show simple hover effects
            points
                .on('mouseover', function () {
                    if (!isDragging) {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr('r', 8)
                            .style('opacity', 1);
                    }
                })
                .on('mouseout', function () {
                    if (!isDragging) {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr('r', 6)
                            .style('opacity', 0.8);
                    }
                });
        }

        // Add labels if enabled
        if (showLabels) {
            g.selectAll('.data-label')
                .data(currentDataset.dataPoints)
                .enter()
                .append('text')
                .attr('class', 'data-label')
                .attr('x', d => xScale(d.x) + 10)
                .attr('y', d => yScale(d.y) - 10)
                .text(d => d.label)
                .style('font-size', '12px')
                .style('fill', '#374151');
        }
    };

    // 7. EFFECTS FOR VISUALIZATION UPDATES
    // ============================================================================
    useEffect(() => {
        // Only redraw when dataset actually changes, not when dragging state changes
        drawVisualization();
    }, [currentDataset, parameters, showGrid, showLabels]);

    useEffect(() => {
        const dataset = sampleDatasets.find(d => d.name === parameters.selectedDataset);
        if (dataset) {
            setCurrentDataset(dataset);
            // Auto-analyze when dataset changes
            setTimeout(() => {
                runSimulation();
            }, 100);
        }
    }, [parameters.selectedDataset]);

    // Auto-analyze when dataset data changes (for Interactive Experiment)
    useEffect(() => {
        if (parameters.selectedDataset === 'Interactive Experiment') {
            runSimulation();
        }
    }, [currentDataset.dataPoints]);

    // 8. EVENT HANDLERS
    // ============================================================================
    const handleParameterChange = (key: keyof SimulationParameters, value: any) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    const resetSimulation = () => {
        if (parameters.selectedDataset === 'Interactive Experiment') {
            // Create the original dataset from scratch - don't use the mutated sampleDatasets
            const originalDataset = {
                name: 'Interactive Experiment',
                description: 'Drag points to explore correlation and causation',
                xLabel: 'Variable X',
                yLabel: 'Variable Y',
                correlation: 0.0,
                causation: 'none' as const,
                confoundingVariables: [] as string[],
                realWorldContext: 'Experiment with your own data to understand correlation',
                dataPoints: [
                    { id: '1', x: 20, y: 30, label: 'Point 1', category: 'correlation' as const, explanation: 'Drag me to see how correlation changes', color: '#8b5cf6' },
                    { id: '2', x: 40, y: 50, label: 'Point 2', category: 'correlation' as const, explanation: 'Move me to explore relationships', color: '#8b5cf6' },
                    { id: '3', x: 60, y: 70, label: 'Point 3', category: 'correlation' as const, explanation: 'Drag to create your own pattern', color: '#8b5cf6' },
                    { id: '4', x: 80, y: 90, label: 'Point 4', category: 'correlation' as const, explanation: 'Experiment with different positions', color: '#8b5cf6' },
                    { id: '5', x: 100, y: 110, label: 'Point 5', category: 'correlation' as const, explanation: 'See how correlation changes', color: '#8b5cf6' },
                    { id: '6', x: 120, y: 130, label: 'Point 6', category: 'correlation' as const, explanation: 'Create your own dataset', color: '#8b5cf6' },
                    { id: '7', x: 140, y: 150, label: 'Point 7', category: 'correlation' as const, explanation: 'Drag and analyze', color: '#8b5cf6' },
                    { id: '8', x: 160, y: 170, label: 'Point 8', category: 'correlation' as const, explanation: 'Explore correlation vs causation', color: '#8b5cf6' }
                ]
            };

            // Update the React state - this will trigger re-render and useEffect
            setCurrentDataset(originalDataset);

            // Clear results
            setResults({
                correlationCoefficient: 0,
                causationType: 'none',
                confoundingVariables: [],
                explanation: ''
            });
        } else {
            // Reset to default parameters for other datasets
            setParameters({
                selectedDataset: 'Ice Cream & Drowning',
                showConfoundingVariables: false,
                showTrendLine: true,
                showCorrelationCoefficient: true,
                animationSpeed: 1
            });
            setResults({
                correlationCoefficient: 0,
                causationType: 'none',
                confoundingVariables: [],
                explanation: ''
            });
        }
    };

    // 9. RENDER THE SIMULATION
    // ============================================================================
    return (
        <div className="correlation fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">Correlation</h1>
                    <p className="page-description">
                        Explore correlation through interactive data visualization.
                        Learn to identify different types of correlations and understand how to measure
                        the strength and direction of relationships between variables.
                    </p>
                </div>

                {/* STANDARDIZED SIMULATION LAYOUT */}
                <div className="simulation-layout">
                    {/* VISUALIZATION PANEL */}
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">{currentDataset.name}</h2>
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
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={parameters.showTrendLine}
                                        onChange={(e) => handleParameterChange('showTrendLine', e.target.checked)}
                                    />
                                    Show Trend Line
                                </label>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                    </div>

                    {/* CONTROLS PANEL */}
                    <div className="controls-panel">
                        {/* DATASET SELECTION CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Dataset Selection</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Choose Dataset</label>
                                        <select
                                            value={parameters.selectedDataset}
                                            onChange={(e) => handleParameterChange('selectedDataset', e.target.value)}
                                            className="input"
                                        >
                                            {sampleDatasets.map(dataset => (
                                                <option key={dataset.name} value={dataset.name}>
                                                    {dataset.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="dataset-description">
                                        <p><strong>Description:</strong> {currentDataset.description}</p>
                                        <p><strong>Context:</strong> {currentDataset.realWorldContext}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ALGORITHM CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Simulation Controls</h3>
                            </div>
                            <div className="card-body">
                                <div className="algorithm-controls">
                                    <button
                                        onClick={runSimulation}
                                        className="btn btn-primary"
                                        disabled={isAnimating}
                                    >
                                        {isAnimating ? 'Analyzing...' : 'Analyze Correlation'}
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
                                <h3 className="card-title">Analysis Results</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    <div className="result-item">
                                        <span className="result-label">Correlation:</span>
                                        <span className="result-value">{results.correlationCoefficient.toFixed(3)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Relationship:</span>
                                        <span className="result-value">{results.causationType}</span>
                                    </div>
                                    {results.confoundingVariables.length > 0 && (
                                        <div className="result-item">
                                            <span className="result-label">Confounding Variables:</span>
                                            <span className="result-value">{results.confoundingVariables.join(', ')}</span>
                                        </div>
                                    )}
                                    {results.explanation && (
                                        <div className="explanation-text">
                                            <strong>Explanation:</strong> {results.explanation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* INTERACTIVE EXPERIMENT INSTRUCTIONS */}
                        {parameters.selectedDataset === 'Interactive Experiment' && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Interactive Experiment</h3>
                                </div>
                                <div className="card-body">
                                    <div className="experiment-instructions">
                                        <p><strong>Instructions:</strong></p>
                                        <ul>
                                            <li>Drag the purple points to create your own data pattern</li>
                                            <li>Watch the correlation coefficient change in real-time</li>
                                            <li>Try creating positive, negative, or no correlation</li>
                                            <li>Click "Analyze Correlation" to see detailed results</li>
                                        </ul>
                                        {isDragging && (
                                            <div className="dragging-feedback">
                                                <p>Dragging point: {draggedPoint}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONFOUNDING VARIABLES CARD */}
                        {currentDataset.confoundingVariables.length > 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Confounding Variables</h3>
                                </div>
                                <div className="card-body">
                                    <div className="confounding-variables">
                                        <p>This correlation may be influenced by:</p>
                                        <ul>
                                            {currentDataset.confoundingVariables.map((variable, index) => (
                                                <li key={index}>{variable}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* COMPREHENSIVE EDUCATIONAL SECTION */}
                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Correlation: A Complete Guide</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">

                                {/* WHAT IS CORRELATION */}
                                <div className="concept-section">
                                    <h4>What is Correlation?</h4>
                                    <p>
                                        Correlation is a statistical measure that describes the strength and direction of a linear relationship
                                        between two variables. Think of it as a way to quantify how two things move together - or don't move together.
                                    </p>

                                    <div className="math-explanation">
                                        <h5>The Mathematics Behind Correlation</h5>
                                        <p>The Pearson correlation coefficient (r) is calculated using this formula:</p>
                                        <div className="formula">
                                            <p><strong>r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]</strong></p>
                                        </div>
                                        <p>Where:</p>
                                        <ul>
                                            <li><strong>xi, yi:</strong> Individual data points</li>
                                            <li><strong>x̄, ȳ:</strong> Means of x and y variables</li>
                                            <li><strong>Σ:</strong> Sum of all data points</li>
                                        </ul>
                                    </div>

                                    <div className="correlation-strength">
                                        <h5>Interpreting Correlation Strength</h5>
                                        <ul>
                                            <li><strong>r = 1.0:</strong> Perfect positive correlation (points form a perfect upward line)</li>
                                            <li><strong>r = 0.7 to 0.9:</strong> Strong positive correlation</li>
                                            <li><strong>r = 0.3 to 0.7:</strong> Moderate positive correlation</li>
                                            <li><strong>r = 0.1 to 0.3:</strong> Weak positive correlation</li>
                                            <li><strong>r = 0:</strong> No linear correlation</li>
                                            <li><strong>r = -0.1 to -0.3:</strong> Weak negative correlation</li>
                                            <li><strong>r = -0.3 to -0.7:</strong> Moderate negative correlation</li>
                                            <li><strong>r = -0.7 to -0.9:</strong> Strong negative correlation</li>
                                            <li><strong>r = -1.0:</strong> Perfect negative correlation (points form a perfect downward line)</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* TYPES OF CORRELATION */}
                                <div className="concept-section">
                                    <h4>Types of Correlation</h4>

                                    <div className="correlation-types">
                                        <h5>1. Positive Correlation</h5>
                                        <p>As one variable increases, the other also increases. Examples:</p>
                                        <ul>
                                            <li><strong>Height and Weight:</strong> Taller people tend to weigh more</li>
                                            <li><strong>Study Time and Test Scores:</strong> More studying generally leads to better grades</li>
                                            <li><strong>Temperature and Ice Cream Sales:</strong> Hotter weather increases ice cream demand</li>
                                        </ul>

                                        <h5>2. Negative Correlation</h5>
                                        <p>As one variable increases, the other decreases. Examples:</p>
                                        <ul>
                                            <li><strong>Price and Demand:</strong> Higher prices usually reduce demand</li>
                                            <li><strong>Age and Reaction Time:</strong> Older adults typically have slower reaction times</li>
                                            <li><strong>Screen Time and Sleep Quality:</strong> More screen time often reduces sleep quality</li>
                                        </ul>

                                        <h5>3. No Correlation (Zero Correlation)</h5>
                                        <p>No linear relationship exists between variables. Examples:</p>
                                        <ul>
                                            <li><strong>Shoe Size and Intelligence:</strong> No relationship between foot size and IQ</li>
                                            <li><strong>Hair Color and Income:</strong> Hair color doesn't predict earning potential</li>
                                            <li><strong>Birth Month and Height:</strong> When you're born doesn't affect how tall you grow</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* CREATIVE AND DESIGN APPLICATIONS */}
                                <div className="concept-section">
                                    <h4>Correlation in Creative and Design Fields</h4>

                                    <div className="creative-applications">
                                        <h5>User Experience (UX) Design</h5>
                                        <ul>
                                            <li><strong>Button Color and Click Rate:</strong> Certain colors may correlate with higher engagement</li>
                                            <li><strong>Page Load Time and Bounce Rate:</strong> Faster sites typically have lower bounce rates</li>
                                            <li><strong>Font Size and Reading Speed:</strong> Larger fonts may correlate with faster reading</li>
                                        </ul>

                                        <h5>Marketing and Branding</h5>
                                        <ul>
                                            <li><strong>Brand Recognition and Purchase Intent:</strong> Better recognition often correlates with higher purchase likelihood</li>
                                            <li><strong>Social Media Engagement and Sales:</strong> More likes/shares may correlate with increased revenue</li>
                                            <li><strong>Color Psychology and Brand Perception:</strong> Certain colors correlate with specific brand attributes</li>
                                        </ul>

                                        <h5>Visual Design and Aesthetics</h5>
                                        <ul>
                                            <li><strong>White Space and Perceived Quality:</strong> More white space often correlates with premium perception</li>
                                            <li><strong>Color Contrast and Accessibility:</strong> Higher contrast correlates with better accessibility scores</li>
                                            <li><strong>Visual Hierarchy and User Navigation:</strong> Clear hierarchy correlates with easier navigation</li>
                                        </ul>

                                        <h5>Data Visualization</h5>
                                        <ul>
                                            <li><strong>Chart Type and Data Comprehension:</strong> Certain chart types correlate with better understanding</li>
                                            <li><strong>Color Coding and Information Retention:</strong> Consistent color schemes correlate with better memory</li>
                                            <li><strong>Interactive Elements and Engagement:</strong> More interactivity often correlates with longer engagement</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* COMMON PITFALLS */}
                                <div className="concept-section">
                                    <h4>Common Correlation Pitfalls</h4>

                                    <div className="pitfalls">
                                        <h5>1. Correlation ≠ Causation</h5>
                                        <p>The most important principle: correlation does not imply causation. Just because two variables are related doesn't mean one causes the other.</p>

                                        <div className="example-box">
                                            <h6>Example: Ice Cream and Drowning</h6>
                                            <p>There's a strong correlation between ice cream sales and drowning deaths. Does ice cream cause drowning? No! The real cause is temperature - hot weather increases both ice cream sales and swimming, leading to more drowning incidents.</p>
                                        </div>

                                        <h5>2. Spurious Correlations</h5>
                                        <p>Sometimes correlations exist purely by chance or due to hidden factors.</p>

                                        <div className="example-box">
                                            <h6>Example: Nicolas Cage Movies and Pool Drownings</h6>
                                            <p>There's a correlation between the number of Nicolas Cage movies released and the number of people who drown in pools. This is purely coincidental and has no causal relationship.</p>
                                        </div>

                                        <h5>3. Non-Linear Relationships</h5>
                                        <p>Correlation only measures linear relationships. Variables might have strong non-linear relationships that correlation won't detect.</p>

                                        <div className="example-box">
                                            <h6>Example: Age and Technology Adoption</h6>
                                            <p>The relationship between age and smartphone usage isn't linear - it peaks in middle age and decreases at both ends. Linear correlation might miss this U-shaped relationship.</p>
                                        </div>

                                        <h5>4. Outliers and Extreme Values</h5>
                                        <p>Single extreme values can dramatically affect correlation coefficients.</p>

                                        <div className="example-box">
                                            <h6>Example: Income and Happiness</h6>
                                            <p>One billionaire in a study of 100 people can make income and happiness appear more correlated than they actually are for most people.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* STATISTICAL SIGNIFICANCE */}
                                <div className="concept-section">
                                    <h4>Statistical Significance and Sample Size</h4>

                                    <div className="significance-explanation">
                                        <h5>Sample Size Matters</h5>
                                        <p>Correlation coefficients can be misleading with small sample sizes:</p>
                                        <ul>
                                            <li><strong>n &lt; 30:</strong> Correlation may not be reliable</li>
                                            <li><strong>n = 30-100:</strong> Moderate reliability</li>
                                            <li><strong>n &gt; 100:</strong> Generally reliable for most purposes</li>
                                        </ul>

                                        <h5>P-Values and Confidence</h5>
                                        <p>Statistical tests help determine if a correlation is likely due to chance:</p>
                                        <ul>
                                            <li><strong>p &lt; 0.05:</strong> Statistically significant (less than 5% chance it's random)</li>
                                            <li><strong>p &lt; 0.01:</strong> Highly significant (less than 1% chance it's random)</li>
                                            <li><strong>p &gt; 0.05:</strong> Not statistically significant (could be due to chance)</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* PRACTICAL APPLICATIONS */}
                                <div className="concept-section">
                                    <h4>Practical Applications in Data Analysis</h4>

                                    <div className="applications">
                                        <h5>1. Feature Selection in Machine Learning</h5>
                                        <p>Correlation helps identify which variables are most related to your target variable, guiding feature selection for predictive models.</p>

                                        <h5>2. A/B Testing and Experimentation</h5>
                                        <p>Understanding correlation helps design better experiments and interpret results more accurately.</p>

                                        <h5>3. User Research and Analytics</h5>
                                        <p>Correlation analysis reveals patterns in user behavior, helping optimize products and experiences.</p>

                                        <h5>4. Business Intelligence</h5>
                                        <p>Correlation helps identify key performance indicators and understand what drives business success.</p>
                                    </div>
                                </div>

                                {/* HOW TO USE THIS SIMULATION */}
                                <div className="concept-section">
                                    <h4>How to Use This Simulation Effectively</h4>

                                    <div className="simulation-guide">
                                        <h5>1. Start with Sample Datasets</h5>
                                        <p>Explore the pre-loaded datasets to understand different types of correlations and their real-world contexts.</p>

                                        <h5>2. Experiment with the Interactive Mode</h5>
                                        <p>Use the Interactive Experiment to:</p>
                                        <ul>
                                            <li>Create your own data patterns</li>
                                            <li>See how moving points affects correlation</li>
                                            <li>Test different correlation strengths</li>
                                            <li>Understand the relationship between visual patterns and correlation values</li>
                                        </ul>

                                        <h5>3. Analyze the Results</h5>
                                        <p>Pay attention to:</p>
                                        <ul>
                                            <li>Correlation coefficient values and their interpretation</li>
                                            <li>Confounding variables that might affect the relationship</li>
                                            <li>Real-world context and explanations</li>
                                            <li>Whether the relationship suggests causation</li>
                                        </ul>

                                        <h5>4. Practice Critical Thinking</h5>
                                        <p>For each dataset, ask yourself:</p>
                                        <ul>
                                            <li>Could this correlation be spurious?</li>
                                            <li>What hidden variables might be at play?</li>
                                            <li>How would you design an experiment to test causation?</li>
                                            <li>What other factors could explain this relationship?</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* FURTHER LEARNING */}
                                <div className="concept-section">
                                    <h4>Further Learning Resources</h4>

                                    <div className="learning-resources">
                                        <h5>Key Concepts to Explore Next</h5>
                                        <ul>
                                            <li><strong>Regression Analysis:</strong> How to predict one variable from another</li>
                                            <li><strong>Multiple Correlation:</strong> Relationships between multiple variables</li>
                                            <li><strong>Causal Inference:</strong> Methods for establishing causation</li>
                                            <li><strong>Experimental Design:</strong> How to design studies that can prove causation</li>
                                        </ul>

                                        <h5>Statistical Software</h5>
                                        <ul>
                                            <li><strong>Excel/Google Sheets:</strong> Basic correlation functions (CORREL)</li>
                                            <li><strong>R:</strong> Advanced statistical analysis (cor(), cor.test())</li>
                                            <li><strong>Python:</strong> Data analysis with pandas and scipy</li>
                                            <li><strong>SPSS/Stata:</strong> Professional statistical software</li>
                                        </ul>
                                    </div>
                                </div>
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

export default CorrelationCausation;
