import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getRoundById, saveRound } from '../utils/storage';
import { calculateRoundTotals, calculateMoneySettlement, getHolePointsMap } from '../utils/scoring';

export default function Summary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [round, setRound] = useState(null);
  const [totals, setTotals] = useState({});
  const [settlement, setSettlement] = useState([]);

  const roundId = paramId || location.state?.roundId;

  useEffect(() => {
    if (!roundId) { navigate('/'); return; }
    const r = getRoundById(roundId);
    if (!r) { navigate('/'); return; }
    const t = calculateRoundTotals(r.holes, r.players);
    const s = calculateMoneySettlement(t, r.players, r.betAmount);
    setRound(r);
    setTotals(t);
    setSettlement(s);

    // persist settlement in round
    if (!r.settlement) {
      const updated = { ...r, settlement: s };
      saveRound(updated);
    }
  }, [roundId]);

  if (!round) return <div className="page"><p className="loading">Loading…</p></div>;

  const sorted = [...round.players].sort((a, b) =>
    (totals[b.id]?.points ?? 0) - (totals[a.id]?.points ?? 0)
  );
  const winner = sorted[0];

  const totalHolesPlayed = round.holes.filter(h =>
    round.players.every(p => h.scores?.[p.id] !== '' && h.scores?.[p.id] != null)
  ).length;

  return (
    <div className="page">
      <div className="card summary-hero">
        <div className="trophy">🏆</div>
        <h2 className="winner-name">{winner.name}</h2>
        <p className="winner-sub">Round Winner · {totals[winner.id]?.points ?? 0} points</p>
        <p className="round-meta">
          {round.courseName || 'Golf Round'} · {new Date(round.date).toLocaleDateString()} · {totalHolesPlayed}/{round.holeCount} holes
        </p>
      </div>

      {/* Point Totals */}
      <div className="card">
        <h3 className="section-title">Final Standings</h3>
        <div className="standings">
          {sorted.map((player, i) => (
            <div key={player.id} className={`standing-row ${i === 0 ? 'standing-1' : i === 1 ? 'standing-2' : 'standing-3'}`}>
              <div className="standing-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div className="standing-info">
                <span className="standing-name">{player.name}</span>
                <span className="standing-strokes">{totals[player.id]?.strokes ?? 0} strokes</span>
              </div>
              <div className="standing-pts">{totals[player.id]?.points ?? 0} <span>pts</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Money Settlement */}
      <div className="card">
        <h3 className="section-title">
          Money Settlement
          <span className="bet-label">${round.betAmount}/point</span>
        </h3>
        <div className="settlement">
          {[...settlement].sort((a, b) => b.net - a.net).map(s => (
            <div key={s.id} className={`settlement-row ${s.net > 0 ? 'wins' : s.net < 0 ? 'loses' : 'even'}`}>
              <div className="settle-name">{s.name}</div>
              <div className="settle-pts">{s.points} pts</div>
              <div className="settle-amount">
                {s.net > 0 ? '+' : ''}{s.net === 0 ? '—' : `$${Math.abs(s.net).toFixed(2)}`}
                {s.net !== 0 && (
                  <span className="settle-dir">{s.net > 0 ? 'collects' : 'pays'}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment summary */}
        <div className="payment-summary">
          <h4>Who pays whom</h4>
          {generatePayments(settlement).map((pay, i) => (
            <div key={i} className="payment-row">
              <span className="payer">{pay.from}</span>
              <span className="payment-arrow">→</span>
              <span className="payee">{pay.to}</span>
              <span className="payment-amt">${pay.amount.toFixed(2)}</span>
            </div>
          ))}
          {generatePayments(settlement).length === 0 && (
            <p className="empty-msg">All square — no payments needed!</p>
          )}
        </div>
      </div>

      {/* Hole by Hole */}
      <div className="card">
        <h3 className="section-title">Hole by Hole</h3>
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
                const hasScores = round.players.some(p => h.scores?.[p.id] !== '' && h.scores?.[p.id] != null);
                if (!hasScores) return null;
                return (
                  <tr key={i}>
                    <td>{h.holeNumber}</td>
                    <td>{h.par}</td>
                    {round.players.map(p => {
                      const s = h.scores?.[p.id];
                      const pts = hPts[p.id];
                      return (
                        <td key={p.id} className={`sc-cell ${pts === 4 ? 'best-pts' : pts === 0 ? 'worst-pts' : ''}`}>
                          {s != null && s !== '' ? `${s} (${pts ?? '?'})` : '·'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="totals-footer">
                <td colSpan={2}>Total</td>
                {round.players.map(p => (
                  <td key={p.id}>{totals[p.id]?.strokes ?? 0} ({totals[p.id]?.points ?? 0})</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="action-row">
        <button className="btn btn-outline" onClick={() => navigate('/history')}>
          Match History
        </button>
        <button className="btn btn-gold" onClick={() => navigate('/')}>
          New Round
        </button>
      </div>
    </div>
  );
}

function generatePayments(settlement) {
  // Minimize transactions: have creditors and debtors exchange directly
  const creditors = settlement.filter(s => s.net > 0).map(s => ({ ...s, rem: s.net }));
  const debtors = settlement.filter(s => s.net < 0).map(s => ({ ...s, rem: -s.net }));
  const payments = [];

  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Math.min(c.rem, d.rem);
    if (amount > 0.001) {
      payments.push({ from: d.name, to: c.name, amount });
    }
    c.rem -= amount;
    d.rem -= amount;
    if (c.rem < 0.001) ci++;
    if (d.rem < 0.001) di++;
  }

  return payments;
}
