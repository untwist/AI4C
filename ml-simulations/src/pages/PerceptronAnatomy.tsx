import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './PerceptronAnatomy.css';

// ============================================================================
// PERCEPTRON ANATOMY SIMULATOR
// ============================================================================
// Interactive simulation showing the structure and forward pass of a perceptron
// Designed for high school and college students learning neural network fundamentals
// ============================================================================

// 1. DATA INTERFACES
// ============================================================================
interface PerceptronWeights {
    w0: number; // bias
    w1: number; // weight for x1
    w2: number; // weight for x2
    w3: number; // weight for x3
}

interface InputData {
    x1: number;
    x2: number;
    x3: number;
}

interface ActivationFunction {
    name: string;
    description: string;
    formula: string;
    calculate: (sum: number) => number;
}

// 2. PERCEPTRON ANATOMY SIMULATOR COMPONENT
// ============================================================================
const PerceptronAnatomy: React.FC = () => {
    // 3. SETUP REFS AND STATE
    // ============================================================================
    const svgRef = useRef<SVGSVGElement>(null);

    // State for perceptron parameters
    const [weights, setWeights] = useState<PerceptronWeights>({
        w0: 0.5,  // bias
        w1: 0.3,  // weight for x1
        w2: -0.2, // weight for x2
        w3: 0.8   // weight for x3
    });

    // State for input data
    const [inputs, setInputs] = useState<InputData>({
        x1: 1.0,
        x2: 0.5,
        x3: 0.8
    });

    // State for activation function
    const [selectedActivation, setSelectedActivation] = useState<string>('step');

    // State for results
    const [calculation, setCalculation] = useState({
        weightedSum: 0,
        activationOutput: 0,
        finalOutput: 0
    });

    // 4. ACTIVATION FUNCTIONS
    // ============================================================================
    const activationFunctions: Record<string, ActivationFunction> = {
        'step': {
            name: 'Step Function',
            description: 'Binary output based on threshold',
            formula: 'f(x) = 1 if x > 0, else 0',
            calculate: (sum: number) => sum > 0 ? 1 : 0
        },
        'sigmoid': {
            name: 'Sigmoid Function',
            description: 'Smooth S-shaped curve, outputs between 0 and 1',
            formula: 'f(x) = 1 / (1 + e^(-x))',
            calculate: (sum: number) => 1 / (1 + Math.exp(-sum))
        },
        'tanh': {
            name: 'Hyperbolic Tangent',
            description: 'S-shaped curve, outputs between -1 and 1',
            formula: 'f(x) = (e^x - e^(-x)) / (e^x + e^(-x))',
            calculate: (sum: number) => Math.tanh(sum)
        },
        'relu': {
            name: 'ReLU (Rectified Linear Unit)',
            description: 'Returns input if positive, 0 otherwise',
            formula: 'f(x) = max(0, x)',
            calculate: (sum: number) => Math.max(0, sum)
        }
    };

    // 5. CALCULATION FUNCTIONS
    // ============================================================================
    const calculateWeightedSum = (): number => {
        return weights.w0 + (weights.w1 * inputs.x1) + (weights.w2 * inputs.x2) + (weights.w3 * inputs.x3);
    };


    // 6. UPDATE CALCULATIONS
    // ============================================================================
    useEffect(() => {
        const weightedSum = calculateWeightedSum();
        const activationOutput = activationFunctions[selectedActivation].calculate(weightedSum);
        const finalOutput = activationOutput;

        setCalculation({
            weightedSum,
            activationOutput,
            finalOutput
        });
    }, [weights, inputs, selectedActivation]);

    // 7. D3 VISUALIZATION
    // ============================================================================
    const drawPerceptronDiagram = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 600;
        const height = 300;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g");

        // Define node positions that fit within the 600x300 canvas
        const nodes = [
            { id: 'bias', x: 60, y: 60, label: 'b', value: weights.w0, color: '#f59e0b' },
            { id: 'x1', x: 60, y: 120, label: 'x₁', value: inputs.x1, color: '#3b82f6' },
            { id: 'x2', x: 60, y: 180, label: 'x₂', value: inputs.x2, color: '#3b82f6' },
            { id: 'x3', x: 60, y: 240, label: 'x₃', value: inputs.x3, color: '#3b82f6' },
            { id: 'sum', x: 300, y: 150, label: 'Σ', value: calculation.weightedSum.toFixed(2), color: '#ef4444' },
            { id: 'activation', x: 450, y: 150, label: 'f(x)', value: calculation.activationOutput.toFixed(2), color: '#22c55e' },
            { id: 'output', x: 550, y: 150, label: 'ŷ', value: calculation.finalOutput.toFixed(2), color: '#8b5cf6' }
        ];

        // Draw connections
        const connections = [
            { from: 'bias', to: 'sum', weight: weights.w0, showWeight: true },
            { from: 'x1', to: 'sum', weight: weights.w1, showWeight: true },
            { from: 'x2', to: 'sum', weight: weights.w2, showWeight: true },
            { from: 'x3', to: 'sum', weight: weights.w3, showWeight: true },
            { from: 'sum', to: 'activation', weight: 1, showWeight: false },
            { from: 'activation', to: 'output', weight: 1, showWeight: false }
        ];

        // Draw connections
        connections.forEach(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);

            if (fromNode && toNode) {
                g.append('line')
                    .attr('x1', fromNode.x + 30)
                    .attr('y1', fromNode.y + 15)
                    .attr('x2', toNode.x - 30)
                    .attr('y2', toNode.y + 15)
                    .style('stroke', '#64748b')
                    .style('stroke-width', 3);

                if (conn.showWeight) {
                    const midX = (fromNode.x + toNode.x) / 2;
                    const midY = (fromNode.y + toNode.y) / 2;

                    g.append('text')
                        .attr('x', midX)
                        .attr('y', midY - 8)
                        .text(`w${conn.from === 'bias' ? '₀' : conn.from.slice(1)}`)
                        .style('font-size', '14px')
                        .style('font-weight', 'bold')
                        .style('fill', '#374151')
                        .style('text-anchor', 'middle')
                        .style('background-color', 'white')
                        .style('padding', '2px 4px')
                        .style('border-radius', '3px');
                }
            }
        });

        // Draw nodes
        nodes.forEach(node => {
            const nodeGroup = g.append('g')
                .attr('transform', `translate(${node.x},${node.y})`);

            // Node circle
            nodeGroup.append('circle')
                .attr('r', 30)
                .style('fill', node.color)
                .style('stroke', '#374151')
                .style('stroke-width', 3);

            // Node label
            nodeGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .text(node.label)
                .style('font-size', '16px')
                .style('font-weight', 'bold')
                .style('fill', 'white');

            // Node value
            if (node.id !== 'sum' && node.id !== 'activation' && node.id !== 'output') {
                nodeGroup.append('text')
                    .attr('x', 0)
                    .attr('y', 45)
                    .text(typeof node.value === 'number' ? node.value.toFixed(2) : node.value)
                    .style('font-size', '12px')
                    .style('text-anchor', 'middle')
                    .style('fill', '#64748b')
                    .style('font-weight', 'bold');
            }
        });

        // Add labels
        g.append('text')
            .attr('x', 60)
            .attr('y', 30)
            .text('Inputs')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#374151');

        g.append('text')
            .attr('x', 300)
            .attr('y', 100)
            .text('Summation')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#374151');

        g.append('text')
            .attr('x', 450)
            .attr('y', 100)
            .text('Activation')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#374151');

        g.append('text')
            .attr('x', 550)
            .attr('y', 100)
            .text('Output')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#374151');
    };

    // 8. EFFECTS FOR VISUALIZATION UPDATES
    // ============================================================================
    useEffect(() => {
        drawPerceptronDiagram();
    }, [weights, inputs, calculation, selectedActivation]);

    // 9. EVENT HANDLERS
    // ============================================================================
    const handleWeightChange = (key: keyof PerceptronWeights, value: number) => {
        setWeights(prev => ({ ...prev, [key]: value }));
    };

    const handleInputChange = (key: keyof InputData, value: number) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    const resetToDefaults = () => {
        setWeights({ w0: 0.5, w1: 0.3, w2: -0.2, w3: 0.8 });
        setInputs({ x1: 1.0, x2: 0.5, x3: 0.8 });
        setSelectedActivation('step');
    };

    // 10. RENDER THE SIMULATION
    // ============================================================================
    return (
        <div className="perceptron-anatomy fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">Perceptron Anatomy Explorer</h1>
                    <p className="page-description">
                        Explore the internal structure of a perceptron and understand how it processes information.
                        Adjust weights, inputs, and activation functions to see how they affect the final output.
                    </p>
                </div>

                {/* SINGLE-SCREEN LAYOUT */}
                <div className="single-screen-layout">
                    {/* LEFT: DIAGRAM + RESULTS PANEL */}
                    <div className="diagram-panel">
                        <div className="diagram-header">
                            <h2 className="diagram-title">Perceptron Structure</h2>
                        </div>
                        <div className="diagram-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>

                        {/* REAL-TIME RESULTS UNDER DIAGRAM */}
                        <div className="diagram-results">
                            <h3 className="results-title">Real-Time Results</h3>
                            <div className="results-grid">
                                <div className="result-item">
                                    <span className="result-label">Weighted Sum:</span>
                                    <span className="result-value">{calculation.weightedSum.toFixed(3)}</span>
                                </div>
                                <div className="result-item">
                                    <span className="result-label">Activation:</span>
                                    <span className="result-value">{calculation.activationOutput.toFixed(3)}</span>
                                </div>
                                <div className="result-item">
                                    <span className="result-label">Final Output:</span>
                                    <span className="result-value">{calculation.finalOutput.toFixed(3)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: COMPACT CONTROLS */}
                    <div className="compact-controls-panel">
                        {/* INPUTS & WEIGHTS IN 2-COLUMN GRID */}
                        <div className="controls-grid">
                            {/* INPUT VALUES */}
                            <div className="control-card">
                                <h3 className="control-title">Input Values</h3>
                                <div className="compact-controls">
                                    <div className="control-row">
                                        <label className="control-label">x₁</label>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={inputs.x1}
                                            onChange={(e) => handleInputChange('x1', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value">{inputs.x1.toFixed(1)}</span>
                                    </div>
                                    <div className="control-row">
                                        <label className="control-label">x₂</label>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={inputs.x2}
                                            onChange={(e) => handleInputChange('x2', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value">{inputs.x2.toFixed(1)}</span>
                                    </div>
                                    <div className="control-row">
                                        <label className="control-label">x₃</label>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={inputs.x3}
                                            onChange={(e) => handleInputChange('x3', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value">{inputs.x3.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* WEIGHT PARAMETERS */}
                            <div className="control-card">
                                <h3 className="control-title">Weight Parameters</h3>
                                <div className="compact-controls">
                                    <div className="control-row">
                                        <label className="control-label">w₀</label>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={weights.w0}
                                            onChange={(e) => handleWeightChange('w0', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value">{weights.w0.toFixed(1)}</span>
                                    </div>
                                    <div className="control-row">
                                        <label className="control-label">w₁</label>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={weights.w1}
                                            onChange={(e) => handleWeightChange('w1', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value">{weights.w1.toFixed(1)}</span>
                                    </div>
                                    <div className="control-row">
                                        <label className="control-label">w₂</label>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={weights.w2}
                                            onChange={(e) => handleWeightChange('w2', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value">{weights.w2.toFixed(1)}</span>
                                    </div>
                                    <div className="control-row">
                                        <label className="control-label">w₃</label>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.1"
                                            value={weights.w3}
                                            onChange={(e) => handleWeightChange('w3', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value">{weights.w3.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ACTIVATION FUNCTION */}
                        <div className="control-card">
                            <h3 className="control-title">Activation Function</h3>
                            <div className="activation-control">
                                <select
                                    value={selectedActivation}
                                    onChange={(e) => setSelectedActivation(e.target.value)}
                                    className="activation-select"
                                >
                                    <option value="step">Step Function</option>
                                    <option value="sigmoid">Sigmoid</option>
                                    <option value="tanh">Hyperbolic Tangent</option>
                                    <option value="relu">ReLU</option>
                                </select>
                                <div className="activation-info">
                                    <strong>{activationFunctions[selectedActivation].name}</strong>
                                    <p>{activationFunctions[selectedActivation].description}</p>
                                </div>
                            </div>
                        </div>


                        {/* RESET BUTTON */}
                        <div className="control-card">
                            <button
                                onClick={resetToDefaults}
                                className="btn btn-secondary reset-btn"
                            >
                                Reset to Defaults
                            </button>
                        </div>
                    </div>
                </div>

                {/* STANDARDIZED EXPLANATION SECTION */}
                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Perceptron Anatomy</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is a Perceptron?</h4>
                                <p>
                                    A perceptron is the simplest form of a neural network - it's like a single neuron that makes decisions by weighing up evidence.
                                    Think of it as a minimalist artist who takes inspiration from multiple sources and decides whether to make a mark on the canvas.
                                </p>

                                <div style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '8px', margin: '16px 0', border: '1px solid #0ea5e9' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#0c4a6e' }}>The Artistic Metaphor</h5>
                                    <p style={{ margin: '0', color: '#0c4a6e', fontStyle: 'italic' }}>
                                        "Imagine a perceptron as a minimalist artist who takes inspiration from multiple sources (inputs),
                                        weighs their importance (weights), and decides whether to make a mark on the canvas (output 1)
                                        or leave it blank (output 0) based on whether the total inspiration crosses a threshold."
                                    </p>
                                </div>

                                <h4>How Does It Work?</h4>
                                <p>
                                    The perceptron takes several inputs, multiplies them by weights, adds a bias, and uses an activation function to make a binary decision:
                                </p>

                                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', margin: '16px 0', border: '1px solid #e2e8f0' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>The Decision Process:</h5>
                                    <ol style={{ margin: '0', paddingLeft: '20px' }}>
                                        <li><strong>Weigh the Evidence:</strong> Each input is multiplied by its weight (importance)</li>
                                        <li><strong>Sum It Up:</strong> Add all weighted inputs plus the bias</li>
                                        <li><strong>Make the Decision:</strong> If the sum exceeds the threshold, output 1; otherwise, output 0</li>
                                    </ol>
                                </div>

                                <h4>Understanding the Bias</h4>
                                <p>
                                    The bias is like a "threshold of conviction" - it determines how easy it is to get the perceptron to output a 1:
                                </p>
                                <ul>
                                    <li><strong>High Bias:</strong> Easy to get output 1 (low threshold)</li>
                                    <li><strong>Low Bias:</strong> Hard to get output 1 (high threshold)</li>
                                    <li><strong>Negative Bias:</strong> Very difficult to get output 1</li>
                                </ul>

                                <h4>Key Components Explained</h4>
                                <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', margin: '16px 0', border: '1px solid #22c55e' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#166534' }}>The Building Blocks:</h5>
                                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                        <li><strong>Inputs (x₁, x₂, x₃):</strong> The evidence or inspiration sources</li>
                                        <li><strong>Weights (w₁, w₂, w₃):</strong> How much each input matters to the decision</li>
                                        <li><strong>Bias (w₀):</strong> The threshold of conviction - how easy it is to say "yes"</li>
                                        <li><strong>Summation:</strong> Weighing up all the evidence</li>
                                        <li><strong>Activation Function:</strong> The final decision rule</li>
                                        <li><strong>Output:</strong> The binary decision (1 = yes, 0 = no)</li>
                                    </ul>
                                </div>

                                <h4>Mathematical Foundation</h4>
                                <p>
                                    The perceptron follows this exact formula:
                                </p>
                                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', margin: '16px 0', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontFamily: 'monospace', fontSize: '18px', textAlign: 'center', margin: '12px 0' }}>
                                        <strong>Weighted Sum = w₀ + w₁×x₁ + w₂×x₂ + w₃×x₃</strong><br />
                                        <strong>Output = Activation(Weighted Sum)</strong>
                                    </div>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                                        If Weighted Sum &gt; 0: Output = 1 (Make the mark)<br />
                                        If Weighted Sum ≤ 0: Output = 0 (Leave blank)
                                    </p>
                                </div>

                                <h4>Try These Experiments</h4>
                                <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', margin: '16px 0', border: '1px solid #f59e0b' }}>
                                    <h5 style={{ margin: '0 0 12px 0', color: '#92400e' }}>Interactive Learning:</h5>
                                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                        <li><strong>Adjust Weights:</strong> See how changing importance affects the decision</li>
                                        <li><strong>Change Inputs:</strong> Try different evidence values and observe results</li>
                                        <li><strong>Modify Bias:</strong> Change the threshold of conviction</li>
                                        <li><strong>Switch Activation Functions:</strong> Compare different decision rules</li>
                                        <li><strong>Watch the Math:</strong> See the weighted sum calculation in real-time</li>
                                    </ul>
                                </div>

                                <h4>Why This Matters</h4>
                                <p>
                                    Understanding perceptron anatomy is crucial for learning neural networks because:
                                </p>
                                <ul>
                                    <li><strong>Foundation Knowledge:</strong> All neural networks are built from perceptrons</li>
                                    <li><strong>Decision Making:</strong> You understand how AI systems make binary decisions</li>
                                    <li><strong>Mathematical Intuition:</strong> You see exactly how calculations work</li>
                                    <li><strong>Parameter Understanding:</strong> You understand what weights and biases do</li>
                                    <li><strong>Activation Functions:</strong> You see how different functions affect output</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <p>
                                    Perceptrons are used in:
                                </p>
                                <ul>
                                    <li><strong>Email Spam Detection:</strong> Weighing features like sender, subject, content</li>
                                    <li><strong>Medical Diagnosis:</strong> Combining symptoms to make binary decisions</li>
                                    <li><strong>Financial Fraud Detection:</strong> Analyzing transaction patterns</li>
                                    <li><strong>Image Classification:</strong> Determining if an image contains a specific object</li>
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

export default PerceptronAnatomy;
