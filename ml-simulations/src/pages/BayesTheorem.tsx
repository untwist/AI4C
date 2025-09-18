import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './BayesTheorem.css';

// ============================================================================
// BAYES THEOREM SIMULATION COMPONENT
// ============================================================================
// Interactive visualization of Bayes' theorem with sliders for:
// - Prior probability P(H)
// - Likelihood P(E|H) 
// - Likelihood P(E|¬H)
// - Calculates posterior probability P(H|E)
// ============================================================================

interface BayesParameters {
    prior: number;           // P(H) - Prior probability of hypothesis
    likelihoodTrue: number;  // P(E|H) - Likelihood of evidence given hypothesis is true
    likelihoodFalse: number; // P(E|¬H) - Likelihood of evidence given hypothesis is false
}

interface BayesResults {
    posterior: number;       // P(H|E) - Posterior probability
    evidence: number;        // P(E) - Total probability of evidence
    likelihoodRatio: number; // P(E|H) / P(E|¬H)
}

const BayesTheorem: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    // State for Bayes parameters
    const [parameters, setParameters] = useState<BayesParameters>({
        prior: 0.1,        // 10% prior probability
        likelihoodTrue: 0.9,  // 90% likelihood if true
        likelihoodFalse: 0.1   // 10% likelihood if false
    });

    // State for visualization controls
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [showFormula, setShowFormula] = useState(true);

    // State for calculated results
    const [results, setResults] = useState<BayesResults>({
        posterior: 0,
        evidence: 0,
        likelihoodRatio: 0
    });

    // Calculate Bayes' theorem
    const calculateBayesTheorem = (params: BayesParameters): BayesResults => {
        const { prior, likelihoodTrue, likelihoodFalse } = params;

        // Calculate P(E) = P(E|H) * P(H) + P(E|¬H) * P(¬H)
        const evidence = likelihoodTrue * prior + likelihoodFalse * (1 - prior);

        // Calculate P(H|E) = P(E|H) * P(H) / P(E)
        const posterior = evidence > 0 ? (likelihoodTrue * prior) / evidence : 0;

        // Calculate likelihood ratio
        const likelihoodRatio = likelihoodFalse > 0 ? likelihoodTrue / likelihoodFalse : Infinity;

        return {
            posterior,
            evidence,
            likelihoodRatio
        };
    };

    // Update results when parameters change
    useEffect(() => {
        const newResults = calculateBayesTheorem(parameters);
        setResults(newResults);
    }, [parameters]);

    // Draw the area-based visualization (like the original Bayes simulator)
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 500;
        const height = 600;
        const margin = { top: 30, right: 30, bottom: 80, left: 30 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create a square visualization area
        const squareSize = Math.min(innerWidth, innerHeight);
        const squareX = (innerWidth - squareSize) / 2;
        const squareY = (innerHeight - squareSize) / 2;

        // Draw the main square (total probability space)
        g.append("rect")
            .attr("x", squareX)
            .attr("y", squareY)
            .attr("width", squareSize)
            .attr("height", squareSize)
            .attr("fill", "#f8fafc")
            .attr("stroke", "#374151")
            .attr("stroke-width", 2);

        // Calculate areas for the visualization
        const { prior, likelihoodTrue, likelihoodFalse } = parameters;

        // Left side: Hypothesis is True (H)
        const leftWidth = squareSize * prior;
        const leftX = squareX;

        // Right side: Hypothesis is False (¬H)  
        const rightWidth = squareSize * (1 - prior);
        const rightX = squareX + leftWidth;

        // Within left side: Evidence given H is true
        const leftEvidenceHeight = squareSize * likelihoodTrue;
        const leftEvidenceY = squareY + (squareSize - leftEvidenceHeight);

        // Within right side: Evidence given H is false
        const rightEvidenceHeight = squareSize * likelihoodFalse;
        const rightEvidenceY = squareY + (squareSize - rightEvidenceHeight);

        // Draw the left side (H is true)
        g.append("rect")
            .attr("x", leftX)
            .attr("y", squareY)
            .attr("width", leftWidth)
            .attr("height", squareSize)
            .attr("fill", "#dbeafe")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 1);

        // Draw the right side (H is false)
        g.append("rect")
            .attr("x", rightX)
            .attr("y", squareY)
            .attr("width", rightWidth)
            .attr("height", squareSize)
            .attr("fill", "#fef3c7")
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 1);

        // Draw evidence areas
        // Left evidence (E|H)
        g.append("rect")
            .attr("x", leftX)
            .attr("y", leftEvidenceY)
            .attr("width", leftWidth)
            .attr("height", leftEvidenceHeight)
            .attr("fill", "#3b82f6")
            .attr("opacity", 0.7)
            .attr("stroke", "#1e40af")
            .attr("stroke-width", 2);

        // Right evidence (E|¬H)
        g.append("rect")
            .attr("x", rightX)
            .attr("y", rightEvidenceY)
            .attr("width", rightWidth)
            .attr("height", rightEvidenceHeight)
            .attr("fill", "#f59e0b")
            .attr("opacity", 0.7)
            .attr("stroke", "#d97706")
            .attr("stroke-width", 2);

        // Add labels if enabled
        if (showLabels) {
            // Left side labels
            g.append("text")
                .attr("x", leftX + leftWidth / 2)
                .attr("y", squareY + squareSize / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", "#1e40af")
                .text("H is True");

            g.append("text")
                .attr("x", leftX + leftWidth / 2)
                .attr("y", leftEvidenceY + leftEvidenceHeight / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("fill", "white")
                .text(`P(E|H) = ${likelihoodTrue.toFixed(2)}`);

            // Right side labels
            g.append("text")
                .attr("x", rightX + rightWidth / 2)
                .attr("y", squareY + squareSize / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", "#d97706")
                .text("H is False");

            g.append("text")
                .attr("x", rightX + rightWidth / 2)
                .attr("y", rightEvidenceY + rightEvidenceHeight / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .attr("fill", "white")
                .text(`P(E|¬H) = ${likelihoodFalse.toFixed(2)}`);

            // Prior probability label
            g.append("text")
                .attr("x", squareX + squareSize / 2)
                .attr("y", squareY - 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("font-weight", "bold")
                .attr("fill", "#374151")
                .text(`P(H) = ${prior.toFixed(2)}`);

            // Evidence area labels
            const totalEvidenceArea = leftEvidenceHeight * leftWidth + rightEvidenceHeight * rightWidth;
            const leftEvidenceArea = leftEvidenceHeight * leftWidth;
            const posteriorProportion = totalEvidenceArea > 0 ? leftEvidenceArea / totalEvidenceArea : 0;

            g.append("text")
                .attr("x", squareX + squareSize / 2)
                .attr("y", squareY + squareSize + 25)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", "#059669")
                .text(`P(H|E) = ${results.posterior.toFixed(3)}`);

            g.append("text")
                .attr("x", squareX + squareSize / 2)
                .attr("y", squareY + squareSize + 45)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "#6b7280")
                .text(`Evidence area: ${(leftEvidenceArea / (squareSize * squareSize)).toFixed(3)} of total`);

            g.append("text")
                .attr("x", squareX + squareSize / 2)
                .attr("y", squareY + squareSize + 65)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "#6b7280")
                .text(`From H: ${(posteriorProportion * 100).toFixed(1)}% of evidence area`);
        }

        // Add grid if enabled
        if (showGrid) {
            // Vertical divider line
            g.append("line")
                .attr("x1", rightX)
                .attr("y1", squareY)
                .attr("x2", rightX)
                .attr("y2", squareY + squareSize)
                .attr("stroke", "#374151")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5");

            // Horizontal evidence divider lines
            if (leftEvidenceHeight > 0) {
                g.append("line")
                    .attr("x1", leftX)
                    .attr("y1", leftEvidenceY)
                    .attr("x2", leftX + leftWidth)
                    .attr("y2", leftEvidenceY)
                    .attr("stroke", "#1e40af")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "3,3");
            }

            if (rightEvidenceHeight > 0) {
                g.append("line")
                    .attr("x1", rightX)
                    .attr("y1", rightEvidenceY)
                    .attr("x2", rightX + rightWidth)
                    .attr("y2", rightEvidenceY)
                    .attr("stroke", "#d97706")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "3,3");
            }
        }
    };

    // Effects for visualization updates
    useEffect(() => {
        drawVisualization();
    }, [parameters, results, showGrid, showLabels]);

    // Event handlers
    const handleParameterChange = (key: keyof BayesParameters, value: number) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    const resetSimulation = () => {
        setParameters({
            prior: 0.1,
            likelihoodTrue: 0.9,
            likelihoodFalse: 0.1
        });
    };

    const loadPreset = (preset: string) => {
        switch (preset) {
            case 'medical-test':
                setParameters({
                    prior: 0.01,      // 1% disease prevalence
                    likelihoodTrue: 0.95,  // 95% test sensitivity
                    likelihoodFalse: 0.05  // 5% false positive rate
                });
                break;
            case 'spam-filter':
                setParameters({
                    prior: 0.3,       // 30% spam rate
                    likelihoodTrue: 0.8,   // 80% spam detection
                    likelihoodFalse: 0.1   // 10% false positive
                });
                break;
            case 'coin-bias':
                setParameters({
                    prior: 0.5,       // 50% prior belief
                    likelihoodTrue: 0.6,   // 60% heads if biased
                    likelihoodFalse: 0.5   // 50% heads if fair
                });
                break;
        }
    };

    return (
        <div className="bayes-theorem fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">Bayes' Theorem Simulator</h1>
                    <p className="page-description">
                        Learn how to update your beliefs when you get new information! Bayes' theorem is one of the most
                        important concepts in statistics and data science. This interactive tool will help you understand
                        how to combine what you already know with new evidence to make better decisions.
                    </p>
                </div>

                {/* STANDARDIZED SIMULATION LAYOUT */}
                <div className="simulation-layout">
                    {/* VISUALIZATION PANEL */}
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Bayes' Theorem Visualization</h2>
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
                                        checked={showFormula}
                                        onChange={(e) => setShowFormula(e.target.checked)}
                                    />
                                    Show Formula
                                </label>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                            {showFormula && (
                                <div className="formula-display">
                                    <div className="formula-title">Bayes' Theorem:</div>
                                    <div className="formula-text">
                                        P(H|E) = P(E|H) × P(H) / P(E)
                                    </div>
                                    <div className="formula-breakdown">
                                        <div>P(H|E) = {parameters.likelihoodTrue.toFixed(2)} × {parameters.prior.toFixed(2)} / {results.evidence.toFixed(2)}</div>
                                        <div>= {results.posterior.toFixed(4)}</div>
                                    </div>
                                </div>
                            )}

                            {/* Bayes Theorem Formula Image */}
                            <div className="formula-image-container">
                                <img
                                    src="https://raw.githubusercontent.com/untwist/bayes/main/Bayes%20Theorem%20Formula%20v2.jpg"
                                    alt="Bayes Theorem Formula Visualization"
                                    className="formula-image"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CONTROLS PANEL */}
                    <div className="controls-panel">
                        {/* PARAMETER CONTROLS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Bayes Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">
                                            <strong>Prior P(H)</strong> - Your initial belief
                                            <div className="parameter-description">
                                                How likely did you think the hypothesis was true before seeing any evidence?
                                            </div>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={parameters.prior}
                                            onChange={(e) => handleParameterChange('prior', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{(parameters.prior * 100).toFixed(0)}%</span>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">
                                            <strong>Likelihood P(E|H)</strong> - Evidence if true
                                            <div className="parameter-description">
                                                How likely is the evidence if the hypothesis is actually true?
                                            </div>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={parameters.likelihoodTrue}
                                            onChange={(e) => handleParameterChange('likelihoodTrue', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{(parameters.likelihoodTrue * 100).toFixed(0)}%</span>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">
                                            <strong>Likelihood P(E|¬H)</strong> - Evidence if false
                                            <div className="parameter-description">
                                                How likely is the evidence if the hypothesis is actually false?
                                            </div>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={parameters.likelihoodFalse}
                                            onChange={(e) => handleParameterChange('likelihoodFalse', parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{(parameters.likelihoodFalse * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRESET SCENARIOS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Example Scenarios</h3>
                            </div>
                            <div className="card-body">
                                <div className="preset-controls">
                                    <button
                                        onClick={() => loadPreset('medical-test')}
                                        className="btn btn-outline"
                                    >
                                        Medical Test
                                    </button>
                                    <button
                                        onClick={() => loadPreset('spam-filter')}
                                        className="btn btn-outline"
                                    >
                                        Spam Filter
                                    </button>
                                    <button
                                        onClick={() => loadPreset('coin-bias')}
                                        className="btn btn-outline"
                                    >
                                        Coin Bias
                                    </button>
                                    <button
                                        onClick={resetSimulation}
                                        className="btn btn-secondary"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RESULTS CARD */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Your Updated Beliefs</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    <div className="result-item">
                                        <span className="result-label">
                                            <strong>Posterior P(H|E):</strong><br />
                                            <small>Your updated belief</small>
                                        </span>
                                        <span className="result-value">{(results.posterior * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">
                                            <strong>Evidence P(E):</strong><br />
                                            <small>Total probability of evidence</small>
                                        </span>
                                        <span className="result-value">{(results.evidence * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">
                                            <strong>Likelihood Ratio:</strong><br />
                                            <small>How much more likely evidence is if H is true</small>
                                        </span>
                                        <span className="result-value">{results.likelihoodRatio.toFixed(2)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">
                                            <strong>Update Factor:</strong><br />
                                            <small>How much your belief changed</small>
                                        </span>
                                        <span className="result-value">{(results.posterior / parameters.prior).toFixed(2)}x</span>
                                    </div>
                                </div>

                                <div className="interpretation-box">
                                    <h4>What This Means:</h4>
                                    <p>
                                        {results.posterior > parameters.prior ? (
                                            <>The evidence supports your hypothesis! Your belief increased from {(parameters.prior * 100).toFixed(0)}% to {(results.posterior * 100).toFixed(1)}%.</>
                                        ) : results.posterior < parameters.prior ? (
                                            <>The evidence weakens your hypothesis. Your belief decreased from {(parameters.prior * 100).toFixed(0)}% to {(results.posterior * 100).toFixed(1)}%.</>
                                        ) : (
                                            <>The evidence is neutral. Your belief stayed the same at {(results.posterior * 100).toFixed(1)}%.</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* IMPROVED PEDAGOGICAL TUTORIAL SECTION */}
                <div className="tutorial-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Learn Bayes' Theorem: A Complete Guide</h3>
                        </div>
                        <div className="card-body">
                            <div className="tutorial-content">
                                {/* FOUNDATION: Probability Basics */}
                                <div className="tutorial-step foundation-step">
                                    <h4>Foundation: Understanding Probabilities</h4>
                                    <p>
                                        Before diving into Bayes' theorem, let's make sure you understand what probabilities mean:
                                    </p>
                                    <div className="probability-basics">
                                        <div className="probability-example">
                                            <strong>Example:</strong> "There's a 30% chance of rain today"
                                            <ul>
                                                <li>This means: Out of 100 similar days, it rains on about 30 of them</li>
                                                <li>It does NOT mean: It will rain for 30% of the day</li>
                                            </ul>
                                        </div>
                                        <div className="probability-example">
                                            <strong>Key Insight:</strong> Probabilities are about <em>frequency</em>, not certainty
                                        </div>
                                    </div>
                                </div>

                                {/* CONDITIONAL PROBABILITY */}
                                <div className="tutorial-step">
                                    <h4>Step 1: Conditional Probability (The Key Concept)</h4>
                                    <p>
                                        <strong>Conditional probability</strong> asks: "Given that X happened, what's the chance of Y?"
                                    </p>
                                    <div className="conditional-examples">
                                        <div className="example-box">
                                            <strong>P(Rain | Dark Clouds)</strong> = "What's the chance of rain given that I see dark clouds?"
                                        </div>
                                        <div className="example-box">
                                            <strong>P(Disease | Positive Test)</strong> = "What's the chance I have the disease given a positive test?"
                                        </div>
                                    </div>
                                    <p>
                                        <strong>Common Mistake:</strong> P(A|B) ≠ P(B|A). These are completely different!
                                    </p>
                                </div>

                                {/* BAYES THEOREM INTUITION */}
                                <div className="tutorial-step">
                                    <h4>Step 2: The Intuition Behind Bayes' Theorem</h4>
                                    <p>
                                        Bayes' theorem answers: <em>"Given this evidence, how should I update my belief?"</em>
                                    </p>
                                    <div className="intuition-example">
                                        <div className="scenario">
                                            <strong>Scenario:</strong> You're a doctor. A patient tests positive for a rare disease.
                                        </div>
                                        <div className="thinking-process">
                                            <div className="step">1. <strong>Start with base rate:</strong> "How common is this disease?" (1% of population)</div>
                                            <div className="step">2. <strong>Consider the test:</strong> "How accurate is this test?" (95% accurate)</div>
                                            <div className="step">3. <strong>Update your belief:</strong> "Given the positive test, what's the real probability?"</div>
                                        </div>
                                    </div>
                                </div>

                                {/* VISUALIZATION EXPLANATION */}
                                <div className="tutorial-step">
                                    <h4>Step 3: Reading the Visualization</h4>
                                    <p>
                                        The square above shows <strong>all possible outcomes</strong>. Here's how to read it:
                                    </p>
                                    <div className="visualization-guide">
                                        <div className="visual-element">
                                            <div className="color-box blue"></div>
                                            <span><strong>Left side (blue):</strong> When your hypothesis is TRUE</span>
                                        </div>
                                        <div className="visual-element">
                                            <div className="color-box yellow"></div>
                                            <span><strong>Right side (yellow):</strong> When your hypothesis is FALSE</span>
                                        </div>
                                        <div className="visual-element">
                                            <div className="color-box dark-blue"></div>
                                            <span><strong>Dark blue area:</strong> Evidence when hypothesis is TRUE</span>
                                        </div>
                                        <div className="visual-element">
                                            <div className="color-box orange"></div>
                                            <span><strong>Orange area:</strong> Evidence when hypothesis is FALSE</span>
                                        </div>
                                    </div>
                                    <p>
                                        <strong>The Answer:</strong> P(H|E) = (Dark blue area) ÷ (Total evidence area)
                                    </p>
                                </div>

                                {/* INTERACTIVE PRACTICE */}
                                <div className="tutorial-step">
                                    <h4>Step 4: Practice with Real Examples</h4>
                                    <p>
                                        <strong>Try these scenarios:</strong> Click each button and watch how the areas change.
                                    </p>
                                    <div className="practice-scenarios">
                                        <div className="scenario-card">
                                            <h5>Medical Test</h5>
                                            <p>1% disease rate, 95% accurate test</p>
                                            <p><strong>Question:</strong> If someone tests positive, what's their actual disease probability?</p>
                                        </div>
                                        <div className="scenario-card">
                                            <h5>Spam Filter</h5>
                                            <p>30% spam rate, 80% detection rate</p>
                                            <p><strong>Question:</strong> If an email is flagged as spam, how confident should you be?</p>
                                        </div>
                                        <div className="scenario-card">
                                            <h5>Coin Bias</h5>
                                            <p>50% prior belief, testing for bias</p>
                                            <p><strong>Question:</strong> After seeing heads, how likely is the coin biased?</p>
                                        </div>
                                    </div>
                                </div>

                                {/* REFLECTION PROMPT */}
                                <div className="tutorial-step reflection-step">
                                    <h4>Step 5: Check Your Understanding</h4>
                                    <div className="reflection-questions">
                                        <p><strong>Before moving on, ask yourself:</strong></p>
                                        <ul>
                                            <li>Can you explain what P(H|E) means in your own words?</li>
                                            <li>Why does the base rate (prior probability) matter so much?</li>
                                            <li>What happens to your belief when evidence is more likely under one hypothesis than another?</li>
                                        </ul>
                                        <div className="confidence-check">
                                            <p><strong>Confidence Check:</strong> If you can answer these questions, you're ready for the deep dive!</p>
                                        </div>
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
                            <h3 className="card-title">Deep Dive: The Science Behind Bayes' Theorem</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is Bayes' Theorem?</h4>
                                <p>
                                    Bayes' theorem is a fundamental principle in probability theory that describes how to update
                                    our beliefs about a hypothesis when we receive new evidence. It provides a mathematical
                                    framework for combining prior knowledge with new information to arrive at updated beliefs.
                                </p>

                                <h4>Key Components</h4>
                                <ul>
                                    <li><strong>Prior P(H):</strong> Your initial belief about the probability of the hypothesis being true</li>
                                    <li><strong>Likelihood P(E|H):</strong> The probability of observing the evidence if the hypothesis is true</li>
                                    <li><strong>Likelihood P(E|¬H):</strong> The probability of observing the evidence if the hypothesis is false</li>
                                    <li><strong>Posterior P(H|E):</strong> Your updated belief after seeing the evidence</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Medical Diagnosis:</strong> Updating disease probability based on test results</li>
                                    <li><strong>Spam Filtering:</strong> Determining if an email is spam based on content features</li>
                                    <li><strong>Machine Learning:</strong> Bayesian inference in model training and prediction</li>
                                    <li><strong>Quality Control:</strong> Updating defect probability based on inspection results</li>
                                    <li><strong>Financial Risk:</strong> Updating risk assessments with new market information</li>
                                </ul>

                                <h4>Intuitive Understanding</h4>
                                <p>
                                    Think of Bayes' theorem as a way to "update your beliefs" when you get new information.
                                    If you start with a certain belief (prior), and then you see some evidence, Bayes' theorem
                                    tells you how much to adjust your belief based on how likely that evidence is under
                                    different scenarios.
                                </p>

                                <h4>Why It Matters in AI and Machine Learning</h4>
                                <p>
                                    Bayes' theorem is crucial in modern AI systems, particularly in:
                                </p>
                                <ul>
                                    <li><strong>Naive Bayes Classifiers:</strong> One of the most effective text classification algorithms</li>
                                    <li><strong>Bayesian Neural Networks:</strong> Networks that provide uncertainty estimates</li>
                                    <li><strong>Reinforcement Learning:</strong> Updating action-value estimates based on rewards</li>
                                    <li><strong>Recommendation Systems:</strong> Updating user preference models with new interactions</li>
                                </ul>

                                <h4>Common Misconceptions and Pitfalls</h4>
                                <p>
                                    Many people struggle with Bayesian thinking. Here are the most common mistakes:
                                </p>
                                <ul>
                                    <li><strong>Base Rate Neglect:</strong> Ignoring the prior probability and focusing only on the evidence</li>
                                    <li><strong>Confirmation Bias:</strong> Only looking for evidence that supports your existing beliefs</li>
                                    <li><strong>Overconfidence:</strong> Thinking that one piece of evidence is definitive</li>
                                    <li><strong>False Precision:</strong> Treating probability estimates as more certain than they actually are</li>
                                </ul>

                                <h4>Understanding the Math: Step-by-Step</h4>
                                <p>
                                    Let's break down the formula with a concrete example:
                                </p>
                                <div className="math-example">
                                    <p><strong>Example:</strong> Medical test for a rare disease (1% prevalence)</p>
                                    <ul>
                                        <li>P(H) = 0.01 (1% have the disease)</li>
                                        <li>P(E|H) = 0.95 (95% test positive if you have the disease)</li>
                                        <li>P(E|¬H) = 0.05 (5% false positive rate)</li>
                                    </ul>
                                    <p><strong>Step 1:</strong> Calculate P(E) = P(E|H) × P(H) + P(E|¬H) × P(¬H)</p>
                                    <p>P(E) = 0.95 × 0.01 + 0.05 × 0.99 = 0.0095 + 0.0495 = 0.059</p>
                                    <p><strong>Step 2:</strong> Calculate P(H|E) = P(E|H) × P(H) / P(E)</p>
                                    <p>P(H|E) = (0.95 × 0.01) / 0.059 = 0.0095 / 0.059 = 0.161 (16.1%)</p>
                                    <p><strong>Result:</strong> Even with a positive test, you only have a 16.1% chance of having the disease!</p>
                                </div>

                                <h4>When to Use Bayesian Thinking</h4>
                                <p>
                                    Bayesian reasoning is most valuable when:
                                </p>
                                <ul>
                                    <li><strong>Making decisions under uncertainty:</strong> You have some information but not complete knowledge</li>
                                    <li><strong>Updating beliefs with new data:</strong> You want to incorporate new evidence into existing knowledge</li>
                                    <li><strong>Dealing with rare events:</strong> Understanding that rare events stay rare even with positive evidence</li>
                                    <li><strong>Quantifying uncertainty:</strong> You need to express how confident you are in your conclusions</li>
                                </ul>

                                <h4>Advanced Applications in Data Science</h4>
                                <p>
                                    Beyond basic applications, Bayes' theorem powers sophisticated data science techniques:
                                </p>
                                <ul>
                                    <li><strong>Bayesian Optimization:</strong> Efficiently finding the best parameters for machine learning models</li>
                                    <li><strong>Bayesian A/B Testing:</strong> More sophisticated than traditional frequentist approaches</li>
                                    <li><strong>Bayesian Networks:</strong> Modeling complex relationships between variables</li>
                                    <li><strong>Markov Chain Monte Carlo (MCMC):</strong> Sampling from complex probability distributions</li>
                                    <li><strong>Bayesian Deep Learning:</strong> Neural networks that provide uncertainty estimates</li>
                                </ul>

                                <h4>Career Applications</h4>
                                <p>
                                    Understanding Bayes' theorem opens doors in many careers:
                                </p>
                                <ul>
                                    <li><strong>Data Scientist:</strong> Building recommendation systems, fraud detection, risk assessment</li>
                                    <li><strong>Machine Learning Engineer:</strong> Implementing Bayesian algorithms, uncertainty quantification</li>
                                    <li><strong>Quantitative Analyst:</strong> Financial modeling, risk management, algorithmic trading</li>
                                    <li><strong>Biostatistician:</strong> Clinical trials, medical research, epidemiology</li>
                                    <li><strong>AI Researcher:</strong> Developing next-generation AI systems with uncertainty awareness</li>
                                </ul>


                                <h4>Pro Tips for Bayesian Thinking</h4>
                                <ul>
                                    <li><strong>Start with the base rate:</strong> Always consider the prior probability before looking at evidence</li>
                                    <li><strong>Think in terms of ratios:</strong> How much more likely is the evidence under one hypothesis vs. another?</li>
                                    <li><strong>Update incrementally:</strong> You can apply Bayes' theorem multiple times as you get more evidence</li>
                                    <li><strong>Quantify your uncertainty:</strong> Express your beliefs as probability ranges, not just point estimates</li>
                                    <li><strong>Consider alternative hypotheses:</strong> Don't just compare your hypothesis to "not your hypothesis"</li>
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

export default BayesTheorem;
