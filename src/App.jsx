import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Scorecard from './pages/Scorecard';
import Summary from './pages/Summary';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scorecard" element={<Scorecard />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/summary/:id" element={<Summary />} />
            <Route path="/history" element={<History />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
        <NavBar />
      </div>
    </BrowserRouter>
  );
}
