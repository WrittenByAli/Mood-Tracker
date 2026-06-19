import { motion } from 'framer-motion';

export default function HudBar({ level = 1, xp = 0, xpMax = 100, streak = 0 }) {
  const pct = Math.min(100, Math.max(0, (xp / xpMax) * 100));

  return (
    <motion.div
      className="glass-card hud-bar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      <div
        className="level-badge"
        style={{
          position: 'relative',
          width: 52,
          height: 52,
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 52 52" style={{ width: '100%', height: '100%' }}>
          <polygon
            points="26,2 50,15 50,37 26,50 2,37 2,15"
            fill="rgba(0,245,255,0.08)"
            stroke="#00f5ff"
            strokeWidth="1.5"
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#ffd700',
            textShadow: '0 0 10px rgba(255,215,0,0.8)',
          }}
        >
          {level}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
            fontFamily: 'var(--font-heading)',
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            color: 'var(--text-muted)',
          }}
        >
          <span>XP PROGRESS</span>
          <span style={{ color: '#00f5ff' }}>
            {xp} / {xpMax}
          </span>
        </div>
        <div
          style={{
            height: 10,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 5,
            overflow: 'hidden',
            border: '1px solid rgba(0,245,255,0.2)',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00f5ff, #ff00aa, #ffd700)',
              borderRadius: 5,
              boxShadow: '0 0 12px rgba(0,245,255,0.6)',
            }}
          />
        </div>
      </div>

      <motion.div
        className="streak-counter"
        whileHover={{ scale: 1.08 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0.5rem 0.85rem',
          background: 'rgba(255,100,0,0.12)',
          border: '1px solid rgba(255,150,0,0.35)',
          borderRadius: 8,
        }}
      >
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontSize: '1.25rem' }}
        >
          🔥
        </motion.span>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.55rem',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
            }}
          >
            STREAK
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#ff8844',
              textShadow: '0 0 8px rgba(255,136,68,0.6)',
            }}
          >
            {streak}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
