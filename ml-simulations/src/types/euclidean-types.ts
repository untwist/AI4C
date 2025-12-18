// TypeScript interfaces for Euclidean Distance Simulator
// Refined for design-centric simulations

export interface DataPoint {
    id: string;
    x: number;
    y: number;
    label?: string;
    color?: string;
    isSelected?: boolean;
}

export interface DistanceCalculation {
    pointA: DataPoint;
    pointB: DataPoint;
    distance: number;
    isHighlighted: boolean;
}

export interface Dataset {
    name: string;
    description: string;
    data: DataPoint[];
    optimalK: number;
    features: string[];
}
