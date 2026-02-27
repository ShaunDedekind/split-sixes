import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveRound, saveActiveRound, saveRound, clearActiveRound } from '../utils/storage';
import { calculateRoundTotals, getHolePointsMap } from '../utils/scoring';

export default function Scorecard() {
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [currentHole, setCurrentHole] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    const r = getActiveRound();
    if (!r) { navigate('/'); return; }
    // resume at first incomplete hole
    const firstIncomplete = r.holes.findIndex(h => {
      const scores = Object.values(h.scores || {});
      return scores.length < r.players.length || scores.some(s => s === '' || s === null);
    });
    setCurrentHole(firstIncomplete >= 0 ? firstIncomplete : r.holes.length - 1);
    setRound(r);
  }, []);

  if (!round) return <div className="page"><p className="loading">Loading…</p></div>;

  const hole = round.holes[currentHole];
  const totals = calculateRoundTotals(round.holes, round.players);
  const holePoints = getHolePointsMap(hole, round.players);
  const holesPlayed = round.holes.filter(h =>
    h.scores && round.players.every(p => h.scores[p.id] !== '' && h.scores[p.id] != null)
  ).length;

  function updateScore(playerId, value) {
    const updated = { ...round };
    updated.holes[currentHole] = {
      ...updated.holes[currentHole],
      scores: {
        ...updated.holes[currentHole].scores,
        [playerId]: value === '' ? '' : Number(value),
      },
    };
    setRound(updated);
    saveActiveRound(updated);
  }

  function updatePar(value) {
    const updated = { ...round };
    updated.holes[currentHole] = {
      ...updated.holes[currentHole],
      par: Number(value),
    };
    setRound(updated);
    saveActiveRound(updated);
  }

  function goToHole(idx) {
    setCurrentHole(idx);
  }

  function handleFinish() {
    const completed = { ...round, status: 'completed', completedDate: new Date().toISOString() };
    saveRound(completed);
    clearActiveRound();
    navigate('/summary', { state: { roundId: completed.id } });
  }

  const allScoresEntered = round.players.every(p => {
    const s = hole.scores?.[p.id];
    return s !== '' && s !== null && s !== undefined;
  });

  const pointColors = [4, 3, 2, 1, 0];

  return (
    <div className="page">
      <div className="scorecard-header">
        <div>
          <h2 className="sc-title">{round.courseName || 'Round'}</h2>
          <p className="sc-sub">{new Date(round.date).toLocaleDateString()} · {round.holeCount} holes</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleFinish}>
          Finish Round
        </button>
      </div>

      {/* Hole Navigator */}
      <div className="hole-nav-wrap">
        <div className="hole-nav">
          {round.holes.map((h, i) => {
            const done = round.players.every(p => h.scores?.[p.id] !== '' && h.scores?.[p.id] != null);
            return (
              <button
                key={i}
                className={`hole-pill ${i === currentHole ? 'active' : ''} ${done ? 'done' : ''}`}
                onClick={() => goToHole(i)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Hole Card */}
      <div className="card hole-card">
        <div className="hole-header">
          <div>
            <span className="hole-num">Hole {hole.holeNumber}</span>
            <span className="hole-of"> of {round.holeCount}</span>
          </div>
          <div className="par-row">
            <span className="par-label">Par</span>
            <select className="par-select" value={hole.par} onChange={e => updatePar(e.target.value)}>
              {[3, 4, 5, 6].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="score-inputs">
          {round.players.map((player, idx) => {
            const score = hole.scores?.[player.id] ?? '';
            const pts = holePoints[player.id];
            const hasPts = pts !== undefined;
            return (
              <div key={player.id} className="score-row">
                <span className="player-label">{player.name}</span>
                <div className="score-controls">
                  <button
                    className="score-btn minus"
                    onClick={() => {
                      const cur = score === '' ? hole.par : Number(score);
                      updateScore(player.id, Math.max(1, cur - 1));
                    }}
                  >−</button>
                  <input
                    ref={el => inputRefs.current[idx] = el}
                    className="score-input"
                    type="number"
                    min="1"
                    max="20"
                    value={score}
                    placeholder={hole.par}
                    onChange={e => updateScore(player.id, e.target.value)}
                  />
                  <button
                    className="score-btn plus"
                    onClick={() => {
                      const cur = score === '' ? hole.par : Number(score);
                      updateScore(player.id, cur + 1);
                    }}
                  >+</button>
                </div>
                <div className={`pts-badge ${hasPts ? `pts-${pts}` : ''}`}>
                  {hasPts ? `${pts}pts` : '—'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hole-nav-btns">
          <button
            className="btn btn-outline"
            disabled={currentHole === 0}
            onClick={() => goToHole(currentHole - 1)}
          >← Prev</button>
          <button
            className="btn btn-gold"
            disabled={currentHole === round.holes.length - 1}
            onClick={() => goToHole(currentHole + 1)}
          >Next →</button>
        </div>
      </div>

      {/* Running Totals */}
      <div className="card">
        <h3 className="section-title">Running Totals</h3>
        <div className="totals-table">
          <div className="totals-header">
            <span>Player</span>
            <span>Pts</span>
            <span>Strokes</span>
          </div>
          {[...round.players]
            .sort((a, b) => (totals[b.id]?.points ?? 0) - (totals[a.id]?.points ?? 0))
            .map((player, i) => (
              <div key={player.id} className={`totals-row ${i === 0 ? 'leader' : ''}`}>
                <span className="tot-name">
                  {i === 0 && <span className="crown">👑 </span>}
                  {player.name}
                </span>
                <span className="tot-pts">{totals[player.id]?.points ?? 0}</span>
                <span className="tot-strokes">{totals[player.id]?.strokes ?? 0}</span>
              </div>
            ))}
        </div>
        <p className="holes-played">{holesPlayed}/{round.holeCount} holes completed</p>
      </div>

      {/* Hole-by-hole mini table */}
      <div className="card">
        <h3 className="section-title">Scorecard</h3>
        <div className="mini-scorecard">
          <table className="sc-table">
            <thead>
              <tr>
                <th>H</th>
                <th>Par</th>
                {round.players.map(p => <th key={p.id}>{p.name.split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {round.holes.map((h, i) => {
                const hPts = getHolePointsMap(h, round.players);
                return (
                  <tr key={i} className={i === currentHole ? 'current-hole-row' : ''} onClick={() => goToHole(i)}>
                    <td>{h.holeNumber}</td>
                    <td>{h.par}</td>
                    {round.players.map(p => {
                      const s = h.scores?.[p.id];
                      const pts = hPts[p.id];
                      const rel = s !== '' && s != null ? Number(s) - h.par : null;
                      return (
                        <td key={p.id} className={`sc-cell ${pts === 4 ? 'best-pts' : pts === 0 ? 'worst-pts' : ''}`}>
                          {s !== '' && s != null ? (
                            <span title={`${pts ?? '?'}pts`}>
                              {s}
                              {rel !== null && <sup className={rel < 0 ? 'under' : rel > 0 ? 'over' : ''}>{rel < 0 ? rel : rel > 0 ? `+${rel}` : 'E'}</sup>}
                            </span>
                          ) : '·'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
