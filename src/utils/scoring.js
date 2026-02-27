/**
 * Split Sixes Scoring Logic
 * Each hole: 6 points distributed among 3 players
 * - All different: lowest=4, middle=2, highest=0
 * - Two tie for low: each gets 3, highest gets 0
 * - Two tie for high: lowest gets 4, each tied gets 1
 * - All tie: each gets 2
 */

export function calculateHolePoints(scores) {
  // scores: [{ playerId, score }] — only players with scores entered
  if (scores.length === 0) return [];

  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const [low, mid, high] = [sorted[0].score, sorted[1]?.score, sorted[2]?.score];

  const result = scores.map(({ playerId, score }) => ({ playerId, score, points: 0 }));

  const setPoints = (playerId, pts) => {
    const r = result.find(r => r.playerId === playerId);
    if (r) r.points = pts;
  };

  if (scores.length === 1) {
    setPoints(scores[0].playerId, 6);
    return result;
  }

  if (scores.length === 2) {
    if (low === high) {
      // tie: 3 each
      scores.forEach(s => setPoints(s.playerId, 3));
    } else {
      sorted.forEach((s, i) => setPoints(s.playerId, i === 0 ? 4 : 2));
    }
    return result;
  }

  // 3 players
  const allTie = low === mid && mid === high;
  const topTie = low === mid && mid !== high;   // two tie for low
  const botTie = mid === high && low !== mid;   // two tie for high

  if (allTie) {
    scores.forEach(s => setPoints(s.playerId, 2));
  } else if (topTie) {
    scores.forEach(s => {
      if (s.score === low) setPoints(s.playerId, 3);
      else setPoints(s.playerId, 0);
    });
  } else if (botTie) {
    scores.forEach(s => {
      if (s.score === low) setPoints(s.playerId, 4);
      else setPoints(s.playerId, 1);
    });
  } else {
    // all different
    scores.forEach(s => {
      if (s.score === low) setPoints(s.playerId, 4);
      else if (s.score === mid) setPoints(s.playerId, 2);
      else setPoints(s.playerId, 0);
    });
  }

  return result;
}

export function calculateRoundTotals(holes, players) {
  const totals = {};
  players.forEach(p => { totals[p.id] = { points: 0, strokes: 0 }; });

  holes.forEach(hole => {
    if (!hole.scores) return;
    const entries = Object.entries(hole.scores)
      .filter(([, score]) => score !== '' && score !== null && score !== undefined)
      .map(([playerId, score]) => ({ playerId, score: Number(score) }));

    if (entries.length === 0) return;

    const holePoints = calculateHolePoints(entries);
    holePoints.forEach(({ playerId, points, score }) => {
      if (totals[playerId]) {
        totals[playerId].points += points;
        totals[playerId].strokes += score;
      }
    });
  });

  return totals;
}

export function calculateMoneySettlement(totals, players, betAmount = 1) {
  // Points-based settlement: each point difference = betAmount
  // Find the player with most points as benchmark
  const playerTotals = players.map(p => ({
    ...p,
    points: totals[p.id]?.points ?? 0,
  }));

  const maxPoints = Math.max(...playerTotals.map(p => p.points));
  const settlements = [];

  // Each player pays/receives based on point differential with each other player
  // Net settlement: sum of pairwise differences
  const net = {};
  players.forEach(p => { net[p.id] = 0; });

  for (let i = 0; i < playerTotals.length; i++) {
    for (let j = i + 1; j < playerTotals.length; j++) {
      const a = playerTotals[i];
      const b = playerTotals[j];
      const diff = a.points - b.points;
      const amount = Math.abs(diff) * betAmount;
      if (diff > 0) {
        net[a.id] += amount;
        net[b.id] -= amount;
      } else if (diff < 0) {
        net[b.id] += amount;
        net[a.id] -= amount;
      }
    }
  }

  return players.map(p => ({
    ...p,
    net: net[p.id],
    points: totals[p.id]?.points ?? 0,
  }));
}

export function getHolePointsMap(hole, players) {
  if (!hole?.scores) return {};
  const entries = Object.entries(hole.scores)
    .filter(([, score]) => score !== '' && score !== null && score !== undefined)
    .map(([playerId, score]) => ({ playerId, score: Number(score) }));

  if (entries.length === 0) return {};

  const results = calculateHolePoints(entries);
  const map = {};
  results.forEach(r => { map[r.playerId] = r.points; });
  return map;
}
