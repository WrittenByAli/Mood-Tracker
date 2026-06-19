import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { achievementsApi } from '../api/client';

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    achievementsApi
      .list()
      .then((data) => setAchievements(data.achievements ?? []))
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

  const displayUnlocked = achievements.filter((a) => a.unlocked);
  const displayLocked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="page-container">
      <h1 className="page-title">Trophy Room</h1>

      {error && <p className="error-msg">{error}</p>}

      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            UNLOCKED
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#ffd700' }}>
            {displayUnlocked.length} / {achievements.length}
          </div>
        </div>
        <div style={{ fontSize: '2.5rem' }}>🏆</div>
      </motion.div>

      {displayUnlocked.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.7rem', color: '#ffd700', marginBottom: '1rem', letterSpacing: '0.15em' }}>
            UNLOCKED BADGES
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {displayUnlocked.map((ach, i) => (
              <AchievementCard key={ach.id} achievement={ach} index={i} />
            ))}
          </div>
        </>
      )}

      <h3 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.15em' }}>
        LOCKED BADGES
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem',
        }}
      >
        {displayLocked.map((ach, i) => (
          <AchievementCard key={ach.id} achievement={ach} index={i} locked />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement, index, locked = false }) {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={locked ? {} : { y: -4, boxShadow: '0 0 24px rgba(255,215,0,0.3)' }}
      style={{
        padding: '1.25rem',
        textAlign: 'center',
        opacity: locked ? 0.55 : 1,
        filter: locked ? 'grayscale(0.8)' : 'none',
        border: locked ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,215,0,0.35)',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: 8, position: 'relative' }}>
        {locked ? '🔒' : achievement.icon || '🏆'}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.75rem',
          marginBottom: 4,
          color: locked ? 'var(--text-muted)' : '#ffd700',
        }}
      >
        {achievement.title}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {achievement.description}
      </p>
      {achievement.unlockedAt && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {new Date(achievement.unlockedAt).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
}
