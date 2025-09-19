import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './EuclideanDistance.css';
import type { DataPoint, DistanceCalculation, AlgorithmState, Dataset, DistanceMatrix, KNNResult, KMeansResult } from '../types/euclidean-types';

const EuclideanDistance: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Core state
    const [selectedDataset, setSelectedDataset] = useState<string>('iris');
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [selectedPoints, setSelectedPoints] = useState<DataPoint[]>([]);
    const [distances, setDistances] = useState<DistanceCalculation[]>([]);
    const [distanceMatrix, setDistanceMatrix] = useState<DistanceMatrix>({});

    // Algorithm state
    const [algorithmState, setAlgorithmState] = useState<AlgorithmState>({
        mode: 'explore',
        k: 3,
        centroids: [],
        assignments: {},
        selectedPoint: undefined
    });

    // UI state
    const [showGrid, setShowGrid] = useState(true);
    const [showDistances, setShowDistances] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [dimensions, setDimensions] = useState<{ width: number, height: number }>({ width: 800, height: 600 });

    // Results state
    const [knnResults, setKnnResults] = useState<KNNResult[]>([]);
    const [kmeansResults, setKmeansResults] = useState<KMeansResult | null>(null);

    // Sample datasets
    const datasets: { [key: string]: Dataset } = {
        iris: {
            name: 'Iris Dataset (2D Projection)',
            description: 'Classic machine learning dataset showing natural flower groupings',
            optimalK: 3,
            features: ['Petal Length', 'Petal Width'],
            data: [
                // Setosa
                { id: '1', x: 1.4, y: 0.2, label: 'Setosa', originalCluster: 0 },
                { id: '2', x: 1.4, y: 0.2, label: 'Setosa', originalCluster: 0 },
                { id: '3', x: 1.3, y: 0.2, label: 'Setosa', originalCluster: 0 },
                { id: '4', x: 1.5, y: 0.2, label: 'Setosa', originalCluster: 0 },
                { id: '5', x: 1.4, y: 0.2, label: 'Setosa', originalCluster: 0 },
                { id: '6', x: 1.7, y: 0.4, label: 'Setosa', originalCluster: 0 },
                { id: '7', x: 1.4, y: 0.3, label: 'Setosa', originalCluster: 0 },
                { id: '8', x: 1.5, y: 0.2, label: 'Setosa', originalCluster: 0 },
                { id: '9', x: 1.4, y: 0.2, label: 'Setosa', originalCluster: 0 },
                { id: '10', x: 1.5, y: 0.1, label: 'Setosa', originalCluster: 0 },

                // Versicolor
                { id: '11', x: 4.7, y: 1.4, label: 'Versicolor', originalCluster: 1 },
                { id: '12', x: 4.5, y: 1.5, label: 'Versicolor', originalCluster: 1 },
                { id: '13', x: 4.9, y: 1.5, label: 'Versicolor', originalCluster: 1 },
                { id: '14', x: 4.0, y: 1.3, label: 'Versicolor', originalCluster: 1 },
                { id: '15', x: 4.6, y: 1.5, label: 'Versicolor', originalCluster: 1 },
                { id: '16', x: 4.5, y: 1.3, label: 'Versicolor', originalCluster: 1 },
                { id: '17', x: 4.7, y: 1.6, label: 'Versicolor', originalCluster: 1 },
                { id: '18', x: 3.3, y: 1.0, label: 'Versicolor', originalCluster: 1 },
                { id: '19', x: 4.6, y: 1.3, label: 'Versicolor', originalCluster: 1 },
                { id: '20', x: 3.9, y: 1.4, label: 'Versicolor', originalCluster: 1 },

                // Virginica
                { id: '21', x: 6.0, y: 2.5, label: 'Virginica', originalCluster: 2 },
                { id: '22', x: 5.1, y: 1.9, label: 'Virginica', originalCluster: 2 },
                { id: '23', x: 5.9, y: 2.1, label: 'Virginica', originalCluster: 2 },
                { id: '24', x: 5.6, y: 1.8, label: 'Virginica', originalCluster: 2 },
                { id: '25', x: 5.8, y: 2.2, label: 'Virginica', originalCluster: 2 },
                { id: '26', x: 6.6, y: 2.1, label: 'Virginica', originalCluster: 2 },
                { id: '27', x: 4.5, y: 1.7, label: 'Virginica', originalCluster: 2 },
                { id: '28', x: 6.3, y: 1.8, label: 'Virginica', originalCluster: 2 },
                { id: '29', x: 5.8, y: 1.8, label: 'Virginica', originalCluster: 2 },
                { id: '30', x: 6.1, y: 2.5, label: 'Virginica', originalCluster: 2 }
            ]
        },
        customer: {
            name: 'Customer Segmentation',
            description: 'Customer data with age and spending patterns - perfect for market segmentation',
            optimalK: 4,
            features: ['Age', 'Spending Score'],
            data: [
                // Young High Spenders
                { id: '1', x: 25, y: 85, label: 'Young High Spender', originalCluster: 0 },
                { id: '2', x: 22, y: 90, label: 'Young High Spender', originalCluster: 0 },
                { id: '3', x: 28, y: 88, label: 'Young High Spender', originalCluster: 0 },
                { id: '4', x: 24, y: 92, label: 'Young High Spender', originalCluster: 0 },
                { id: '5', x: 26, y: 87, label: 'Young High Spender', originalCluster: 0 },

                // Young Low Spenders
                { id: '6', x: 24, y: 15, label: 'Young Low Spender', originalCluster: 1 },
                { id: '7', x: 26, y: 12, label: 'Young Low Spender', originalCluster: 1 },
                { id: '8', x: 23, y: 18, label: 'Young Low Spender', originalCluster: 1 },
                { id: '9', x: 25, y: 14, label: 'Young Low Spender', originalCluster: 1 },
                { id: '10', x: 27, y: 16, label: 'Young Low Spender', originalCluster: 1 },

                // Middle-aged High Spenders
                { id: '11', x: 45, y: 88, label: 'Middle-aged High Spender', originalCluster: 2 },
                { id: '12', x: 48, y: 85, label: 'Middle-aged High Spender', originalCluster: 2 },
                { id: '13', x: 42, y: 90, label: 'Middle-aged High Spender', originalCluster: 2 },
                { id: '14', x: 46, y: 87, label: 'Middle-aged High Spender', originalCluster: 2 },
                { id: '15', x: 44, y: 89, label: 'Middle-aged High Spender', originalCluster: 2 },

                // Middle-aged Low Spenders
                { id: '16', x: 44, y: 16, label: 'Middle-aged Low Spender', originalCluster: 3 },
                { id: '17', x: 46, y: 13, label: 'Middle-aged Low Spender', originalCluster: 3 },
                { id: '18', x: 43, y: 18, label: 'Middle-aged Low Spender', originalCluster: 3 },
                { id: '19', x: 45, y: 14, label: 'Middle-aged Low Spender', originalCluster: 3 },
                { id: '20', x: 47, y: 16, label: 'Middle-aged Low Spender', originalCluster: 3 }
            ]
        },
        synthetic: {
            name: 'Synthetic Clusters',
            description: 'Clearly separated clusters for learning the basics of distance metrics',
            optimalK: 3,
            features: ['Feature 1', 'Feature 2'],
            data: [
                // Cluster 1 - Top left
                { id: '1', x: 20, y: 80, originalCluster: 0 },
                { id: '2', x: 25, y: 85, originalCluster: 0 },
                { id: '3', x: 18, y: 82, originalCluster: 0 },
                { id: '4', x: 22, y: 88, originalCluster: 0 },
                { id: '5', x: 24, y: 83, originalCluster: 0 },

                // Cluster 2 - Bottom right
                { id: '6', x: 75, y: 20, originalCluster: 1 },
                { id: '7', x: 78, y: 25, originalCluster: 1 },
                { id: '8', x: 72, y: 18, originalCluster: 1 },
                { id: '9', x: 76, y: 22, originalCluster: 1 },
                { id: '10', x: 74, y: 24, originalCluster: 1 },

                // Cluster 3 - Center
                { id: '11', x: 50, y: 50, originalCluster: 2 },
                { id: '12', x: 52, y: 48, originalCluster: 2 },
                { id: '13', x: 48, y: 52, originalCluster: 2 },
                { id: '14', x: 51, y: 49, originalCluster: 2 },
                { id: '15', x: 49, y: 51, originalCluster: 2 }
            ]
        }
    };

    // Color palette for clusters
    const clusterColors = [
        '#ef4444', // Red
        '#22c55e', // Green
        '#3b82f6', // Blue
        '#f59e0b', // Yellow
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
        '#f97316', // Orange
        '#ec4899'  // Pink
    ];

    // Calculate Euclidean distance between two points
    const calculateDistance = (pointA: DataPoint, pointB: DataPoint): number => {
        return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
    };

    // Calculate distance matrix for all points
    const calculateDistanceMatrix = (points: DataPoint[]): DistanceMatrix => {
        const matrix: DistanceMatrix = {};

        points.forEach(pointA => {
            matrix[pointA.id] = {};
            points.forEach(pointB => {
                if (pointA.id !== pointB.id) {
                    matrix[pointA.id][pointB.id] = calculateDistance(pointA, pointB);
                }
            });
        });

        return matrix;
    };

    // Find nearest neighbors for a point
    const findNearestNeighbors = (point: DataPoint, allPoints: DataPoint[], k: number): DataPoint[] => {
        const distances = allPoints
            .filter(p => p.id !== point.id)
            .map(p => ({
                point: p,
                distance: calculateDistance(point, p)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, k)
            .map(item => item.point);

        return distances;
    };

    // Initialize K-means centroids
    const initializeCentroids = (points: DataPoint[], k: number): DataPoint[] => {
        const centroids: DataPoint[] = [];
        const shuffled = [...points].sort(() => 0.5 - Math.random());

        for (let i = 0; i < k; i++) {
            const point = shuffled[i];
            centroids.push({
                id: `centroid_${i}`,
                x: point.x,
                y: point.y,
                cluster: i,
                color: clusterColors[i % clusterColors.length],
                isCentroid: true
            });
        }

        return centroids;
    };

    // Assign points to nearest centroid
    const assignPointsToClusters = (points: DataPoint[], centroids: DataPoint[]): DataPoint[] => {
        return points.map(point => {
            let minDistance = Infinity;
            let assignedCluster = 0;

            centroids.forEach(centroid => {
                const distance = calculateDistance(point, centroid);
                if (distance < minDistance) {
                    minDistance = distance;
                    assignedCluster = centroid.cluster || 0;
                }
            });

            return {
                ...point,
                cluster: assignedCluster,
                color: clusterColors[assignedCluster % clusterColors.length]
            };
        });
    };

    // Update centroids to center of their assigned points
    const updateCentroids = (points: DataPoint[], centroids: DataPoint[]): DataPoint[] => {
        return centroids.map(centroid => {
            const assignedPoints = points.filter(point => point.cluster === centroid.cluster);

            if (assignedPoints.length === 0) {
                return centroid;
            }

            const newX = assignedPoints.reduce((sum, point) => sum + point.x, 0) / assignedPoints.length;
            const newY = assignedPoints.reduce((sum, point) => sum + point.y, 0) / assignedPoints.length;

            return {
                ...centroid,
                x: newX,
                y: newY
            };
        });
    };

    // Calculate WCSS (Within-Cluster Sum of Squares)
    const calculateWCSS = (points: DataPoint[], centroids: DataPoint[]): number => {
        let wcss = 0;

        points.forEach(point => {
            const centroid = centroids.find(c => c.cluster === point.cluster);
            if (centroid) {
                const distance = calculateDistance(point, centroid);
                wcss += distance * distance;
            }
        });

        return wcss;
    };

    // Run K-means algorithm
    const runKMeans = (points: DataPoint[], k: number, maxIterations: number = 10): KMeansResult => {
        let centroids = initializeCentroids(points, k);
        let currentPoints = [...points];
        let iterations = 0;

        for (let i = 0; i < maxIterations; i++) {
            const newPoints = assignPointsToClusters(currentPoints, centroids);
            const newCentroids = updateCentroids(newPoints, centroids);

            // Check for convergence
            const converged = centroids.every((centroid, index) => {
                const newCentroid = newCentroids[index];
                const distance = calculateDistance(centroid, newCentroid);
                return distance < 0.1;
            });

            centroids = newCentroids;
            currentPoints = newPoints;
            iterations++;

            if (converged) break;
        }

        const wcss = calculateWCSS(currentPoints, centroids);
        const assignments: { [pointId: string]: number } = {};
        currentPoints.forEach(point => {
            assignments[point.id] = point.cluster || 0;
        });

        return {
            centroids,
            assignments,
            wcss,
            converged: iterations < maxIterations,
            iterations
        };
    };

    // Calculate dynamic dimensions based on container size
    const calculateDimensions = () => {
        if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const padding = 40;

            const newWidth = Math.max(600, containerRect.width - padding);
            const newHeight = Math.max(400, Math.min(600, window.innerHeight * 0.6));

            setDimensions({ width: newWidth, height: newHeight });
        }
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            calculateDimensions();
        };

        calculateDimensions();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize dataset when selected
    useEffect(() => {
        const dataset = datasets[selectedDataset];
        if (dataset) {
            setDataPoints(dataset.data.map(point => ({
                ...point,
                cluster: undefined,
                color: '#6b7280',
                isSelected: false
            })));
            setAlgorithmState(prev => ({
                ...prev,
                k: dataset.optimalK
            }));
        }
    }, [selectedDataset]);

    // Calculate distances when points change
    useEffect(() => {
        if (dataPoints.length > 0) {
            const matrix = calculateDistanceMatrix(dataPoints);
            setDistanceMatrix(matrix);

            // Calculate distances for selected points
            if (selectedPoints.length >= 2) {
                const newDistances: DistanceCalculation[] = [];
                for (let i = 0; i < selectedPoints.length; i++) {
                    for (let j = i + 1; j < selectedPoints.length; j++) {
                        newDistances.push({
                            pointA: selectedPoints[i],
                            pointB: selectedPoints[j],
                            distance: calculateDistance(selectedPoints[i], selectedPoints[j]),
                            isHighlighted: true
                        });
                    }
                }
                setDistances(newDistances);
            } else {
                setDistances([]);
            }
        }
    }, [dataPoints, selectedPoints]);

    // Log results for debugging (will be used in future features)
    useEffect(() => {
        if (knnResults.length > 0) {
            console.log('KNN Results:', knnResults);
        }
    }, [knnResults]);

    useEffect(() => {
        if (kmeansResults) {
            console.log('K-Means Results:', kmeansResults);
        }
    }, [kmeansResults]);

    useEffect(() => {
        if (Object.keys(distanceMatrix).length > 0) {
            console.log('Distance Matrix calculated for', Object.keys(distanceMatrix).length, 'points');
        }
    }, [distanceMatrix]);

    // Draw visualization
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = dimensions.width;
        const height = dimensions.height;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xExtent = d3.extent(dataPoints, d => d.x) as [number, number];
        const yExtent = d3.extent(dataPoints, d => d.y) as [number, number];

        const xRange = xExtent[1] - xExtent[0];
        const yRange = yExtent[1] - yExtent[0];
        const xPadding = Math.max(1, xRange * 0.1);
        const yPadding = Math.max(1, yRange * 0.1);

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
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

        // Draw distance lines
        if (showDistances && distances.length > 0) {
            distances.forEach(distance => {
                g.append("line")
                    .attr("x1", xScale(distance.pointA.x))
                    .attr("y1", yScale(distance.pointA.y))
                    .attr("x2", xScale(distance.pointB.x))
                    .attr("y2", yScale(distance.pointB.y))
                    .attr("stroke", "#f59e0b")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "3,3")
                    .attr("opacity", 0.7);

                // Add distance label
                const midX = (xScale(distance.pointA.x) + xScale(distance.pointB.x)) / 2;
                const midY = (yScale(distance.pointA.y) + yScale(distance.pointB.y)) / 2;

                g.append("text")
                    .attr("x", midX)
                    .attr("y", midY - 5)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", "#f59e0b")
                    .attr("font-weight", "bold")
                    .text(distance.distance.toFixed(2));
            });
        }

        // Draw data points
        const points = g.selectAll('.data-point')
            .data(dataPoints)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', d => d.isSelected ? 8 : 4)
            .style('fill', d => d.color || '#6b7280')
            .style('stroke', d => d.isSelected ? '#3b82f6' : '#374151')
            .style('stroke-width', d => d.isSelected ? 3 : 1)
            .style('opacity', 0.8)
            .style('cursor', 'pointer')
            .on('click', function (event, d) {
                event.stopPropagation();
                setSelectedPoints(prev => {
                    if (prev.find(p => p.id === d.id)) {
                        return prev.filter(p => p.id !== d.id);
                    } else {
                        return [...prev, d];
                    }
                });
            });

        // Add drag behavior
        const drag = d3.drag<SVGCircleElement, DataPoint>()
            .on('start', function () {
                d3.select(this).style('cursor', 'grabbing');
            })
            .on('drag', function (event, d) {
                const newX = xScale.invert(event.x);
                const newY = yScale.invert(event.y);

                d3.select(this)
                    .attr('cx', event.x)
                    .attr('cy', event.y);

                setDataPoints(prev =>
                    prev.map(p =>
                        p.id === d.id ? { ...p, x: newX, y: newY } : p
                    )
                );
            })
            .on('end', function () {
                d3.select(this).style('cursor', 'pointer');
            });

        points.call(drag);

        // Add point labels
        if (showLabels) {
            g.selectAll('.point-label')
                .data(dataPoints)
                .enter()
                .append('text')
                .attr('class', 'point-label')
                .attr('x', d => xScale(d.x))
                .attr('y', d => yScale(d.y) - 12)
                .attr('text-anchor', 'middle')
                .attr('font-size', '10px')
                .attr('fill', '#374151')
                .text(d => d.label || d.id);
        }

        // Add axis labels
        const dataset = datasets[selectedDataset];
        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#374151')
            .text(dataset.features[0]);

        g.append('text')
            .attr('x', -innerHeight / 2)
            .attr('y', -25)
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .style('font-size', '14px')
            .style('fill', '#374151')
            .text(dataset.features[1]);

    }, [dataPoints, selectedPoints, distances, showGrid, showDistances, showLabels, dimensions, selectedDataset]);

    // Handle algorithm mode changes
    const handleAlgorithmModeChange = (mode: 'explore' | 'kmeans' | 'knn') => {
        setAlgorithmState(prev => ({ ...prev, mode }));

        if (mode === 'kmeans') {
            const result = runKMeans(dataPoints, algorithmState.k);
            setKmeansResults(result);
            setDataPoints(prev =>
                prev.map(point => ({
                    ...point,
                    cluster: result.assignments[point.id],
                    color: clusterColors[result.assignments[point.id] % clusterColors.length]
                }))
            );
        } else if (mode === 'knn') {
            const results: KNNResult[] = dataPoints.map(point => ({
                point,
                neighbors: findNearestNeighbors(point, dataPoints, algorithmState.k)
            }));
            setKnnResults(results);
        }
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedPoints([]);
        setDistances([]);
    };

    return (
        <div className="euclidean-distance fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Euclidean Distance Explorer</h1>
                    <p className="page-description">
                        Explore distance metrics and their role in clustering and classification algorithms.
                        Drag points to see how distances change, and discover how spatial relationships
                        drive machine learning algorithms.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">Distance Visualization</h2>
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
                                        checked={showDistances}
                                        onChange={(e) => setShowDistances(e.target.checked)}
                                    />
                                    Show Distances
                                </label>
                                <label className="control-label">
                                    <input
                                        type="checkbox"
                                        checked={showLabels}
                                        onChange={(e) => setShowLabels(e.target.checked)}
                                    />
                                    Show Labels
                                </label>
                            </div>
                        </div>
                        <div className="visualization-container" ref={containerRef}>
                            <svg ref={svgRef} className="euclidean-svg"></svg>
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
                                        <option value="iris">Iris Dataset</option>
                                        <option value="customer">Customer Segmentation</option>
                                        <option value="synthetic">Synthetic Clusters</option>
                                    </select>
                                    <p className="dataset-description">
                                        {datasets[selectedDataset]?.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Algorithm Mode</h3>
                            </div>
                            <div className="card-body">
                                <div className="algorithm-controls">
                                    <button
                                        onClick={() => handleAlgorithmModeChange('explore')}
                                        className={`btn ${algorithmState.mode === 'explore' ? 'btn-primary' : 'btn-outline'}`}
                                    >
                                        Explore Mode
                                    </button>
                                    <button
                                        onClick={() => handleAlgorithmModeChange('kmeans')}
                                        className={`btn ${algorithmState.mode === 'kmeans' ? 'btn-primary' : 'btn-outline'}`}
                                    >
                                        K-Means Clustering
                                    </button>
                                    <button
                                        onClick={() => handleAlgorithmModeChange('knn')}
                                        className={`btn ${algorithmState.mode === 'knn' ? 'btn-primary' : 'btn-outline'}`}
                                    >
                                        K-Nearest Neighbors
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Parameters</h3>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">K Value</label>
                                        <input
                                            type="range"
                                            min="2"
                                            max="8"
                                            value={algorithmState.k}
                                            onChange={(e) => setAlgorithmState(prev => ({ ...prev, k: parseInt(e.target.value) }))}
                                            className="slider"
                                        />
                                        <span className="value-display">{algorithmState.k}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Distance Calculations</h3>
                            </div>
                            <div className="card-body">
                                <div className="results-display">
                                    {selectedPoints.length >= 2 && (
                                        <div className="result-item">
                                            <span className="result-label">Selected Points:</span>
                                            <span className="result-value">{selectedPoints.length}</span>
                                        </div>
                                    )}
                                    {distances.length > 0 && (
                                        <div className="result-item">
                                            <span className="result-label">Distances:</span>
                                            <span className="result-value">{distances.length}</span>
                                        </div>
                                    )}
                                    {distances.map((distance, index) => (
                                        <div key={index} className="result-item">
                                            <span className="result-label">
                                                {distance.pointA.label || distance.pointA.id} ↔ {distance.pointB.label || distance.pointB.id}:
                                            </span>
                                            <span className="result-value">{distance.distance.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={clearSelection} className="btn btn-outline">
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">How to Use This Simulation</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>Step-by-Step Guide</h4>
                                <div className="step-guide">
                                    <div className="step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <strong>Choose Your Dataset</strong>
                                            <p>Start by selecting a dataset from the dropdown menu. Each dataset represents different real-world scenarios:</p>
                                            <ul>
                                                <li><strong>Iris Dataset:</strong> Flower measurements - perfect for learning natural groupings</li>
                                                <li><strong>Customer Segmentation:</strong> Age and spending patterns - like grouping customers for marketing</li>
                                                <li><strong>Synthetic Clusters:</strong> Clearly separated groups - easiest to understand distance concepts</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Select Algorithm Mode</strong>
                                            <p>Choose how you want to explore the data:</p>
                                            <ul>
                                                <li><strong>Explore Mode:</strong> Free exploration - drag points around and see how distances change</li>
                                                <li><strong>K-Means Clustering:</strong> Watch how the algorithm groups points based on distance</li>
                                                <li><strong>K-Nearest Neighbors:</strong> See how distance determines which points are "most similar"</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Adjust Parameters</strong>
                                            <p>Use the K-value slider to control algorithm behavior:</p>
                                            <ul>
                                                <li><strong>K = 2:</strong> Find 2 groups (like "young vs old" customers)</li>
                                                <li><strong>K = 3:</strong> Find 3 groups (like "budget, mid-range, premium" products)</li>
                                                <li><strong>K = 4+:</strong> More detailed groupings</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">4</div>
                                        <div className="step-content">
                                            <strong>Interact and Learn</strong>
                                            <p>Click and drag points to see how distances change in real-time. Select multiple points to see distance lines and calculations.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding Euclidean Distance</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>What is Euclidean Distance?</h4>
                                <p>Think of Euclidean distance as the "straight-line distance" between two points, just like measuring with a ruler on a map. It's the shortest path between any two points in space.</p>

                                <div className="formula">
                                    d = √((x₂-x₁)² + (y₂-y₁)²)
                                </div>

                                <p><strong>In Simple Terms:</strong> This formula calculates the distance between two points by:</p>
                                <ol>
                                    <li>Finding the difference in X coordinates: (x₂-x₁)</li>
                                    <li>Finding the difference in Y coordinates: (y₂-y₁)</li>
                                    <li>Squaring both differences and adding them together</li>
                                    <li>Taking the square root of the result</li>
                                </ol>

                                <h4>Real-World Analogy</h4>
                                <p>Imagine you're in a city with a grid system. To get from point A to point B, you can't walk diagonally through buildings, so you walk along the streets. The Euclidean distance is like having a magic ruler that can measure the straight-line distance "as the crow flies" - the shortest possible distance.</p>

                                <h4>Key Properties</h4>
                                <div className="concepts-grid">
                                    <div className="concept-item">
                                        <h5>Always Positive</h5>
                                        <p>Distance can never be negative - it's always a positive number or zero (if points are identical).</p>
                                    </div>
                                    <div className="concept-item">
                                        <h5>Symmetric</h5>
                                        <p>Distance from A to B is the same as distance from B to A - just like walking from your house to school is the same distance as walking from school to your house.</p>
                                    </div>
                                    <div className="concept-item">
                                        <h5>Triangle Inequality</h5>
                                        <p>If you go from A to B, then B to C, the total distance is always greater than or equal to going directly from A to C.</p>
                                    </div>
                                    <div className="concept-item">
                                        <h5>Scale Sensitive</h5>
                                        <p>If you change the units (like from inches to feet), the distances change proportionally. This is important in machine learning!</p>
                                    </div>
                                </div>

                                <h4>Why Distance Matters in Machine Learning</h4>
                                <div className="applications-grid">
                                    <div className="application-item">
                                        <h5>Finding Similar Things</h5>
                                        <p>Netflix uses distance to find movies you might like - if you liked Movie A, it finds other movies that are "close" to Movie A in terms of genre, rating, etc.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>Grouping Similar Data</h5>
                                        <p>Companies group customers by similarity - customers who are "close" in terms of age, income, and spending habits get similar marketing campaigns.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>Making Predictions</h5>
                                        <p>When predicting if an email is spam, the algorithm looks at emails that are "close" to the current one in terms of word usage, sender patterns, etc.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>Image Recognition</h5>
                                        <p>When recognizing faces, the algorithm compares the current image to known faces and finds the "closest" match based on pixel patterns.</p>
                                    </div>
                                </div>

                                <h4>How K-Means Uses Distance</h4>
                                <p>K-Means clustering works like this:</p>
                                <ol>
                                    <li><strong>Place "centers" randomly:</strong> Like dropping pins on a map to represent different neighborhoods</li>
                                    <li><strong>Assign each point to the nearest center:</strong> Each person (data point) belongs to the neighborhood (cluster) they're closest to</li>
                                    <li><strong>Move centers to the middle of their group:</strong> The neighborhood center moves to the average location of all people in that neighborhood</li>
                                    <li><strong>Repeat until stable:</strong> Keep reassigning and moving until no one changes neighborhoods</li>
                                </ol>

                                <h4>How K-Nearest Neighbors Uses Distance</h4>
                                <p>K-NN classification works like asking your neighbors for advice:</p>
                                <ol>
                                    <li><strong>Find the K closest points:</strong> Like asking your 3 closest neighbors for their opinion</li>
                                    <li><strong>Count the votes:</strong> If 2 neighbors say "yes" and 1 says "no", you go with "yes"</li>
                                    <li><strong>Make the prediction:</strong> The majority vote from your closest neighbors becomes your prediction</li>
                                </ol>

                                <h4>Common Pitfalls to Avoid</h4>
                                <div className="pitfalls-grid">
                                    <div className="pitfall-item">
                                        <h5>Scale Differences</h5>
                                        <p><strong>Problem:</strong> If one feature is in dollars (0-100,000) and another is in years (0-100), the dollar values will dominate distance calculations.</p>
                                        <p><strong>Solution:</strong> Always normalize or standardize your data before calculating distances.</p>
                                    </div>
                                    <div className="pitfall-item">
                                        <h5>Too Many Dimensions</h5>
                                        <p><strong>Problem:</strong> In high dimensions, all points become roughly the same distance apart (the "curse of dimensionality").</p>
                                        <p><strong>Solution:</strong> Use dimensionality reduction techniques like PCA before clustering.</p>
                                    </div>
                                    <div className="pitfall-item">
                                        <h5>Wrong Distance Metric</h5>
                                        <p><strong>Problem:</strong> Euclidean distance assumes all directions are equally important, which isn't always true.</p>
                                        <p><strong>Solution:</strong> Consider other distance metrics like Manhattan distance for certain types of data.</p>
                                    </div>
                                </div>

                                <h4>Practice Exercises</h4>
                                <div className="exercises">
                                    <h5>Try These Activities:</h5>
                                    <ol>
                                        <li><strong>Explore Mode:</strong> Drag points around and watch how distances change. Try to make two points as close as possible, then as far apart as possible.</li>
                                        <li><strong>K-Means Mode:</strong> Start with K=2 and watch how the algorithm groups points. Then try K=3 and K=4. Which grouping makes the most sense?</li>
                                        <li><strong>K-NN Mode:</strong> Select a point and see its nearest neighbors. Change the K value and watch how the "neighborhood" changes.</li>
                                        <li><strong>Dataset Comparison:</strong> Try the same K value on different datasets. Notice how some datasets have clearer groupings than others.</li>
                                    </ol>
                                </div>
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

export default EuclideanDistance;
