const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ACHIEVEMENTS } = require('../utils/gamification');

const router = express.Router();

const ACHIEVEMENT_ICONS = {
  first_entry: '🎯',
  entries_10: '📊',
  entries_50: '📈',
  entries_100: '👑',
  streak_3: '🔥',
  streak_7: '⚡',
  streak_30: '🌟',
  level_5: '🚀',
  level_10: '💎',
  detailed_entry: '🔬',
  note_taker: '📝',
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const [unlockedRows] = await pool.query(
      `SELECT achievement_key, title, description, unlocked_at
       FROM achievements WHERE user_id = ?
       ORDER BY unlocked_at DESC`,
      [req.session.userId]
    );

    const unlockedMap = new Map(unlockedRows.map((row) => [row.achievement_key, row]));

    const achievements = Object.entries(ACHIEVEMENTS).map(([key, def]) => {
      const unlocked = unlockedMap.get(key);
      return {
        id: key,
        achievement_key: key,
        title: def.title,
        description: def.description,
        icon: ACHIEVEMENT_ICONS[key] || '🏆',
        unlocked: Boolean(unlocked),
        unlockedAt: unlocked?.unlocked_at ?? null,
      };
    });

    res.json({ achievements });
  } catch (err) {
    console.error('Achievements error:', err);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

module.exports = router;
