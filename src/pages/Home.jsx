import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, addPlayer, savePlayers, createNewRound, saveActiveRound, getActiveRound } from '../utils/storage';

export default function Home() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [newName, setNewName] = useState('');
  const [holeCount, setHoleCount] = useState(18);
  const [betAmount, setBetAmount] = useState(1);
  const [courseName, setCourseName] = useState('');
  const [hasActive, setHasActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPlayers(getPlayers());
    setHasActive(!!getActiveRound());
  }, []);

  function handleAddPlayer() {
    const name = newName.trim();
    if (!name) return;
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Player name already exists');
      return;
    }
    const player = addPlayer(name);
    setPlayers(prev => [...prev, player]);
    setNewName('');
    setError('');
  }

  function togglePlayer(player) {
    setSelectedPlayers(prev => {
      if (prev.find(p => p.id === player.id)) {
        return prev.filter(p => p.id !== player.id);
      }
      if (prev.length >= 3) {
        setError('Only 3 players per round');
        return prev;
      }
      setError('');
      return [...prev, player];
    });
  }

  function handleRemovePlayer(id) {
    const updated = players.filter(p => p.id !== id);
    savePlayers(updated);
    setPlayers(updated);
    setSelectedPlayers(prev => prev.filter(p => p.id !== id));
  }

  function handleStartRound() {
    if (selectedPlayers.length !== 3) {
      setError('Select exactly 3 players');
      return;
    }
    const round = createNewRound(selectedPlayers, holeCount, betAmount, courseName);
    saveActiveRound(round);
    navigate('/scorecard');
  }

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-icon">⛳</div>
        <h1 className="hero-title">Split Sixes</h1>
        <p className="hero-sub">Golf Points Game</p>
      </div>

      {hasActive && (
        <div className="card resume-card">
          <p>You have an active round in progress.</p>
          <button className="btn btn-gold" onClick={() => navigate('/scorecard')}>
            Resume Round →
          </button>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Start New Round</h2>

        <label className="field-label">Course Name <span className="optional">(optional)</span></label>
        <input
          className="input"
          placeholder="e.g. Augusta National"
          value={courseName}
          onChange={e => setCourseName(e.target.value)}
        />

        <div className="row-2">
          <div>
            <label className="field-label">Holes</label>
            <select className="input" value={holeCount} onChange={e => setHoleCount(Number(e.target.value))}>
              <option value={9}>9 Holes</option>
              <option value={18}>18 Holes</option>
            </select>
          </div>
          <div>
            <label className="field-label">Bet ($/point)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.25"
              value={betAmount}
              onChange={e => setBetAmount(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Add Player to Roster</h2>
        <div className="input-row">
          <input
            className="input"
            placeholder="Player name"
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
          />
          <button className="btn btn-gold" onClick={handleAddPlayer}>Add</button>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">
          Select 3 Players
          <span className="badge">{selectedPlayers.length}/3</span>
        </h2>

        {players.length === 0 && (
          <p className="empty-msg">No players yet — add some above.</p>
        )}

        <div className="player-list">
          {players.map(player => {
            const selected = !!selectedPlayers.find(p => p.id === player.id);
            return (
              <div key={player.id} className={`player-row ${selected ? 'selected' : ''}`}>
                <button className="player-select" onClick={() => togglePlayer(player)}>
                  <span className="player-check">{selected ? '✓' : ''}</span>
                  <span className="player-name">{player.name}</span>
                </button>
                <button
                  className="btn-icon"
                  title="Remove player"
                  onClick={() => handleRemovePlayer(player.id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button
          className="btn btn-primary btn-full"
          disabled={selectedPlayers.length !== 3}
          onClick={handleStartRound}
        >
          Start Round
        </button>
      </div>
    </div>
  );
}
