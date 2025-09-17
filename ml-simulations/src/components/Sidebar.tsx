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
    {
        id: 'cosine-similarity',
        title: 'Cosine Similarity',
        description: 'Explore how vectors relate to each other through angle and magnitude',
        path: '/cosine-similarity',
        status: 'available',
        category: 'Distance Metrics'
    },
    {
        id: 'decision-trees',
        title: 'Decision Trees',
        description: 'Build and visualize decision trees with interactive feature selection',
        path: '/decision-trees',
        status: 'coming-soon',
        category: 'Classification'
    },
    {
        id: 'k-means',
        title: 'K-Means Clustering',
        description: 'Watch clusters form and move with different initialization strategies',
        path: '/k-means',
        status: 'coming-soon',
        category: 'Clustering'
    },
    {
        id: 'linear-regression',
        title: 'Linear Regression',
        description: 'Visualize the line of best fit and understand gradient descent',
        path: '/linear-regression',
        status: 'coming-soon',
        category: 'Regression'
    },
    {
        id: 'neural-networks',
        title: 'Neural Networks',
        description: 'Explore how neurons connect and learn through backpropagation',
        path: '/neural-networks',
        status: 'coming-soon',
        category: 'Deep Learning'
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
