import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './IntroToProbability.css';

// ============================================================================
// INTRO TO PROBABILITY SIMULATION COMPONENT
// ============================================================================
// Interactive introduction to probability theory covering:
// - Basic probability concepts (0 to 1 scale)
// - Sample spaces and events
// - Probability rules (addition, multiplication)
// - Conditional probability
// - Real-world examples and applications
// ============================================================================

interface ProbabilityExample {
    id: string;
    title: string;
    description: string;
    sampleSpace: string[];
    events: { [key: string]: string[] };
    probabilities: { [key: string]: number };
}

const IntroToProbability: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedExample, setSelectedExample] = useState<string>('coin-toss');
    const [showFormulas, setShowFormulas] = useState(true);
    const [showCalculations, setShowCalculations] = useState(true);

    // Probability examples with different scenarios
    const examples: { [key: string]: ProbabilityExample } = {
        'coin-toss': {
            id: 'coin-toss',
            title: 'Coin Toss',
            description: 'Simple two-outcome experiment',
            sampleSpace: ['Heads', 'Tails'],
            events: {
                'Heads': ['Heads'],
                'Tails': ['Tails'],
                'At least one head': ['Heads']
            },
            probabilities: {
                'Heads': 0.5,
                'Tails': 0.5,
                'At least one head': 0.5
            }
        },
        'dice-roll': {
            id: 'dice-roll',
            title: 'Dice Roll',
            description: 'Six-sided die with multiple outcomes',
            sampleSpace: ['1', '2', '3', '4', '5', '6'],
            events: {
                'Even number': ['2', '4', '6'],
                'Odd number': ['1', '3', '5'],
                'Greater than 3': ['4', '5', '6'],
                'Prime number': ['2', '3', '5']
            },
            probabilities: {
                'Even number': 3 / 6,
                'Odd number': 3 / 6,
                'Greater than 3': 3 / 6,
                'Prime number': 3 / 6
            }
        },
        'card-draw': {
            id: 'card-draw',
            title: 'Card Draw',
            description: 'Drawing from a standard deck',
            sampleSpace: ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'],
            events: {
                'Face card': ['Jack', 'Queen', 'King'],
                'Number card': ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
                'Ace': ['Ace']
            },
            probabilities: {
                'Face card': 12 / 52,
                'Number card': 36 / 52,
                'Ace': 4 / 52
            }
        }
    };

    const currentExample = examples[selectedExample];

    // Calculate probability of an event
    const calculateProbability = (eventName: string): number => {
        const event = currentExample.events[eventName];
        if (!event) return 0;
        return event.length / currentExample.sampleSpace.length;
    };




    // Render probability visualization
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create sample space visualization
        g.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", innerWidth)
            .attr("height", innerHeight)
            .attr("fill", "#f0f8ff")
            .attr("stroke", "#4a90e2")
            .attr("stroke-width", 2)
            .attr("rx", 8);

        // Add sample space label
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .attr("fill", "#2c3e50")
            .text(`Sample Space: {${currentExample.sampleSpace.join(', ')}}`);

        // Visualize events as colored regions
        const eventColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
        const eventNames = Object.keys(currentExample.events);

        eventNames.forEach((eventName, index) => {
            const event = currentExample.events[eventName];
            const probability = calculateProbability(eventName);

            // Create event visualization
            const eventGroup = g.append("g");

            // Add event label
            eventGroup.append("text")
                .attr("x", 20)
                .attr("y", 80 + index * 60)
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", eventColors[index % eventColors.length])
                .text(`${eventName}: {${event.join(', ')}}`);

            // Add probability value
            eventGroup.append("text")
                .attr("x", 20)
                .attr("y", 100 + index * 60)
                .attr("font-size", "12px")
                .attr("fill", "#666")
                .text(`P(${eventName}) = ${probability.toFixed(3)}`);

            // Add probability bar
            const barWidth = probability * (innerWidth - 40);
            eventGroup.append("rect")
                .attr("x", 20)
                .attr("y", 110 + index * 60)
                .attr("width", barWidth)
                .attr("height", 20)
                .attr("fill", eventColors[index % eventColors.length])
                .attr("opacity", 0.7);
        });

        // Add probability rules
        if (showFormulas) {
            const rulesY = 300;
            g.append("text")
                .attr("x", 20)
                .attr("y", rulesY)
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", "#2c3e50")
                .text("Probability Rules:");

            g.append("text")
                .attr("x", 20)
                .attr("y", rulesY + 20)
                .attr("font-size", "12px")
                .attr("fill", "#666")
                .text("• 0 ≤ P(A) ≤ 1");

            g.append("text")
                .attr("x", 20)
                .attr("y", rulesY + 35)
                .attr("font-size", "12px")
                .attr("fill", "#666")
                .text("• P(Sample Space) = 1");

            g.append("text")
                .attr("x", 20)
                .attr("y", rulesY + 50)
                .attr("font-size", "12px")
                .attr("fill", "#666")
                .text("• P(A ∪ B) = P(A) + P(B) - P(A ∩ B)");

            g.append("text")
                .attr("x", 20)
                .attr("y", rulesY + 65)
                .attr("font-size", "12px")
                .attr("fill", "#666")
                .text("• P(A|B) = P(A ∩ B) / P(B)");
        }

    }, [selectedExample, showFormulas, currentExample]);

    return (
        <div className="intro-probability">
            <div className="simulation-header">
                <h1>Intro to Probability</h1>
                <h1>NOTE: THIS MODULE IS IN DEVELOPMENT!!!!</h1>
                <h1>PLEASE DON'T USE THIS MODULE FOR ANYTHING IMPORTANT!!!!</h1>
                <p className="simulation-description">
                    Learn the fundamentals of probability theory through interactive examples and visualizations.
                </p>
            </div>

            <div className="simulation-controls">
                <div className="control-group">
                    <label htmlFor="example-select">Choose Example:</label>
                    <select
                        id="example-select"
                        value={selectedExample}
                        onChange={(e) => setSelectedExample(e.target.value)}
                        className="control-select"
                    >
                        <option value="coin-toss">Coin Toss</option>
                        <option value="dice-roll">Dice Roll</option>
                        <option value="card-draw">Card Draw</option>
                    </select>
                </div>

                <div className="control-group">
                    <label className="control-checkbox">
                        <input
                            type="checkbox"
                            checked={showFormulas}
                            onChange={(e) => setShowFormulas(e.target.checked)}
                        />
                        Show Probability Rules
                    </label>
                </div>

                <div className="control-group">
                    <label className="control-checkbox">
                        <input
                            type="checkbox"
                            checked={showCalculations}
                            onChange={(e) => setShowCalculations(e.target.checked)}
                        />
                        Show Calculations
                    </label>
                </div>
            </div>

            <div className="simulation-content">
                <div className="visualization-container">
                    <svg ref={svgRef} className="probability-svg"></svg>
                </div>

                <div className="educational-content">
                    <div className="content-section">
                        <h3>What is Probability?</h3>
                        <p>
                            Probability is a measure of how likely an event is to occur. It's expressed as a number
                            between 0 and 1, where:
                        </p>
                        <ul>
                            <li><strong>0</strong> means the event is impossible</li>
                            <li><strong>1</strong> means the event is certain</li>
                            <li><strong>0.5</strong> means the event is equally likely to occur or not occur</li>
                        </ul>
                    </div>

                    <div className="content-section">
                        <h3>Key Concepts</h3>
                        <div className="concept-grid">
                            <div className="concept-card">
                                <h4>Sample Space</h4>
                                <p>The set of all possible outcomes of an experiment.</p>
                                <div className="example-box">
                                    <strong>Example:</strong> For a coin toss, S = {`{Heads, Tails}`}
                                </div>
                            </div>

                            <div className="concept-card">
                                <h4>Event</h4>
                                <p>A subset of the sample space that we're interested in.</p>
                                <div className="example-box">
                                    <strong>Example:</strong> "Getting heads" = {`{Heads}`}
                                </div>
                            </div>

                            <div className="concept-card">
                                <h4>Probability of an Event</h4>
                                <p>P(A) = Number of outcomes in A / Total number of outcomes</p>
                                <div className="example-box">
                                    <strong>Example:</strong> P(Heads) = 1/2 = 0.5
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="content-section">
                        <h3>Probability Rules</h3>
                        <div className="rules-list">
                            <div className="rule-item">
                                <strong>Rule 1:</strong> 0 ≤ P(A) ≤ 1 for any event A
                            </div>
                            <div className="rule-item">
                                <strong>Rule 2:</strong> P(Sample Space) = 1
                            </div>
                            <div className="rule-item">
                                <strong>Rule 3:</strong> P(A ∪ B) = P(A) + P(B) - P(A ∩ B)
                            </div>
                            <div className="rule-item">
                                <strong>Rule 4:</strong> P(A|B) = P(A ∩ B) / P(B) (Conditional Probability)
                            </div>
                        </div>
                    </div>

                    {showCalculations && (
                        <div className="content-section">
                            <h3>Calculations for Current Example</h3>
                            <div className="calculations-grid">
                                {Object.keys(currentExample.events).map((eventName) => (
                                    <div key={eventName} className="calculation-item">
                                        <strong>P({eventName})</strong> = {currentExample.events[eventName].length} / {currentExample.sampleSpace.length} = {calculateProbability(eventName).toFixed(3)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="content-section">
                        <h3>Real-World Applications</h3>
                        <div className="applications-list">
                            <div className="application-item">
                                <strong>Weather Forecasting:</strong> Predicting rain probability based on atmospheric conditions
                            </div>
                            <div className="application-item">
                                <strong>Medical Diagnosis:</strong> Determining disease probability based on symptoms
                            </div>
                            <div className="application-item">
                                <strong>Quality Control:</strong> Assessing defect probability in manufacturing
                            </div>
                            <div className="application-item">
                                <strong>Risk Assessment:</strong> Evaluating investment or insurance risks
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntroToProbability;
