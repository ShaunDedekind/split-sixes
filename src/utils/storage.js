const ROUNDS_KEY = 'splitSixes_rounds';
const PLAYERS_KEY = 'splitSixes_players';
const ACTIVE_ROUND_KEY = 'splitSixes_activeRound';
const COURSES_KEY = 'splitSixes_courses';

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

export function addPlayer(name, handicap = 0) {
  const players = getPlayers();
  const id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newPlayer = { id, name: name.trim(), handicap: Number(handicap) };
  players.push(newPlayer);
  savePlayers(players);
  return newPlayer;
}

export function updatePlayerHandicap(playerId, handicap) {
  const players = getPlayers();
  const idx = players.findIndex(p => p.id === playerId);
  if (idx >= 0) {
    players[idx] = { ...players[idx], handicap: Number(handicap) };
    savePlayers(players);
  }
  return players;
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

export function createNewRound(players, holeCount = 18, betAmount = 1, course = null) {
  const holes = Array.from({ length: holeCount }, (_, i) => {
    const courseHole = course?.holes?.[i];
    return {
      holeNumber: i + 1,
      par: courseHole?.par ?? 4,
      strokeIndex: courseHole?.strokeIndex ?? (i + 1),
      scores: {},
    };
  });

  return {
    id: `round_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    courseName: course?.name ?? '',
    courseId: course?.id ?? null,
    players,
    holeCount,
    betAmount: Number(betAmount),
    holes,
    status: 'active',
    useHandicaps: !!course,
  };
}

// --- Courses ---
export function getCourses() {
  return load(COURSES_KEY, []);
}

export function saveCourses(courses) {
  save(COURSES_KEY, courses);
}

export function getCourseById(id) {
  return getCourses().find(c => c.id === id) ?? null;
}

export function saveCourse(course) {
  const courses = getCourses();
  const idx = courses.findIndex(c => c.id === course.id);
  if (idx >= 0) {
    courses[idx] = course;
  } else {
    courses.unshift(course);
  }
  save(COURSES_KEY, courses);
  return course;
}

export function deleteCourse(id) {
  const courses = getCourses().filter(c => c.id !== id);
  save(COURSES_KEY, courses);
}

export function createCourse(name, holeCount = 18) {
  const holes = Array.from({ length: holeCount }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    strokeIndex: i + 1,
  }));
  return {
    id: `course_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    holeCount,
    holes,
  };
}
