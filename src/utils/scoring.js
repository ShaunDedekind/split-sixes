/**
 * Split Sixes Scoring Logic
 * Each hole: 6 points distributed among 3 players
 * - All different: lowest=4, middle=2, highest=0
 * - Two tie for low: each gets 3, highest gets 0
 * - Two tie for high: lowest gets 4, each tied gets 1
 * - All tie: each gets 2
 *
 * Handicap: players receive extra strokes on holes based on stroke index.
 * Net score = gross score - strokes received on that hole.
 * Points are calculated on net scores.
 */

/**
 * Given a player handicap and a hole's stroke index (1 = hardest),
 * returns how many strokes that player receives on that hole.
 */
export function strokesOnHole(handicap, strokeIndex, totalHoles = 18) {
  if (!handicap || handicap <= 0) return 0;
  const full = Math.floor(handicap / totalHoles);
  const remainder = handicap % totalHoles;
  return full + (strokeIndex <= remainder ? 1 : 0);
}

export function calculateHolePoints(scores, strikeouts = {}) {
  // scores: [{ playerId, score }] — only players with scores entered
  if (scores.length === 0) return [];

  const result = scores.map(({ playerId, score, grossScore }) => ({ playerId, score, grossScore, points: 0 }));

  const setPoints = (playerId, pts) => {
    const r = result.find(r => r.playerId === playerId);
    if (r) r.points = pts;
  };

  const activeScores = scores.filter(s => !strikeouts[s.playerId]);

  if (activeScores.length === 0) {
    return result;
  }

  const sorted = [...activeScores].sort((a, b) => a.score - b.score);
  const low = sorted[0]?.score;
  const mid = sorted[1]?.score;
  const high = sorted[2]?.score;

  if (activeScores.length === 1) {
    setPoints(activeScores[0].playerId, 6);
    return result;
  }

  if (activeScores.length === 2) {
    if (low === mid) {
      // tie: 3 each
      activeScores.forEach(s => setPoints(s.playerId, 3));
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
    activeScores.forEach(s => setPoints(s.playerId, 2));
  } else if (topTie) {
    activeScores.forEach(s => {
      if (s.score === low) setPoints(s.playerId, 3);
      else setPoints(s.playerId, 0);
    });
  } else if (botTie) {
    activeScores.forEach(s => {
      if (s.score === low) setPoints(s.playerId, 4);
      else setPoints(s.playerId, 1);
    });
  } else {
    // all different
    activeScores.forEach(s => {
      if (s.score === low) setPoints(s.playerId, 4);
      else if (s.score === mid) setPoints(s.playerId, 2);
      else setPoints(s.playerId, 0);
    });
  }

  return result;
}

export function calculateRoundTotals(holes, players, useHandicaps = false) {
  const totals = {};
  players.forEach(p => { totals[p.id] = { points: 0, strokes: 0, netStrokes: 0 }; });

  holes.forEach(hole => {
    if (!hole.scores) return;
    const entries = Object.entries(hole.scores)
      .filter(([, score]) => score !== '' && score !== null && score !== undefined)
      .map(([playerId, score]) => {
        const gross = Number(score);
        let net = gross;
        if (useHandicaps) {
          const player = players.find(p => p.id === playerId);
          const hdcp = player?.handicap ?? 0;
          const strokes = strokesOnHole(hdcp, hole.strokeIndex ?? hole.holeNumber, holes.length);
          net = gross - strokes;
        }
        return { playerId, score: net, grossScore: gross };
      });

    if (entries.length === 0) return;

    const holePoints = calculateHolePoints(entries, hole.strikeouts || {});
    holePoints.forEach(({ playerId, points, score }) => {
      if (totals[playerId]) {
        totals[playerId].points += points;
        // gross strokes from original entries
        const entry = entries.find(e => e.playerId === playerId);
        totals[playerId].strokes += entry?.grossScore ?? 0;
        totals[playerId].netStrokes += score;
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

export function getHolePointsMap(hole, players, useHandicaps = false) {
  if (!hole?.scores) return {};
  const entries = Object.entries(hole.scores)
    .filter(([, score]) => score !== '' && score !== null && score !== undefined)
    .map(([playerId, score]) => {
      const gross = Number(score);
      let net = gross;
      if (useHandicaps && players) {
        const player = players.find(p => p.id === playerId);
        const hdcp = player?.handicap ?? 0;
        const totalHoles = players._totalHoles ?? 18;
        const strokes = strokesOnHole(hdcp, hole.strokeIndex ?? hole.holeNumber, totalHoles);
        net = gross - strokes;
      }
      return { playerId, score: net };
    });

  if (entries.length === 0) return {};

  const results = calculateHolePoints(entries, hole.strikeouts || {});
  const map = {};
  results.forEach(r => { map[r.playerId] = r.points; });
  return map;
}

/**
 * Returns strokes received per player on a given hole.
 */
export function getHoleStrokesMap(hole, players, totalHoles = 18) {
  if (!players) return {};
  const map = {};
  players.forEach(p => {
    map[p.id] = strokesOnHole(p.handicap ?? 0, hole.strokeIndex ?? hole.holeNumber, totalHoles);
  });
  return map;
}
