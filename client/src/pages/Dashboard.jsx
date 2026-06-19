import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import HudBar from '../components/HudBar';
import { MOODS, getMoodColor } from '../components/MoodOrb';
import { quoteApi, statsApi, moodApi, mapDashboard } from '../api/client';

export default function Dashboard() {
  const [quote, setQuote] = useState(null);
  const [stats, setStats] = useState(null);
  const [todayEntry, setTodayEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      quoteApi.random().catch(() => null),
      statsApi.dashboard().catch(() => ({
        user: { level: 1, xp: 0, streak: 0, total_entries: 0 },
        recent_entries: [],
      })),
      moodApi.today().catch(() => ({ entry: null })),
    ]).then(([q, s, t]) => {
      setQuote(q);
      setStats(mapDashboard(s));
      setTodayEntry(t?.entry ?? null);
      setLoading(false);
    });
  }, []);

  const todayMood = MOODS.find((m) => m.id === todayEntry?.mood);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Command Center{stats?.username ? ` — ${stats.username}` : ''}</h1>

      <HudBar
        level={stats?.level ?? 1}
        xp={stats?.xp ?? 0}
        xpMax={stats?.xpMax ?? 100}
        streak={stats?.streak ?? 0}
      />

      <div className="page-grid page-grid-2">
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ padding: '1.5rem' }}
        >
          <h3
            style={{
              fontSize: '0.7rem',
              color: '#00f5ff',
              marginBottom: '1rem',
              letterSpacing: '0.15em',
            }}
          >
            TODAY&apos;S STATUS
          </h3>

          {todayMood ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <motion.div
                animate={{ boxShadow: [`0 0 20px ${todayMood.color}`, `0 0 40px ${todayMood.color}`, `0 0 20px ${todayMood.color}`] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${todayMood.color}66, transparent)`,
                  border: `2px solid ${todayMood.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                }}
              >
                {todayMood.emoji}
              </motion.div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                  {todayMood.label}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Logged today ✓
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                No mood logged yet today. Stay locked in!
              </p>
              <Link to="/log">
                <motion.span
                  className="btn btn-primary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ display: 'inline-block' }}
                >
                  Log Mood Now
                </motion.span>
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          className="glass-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ padding: '1.5rem' }}
        >
          <h3
            style={{
              fontSize: '0.7rem',
              color: '#ffd700',
              marginBottom: '1rem',
              letterSpacing: '0.15em',
            }}
          >
            QUICK STATS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Total Logs', value: stats?.totalEntries ?? 0, color: '#00f5ff' },
              { label: 'Streak', value: `${stats?.streak ?? 0}d`, color: '#ff8844' },
              { label: 'Level', value: stats?.level ?? 1, color: '#ffd700' },
              { label: 'Avg Mood', value: stats?.avgMood ?? '—', color: '#ff00aa' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8,
                  border: `1px solid ${stat.color}33`,
                }}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    color: stat.color,
                    textShadow: `0 0 10px ${stat.color}66`,
                  }}
                >
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {quote && (
          <motion.div
            className="glass-card glow-gold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ padding: '1.5rem', gridColumn: '1 / -1' }}
          >
            <h3
              style={{
                fontSize: '0.7rem',
                color: '#ffd700',
                marginBottom: '0.75rem',
                letterSpacing: '0.15em',
              }}
            >
              DAILY TRANSMISSION
            </h3>
            <blockquote
              style={{
                fontSize: '1.1rem',
                fontStyle: 'italic',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
                lineHeight: 1.6,
              }}
            >
              &ldquo;{quote.q || quote.text}&rdquo;
            </blockquote>
            <cite style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              — {quote.a || quote.author || 'Unknown'}
            </cite>
          </motion.div>
        )}

        {stats?.weeklyTrend?.length > 0 && (
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ padding: '1.5rem', gridColumn: '1 / -1' }}
          >
            <h3
              style={{
                fontSize: '0.7rem',
                color: '#00f5ff',
                marginBottom: '1rem',
                letterSpacing: '0.15em',
              }}
            >
              WEEKLY PULSE
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
              {stats.weeklyTrend.map((day, i) => (
                <motion.div
                  key={day.date || i}
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.score / 10) * 100}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  style={{
                    flex: 1,
                    minHeight: 4,
                    background: `linear-gradient(180deg, ${getMoodColor(day.mood)}, transparent)`,
                    borderRadius: '4px 4px 0 0',
                    border: '1px solid rgba(0,245,255,0.2)',
                  }}
                  title={`${day.date}: ${day.mood}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
