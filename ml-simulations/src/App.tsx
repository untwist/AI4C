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
import './App.css';

function App() {
  return (
    <StrictMode>
      <Router>
        <div className="app">
          <Header />
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cosine-similarity" element={<CosineSimilarity />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </StrictMode>
  );
}

export default App;