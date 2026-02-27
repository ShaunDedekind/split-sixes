import { useState, useEffect } from 'react';
import { getPlayers, savePlayers, addPlayer } from '../utils/storage';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [newName, setNewName] = useState('');
  const [newHandicap, setNewHandicap] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editHandicap, setEditHandicap] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setPlayers(getPlayers());
  }, []);

  function handleAdd() {
    const name = newName.trim();
    if (!name) { setError('Name required'); return; }
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Player already exists'); return;
    }
    const hcp = newHandicap === '' ? 0 : Number(newHandicap);
    const player = addPlayer(name, hcp);
    setPlayers(getPlayers());
    setNewName('');
    setNewHandicap('');
    setError('');
  }

  function handleDelete(id) {
    const updated = players.filter(p => p.id !== id);
    savePlayers(updated);
    setPlayers(updated);
    if (editingId === id) setEditingId(null);
  }

  function startEdit(player) {
    setEditingId(player.id);
    setEditName(player.name);
    setEditHandicap(String(player.handicap ?? 0));
  }

  function saveEdit(id) {
    const name = editName.trim();
    if (!name) return;
    const duplicate = players.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return;
    const updated = players.map(p =>
      p.id === id ? { ...p, name, handicap: Number(editHandicap) || 0 } : p
    );
    savePlayers(updated);
    setPlayers(updated);
    setEditingId(null);
  }

  return (
    <div className="page">
      <div className="hero" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
        <h1 className="hero-title" style={{ fontSize: '1.5rem' }}>Players</h1>
        <p className="hero-sub">Manage roster & handicaps</p>
      </div>

      <div className="card">
        <h2 className="section-title">Add Player</h2>
        <div className="row-2">
          <div>
            <label className="field-label">Name</label>
            <input
              className="input"
              placeholder="Player name"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div>
            <label className="field-label">Handicap</label>
            <input
              className="input"
              type="number"
              min="0"
              max="54"
              step="1"
              placeholder="0"
              value={newHandicap}
              onChange={e => setNewHandicap(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-gold btn-full" style={{ marginTop: '0.75rem' }} onClick={handleAdd}>
          Add Player
        </button>
      </div>

      <div className="card">
        <h2 className="section-title">Roster</h2>
        {players.length === 0 && (
          <p className="empty-msg">No players yet.</p>
        )}
        <div className="player-list">
          {players.map(player => (
            <div key={player.id} className={`player-row${editingId === player.id ? ' editing' : ''}`}
              style={{ flexDirection: editingId === player.id ? 'column' : 'row', alignItems: editingId === player.id ? 'stretch' : 'center' }}
            >
              {editingId === player.id ? (
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="row-2">
                    <div>
                      <label className="field-label">Name</label>
                      <input
                        className="input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && saveEdit(player.id)}
                      />
                    </div>
                    <div>
                      <label className="field-label">Handicap</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="54"
                        value={editHandicap}
                        onChange={e => setEditHandicap(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(player.id)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-gold btn-sm" style={{ flex: 1 }} onClick={() => saveEdit(player.id)}>Save</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <button className="player-select" onClick={() => startEdit(player)}>
                    <span className="player-name">{player.name}</span>
                    <span className="optional" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                      HCP {player.handicap ?? 0}
                    </span>
                  </button>
                  <button className="btn-icon" title="Remove player" onClick={() => handleDelete(player.id)}>✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
