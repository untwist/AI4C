import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './KMeansClustering.css';

interface DataPoint {
    id: string;
    x: number;
    y: number;
    cluster?: number;
    originalCluster?: number;
    color?: string;
}

interface Centroid {
    id: string;
    x: number;
    y: number;
    cluster: number;
    color: string;
    previousX?: number;
    previousY?: number;
}

interface Dataset {
    name: string;
    description: string;
    data: DataPoint[];
    optimalK: number;
    features: string[];
}

const KMeansClustering: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedDataset, setSelectedDataset] = useState<string>('customer');
    const [k, setK] = useState<number>(3);
    const [centroids, setCentroids] = useState<Centroid[]>([]);
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [iterations, setIterations] = useState<number>(0);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [animationSpeed, setAnimationSpeed] = useState<number>(1000);
    const [showVoronoi, setShowVoronoi] = useState<boolean>(false);
    const [wcssHistory, setWcssHistory] = useState<number[]>([]);
    const [currentWcss, setCurrentWcss] = useState<number>(0);
    const [showElbowMethod, setShowElbowMethod] = useState<boolean>(false);
    const [elbowData, setElbowData] = useState<{ k: number, wcss: number }[]>([]);
    const [initializationMethod, setInitializationMethod] = useState<'random' | 'kmeans++' | 'manual'>('random');
    const [isManualMode, setIsManualMode] = useState<boolean>(false);
    const [showTips, setShowTips] = useState<boolean>(true);
    const [dimensions, setDimensions] = useState<{ width: number, height: number }>({ width: 800, height: 600 });
    const [activeTab, setActiveTab] = useState<'graph' | 'elbow'>('graph');

    // Calculate dynamic dimensions based on container size
    const calculateDimensions = () => {
        if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const padding = 40; // Account for padding and margins

            // When elbow method is shown, significantly reduce available height
            const elbowMethodHeight = showElbowMethod ? 500 : 0; // Elbow method takes ~500px
            const baseHeight = Math.min(800, window.innerHeight * 0.6);
            const availableHeight = baseHeight - elbowMethodHeight;

            const newWidth = Math.max(600, containerRect.width - padding);
            const newHeight = Math.max(300, availableHeight); // Minimum 300px height

            console.log('Calculating dimensions:', {
                showElbowMethod,
                elbowMethodHeight,
                baseHeight,
                availableHeight,
                newWidth,
                newHeight
            });
            setDimensions({ width: newWidth, height: newHeight });
        }
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            calculateDimensions();
        };

        // Initial calculation
        calculateDimensions();

        // Add resize listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, [showElbowMethod]);

    // Recalculate dimensions when elbow method is toggled
    useEffect(() => {
        calculateDimensions();
    }, [showElbowMethod]);

    // Sample datasets
    const datasets: { [key: string]: Dataset } = {
        customer: {
            name: 'Customer Segmentation',
            description: 'Customer data with age and spending patterns - perfect for market segmentation',
            optimalK: 4,
            features: ['Age', 'Spending Score'],
            data: [
                // Young High Spenders
                { id: '1', x: 25, y: 85, originalCluster: 0 },
                { id: '2', x: 22, y: 90, originalCluster: 0 },
                { id: '3', x: 28, y: 88, originalCluster: 0 },
                { id: '4', x: 24, y: 92, originalCluster: 0 },
                { id: '5', x: 26, y: 87, originalCluster: 0 },
                { id: '6', x: 23, y: 89, originalCluster: 0 },
                { id: '7', x: 27, y: 91, originalCluster: 0 },
                { id: '8', x: 25, y: 86, originalCluster: 0 },

                // Young Low Spenders
                { id: '9', x: 24, y: 15, originalCluster: 1 },
                { id: '10', x: 26, y: 12, originalCluster: 1 },
                { id: '11', x: 23, y: 18, originalCluster: 1 },
                { id: '12', x: 25, y: 14, originalCluster: 1 },
                { id: '13', x: 27, y: 16, originalCluster: 1 },
                { id: '14', x: 22, y: 13, originalCluster: 1 },
                { id: '15', x: 24, y: 17, originalCluster: 1 },
                { id: '16', x: 26, y: 11, originalCluster: 1 },

                // Middle-aged High Spenders
                { id: '17', x: 45, y: 88, originalCluster: 2 },
                { id: '18', x: 48, y: 85, originalCluster: 2 },
                { id: '19', x: 42, y: 90, originalCluster: 2 },
                { id: '20', x: 46, y: 87, originalCluster: 2 },
                { id: '21', x: 44, y: 89, originalCluster: 2 },
                { id: '22', x: 47, y: 86, originalCluster: 2 },
                { id: '23', x: 43, y: 91, originalCluster: 2 },
                { id: '24', x: 45, y: 88, originalCluster: 2 },

                // Middle-aged Low Spenders
                { id: '25', x: 44, y: 16, originalCluster: 3 },
                { id: '26', x: 46, y: 13, originalCluster: 3 },
                { id: '27', x: 43, y: 18, originalCluster: 3 },
                { id: '28', x: 45, y: 14, originalCluster: 3 },
                { id: '29', x: 47, y: 16, originalCluster: 3 },
                { id: '30', x: 42, y: 12, originalCluster: 3 },
                { id: '31', x: 44, y: 17, originalCluster: 3 },
                { id: '32', x: 46, y: 15, originalCluster: 3 },

                // Senior Conservative
                { id: '33', x: 65, y: 25, originalCluster: 4 },
                { id: '34', x: 68, y: 22, originalCluster: 4 },
                { id: '35', x: 62, y: 28, originalCluster: 4 },
                { id: '36', x: 66, y: 24, originalCluster: 4 },
                { id: '37', x: 64, y: 26, originalCluster: 4 },
                { id: '38', x: 67, y: 23, originalCluster: 4 },
                { id: '39', x: 63, y: 27, originalCluster: 4 },
                { id: '40', x: 65, y: 25, originalCluster: 4 }
            ]
        },
        iris: {
            name: 'Iris Dataset (2D Projection)',
            description: 'Classic machine learning dataset showing natural flower groupings',
            optimalK: 3,
            features: ['Petal Length', 'Petal Width'],
            data: [
                // Setosa
                { id: '1', x: 1.4, y: 0.2, originalCluster: 0 },
                { id: '2', x: 1.4, y: 0.2, originalCluster: 0 },
                { id: '3', x: 1.3, y: 0.2, originalCluster: 0 },
                { id: '4', x: 1.5, y: 0.2, originalCluster: 0 },
                { id: '5', x: 1.4, y: 0.2, originalCluster: 0 },
                { id: '6', x: 1.7, y: 0.4, originalCluster: 0 },
                { id: '7', x: 1.4, y: 0.3, originalCluster: 0 },
                { id: '8', x: 1.5, y: 0.2, originalCluster: 0 },
                { id: '9', x: 1.4, y: 0.2, originalCluster: 0 },
                { id: '10', x: 1.5, y: 0.1, originalCluster: 0 },

                // Versicolor
                { id: '11', x: 4.7, y: 1.4, originalCluster: 1 },
                { id: '12', x: 4.5, y: 1.5, originalCluster: 1 },
                { id: '13', x: 4.9, y: 1.5, originalCluster: 1 },
                { id: '14', x: 4.0, y: 1.3, originalCluster: 1 },
                { id: '15', x: 4.6, y: 1.5, originalCluster: 1 },
                { id: '16', x: 4.5, y: 1.3, originalCluster: 1 },
                { id: '17', x: 4.7, y: 1.6, originalCluster: 1 },
                { id: '18', x: 3.3, y: 1.0, originalCluster: 1 },
                { id: '19', x: 4.6, y: 1.3, originalCluster: 1 },
                { id: '20', x: 3.9, y: 1.4, originalCluster: 1 },

                // Virginica
                { id: '21', x: 6.0, y: 2.5, originalCluster: 2 },
                { id: '22', x: 5.1, y: 1.9, originalCluster: 2 },
                { id: '23', x: 5.9, y: 2.1, originalCluster: 2 },
                { id: '24', x: 5.6, y: 1.8, originalCluster: 2 },
                { id: '25', x: 5.8, y: 2.2, originalCluster: 2 },
                { id: '26', x: 6.6, y: 2.1, originalCluster: 2 },
                { id: '27', x: 4.5, y: 1.7, originalCluster: 2 },
                { id: '28', x: 6.3, y: 1.8, originalCluster: 2 },
                { id: '29', x: 5.8, y: 1.8, originalCluster: 2 },
                { id: '30', x: 6.1, y: 2.5, originalCluster: 2 }
            ]
        },
        blobs: {
            name: 'Synthetic Blobs',
            description: 'Clearly separated clusters for learning the basics of K-Means',
            optimalK: 3,
            features: ['Feature 1', 'Feature 2'],
            data: [
                // Cluster 1 - Top left
                { id: '1', x: 20, y: 80, originalCluster: 0 },
                { id: '2', x: 25, y: 85, originalCluster: 0 },
                { id: '3', x: 18, y: 82, originalCluster: 0 },
                { id: '4', x: 22, y: 88, originalCluster: 0 },
                { id: '5', x: 24, y: 83, originalCluster: 0 },
                { id: '6', x: 19, y: 86, originalCluster: 0 },
                { id: '7', x: 21, y: 84, originalCluster: 0 },
                { id: '8', x: 23, y: 87, originalCluster: 0 },

                // Cluster 2 - Bottom right
                { id: '9', x: 75, y: 20, originalCluster: 1 },
                { id: '10', x: 78, y: 25, originalCluster: 1 },
                { id: '11', x: 72, y: 18, originalCluster: 1 },
                { id: '12', x: 76, y: 22, originalCluster: 1 },
                { id: '13', x: 74, y: 24, originalCluster: 1 },
                { id: '14', x: 77, y: 19, originalCluster: 1 },
                { id: '15', x: 73, y: 21, originalCluster: 1 },
                { id: '16', x: 75, y: 23, originalCluster: 1 },

                // Cluster 3 - Center
                { id: '17', x: 50, y: 50, originalCluster: 2 },
                { id: '18', x: 52, y: 48, originalCluster: 2 },
                { id: '19', x: 48, y: 52, originalCluster: 2 },
                { id: '20', x: 51, y: 49, originalCluster: 2 },
                { id: '21', x: 49, y: 51, originalCluster: 2 },
                { id: '22', x: 53, y: 47, originalCluster: 2 },
                { id: '23', x: 47, y: 53, originalCluster: 2 },
                { id: '24', x: 50, y: 50, originalCluster: 2 }
            ]
        },
        random: {
            name: 'Randomized Data',
            description: 'Randomly generated clusters with different shapes and separations',
            optimalK: 3,
            features: ['Feature 1', 'Feature 2'],
            data: [] // Will be generated dynamically
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

    // Generate random dataset
    const generateRandomDataset = (): DataPoint[] => {
        const data: DataPoint[] = [];
        const numClusters = Math.floor(Math.random() * 3) + 2; // 2-4 clusters
        const pointsPerCluster = Math.floor(Math.random() * 15) + 8; // 8-22 points per cluster

        for (let cluster = 0; cluster < numClusters; cluster++) {
            // Random cluster center
            const centerX = Math.random() * 60 + 20; // 20-80
            const centerY = Math.random() * 60 + 20; // 20-80

            // Random cluster spread
            const spreadX = Math.random() * 15 + 5; // 5-20
            const spreadY = Math.random() * 15 + 5; // 5-20

            // Random cluster shape (circular or elliptical)
            const isElliptical = Math.random() > 0.5;
            const rotation = Math.random() * Math.PI * 2;

            for (let i = 0; i < pointsPerCluster; i++) {
                let x, y;

                if (isElliptical) {
                    // Generate elliptical cluster
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * Math.max(spreadX, spreadY);
                    const localX = radius * Math.cos(angle);
                    const localY = radius * Math.sin(angle) * (spreadY / spreadX);

                    x = centerX + localX * Math.cos(rotation) - localY * Math.sin(rotation);
                    y = centerY + localX * Math.sin(rotation) + localY * Math.cos(rotation);
                } else {
                    // Generate circular cluster
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * Math.min(spreadX, spreadY);
                    x = centerX + radius * Math.cos(angle);
                    y = centerY + radius * Math.sin(angle);
                }

                // Add some noise
                x += (Math.random() - 0.5) * 3;
                y += (Math.random() - 0.5) * 3;

                // Ensure points stay within bounds
                x = Math.max(5, Math.min(95, x));
                y = Math.max(5, Math.min(95, y));

                data.push({
                    id: `random_${cluster}_${i}`,
                    x: x,
                    y: y,
                    originalCluster: cluster
                });
            }
        }

        return data;
    };

    // Randomize the current dataset
    const randomizeDataset = () => {
        if (selectedDataset === 'random') {
            const newData = generateRandomDataset();
            datasets.random.data = newData;

            // Update the optimal K based on the number of clusters generated
            const uniqueClusters = new Set(newData.map(point => point.originalCluster)).size;
            datasets.random.optimalK = uniqueClusters;

            // Reinitialize the algorithm with new data
            initializeAlgorithm();
        }
    };

    // Calculate elbow method data
    const calculateElbowMethod = (data: DataPoint[], maxK: number = 8) => {
        if (data.length === 0) {
            console.log('No data points available for elbow method calculation');
            return;
        }

        console.log('Starting elbow method calculation...');
        const elbowResults: { k: number, wcss: number }[] = [];

        for (let testK = 1; testK <= maxK; testK++) {
            console.log(`Calculating for K=${testK}`);
            // Run K-means with current initialization method
            let testCentroids: Centroid[];
            if (initializationMethod === 'kmeans++') {
                testCentroids = initializeCentroidsKMeansPlusPlus(data, testK);
            } else {
                testCentroids = initializeCentroids(data, testK);
            }

            // Run algorithm until convergence
            let currentData = [...data];
            let currentCentroids = [...testCentroids];
            let iterations = 0;
            const maxIterations = 50;

            while (iterations < maxIterations) {
                const newData = assignPointsToClusters(currentData, currentCentroids);
                const newCentroids = updateCentroids(newData, currentCentroids);

                if (hasConverged(currentCentroids, newCentroids, 0.01)) {
                    break;
                }

                currentData = newData;
                currentCentroids = newCentroids;
                iterations++;
            }

            // Calculate final WCSS
            const finalWCSS = calculateWCSS(currentData, currentCentroids);
            elbowResults.push({ k: testK, wcss: finalWCSS });
        }

        console.log('Elbow method calculation complete:', elbowResults);
        setElbowData(elbowResults);
        setActiveTab('elbow'); // Automatically switch to elbow method tab when calculated
    };

    // Handle manual centroid movement
    const updateCentroidPosition = (centroidId: string, newX: number, newY: number) => {
        if (!isManualMode) return;

        setCentroids(prevCentroids =>
            prevCentroids.map(centroid =>
                centroid.id === centroidId
                    ? { ...centroid, x: newX, y: newY }
                    : centroid
            )
        );

        // Immediately reassign points to clusters
        const updatedCentroids = centroids.map(centroid =>
            centroid.id === centroidId
                ? { ...centroid, x: newX, y: newY }
                : centroid
        );

        const newDataPoints = assignPointsToClusters(dataPoints, updatedCentroids);
        setDataPoints(newDataPoints);

        // Update WCSS
        const wcss = calculateWCSS(newDataPoints, updatedCentroids);
        setCurrentWcss(wcss);
    };

    // Initialize centroids randomly
    const initializeCentroids = (data: DataPoint[], k: number): Centroid[] => {
        const centroids: Centroid[] = [];
        const shuffled = [...data].sort(() => 0.5 - Math.random());

        for (let i = 0; i < k; i++) {
            const point = shuffled[i];
            centroids.push({
                id: `centroid_${i}`,
                x: point.x,
                y: point.y,
                cluster: i,
                color: clusterColors[i % clusterColors.length]
            });
        }

        return centroids;
    };

    // K-means++ initialization
    const initializeCentroidsKMeansPlusPlus = (data: DataPoint[], k: number): Centroid[] => {
        const centroids: Centroid[] = [];

        // Choose first centroid randomly
        const firstIndex = Math.floor(Math.random() * data.length);
        centroids.push({
            id: `centroid_0`,
            x: data[firstIndex].x,
            y: data[firstIndex].y,
            cluster: 0,
            color: clusterColors[0]
        });

        // Choose remaining centroids using K-means++ algorithm
        for (let i = 1; i < k; i++) {
            const distances: number[] = [];

            // Calculate minimum distance from each point to existing centroids
            data.forEach(point => {
                let minDistance = Infinity;
                centroids.forEach(centroid => {
                    const distance = calculateDistance(point, centroid);
                    minDistance = Math.min(minDistance, distance);
                });
                distances.push(minDistance * minDistance); // Square the distance for probability weighting
            });

            // Choose next centroid with probability proportional to squared distance
            const totalDistance = distances.reduce((sum, dist) => sum + dist, 0);
            let randomValue = Math.random() * totalDistance;

            for (let j = 0; j < data.length; j++) {
                randomValue -= distances[j];
                if (randomValue <= 0) {
                    centroids.push({
                        id: `centroid_${i}`,
                        x: data[j].x,
                        y: data[j].y,
                        cluster: i,
                        color: clusterColors[i % clusterColors.length]
                    });
                    break;
                }
            }
        }

        return centroids;
    };

    // Manual initialization - place centroids in a grid pattern
    const initializeCentroidsManually = (data: DataPoint[], k: number): Centroid[] => {
        const centroids: Centroid[] = [];

        // Calculate data bounds
        const xExtent = d3.extent(data, d => d.x) as [number, number];
        const yExtent = d3.extent(data, d => d.y) as [number, number];

        // Place centroids in a grid pattern
        const cols = Math.ceil(Math.sqrt(k));
        const rows = Math.ceil(k / cols);

        for (let i = 0; i < k; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = xExtent[0] + (xExtent[1] - xExtent[0]) * (col + 0.5) / cols;
            const y = yExtent[0] + (yExtent[1] - yExtent[0]) * (row + 0.5) / rows;

            centroids.push({
                id: `centroid_${i}`,
                x: x,
                y: y,
                cluster: i,
                color: clusterColors[i % clusterColors.length]
            });
        }

        return centroids;
    };

    // Calculate distance between two points
    const calculateDistance = (point1: DataPoint, point2: Centroid): number => {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    };

    // Assign points to nearest centroid
    const assignPointsToClusters = (data: DataPoint[], centroids: Centroid[]): DataPoint[] => {
        return data.map(point => {
            let minDistance = Infinity;
            let assignedCluster = 0;

            centroids.forEach(centroid => {
                const distance = calculateDistance(point, centroid);
                if (distance < minDistance) {
                    minDistance = distance;
                    assignedCluster = centroid.cluster;
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
    const updateCentroids = (data: DataPoint[], centroids: Centroid[]): Centroid[] => {
        return centroids.map(centroid => {
            const assignedPoints = data.filter(point => point.cluster === centroid.cluster);

            if (assignedPoints.length === 0) {
                return centroid; // Keep centroid unchanged if no points assigned
            }

            const newX = assignedPoints.reduce((sum, point) => sum + point.x, 0) / assignedPoints.length;
            const newY = assignedPoints.reduce((sum, point) => sum + point.y, 0) / assignedPoints.length;

            return {
                ...centroid,
                previousX: centroid.x,
                previousY: centroid.y,
                x: newX,
                y: newY
            };
        });
    };

    // Calculate Within-Cluster Sum of Squares (WCSS)
    const calculateWCSS = (data: DataPoint[], centroids: Centroid[]): number => {
        let wcss = 0;

        data.forEach(point => {
            const centroid = centroids.find(c => c.cluster === point.cluster);
            if (centroid) {
                const distance = calculateDistance(point, centroid);
                wcss += distance * distance;
            }
        });

        return wcss;
    };

    // Check if centroids have converged
    const hasConverged = (oldCentroids: Centroid[], newCentroids: Centroid[], tolerance: number = 0.1): boolean => {
        return oldCentroids.every((oldCentroid, index) => {
            const newCentroid = newCentroids[index];
            const distance = Math.sqrt(
                Math.pow(oldCentroid.x - newCentroid.x, 2) +
                Math.pow(oldCentroid.y - newCentroid.y, 2)
            );
            return distance < tolerance;
        });
    };

    // Run one iteration of K-Means
    const runKMeansIteration = () => {
        if (isAnimating) return;

        setIsAnimating(true);

        setTimeout(() => {
            const newDataPoints = assignPointsToClusters(dataPoints, centroids);
            const newCentroids = updateCentroids(newDataPoints, centroids);
            const wcss = calculateWCSS(newDataPoints, newCentroids);

            setDataPoints(newDataPoints);
            setCentroids(newCentroids);
            setIterations(prev => prev + 1);
            setCurrentWcss(wcss);
            setWcssHistory(prev => [...prev, wcss]);
            setIsAnimating(false);
        }, animationSpeed);
    };

    // Initialize or reset the algorithm
    const initializeAlgorithm = () => {
        let dataset = datasets[selectedDataset];

        // Generate random data if it's the random dataset and has no data
        if (selectedDataset === 'random' && dataset.data.length === 0) {
            const newData = generateRandomDataset();
            datasets.random.data = newData;
            const uniqueClusters = new Set(newData.map(point => point.originalCluster)).size;
            datasets.random.optimalK = uniqueClusters;
            dataset = datasets.random;
        }

        let newCentroids: Centroid[];
        if (initializationMethod === 'kmeans++') {
            newCentroids = initializeCentroidsKMeansPlusPlus(dataset.data, k);
        } else if (initializationMethod === 'manual') {
            // For manual mode, place centroids in a grid pattern initially
            newCentroids = initializeCentroidsManually(dataset.data, k);
        } else {
            newCentroids = initializeCentroids(dataset.data, k);
        }
        const initialData = dataset.data.map(point => ({
            ...point,
            cluster: undefined,
            color: '#6b7280'
        }));

        setDataPoints(initialData);
        setCentroids(newCentroids);
        setIterations(0);
        setWcssHistory([]);
        setCurrentWcss(0);
    };

    // Reset only the algorithm state (keep same data)
    const resetAlgorithm = () => {
        if (dataPoints.length > 0) {
            let newCentroids: Centroid[];
            if (initializationMethod === 'kmeans++') {
                newCentroids = initializeCentroidsKMeansPlusPlus(dataPoints, k);
            } else if (initializationMethod === 'manual') {
                newCentroids = initializeCentroidsManually(dataPoints, k);
            } else {
                newCentroids = initializeCentroids(dataPoints, k);
            }
            const resetData = dataPoints.map(point => ({
                ...point,
                cluster: undefined,
                color: '#6b7280'
            }));

            setDataPoints(resetData);
            setCentroids(newCentroids);
            setIterations(0);
            setWcssHistory([]);
            setCurrentWcss(0);
        }
    };

    // Auto-run algorithm until convergence
    const runFullAlgorithm = async () => {
        if (isAnimating) return;

        setIsAnimating(true);
        let currentData = [...dataPoints];
        let currentCentroids = [...centroids];
        let iteration = 0;
        const maxIterations = 20;

        while (iteration < maxIterations) {
            const newData = assignPointsToClusters(currentData, currentCentroids);
            const newCentroids = updateCentroids(newData, currentCentroids);
            const wcss = calculateWCSS(newData, newCentroids);

            setDataPoints(newData);
            setCentroids(newCentroids);
            setIterations(iteration + 1);
            setCurrentWcss(wcss);
            setWcssHistory(prev => [...prev, wcss]);

            if (hasConverged(currentCentroids, newCentroids)) {
                break;
            }

            currentData = newData;
            currentCentroids = newCentroids;
            iteration++;

            await new Promise(resolve => setTimeout(resolve, animationSpeed));
        }

        setIsAnimating(false);
    };

    // Initialize when dataset changes
    useEffect(() => {
        initializeAlgorithm();
    }, [selectedDataset]);

    // Reinitialize centroids when k changes (but keep the same data)
    useEffect(() => {
        if (dataPoints.length > 0) {
            let newCentroids: Centroid[];
            if (initializationMethod === 'kmeans++') {
                newCentroids = initializeCentroidsKMeansPlusPlus(dataPoints, k);
            } else if (initializationMethod === 'manual') {
                newCentroids = initializeCentroidsManually(dataPoints, k);
            } else {
                newCentroids = initializeCentroids(dataPoints, k);
            }
            setCentroids(newCentroids);
            setIterations(0);
            setWcssHistory([]);
            setCurrentWcss(0);
        }
    }, [k, initializationMethod]);

    // Draw visualization
    useEffect(() => {
        if (!svgRef.current || activeTab !== 'graph') return;

        // Small delay to ensure tab switch completes
        const timeoutId = setTimeout(() => {
            try {
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

                // Create scales with intelligent padding - include BOTH data points AND centroids
                const dataXValues = dataPoints.map(d => d.x);
                const dataYValues = dataPoints.map(d => d.y);
                const centroidXValues = centroids.map(c => c.x);
                const centroidYValues = centroids.map(c => c.y);

                const allXValues = [...dataXValues, ...centroidXValues];
                const allYValues = [...dataYValues, ...centroidYValues];

                const xExtent = d3.extent(allXValues) as [number, number];
                const yExtent = d3.extent(allYValues) as [number, number];

                // Fallback if no data points - use default extents
                if (!xExtent[0] || !xExtent[1] || !yExtent[0] || !yExtent[1]) {
                    // Use default extents for empty state
                    const defaultXExtent: [number, number] = [0, 100];
                    const defaultYExtent: [number, number] = [0, 100];
                    xExtent[0] = defaultXExtent[0];
                    xExtent[1] = defaultXExtent[1];
                    yExtent[0] = defaultYExtent[0];
                    yExtent[1] = defaultYExtent[1];
                }

                // Calculate data range for better padding
                const xRange = xExtent[1] - xExtent[0];
                const yRange = yExtent[1] - yExtent[0];

                // Use percentage-based padding (10% of range) with minimum padding
                const xPadding = Math.max(5, xRange * 0.1);
                const yPadding = Math.max(5, yRange * 0.1);

                // When elbow method is shown, use more aggressive scaling to fit everything
                const scaleFactor = showElbowMethod ? 0.1 : 1.0; // Very aggressive scaling when elbow method is shown

                // Debug logging (can be removed in production)
                // console.log('Scaling debug:', {
                //     dataPointsCount: dataPoints.length,
                //     centroidsCount: centroids.length,
                //     xExtent,
                //     yExtent,
                //     showElbowMethod,
                //     scaleFactor
                // });

                // Ensure minimum padding for readability
                const finalXPadding = Math.max(1, xPadding * scaleFactor);
                const finalYPadding = Math.max(1, yPadding * scaleFactor);

                const xScale = d3.scaleLinear()
                    .domain([xExtent[0] - finalXPadding, xExtent[1] + finalXPadding])
                    .range([0, innerWidth]);

                const yScale = d3.scaleLinear()
                    .domain([yExtent[0] - finalYPadding, yExtent[1] + finalYPadding])
                    .range([innerHeight, 0]);

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

                // Draw Voronoi diagram if enabled
                if (showVoronoi && centroids.length > 0) {
                    const voronoi = d3.Delaunay.from(centroids.map(c => [xScale(c.x), yScale(c.y)]));
                    const voronoiCells = voronoi.voronoi([0, 0, innerWidth, innerHeight]);

                    g.selectAll('.voronoi')
                        .data(centroids)
                        .enter()
                        .append('path')
                        .attr('class', 'voronoi')
                        .attr('d', (_, i) => voronoiCells.renderCell(i))
                        .style('fill', 'none')
                        .style('stroke', d => d.color)
                        .style('stroke-width', 1)
                        .style('stroke-dasharray', '3,3')
                        .style('opacity', 0.5);
                }

                // Draw data points
                g.selectAll('.data-point')
                    .data(dataPoints)
                    .enter()
                    .append('circle')
                    .attr('class', 'data-point')
                    .attr('cx', d => xScale(d.x))
                    .attr('cy', d => yScale(d.y))
                    .attr('r', 4)
                    .style('fill', d => d.color || '#6b7280')
                    .style('stroke', '#374151')
                    .style('stroke-width', 1)
                    .style('opacity', 0.8);

                // Draw centroids
                const centroidCircles = g.selectAll('.centroid')
                    .data(centroids)
                    .enter()
                    .append('circle')
                    .attr('class', 'centroid')
                    .attr('cx', d => xScale(d.x))
                    .attr('cy', d => yScale(d.y))
                    .attr('r', 8)
                    .style('fill', d => d.color)
                    .style('stroke', '#374151')
                    .style('stroke-width', 3)
                    .style('opacity', 0.9)
                    .style('cursor', isManualMode ? 'grab' : 'default');

                // Add drag behavior for manual mode
                if (isManualMode) {
                    const drag = d3.drag<SVGCircleElement, Centroid>()
                        .on('start', function (_event, _d) {
                            d3.select(this).style('cursor', 'grabbing');
                        })
                        .on('drag', function (event, d) {
                            const newX = xScale.invert(event.x);
                            const newY = yScale.invert(event.y);

                            // Update centroid position
                            d3.select(this)
                                .attr('cx', event.x)
                                .attr('cy', event.y);

                            // Update the centroid data and trigger reassignment
                            updateCentroidPosition(d.id, newX, newY);
                        })
                        .on('end', function (_event, _d) {
                            d3.select(this).style('cursor', 'grab');
                        });

                    centroidCircles.call(drag);
                }

                // Add centroid labels
                g.selectAll('.centroid-label')
                    .data(centroids)
                    .enter()
                    .append('text')
                    .attr('class', 'centroid-label')
                    .attr('x', d => xScale(d.x))
                    .attr('y', d => yScale(d.y) - 15)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .style('fill', d => d.color)
                    .text(d => `C${d.cluster + 1}`);

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

            } catch (error) {
                console.error('Error rendering visualization:', error);
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [dataPoints, centroids, showVoronoi, selectedDataset, isManualMode, dimensions, activeTab]);

    // Draw elbow method chart
    useEffect(() => {
        console.log('Elbow method useEffect triggered:', { activeTab, elbowDataLength: elbowData.length });
        if (activeTab !== 'elbow' || elbowData.length === 0) return;

        const chartContainer = document.getElementById('elbow-chart');
        if (!chartContainer) {
            console.log('Elbow chart container not found');
            return;
        }

        console.log('Rendering elbow method chart...');

        // Clear previous chart
        chartContainer.innerHTML = '';

        const width = 500;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };

        const svg = d3.select(chartContainer)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(elbowData, d => d.k) as [number, number])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(elbowData, d => d.wcss) as [number, number])
            .range([innerHeight, 0]);

        // Create line generator
        const line = d3.line<{ k: number, wcss: number }>()
            .x(d => xScale(d.k))
            .y(d => yScale(d.wcss))
            .curve(d3.curveMonotoneX);

        // Draw line
        g.append('path')
            .datum(elbowData)
            .attr('fill', 'none')
            .attr('stroke', '#3b82f6')
            .attr('stroke-width', 3)
            .attr('d', line);

        // Draw points
        g.selectAll('.elbow-point')
            .data(elbowData)
            .enter()
            .append('circle')
            .attr('class', 'elbow-point')
            .attr('cx', d => xScale(d.k))
            .attr('cy', d => yScale(d.wcss))
            .attr('r', 6)
            .attr('fill', '#3b82f6')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function (_event, d) {
                d3.select(this).attr('r', 8);

                // Show tooltip
                const tooltip = g.append('g')
                    .attr('class', 'tooltip')
                    .style('opacity', 0);

                tooltip.append('rect')
                    .attr('x', xScale(d.k) - 30)
                    .attr('y', yScale(d.wcss) - 30)
                    .attr('width', 60)
                    .attr('height', 20)
                    .attr('fill', 'rgba(0,0,0,0.8)')
                    .attr('rx', 4);

                tooltip.append('text')
                    .attr('x', xScale(d.k))
                    .attr('y', yScale(d.wcss) - 15)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .attr('font-size', '12px')
                    .text(`K=${d.k}, WCSS=${d.wcss.toFixed(1)}`);

                tooltip.transition().duration(200).style('opacity', 1);
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 6);
                g.selectAll('.tooltip').remove();
            });

        // Add axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'));
        const yAxis = d3.axisLeft(yScale);

        g.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .style('color', '#64748b');

        g.append('g')
            .attr('class', 'axis')
            .call(yAxis)
            .style('color', '#64748b');

        // Add axis labels
        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#374151')
            .text('Number of Clusters (K)');

        g.append('text')
            .attr('x', -innerHeight / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .style('font-size', '14px')
            .style('fill', '#374151')
            .text('WCSS (Within-Cluster Sum of Squares)');

        // Highlight current K value
        const currentKData = elbowData.find(d => d.k === k);
        if (currentKData) {
            g.append('circle')
                .attr('cx', xScale(currentKData.k))
                .attr('cy', yScale(currentKData.wcss))
                .attr('r', 8)
                .attr('fill', '#ef4444')
                .attr('stroke', 'white')
                .attr('stroke-width', 3);
        }

    }, [elbowData, activeTab, k]);

    return (
        <div className="kmeans-clustering fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">K-Means Clustering Simulator</h1>
                    <p className="page-description">
                        Explore unsupervised learning through interactive K-Means clustering.
                        Watch how the algorithm discovers natural groupings in your data
                        by iteratively moving centroids and reassigning points.
                    </p>
                </div>

                <div className="simulation-layout">
                    <div className="visualization-panel">
                        <div className="visualization-header">
                            <div className="tab-navigation">
                                <button
                                    className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('graph')}
                                >
                                    📊 Clustering Visualization
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'elbow' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('elbow')}
                                >
                                    📈 Elbow Method Analysis
                                </button>
                            </div>
                            <div className="clustering-stats">
                                <span className="stat">Iterations: {iterations}</span>
                                <span className="stat">WCSS: {currentWcss.toFixed(2)}</span>
                                <span className="stat">Points: {dataPoints.length}</span>
                            </div>
                        </div>
                        <div className="visualization-container" ref={containerRef}>
                            {activeTab === 'graph' && (
                                <>
                                    {showTips && (
                                        <div className="visualization-instructions">
                                            <div className="tips-content">
                                                <strong>💡 Tips:</strong> Use controls to adjust parameters • Watch centroids move • Toggle Voronoi to see decision boundaries
                                                {isManualMode && (
                                                    <span className="manual-mode-tip">
                                                        • <strong>Manual Mode:</strong> Drag centroids to reposition them and see immediate cluster reassignment
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                className="dismiss-tips-btn"
                                                onClick={() => setShowTips(false)}
                                                title="Hide tips"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    <svg
                                        ref={svgRef}
                                        className="clustering-svg"
                                        key={`graph-${activeTab}-${dataPoints.length}`}
                                    ></svg>
                                </>
                            )}

                            {activeTab === 'elbow' && (
                                <div className="elbow-method-container">
                                    <h3 className="elbow-title">Elbow Method Analysis</h3>
                                    <div className="elbow-chart" id="elbow-chart"></div>
                                    <div className="elbow-explanation">
                                        <p><strong>How to read this chart:</strong></p>
                                        <ul>
                                            <li>Look for the "elbow" point where the line starts to flatten</li>
                                            <li>This indicates the optimal number of clusters (K)</li>
                                            <li>After the elbow, adding more clusters doesn't significantly reduce WCSS</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Algorithm Controls - Now positioned below the graph */}
                        <div className="algorithm-controls-section">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Algorithm Controls</h3>
                                </div>
                                <div className="card-body">
                                    <div className="algorithm-controls">
                                        <button
                                            onClick={runKMeansIteration}
                                            className="btn btn-primary"
                                            disabled={isAnimating}
                                        >
                                            {isAnimating ? 'Running...' : 'Run One Iteration'}
                                        </button>
                                        <button
                                            onClick={runFullAlgorithm}
                                            className="btn btn-secondary"
                                            disabled={isAnimating}
                                        >
                                            {isAnimating ? 'Running...' : 'Run Until Convergence'}
                                        </button>
                                        <button
                                            onClick={resetAlgorithm}
                                            className="btn btn-outline"
                                            disabled={isAnimating}
                                        >
                                            Reset Algorithm
                                        </button>
                                        <button
                                            onClick={() => calculateElbowMethod(dataPoints)}
                                            className="btn btn-outline"
                                            disabled={isAnimating}
                                        >
                                            📊 Calculate Elbow Method
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                                        <option value="customer">Customer Segmentation</option>
                                        <option value="iris">Iris Dataset</option>
                                        <option value="blobs">Synthetic Blobs</option>
                                        <option value="random">Randomized Data</option>
                                    </select>
                                    <p className="dataset-description">
                                        {datasets[selectedDataset]?.description}
                                    </p>
                                    {selectedDataset === 'random' && (
                                        <button
                                            onClick={randomizeDataset}
                                            className="btn btn-outline btn-sm"
                                            disabled={isAnimating}
                                        >
                                            🎲 Generate New Random Data
                                        </button>
                                    )}
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
                                        <label className="label">Number of Clusters (K)</label>
                                        <input
                                            type="range"
                                            min="2"
                                            max="6"
                                            value={k}
                                            onChange={(e) => setK(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{k}</span>
                                        <small className="parameter-help">Optimal K for this dataset: {datasets[selectedDataset]?.optimalK}</small>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Animation Speed</label>
                                        <input
                                            type="range"
                                            min="200"
                                            max="2000"
                                            step="100"
                                            value={animationSpeed}
                                            onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span className="value-display">{animationSpeed}ms</span>
                                    </div>

                                    <div className="input-group">
                                        <label className="label">Initialization Method</label>
                                        <select
                                            value={initializationMethod}
                                            onChange={(e) => {
                                                const method = e.target.value as 'random' | 'kmeans++' | 'manual';
                                                setInitializationMethod(method);
                                                setIsManualMode(method === 'manual');
                                            }}
                                            className="input"
                                        >
                                            <option value="random">Random</option>
                                            <option value="kmeans++">K-means++</option>
                                            <option value="manual">Manual (Drag & Drop)</option>
                                        </select>
                                        <small className="parameter-help">
                                            {initializationMethod === 'random'
                                                ? 'Random centroid placement'
                                                : initializationMethod === 'kmeans++'
                                                    ? 'Smart initialization for better results'
                                                    : 'Drag centroids to manually position them'}
                                        </small>
                                    </div>

                                    <div className="checkbox-group">
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={showVoronoi}
                                                onChange={(e) => setShowVoronoi(e.target.checked)}
                                            />
                                            Show Voronoi Diagram
                                        </label>
                                        <label className="control-label">
                                            <input
                                                type="checkbox"
                                                checked={showElbowMethod}
                                                onChange={(e) => setShowElbowMethod(e.target.checked)}
                                            />
                                            Show Elbow Method
                                        </label>
                                        {!showTips && (
                                            <label className="control-label show-tips-control">
                                                <button
                                                    className="show-tips-btn-inline"
                                                    onClick={() => setShowTips(true)}
                                                    title="Show tips"
                                                >
                                                    💡 Show Tips
                                                </button>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Performance Metrics</h3>
                            </div>
                            <div className="card-body">
                                <div className="metrics-display">
                                    <div className="metric-item">
                                        <span className="metric-label">Current WCSS:</span>
                                        <span className="metric-value">{currentWcss.toFixed(2)}</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Iterations:</span>
                                        <span className="metric-value">{iterations}</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Convergence:</span>
                                        <span className="metric-value">
                                            {wcssHistory.length > 1 &&
                                                Math.abs(wcssHistory[wcssHistory.length - 1] - wcssHistory[wcssHistory.length - 2]) < 0.1
                                                ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Understanding K-Means Clustering</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>How K-Means Works</h4>
                                <div className="algorithm-steps">
                                    <div className="step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <strong>Initialize:</strong> Randomly place K centroids in the data space
                                            <div className="step-detail">
                                                The algorithm starts by placing K centroids at random positions. The number K must be specified beforehand.
                                                Different initialization methods (Random, K-Means++) can affect the final results.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Assign:</strong> Assign each data point to the nearest centroid
                                            <div className="step-detail">
                                                For each data point, calculate the Euclidean distance to all centroids and assign it to the closest one.
                                                This creates the initial clusters based on proximity.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Update:</strong> Move each centroid to the center of its assigned points
                                            <div className="step-detail">
                                                Calculate the mean position of all points assigned to each centroid and move the centroid there.
                                                This step optimizes the centroid positions to better represent their clusters.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">4</div>
                                        <div className="step-content">
                                            <strong>Repeat:</strong> Continue until centroids stop moving significantly
                                            <div className="step-detail">
                                                The algorithm repeats steps 2 and 3 until convergence. Convergence occurs when centroids
                                                move less than a threshold distance or after a maximum number of iterations.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h4>Key Concepts</h4>
                                <div className="concepts-grid">
                                    <div className="concept-item">
                                        <h5>🎯 Centroids</h5>
                                        <p>The center points of each cluster. They represent the "average" position of all points in that cluster and are updated iteratively to minimize the total distance to their assigned points.</p>
                                    </div>
                                    <div className="concept-item">
                                        <h5>📊 WCSS (Within-Cluster Sum of Squares)</h5>
                                        <p>A measure of cluster quality that calculates the sum of squared distances from each point to its cluster centroid. Lower WCSS indicates tighter, more cohesive clusters.</p>
                                    </div>
                                    <div className="concept-item">
                                        <h5>🔄 Convergence</h5>
                                        <p>The algorithm stops when centroids stop moving significantly between iterations. This indicates the clusters have stabilized and further iterations won't improve the results.</p>
                                    </div>
                                    <div className="concept-item">
                                        <h5>🔢 K Value</h5>
                                        <p>The number of clusters to find, which must be specified beforehand. Choosing the right K is crucial - too few clusters may miss important patterns, while too many may over-segment the data.</p>
                                    </div>
                                </div>

                                <h4>Real-World Applications</h4>
                                <div className="applications-grid">
                                    <div className="application-item">
                                        <h5>🛍️ Customer Segmentation</h5>
                                        <p>Group customers by purchasing behavior, demographics, and preferences to create targeted marketing campaigns and personalized experiences.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>🖼️ Image Compression</h5>
                                        <p>Reduce image file sizes by clustering similar pixel colors and replacing them with representative colors, maintaining visual quality while reducing storage.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>🧬 Gene Expression Analysis</h5>
                                        <p>Identify groups of genes that are co-expressed or have similar functions, helping researchers understand biological processes and disease mechanisms.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>📚 Document Clustering</h5>
                                        <p>Organize large collections of documents by topic similarity, enabling better search, recommendation systems, and content management.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>📊 Market Research</h5>
                                        <p>Identify distinct market segments based on consumer behavior, preferences, and demographics to inform product development and marketing strategies.</p>
                                    </div>
                                    <div className="application-item">
                                        <h5>🏥 Medical Diagnosis</h5>
                                        <p>Group patients with similar symptoms or genetic profiles to identify disease subtypes and develop personalized treatment plans.</p>
                                    </div>
                                </div>

                                <h4>Algorithm Limitations & Best Practices</h4>
                                <div className="limitations-grid">
                                    <div className="limitation-item">
                                        <h5>⚠️ Limitations</h5>
                                        <ul>
                                            <li><strong>Spherical Clusters:</strong> Works best with circular/spherical clusters</li>
                                            <li><strong>Fixed K:</strong> Requires knowing the number of clusters beforehand</li>
                                            <li><strong>Local Optima:</strong> May get stuck in suboptimal solutions</li>
                                            <li><strong>Outliers:</strong> Sensitive to outliers and noise</li>
                                            <li><strong>Scale Dependent:</strong> Features must be on similar scales</li>
                                        </ul>
                                    </div>
                                    <div className="limitation-item">
                                        <h5>✅ Best Practices</h5>
                                        <ul>
                                            <li><strong>Normalize Data:</strong> Scale features to similar ranges</li>
                                            <li><strong>Multiple Runs:</strong> Run algorithm several times with different initializations</li>
                                            <li><strong>Elbow Method:</strong> Use WCSS plots to find optimal K</li>
                                            <li><strong>K-Means++:</strong> Use better initialization to avoid poor local optima</li>
                                            <li><strong>Preprocessing:</strong> Handle outliers and missing data appropriately</li>
                                        </ul>
                                    </div>
                                </div>

                                <h4>Understanding the Randomized Dataset</h4>
                                <p>
                                    The randomized dataset feature allows you to explore how K-Means performs on different data distributions.
                                    Each time you click "Generate New Random Data," you'll get:
                                </p>
                                <ul>
                                    <li><strong>Variable Cluster Count:</strong> 2-4 clusters with different numbers of points</li>
                                    <li><strong>Different Shapes:</strong> Both circular and elliptical clusters with random orientations</li>
                                    <li><strong>Varying Separation:</strong> Some clusters may overlap, others may be well-separated</li>
                                    <li><strong>Random Noise:</strong> Points have slight random variations to simulate real-world data</li>
                                </ul>
                                <p>
                                    This helps you understand how K-Means handles different challenges like non-spherical clusters,
                                    varying cluster sizes, and overlapping data - common issues in real-world applications.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedDataset === 'customer' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Customer Segmentation Dataset - Feature Analysis</h3>
                        </div>
                        <div className="card-body">
                            <div className="feature-analysis">
                                <h4>Dataset Features Explained</h4>
                                <div className="features-grid">
                                    <div className="feature-item">
                                        <div className="feature-header">
                                            <span className="feature-name">Age</span>
                                            <span className="feature-range">22-78 years</span>
                                        </div>
                                        <p className="feature-description">
                                            The age of the customer. This feature helps identify different life stages and
                                            spending patterns that vary significantly across age groups.
                                        </p>
                                        <div className="feature-insights">
                                            <strong>Key Insights:</strong>
                                            <ul>
                                                <li>Young customers (22-35) often have different spending priorities</li>
                                                <li>Middle-aged customers (35-55) may have more stable spending patterns</li>
                                                <li>Senior customers (55+) tend to be more conservative with spending</li>
                                                <li>Age often correlates with income level and financial responsibilities</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="feature-item">
                                        <div className="feature-header">
                                            <span className="feature-name">Spending Score</span>
                                            <span className="feature-range">11-92 points</span>
                                        </div>
                                        <p className="feature-description">
                                            A normalized score (0-100) representing how much a customer spends relative to
                                            their income and typical spending patterns. Higher scores indicate higher spending.
                                        </p>
                                        <div className="feature-insights">
                                            <strong>Key Insights:</strong>
                                            <ul>
                                                <li>High scores (80-92): Premium customers who spend freely</li>
                                                <li>Medium scores (40-70): Moderate spenders with balanced budgets</li>
                                                <li>Low scores (11-30): Conservative spenders or budget-conscious customers</li>
                                                <li>Combined with age, reveals spending behavior patterns</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="clustering-insights">
                                    <h4>How K-Means Discovers Customer Segments</h4>
                                    <div className="insights-grid">
                                        <div className="insight-item">
                                            <h5>🎯 Young High Spenders (Cluster 1)</h5>
                                            <p>Young customers (22-28) with high spending scores (85-92). These are typically early-career professionals or young adults with disposable income who enjoy premium products and experiences.</p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>💰 Young Conservative (Cluster 2)</h5>
                                            <p>Young customers (22-28) with low spending scores (11-18). These might be students, early-career individuals, or those saving for major purchases like homes or education.</p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>💎 Middle-aged Affluent (Cluster 3)</h5>
                                            <p>Middle-aged customers (42-48) with high spending scores (85-91). These are typically established professionals with stable incomes who can afford premium products.</p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>🏠 Middle-aged Practical (Cluster 4)</h5>
                                            <p>Middle-aged customers (42-48) with low spending scores (12-18). These customers prioritize practical purchases and may be focused on family expenses or long-term savings.</p>
                                        </div>
                                        <div className="insight-item">
                                            <h5>👴 Senior Conservative (Cluster 5)</h5>
                                            <p>Senior customers (62-68) with moderate spending scores (22-28). These customers are typically retired or near retirement, focusing on value and practical purchases.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="business-applications">
                                    <h4>Business Applications of Customer Segmentation</h4>
                                    <div className="applications-grid">
                                        <div className="application-item">
                                            <h5>📧 Targeted Marketing</h5>
                                            <p>Send different promotional campaigns to each segment. Young high spenders might receive premium product ads, while conservative customers get value-focused messaging.</p>
                                        </div>
                                        <div className="application-item">
                                            <h5>🛍️ Product Recommendations</h5>
                                            <p>Recommend products based on segment characteristics. High spenders get premium options, while conservative customers see budget-friendly alternatives.</p>
                                        </div>
                                        <div className="application-item">
                                            <h5>💳 Pricing Strategies</h5>
                                            <p>Develop segment-specific pricing. High spenders might pay premium prices, while conservative customers get discounts and value bundles.</p>
                                        </div>
                                        <div className="application-item">
                                            <h5>📊 Inventory Management</h5>
                                            <p>Stock products based on segment preferences. High-spending segments get premium inventory, while conservative segments get value products.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="algorithm-behavior">
                                    <h4>How K-Means Identifies These Segments</h4>
                                    <div className="process-steps">
                                        <div className="process-step">
                                            <div className="step-number">1</div>
                                            <div className="step-content">
                                                <strong>Distance Calculation</strong>
                                                <p>K-Means calculates Euclidean distance between each customer and cluster centroids using both Age and Spending Score dimensions.</p>
                                            </div>
                                        </div>
                                        <div className="process-step">
                                            <div className="step-number">2</div>
                                            <div className="step-content">
                                                <strong>Cluster Assignment</strong>
                                                <p>Each customer is assigned to the nearest centroid, creating natural groupings based on similar age and spending patterns.</p>
                                            </div>
                                        </div>
                                        <div className="process-step">
                                            <div className="step-number">3</div>
                                            <div className="step-content">
                                                <strong>Centroid Updates</strong>
                                                <p>Centroids move to the center of their assigned customers, refining the cluster boundaries to better represent each segment.</p>
                                            </div>
                                        </div>
                                        <div className="process-step">
                                            <div className="step-number">4</div>
                                            <div className="step-content">
                                                <strong>Convergence</strong>
                                                <p>The algorithm stops when centroids stop moving significantly, resulting in stable customer segments that can be used for business decisions.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

export default KMeansClustering;
