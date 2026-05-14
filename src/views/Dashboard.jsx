"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';

export default function Dashboard() {
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setError('');
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to log out');
    }
  }

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><User size={48} color="var(--gold-400)" /></div>
        <h1 className="hero-title">Dashboard</h1>
        <p className="hero-sub">Welcome back!</p>
      </div>

      <div className="card">
        {error && <p className="error-msg">{error}</p>}
        
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '0.5rem' }}>
          <strong>Logged in as:</strong><br />
          <span style={{ color: 'var(--text-muted)' }}>{currentUser?.email || 'Unknown User'}</span>
        </div>

        <button className="btn btn-outline btn-full" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      <div className="card">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-row">
          <button className="btn btn-gold" onClick={() => navigate('/')}>
            Start a Round →
          </button>
        </div>
      </div>
    </div>
  );
}
