"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRounds, deleteRound } from '../utils/storage';
import { calculateRoundTotals } from '../utils/scoring';
import { Trash2, Trophy } from 'lucide-react';

export default function History() {
  const router = useRouter();
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    setRounds(getRounds());
  }, []);

  function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this round?')) return;
    deleteRound(id);
    setRounds(getRounds());
  }

  const completed = rounds.filter(r => r.status === 'completed');
  const active = rounds.filter(r => r.status === 'active' || r.status !== 'completed');

  return (
    <div className="page">
      <h2 className="page-title">Match History</h2>

      {rounds.length === 0 && (
        <div className="card">
          <p className="empty-msg">No rounds recorded yet.<br />Start a round to see it here!</p>
          <button className="btn btn-gold btn-full" onClick={() => router.push('/')}>Start New Round</button>
        </div>
      )}

      {active.length > 0 && (
        <>
          <h3 className="section-label">In Progress</h3>
          {active.map(round => (
            <RoundCard
              key={round.id}
              round={round}
              onView={() => router.push('/scorecard')}
              onDelete={(e) => handleDelete(round.id, e)}
            />
          ))}
        </>
      )}

      {completed.length > 0 && (
        <>
          <h3 className="section-label">Completed</h3>
          {completed.map(round => (
            <RoundCard
              key={round.id}
              round={round}
              onView={() => router.push(`/summary/${round.id}`)}
              onDelete={(e) => handleDelete(round.id, e)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function RoundCard({ round, onView, onDelete }) {
  const totals = calculateRoundTotals(round.holes, round.players);
  const sorted = [...round.players].sort((a, b) =>
    (totals[b.id]?.points ?? 0) - (totals[a.id]?.points ?? 0)
  );
  const winner = round.status === 'completed' ? sorted[0] : null;
  const holesPlayed = round.holes.filter(h =>
    round.players.every(p => h.scores?.[p.id] !== '' && h.scores?.[p.id] != null)
  ).length;

  return (
    <div className="card history-card" onClick={onView}>
      <div className="history-top">
        <div>
          <p className="history-course">{round.courseName || 'Golf Round'}</p>
          <p className="history-date">{new Date(round.date).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
          })}</p>
        </div>
        <div className="history-meta">
          <span className={`status-badge ${round.status === 'completed' ? 'done' : 'active'}`}>
            {round.status === 'completed' ? 'Done' : 'Active'}
          </span>
          <button className="btn-icon-danger" onClick={onDelete} title="Delete round">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="history-players">
        {sorted.map((p, i) => (
          <div key={p.id} className="history-player-row">
            <span className="hist-rank" style={{ display: 'flex', alignItems: 'center' }}>
              {i === 0 && winner ? <Trophy size={14} color="var(--gold-400)" /> : `${i + 1}.`}
            </span>
            <span className="hist-name">{p.name}</span>
            <span className="hist-pts">{totals[p.id]?.points ?? 0} pts</span>
            {round.settlement && (
              <span className={`hist-net ${
                (round.settlement.find(s => s.id === p.id)?.net ?? 0) > 0 ? 'pos' :
                (round.settlement.find(s => s.id === p.id)?.net ?? 0) < 0 ? 'neg' : ''
              }`}>
                {(() => {
                  const net = round.settlement?.find(s => s.id === p.id)?.net ?? 0;
                  return net === 0 ? '—' : `${net > 0 ? '+' : ''}$${Math.abs(net).toFixed(2)}`;
                })()}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="history-footer">
        <span>{holesPlayed}/{round.holeCount} holes</span>
        <span>${round.betAmount}/pt</span>
        <span className="view-link">View →</span>
      </div>
    </div>
  );
}
