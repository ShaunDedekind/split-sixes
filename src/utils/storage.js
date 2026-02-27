const ROUNDS_KEY = 'splitSixes_rounds';
const PLAYERS_KEY = 'splitSixes_players';
const ACTIVE_ROUND_KEY = 'splitSixes_activeRound';

function load(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

// --- Players (global roster) ---
export function getPlayers() {
  return load(PLAYERS_KEY, []);
}

export function savePlayers(players) {
  save(PLAYERS_KEY, players);
}

export function addPlayer(name) {
  const players = getPlayers();
  const id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newPlayer = { id, name: name.trim() };
  players.push(newPlayer);
  savePlayers(players);
  return newPlayer;
}

// --- Rounds ---
export function getRounds() {
  return load(ROUNDS_KEY, []);
}

export function saveRound(round) {
  const rounds = getRounds();
  const idx = rounds.findIndex(r => r.id === round.id);
  if (idx >= 0) {
    rounds[idx] = round;
  } else {
    rounds.unshift(round);
  }
  save(ROUNDS_KEY, rounds);
}

export function getRoundById(id) {
  return getRounds().find(r => r.id === id) ?? null;
}

export function deleteRound(id) {
  const rounds = getRounds().filter(r => r.id !== id);
  save(ROUNDS_KEY, rounds);
}

// --- Active Round (in-progress) ---
export function getActiveRound() {
  return load(ACTIVE_ROUND_KEY, null);
}

export function saveActiveRound(round) {
  save(ACTIVE_ROUND_KEY, round);
}

export function clearActiveRound() {
  localStorage.removeItem(ACTIVE_ROUND_KEY);
}

export function createNewRound(players, holeCount = 18, betAmount = 1, courseName = '') {
  const holes = Array.from({ length: holeCount }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    scores: {},
  }));

  return {
    id: `round_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    courseName,
    players,
    holeCount,
    betAmount: Number(betAmount),
    holes,
    status: 'active',
  };
}
