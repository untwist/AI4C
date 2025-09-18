import { StrictMode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/design-system.css';
import Header from './components/Header';
import './components/Header.css';
import Sidebar from './components/Sidebar';
import './components/Sidebar.css';
import Home from './pages/Home';
import './pages/Home.css';
import CosineSimilarity from './pages/CosineSimilarity';
import './pages/CosineSimilarity.css';
import DecisionTree from './pages/DecisionTree';
import './pages/DecisionTree.css';
import KMeansClustering from './pages/KMeansClustering';
import './pages/KMeansClustering.css';
import LinearRegression from './pages/LinearRegression';
import './pages/LinearRegression.css';
import CentralLimitTheorem from './pages/CentralLimitTheorem';
import './pages/CentralLimitTheorem.css';
import NormalDistribution from './pages/NormalDistribution';
import './pages/NormalDistribution.css';
import BayesTheorem from './pages/BayesTheorem';
import './pages/BayesTheorem.css';
import About from './pages/About';
import './pages/About.css';
import './App.css';

function App() {
  return (
    <StrictMode>
      <Router basename="/AI4C">
        <div className="app">
          <Header />
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cosine-similarity" element={<CosineSimilarity />} />
                <Route path="/decision-trees" element={<DecisionTree />} />
                <Route path="/kmeans-clustering" element={<KMeansClustering />} />
                <Route path="/linear-regression" element={<LinearRegression />} />
                <Route path="/central-limit-theorem" element={<CentralLimitTheorem />} />
                <Route path="/normal-distribution" element={<NormalDistribution />} />
                <Route path="/bayes-theorem" element={<BayesTheorem />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </StrictMode>
  );
}

export default App;