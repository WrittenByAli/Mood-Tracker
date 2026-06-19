import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MOODS, getMoodColor } from '../components/MoodOrb';
import { moodApi } from '../api/client';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function History() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    moodApi
      .history()
      .then((data) => setEntries(data.entries ?? data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Mission Log</h1>

      {error && <p className="error-msg">{error}</p>}

      {entries.length === 0 ? (
        <motion.div
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ padding: '3rem', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p style={{ color: 'var(--text-muted)' }}>No entries yet. Start logging to build your timeline.</p>
        </motion.div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          <div
            style={{
              position: 'absolute',
              left: 11,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'linear-gradient(180deg, #00f5ff, #ff00aa, transparent)',
              opacity: 0.4,
            }}
          />

          {entries.map((entry, i) => {
            const moodData = MOODS.find((m) => m.id === entry.mood);
            const color = getMoodColor(entry.mood);

            return (
              <motion.div
                key={entry.id || i}
                className="glass-card"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  marginLeft: 16,
                  position: 'relative',
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -28,
                    top: 20,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 12px ${color}`,
                    border: '2px solid var(--bg-deep)',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.75rem' }}>{moodData?.emoji ?? '❓'}</span>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '0.9rem',
                          color,
                          textShadow: `0 0 8px ${color}66`,
                        }}
                      >
                        {moodData?.label ?? entry.mood}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDate(entry.created_at || entry.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem' }}>
                    {entry.energy != null && (
                      <span style={{ padding: '2px 8px', background: 'rgba(0,245,255,0.15)', borderRadius: 4, color: '#00f5ff' }}>
                        ⚡ {entry.energy}
                      </span>
                    )}
                    {entry.stress != null && (
                      <span style={{ padding: '2px 8px', background: 'rgba(255,0,170,0.15)', borderRadius: 4, color: '#ff00aa' }}>
                        💢 {entry.stress}
                      </span>
                    )}
                    {entry.sleep_hours != null && (
                      <span style={{ padding: '2px 8px', background: 'rgba(153,102,204,0.15)', borderRadius: 4, color: '#9966cc' }}>
                        😴 {entry.sleep_hours}h
                      </span>
                    )}
                  </div>
                </div>

                {entry.note && (
                  <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {entry.note}
                  </p>
                )}

                {entry.activities?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {entry.activities.map((act) => (
                      <span
                        key={act}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          background: 'rgba(255,215,0,0.1)',
                          border: '1px solid rgba(255,215,0,0.25)',
                          borderRadius: 10,
                          color: '#ffd700',
                        }}
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
