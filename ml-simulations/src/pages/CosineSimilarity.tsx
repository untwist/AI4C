import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './CosineSimilarity.css';

interface Vector {
    x: number;
    y: number;
    label: string;
    color: string;
}

const CosineSimilarity: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [vectorA, setVectorA] = useState<Vector>({ x: 3, y: 4, label: 'A', color: '#0ea5e9' });
    const [vectorB, setVectorB] = useState<Vector>({ x: 4, y: 3, label: 'B', color: '#22c55e' });
    const [showGrid, setShowGrid] = useState(true);
    const [showAngle, setShowAngle] = useState(true);
    const [showMagnitude, setShowMagnitude] = useState(true);
    const [similarity, setSimilarity] = useState(0);

    // Calculate cosine similarity
    const calculateCosineSimilarity = (a: Vector, b: Vector): number => {
        const dotProduct = a.x * b.x + a.y * b.y;
        const magnitudeA = Math.sqrt(a.x * a.x + a.y * a.y);
        const magnitudeB = Math.sqrt(b.x * b.x + b.y * b.y);

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        return dotProduct / (magnitudeA * magnitudeB);
    };

    // Calculate angle between vectors in degrees
    const calculateAngle = (a: Vector, b: Vector): number => {
        const dotProduct = a.x * b.x + a.y * b.y;
        const magnitudeA = Math.sqrt(a.x * a.x + a.y * a.y);
        const magnitudeB = Math.sqrt(b.x * b.x + b.y * b.y);

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        const cosAngle = dotProduct / (magnitudeA * magnitudeB);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
    };

    // Update similarity when vectors change
    useEffect(() => {
        const sim = calculateCosineSimilarity(vectorA, vectorB);
        setSimilarity(sim);
    }, [vectorA, vectorB]);

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
            .domain([-6, 6])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([-6, 6])
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

        // Draw vectors
        const drawVector = (vector: Vector, label: string) => {
            g.append("line")
                .attr("x1", xScale(0))
                .attr("y1", yScale(0))
                .attr("x2", xScale(vector.x))
                .attr("y2", yScale(vector.y))
                .attr("stroke", vector.color)
                .attr("stroke-width", 3)
                .attr("marker-end", `url(#arrowhead-${label.toLowerCase()})`);

            // Add vector label
            g.append("text")
                .attr("x", xScale(vector.x) + 10)
                .attr("y", yScale(vector.y) - 10)
                .attr("text-anchor", "start")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", vector.color)
                .text(`Vector ${label}`);

            // Add magnitude display
            if (showMagnitude) {
                const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
                g.append("text")
                    .attr("x", xScale(vector.x / 2))
                    .attr("y", yScale(vector.y / 2) - 15)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", vector.color)
                    .text(`|${label}| = ${magnitude.toFixed(2)}`);
            }
        };

        // Draw angle arc using simple SVG path
        if (showAngle && vectorA.x !== 0 && vectorA.y !== 0 && vectorB.x !== 0 && vectorB.y !== 0) {
            const angle = calculateAngle(vectorA, vectorB);
            const radius = 30;

            // Calculate unit vectors (normalized directions)
            const magnitudeA = Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y);
            const magnitudeB = Math.sqrt(vectorB.x * vectorB.x + vectorB.y * vectorB.y);

            const unitA = { x: vectorA.x / magnitudeA, y: vectorA.y / magnitudeA };
            const unitB = { x: vectorB.x / magnitudeB, y: vectorB.y / magnitudeB };

            // Calculate the angle between vectors
            const angleA = Math.atan2(unitA.y, unitA.x);
            const angleB = Math.atan2(unitB.y, unitB.x);

            // Ultra-simple approach: always draw from Vector A to Vector B
            let startAngle = angleA;
            let endAngle = angleB;

            // If the angle difference is greater than π, go the other way to get the smaller angle
            if (Math.abs(angleA - angleB) > Math.PI) {
                if (angleA < angleB) {
                    startAngle = angleB;
                    endAngle = angleA + 2 * Math.PI;
                } else {
                    startAngle = angleA;
                    endAngle = angleB + 2 * Math.PI;
                }
            }

            // Create a simple arc path
            const centerX = xScale(0);
            const centerY = yScale(0);

            // Calculate start and end points on the arc
            const startX = centerX + Math.cos(startAngle) * radius;
            const startY = centerY - Math.sin(startAngle) * radius; // Flip Y for SVG
            const endX = centerX + Math.cos(endAngle) * radius;
            const endY = centerY - Math.sin(endAngle) * radius; // Flip Y for SVG

            // Create arc path using SVG path syntax
            const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;
            const sweepFlag = 1; // Always sweep in positive direction

            const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

            g.append("path")
                .attr("d", pathData)
                .attr("fill", "none")
                .attr("stroke", "#f59e0b")
                .attr("stroke-width", 3)
                .attr("opacity", 0.7);

            // Add angle label at the midpoint of the arc
            const midAngle = (startAngle + endAngle) / 2;
            const labelRadius = radius + 15;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY - Math.sin(midAngle) * labelRadius; // Flip Y for SVG

            g.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "#f59e0b")
                .attr("font-weight", "bold")
                .text(`${angle.toFixed(1)}°`);
        }

        // Draw vectors
        drawVector(vectorA, "A");
        drawVector(vectorB, "B");

        // Add arrow markers
        const defs = svg.append("defs");

        defs.append("marker")
            .attr("id", "arrowhead-a")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 8)
            .attr("refY", 3)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0 L0,6 L9,3 z")
            .attr("fill", vectorA.color);

        defs.append("marker")
            .attr("id", "arrowhead-b")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 8)
            .attr("refY", 3)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0 L0,6 L9,3 z")
            .attr("fill", vectorB.color);

    }, [vectorA, vectorB, showGrid, showAngle, showMagnitude]);

    const handleVectorChange = (vectorType: 'A' | 'B', axis: 'x' | 'y', value: number) => {
        if (vectorType === 'A') {
            setVectorA(prev => ({ ...prev, [axis]: value }));
        } else {
            setVectorB(prev => ({ ...prev, [axis]: value }));
        }
    };

    const resetVectors = () => {
        setVectorA({ x: 3, y: 4, label: 'A', color: '#0ea5e9' });
        setVectorB({ x: 4, y: 3, label: 'B', color: '#22c55e' });
    };

    const loadPreset = (preset: string) => {
        switch (preset) {
            case 'identical':
                setVectorA({ x: 3, y: 4, label: 'A', color: '#0ea5e9' });
                setVectorB({ x: 3, y: 4, label: 'B', color: '#22c55e' });
                break;
            case 'orthogonal':
                setVectorA({ x: 3, y: 0, label: 'A', color: '#0ea5e9' });
                setVectorB({ x: 0, y: 3, label: 'B', color: '#22c55e' });
                break;
            case 'opposite':
                setVectorA({ x: 3, y: 4, label: 'A', color: '#0ea5e9' });
                setVectorB({ x: -3, y: -4, label: 'B', color: '#22c55e' });
                break;
            case 'similar':
                setVectorA({ x: 4, y: 3, label: 'A', color: '#0ea5e9' });
                setVectorB({ x: 3, y: 4, label: 'B', color: '#22c55e' });
                break;
        }
    };

    return (
        <div className="cosine-similarity fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Cosine Similarity Simulator</h1>
                    <p className="page-description">
                        Explore how vectors relate to each other through angle and magnitude.
                        Cosine similarity measures the cosine of the angle between two vectors,
                        providing a value between -1 and 1.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Vector Visualization</h2>
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
                                        checked={showAngle}
                                        onChange={(e) => setShowAngle(e.target.checked)}
                                    />
                                    Show Angle
                                </label>
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={showMagnitude}
                                        onChange={(e) => setShowMagnitude(e.target.checked)}
                                    />
                                    Show Magnitude
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
                                <h3 className="card-title">Vector Controls</h3>
                            </div>
                            <div className="card-body">
                                <div className="vector-controls">
                                    <div className="vector-control">
                                        <h4 className="vector-label">Vector A</h4>
                                        <div className="vector-inputs">
                                            <div className="input-group">
                                                <label className="label">X Component</label>
                                                <input
                                                    type="range"
                                                    min="-5"
                                                    max="5"
                                                    step="0.1"
                                                    value={vectorA.x}
                                                    onChange={(e) => handleVectorChange('A', 'x', parseFloat(e.target.value))}
                                                    className="slider"
                                                />
                                                <span className="value-display">{vectorA.x.toFixed(1)}</span>
                                            </div>
                                            <div className="input-group">
                                                <label className="label">Y Component</label>
                                                <input
                                                    type="range"
                                                    min="-5"
                                                    max="5"
                                                    step="0.1"
                                                    value={vectorA.y}
                                                    onChange={(e) => handleVectorChange('A', 'y', parseFloat(e.target.value))}
                                                    className="slider"
                                                />
                                                <span className="value-display">{vectorA.y.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="vector-control">
                                        <h4 className="vector-label">Vector B</h4>
                                        <div className="vector-inputs">
                                            <div className="input-group">
                                                <label className="label">X Component</label>
                                                <input
                                                    type="range"
                                                    min="-5"
                                                    max="5"
                                                    step="0.1"
                                                    value={vectorB.x}
                                                    onChange={(e) => handleVectorChange('B', 'x', parseFloat(e.target.value))}
                                                    className="slider"
                                                />
                                                <span className="value-display">{vectorB.x.toFixed(1)}</span>
                                            </div>
                                            <div className="input-group">
                                                <label className="label">Y Component</label>
                                                <input
                                                    type="range"
                                                    min="-5"
                                                    max="5"
                                                    step="0.1"
                                                    value={vectorB.y}
                                                    onChange={(e) => handleVectorChange('B', 'y', parseFloat(e.target.value))}
                                                    className="slider"
                                                />
                                                <span className="value-display">{vectorB.y.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="preset-controls">
                                    <h4 className="preset-title">Quick Presets</h4>
                                    <div className="preset-buttons">
                                        <button onClick={() => loadPreset('identical')} className="btn btn-outline">
                                            Identical
                                        </button>
                                        <button onClick={() => loadPreset('orthogonal')} className="btn btn-outline">
                                            Orthogonal
                                        </button>
                                        <button onClick={() => loadPreset('opposite')} className="btn btn-outline">
                                            Opposite
                                        </button>
                                        <button onClick={() => loadPreset('similar')} className="btn btn-outline">
                                            Similar
                                        </button>
                                    </div>
                                    <button onClick={resetVectors} className="btn btn-secondary">
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Calculations</h3>
                            </div>
                            <div className="card-body">
                                <div className="calculation-display">
                                    <div className="calculation-item">
                                        <span className="calculation-label">Cosine Similarity:</span>
                                        <span className="calculation-value">{similarity.toFixed(4)}</span>
                                    </div>
                                    <div className="calculation-item">
                                        <span className="calculation-label">Angle:</span>
                                        <span className="calculation-value">{calculateAngle(vectorA, vectorB).toFixed(1)}°</span>
                                    </div>
                                    <div className="calculation-item">
                                        <span className="calculation-label">Dot Product:</span>
                                        <span className="calculation-value">{(vectorA.x * vectorB.x + vectorA.y * vectorB.y).toFixed(2)}</span>
                                    </div>
                                    <div className="calculation-item">
                                        <span className="calculation-label">|A|:</span>
                                        <span className="calculation-value">{Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y).toFixed(2)}</span>
                                    </div>
                                    <div className="calculation-item">
                                        <span className="calculation-label">|B|:</span>
                                        <span className="calculation-value">{Math.sqrt(vectorB.x * vectorB.x + vectorB.y * vectorB.y).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Interpretation</h3>
                            </div>
                            <div className="card-body">
                                <div className="interpretation">
                                    {similarity > 0.9 && (
                                        <div className="interpretation-item positive">
                                            <strong>Very Similar:</strong> The vectors point in nearly the same direction.
                                        </div>
                                    )}
                                    {similarity > 0.5 && similarity <= 0.9 && (
                                        <div className="interpretation-item positive">
                                            <strong>Similar:</strong> The vectors have a moderate positive relationship.
                                        </div>
                                    )}
                                    {similarity > -0.5 && similarity <= 0.5 && (
                                        <div className="interpretation-item neutral">
                                            <strong>Unrelated:</strong> The vectors are roughly orthogonal or have weak correlation.
                                        </div>
                                    )}
                                    {similarity > -0.9 && similarity <= -0.5 && (
                                        <div className="interpretation-item negative">
                                            <strong>Dissimilar:</strong> The vectors point in opposite directions.
                                        </div>
                                    )}
                                    {similarity <= -0.9 && (
                                        <div className="interpretation-item negative">
                                            <strong>Opposite:</strong> The vectors point in nearly opposite directions.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Cosine Similarity</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>Formula</h4>
                                <div className="formula">
                                    cos(θ) = (A · B) / (|A| × |B|)
                                </div>

                                <h4>Key Concepts</h4>
                                <ul>
                                    <li><strong>Range:</strong> Cosine similarity ranges from -1 to 1</li>
                                    <li><strong>1:</strong> Vectors point in the same direction (identical)</li>
                                    <li><strong>0:</strong> Vectors are orthogonal (perpendicular)</li>
                                    <li><strong>-1:</strong> Vectors point in opposite directions</li>
                                    <li><strong>Magnitude Independent:</strong> Only the angle matters, not the length</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Text Analysis:</strong> Comparing document similarity</li>
                                    <li><strong>Recommendation Systems:</strong> Finding similar users or items</li>
                                    <li><strong>Image Recognition:</strong> Comparing feature vectors</li>
                                    <li><strong>Natural Language Processing:</strong> Word embeddings and semantic similarity</li>
                                </ul>

                                <h4>Cosine Similarity in RAG (Retrieval Augmented Generation)</h4>
                                <p>
                                    One of the most important modern applications of cosine similarity is in <strong>Retrieval Augmented Generation (RAG)</strong> systems used with Large Language Models (LLMs). In RAG, documents are converted into high-dimensional vector embeddings (typically 384, 768, or 1536 dimensions) and stored in a vector database. When a user asks a question, the system converts the query into the same vector space and uses cosine similarity to find the most relevant documents.
                                </p>

                                <p>
                                    The process works like this: First, a text embedding model (like OpenAI's text-embedding-ada-002 or Sentence-BERT) converts each document into a dense vector that captures its semantic meaning. These vectors are stored in a specialized database like Pinecone, Weaviate, or Chroma. When a user submits a query, it's also converted to a vector, and cosine similarity is used to find the most similar document vectors. The top-k most similar documents are then retrieved and fed as context to the LLM, allowing it to generate accurate, up-to-date responses based on the retrieved information.
                                </p>

                                <p>
                                    Cosine similarity is particularly well-suited for RAG because it's <strong>magnitude-independent</strong> - it focuses purely on the direction and semantic content of the vectors rather than their length. This means that a short query can effectively match with longer documents if they share similar semantic meaning. Additionally, cosine similarity works well with the high-dimensional embeddings produced by modern embedding models, making it the go-to choice for semantic search in production RAG systems used by companies like Microsoft, Google, and countless AI startups.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright Notice */}
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
