import { useState, useEffect } from 'react';
import { getLeaderboardData } from '../utils/leaderboard';

const TABS = ['Points', 'Wins', 'Money'];

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [tab, setTab] = useState('Points');

  useEffect(() => {
    setData(getLeaderboardData());
  }, []);

  const sorted = [...data].sort((a, b) => {
    if (tab === 'Points') return b.totalPoints - a.totalPoints || b.rounds - a.rounds;
    if (tab === 'Wins') return b.wins - a.wins || b.totalPoints - a.totalPoints;
    if (tab === 'Money') return b.totalNet - a.totalNet;
    return 0;
  });

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="page">
      <h2 className="page-title">Leaderboard</h2>

      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="card">
          <p className="empty-msg">No completed rounds yet.<br />Finish a round to see rankings!</p>
        </div>
      ) : (
        <div className="card">
          <div className="lb-header">
            <span>#</span>
            <span>Player</span>
            <span>Rounds</span>
            <span>{tab === 'Points' ? 'Total Pts' : tab === 'Wins' ? 'Wins' : 'Net $'}</span>
            <span>Avg Pts</span>
          </div>

          {sorted.map((player, i) => {
            const primary = tab === 'Points' ? player.totalPoints
              : tab === 'Wins' ? player.wins
              : player.totalNet;
            const avgPts = player.rounds > 0 ? (player.totalPoints / player.rounds).toFixed(1) : '—';
            const isNet = tab === 'Money';

            return (
              <div key={player.id} className={`lb-row ${i < 3 ? `lb-top${i + 1}` : ''}`}>
                <span className="lb-rank">{i < 3 ? medals[i] : i + 1}</span>
                <span className="lb-name">{player.name}</span>
                <span className="lb-rounds">{player.rounds}</span>
                <span className={`lb-primary ${isNet ? (primary > 0 ? 'pos' : primary < 0 ? 'neg' : '') : ''}`}>
                  {isNet
                    ? (primary === 0 ? '—' : `${primary > 0 ? '+' : ''}$${Math.abs(primary).toFixed(2)}`)
                    : primary}
                </span>
                <span className="lb-avg">{avgPts}</span>
              </div>
            );
          })}
        </div>
      )}

      {data.length > 0 && (
        <div className="card stats-card">
          <h3 className="section-title">Stats</h3>
          <div className="stats-grid">
            <StatBox label="Players" value={data.length} />
            <StatBox label="Rounds" value={data[0]?.rounds ?? 0} />
            <StatBox label="Top Scorer" value={sorted[0]?.name ?? '—'} />
            <StatBox label="Most Wins" value={[...data].sort((a,b) => b.wins - a.wins)[0]?.name ?? '—'} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <span className="stat-val">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
