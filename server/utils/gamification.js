const { localDateString } = require('./moods');

const ACHIEVEMENTS = {
  first_entry: { title: 'First Step', description: 'Log your first mood entry' },
  entries_10: { title: 'Consistent Tracker', description: 'Log 10 mood entries' },
  entries_50: { title: 'Dedicated Journaler', description: 'Log 50 mood entries' },
  entries_100: { title: 'Mood Master', description: 'Log 100 mood entries' },
  streak_3: { title: 'Three Day Flame', description: 'Maintain a 3-day streak' },
  streak_7: { title: 'Week Warrior', description: 'Maintain a 7-day streak' },
  streak_30: { title: 'Monthly Mindfulness', description: 'Maintain a 30-day streak' },
  level_5: { title: 'Rising Star', description: 'Reach level 5' },
  level_10: { title: 'Emotion Expert', description: 'Reach level 10' },
  detailed_entry: { title: 'Detail Oriented', description: 'Fill all sliders in one entry' },
  note_taker: { title: 'Note Taker', description: 'Add a note to a mood entry' },
};

function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

function calculateXpBonus(entry) {
  let bonus = 10;

  if (entry.note && entry.note.trim()) {
    bonus += 5;
  }

  const activities = entry.activities;
  if (Array.isArray(activities) && activities.length > 0) {
    bonus += 5;
  }

  const slidersFilled =
    entry.energy != null && entry.stress != null && entry.sleep_hours != null;
  if (slidersFilled) {
    bonus += 5;
  }

  return bonus;
}

async function unlockAchievement(pool, userId, key) {
  const def = ACHIEVEMENTS[key];
  if (!def) return null;

  try {
    const [result] = await pool.query(
      `INSERT INTO achievements (user_id, achievement_key, title, description)
       VALUES (?, ?, ?, ?)`,
      [userId, key, def.title, def.description]
    );
    return {
      id: result.insertId,
      achievement_key: key,
      title: def.title,
      description: def.description,
    };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') return null;
    throw err;
  }
}

async function checkAchievements(pool, userId, context) {
  const unlocked = [];
  const { totalEntries, streak, level, entry } = context;

  const checks = [];
  if (totalEntries >= 1) checks.push('first_entry');
  if (totalEntries >= 10) checks.push('entries_10');
  if (totalEntries >= 50) checks.push('entries_50');
  if (totalEntries >= 100) checks.push('entries_100');
  if (streak >= 3) checks.push('streak_3');
  if (streak >= 7) checks.push('streak_7');
  if (streak >= 30) checks.push('streak_30');
  if (level >= 5) checks.push('level_5');
  if (level >= 10) checks.push('level_10');

  if (entry?.note?.trim()) checks.push('note_taker');
  if (
    entry?.energy != null &&
    entry?.stress != null &&
    entry?.sleep_hours != null
  ) {
    checks.push('detailed_entry');
  }

  for (const key of checks) {
    const achievement = await unlockAchievement(pool, userId, key);
    if (achievement) unlocked.push(achievement);
  }

  return unlocked;
}

async function updateStreak(pool, userId, entryDate) {
  const [users] = await pool.query(
    'SELECT streak, longest_streak FROM users WHERE id = ?',
    [userId]
  );
  if (!users.length) return { streak: 0, longest_streak: 0 };

  const { streak: currentStreak, longest_streak: longestStreak } = users[0];

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = localDateString(d);

  const [yesterdayEntries] = await pool.query(
    'SELECT id FROM mood_entries WHERE user_id = ? AND entry_date = ?',
    [userId, yesterday]
  );

  let newStreak;
  if (yesterdayEntries.length > 0) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(longestStreak, newStreak);

  await pool.query(
    'UPDATE users SET streak = ?, longest_streak = ? WHERE id = ?',
    [newStreak, newLongest, userId]
  );

  return { streak: newStreak, longest_streak: newLongest };
}

module.exports = {
  ACHIEVEMENTS,
  calculateLevel,
  calculateXpBonus,
  checkAchievements,
  updateStreak,
  unlockAchievement,
};
