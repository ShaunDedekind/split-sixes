"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPlayers, addPlayer, savePlayers, createNewRound, saveActiveRound, getActiveRound, clearActiveRound, getCourses, seedPresets } from '../utils/storage';
import { PRESET_COURSES } from '../data/presets';
import { Flag } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [newName, setNewName] = useState('');
  const [holeCount, setHoleCount] = useState(18);
  const [betAmount, setBetAmount] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [hasActive, setHasActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    seedPresets(PRESET_COURSES);
    setPlayers(getPlayers());
    setCourses(getCourses());
    setHasActive(!!getActiveRound());
  }, []);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) ?? null;

  // When a course is selected, sync hole count to the course
  useEffect(() => {
    if (selectedCourse) {
      setHoleCount(selectedCourse.holeCount);
    }
  }, [selectedCourseId]);

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
    
    setSelectedPlayers(prev => {
      if (prev.length < 3) {
        return [...prev, player];
      }
      return prev;
    });
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
    // Embed current handicaps from roster into the round players
    const allPlayers = getPlayers();
    const roundPlayers = selectedPlayers.map(p => {
      const fresh = allPlayers.find(rp => rp.id === p.id);
      return fresh ?? p;
    });
    const round = createNewRound(roundPlayers, holeCount, betAmount, selectedCourse);
    saveActiveRound(round);
    router.push('/scorecard');
  }

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Flag size={48} color="var(--gold-400)" /></div>
        <h1 className="hero-title">Split Sixes</h1>
        <p className="hero-sub">Golf Points Game</p>
      </div>

      {hasActive && (
        <div className="card resume-card">
          <p>You have an active round in progress.</p>
          <div className="action-row">
            <button className="btn btn-gold" onClick={() => router.push('/scorecard')}>
              Resume Round →
            </button>
            <button className="btn btn-outline" onClick={() => { clearActiveRound(); setHasActive(false); }}>
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Start New Round</h2>

        <label className="field-label">Course <span className="optional">(optional)</span></label>
        <select
          className="input"
          value={selectedCourseId}
          onChange={e => setSelectedCourseId(e.target.value)}
        >
          <option value="">— No course (manual pars) —</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.holeCount} holes · Par {c.holes.reduce((s, h) => s + h.par, 0)})
            </option>
          ))}
        </select>

        {selectedCourse && (
          <p className="optional" style={{ marginTop: '0.25rem' }}>
            Handicaps will be applied automatically using stroke index.
          </p>
        )}

        <div className="row-2" style={{ marginTop: '0.75rem' }}>
          <div>
            <label className="field-label">Holes</label>
            <select
              className="input"
              value={holeCount}
              onChange={e => setHoleCount(Number(e.target.value))}
              disabled={!!selectedCourse}
            >
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
          <button className="btn btn-outline" onClick={handleAddPlayer}>Add</button>
        </div>
        <p className="optional" style={{ marginTop: '0.25rem' }}>
          Set player handicaps in the <a href="/players" style={{ color: 'var(--gold)' }}>Players</a> page.
        </p>
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
                  <span className="optional" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                    HCP {player.handicap ?? 0}
                  </span>
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
          className="btn btn-gold btn-full"
          disabled={selectedPlayers.length !== 3}
          onClick={handleStartRound}
        >
          Start Round
        </button>
      </div>
    </div>
  );
}
