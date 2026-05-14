import { createClient } from './supabase/client';
import { getRounds, saveRound } from './storage';

let isSyncing = false;
let syncListeners = [];

export function subscribeToSync(listener) {
  syncListeners.push(listener);
  return () => { syncListeners = syncListeners.filter(l => l !== listener) };
}

function notifyListeners(status) {
  syncListeners.forEach(l => l(status));
}

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export async function triggerBackgroundSync() {
  if (typeof window === 'undefined' || !navigator.onLine) {
    notifyListeners('offline');
    return;
  }
  if (isSyncing) return;
  
  isSyncing = true;
  notifyListeners('syncing');
  
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      notifyListeners('offline'); // Can't sync if not logged in
      isSyncing = false;
      return;
    }
    
    // Push pending rounds
    const rounds = getRounds();
    const pendingRounds = rounds.filter(r => r.sync_status === 'pending');
    
    for (const round of pendingRounds) {
      // Validate UUIDs
      if (!isValidUUID(round.id)) {
        console.warn('Skipping sync for legacy round ID:', round.id);
        continue;
      }
      
      const { error: roundError } = await supabase.from('rounds').upsert({
        id: round.id,
        course_id: isValidUUID(round.courseId) ? round.courseId : null,
        date_played: new Date(round.date).toISOString().split('T')[0],
        holes_played: round.holeCount,
        bet_per_point: round.betAmount,
        updated_at: round.updated_at || new Date().toISOString()
      }, { onConflict: 'id' });
      
      if (roundError) {
        console.error('Failed to sync round', roundError);
        continue;
      }
      
      // Upsert scores
      const scoreRows = [];
      round.holes.forEach(hole => {
        round.players.forEach(player => {
          if (!isValidUUID(player.id)) return;
          
          const score = hole.scores?.[player.id];
          if (score !== undefined && score !== null && score !== '') {
            scoreRows.push({
              round_id: round.id,
              user_id: player.id,
              hole_number: hole.holeNumber,
              gross_score: Number(score),
              points_awarded: 0, // Simplification for cloud, client handles logic
              updated_at: round.updated_at || new Date().toISOString()
            });
          }
        });
      });
      
      if (scoreRows.length > 0) {
        await supabase.from('scores').upsert(scoreRows, { onConflict: 'round_id,user_id,hole_number' });
      }
      
      // Mark as synced locally
      round.sync_status = 'synced';
      saveRound(round, false); // false = do not trigger sync again
    }
    
    notifyListeners('synced');
  } catch (error) {
    console.error('Sync error:', error);
    notifyListeners('error');
  } finally {
    isSyncing = false;
  }
}

// Global listener for online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', triggerBackgroundSync);
}
