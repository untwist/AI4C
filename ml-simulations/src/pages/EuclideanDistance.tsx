import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import './EuclideanDistance.css';
import type { DataPoint, DistanceCalculation, Dataset } from '../types/euclidean-types';

const EuclideanDistance: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const xAxisRef = useRef<SVGGElement>(null);
    const yAxisRef = useRef<SVGGElement>(null);

    // Core state
    const [selectedDataset, setSelectedDataset] = useState<string>('canvas');
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [selectedPoints, setSelectedPoints] = useState<DataPoint[]>([]);
    const [metric, setMetric] = useState<'euclidean' | 'manhattan'>('euclidean');

    // UI state
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [dimensions, setDimensions] = useState<{ width: number, height: number }>({ width: 800, height: 450 });
    const [draggedPointId, setDraggedPointId] = useState<string | null>(null);

    // Sample datasets
    const datasets: { [key: string]: Dataset } = useMemo(() => ({
        canvas: {
            name: 'Studio Canvas Layout',
            description: 'Assets on a 100x100 design project canvas. Where do they sit relative to each other?',
            optimalK: 3,
            features: ['Horizontal (X)', 'Vertical (Y)'],
            data: [
                { id: 'logo', x: 10, y: 10, label: 'Main Logo', color: '#ef4444' },
                { id: 'headline', x: 30, y: 15, label: 'Headline', color: '#3b82f6' },
                { id: 'hero', x: 50, y: 50, label: 'Hero Image', color: '#10b981' },
                { id: 'cta', x: 80, y: 80, label: 'Call to Action', color: '#f59e0b' },
                { id: 'footer1', x: 10, y: 90, label: 'Footer Text', color: '#6b7280' },
                { id: 'footer2', x: 30, y: 90, label: 'Copyright', color: '#6b7280' }
            ]
        },
        icons: {
            name: 'Icon Library Grouping',
            description: 'A set of interface icons. Notice how similar "types" cluster together spatially.',
            optimalK: 3,
            features: ['Complexity', 'Weight'],
            data: [
                { id: 'i1', x: 15, y: 20, label: 'Dot Icon', color: '#8b5cf6' },
                { id: 'i2', x: 20, y: 25, label: 'Line Icon', color: '#8b5cf6' },
                { id: 'i3', x: 18, y: 15, label: 'Plus Icon', color: '#8b5cf6' },
                { id: 'i4', x: 70, y: 75, label: 'User Avatar', color: '#ec4899' },
                { id: 'i5', x: 75, y: 80, label: 'Settings Gear', color: '#ec4899' },
                { id: 'i6', x: 80, y: 70, label: 'Bell Notification', color: '#ec4899' }
            ]
        }
    }), []);

    // Selection toggle
    const togglePointSelection = useCallback((point: DataPoint) => {
        setSelectedPoints(prev => {
            const isSelected = prev.some(p => p.id === point.id);
            if (isSelected) {
                return prev.filter(p => p.id !== point.id);
            } else {
                return [...prev, point];
            }
        });
    }, []);

    // Dimensions and Scales
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const xScale = useMemo(() => d3.scaleLinear().domain([0, 100]).range([0, innerWidth]), [innerWidth]);
    const yScale = useMemo(() => d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]), [innerHeight]);

    // Update dimensions on resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: Math.max(600, rect.width), height: 450 });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize data
    useEffect(() => {
        setDataPoints(datasets[selectedDataset].data);
        setSelectedPoints([]);
    }, [selectedDataset, datasets]);

    // Update Axes
    useEffect(() => {
        if (xAxisRef.current) {
            d3.select(xAxisRef.current).call(d3.axisBottom(xScale));
        }
        if (yAxisRef.current) {
            d3.select(yAxisRef.current).call(d3.axisLeft(yScale));
        }
    }, [xScale, yScale]);

    // Distances
    const distances: DistanceCalculation[] = useMemo(() => {
        if (selectedPoints.length < 2) return [];
        const result: DistanceCalculation[] = [];
        for (let i = 0; i < selectedPoints.length; i++) {
            for (let j = i + 1; j < selectedPoints.length; j++) {
                const a = selectedPoints[i];
                const b = selectedPoints[j];
                const d = metric === 'euclidean'
                    ? Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
                    : Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
                result.push({ pointA: a, pointB: b, distance: d, isHighlighted: true });
            }
        }
        return result;
    }, [selectedPoints, metric]);

    // Drag handling
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggedPointId || !containerRef.current) return;
        const rect = containerRef.current.querySelector('svg')?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left - margin.left;
        const mouseY = e.clientY - rect.top - margin.top;

        const newX = Math.max(0, Math.min(100, xScale.invert(mouseX)));
        const newY = Math.max(0, Math.min(100, yScale.invert(mouseY)));

        setDataPoints(prev => prev.map(p => p.id === draggedPointId ? { ...p, x: newX, y: newY } : p));
        setSelectedPoints(prev => prev.map(p => p.id === draggedPointId ? { ...p, x: newX, y: newY } : p));
    };

    const handleMouseUp = () => setDraggedPointId(null);

    return (
        <div className="euclidean-distance fade-in" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="container" ref={containerRef}>
                <div className="page-header">
                    <h1 className="page-title">Euclidean Distance: The Designer's Ruler</h1>
                    <p className="page-description">
                        How far apart are elements on your canvas? <strong>Euclidean distance</strong> is your "as the crow flies" measurement.
                        Compare it with <strong>Manhattan distance</strong> to see how "grid-based" layout changes everything.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <div className="mode-toggle">
                                <button
                                    className={`btn ${metric === 'euclidean' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setMetric('euclidean')}
                                >
                                    Euclidean (Shortest Path)
                                </button>
                                <button
                                    className={`btn ${metric === 'manhattan' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setMetric('manhattan')}
                                >
                                    Manhattan (Grid Path)
                                </button>
                            </div>
                            <div className="visualization-controls">
                                <label className="control-label"><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Grid</label>
                                <label className="control-label"><input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} /> Labels</label>
                            </div>
                        </div>

                        <div className="visualization-container" style={{ position: 'relative', height: '450px' }}>
                            <svg width={dimensions.width} height={dimensions.height} style={{ overflow: 'visible' }}>
                                <g transform={`translate(${margin.left}, ${margin.top})`}>
                                    {/* Gridlines */}
                                    {showGrid && (
                                        <g className="grid">
                                            {xScale.ticks(10).map(t => (
                                                <line key={`x-${t}`} x1={xScale(t)} y1={0} x2={xScale(t)} y2={innerHeight} stroke="#f1f5f9" />
                                            ))}
                                            {yScale.ticks(10).map(t => (
                                                <line key={`y-${t}`} x1={0} y1={yScale(t)} x2={innerWidth} y2={yScale(t)} stroke="#f1f5f9" />
                                            ))}
                                        </g>
                                    )}

                                    {/* Axes */}
                                    <g ref={xAxisRef} transform={`translate(0, ${innerHeight})`} style={{ color: '#94a3b8' }} />
                                    <g ref={yAxisRef} style={{ color: '#94a3b8' }} />

                                    {/* Distance Lines */}
                                    {distances.map((d, i) => (
                                        <g key={`dist-${i}`}>
                                            {metric === 'euclidean' ? (
                                                <line
                                                    x1={xScale(d.pointA.x)} y1={yScale(d.pointA.y)}
                                                    x2={xScale(d.pointB.x)} y2={yScale(d.pointB.y)}
                                                    stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4"
                                                />
                                            ) : (
                                                <path
                                                    d={`M ${xScale(d.pointA.x)} ${yScale(d.pointA.y)} L ${xScale(d.pointB.x)} ${yScale(d.pointA.y)} L ${xScale(d.pointB.x)} ${yScale(d.pointB.y)}`}
                                                    fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4"
                                                />
                                            )}
                                            <text
                                                x={(xScale(d.pointA.x) + xScale(d.pointB.x)) / 2}
                                                y={(yScale(d.pointA.y) + yScale(d.pointB.y)) / 2 - 10}
                                                textAnchor="middle" fontSize="12" fill="#d97706" fontWeight="bold"
                                            >
                                                {d.distance.toFixed(1)}
                                            </text>
                                        </g>
                                    ))}

                                    {/* Nodes */}
                                    {dataPoints.map(p => {
                                        const isSelected = selectedPoints.some(sp => sp.id === p.id);
                                        return (
                                            <g
                                                key={p.id}
                                                className="node"
                                                onMouseDown={(e) => { e.stopPropagation(); setDraggedPointId(p.id); }}
                                                onClick={(e) => { e.stopPropagation(); togglePointSelection(p); }}
                                                style={{ cursor: draggedPointId === p.id ? 'grabbing' : 'pointer' }}
                                            >
                                                <circle
                                                    cx={xScale(p.x)} cy={yScale(p.y)}
                                                    r={isSelected ? 12 : 8}
                                                    fill={p.color || '#cbd5e1'}
                                                    stroke={isSelected ? '#d97706' : '#fff'} strokeWidth="3"
                                                />
                                                {showLabels && (
                                                    <text
                                                        x={xScale(p.x)} y={yScale(p.y) - 18}
                                                        textAnchor="middle" fontSize="12" fontWeight="medium" fill="#475569"
                                                        pointerEvents="none"
                                                    >
                                                        {p.label || p.id}
                                                    </text>
                                                )}
                                            </g>
                                        );
                                    })}
                                </g>
                            </svg>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Project Setting</h3></div>
                            <div className="card-body">
                                <select
                                    value={selectedDataset}
                                    onChange={(e) => setSelectedDataset(e.target.value)}
                                    className="btn btn-outline"
                                    style={{ width: '100%', textAlign: 'left' }}
                                >
                                    <option value="canvas">Studio Canvas Layout</option>
                                    <option value="icons">Icon Library Grouping</option>
                                </select>
                                <p className="text-secondary-600 text-xs" style={{ marginTop: '0.5rem' }}>
                                    {datasets[selectedDataset].description}
                                </p>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Distance Ruler</h3></div>
                            <div className="card-body">
                                {selectedPoints.length < 2 ? (
                                    <p className="text-secondary-500 text-sm">Click two assets on the canvas to measure the distance between them.</p>
                                ) : (
                                    <div className="calculation-display">
                                        <div className="calculation-item" style={{ backgroundColor: 'var(--primary-50)', borderColor: 'var(--primary-200)', display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid' }}>
                                            <span className="calculation-label"><strong>Total Distance:</strong></span>
                                            <span className="calculation-value" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-600)' }}>
                                                {distances[0]?.distance.toFixed(2)} units
                                            </span>
                                        </div>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPoints([])} style={{ marginTop: '1rem', width: '100%' }}>Clear Ruler</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">The Intuition</h3></div>
                            <div className="card-body explanation-content">
                                <p>In design, distance relative to the grid matters just as much as proximity:</p>
                                <ul>
                                    <li><strong>Euclidean Distance:</strong> A straight line ruler between two points. It's the most common way to measure "spatial similarity".</li>
                                    <li><strong>Manhattan Distance:</strong> Measuring along the X and Y axes (like walking blocks in New York). Crucial for calculating padding, margins, and grid alignments.</li>
                                </ul>
                                <blockquote style={{ borderLeft: '4px solid var(--primary-200)', padding: 'var(--space-4)', margin: 'var(--space-6) 0', backgroundColor: 'var(--primary-50)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', fontStyle: 'italic', color: 'var(--primary-700)' }}>
                                    "If you want to know if two objects are close, use Euclidean. If you want to know how much 'travel' a cursor needs on a grid, use Manhattan."
                                </blockquote>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Practical Exercise</h3></div>
                            <div className="card-body explanation-content">
                                <p>Try these designer moves:</p>
                                <ol>
                                    <li><strong>Measure Alignment:</strong> Select 'Main Logo' and 'Headline'. Check the Manhattan distance—does the X-offset match your eye?</li>
                                    <li><strong>Check Proximity:</strong> Compare the Euclidean distance between two icons vs. two layout blocks. Similiar items are usually clustered closer together.</li>
                                    <li><strong>Live Layout:</strong> Drag an asset and watch the ruler update. This is how algorithms like K-Means calculate where items "belong".</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="copyright-section" style={{ marginTop: 'var(--space-16)', paddingTop: 'var(--space-8)', borderTop: '1px solid var(--secondary-200)' }}>
                    <div className="copyright-notice" style={{ textAlign: 'center', color: 'var(--secondary-600)', fontSize: 'var(--font-size-sm)' }}>
                        <p>&copy; 2025, Todd Brous. All rights reserved.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default EuclideanDistance;
