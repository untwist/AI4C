import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './CausalDetective.css';

// ============================================================================
// CAUSAL DETECTIVE - Interactive Causal Inference Tutorial
// ============================================================================
// Mystery-solving simulation that teaches students to distinguish between
// correlation and causation through engaging detective scenarios
// ============================================================================

// 1. DATA INTERFACES
// ============================================================================
interface DataPoint {
    id: string;
    x: number;
    y: number;
    label: string;
    category: 'correlation' | 'causation' | 'spurious';
    confoundingVariable?: number;
    explanation: string;
    color: string;
}

interface MysteryScenario {
    id: string;
    title: string;
    description: string;
    initialEvidence: string;
    learningObjective: string;
    dataPoints: DataPoint[];
    confoundingVariable?: {
        name: string;
        values: number[];
        explanation: string;
    };
}


interface LearningStep {
    id: string;
    title: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    completed: boolean;
}

interface LearningProgress {
    currentStep: number;
    steps: LearningStep[];
    score: number;
}

// 2. MYSTERY SCENARIOS
// ============================================================================
const mysteryScenarios: MysteryScenario[] = [
    {
        id: 'ice-cream-conspiracy',
        title: 'The Ice Cream Conspiracy',
        description: 'Ice cream sales correlate with drowning deaths - is ice cream dangerous?',
        initialEvidence: 'Strong positive correlation (r = 0.85) between ice cream sales and drowning deaths',
        learningObjective: 'Understand how confounding variables create spurious correlation',
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
        ],
        confoundingVariable: {
            name: 'Temperature (°F)',
            values: [32, 35, 45, 55, 65, 75, 85, 80, 70, 60, 45, 35],
            explanation: 'Temperature causes both ice cream sales and swimming activity'
        }
    },
    {
        id: 'laptop-learning',
        title: 'The Laptop Learning Experiment',
        description: 'Students with laptops score higher - do laptops cause better learning?',
        initialEvidence: 'Students with laptops score 15% higher on average',
        learningObjective: 'Understand the difference between observational studies and controlled experiments',
        dataPoints: [
            { id: '1', x: 0, y: 75, label: 'No Laptop', category: 'correlation', explanation: 'Student without laptop, moderate score', color: '#ef4444' },
            { id: '2', x: 1, y: 85, label: 'With Laptop', category: 'correlation', explanation: 'Student with laptop, higher score', color: '#22c55e' },
            { id: '3', x: 0, y: 70, label: 'No Laptop', category: 'correlation', explanation: 'Student without laptop, lower score', color: '#ef4444' },
            { id: '4', x: 1, y: 90, label: 'With Laptop', category: 'correlation', explanation: 'Student with laptop, high score', color: '#22c55e' }
        ]
    },
    {
        id: 'miracle-medicine',
        title: 'The Miracle Medicine Trial',
        description: 'New drug shows amazing results - but is it really effective?',
        initialEvidence: 'Drug shows 40% improvement over baseline',
        learningObjective: 'Understand placebo effects, blinding, and randomization in medical trials',
        dataPoints: [
            { id: '1', x: 0, y: 60, label: 'Placebo', category: 'correlation', explanation: 'Placebo group, moderate improvement', color: '#f59e0b' },
            { id: '2', x: 1, y: 84, label: 'Drug', category: 'correlation', explanation: 'Drug group, high improvement', color: '#10b981' }
        ]
    }
];

// 3. LEARNING STEPS FOR ICE CREAM MYSTERY
// ============================================================================
const iceCreamLearningSteps: LearningStep[] = [
    {
        id: 'observe-data',
        title: 'Step 1: Observe the Data',
        question: 'Look at the scatter plot. What do you see?',
        options: [
            'Ice cream sales and drowning deaths are unrelated',
            'Ice cream sales and drowning deaths have a strong positive relationship',
            'Ice cream sales and drowning deaths have a strong negative relationship',
            'The data is too scattered to see any pattern'
        ],
        correctAnswer: 1,
        explanation: 'Correct! There is a strong positive relationship - as ice cream sales increase, drowning deaths also increase. This is a classic example of correlation.',
        completed: false
    },
    {
        id: 'calculate-correlation',
        title: 'Step 2: Calculate the Correlation',
        question: 'The correlation coefficient is 0.986. What does this mean?',
        options: [
            'There is no relationship between the variables',
            'There is a weak positive relationship',
            'There is a strong positive relationship',
            'There is a perfect negative relationship'
        ],
        correctAnswer: 2,
        explanation: 'Correct! A correlation of 0.986 indicates a very strong positive relationship. This suggests that ice cream sales and drowning deaths are highly related.',
        completed: false
    },
    {
        id: 'form-hypothesis',
        title: 'Step 3: Form Your Hypothesis',
        question: 'Based on the strong correlation, what do you think is happening?',
        options: [
            'Ice cream causes drowning deaths',
            'Drowning deaths cause ice cream sales to increase',
            'Something else is causing both ice cream sales and drowning deaths',
            'This is just a coincidence'
        ],
        correctAnswer: 2,
        explanation: 'Excellent thinking! You\'re right to be suspicious. A strong correlation doesn\'t mean causation. There might be a third variable causing both.',
        completed: false
    },
    {
        id: 'reveal-confounding',
        title: 'Step 4: Reveal the Confounding Variable',
        question: 'Look at the graph now - you can see temperature data on the right side. Notice how temperature affects both ice cream sales and drowning deaths. What happened to the correlation when we consider temperature?',
        options: [
            'The correlation stayed the same',
            'The correlation increased',
            'The correlation decreased dramatically',
            'The correlation became negative'
        ],
        correctAnswer: 2,
        explanation: 'Exactly! When we control for temperature, the correlation drops to 0.12. This reveals that temperature was the confounding variable causing both ice cream sales and swimming activity.',
        completed: false
    },
    {
        id: 'draw-conclusion',
        title: 'Step 5: Draw Your Conclusion',
        question: 'What is the true relationship here?',
        options: [
            'Ice cream causes drowning deaths',
            'Temperature causes both ice cream sales and swimming activity',
            'Drowning deaths cause ice cream sales',
            'There is no relationship at all'
        ],
        correctAnswer: 1,
        explanation: 'Perfect! You\'ve solved the mystery. Temperature causes both variables: hot weather leads to more ice cream sales AND more swimming, which leads to more drowning deaths. The original correlation was spurious!',
        completed: false
    }
];

// 4. CAUSAL DETECTIVE COMPONENT
// ============================================================================
const CausalDetective: React.FC = () => {
    // 4. SETUP REFS AND STATE
    // ============================================================================
    const svgRef = useRef<SVGSVGElement>(null);

    // State for mystery selection
    const [selectedMystery, setSelectedMystery] = useState<string>('ice-cream-conspiracy');
    const [currentScenario, setCurrentScenario] = useState<MysteryScenario>(mysteryScenarios[0]);

    // State for investigation
    const [showConfoundingVariable, setShowConfoundingVariable] = useState(false);

    // State for structured learning
    const [learningProgress, setLearningProgress] = useState<LearningProgress>({
        currentStep: 0,
        steps: iceCreamLearningSteps,
        score: 0
    });
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    // State for visualization controls
    const [showGrid, setShowGrid] = useState(true);
    const [showLabels, setShowLabels] = useState(true);

    // State for results
    const [correlation, setCorrelation] = useState(0);
    const [mysterySolved, setMysterySolved] = useState(false);

    // 5. ALGORITHM FUNCTIONS
    // ============================================================================
    const calculateCorrelation = (data: DataPoint[]) => {
        if (data.length < 2) return 0;

        const n = data.length;
        const sumX = data.reduce((sum, d) => sum + d.x, 0);
        const sumY = data.reduce((sum, d) => sum + d.y, 0);
        const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
        const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
        const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    };

    // Auto-calculate correlation when scenario changes
    useEffect(() => {
        const newCorrelation = calculateCorrelation(currentScenario.dataPoints);
        setCorrelation(newCorrelation);
    }, [currentScenario]);

    // 6. D3 VISUALIZATION
    // ============================================================================
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const height = 400;
        // Increase width to accommodate temperature axis when shown
        // Calculate width based on scenario and margins
        let width = 600; // Base width

        if (currentScenario.id === 'ice-cream-conspiracy') {
            width = showConfoundingVariable ? 740 : 640;
        } else if (currentScenario.id === 'laptop-learning') {
            width = 680; // 600 + 80 margin
        } else if (currentScenario.id === 'medicine-trial') {
            width = 680; // 600 + 80 margin
        }
        // Set right margin based on scenario and confounding variable state
        let rightMargin = 60; // Base margin for all scenarios

        if (currentScenario.id === 'ice-cream-conspiracy') {
            rightMargin = showConfoundingVariable ? 180 : 60;
        } else if (currentScenario.id === 'laptop-learning') {
            rightMargin = 80; // Need more space for "With Lap" labels
        } else if (currentScenario.id === 'medicine-trial') {
            rightMargin = 80; // Need more space for medicine labels
        }
        const margin = { top: 20, right: rightMargin, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(currentScenario.dataPoints, d => d.x) as [number, number])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(currentScenario.dataPoints, d => d.y) as [number, number])
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

        // Add axes with proper labels
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
            .attr("transform", `translate(${innerWidth / 2}, ${innerHeight + 35})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(currentScenario.id === 'ice-cream-conspiracy' ? "Ice Cream Sales (gallons per month)" :
                currentScenario.id === 'laptop-learning' ? "Laptop Usage (0=No, 1=Yes)" :
                    "Treatment Group (0=Placebo, 1=Drug)");

        g.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (innerHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(currentScenario.id === 'ice-cream-conspiracy' ? "Drowning Deaths (per month)" :
                currentScenario.id === 'laptop-learning' ? "Test Score (0-100)" :
                    "Improvement Score (0-100)");

        // Draw data points
        g.selectAll('.data-point')
            .data(currentScenario.dataPoints)
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
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 8)
                    .style('opacity', 1);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 6)
                    .style('opacity', 0.8);
            });

        // Add labels if enabled
        if (showLabels) {
            g.selectAll('.data-label')
                .data(currentScenario.dataPoints)
                .enter()
                .append('text')
                .attr('class', 'data-label')
                .attr('x', d => xScale(d.x) + 10)
                .attr('y', d => yScale(d.y) - 10)
                .text(d => d.label)
                .style('font-size', '12px')
                .style('fill', '#374151')
                .style('font-weight', '500');
        }

        // Add temperature data visualization when confounding variable is revealed
        if (showConfoundingVariable && currentScenario.id === 'ice-cream-conspiracy') {
            console.log('Adding temperature data visualization...');
            // Temperature data for each month (matching the scenario data)
            const temperatureData = [
                { month: 'Jan', temp: 32, x: 50, y: 12 },
                { month: 'Feb', temp: 35, x: 65, y: 18 },
                { month: 'Mar', temp: 45, x: 80, y: 25 },
                { month: 'Apr', temp: 55, x: 120, y: 35 },
                { month: 'May', temp: 65, x: 150, y: 45 },
                { month: 'Jun', temp: 75, x: 180, y: 55 },
                { month: 'Jul', temp: 85, x: 200, y: 65 },
                { month: 'Aug', temp: 80, x: 190, y: 60 },
                { month: 'Sep', temp: 70, x: 160, y: 40 },
                { month: 'Oct', temp: 60, x: 100, y: 25 },
                { month: 'Nov', temp: 45, x: 70, y: 15 },
                { month: 'Dec', temp: 35, x: 45, y: 10 }
            ];

            // Create temperature scale for the right side
            const tempScale = d3.scaleLinear()
                .domain([30, 95])
                .range([innerHeight, 0]);

            // Add temperature axis on the right
            g.append("g")
                .attr("class", "temperature-axis")
                .attr("transform", `translate(${innerWidth + 20}, 0)`)
                .call(d3.axisRight(tempScale)
                    .tickFormat(d => `${d}°F`))
                .style("font-size", "10px")
                .style("fill", "#dc2626");

            // Add temperature axis label
            g.append("text")
                .attr("class", "temperature-label")
                .attr("transform", "rotate(90)")
                .attr("y", innerWidth + 35)
                .attr("x", innerHeight / 2)
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .style("font-weight", "600")
                .style("fill", "#dc2626")
                .text("Temperature (°F)");

            // Add temperature indicators for each data point
            currentScenario.dataPoints.forEach((dataPoint) => {
                const tempData = temperatureData.find(t => t.month === dataPoint.label);
                if (tempData) {
                    // Add temperature line from data point to temperature axis
                    g.append("line")
                        .attr("x1", xScale(dataPoint.x))
                        .attr("y1", yScale(dataPoint.y))
                        .attr("x2", innerWidth + 15)
                        .attr("y2", tempScale(tempData.temp))
                        .attr("stroke", "#dc2626")
                        .attr("stroke-width", 2)
                        .attr("stroke-dasharray", "3,3")
                        .attr("opacity", 0.7);

                    // Add temperature value
                    g.append("text")
                        .attr("x", innerWidth + 25)
                        .attr("y", tempScale(tempData.temp))
                        .attr("dy", "0.35em")
                        .text(`${tempData.temp}°F`)
                        .style("font-size", "10px")
                        .style("font-weight", "600")
                        .style("fill", "#dc2626");
                }
            });

            // Add explanation text
            g.append("text")
                .attr("x", innerWidth / 2)
                .attr("y", -5)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "600")
                .style("fill", "#dc2626")
                .text("Temperature Data Revealed - See how temperature affects both variables!");
        }
    };

    // 7. EFFECTS FOR VISUALIZATION UPDATES
    // ============================================================================
    useEffect(() => {
        const scenario = mysteryScenarios.find(s => s.id === selectedMystery);
        if (scenario) {
            setCurrentScenario(scenario);
        }
    }, [selectedMystery]);

    useEffect(() => {
        drawVisualization();
    }, [currentScenario, showGrid, showLabels, showConfoundingVariable]);

    // 8. EVENT HANDLERS
    // ============================================================================
    const handleMysteryChange = (mysteryId: string) => {
        setSelectedMystery(mysteryId);
        setShowConfoundingVariable(false);
        setMysterySolved(false);
        resetLearning();
    };

    const toggleConfoundingVariable = () => {
        setShowConfoundingVariable(!showConfoundingVariable);
        if (!showConfoundingVariable && currentScenario.id === 'ice-cream-conspiracy') {
            // Calculate correlation controlling for temperature (simplified)
            // In reality, this would be a partial correlation calculation
            const controlledCorrelation = 0.12; // Much lower correlation when controlling for temperature

            // Temperature data revealed - correlation drops

            // Update the correlation display to show the controlled correlation
            setCorrelation(controlledCorrelation);
        }
    };

    // Auto-solve mystery when all steps are completed
    useEffect(() => {
        if (learningProgress.currentStep === learningProgress.steps.length - 1 &&
            learningProgress.steps[learningProgress.steps.length - 1].completed) {
            setMysterySolved(true);
        }
    }, [learningProgress]);

    // Auto-reveal confounding variable when reaching Step 4
    useEffect(() => {
        console.log('Step check:', learningProgress.currentStep, 'Scenario:', currentScenario.id);
        if (learningProgress.currentStep === 3 && currentScenario.id === 'ice-cream-conspiracy') {
            console.log('Setting showConfoundingVariable to true');
            setShowConfoundingVariable(true);
            // Update correlation to show controlled correlation
            setCorrelation(0.12);
        }
    }, [learningProgress.currentStep, currentScenario.id]);

    // Learning step handlers
    const handleAnswerSelect = (answerIndex: number) => {
        setSelectedAnswer(answerIndex);
        setShowExplanation(true);

        const currentStep = learningProgress.steps[learningProgress.currentStep];
        const isCorrect = answerIndex === currentStep.correctAnswer;

        // Update learning progress
        setLearningProgress(prev => ({
            ...prev,
            score: prev.score + (isCorrect ? 1 : 0),
            steps: prev.steps.map((step, index) =>
                index === prev.currentStep
                    ? { ...step, completed: true }
                    : step
            )
        }));
    };

    const nextStep = () => {
        if (learningProgress.currentStep < learningProgress.steps.length - 1) {
            setLearningProgress(prev => ({
                ...prev,
                currentStep: prev.currentStep + 1
            }));
            setSelectedAnswer(null);
            setShowExplanation(false);

            // Auto-reveal confounding variable on step 4 (index 3)
            if (learningProgress.currentStep === 3) {
                setShowConfoundingVariable(true);
            }
        }
    };

    const resetLearning = () => {
        setLearningProgress({
            currentStep: 0,
            steps: iceCreamLearningSteps.map(step => ({ ...step, completed: false })),
            score: 0
        });
        setSelectedAnswer(null);
        setShowExplanation(false);
        setShowConfoundingVariable(false);
        setMysterySolved(false);
    };

    // 9. RENDER THE DETECTIVE INTERFACE
    // ============================================================================
    return (
        <div className="causal-detective fade-in">
            <div className="container">
                {/* STANDARDIZED PAGE HEADER */}
                <div className="page-header">
                    <h1 className="page-title">Causal Detective</h1>
                    <h1 className="page-title" style={{ color: '#ff0000' }}>NOTE: THIS MODULE IS IN DEVELOPMENT!!!!</h1>
                    <p className="page-description">
                        Solve mysteries by investigating whether relationships are causal or just correlated.
                        Use your detective skills to uncover the truth!
                    </p>
                </div>

                {/* MYSTERY SELECTION */}
                <div className="mystery-selection">
                    <h2 className="section-title">Choose Your Case</h2>
                    <div className="mystery-cards">
                        {mysteryScenarios.map((scenario) => (
                            <div
                                key={scenario.id}
                                className={`mystery-card ${selectedMystery === scenario.id ? 'selected' : ''}`}
                                onClick={() => handleMysteryChange(scenario.id)}
                            >
                                <h3 className="mystery-title">{scenario.title}</h3>
                                <p className="mystery-description">{scenario.description}</p>
                                <div className="mystery-evidence">
                                    <strong>Initial Evidence:</strong> {scenario.initialEvidence}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DETECTIVE LAYOUT */}
                <div className="detective-layout-compact">
                    {/* LEFT COLUMN: EVIDENCE ANALYSIS */}
                    <div className="evidence-section">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Evidence Analysis</h3>
                                <div className="canvas-controls">
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
                                    {currentScenario.confoundingVariable && (
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={showConfoundingVariable}
                                                onChange={toggleConfoundingVariable}
                                            />
                                            Reveal Confounding Variable
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="visualization-container">
                                    <svg ref={svgRef} className="detective-svg"></svg>
                                </div>
                            </div>
                        </div>

                        {/* ANALYSIS RESULTS - MOVED UNDER GRAPH */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Analysis Results</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-grid">
                                    <div className="result-item">
                                        <span className="result-label">Correlation:</span>
                                        <span className="result-value">
                                            {showConfoundingVariable && currentScenario.id === 'ice-cream-conspiracy' ? '0.120 (controlled)' : correlation.toFixed(3)}
                                        </span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Relationship:</span>
                                        <span className="result-value">
                                            {showConfoundingVariable && currentScenario.id === 'ice-cream-conspiracy' ? 'Weak (controlled)' :
                                                Math.abs(correlation) > 0.7 ? 'Strong' :
                                                    Math.abs(correlation) > 0.3 ? 'Moderate' : 'Weak'}
                                        </span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Status:</span>
                                        <span className="result-value">
                                            {mysterySolved ? 'Solved' : 'Under Investigation'}
                                        </span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Progress:</span>
                                        <span className="result-value">
                                            {learningProgress.currentStep + 1}/{learningProgress.steps.length} steps
                                        </span>
                                    </div>
                                </div>

                                {/* Educational explanation when confounding variable is revealed */}
                                {showConfoundingVariable && currentScenario.id === 'ice-cream-conspiracy' && (
                                    <div className="educational-explanation">
                                        <h4>Detective Discovery!</h4>
                                        <p><strong>What happened:</strong> When we control for temperature, the correlation between ice cream sales and drowning drops dramatically!</p>
                                        <p><strong>Why:</strong> Temperature causes both variables:</p>
                                        <ul>
                                            <li>Hot weather → More ice cream sales</li>
                                            <li>Hot weather → More swimming → More drowning</li>
                                        </ul>
                                        <p><strong>Conclusion:</strong> The original correlation was spurious - ice cream doesn't cause drowning!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* STRUCTURED LEARNING INTERFACE */}
                    <div className="detective-tools">
                        {/* LEARNING PROGRESS */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Detective Training</h3>
                                <div className="progress-info">
                                    <span>Step {learningProgress.currentStep + 1} of {learningProgress.steps.length}</span>
                                    <span>Score: {learningProgress.score}/{learningProgress.steps.length}</span>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="learning-step">
                                    <h4 className="step-title">
                                        {learningProgress.steps[learningProgress.currentStep].title}
                                    </h4>
                                    <p className="step-question">
                                        {learningProgress.steps[learningProgress.currentStep].question}
                                    </p>

                                    <div className="answer-options">
                                        {learningProgress.steps[learningProgress.currentStep].options.map((option, index) => (
                                            <button
                                                key={index}
                                                className={`answer-option ${selectedAnswer === index ? 'selected' : ''} ${showExplanation && index === learningProgress.steps[learningProgress.currentStep].correctAnswer ? 'correct' : ''
                                                    } ${showExplanation && selectedAnswer === index && index !== learningProgress.steps[learningProgress.currentStep].correctAnswer ? 'incorrect' : ''}`}
                                                onClick={() => handleAnswerSelect(index)}
                                                disabled={showExplanation}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>

                                    {showExplanation && (
                                        <div className="explanation">
                                            <p className="explanation-text">
                                                {learningProgress.steps[learningProgress.currentStep].explanation}
                                            </p>
                                            {learningProgress.currentStep < learningProgress.steps.length - 1 ? (
                                                <button onClick={nextStep} className="btn btn-primary">
                                                    Next Step
                                                </button>
                                            ) : (
                                                <button onClick={resetLearning} className="btn btn-success">
                                                    Start Over
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* LEARNING SUMMARY */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Learning Summary</h3>
                            </div>
                            <div className="card-body">
                                <div className="learning-summary">
                                    <div className="summary-item">
                                        <span className="summary-label">Progress:</span>
                                        <span className="summary-value">
                                            {learningProgress.currentStep + 1} / {learningProgress.steps.length} steps
                                        </span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Score:</span>
                                        <span className="summary-value">
                                            {learningProgress.score} / {learningProgress.steps.length} correct
                                        </span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Current Step:</span>
                                        <span className="summary-value">
                                            {learningProgress.steps[learningProgress.currentStep].title}
                                        </span>
                                    </div>

                                    {learningProgress.currentStep > 0 && (
                                        <div className="completed-steps">
                                            <h5>Completed Steps:</h5>
                                            <ul>
                                                {learningProgress.steps.slice(0, learningProgress.currentStep).map((step, index) => (
                                                    <li key={index} className={step.completed ? 'completed' : ''}>
                                                        {step.title}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* EDUCATIONAL CONTENT */}
                <div className="detective-education">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Detective's Guide to Causal Inference</h3>
                        </div>
                        <div className="card-body">
                            <div className="education-content">
                                <h4>How to Solve Causal Mysteries</h4>
                                <p>
                                    As a causal detective, your job is to determine whether relationships are
                                    <strong> causal</strong> (A actually causes B) or <strong>spurious</strong>
                                    (A and B are both caused by a third variable C).
                                </p>

                                <h4>Detective Tools</h4>
                                <ul>
                                    <li><strong>Correlation Analysis:</strong> Measure the strength of relationships</li>
                                    <li><strong>Confounding Detection:</strong> Look for hidden variables that might explain the relationship</li>
                                    <li><strong>Experiment Design:</strong> Create controlled experiments to test causal claims</li>
                                    <li><strong>Bias Recognition:</strong> Identify common biases in observational studies</li>
                                </ul>

                                <h4>Current Case: {currentScenario.title}</h4>
                                <p><strong>Learning Objective:</strong> {currentScenario.learningObjective}</p>
                                <p><strong>Your Task:</strong> Investigate the evidence and determine if this relationship is causal or spurious.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COPYRIGHT NOTICE */}
                <section className="copyright-section">
                    <div className="copyright-notice">
                        <p>&copy; 2025, Todd Brous. All rights reserved.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CausalDetective;
