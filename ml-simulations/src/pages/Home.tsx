import React from 'react';

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
                            <a
                                href="#features"
                                className="btn btn-primary"
                            >
                                Learn More
                            </a>
                            <a
                                href="#getting-started"
                                className="btn btn-outline"
                            >
                                Get Started
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


                {/* Getting Started */}
                <section id="getting-started" className="getting-started">
                    <div className="getting-started-header">
                        <h2 className="getting-started-title">Ready to Explore?</h2>
                        <p className="getting-started-description">
                            All simulations are available in the sidebar. Start with any concept that interests you
                            and learn through hands-on experimentation.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card step-card">
                            <div className="card-body">
                                <div className="step-number">1</div>
                                <h3 className="step-title">Choose a Simulation</h3>
                                <p className="step-description">
                                    Browse the sidebar to find simulations organized by category - from distance metrics to clustering algorithms.
                                </p>
                            </div>
                        </div>
                        <div className="card step-card">
                            <div className="card-body">
                                <div className="step-number">2</div>
                                <h3 className="step-title">Experiment Freely</h3>
                                <p className="step-description">
                                    Adjust parameters, change inputs, and see how the algorithm responds in real-time.
                                </p>
                            </div>
                        </div>
                        <div className="card step-card">
                            <div className="card-body">
                                <div className="step-number">3</div>
                                <h3 className="step-title">Learn Through Doing</h3>
                                <p className="step-description">
                                    Build intuition by seeing the mathematics in action, not just on paper.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

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

export default Home;
