import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './DecisionTree.css';

interface DataPoint {
    id: string;
    features: { [key: string]: number };
    label: string;
    color: string;
}

interface TreeNode {
    id: string;
    feature?: string;
    threshold?: number;
    label?: string;
    samples: number;
    children: TreeNode[];
    depth: number;
    x?: number;
    y?: number;
}

interface Dataset {
    name: string;
    description: string;
    features: string[];
    data: DataPoint[];
    targetFeature: string;
}

const DecisionTree: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedDataset, setSelectedDataset] = useState<string>('churn');
    const [maxDepth, setMaxDepth] = useState<number>(4);
    const [minSamplesSplit, setMinSamplesSplit] = useState<number>(3);
    const [minSamplesLeaf, setMinSamplesLeaf] = useState<number>(2);
    const [tree, setTree] = useState<TreeNode | null>(null);
    const [accuracy, setAccuracy] = useState<number>(0);

    // Sample datasets
    const datasets: { [key: string]: Dataset } = {
        churn: {
            name: 'Customer Churn Prediction',
            description: 'Complex dataset with 5 features and overlapping patterns for deep trees',
            features: ['tenure_months', 'monthly_charges', 'total_charges', 'contract_type', 'internet_service'],
            targetFeature: 'churned',
            data: [
                // Long tenure, low charges - mostly stay
                { id: '1', features: { tenure_months: 60, monthly_charges: 20, total_charges: 1200, contract_type: 2, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '2', features: { tenure_months: 48, monthly_charges: 25, total_charges: 1200, contract_type: 2, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '3', features: { tenure_months: 72, monthly_charges: 18, total_charges: 1296, contract_type: 2, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '4', features: { tenure_months: 36, monthly_charges: 30, total_charges: 1080, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '5', features: { tenure_months: 24, monthly_charges: 35, total_charges: 840, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },

                // Short tenure, high charges - mostly churn
                { id: '6', features: { tenure_months: 3, monthly_charges: 80, total_charges: 240, contract_type: 0, internet_service: 3 }, label: 'Churn', color: '#ef4444' },
                { id: '7', features: { tenure_months: 6, monthly_charges: 75, total_charges: 450, contract_type: 0, internet_service: 3 }, label: 'Churn', color: '#ef4444' },
                { id: '8', features: { tenure_months: 1, monthly_charges: 90, total_charges: 90, contract_type: 0, internet_service: 3 }, label: 'Churn', color: '#ef4444' },
                { id: '9', features: { tenure_months: 2, monthly_charges: 85, total_charges: 170, contract_type: 0, internet_service: 3 }, label: 'Churn', color: '#ef4444' },
                { id: '10', features: { tenure_months: 4, monthly_charges: 78, total_charges: 312, contract_type: 0, internet_service: 3 }, label: 'Churn', color: '#ef4444' },

                // Medium tenure, medium charges - mixed results
                { id: '11', features: { tenure_months: 12, monthly_charges: 50, total_charges: 600, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '12', features: { tenure_months: 15, monthly_charges: 55, total_charges: 825, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '13', features: { tenure_months: 18, monthly_charges: 60, total_charges: 1080, contract_type: 1, internet_service: 2 }, label: 'Churn', color: '#ef4444' },
                { id: '14', features: { tenure_months: 9, monthly_charges: 65, total_charges: 585, contract_type: 0, internet_service: 3 }, label: 'Churn', color: '#ef4444' },
                { id: '15', features: { tenure_months: 21, monthly_charges: 45, total_charges: 945, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },

                // Long tenure, high charges - mixed (loyalty vs cost)
                { id: '16', features: { tenure_months: 30, monthly_charges: 70, total_charges: 2100, contract_type: 2, internet_service: 3 }, label: 'Stay', color: '#10b981' },
                { id: '17', features: { tenure_months: 42, monthly_charges: 75, total_charges: 3150, contract_type: 2, internet_service: 3 }, label: 'Churn', color: '#ef4444' },
                { id: '18', features: { tenure_months: 54, monthly_charges: 68, total_charges: 3672, contract_type: 2, internet_service: 3 }, label: 'Stay', color: '#10b981' },
                { id: '19', features: { tenure_months: 66, monthly_charges: 72, total_charges: 4752, contract_type: 2, internet_service: 3 }, label: 'Churn', color: '#ef4444' },
                { id: '20', features: { tenure_months: 78, monthly_charges: 65, total_charges: 5070, contract_type: 2, internet_service: 3 }, label: 'Stay', color: '#10b981' },

                // Short tenure, low charges - mixed (new customers)
                { id: '21', features: { tenure_months: 5, monthly_charges: 30, total_charges: 150, contract_type: 0, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '22', features: { tenure_months: 7, monthly_charges: 35, total_charges: 245, contract_type: 0, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '23', features: { tenure_months: 4, monthly_charges: 40, total_charges: 160, contract_type: 0, internet_service: 2 }, label: 'Churn', color: '#ef4444' },
                { id: '24', features: { tenure_months: 8, monthly_charges: 25, total_charges: 200, contract_type: 0, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '25', features: { tenure_months: 6, monthly_charges: 45, total_charges: 270, contract_type: 0, internet_service: 2 }, label: 'Churn', color: '#ef4444' },

                // More complex overlapping cases
                { id: '26', features: { tenure_months: 14, monthly_charges: 55, total_charges: 770, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '27', features: { tenure_months: 16, monthly_charges: 58, total_charges: 928, contract_type: 1, internet_service: 2 }, label: 'Churn', color: '#ef4444' },
                { id: '28', features: { tenure_months: 20, monthly_charges: 52, total_charges: 1040, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '29', features: { tenure_months: 22, monthly_charges: 48, total_charges: 1056, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '30', features: { tenure_months: 26, monthly_charges: 62, total_charges: 1612, contract_type: 1, internet_service: 2 }, label: 'Churn', color: '#ef4444' },

                // Edge cases for maximum complexity
                { id: '31', features: { tenure_months: 10, monthly_charges: 42, total_charges: 420, contract_type: 0, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '32', features: { tenure_months: 11, monthly_charges: 38, total_charges: 418, contract_type: 0, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '33', features: { tenure_months: 13, monthly_charges: 44, total_charges: 572, contract_type: 0, internet_service: 2 }, label: 'Churn', color: '#ef4444' },
                { id: '34', features: { tenure_months: 17, monthly_charges: 46, total_charges: 782, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '35', features: { tenure_months: 19, monthly_charges: 49, total_charges: 931, contract_type: 1, internet_service: 2 }, label: 'Churn', color: '#ef4444' },

                // More data points for deeper trees
                { id: '36', features: { tenure_months: 25, monthly_charges: 51, total_charges: 1275, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '37', features: { tenure_months: 28, monthly_charges: 47, total_charges: 1316, contract_type: 1, internet_service: 2 }, label: 'Stay', color: '#10b981' },
                { id: '38', features: { tenure_months: 32, monthly_charges: 53, total_charges: 1696, contract_type: 1, internet_service: 2 }, label: 'Churn', color: '#ef4444' },
                { id: '39', features: { tenure_months: 35, monthly_charges: 56, total_charges: 1960, contract_type: 2, internet_service: 3 }, label: 'Stay', color: '#10b981' },
                { id: '40', features: { tenure_months: 38, monthly_charges: 59, total_charges: 2242, contract_type: 2, internet_service: 3 }, label: 'Churn', color: '#ef4444' },

                // Additional complexity
                { id: '41', features: { tenure_months: 40, monthly_charges: 41, total_charges: 1640, contract_type: 2, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '42', features: { tenure_months: 44, monthly_charges: 43, total_charges: 1892, contract_type: 2, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '43', features: { tenure_months: 47, monthly_charges: 45, total_charges: 2115, contract_type: 2, internet_service: 2 }, label: 'Churn', color: '#ef4444' },
                { id: '44', features: { tenure_months: 50, monthly_charges: 39, total_charges: 1950, contract_type: 2, internet_service: 1 }, label: 'Stay', color: '#10b981' },
                { id: '45', features: { tenure_months: 52, monthly_charges: 37, total_charges: 1924, contract_type: 2, internet_service: 1 }, label: 'Stay', color: '#10b981' }
            ]
        },
        iris: {
            name: 'Iris Dataset',
            description: 'Classic flower classification dataset with 4 features',
            features: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
            targetFeature: 'species',
            data: [
                { id: '1', features: { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 }, label: 'Setosa', color: '#10b981' },
                { id: '2', features: { sepal_length: 4.9, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.2 }, label: 'Setosa', color: '#10b981' },
                { id: '3', features: { sepal_length: 4.7, sepal_width: 3.2, petal_length: 1.3, petal_width: 0.2 }, label: 'Setosa', color: '#10b981' },
                { id: '4', features: { sepal_length: 4.6, sepal_width: 3.1, petal_length: 1.5, petal_width: 0.2 }, label: 'Setosa', color: '#10b981' },
                { id: '5', features: { sepal_length: 5.0, sepal_width: 3.6, petal_length: 1.4, petal_width: 0.2 }, label: 'Setosa', color: '#10b981' },
                { id: '6', features: { sepal_length: 7.0, sepal_width: 3.2, petal_length: 4.7, petal_width: 1.4 }, label: 'Versicolor', color: '#f59e0b' },
                { id: '7', features: { sepal_length: 6.4, sepal_width: 3.2, petal_length: 4.5, petal_width: 1.5 }, label: 'Versicolor', color: '#f59e0b' },
                { id: '8', features: { sepal_length: 6.9, sepal_width: 3.1, petal_length: 4.9, petal_width: 1.5 }, label: 'Versicolor', color: '#f59e0b' },
                { id: '9', features: { sepal_length: 5.5, sepal_width: 2.3, petal_length: 4.0, petal_width: 1.3 }, label: 'Versicolor', color: '#f59e0b' },
                { id: '10', features: { sepal_length: 6.5, sepal_width: 2.8, petal_length: 4.6, petal_width: 1.5 }, label: 'Versicolor', color: '#f59e0b' },
                { id: '11', features: { sepal_length: 6.3, sepal_width: 3.3, petal_length: 6.0, petal_width: 2.5 }, label: 'Virginica', color: '#ef4444' },
                { id: '12', features: { sepal_length: 5.8, sepal_width: 2.7, petal_length: 5.1, petal_width: 1.9 }, label: 'Virginica', color: '#ef4444' },
                { id: '13', features: { sepal_length: 7.1, sepal_width: 3.0, petal_length: 5.9, petal_width: 2.1 }, label: 'Virginica', color: '#ef4444' },
                { id: '14', features: { sepal_length: 6.3, sepal_width: 2.9, petal_length: 5.6, petal_width: 1.8 }, label: 'Virginica', color: '#ef4444' },
                { id: '15', features: { sepal_length: 6.5, sepal_width: 3.0, petal_length: 5.8, petal_width: 2.2 }, label: 'Virginica', color: '#ef4444' }
            ]
        }
    };

    // Calculate entropy
    const calculateEntropy = (data: DataPoint[]): number => {
        if (data.length === 0) return 0;

        const labelCounts: { [key: string]: number } = {};
        data.forEach(point => {
            labelCounts[point.label] = (labelCounts[point.label] || 0) + 1;
        });

        let entropy = 0;
        Object.values(labelCounts).forEach(count => {
            const probability = count / data.length;
            entropy -= probability * Math.log2(probability);
        });

        return entropy;
    };

    // Calculate information gain
    const calculateInformationGain = (data: DataPoint[], feature: string, threshold: number): number => {
        const parentEntropy = calculateEntropy(data);

        const leftData = data.filter(point => point.features[feature] <= threshold);
        const rightData = data.filter(point => point.features[feature] > threshold);

        const leftEntropy = calculateEntropy(leftData);
        const rightEntropy = calculateEntropy(rightData);

        const leftWeight = leftData.length / data.length;
        const rightWeight = rightData.length / data.length;

        const weightedEntropy = leftWeight * leftEntropy + rightWeight * rightEntropy;

        return parentEntropy - weightedEntropy;
    };

    // Find best split
    const findBestSplit = (data: DataPoint[], features: string[]): { feature: string; threshold: number; gain: number } | null => {
        let bestGain = 0;
        let bestSplit: { feature: string; threshold: number; gain: number } | null = null;

        features.forEach(feature => {
            const values = data.map(point => point.features[feature]).sort((a, b) => a - b);

            for (let i = 0; i < values.length - 1; i++) {
                const threshold = (values[i] + values[i + 1]) / 2;
                const gain = calculateInformationGain(data, feature, threshold);

                if (gain > bestGain) {
                    bestGain = gain;
                    bestSplit = { feature, threshold, gain };
                }
            }
        });

        return bestSplit;
    };

    // Build decision tree
    const buildTree = (data: DataPoint[], features: string[], depth: number = 0, maxDepthParam: number = maxDepth, minSamplesSplitParam: number = minSamplesSplit, minSamplesLeafParam: number = minSamplesLeaf): TreeNode => {
        const uniqueLabels = [...new Set(data.map(point => point.label))];

        // Base cases for stopping
        if (depth >= maxDepthParam || uniqueLabels.length === 1) {
            const labelCounts: { [key: string]: number } = {};
            data.forEach(point => {
                labelCounts[point.label] = (labelCounts[point.label] || 0) + 1;
            });

            const majorityLabel = Object.keys(labelCounts).reduce((a, b) =>
                labelCounts[a] > labelCounts[b] ? a : b
            );

            return {
                id: `leaf_${Math.random().toString(36).substr(2, 9)}`,
                label: majorityLabel,
                samples: data.length,
                children: [],
                depth
            };
        }

        // Check if we have enough samples to split
        if (data.length < minSamplesSplitParam) {
            const labelCounts: { [key: string]: number } = {};
            data.forEach(point => {
                labelCounts[point.label] = (labelCounts[point.label] || 0) + 1;
            });

            const majorityLabel = Object.keys(labelCounts).reduce((a, b) =>
                labelCounts[a] > labelCounts[b] ? a : b
            );

            return {
                id: `leaf_${Math.random().toString(36).substr(2, 9)}`,
                label: majorityLabel,
                samples: data.length,
                children: [],
                depth
            };
        }

        const bestSplit = findBestSplit(data, features);

        if (!bestSplit || bestSplit.gain <= 0) {
            const labelCounts: { [key: string]: number } = {};
            data.forEach(point => {
                labelCounts[point.label] = (labelCounts[point.label] || 0) + 1;
            });

            const majorityLabel = Object.keys(labelCounts).reduce((a, b) =>
                labelCounts[a] > labelCounts[b] ? a : b
            );

            return {
                id: `leaf_${Math.random().toString(36).substr(2, 9)}`,
                label: majorityLabel,
                samples: data.length,
                children: [],
                depth
            };
        }

        const leftData = data.filter(point => point.features[bestSplit.feature] <= bestSplit.threshold);
        const rightData = data.filter(point => point.features[bestSplit.feature] > bestSplit.threshold);

        // Check if split would create leaves with too few samples
        if (leftData.length < minSamplesLeafParam || rightData.length < minSamplesLeafParam) {
            const labelCounts: { [key: string]: number } = {};
            data.forEach(point => {
                labelCounts[point.label] = (labelCounts[point.label] || 0) + 1;
            });

            const majorityLabel = Object.keys(labelCounts).reduce((a, b) =>
                labelCounts[a] > labelCounts[b] ? a : b
            );

            return {
                id: `leaf_${Math.random().toString(36).substr(2, 9)}`,
                label: majorityLabel,
                samples: data.length,
                children: [],
                depth
            };
        }

        const node: TreeNode = {
            id: `node_${Math.random().toString(36).substr(2, 9)}`,
            feature: bestSplit.feature,
            threshold: bestSplit.threshold,
            samples: data.length,
            children: [],
            depth
        };

        node.children.push(buildTree(leftData, features, depth + 1, maxDepthParam, minSamplesSplitParam, minSamplesLeafParam));
        node.children.push(buildTree(rightData, features, depth + 1, maxDepthParam, minSamplesSplitParam, minSamplesLeafParam));

        return node;
    };

    // Calculate accuracy
    const calculateAccuracy = (data: DataPoint[], tree: TreeNode): number => {
        let correct = 0;

        data.forEach(point => {
            const prediction = predict(point, tree);
            if (prediction === point.label) {
                correct++;
            }
        });

        return correct / data.length;
    };

    // Predict using tree
    const predict = (point: DataPoint, node: TreeNode): string => {
        if (node.label) {
            return node.label;
        }

        if (node.feature && node.threshold !== undefined) {
            if (point.features[node.feature] <= node.threshold) {
                return predict(point, node.children[0]);
            } else {
                return predict(point, node.children[1]);
            }
        }

        return 'unknown';
    };

    // Build tree when parameters change
    useEffect(() => {
        const dataset = datasets[selectedDataset];
        if (dataset) {
            console.log('Rebuilding tree with parameters:', {
                dataset: selectedDataset,
                maxDepth,
                minSamplesSplit,
                minSamplesLeaf,
                dataLength: dataset.data.length
            });

            // Build tree with current parameters
            const newTree = buildTree(dataset.data, dataset.features, 0, maxDepth, minSamplesSplit, minSamplesLeaf);
            setTree(newTree);

            const newAccuracy = calculateAccuracy(dataset.data, newTree);
            setAccuracy(newAccuracy);

            console.log('Tree rebuilt:', {
                totalNodes: countNodes(newTree),
                leafNodes: countLeaves(newTree),
                maxDepth: getMaxDepth(newTree),
                accuracy: newAccuracy
            });
        }
    }, [selectedDataset, maxDepth, minSamplesSplit, minSamplesLeaf]);

    // Draw tree visualization
    useEffect(() => {
        if (!tree || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const containerWidth = 800;
        const containerHeight = 600;
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };

        // Create main SVG
        svg
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("border", "1px solid #e5e7eb")
            .style("border-radius", "8px")
            .style("background", "white");

        // Create zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 5])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Create main group for zooming
        const g = svg.append("g");

        // Convert our tree to d3 hierarchy format
        const root = d3.hierarchy(tree);

        // Calculate tree dimensions
        const treeLayout = d3.tree<TreeNode>()
            .size([containerWidth - margin.left - margin.right, containerHeight - margin.top - margin.bottom]);

        treeLayout(root);

        // Get tree bounds for auto-scaling
        const nodes = root.descendants();
        const minX = Math.min(...nodes.map(d => d.x || 0));
        const maxX = Math.max(...nodes.map(d => d.x || 0));
        const minY = Math.min(...nodes.map(d => d.y || 0));
        const maxY = Math.max(...nodes.map(d => d.y || 0));

        const treeWidth = maxX - minX;
        const treeHeight = maxY - minY;

        // Calculate scale to fit tree in viewport
        const scaleX = (containerWidth - margin.left - margin.right) / (treeWidth + 100);
        const scaleY = (containerHeight - margin.top - margin.bottom) / (treeHeight + 100);
        const scale = Math.min(scaleX, scaleY, 1);

        // Center the tree
        const translateX = (containerWidth - (maxX + minX) * scale) / 2;
        const translateY = (containerHeight - (maxY + minY) * scale) / 2;

        // Apply initial transform
        g.attr("transform", `translate(${translateX}, ${translateY}) scale(${scale})`);

        // Draw links
        g.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical<any, any>()
                .x(d => d.x)
                .y(d => d.y))
            .style('fill', 'none')
            .style('stroke', '#6b7280')
            .style('stroke-width', '3px');

        // Draw nodes
        const nodeGroups = g.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        // Add circles for nodes
        nodeGroups.append('circle')
            .attr('r', 25)
            .style('fill', d => d.data.label ? '#ef4444' : '#06b6d4')
            .style('stroke', '#374151')
            .style('stroke-width', '3px')
            .style('cursor', 'pointer');

        // Add main label text for nodes
        nodeGroups.append('text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
            .text(d => {
                if (d.data.label) {
                    return d.data.label.substring(0, 4);
                } else if (d.data.feature) {
                    return d.data.feature.substring(0, 4);
                }
                return '';
            });

        // Add feature/threshold info below nodes
        nodeGroups.append('text')
            .attr('dy', '2.2em')
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('fill', '#374151')
            .style('background', 'rgba(255,255,255,0.8)')
            .style('padding', '2px 4px')
            .style('border-radius', '4px')
            .text(d => {
                if (d.data.feature && d.data.threshold !== undefined) {
                    return `${d.data.feature} ≤ ${d.data.threshold.toFixed(1)}`;
                }
                return '';
            });

        // Add sample count info
        nodeGroups.append('text')
            .attr('dy', '3.5em')
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#6b7280')
            .style('font-weight', '500')
            .text(d => `n=${d.data.samples}`);

        // Add zoom controls
        const controls = svg.append('g')
            .attr('class', 'zoom-controls')
            .attr('transform', `translate(${containerWidth - 120}, 20)`);

        // Zoom in button
        controls.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 30)
            .attr('height', 30)
            .attr('rx', 4)
            .style('fill', '#f3f4f6')
            .style('stroke', '#d1d5db')
            .style('cursor', 'pointer')
            .on('click', () => {
                svg.transition().duration(300).call(zoom.scaleBy, 1.5);
            });

        controls.append('text')
            .attr('x', 15)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('+');

        // Zoom out button
        controls.append('rect')
            .attr('x', 40)
            .attr('y', 0)
            .attr('width', 30)
            .attr('height', 30)
            .attr('rx', 4)
            .style('fill', '#f3f4f6')
            .style('stroke', '#d1d5db')
            .style('cursor', 'pointer')
            .on('click', () => {
                svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.5);
            });

        controls.append('text')
            .attr('x', 55)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('−');

        // Reset zoom button
        controls.append('rect')
            .attr('x', 80)
            .attr('y', 0)
            .attr('width', 30)
            .attr('height', 30)
            .attr('rx', 4)
            .style('fill', '#f3f4f6')
            .style('stroke', '#d1d5db')
            .style('cursor', 'pointer')
            .on('click', () => {
                svg.transition().duration(300).call(
                    zoom.transform,
                    d3.zoomIdentity.translate(translateX, translateY).scale(scale)
                );
            });

        controls.append('text')
            .attr('x', 95)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('⌂');

    }, [tree]);

    return (
        <div className="decision-tree fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Decision Tree Builder</h1>
                    <p className="page-description">
                        Build and visualize decision trees interactively. See how the algorithm makes
                        splitting decisions based on information gain and entropy.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Decision Tree Visualization</h2>
                            <div className="tree-stats">
                                <span className="stat">Accuracy: {(accuracy * 100).toFixed(1)}%</span>
                                <span className="stat">Samples: {datasets[selectedDataset]?.data.length || 0}</span>
                            </div>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="tree-svg"></svg>
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
                                        <option value="churn">Customer Churn Prediction</option>
                                        <option value="iris">Iris Dataset</option>
                                    </select>
                                    <p className="dataset-description">
                                        {datasets[selectedDataset]?.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Tree Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Max Depth</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={maxDepth}
                                            onChange={(e) => {
                                                const newValue = parseInt(e.target.value);
                                                console.log('Max Depth changed:', newValue);
                                                setMaxDepth(newValue);
                                            }}
                                            className="slider"
                                        />
                                        <span className="value-display">{maxDepth}</span>
                                        <small className="parameter-help">Maximum number of levels in the tree</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Min Samples Split</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="15"
                                            value={minSamplesSplit}
                                            onChange={(e) => {
                                                const newValue = parseInt(e.target.value);
                                                console.log('Min Samples Split changed:', newValue);
                                                setMinSamplesSplit(newValue);
                                            }}
                                            className="slider"
                                        />
                                        <span className="value-display">{minSamplesSplit}</span>
                                        <small className="parameter-help">Minimum samples required to create a split</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Min Samples Leaf</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={minSamplesLeaf}
                                            onChange={(e) => {
                                                const newValue = parseInt(e.target.value);
                                                console.log('Min Samples Leaf changed:', newValue);
                                                setMinSamplesLeaf(newValue);
                                            }}
                                            className="slider"
                                        />
                                        <span className="value-display">{minSamplesLeaf}</span>
                                        <small className="parameter-help">Minimum samples required in a leaf node</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Tree Information</h3>
                            </div>
                            <div className="card-body">
                                <div className="tree-info">
                                    <div className="info-item">
                                        <span className="info-label">Total Nodes:</span>
                                        <span className="info-value">{tree ? countNodes(tree) : 0}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Leaf Nodes:</span>
                                        <span className="info-value">{tree ? countLeaves(tree) : 0}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Max Depth:</span>
                                        <span className="info-value">{tree ? getMaxDepth(tree) : 0}</span>
                                    </div>
                                </div>
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
                                            <strong>Start with all data</strong>
                                            <p>Begin with all {datasets[selectedDataset]?.data.length} samples at the root</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Find best split</strong>
                                            <p>Calculate information gain for each feature to find the best split</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Create branches</strong>
                                            <p>Split data into left (≤ threshold) and right (&gt; threshold) branches</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">4</div>
                                        <div className="step-content">
                                            <strong>Repeat recursively</strong>
                                            <p>Continue splitting until stopping conditions are met</p>
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
                            <h3 className="card-title">Understanding Decision Trees</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>How Decision Trees Work</h4>
                                <p>
                                    Decision trees are a type of supervised learning algorithm that makes decisions by
                                    asking a series of yes/no questions about the input features. Each internal node
                                    represents a test on a feature, each branch represents the outcome of the test,
                                    and each leaf node represents a class label.
                                </p>

                                <h4>Key Concepts</h4>
                                <ul>
                                    <li><strong>Entropy:</strong> Measures the impurity or uncertainty in a dataset</li>
                                    <li><strong>Information Gain:</strong> Measures how much a feature reduces entropy</li>
                                    <li><strong>Gini Impurity:</strong> Alternative measure of impurity</li>
                                    <li><strong>Overfitting:</strong> When a tree becomes too complex and memorizes training data</li>
                                </ul>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Medical Diagnosis:</strong> Decision trees for symptom analysis</li>
                                    <li><strong>Credit Scoring:</strong> Loan approval decisions</li>
                                    <li><strong>Marketing:</strong> Customer segmentation and targeting</li>
                                    <li><strong>Quality Control:</strong> Manufacturing defect detection</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {selectedDataset === 'churn' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Customer Churn Prediction - Feature Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="feature-analysis">
                                    <h4>Dataset Features Explained</h4>
                                    <div className="features-grid">
                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Tenure Months</span>
                                                <span className="feature-range">1-78 months</span>
                                            </div>
                                            <p className="feature-description">
                                                How long the customer has been with the company. Longer tenure generally indicates
                                                higher loyalty and lower churn risk.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>Customers with 0-12 months tenure have highest churn risk</li>
                                                    <li>Customers with 24+ months tenure are more likely to stay</li>
                                                    <li>New customers (0-6 months) are most vulnerable to churn</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Monthly Charges</span>
                                                <span className="feature-range">$18-$90</span>
                                            </div>
                                            <p className="feature-description">
                                                The amount the customer pays each month for services. Higher charges can
                                                indicate premium services or potential price sensitivity.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>Very high charges ($70+) increase churn risk</li>
                                                    <li>Low charges ($20-40) indicate basic plans with lower churn</li>
                                                    <li>Medium charges ($40-60) show mixed patterns</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Total Charges</span>
                                                <span className="feature-range">$90-$5,070</span>
                                            </div>
                                            <p className="feature-description">
                                                The total amount the customer has paid over their entire tenure.
                                                Higher total charges indicate long-term value and investment.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>High total charges ($2000+) indicate loyal customers</li>
                                                    <li>Low total charges ($500-) suggest new or at-risk customers</li>
                                                    <li>Combines tenure and monthly charges for overall value</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Contract Type</span>
                                                <span className="feature-range">0, 1, 2 years</span>
                                            </div>
                                            <p className="feature-description">
                                                The length of the customer's contract commitment. Longer contracts
                                                typically reduce churn due to early termination fees.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>Month-to-month (0) contracts have highest churn risk</li>
                                                    <li>2-year contracts (2) have lowest churn risk</li>
                                                    <li>1-year contracts (1) show moderate churn risk</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Internet Service</span>
                                                <span className="feature-range">DSL, Fiber, None</span>
                                            </div>
                                            <p className="feature-description">
                                                The type of internet service the customer has. Different service types
                                                have different reliability and satisfaction levels.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>No internet service (3) often indicates basic plans</li>
                                                    <li>Fiber optic (2) customers may have higher expectations</li>
                                                    <li>DSL (1) customers show mixed churn patterns</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="decision-process">
                                        <h4>How the Decision Tree Makes Predictions</h4>
                                        <div className="process-steps">
                                            <div className="process-step">
                                                <div className="step-number">1</div>
                                                <div className="step-content">
                                                    <strong>Feature Selection</strong>
                                                    <p>The algorithm evaluates each feature to find the one that best separates customers who churn from those who stay.</p>
                                                </div>
                                            </div>
                                            <div className="process-step">
                                                <div className="step-number">2</div>
                                                <div className="step-content">
                                                    <strong>Threshold Finding</strong>
                                                    <p>For each feature, it finds the optimal threshold (e.g., "tenure ≤ 12 months") that maximizes information gain.</p>
                                                </div>
                                            </div>
                                            <div className="process-step">
                                                <div className="step-number">3</div>
                                                <div className="step-content">
                                                    <strong>Data Splitting</strong>
                                                    <p>The dataset is split into two groups based on the threshold, creating left and right branches.</p>
                                                </div>
                                            </div>
                                            <div className="process-step">
                                                <div className="step-number">4</div>
                                                <div className="step-content">
                                                    <strong>Recursive Building</strong>
                                                    <p>The process repeats for each branch until stopping conditions are met (max depth, min samples, etc.).</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="business-insights">
                                        <h4>Business Insights from the Tree</h4>
                                        <div className="insights-grid">
                                            <div className="insight-item">
                                                <h5>High-Risk Customers</h5>
                                                <p>Customers with short tenure, high monthly charges, and month-to-month contracts are most likely to churn.</p>
                                            </div>
                                            <div className="insight-item">
                                                <h5>Loyal Customers</h5>
                                                <p>Long-term customers with reasonable charges and longer contracts are most likely to stay.</p>
                                            </div>
                                            <div className="insight-item">
                                                <h5>Mixed Patterns</h5>
                                                <p>Medium-tenure customers show complex patterns that require multiple features to predict accurately.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedDataset === 'iris' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Iris Dataset - Feature Analysis</h3>
                            </div>
                            <div className="card-body">
                                <div className="feature-analysis">
                                    <h4>Dataset Features Explained</h4>
                                    <div className="features-grid">
                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Sepal Length</span>
                                                <span className="feature-range">4.6-7.1 cm</span>
                                            </div>
                                            <p className="feature-description">
                                                The length of the sepal (outer protective covering) of the iris flower.
                                                This is one of the most distinguishing features between species.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>Setosa flowers have the shortest sepals (4.6-5.0 cm)</li>
                                                    <li>Virginica flowers have the longest sepals (5.8-7.1 cm)</li>
                                                    <li>Versicolor flowers fall in the middle range (5.5-7.0 cm)</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Sepal Width</span>
                                                <span className="feature-range">2.3-3.6 cm</span>
                                            </div>
                                            <p className="feature-description">
                                                The width of the sepal. This feature shows less variation between species
                                                but still contributes to classification accuracy.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>Setosa flowers have the widest sepals (3.0-3.6 cm)</li>
                                                    <li>Versicolor and Virginica have narrower sepals (2.3-3.3 cm)</li>
                                                    <li>Less discriminative than sepal length</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Petal Length</span>
                                                <span className="feature-range">1.3-6.0 cm</span>
                                            </div>
                                            <p className="feature-description">
                                                The length of the petal (the colorful part of the flower). This is often
                                                the most important feature for distinguishing iris species.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>Setosa flowers have very short petals (1.3-1.5 cm)</li>
                                                    <li>Versicolor flowers have medium petals (4.0-4.9 cm)</li>
                                                    <li>Virginica flowers have the longest petals (5.1-6.0 cm)</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="feature-item">
                                            <div className="feature-header">
                                                <span className="feature-name">Petal Width</span>
                                                <span className="feature-range">0.2-2.5 cm</span>
                                            </div>
                                            <p className="feature-description">
                                                The width of the petal. This feature shows the most dramatic differences
                                                between species and is highly discriminative.
                                            </p>
                                            <div className="feature-insights">
                                                <strong>Key Insights:</strong>
                                                <ul>
                                                    <li>Setosa flowers have very narrow petals (0.2 cm)</li>
                                                    <li>Versicolor flowers have medium-width petals (1.3-1.5 cm)</li>
                                                    <li>Virginica flowers have the widest petals (1.8-2.5 cm)</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="decision-process">
                                        <h4>How the Decision Tree Classifies Iris Flowers</h4>
                                        <div className="process-steps">
                                            <div className="process-step">
                                                <div className="step-number">1</div>
                                                <div className="step-content">
                                                    <strong>Feature Selection</strong>
                                                    <p>The algorithm evaluates each measurement to find the one that best separates the three iris species.</p>
                                                </div>
                                            </div>
                                            <div className="process-step">
                                                <div className="step-number">2</div>
                                                <div className="step-content">
                                                    <strong>Threshold Finding</strong>
                                                    <p>For each feature, it finds the optimal threshold (e.g., "petal length ≤ 2.0 cm") that maximizes information gain.</p>
                                                </div>
                                            </div>
                                            <div className="process-step">
                                                <div className="step-number">3</div>
                                                <div className="step-content">
                                                    <strong>Species Separation</strong>
                                                    <p>The tree creates branches that separate Setosa (easily distinguishable) from Versicolor and Virginica.</p>
                                                </div>
                                            </div>
                                            <div className="process-step">
                                                <div className="step-number">4</div>
                                                <div className="step-content">
                                                    <strong>Fine-Tuning</strong>
                                                    <p>Additional splits help distinguish between the more similar Versicolor and Virginica species.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="business-insights">
                                        <h4>Scientific Insights from the Tree</h4>
                                        <div className="insights-grid">
                                            <div className="insight-item">
                                                <h5>Setosa (Iris setosa)</h5>
                                                <p>Easily distinguishable with very short, narrow petals. Often separated in the first split of the tree.</p>
                                            </div>
                                            <div className="insight-item">
                                                <h5>Versicolor (Iris versicolor)</h5>
                                                <p>Medium-sized flowers that require multiple features to distinguish from Virginica.</p>
                                            </div>
                                            <div className="insight-item">
                                                <h5>Virginica (Iris virginica)</h5>
                                                <p>Largest flowers with the longest and widest petals, but can overlap with Versicolor.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="iris-context">
                                        <h4>About the Iris Dataset</h4>
                                        <p>
                                            The Iris dataset is one of the most famous datasets in machine learning, collected by
                                            British statistician and biologist Ronald Fisher in 1936. It contains measurements
                                            of 150 iris flowers from three species: Setosa, Versicolor, and Virginica. This dataset
                                            is perfect for learning classification algorithms because it has clear patterns but
                                            also some overlap between species, making it realistic for real-world applications.
                                        </p>
                                        <p>
                                            <strong>Why it's perfect for learning:</strong> The dataset is small enough to understand
                                            completely, has clear visual patterns, and demonstrates both easy separations (Setosa)
                                            and challenging ones (Versicolor vs Virginica). It's been used in machine learning
                                            education for decades because it perfectly illustrates the concepts of classification,
                                            feature importance, and decision boundaries.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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

// Helper functions
const countNodes = (node: TreeNode): number => {
    let count = 1;
    node.children.forEach(child => {
        count += countNodes(child);
    });
    return count;
};

const countLeaves = (node: TreeNode): number => {
    if (node.children.length === 0) {
        return 1;
    }
    let count = 0;
    node.children.forEach(child => {
        count += countLeaves(child);
    });
    return count;
};

const getMaxDepth = (node: TreeNode): number => {
    if (node.children.length === 0) {
        return node.depth;
    }
    return Math.max(...node.children.map(child => getMaxDepth(child)));
};

export default DecisionTree;
