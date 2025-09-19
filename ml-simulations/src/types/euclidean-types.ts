// TypeScript interfaces for Euclidean Distance Explorer
// Following established patterns from existing simulations

export interface DataPoint {
    id: string;
    x: number;
    y: number;
    label?: string;
    color?: string;
    cluster?: number;
    isSelected?: boolean;
    isCentroid?: boolean;
    originalCluster?: number;
}

export interface DistanceCalculation {
    pointA: DataPoint;
    pointB: DataPoint;
    distance: number;
    isHighlighted: boolean;
}

export interface AlgorithmState {
    mode: 'explore' | 'kmeans' | 'knn';
    k: number;
    centroids: DataPoint[];
    assignments: { [pointId: string]: number };
    selectedPoint?: DataPoint;
}

export interface Dataset {
    name: string;
    description: string;
    data: DataPoint[];
    optimalK: number;
    features: string[];
}

export interface DistanceMatrix {
    [pointId: string]: {
        [otherPointId: string]: number;
    };
}

export interface KNNResult {
    point: DataPoint;
    neighbors: DataPoint[];
    predictedClass?: string;
    confidence?: number;
}

export interface KMeansResult {
    centroids: DataPoint[];
    assignments: { [pointId: string]: number };
    wcss: number;
    converged: boolean;
    iterations: number;
}
