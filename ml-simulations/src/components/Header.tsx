import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="container">
                <div className="flex items-center justify-between">
                    <Link to="/" className="header-logo">
                        <h1 className="text-xl font-bold text-primary">
                            ML Simulations
                        </h1>
                        <p className="text-sm text-secondary-600">
                            Interactive Learning Platform
                        </p>
                    </Link>

                    <nav className="header-nav">
                        <Link to="/" className="btn btn-outline">
                            Home
                        </Link>
                        <a
                            href="https://github.com/yourusername/ml-simulations"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                        >
                            GitHub
                        </a>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
