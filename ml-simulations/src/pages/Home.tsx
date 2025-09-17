import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="home fade-in">
            <div className="container">
                {/* Hero Section */}
                <section className="hero">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Interactive Machine Learning Simulations
                        </h1>
                        <p className="hero-description">
                            Explore complex ML concepts through hands-on, visual simulations.
                            Perfect for students and professionals who want to understand the
                            mathematics behind machine learning algorithms.
                        </p>
                        <div className="hero-actions">
                            <Link to="/cosine-similarity" className="btn btn-primary">
                                Try Cosine Similarity
                            </Link>
                            <a
                                href="#features"
                                className="btn btn-outline"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="features">
                    <div className="features-header">
                        <h2 className="features-title">Why Interactive Learning?</h2>
                        <p className="features-description">
                            Traditional textbooks can make ML concepts feel abstract. Our simulations
                            bring these ideas to life through visual, interactive experiences.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card feature-card">
                            <div className="card-body">
                                <div className="feature-icon">🎯</div>
                                <h3 className="feature-title">Visual Understanding</h3>
                                <p className="feature-description">
                                    See how algorithms work in real-time with dynamic visualizations
                                    that respond to your input.
                                </p>
                            </div>
                        </div>

                        <div className="card feature-card">
                            <div className="card-body">
                                <div className="feature-icon">⚡</div>
                                <h3 className="feature-title">Immediate Feedback</h3>
                                <p className="feature-description">
                                    Experiment with parameters and see instant results. Learn through
                                    trial and error in a safe environment.
                                </p>
                            </div>
                        </div>

                        <div className="card feature-card">
                            <div className="card-body">
                                <div className="feature-icon">🎓</div>
                                <h3 className="feature-title">Built for Education</h3>
                                <p className="feature-description">
                                    Designed specifically for SVA Continuing Education students
                                    in creative industries.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Available Simulations */}
                <section className="simulations">
                    <div className="simulations-header">
                        <h2 className="simulations-title">Available Simulations</h2>
                        <p className="simulations-description">
                            Start with our foundational concepts and work your way up to
                            advanced algorithms.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card simulation-card">
                            <div className="card-body">
                                <div className="simulation-header">
                                    <h3 className="simulation-title">Cosine Similarity</h3>
                                    <span className="simulation-badge available">Available</span>
                                </div>
                                <p className="simulation-description">
                                    Understand how vectors relate to each other through angle and magnitude.
                                    Perfect for understanding text similarity, recommendation systems, and more.
                                </p>
                                <div className="simulation-features">
                                    <span className="feature-tag">Interactive Vectors</span>
                                    <span className="feature-tag">Real-time Calculation</span>
                                    <span className="feature-tag">Visual Angle Display</span>
                                </div>
                                <Link to="/cosine-similarity" className="btn btn-primary">
                                    Explore Now
                                </Link>
                            </div>
                        </div>

                        <div className="card simulation-card">
                            <div className="card-body">
                                <div className="simulation-header">
                                    <h3 className="simulation-title">Decision Trees</h3>
                                    <span className="simulation-badge coming-soon">Coming Soon</span>
                                </div>
                                <p className="simulation-description">
                                    Build decision trees interactively and see how different features
                                    affect classification boundaries.
                                </p>
                                <div className="simulation-features">
                                    <span className="feature-tag">Interactive Tree Building</span>
                                    <span className="feature-tag">Feature Selection</span>
                                    <span className="feature-tag">Information Gain</span>
                                </div>
                                <button className="btn btn-secondary" disabled>
                                    Coming Soon
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Getting Started */}
                <section className="getting-started">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="getting-started-title">Getting Started</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <h3 className="step-title">Choose a Simulation</h3>
                                    <p className="step-description">
                                        Browse our available simulations and pick one that interests you.
                                    </p>
                                </div>
                                <div className="step">
                                    <div className="step-number">2</div>
                                    <h3 className="step-title">Experiment Freely</h3>
                                    <p className="step-description">
                                        Adjust parameters, change inputs, and see how the algorithm responds.
                                    </p>
                                </div>
                                <div className="step">
                                    <div className="step-number">3</div>
                                    <h3 className="step-title">Learn Through Doing</h3>
                                    <p className="step-description">
                                        Build intuition by seeing the math in action, not just on paper.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Home;
