import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Simulation {
    id: string;
    title: string;
    description: string;
    path: string;
    status: 'available' | 'coming-soon' | 'beta';
    category: string;
}

const simulations: Simulation[] = [
    // STATISTICS - Foundation concepts
    {
        id: 'normal-distribution',
        title: 'Normal Distribution',
        description: 'Explore the bell curve and understand statistical distributions',
        path: '/normal-distribution',
        status: 'available',
        category: 'Statistics'
    },
    {
        id: 'central-limit-theorem',
        title: 'Central Limit Theorem',
        description: 'Watch sample means converge to normality from any distribution',
        path: '/central-limit-theorem',
        status: 'available',
        category: 'Statistics'
    },
    // REGRESSION - Basic predictive modeling
    {
        id: 'linear-regression',
        title: 'Linear Regression',
        description: 'Visualize the line of best fit and understand gradient descent',
        path: '/linear-regression',
        status: 'available',
        category: 'Regression'
    },
    // CLASSIFICATION - Categorical prediction
    {
        id: 'decision-trees',
        title: 'Decision Trees',
        description: 'Build and visualize decision trees with interactive feature selection',
        path: '/decision-trees',
        status: 'available',
        category: 'Classification'
    },
    // CLUSTERING - Unsupervised learning
    {
        id: 'k-means',
        title: 'K-Means Clustering',
        description: 'Watch clusters form and move with different initialization strategies',
        path: '/kmeans-clustering',
        status: 'available',
        category: 'Clustering'
    },
    // DISTANCE METRICS - Fundamental concepts
    {
        id: 'cosine-similarity',
        title: 'Cosine Similarity',
        description: 'Explore how vectors relate to each other through angle and magnitude',
        path: '/cosine-similarity',
        status: 'available',
        category: 'Distance Metrics'
    },
    // DEEP LEARNING - Advanced concepts
    {
        id: 'neural-networks',
        title: 'Neural Networks',
        description: 'Explore how neurons connect and learn through backpropagation',
        path: '/neural-networks',
        status: 'coming-soon',
        category: 'Deep Learning'
    },
    {
        id: 'perceptron-learning',
        title: 'Perceptron Learning Simulator',
        description: 'Understand the foundation of neural networks with single-layer perceptrons',
        path: '/perceptron-learning',
        status: 'coming-soon',
        category: 'Deep Learning'
    },
    {
        id: 'multilayer-perceptron',
        title: 'Multi-layer Perceptron Explorer',
        description: 'Explore how multiple layers create complex decision boundaries',
        path: '/multilayer-perceptron',
        status: 'coming-soon',
        category: 'Deep Learning'
    },
    {
        id: 'cnn-demo',
        title: 'Convolutional Neural Network Demo',
        description: 'Visualize how CNNs process images through convolutional layers',
        path: '/cnn-demo',
        status: 'coming-soon',
        category: 'Deep Learning'
    },
    // Additional STATISTICS concepts
    {
        id: 'bayes-theorem',
        title: 'Bayes Theorem',
        description: 'Understand conditional probability and Bayesian inference',
        path: '/bayes-theorem',
        status: 'available',
        category: 'Statistics'
    },
    {
        id: 'correlation-causation',
        title: 'Correlation vs Causation',
        description: 'Learn to distinguish between correlation and causal relationships',
        path: '/correlation-causation',
        status: 'coming-soon',
        category: 'Statistics'
    },
    // Additional DISTANCE METRICS
    {
        id: 'euclidean-distance',
        title: 'Euclidean Distance Explorer',
        description: 'Visualize the most common distance metric in machine learning',
        path: '/euclidean-distance',
        status: 'coming-soon',
        category: 'Distance Metrics'
    },
    {
        id: 'manhattan-euclidean',
        title: 'Manhattan Distance vs Euclidean',
        description: 'Compare different distance metrics and their applications',
        path: '/manhattan-euclidean',
        status: 'coming-soon',
        category: 'Distance Metrics'
    },
    // Additional CLASSIFICATION methods
    {
        id: 'knn-explorer',
        title: 'K-Nearest Neighbors (KNN) Explorer',
        description: 'Explore instance-based learning with interactive KNN visualization',
        path: '/k-nearest-neighbors',
        status: 'available',
        category: 'Classification'
    },
    {
        id: 'naive-bayes',
        title: 'Naive Bayes Classifier',
        description: 'Understand probabilistic classification with Bayes theorem',
        path: '/naive-bayes',
        status: 'coming-soon',
        category: 'Classification'
    },
    {
        id: 'logistic-regression',
        title: 'Logistic Regression Visualizer',
        description: 'Visualize how logistic regression creates decision boundaries',
        path: '/logistic-regression',
        status: 'available',
        category: 'Classification'
    },
    // Additional CLUSTERING methods
    {
        id: 'hierarchical-clustering',
        title: 'Hierarchical Clustering Explorer',
        description: 'Watch clusters form in a tree-like structure with different linkage methods',
        path: '/hierarchical-clustering',
        status: 'coming-soon',
        category: 'Clustering'
    }
];

const Sidebar: React.FC = () => {
    const location = useLocation();

    const groupedSimulations = simulations.reduce((acc, sim) => {
        if (!acc[sim.category]) {
            acc[sim.category] = [];
        }
        acc[sim.category].push(sim);
        return acc;
    }, {} as Record<string, Simulation[]>);

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                <div className="sidebar-section">
                    <h3 className="sidebar-title">Available Simulations</h3>
                    <p className="sidebar-description">
                        Interactive tools to explore machine learning concepts
                    </p>
                </div>

                {Object.entries(groupedSimulations).map(([category, sims]) => (
                    <div key={category} className="sidebar-section">
                        <h4 className="sidebar-category">{category}</h4>
                        <nav className="sidebar-nav">
                            {sims.map((sim) => (
                                <Link
                                    key={sim.id}
                                    to={sim.path}
                                    className={`sidebar-link ${location.pathname === sim.path ? 'active' : ''} ${sim.status}`}
                                >
                                    <div className="sidebar-link-content">
                                        <span className="sidebar-link-title">{sim.title}</span>
                                        <span className="sidebar-link-description">{sim.description}</span>
                                        {sim.status === 'coming-soon' && (
                                            <span className="sidebar-link-badge">Coming Soon</span>
                                        )}
                                        {sim.status === 'beta' && (
                                            <span className="sidebar-link-badge beta">Beta</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </nav>
                    </div>
                ))}

                <div className="sidebar-footer">
                    <p className="text-xs text-secondary-500">
                        Built for SVA Continuing Education
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
