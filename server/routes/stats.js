const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { MOOD_TYPES } = require('../utils/moods');

const router = express.Router();

function formatEntry(row) {
  return {
    id: row.id,
    mood: row.mood,
    mood_score: row.mood_score,
    energy: row.energy,
    stress: row.stress,
    sleep_hours: row.sleep_hours != null ? Number(row.sleep_hours) : null,
    activities: row.activities
      ? typeof row.activities === 'string'
        ? JSON.parse(row.activities)
        : row.activities
      : [],
    note: row.note,
    entry_date: row.entry_date,
    created_at: row.created_at,
  };
}

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const [users] = await pool.query(
      `SELECT id, username, email, profile_pic, bio, xp, level, streak,
              longest_streak, total_entries, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [recentEntries] = await pool.query(
      `SELECT * FROM mood_entries WHERE user_id = ?
       ORDER BY entry_date DESC LIMIT 7`,
      [userId]
    );

    const [achievements] = await pool.query(
      `SELECT id, achievement_key, title, description, unlocked_at
       FROM achievements WHERE user_id = ?
       ORDER BY unlocked_at DESC`,
      [userId]
    );

    const user = users[0];
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_pic: user.profile_pic,
        bio: user.bio,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        longest_streak: user.longest_streak,
        total_entries: user.total_entries,
        created_at: user.created_at,
      },
      recent_entries: recentEntries.map(formatEntry),
      achievements,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 30));

    const [distribution] = await pool.query(
      `SELECT mood, COUNT(*) AS count
       FROM mood_entries
       WHERE user_id = ? AND entry_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY mood
       ORDER BY count DESC`,
      [userId, days]
    );

    const [trends] = await pool.query(
      `SELECT entry_date, mood, mood_score, energy, stress, sleep_hours
       FROM mood_entries
       WHERE user_id = ? AND entry_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY entry_date ASC`,
      [userId, days]
    );

    const [averages] = await pool.query(
      `SELECT
         AVG(energy) AS avg_energy,
         AVG(stress) AS avg_stress,
         AVG(sleep_hours) AS avg_sleep,
         AVG(mood_score) AS avg_mood_score,
         COUNT(*) AS total_entries
       FROM mood_entries
       WHERE user_id = ? AND entry_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [userId, days]
    );

    const moodDistribution = Object.keys(MOOD_TYPES).map((mood) => {
      const found = distribution.find((d) => d.mood === mood);
      return { mood, count: found ? found.count : 0 };
    });

    res.json({
      period_days: days,
      mood_distribution: moodDistribution,
      trends: trends.map((row) => ({
        entry_date: row.entry_date,
        mood: row.mood,
        mood_score: row.mood_score,
        energy: row.energy,
        stress: row.stress,
        sleep_hours: row.sleep_hours != null ? Number(row.sleep_hours) : null,
      })),
      averages: {
        energy: averages[0].avg_energy != null ? Number(averages[0].avg_energy) : null,
        stress: averages[0].avg_stress != null ? Number(averages[0].avg_stress) : null,
        sleep_hours: averages[0].avg_sleep != null ? Number(Number(averages[0].avg_sleep).toFixed(1)) : null,
        mood_score: averages[0].avg_mood_score != null ? Number(Number(averages[0].avg_mood_score).toFixed(1)) : null,
        total_entries: averages[0].total_entries,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
