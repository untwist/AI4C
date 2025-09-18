import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
    const location = useLocation();

    return (
        <header className="header">
            <div className="container">
                <Link to="/" className="header-logo">
                    <h1 className="text-xl font-bold text-primary">
                        ML Simulations
                    </h1>
                    <p className="text-sm text-secondary-600">
                        Interactive Learning Platform
                    </p>
                </Link>

                <nav className="header-nav">
                    <Link
                        to="/"
                        className={`btn ${location.pathname === '/' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        Home
                    </Link>
                    <Link
                        to="/about"
                        className={`btn ${location.pathname === '/about' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        About
                    </Link>
                </nav>
            </div>
        </header>
    );
};

export default Header;
