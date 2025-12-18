import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import './CosineSimilarity.css';

interface Vector {
    x: number;
    y: number;
    label: string;
    color: string;
}

type SimulationMode = 'abstract' | 'color';

const CosineSimilarity: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [mode, setMode] = useState<SimulationMode>('abstract');
    const [vectorA, setVectorA] = useState<Vector>({ x: 3, y: 4, label: 'A', color: '#ef4444' });
    const [vectorB, setVectorB] = useState<Vector>({ x: 4, y: 3, label: 'B', color: '#3b82f6' });
    const [showGrid, setShowGrid] = useState(true);
    const [showAngle, setShowAngle] = useState(true);
    const [showMagnitude, setShowMagnitude] = useState(true);
    const [similarity, setSimilarity] = useState(0);

    // Calculate cosine similarity
    const calculateCosineSimilarity = useCallback((a: Vector, b: Vector): number => {
        const dotProduct = a.x * b.x + a.y * b.y;
        const magnitudeA = Math.sqrt(a.x * a.x + a.y * a.y);
        const magnitudeB = Math.sqrt(b.x * b.x + b.y * b.y);

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        return dotProduct / (magnitudeA * magnitudeB);
    }, []);

    // Calculate angle between vectors in degrees
    const calculateAngle = useCallback((a: Vector, b: Vector): number => {
        const sim = calculateCosineSimilarity(a, b);
        return Math.acos(Math.max(-1, Math.min(1, sim))) * (180 / Math.PI);
    }, [calculateCosineSimilarity]);

    // Update similarity when vectors change
    useEffect(() => {
        const sim = calculateCosineSimilarity(vectorA, vectorB);
        setSimilarity(sim);
    }, [vectorA, vectorB, calculateCosineSimilarity]);

    // Draw the visualization
    useEffect(() => {
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
            .domain(mode === 'abstract' ? [-6, 6] : [0, 6])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain(mode === 'abstract' ? [-6, 6] : [0, 6])
            .range([innerHeight, 0]);

        // Add grid
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

        // Axis Labels for Color Mode
        if (mode === 'color') {
            g.append("text")
                .attr("x", innerWidth)
                .attr("y", innerHeight + 35)
                .attr("text-anchor", "end")
                .attr("font-size", "12px")
                .attr("fill", "#ef4444")
                .attr("font-weight", "bold")
                .text("Redness →");

            g.append("text")
                .attr("x", -innerHeight / 2)
                .attr("y", -30)
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("font-size", "12px")
                .attr("fill", "#3b82f6")
                .attr("font-weight", "bold")
                .text("Bluenness →");
        }

        // Draw vectors
        const drawVector = (vector: Vector, label: string) => {
            const vColor = mode === 'color'
                ? (label === 'A' ? '#ef4444' : '#3b82f6')
                : vector.color;

            g.append("line")
                .attr("x1", xScale(0))
                .attr("y1", yScale(0))
                .attr("x2", xScale(vector.x))
                .attr("y2", yScale(vector.y))
                .attr("stroke", vColor)
                .attr("stroke-width", 4)
                .attr("marker-end", `url(#arrowhead-${label.toLowerCase()})`);

            // Add vector label
            g.append("text")
                .attr("x", xScale(vector.x) + 10)
                .attr("y", yScale(vector.y) - 10)
                .attr("text-anchor", "start")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", vColor)
                .text(`${mode === 'color' ? 'Swatch' : 'Vector'} ${label}`);

            // Swatch Preview in Color Mode
            if (mode === 'color') {
                const r = Math.round(Math.max(0, vector.x) * 40);
                const b = Math.round(Math.max(0, vector.y) * 40);
                const colorStr = `rgb(${r}, 0, ${b})`;

                g.append("rect")
                    .attr("x", xScale(vector.x) - 15)
                    .attr("y", yScale(vector.y) + 10)
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("fill", colorStr)
                    .attr("stroke", "#ccc")
                    .attr("rx", 4);
            }

            // Add magnitude display
            if (showMagnitude) {
                const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
                g.append("text")
                    .attr("x", xScale(vector.x / 2))
                    .attr("y", yScale(vector.y / 2) - 15)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", vColor)
                    .text(`${mode === 'color' ? 'Intensity' : '|' + label + '|'} = ${magnitude.toFixed(2)}`);
            }
        };

        // Draw angle arc
        if (showAngle && (vectorA.x !== 0 || vectorA.y !== 0) && (vectorB.x !== 0 || vectorB.y !== 0)) {
            const angle = calculateAngle(vectorA, vectorB);
            const radius = 40;

            const angleA = Math.atan2(vectorA.y, vectorA.x);
            const angleB = Math.atan2(vectorB.y, vectorB.x);

            let startAngle = angleA;
            let endAngle = angleB;

            if (Math.abs(angleA - angleB) > Math.PI) {
                if (angleA < angleB) {
                    startAngle = angleB;
                    endAngle = angleA + 2 * Math.PI;
                } else {
                    startAngle = angleA;
                    endAngle = angleB + 2 * Math.PI;
                }
            }

            const arcGenerator = d3.arc<void>()
                .innerRadius(0)
                .outerRadius(radius)
                .startAngle(Math.PI / 2 - startAngle)
                .endAngle(Math.PI / 2 - endAngle);

            g.append("path")
                .attr("d", arcGenerator() as string)
                .attr("transform", `translate(${xScale(0)},${yScale(0)})`)
                .attr("fill", "#f59e0b")
                .attr("opacity", 0.2);

            // Add angle label
            const midAngle = (startAngle + endAngle) / 2;
            const labelRadius = radius + 20;
            const labelX = xScale(0) + Math.cos(midAngle) * labelRadius;
            const labelY = yScale(0) - Math.sin(midAngle) * labelRadius;

            g.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "#d97706")
                .attr("font-weight", "bold")
                .text(`${angle.toFixed(1)}°`);
        }

        // Draw vectors
        drawVector(vectorA, "A");
        drawVector(vectorB, "B");

        // Add arrow markers
        const defs = svg.append("defs");
        const addMarker = (id: string, color: string) => {
            defs.append("marker")
                .attr("id", id)
                .attr("viewBox", "0 0 10 10")
                .attr("refX", 8)
                .attr("refY", 5)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M 0 0 L 10 5 L 0 10 z")
                .attr("fill", color);
        };

        addMarker("arrowhead-a", mode === 'color' ? '#ef4444' : vectorA.color);
        addMarker("arrowhead-b", mode === 'color' ? '#3b82f6' : vectorB.color);

    }, [vectorA, vectorB, showGrid, showAngle, showMagnitude, mode, calculateAngle]);


    const handleVectorChange = (vectorType: 'A' | 'B', axis: 'x' | 'y', value: number) => {
        if (vectorType === 'A') {
            setVectorA(prev => ({ ...prev, [axis]: value }));
        } else {
            setVectorB(prev => ({ ...prev, [axis]: value }));
        }
    };

    const resetVectors = () => {
        if (mode === 'color') {
            setVectorA({ x: 3, y: 1, label: 'A', color: '#ef4444' });
            setVectorB({ x: 1, y: 3, label: 'B', color: '#3b82f6' });
        } else {
            setVectorA({ x: 3, y: 4, label: 'A', color: '#0ea5e9' });
            setVectorB({ x: 4, y: 3, label: 'B', color: '#22c55e' });
        }
    };

    return (
        <div className="cosine-similarity fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Cosine Similarity: The "Flavor" of Data</h1>
                    <p className="page-description">
                        In design, two colors can be the same "hue" even if one is bright and the other is dark.
                        <strong>Cosine Similarity</strong> works the same way: it measures the <em>direction</em> (the flavor)
                        of data while ignoring its <em>magnitude</em> (the intensity).
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <div className="mode-toggle">
                                <button
                                    className={`btn ${mode === 'abstract' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => { setMode('abstract'); resetVectors(); }}
                                >
                                    Abstract Mode
                                </button>
                                <button
                                    className={`btn ${mode === 'color' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => { setMode('color'); resetVectors(); }}
                                >
                                    Color Mode (R vs B)
                                </button>
                            </div>
                            <div className="visualization-controls">
                                <label className="control-label">
                                    <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                                    Grid
                                </label>
                                <label className="control-label">
                                    <input type="checkbox" checked={showAngle} onChange={(e) => setShowAngle(e.target.checked)} />
                                    Angle
                                </label>
                                <label className="control-label">
                                    <input type="checkbox" checked={showMagnitude} onChange={(e) => setShowMagnitude(e.target.checked)} />
                                    Intensity
                                </label>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="vector-svg"></svg>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">{mode === 'color' ? 'Color Swatch Controls' : 'Vector Controls'}</h3>
                            </div>
                            <div className="card-body">
                                <div className="vector-controls">
                                    <div className="vector-control">
                                        <h4 className="vector-label" style={{ color: mode === 'color' ? '#ef4444' : vectorA.color }}>
                                            {mode === 'color' ? 'Swatch A' : 'Vector A'}
                                        </h4>
                                        <div className="vector-inputs">
                                            <div className="input-group">
                                                <label className="label">{mode === 'color' ? 'Red Component' : 'X Axis'}</label>
                                                <input
                                                    type="range" width="100%"
                                                    min={mode === 'color' ? "0" : "-5"} max="5" step="0.1"
                                                    value={vectorA.x}
                                                    onChange={(e) => handleVectorChange('A', 'x', parseFloat(e.target.value))}
                                                    className="slider"
                                                />
                                                <span className="value-display">{vectorA.x.toFixed(1)}</span>
                                            </div>
                                            <div className="input-group">
                                                <label className="label">{mode === 'color' ? 'Blue Component' : 'Y Axis'}</label>
                                                <input
                                                    type="range" width="100%"
                                                    min={mode === 'color' ? "0" : "-5"} max="5" step="0.1"
                                                    value={vectorA.y}
                                                    onChange={(e) => handleVectorChange('A', 'y', parseFloat(e.target.value))}
                                                    className="slider"
                                                />
                                                <span className="value-display">{vectorA.y.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="vector-control">
                                        <h4 className="vector-label" style={{ color: mode === 'color' ? '#3b82f6' : vectorB.color }}>
                                            {mode === 'color' ? 'Swatch B' : 'Vector B'}
                                        </h4>
                                        <div className="vector-inputs">
                                            <div className="input-group">
                                                <label className="label">{mode === 'color' ? 'Red Component' : 'X Axis'}</label>
                                                <input
                                                    type="range" width="100%"
                                                    min={mode === 'color' ? "0" : "-5"} max="5" step="0.1"
                                                    value={vectorB.x}
                                                    onChange={(e) => handleVectorChange('B', 'x', parseFloat(e.target.value))}
                                                    className="slider"
                                                />
                                                <span className="value-display">{vectorB.x.toFixed(1)}</span>
                                            </div>
                                            <div className="input-group">
                                                <label className="label">{mode === 'color' ? 'Blue Component' : 'Y Axis'}</label>
                                                <input
                                                    type="range" width="100%"
                                                    min={mode === 'color' ? "0" : "-5"} max="5" step="0.1"
                                                    value={vectorB.y}
                                                    onChange={(e) => handleVectorChange('B', 'y', parseFloat(e.target.value))}
                                                    className="slider"
                                                />
                                                <span className="value-display">{vectorB.y.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                    <button onClick={resetVectors} className="btn btn-secondary">Reset View</button>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Similarity Score</h3>
                            </div>
                            <div className="card-body">
                                <div className="calculation-display">
                                    <div className="calculation-item" style={{ backgroundColor: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
                                        <span className="calculation-label"><strong>Similarity Card:</strong></span>
                                        <span className="calculation-value" style={{ fontSize: '1.5rem' }}>{similarity.toFixed(4)}</span>
                                    </div>
                                    <p className="text-xs text-secondary-600" style={{ marginTop: '0.5rem' }}>
                                        1.0 = Industrial / Same Hue<br />
                                        0.0 = Totally Different<br />
                                        -1.0 = Polar Opposites
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Intuitive Concept</h3>
                            </div>
                            <div className="card-body explanation-content">
                                <p>Imagine you are comparing two mixed paint colors:</p>
                                <ul>
                                    <li><strong>Direction (Hue):</strong> The <em>ratio</em> of Red paint to Blue paint. If Color A and Color B have the same ratio, they are the same hue.</li>
                                    <li><strong>Magnitude (Intensity):</strong> How much paint is in the bucket. A tiny drop of Red/Blue mix has the same "hue" as a gallon of the same mix.</li>
                                </ul>
                                <p>
                                    <strong>Cosine Similarity</strong> only cares about the hue. It asks: "Are these buckets pointing towards the same shade of purple?"
                                    It completely ignores the size of the bucket.
                                </p>
                                <blockquote>
                                    "It's about <strong>what</strong> it is, not <strong>how much</strong> of it there is."
                                </blockquote>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Academic Basics</h3>
                            </div>
                            <div className="card-body explanation-content">
                                <h4>The Core Math</h4>
                                <p>Mathematically, we find the <strong>cosine of the angle</strong> (θ) between two vectors. </p>
                                <div className="formula" style={{ fontSize: '1.2rem' }}>
                                    Similarity = cos(θ)
                                </div>
                                <ul>
                                    <li><strong>When angle is 0°:</strong> Similarity is <strong>1.0</strong> (Identical direction).</li>
                                    <li><strong>When angle is 90°:</strong> Similarity is <strong>0.0</strong> (Orthogonal/Unrelated).</li>
                                    <li><strong>When angle is 180°:</strong> Similarity is <strong>-1.0</strong> (Directly opposite).</li>
                                </ul>
                                <p>
                                    This is useful in AI (like ChatGPT) because we can represent the "meaning" of a word as a direction. Words with similar meanings point in the same direction!
                                </p>
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

export default CosineSimilarity;
