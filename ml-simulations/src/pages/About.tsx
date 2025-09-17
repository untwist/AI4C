import React from 'react';

const About: React.FC = () => {
    return (
        <div className="about fade-in">
            <div className="container">
                {/* Header Section */}
                <section className="about-header">
                    <h1 className="about-title">About This Project</h1>
                    <p className="about-subtitle">
                        Interactive Machine Learning Simulations for Creative Education
                    </p>
                </section>

                {/* Course Information */}
                <section className="course-info">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="section-title">SVA Continuing Education Course</h2>
                            <p className="course-description">
                                This interactive website was created as part of the <strong>AI for Creatives: Strategies for Success</strong> course
                                at the School of Visual Arts (SVA) Continuing Education program.
                            </p>

                            <div className="course-details">
                                <div className="course-detail">
                                    <h3>Course Information</h3>
                                    <ul>
                                        <li><strong>Course:</strong> AI for Creatives: Strategies for Success</li>
                                        <li><strong>Course Number:</strong> PDC-3013-OL</li>
                                        <li><strong>Institution:</strong> School of Visual Arts (SVA)</li>
                                        <li><strong>Program:</strong> Continuing Education</li>
                                        <li><strong>Instructor:</strong> Todd Brous, Founder & CEO, Untwist, Inc.</li>
                                    </ul>
                                </div>

                                <div className="course-detail">
                                    <h3>Course Description</h3>
                                    <p>
                                        We are witnessing the rapid adoption of generative artificial intelligence (AI), machine learning (ML),
                                        open innovation, open talent and automation across all areas of society and businesses. The primary goal
                                        of this course is to help students learn about these tools, processes and technologies, and to understand
                                        their disruptive power.
                                    </p>
                                    <p>
                                        By applying the direct use of generative AI tools, we examine their current limitations and how creatives
                                        can adapt to the rapidly changing landscape. Students gain an understanding of the fundamentals of AI, ML,
                                        open innovation, open talent, automation, ethics, bias, business strategy, and more.
                                    </p>
                                </div>
                            </div>

                            <div className="course-links">
                                <a
                                    href="https://sva.edu/academics/continuing-education/courses?instructorName=brous"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                >
                                    View Course Details
                                </a>
                                <a
                                    href="/Fall-2025-CE-PDC-3013-OL-AI-for-Creatives_-Strategies-for-Success.pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                >
                                    Download Syllabus
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Project Purpose */}
                <section className="project-purpose">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="section-title">Project Purpose</h2>
                            <p className="purpose-description">
                                This website serves as a practical demonstration of how machine learning concepts can be made
                                accessible to creative professionals through interactive visualizations. The simulations help
                                bridge the gap between abstract mathematical concepts and practical understanding.
                            </p>

                            <div className="purpose-features">
                                <div className="purpose-feature">
                                    <h3>Educational Focus</h3>
                                    <p>
                                        Designed specifically for creative professionals who may not have extensive technical
                                        backgrounds but need to understand AI and ML concepts for their work.
                                    </p>
                                </div>

                                <div className="purpose-feature">
                                    <h3>Interactive Learning</h3>
                                    <p>
                                        Each simulation allows users to experiment with parameters and see real-time results,
                                        making complex concepts more intuitive and memorable.
                                    </p>
                                </div>

                                <div className="purpose-feature">
                                    <h3>Visual Understanding</h3>
                                    <p>
                                        By representing mathematical concepts visually, users can develop an intuitive understanding
                                        of how algorithms work without getting lost in complex equations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Technology Stack */}
                <section className="technology-stack">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="section-title">Technology Stack</h2>
                            <p className="tech-description">
                                This project is built using modern web technologies to ensure smooth performance
                                and accessibility across different devices.
                            </p>

                            <div className="tech-grid">
                                <div className="tech-item">
                                    <h4>Frontend</h4>
                                    <ul>
                                        <li>React 18 with TypeScript</li>
                                        <li>Vite for fast development</li>
                                        <li>React Router for navigation</li>
                                        <li>CSS3 with custom design system</li>
                                    </ul>
                                </div>

                                <div className="tech-item">
                                    <h4>Visualization</h4>
                                    <ul>
                                        <li>Canvas API for interactive graphics</li>
                                        <li>Custom mathematical libraries</li>
                                        <li>Real-time parameter updates</li>
                                        <li>Responsive design principles</li>
                                    </ul>
                                </div>

                                <div className="tech-item">
                                    <h4>Deployment</h4>
                                    <ul>
                                        <li>Static site generation</li>
                                        <li>GitHub Pages hosting</li>
                                        <li>Modern browser compatibility</li>
                                        <li>Mobile-responsive design</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Copyright Notice */}
                <section className="copyright-section">
                    <div className="copyright-notice">
                        <p>&copy; 2025, Todd Brous. All rights reserved.</p>
                        <p className="copyright-subtext">
                            Created for SVA Continuing Education - AI for Creatives: Strategies for Success
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About;
