import { getRounds } from './storage';
import { calculateRoundTotals } from './scoring';

export function getLeaderboardData() {
  const rounds = getRounds().filter(r => r.status === 'completed');
  const stats = {};

  rounds.forEach(round => {
    const totals = calculateRoundTotals(round.holes, round.players);
    round.players.forEach(player => {
      if (!stats[player.id]) {
        stats[player.id] = {
          id: player.id,
          name: player.name,
          rounds: 0,
          totalPoints: 0,
          totalNet: 0,
          wins: 0,
        };
      }
      stats[player.id].rounds++;
      stats[player.id].totalPoints += totals[player.id]?.points ?? 0;
    });

    // determine winner (most points)
    const sorted = round.players
      .map(p => ({ id: p.id, points: totals[p.id]?.points ?? 0 }))
      .sort((a, b) => b.points - a.points);

    if (sorted.length > 0 && sorted[0].points > (sorted[1]?.points ?? -1)) {
      if (stats[sorted[0].id]) stats[sorted[0].id].wins++;
    }

    // net money
    if (round.settlement) {
      round.settlement.forEach(s => {
        if (stats[s.id]) stats[s.id].totalNet += s.net;
      });
    }
  });

  return Object.values(stats).sort((a, b) => b.totalPoints - a.totalPoints);
}
