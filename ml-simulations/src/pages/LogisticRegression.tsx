import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './LogisticRegression.css';

interface DataPoint {
    x: number;
    y: number;
    label: number;
    id: string;
}

interface LogisticResult {
    coefficients: number[];
    accuracy: number;
    predictions: number[];
    probabilities: number[];
    decisionBoundary: { x: number, y: number }[];
}

interface Dataset {
    name: string;
    description: string;
    xLabel: string;
    yLabel: string;
    data: DataPoint[];
    color0: string;
    color1: string;
}

const LogisticRegression: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedDataset, setSelectedDataset] = useState<string>('medical');
    const [learningRate, setLearningRate] = useState<number>(0.1);
    const [iterations, setIterations] = useState<number>(100);
    const [regularization, setRegularization] = useState<number>(0);
    const [autoOptimize, setAutoOptimize] = useState<boolean>(false);
    const [showDecisionBoundary, setShowDecisionBoundary] = useState<boolean>(true);
    const [showProbabilities, setShowProbabilities] = useState<boolean>(false);
    const [noiseSeed, setNoiseSeed] = useState<number>(1);
    const [logisticResult, setLogisticResult] = useState<LogisticResult | null>(null);

    // Generate noisy data with seed for reproducibility
    const generateNoisyData = (seed: number): DataPoint[] => {
        // Set seed for reproducible randomness
        const random = (() => {
            let current = seed;
            return () => {
                current = (current * 9301 + 49297) % 233280;
                return current / 233280;
            };
        })();

        // Base pattern (clean data) - INTUITIVE relationship: more study = higher scores
        const baseData = [
            // Class 0: High scores, moderate study (passing students)
            { x: 85, y: 3, label: 0, id: '1' },
            { x: 88, y: 4, label: 0, id: '2' },
            { x: 90, y: 5, label: 0, id: '3' },
            { x: 92, y: 6, label: 0, id: '4' },
            { x: 87, y: 3.5, label: 0, id: '5' },
            { x: 89, y: 4.5, label: 0, id: '6' },
            { x: 91, y: 5.5, label: 0, id: '7' },
            { x: 86, y: 3.8, label: 0, id: '8' },
            { x: 93, y: 6.5, label: 0, id: '9' },
            { x: 88, y: 4.2, label: 0, id: '10' },
            // Class 1: Low scores, low study (failing students)
            { x: 65, y: 1, label: 1, id: '11' },
            { x: 68, y: 2, label: 1, id: '12' },
            { x: 70, y: 1.5, label: 1, id: '13' },
            { x: 72, y: 2.5, label: 1, id: '14' },
            { x: 66, y: 1.2, label: 1, id: '15' },
            { x: 69, y: 1.8, label: 1, id: '16' },
            { x: 71, y: 2.2, label: 1, id: '17' },
            { x: 67, y: 1.5, label: 1, id: '18' },
            { x: 73, y: 2.8, label: 1, id: '19' },
            { x: 64, y: 0.8, label: 1, id: '20' }
        ];

        // Add noise to base data
        const noisyData = baseData.map((point, index) => ({
            ...point,
            x: point.x + (random() - 0.5) * 4, // ±2 noise
            y: point.y + (random() - 0.5) * 2, // ±1 noise
            id: `base-${index + 1}`
        }));

        // Add some outliers and borderline cases - realistic scenarios
        const outliers = [
            // Struggling student: low score despite moderate study (realistic outlier for class 1)
            { x: 62 + (random() - 0.5) * 3, y: 4 + (random() - 0.5) * 1, label: 1, id: 'struggling-1' },
            // Borderline cases: moderate study, moderate scores
            { x: 80 + (random() - 0.5) * 3, y: 4 + (random() - 0.5) * 1, label: 0, id: 'borderline-1' },
            { x: 75 + (random() - 0.5) * 3, y: 3 + (random() - 0.5) * 1, label: 1, id: 'borderline-2' },
            { x: 78 + (random() - 0.5) * 3, y: 5 + (random() - 0.5) * 1, label: 0, id: 'borderline-3' }
        ];

        return [...noisyData, ...outliers];
    };

    // Get current dataset with reactive noise generation
    const getCurrentDataset = (): Dataset => {
        const baseDatasets: { [key: string]: Omit<Dataset, 'data'> } = {
            medical: {
                name: 'Medical Diagnosis',
                description: 'Patient age vs test results for disease prediction',
                xLabel: 'Age (years)',
                yLabel: 'Test Score',
                color0: '#3b82f6',
                color1: '#ef4444'
            },
            marketing: {
                name: 'Marketing Campaign',
                description: 'Customer age vs income for product purchase prediction',
                xLabel: 'Age (years)',
                yLabel: 'Income (K$)',
                color0: '#10b981',
                color1: '#f59e0b'
            },
            finance: {
                name: 'Credit Risk',
                description: 'Credit score vs debt ratio for loan approval prediction',
                xLabel: 'Credit Score',
                yLabel: 'Debt Ratio (%)',
                color0: '#8b5cf6',
                color1: '#ef4444'
            },
            overlapping: {
                name: 'Overlapping Classes',
                description: 'Challenging dataset with overlapping classes - test algorithm robustness',
                xLabel: 'Feature 1',
                yLabel: 'Feature 2',
                color0: '#10b981',
                color1: '#f59e0b'
            },
            noisy: {
                name: 'Noisy Data',
                description: 'Realistic student data with noise and outliers - test regularization',
                xLabel: 'Test Score',
                yLabel: 'Study Hours',
                color0: '#3b82f6',
                color1: '#ef4444'
            }
        };

        const baseDataset = baseDatasets[selectedDataset];
        if (!baseDataset) {
            // Return medical dataset with data
            return {
                ...baseDatasets.medical,
                data: [
                    { x: 25, y: 45, label: 0, id: '1' },
                    { x: 30, y: 52, label: 0, id: '2' },
                    { x: 35, y: 38, label: 0, id: '3' },
                    { x: 40, y: 48, label: 0, id: '4' },
                    { x: 45, y: 55, label: 0, id: '5' },
                    { x: 28, y: 42, label: 0, id: '6' },
                    { x: 32, y: 50, label: 0, id: '7' },
                    { x: 38, y: 46, label: 0, id: '8' },
                    { x: 42, y: 53, label: 0, id: '9' },
                    { x: 48, y: 58, label: 0, id: '10' },
                    { x: 55, y: 25, label: 1, id: '11' },
                    { x: 60, y: 30, label: 1, id: '12' },
                    { x: 65, y: 35, label: 1, id: '13' },
                    { x: 70, y: 28, label: 1, id: '14' },
                    { x: 75, y: 32, label: 1, id: '15' },
                    { x: 58, y: 22, label: 1, id: '16' },
                    { x: 62, y: 27, label: 1, id: '17' },
                    { x: 68, y: 33, label: 1, id: '18' },
                    { x: 72, y: 26, label: 1, id: '19' },
                    { x: 78, y: 31, label: 1, id: '20' }
                ]
            };
        }

        // Generate data based on dataset type
        let data: DataPoint[];
        switch (selectedDataset) {
            case 'medical':
                data = [
                    { x: 25, y: 45, label: 0, id: '1' },
                    { x: 30, y: 52, label: 0, id: '2' },
                    { x: 35, y: 38, label: 0, id: '3' },
                    { x: 40, y: 48, label: 0, id: '4' },
                    { x: 45, y: 55, label: 0, id: '5' },
                    { x: 28, y: 42, label: 0, id: '6' },
                    { x: 32, y: 50, label: 0, id: '7' },
                    { x: 38, y: 46, label: 0, id: '8' },
                    { x: 42, y: 53, label: 0, id: '9' },
                    { x: 48, y: 58, label: 0, id: '10' },
                    { x: 55, y: 25, label: 1, id: '11' },
                    { x: 60, y: 30, label: 1, id: '12' },
                    { x: 65, y: 35, label: 1, id: '13' },
                    { x: 70, y: 28, label: 1, id: '14' },
                    { x: 75, y: 32, label: 1, id: '15' },
                    { x: 58, y: 22, label: 1, id: '16' },
                    { x: 62, y: 27, label: 1, id: '17' },
                    { x: 68, y: 33, label: 1, id: '18' },
                    { x: 72, y: 26, label: 1, id: '19' },
                    { x: 78, y: 31, label: 1, id: '20' }
                ];
                break;
            case 'marketing':
                data = [
                    { x: 22, y: 35, label: 0, id: '1' },
                    { x: 25, y: 42, label: 0, id: '2' },
                    { x: 28, y: 38, label: 0, id: '3' },
                    { x: 30, y: 45, label: 0, id: '4' },
                    { x: 32, y: 50, label: 0, id: '5' },
                    { x: 24, y: 40, label: 0, id: '6' },
                    { x: 26, y: 44, label: 0, id: '7' },
                    { x: 29, y: 48, label: 0, id: '8' },
                    { x: 31, y: 52, label: 0, id: '9' },
                    { x: 33, y: 55, label: 0, id: '10' },
                    { x: 45, y: 25, label: 1, id: '11' },
                    { x: 50, y: 30, label: 1, id: '12' },
                    { x: 55, y: 35, label: 1, id: '13' },
                    { x: 60, y: 28, label: 1, id: '14' },
                    { x: 65, y: 32, label: 1, id: '15' },
                    { x: 48, y: 22, label: 1, id: '16' },
                    { x: 52, y: 27, label: 1, id: '17' },
                    { x: 58, y: 33, label: 1, id: '18' },
                    { x: 62, y: 26, label: 1, id: '19' },
                    { x: 68, y: 31, label: 1, id: '20' }
                ];
                break;
            case 'finance':
                data = [
                    { x: 750, y: 15, label: 0, id: '1' },
                    { x: 780, y: 18, label: 0, id: '2' },
                    { x: 720, y: 12, label: 0, id: '3' },
                    { x: 800, y: 20, label: 0, id: '4' },
                    { x: 760, y: 16, label: 0, id: '5' },
                    { x: 740, y: 14, label: 0, id: '6' },
                    { x: 790, y: 19, label: 0, id: '7' },
                    { x: 730, y: 13, label: 0, id: '8' },
                    { x: 770, y: 17, label: 0, id: '9' },
                    { x: 810, y: 21, label: 0, id: '10' },
                    { x: 600, y: 45, label: 1, id: '11' },
                    { x: 550, y: 50, label: 1, id: '12' },
                    { x: 500, y: 55, label: 1, id: '13' },
                    { x: 450, y: 60, label: 1, id: '14' },
                    { x: 400, y: 65, label: 1, id: '15' },
                    { x: 580, y: 48, label: 1, id: '16' },
                    { x: 530, y: 52, label: 1, id: '17' },
                    { x: 480, y: 58, label: 1, id: '18' },
                    { x: 430, y: 62, label: 1, id: '19' },
                    { x: 380, y: 68, label: 1, id: '20' }
                ];
                break;
            case 'overlapping':
                data = [
                    { x: 20, y: 30, label: 0, id: '1' },
                    { x: 25, y: 35, label: 0, id: '2' },
                    { x: 30, y: 25, label: 0, id: '3' },
                    { x: 35, y: 40, label: 0, id: '4' },
                    { x: 40, y: 35, label: 0, id: '5' },
                    { x: 22, y: 32, label: 0, id: '6' },
                    { x: 28, y: 38, label: 0, id: '7' },
                    { x: 33, y: 28, label: 0, id: '8' },
                    { x: 38, y: 42, label: 0, id: '9' },
                    { x: 42, y: 37, label: 0, id: '10' },
                    { x: 45, y: 20, label: 1, id: '11' },
                    { x: 50, y: 25, label: 1, id: '12' },
                    { x: 55, y: 15, label: 1, id: '13' },
                    { x: 60, y: 30, label: 1, id: '14' },
                    { x: 65, y: 22, label: 1, id: '15' },
                    { x: 47, y: 18, label: 1, id: '16' },
                    { x: 52, y: 28, label: 1, id: '17' },
                    { x: 57, y: 12, label: 1, id: '18' },
                    { x: 62, y: 35, label: 1, id: '19' },
                    { x: 67, y: 25, label: 1, id: '20' },
                    // Overlapping region - challenging points
                    { x: 40, y: 30, label: 0, id: '21' },
                    { x: 42, y: 32, label: 0, id: '22' },
                    { x: 44, y: 28, label: 0, id: '23' },
                    { x: 46, y: 35, label: 1, id: '24' },
                    { x: 48, y: 32, label: 1, id: '25' },
                    { x: 50, y: 30, label: 1, id: '26' }
                ];
                break;
            case 'noisy':
                data = generateNoisyData(noiseSeed);
                break;
            default:
                data = [];
        }

        return {
            ...baseDataset,
            data
        };
    };

    const currentDataset = getCurrentDataset();

    // Sigmoid function
    const sigmoid = (z: number): number => {
        return 1 / (1 + Math.exp(-z));
    };

    // Auto-optimize parameters for noisy dataset with better search strategy
    const optimizeParametersForNoisyData = (data: DataPoint[]): { learningRate: number, iterations: number, regularization: number } => {
        const bestParams = { learningRate: 0.1, iterations: 100, regularization: 0 };
        let bestAccuracy = 0;

        // More comprehensive parameter search for better separation
        const learningRates = [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5];
        const iterationsList = [500, 1000, 2000, 3000, 5000];
        const regularizations = [0, 0.001, 0.01, 0.05, 0.1];

        console.log('Starting parameter optimization for noisy data...');

        for (const lr of learningRates) {
            for (const iter of iterationsList) {
                for (const reg of regularizations) {
                    const result = performLogisticRegression(data, lr, iter, reg);
                    if (result.accuracy > bestAccuracy) {
                        bestAccuracy = result.accuracy;
                        bestParams.learningRate = lr;
                        bestParams.iterations = iter;
                        bestParams.regularization = reg;
                        console.log(`New best: LR=${lr}, Iter=${iter}, Reg=${reg}, Acc=${(result.accuracy * 100).toFixed(1)}%`);
                    }
                }
            }
        }

        // Try one more time with the best parameters to ensure convergence
        const finalResult = performLogisticRegression(data, bestParams.learningRate, bestParams.iterations, bestParams.regularization);

        console.log('Final optimized parameters:', bestParams, 'Final Accuracy:', (finalResult.accuracy * 100).toFixed(1) + '%');
        return bestParams;
    };

    // Logistic regression using gradient descent
    const performLogisticRegression = (data: DataPoint[], learningRate: number, iterations: number, regularization: number): LogisticResult => {
        const n = data.length;
        const features = data.map(d => [1, d.x, d.y]); // [bias, x, y]
        const labels = data.map(d => d.label);

        // Initialize weights [bias, x_weight, y_weight]
        let weights = [0, 0, 0];

        // Gradient descent with improved convergence
        let prevCost = Infinity;
        let patience = 0;
        const maxPatience = 100;

        for (let iter = 0; iter < iterations; iter++) {
            const gradients = [0, 0, 0];
            let cost = 0;

            for (let i = 0; i < n; i++) {
                const z = weights[0] + weights[1] * features[i][1] + weights[2] * features[i][2];
                const prediction = sigmoid(z);
                const error = prediction - labels[i];

                gradients[0] += error;
                gradients[1] += error * features[i][1];
                gradients[2] += error * features[i][2];

                // Calculate cost for early stopping
                cost += error * error;
            }

            // Average gradients and add regularization
            gradients[0] /= n;
            gradients[1] /= n;
            gradients[1] += regularization * weights[1];
            gradients[2] /= n;
            gradients[2] += regularization * weights[2];

            cost /= n; // Average cost

            // Early stopping if converged
            if (Math.abs(prevCost - cost) < 1e-8) {
                patience++;
                if (patience >= maxPatience) {
                    console.log(`Converged early at iteration ${iter}`);
                    break;
                }
            } else {
                patience = 0;
            }
            prevCost = cost;

            // Update weights with adaptive learning rate
            const adaptiveLR = learningRate * (1 - iter / iterations); // Decay learning rate
            weights[0] -= adaptiveLR * gradients[0];
            weights[1] -= adaptiveLR * gradients[1];
            weights[2] -= adaptiveLR * gradients[2];
        }

        // Calculate predictions and probabilities
        const predictions = features.map(f => {
            const z = weights[0] + weights[1] * f[1] + weights[2] * f[2];
            return sigmoid(z) > 0.5 ? 1 : 0;
        });

        const probabilities = features.map(f => {
            const z = weights[0] + weights[1] * f[1] + weights[2] * f[2];
            return sigmoid(z);
        });

        // Calculate accuracy
        const correct = predictions.reduce((sum: number, pred, i) => sum + (pred === labels[i] ? 1 : 0), 0);
        const accuracy = correct / n;

        // Generate decision boundary points
        const xMin = Math.min(...data.map(d => d.x));
        const xMax = Math.max(...data.map(d => d.x));
        const yMin = Math.min(...data.map(d => d.y));
        const yMax = Math.max(...data.map(d => d.y));

        const decisionBoundary: { x: number, y: number }[] = [];
        for (let x = xMin; x <= xMax; x += (xMax - xMin) / 100) {
            // Solve: weights[0] + weights[1]*x + weights[2]*y = 0
            // y = -(weights[0] + weights[1]*x) / weights[2]
            if (Math.abs(weights[2]) > 1e-10) { // Use small epsilon instead of exact zero check
                const y = -(weights[0] + weights[1] * x) / weights[2];
                if (y >= yMin && y <= yMax) {
                    decisionBoundary.push({ x, y });
                }
            }
        }

        return {
            coefficients: weights,
            accuracy,
            predictions,
            probabilities,
            decisionBoundary
        };
    };

    // Perform regression when parameters change
    useEffect(() => {
        console.log('Performing logistic regression:', {
            dataset: selectedDataset,
            learningRate,
            iterations,
            regularization,
            dataPoints: currentDataset.data.length,
            autoOptimize
        });

        let result;
        if (selectedDataset === 'noisy' && autoOptimize) {
            // Auto-optimize parameters for noisy dataset
            const optimizedParams = optimizeParametersForNoisyData(currentDataset.data);
            result = performLogisticRegression(currentDataset.data, optimizedParams.learningRate, optimizedParams.iterations, optimizedParams.regularization);

            // Update the UI with optimized parameters
            setLearningRate(optimizedParams.learningRate);
            setIterations(optimizedParams.iterations);
            setRegularization(optimizedParams.regularization);
        } else {
            // Use manual parameters
            result = performLogisticRegression(currentDataset.data, learningRate, iterations, regularization);
        }

        setLogisticResult(result);

        console.log('Logistic regression completed:', {
            coefficients: result.coefficients,
            accuracy: result.accuracy
        });
    }, [currentDataset, learningRate, iterations, regularization, autoOptimize]);

    // Draw visualization
    useEffect(() => {
        if (!logisticResult || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const dataset = currentDataset;
        const containerWidth = 700;
        const containerHeight = 450;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };

        // Create main SVG
        svg
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("border", "1px solid #e5e7eb")
            .style("border-radius", "8px")
            .style("background", "white");

        // Create scales
        const xExtent = d3.extent(dataset.data, d => d.x) as [number, number];
        const yExtent = d3.extent(dataset.data, d => d.y) as [number, number];

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([margin.left, containerWidth - margin.right]);

        const yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([containerHeight - margin.bottom, margin.top]);

        // Create axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format(".0f"));
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d3.format(".0f"));

        svg.append("g")
            .attr("transform", `translate(0, ${containerHeight - margin.bottom})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#6b7280");

        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("fill", "#6b7280");

        // Add axis labels
        svg.append("text")
            .attr("x", containerWidth / 2)
            .attr("y", containerHeight - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(dataset.xLabel);

        svg.append("text")
            .attr("x", 15)
            .attr("y", containerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90, 15, " + (containerHeight / 2) + ")")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(dataset.yLabel);

        // Draw probability heatmap if enabled
        if (showProbabilities) {
            const xRange = xExtent[1] - xExtent[0];
            const yRange = yExtent[1] - yExtent[0];
            const stepX = xRange / 50;
            const stepY = yRange / 50;

            for (let x = xExtent[0]; x <= xExtent[1]; x += stepX) {
                for (let y = yExtent[0]; y <= yExtent[1]; y += stepY) {
                    const z = logisticResult.coefficients[0] +
                        logisticResult.coefficients[1] * x +
                        logisticResult.coefficients[2] * y;
                    const probability = sigmoid(z);

                    svg.append("rect")
                        .attr("x", xScale(x))
                        .attr("y", yScale(y))
                        .attr("width", xScale(x + stepX) - xScale(x))
                        .attr("height", yScale(y - stepY) - yScale(y))
                        .style("fill", d3.interpolateRgb(dataset.color0, dataset.color1)(probability))
                        .style("opacity", 0.3);
                }
            }
        }

        // Draw decision boundary
        if (showDecisionBoundary && logisticResult.decisionBoundary.length > 0) {
            const line = d3.line<{ x: number, y: number }>()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y));

            svg.append("path")
                .datum(logisticResult.decisionBoundary)
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", "#374151")
                .style("stroke-width", "3px")
                .style("stroke-dasharray", "5,5");
        }

        // Draw data points
        svg.selectAll(".data-point")
            .data(dataset.data)
            .enter()
            .append("circle")
            .attr("class", "data-point")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 8)
            .style("fill", d => d.label === 0 ? dataset.color0 : dataset.color1)
            .style("stroke", "#ffffff")
            .style("stroke-width", "2px")
            .style("cursor", "pointer")
            .on("mouseover", function (_, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 10);

                // Show tooltip
                const tooltip = svg.append("g")
                    .attr("class", "tooltip")
                    .style("pointer-events", "none");

                tooltip.append("rect")
                    .attr("x", xScale(d.x) - 40)
                    .attr("y", yScale(d.y) - 30)
                    .attr("width", 80)
                    .attr("height", 25)
                    .attr("rx", 4)
                    .style("fill", "#1f2937")
                    .style("opacity", 0.9);

                tooltip.append("text")
                    .attr("x", xScale(d.x))
                    .attr("y", yScale(d.y) - 17)
                    .attr("text-anchor", "middle")
                    .style("font-size", "11px")
                    .style("fill", "white")
                    .text(`(${d.x}, ${d.y})`);

                tooltip.append("text")
                    .attr("x", xScale(d.x))
                    .attr("y", yScale(d.y) - 5)
                    .attr("text-anchor", "middle")
                    .style("font-size", "10px")
                    .style("fill", "white")
                    .text(`Class: ${d.label}`);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8);

                svg.selectAll(".tooltip").remove();
            });

        // Add accuracy and equation
        const accuracyText = `Accuracy: ${(logisticResult.accuracy * 100).toFixed(1)}%`;
        const equationText = `z = ${logisticResult.coefficients[0].toFixed(2)} + ${logisticResult.coefficients[1].toFixed(2)}x + ${logisticResult.coefficients[2].toFixed(2)}y`;

        svg.append("text")
            .attr("x", containerWidth - margin.right - 10)
            .attr("y", margin.top + 20)
            .attr("text-anchor", "end")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "#374151")
            .text(accuracyText);

        svg.append("text")
            .attr("x", containerWidth - margin.right - 10)
            .attr("y", margin.top + 40)
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", "500")
            .style("fill", "#6b7280")
            .text(equationText);

    }, [logisticResult, selectedDataset, showDecisionBoundary, showProbabilities]);

    return (
        <div className="logistic-regression fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Logistic Regression Visualizer</h1>
                    <p className="page-description">
                        Explore binary classification through logistic regression. See how the algorithm
                        finds decision boundaries and understand the mathematics behind classification.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Classification Analysis</h2>
                            <div className="classification-stats">
                                {logisticResult && (
                                    <>
                                        <span className="stat">Accuracy: {(logisticResult.accuracy * 100).toFixed(1)}%</span>
                                        <span className="stat">Class 0: {currentDataset.color0}</span>
                                        <span className="stat">Class 1: {currentDataset.color1}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="logistic-svg"></svg>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Dataset Selection</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-controls">
                                    <label className="label">Choose Dataset</label>
                                    <select
                                        value={selectedDataset}
                                        onChange={(e) => setSelectedDataset(e.target.value)}
                                        className="input"
                                    >
                                        <option value="medical">Medical Diagnosis</option>
                                        <option value="marketing">Marketing Campaign</option>
                                        <option value="finance">Credit Risk</option>
                                        <option value="overlapping">Overlapping Classes</option>
                                        <option value="noisy">Noisy Data</option>
                                    </select>
                                    <p className="dataset-description">
                                        {currentDataset.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Algorithm Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Learning Rate</label>
                                        <input
                                            type="range"
                                            min="0.01"
                                            max="1.0"
                                            step="0.01"
                                            value={learningRate}
                                            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{learningRate.toFixed(2)}</span>
                                        <small className="parameter-help">Controls how fast the algorithm learns</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Iterations</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="1000"
                                            step="10"
                                            value={iterations}
                                            onChange={(e) => setIterations(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{iterations}</span>
                                        <small className="parameter-help">Number of training iterations</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Regularization</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="0.1"
                                            step="0.001"
                                            value={regularization}
                                            onChange={(e) => setRegularization(parseFloat(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{regularization.toFixed(3)}</span>
                                        <small className="parameter-help">Prevents overfitting (0 = no regularization)</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Visualization Options</h3>
                            </div>
                            <div className="card-body">
                                <div className="visualization-controls">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={showDecisionBoundary}
                                            onChange={(e) => setShowDecisionBoundary(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Decision Boundary
                                    </label>
                                    <small className="control-help">
                                        Display the line that separates the two classes
                                    </small>

                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={showProbabilities}
                                            onChange={(e) => setShowProbabilities(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        Show Probability Heatmap
                                    </label>
                                    <small className="control-help">
                                        Display probability surface (may be slow)
                                    </small>
                                </div>
                            </div>
                        </div>

                        {selectedDataset === 'noisy' && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Noise Controls</h3>
                                </div>
                                <div className="card-body">
                                    <div className="noise-controls">
                                        <p className="noise-description">
                                            Real-world data has variability. Click to generate new noise patterns
                                            and test if your parameters work across different data samples.
                                        </p>

                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={autoOptimize}
                                                onChange={(e) => setAutoOptimize(e.target.checked)}
                                            />
                                            <span className="checkmark"></span>
                                            Auto-Optimize Parameters
                                        </label>
                                        <small className="control-help">
                                            Automatically find the best parameters for this noisy dataset
                                        </small>

                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setNoiseSeed(prev => prev + 1)}
                                        >
                                            Regenerate Noise
                                        </button>
                                        <small className="control-help">
                                            Test model robustness with different noise patterns
                                        </small>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Model Performance</h3>
                            </div>
                            <div className="card-body">
                                {logisticResult && (
                                    <div className="performance-metrics">
                                        <div className="metric">
                                            <span className="metric-label">Accuracy:</span>
                                            <span className="metric-value">{(logisticResult.accuracy * 100).toFixed(1)}%</span>
                                            <div className="metric-bar">
                                                <div
                                                    className="metric-fill"
                                                    style={{ width: `${logisticResult.accuracy * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Coefficients:</span>
                                            <div className="coefficients">
                                                <div>Bias: {logisticResult.coefficients[0].toFixed(3)}</div>
                                                <div>X: {logisticResult.coefficients[1].toFixed(3)}</div>
                                                <div>Y: {logisticResult.coefficients[2].toFixed(3)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">How It Works</h3>
                            </div>
                            <div className="card-body">
                                <div className="explanation-steps">
                                    <div className="step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <strong>Start with random weights</strong>
                                            <p>Initialize coefficients for the decision boundary</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Calculate probabilities</strong>
                                            <p>Use sigmoid function to get class probabilities</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Update weights</strong>
                                            <p>Adjust coefficients to minimize classification error</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">4</div>
                                        <div className="step-content">
                                            <strong>Find decision boundary</strong>
                                            <p>Continue until the boundary separates classes best</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Logistic Regression</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is Logistic Regression?</h4>
                                <p>
                                    Logistic regression is a statistical method used for binary classification problems.
                                    Unlike linear regression which predicts continuous values, logistic regression predicts
                                    probabilities and classifies data into one of two categories. It's widely used in
                                    machine learning for problems where you need to make yes/no decisions.
                                </p>

                                <h4>Key Concepts</h4>
                                <ul>
                                    <li><strong>Sigmoid Function:</strong> Maps any real number to a probability between 0 and 1</li>
                                    <li><strong>Decision Boundary:</strong> The line that separates the two classes</li>
                                    <li><strong>Logistic Function:</strong> The mathematical function that creates the S-shaped curve</li>
                                    <li><strong>Maximum Likelihood:</strong> The method used to find the best coefficients</li>
                                    <li><strong>Binary Classification:</strong> Problems with exactly two possible outcomes</li>
                                </ul>

                                <h4>Understanding Algorithm Parameters</h4>
                                <p>
                                    The logistic regression algorithm uses three key parameters that control how it learns
                                    to find the best decision boundary. Understanding these parameters is crucial for
                                    building effective classification models.
                                </p>

                                <div className="parameter-explanation">
                                    <div className="parameter-detail">
                                        <h5>Learning Rate (0.01 - 1.0)</h5>
                                        <p>
                                            <strong>What it does:</strong> Controls how big steps the algorithm takes when adjusting
                                            the decision boundary. Think of it like adjusting your stride when walking toward a target.
                                        </p>
                                        <p>
                                            <strong>Too high (0.5-1.0):</strong> The algorithm takes huge steps and might "overshoot"
                                            the best solution, bouncing around and never settling down. You'll see the decision boundary
                                            jumping around wildly.
                                        </p>
                                        <p>
                                            <strong>Too low (0.01-0.05):</strong> The algorithm takes tiny steps and learns very slowly.
                                            It might take hundreds of iterations to find a good solution, or it might get stuck
                                            in a poor solution.
                                        </p>
                                        <p>
                                            <strong>Sweet spot (0.1-0.3):</strong> The algorithm takes reasonable steps, learning
                                            efficiently without overshooting. This is usually where you want to start.
                                        </p>
                                        <p>
                                            <strong>Try this:</strong> Start with 0.1, then try 0.5 to see the boundary jump around,
                                            then try 0.01 to see it learn very slowly.
                                        </p>
                                    </div>

                                    <div className="parameter-detail">
                                        <h5>Iterations (10 - 1000)</h5>
                                        <p>
                                            <strong>What it does:</strong> How many times the algorithm adjusts the decision boundary
                                            before stopping. Each iteration is like taking one step toward the best solution.
                                        </p>
                                        <p>
                                            <strong>Too few (10-50):</strong> The algorithm doesn't have enough time to learn.
                                            The decision boundary might be far from optimal, especially with challenging datasets.
                                        </p>
                                        <p>
                                            <strong>Too many (500-1000):</strong> The algorithm might overfit to the training data,
                                            creating a boundary that works perfectly on this data but poorly on new data.
                                        </p>
                                        <p>
                                            <strong>Sweet spot (100-300):</strong> Usually enough iterations to find a good solution
                                            without overfitting. Watch the accuracy - if it stops improving, you have enough iterations.
                                        </p>
                                        <p>
                                            <strong>Try this:</strong> Start with 100, then increase to 500 and see if accuracy improves.
                                            With the "Overlapping Classes" dataset, you might need more iterations.
                                        </p>
                                    </div>

                                    <div className="parameter-detail">
                                        <h5>Regularization (0 - 0.1)</h5>
                                        <p>
                                            <strong>What it does:</strong> Prevents the algorithm from overfitting by penalizing
                                            extreme coefficients. It's like adding "common sense" to prevent the model from
                                            making wild decisions based on outliers.
                                        </p>
                                        <p>
                                            <strong>No regularization (0):</strong> The algorithm tries to fit the data perfectly,
                                            which can lead to overfitting. Good for clean, well-separated data.
                                        </p>
                                        <p>
                                            <strong>High regularization (0.05-0.1):</strong> The algorithm is more conservative,
                                            creating smoother decision boundaries that ignore outliers. Good for noisy data.
                                        </p>
                                        <p>
                                            <strong>Sweet spot (0.001-0.01):</strong> A small amount of regularization that
                                            prevents overfitting without being too conservative.
                                        </p>
                                        <p>
                                            <strong>Try this:</strong> With the "Noisy Data" dataset, try increasing regularization
                                            from 0 to 0.05 and watch how the decision boundary becomes smoother and ignores outliers.
                                        </p>
                                    </div>
                                </div>

                                <div className="parameter-interaction">
                                    <h5>How Parameters Work Together</h5>
                                    <p>
                                        These parameters interact in complex ways. Here's how to think about tuning them:
                                    </p>
                                    <ul>
                                        <li><strong>Start with defaults:</strong> Learning rate 0.1, iterations 100, regularization 0</li>
                                        <li><strong>If accuracy is low:</strong> Try more iterations first, then adjust learning rate</li>
                                        <li><strong>If boundary is too wiggly:</strong> Increase regularization</li>
                                        <li><strong>If learning is too slow:</strong> Increase learning rate (but not too much!)</li>
                                        <li><strong>If boundary jumps around:</strong> Decrease learning rate</li>
                                    </ul>
                                </div>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Medical Diagnosis:</strong> Predicting disease presence based on symptoms and test results</li>
                                    <li><strong>Marketing:</strong> Predicting customer purchase behavior and targeting campaigns</li>
                                    <li><strong>Finance:</strong> Credit risk assessment and loan approval decisions</li>
                                    <li><strong>Email Filtering:</strong> Spam detection and email classification</li>
                                    <li><strong>Image Recognition:</strong> Object detection and image classification</li>
                                </ul>

                                <h4>When to Use Logistic Regression</h4>
                                <ul>
                                    <li><strong>Binary outcomes:</strong> When you need to predict one of two classes</li>
                                    <li><strong>Linear relationships:</strong> When features have linear relationships with the outcome</li>
                                    <li><strong>Interpretability:</strong> When you need to understand which features matter most</li>
                                    <li><strong>Baseline model:</strong> As a starting point for more complex algorithms</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {selectedDataset === 'medical' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Medical Diagnosis Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding the Medical Dataset</h4>
                                    <p>
                                        This dataset simulates a medical diagnosis scenario where we're trying to predict
                                        disease presence based on patient age and test results. In healthcare, early
                                        detection is crucial, and logistic regression helps identify patients at risk
                                        based on multiple factors.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>Age Factor</h5>
                                            <p>
                                                Generally, older patients are more likely to have the disease, but age
                                                alone isn't sufficient. The test score provides additional diagnostic information.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Test Score Impact</h5>
                                            <p>
                                                Lower test scores combined with higher age create higher risk profiles.
                                                The decision boundary shows the optimal combination for diagnosis.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Clinical Decision Making</h5>
                                            <p>
                                                The model helps doctors make informed decisions about which patients
                                                need further testing or immediate treatment based on risk factors.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Healthcare Applications</h4>
                                        <ul>
                                            <li><strong>Diagnostic Support:</strong> Assist doctors in making faster, more accurate diagnoses</li>
                                            <li><strong>Risk Stratification:</strong> Identify high-risk patients for priority care</li>
                                            <li><strong>Resource Allocation:</strong> Optimize hospital resources based on patient risk</li>
                                            <li><strong>Preventive Care:</strong> Target interventions for at-risk populations</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'marketing' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Marketing Campaign Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding the Marketing Dataset</h4>
                                    <p>
                                        This dataset represents a marketing campaign where we're trying to predict
                                        customer purchase behavior based on age and income. Understanding customer
                                        segments helps businesses target their marketing efforts more effectively
                                        and improve return on investment.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>Demographic Targeting</h5>
                                            <p>
                                                Younger customers with lower income are less likely to purchase,
                                                while older customers with higher income show higher purchase probability.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Customer Segmentation</h5>
                                            <p>
                                                The decision boundary helps identify distinct customer segments
                                                for targeted marketing campaigns and personalized offers.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Campaign Optimization</h5>
                                            <p>
                                                By understanding which customers are likely to purchase, businesses
                                                can optimize their marketing spend and improve campaign effectiveness.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Marketing Applications</h4>
                                        <ul>
                                            <li><strong>Customer Targeting:</strong> Focus marketing efforts on high-probability customers</li>
                                            <li><strong>Budget Allocation:</strong> Optimize marketing spend across different customer segments</li>
                                            <li><strong>Product Development:</strong> Understand customer preferences for product design</li>
                                            <li><strong>Pricing Strategy:</strong> Set prices based on customer willingness to pay</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'finance' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Credit Risk Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding the Finance Dataset</h4>
                                    <p>
                                        This dataset simulates credit risk assessment where we're trying to predict
                                        loan default risk based on credit score and debt-to-income ratio. Financial
                                        institutions use such models to make informed lending decisions and manage risk.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>Credit Score Importance</h5>
                                            <p>
                                                Higher credit scores generally indicate lower default risk, but the
                                                relationship isn't linear. Other factors like debt ratio also matter.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Debt Ratio Impact</h5>
                                            <p>
                                                Lower debt ratios combined with higher credit scores create the safest
                                                borrower profiles. The decision boundary shows optimal risk thresholds.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Risk Management</h5>
                                            <p>
                                                The model helps lenders balance risk and opportunity by identifying
                                                which applicants are likely to repay their loans successfully.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Financial Applications</h4>
                                        <ul>
                                            <li><strong>Loan Approval:</strong> Automated decision-making for loan applications</li>
                                            <li><strong>Risk Assessment:</strong> Quantify and manage credit risk exposure</li>
                                            <li><strong>Interest Rate Setting:</strong> Adjust rates based on borrower risk profiles</li>
                                            <li><strong>Portfolio Management:</strong> Balance high-risk and low-risk loans</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'overlapping' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Overlapping Classes Challenge</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding the Overlapping Dataset</h4>
                                    <p>
                                        This dataset presents a realistic challenge where classes overlap in the feature space.
                                        Unlike the clean, well-separated datasets, this one forces students to understand
                                        the limitations of linear decision boundaries and the importance of algorithm parameters.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>Decision Boundary Challenges</h5>
                                            <p>
                                                With overlapping classes, the algorithm struggles to find a single line
                                                that perfectly separates the classes. Students must experiment with
                                                learning rate and iterations to find the best compromise.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Parameter Sensitivity</h5>
                                            <p>
                                                This dataset is highly sensitive to learning rate and regularization.
                                                Students learn that algorithm parameters matter more when data is challenging.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Real-World Relevance</h5>
                                            <p>
                                                Most real-world classification problems have some degree of overlap.
                                                This dataset teaches students about the practical challenges of machine learning.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Learning Objectives</h4>
                                        <ul>
                                            <li><strong>Parameter Tuning:</strong> Learn how learning rate affects convergence</li>
                                            <li><strong>Regularization:</strong> Understand when and why to use regularization</li>
                                            <li><strong>Model Limitations:</strong> See when linear boundaries fail</li>
                                            <li><strong>Algorithm Robustness:</strong> Test how well the algorithm handles difficult data</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'noisy' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Noisy Data Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="dataset-analysis">
                                    <h4>Understanding the Noisy Dataset</h4>
                                    <p>
                                        This dataset simulates real-world data with noise, outliers, and borderline cases.
                                        It teaches students about data quality issues and the importance of regularization
                                        in preventing overfitting to noisy data points.
                                    </p>

                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>Outlier Impact</h5>
                                            <p>
                                                Notice how outliers (like the high-scoring student with few study hours)
                                                can pull the decision boundary in unexpected directions. This demonstrates
                                                why data cleaning is crucial.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Regularization Benefits</h5>
                                            <p>
                                                Try increasing regularization to see how it helps the model ignore outliers
                                                and focus on the general pattern. This teaches the importance of preventing overfitting.
                                            </p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>Borderline Cases</h5>
                                            <p>
                                                The borderline cases (students with moderate scores and study hours) show
                                                how the algorithm makes difficult decisions when data is ambiguous.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="business-applications">
                                        <h4>Real-World Applications</h4>
                                        <ul>
                                            <li><strong>Data Quality:</strong> Understand the impact of noisy data on model performance</li>
                                            <li><strong>Regularization:</strong> Learn to prevent overfitting with proper regularization</li>
                                            <li><strong>Model Robustness:</strong> Test how well models handle real-world data issues</li>
                                            <li><strong>Parameter Tuning:</strong> Practice adjusting parameters for challenging datasets</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Limitations and Best Practices</h3>
                        </div>
                        <div className="card-body">
                            <div className="limitations-content">
                                <h4>When Logistic Regression Works Well</h4>
                                <ul>
                                    <li><strong>Linear decision boundaries:</strong> When classes can be separated by a straight line</li>
                                    <li><strong>Binary classification:</strong> Problems with exactly two possible outcomes</li>
                                    <li><strong>Independent features:</strong> When input variables don't strongly correlate</li>
                                    <li><strong>Large sample sizes:</strong> When you have sufficient training data</li>
                                </ul>

                                <h4>Common Limitations</h4>
                                <ul>
                                    <li><strong>Non-linear relationships:</strong> Can't capture complex curved decision boundaries</li>
                                    <li><strong>Feature interactions:</strong> Doesn't automatically detect feature combinations</li>
                                    <li><strong>Outliers:</strong> Extreme values can significantly affect the model</li>
                                    <li><strong>Imbalanced data:</strong> Performs poorly when one class is much more common</li>
                                </ul>

                                <h4>Best Practices</h4>
                                <ul>
                                    <li><strong>Feature scaling:</strong> Normalize features to similar scales</li>
                                    <li><strong>Handle missing data:</strong> Impute or remove incomplete records</li>
                                    <li><strong>Cross-validation:</strong> Test on multiple data splits to avoid overfitting</li>
                                    <li><strong>Regularization:</strong> Use L1/L2 regularization to prevent overfitting</li>
                                    <li><strong>Feature selection:</strong> Remove irrelevant or redundant features</li>
                                </ul>

                                <h4>Alternative Approaches</h4>
                                <ul>
                                    <li><strong>Support Vector Machines:</strong> For non-linear decision boundaries</li>
                                    <li><strong>Random Forest:</strong> For handling feature interactions and non-linear relationships</li>
                                    <li><strong>Neural Networks:</strong> For complex patterns and high-dimensional data</li>
                                    <li><strong>Naive Bayes:</strong> For text classification and when features are independent</li>
                                </ul>
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

export default LogisticRegression;
