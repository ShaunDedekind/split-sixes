import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <span className="nav-icon">⛳</span>
        <span className="nav-label">Home</span>
      </NavLink>
      <NavLink to="/scorecard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📋</span>
        <span className="nav-label">Scorecard</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📖</span>
        <span className="nav-label">History</span>
      </NavLink>
      <NavLink to="/leaderboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏆</span>
        <span className="nav-label">Leaders</span>
      </NavLink>
    </nav>
  );
}
