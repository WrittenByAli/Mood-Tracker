const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const {
  isValidMood,
  getMoodScore,
  todayDateString,
} = require('../utils/moods');
const {
  calculateLevel,
  calculateXpBonus,
  checkAchievements,
  updateStreak,
} = require('../utils/gamification');

const router = express.Router();

function formatEntry(row) {
  return {
    id: row.id,
    user_id: row.user_id,
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

function parseActivities(activities) {
  if (activities == null) return [];
  if (Array.isArray(activities)) return activities;
  if (typeof activities === 'string') {
    try {
      const parsed = JSON.parse(activities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function validateEntryBody(body, res) {
  const { mood, energy, stress, sleep_hours } = body;

  if (!mood || !isValidMood(mood)) {
    res.status(400).json({
      error: 'Invalid mood. Must be one of: ecstatic, happy, calm, neutral, tired, anxious, sad, angry',
    });
    return false;
  }

  for (const [field, value] of [
    ['energy', energy],
    ['stress', stress],
  ]) {
    if (value != null && (value < 1 || value > 10)) {
      res.status(400).json({ error: `${field} must be between 1 and 10` });
      return false;
    }
  }

  if (sleep_hours != null && (sleep_hours < 0 || sleep_hours > 24)) {
    res.status(400).json({ error: 'sleep_hours must be between 0 and 24' });
    return false;
  }

  return true;
}

router.post('/', requireAuth, async (req, res) => {
  try {
    if (!validateEntryBody(req.body, res)) return;

    const userId = req.session.userId;
    const entryDate = req.body.entry_date || todayDateString();
    const activities = parseActivities(req.body.activities);
    const note = req.body.note?.trim() || null;

    const entryData = {
      mood: req.body.mood,
      mood_score: getMoodScore(req.body.mood),
      energy: req.body.energy ?? null,
      stress: req.body.stress ?? null,
      sleep_hours: req.body.sleep_hours ?? null,
      activities,
      note,
    };

    const [existing] = await pool.query(
      'SELECT id FROM mood_entries WHERE user_id = ? AND entry_date = ?',
      [userId, entryDate]
    );

    let entryId;
    let xpAwarded = 0;
    let newAchievements = [];
    let streakInfo = null;

    if (existing.length > 0) {
      entryId = existing[0].id;
      await pool.query(
        `UPDATE mood_entries
         SET mood = ?, mood_score = ?, energy = ?, stress = ?, sleep_hours = ?,
             activities = ?, note = ?
         WHERE id = ? AND user_id = ?`,
        [
          entryData.mood,
          entryData.mood_score,
          entryData.energy,
          entryData.stress,
          entryData.sleep_hours,
          JSON.stringify(activities),
          note,
          entryId,
          userId,
        ]
      );
    } else {
      xpAwarded = calculateXpBonus(entryData);

      const [result] = await pool.query(
        `INSERT INTO mood_entries
         (user_id, mood, mood_score, energy, stress, sleep_hours, activities, note, entry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          entryData.mood,
          entryData.mood_score,
          entryData.energy,
          entryData.stress,
          entryData.sleep_hours,
          JSON.stringify(activities),
          note,
          entryDate,
        ]
      );
      entryId = result.insertId;

      streakInfo = await updateStreak(pool, userId, entryDate);

      const [users] = await pool.query('SELECT xp, total_entries FROM users WHERE id = ?', [
        userId,
      ]);
      const newXp = users[0].xp + xpAwarded;
      const newLevel = calculateLevel(newXp);
      const newTotalEntries = users[0].total_entries + 1;

      await pool.query(
        'UPDATE users SET xp = ?, level = ?, total_entries = ? WHERE id = ?',
        [newXp, newLevel, newTotalEntries, userId]
      );

      newAchievements = await checkAchievements(pool, userId, {
        totalEntries: newTotalEntries,
        streak: streakInfo.streak,
        level: newLevel,
        entry: entryData,
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM mood_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    res.status(existing.length > 0 ? 200 : 201).json({
      entry: formatEntry(rows[0]),
      xp_awarded: xpAwarded,
      achievements_unlocked: newAchievements,
      streak: streakInfo,
    });
  } catch (err) {
    console.error('Create mood error:', err);
    res.status(500).json({ error: 'Failed to save mood entry' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query(
      'SELECT COUNT(*) AS total FROM mood_entries WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM mood_entries WHERE user_id = ?
       ORDER BY entry_date DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      entries: rows.map(formatEntry),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List moods error:', err);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

router.get('/today', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM mood_entries WHERE user_id = ? AND entry_date = ?',
      [req.session.userId, todayDateString()]
    );

    if (rows.length === 0) {
      return res.json({ entry: null });
    }

    res.json({ entry: formatEntry(rows[0]) });
  } catch (err) {
    console.error('Today mood error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s entry' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM mood_entries WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json({ entry: formatEntry(rows[0]) });
  } catch (err) {
    console.error('Get mood error:', err);
    res.status(500).json({ error: 'Failed to fetch mood entry' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (!validateEntryBody(req.body, res)) return;

    const userId = req.session.userId;
    const activities = parseActivities(req.body.activities);
    const note = req.body.note?.trim() || null;

    const [existing] = await pool.query(
      'SELECT id FROM mood_entries WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    await pool.query(
      `UPDATE mood_entries
       SET mood = ?, mood_score = ?, energy = ?, stress = ?, sleep_hours = ?,
           activities = ?, note = ?
       WHERE id = ? AND user_id = ?`,
      [
        req.body.mood,
        getMoodScore(req.body.mood),
        req.body.energy ?? null,
        req.body.stress ?? null,
        req.body.sleep_hours ?? null,
        JSON.stringify(activities),
        note,
        req.params.id,
        userId,
      ]
    );

    const [rows] = await pool.query(
      'SELECT * FROM mood_entries WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );

    res.json({ entry: formatEntry(rows[0]) });
  } catch (err) {
    console.error('Update mood error:', err);
    res.status(500).json({ error: 'Failed to update mood entry' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM mood_entries WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json({ message: 'Mood entry deleted' });
  } catch (err) {
    console.error('Delete mood error:', err);
    res.status(500).json({ error: 'Failed to delete mood entry' });
  }
});

module.exports = router;
