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
import EuclideanDistance from './pages/EuclideanDistance';
import './pages/EuclideanDistance.css';
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
import LogisticRegression from './pages/LogisticRegression';
import './pages/LogisticRegression.css';
import KNearestNeighbors from './pages/KNearestNeighbors';
import './pages/KNearestNeighbors.css';
import PerceptronAnatomy from './pages/PerceptronAnatomy';
import './pages/PerceptronAnatomy.css';
import PerceptronLearning from './pages/PerceptronLearning';
import './pages/PerceptronLearning.css';
import CorrelationCausation from './pages/CorrelationCausation';
import './pages/CorrelationCausation.css';
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
                <Route path="/euclidean-distance" element={<EuclideanDistance />} />
                <Route path="/decision-trees" element={<DecisionTree />} />
                <Route path="/kmeans-clustering" element={<KMeansClustering />} />
                <Route path="/linear-regression" element={<LinearRegression />} />
                <Route path="/central-limit-theorem" element={<CentralLimitTheorem />} />
                <Route path="/normal-distribution" element={<NormalDistribution />} />
                <Route path="/bayes-theorem" element={<BayesTheorem />} />
                <Route path="/logistic-regression" element={<LogisticRegression />} />
                <Route path="/k-nearest-neighbors" element={<KNearestNeighbors />} />
                <Route path="/perceptron-anatomy" element={<PerceptronAnatomy />} />
                <Route path="/perceptron-learning" element={<PerceptronLearning />} />
                <Route path="/correlation-causation" element={<CorrelationCausation />} />
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