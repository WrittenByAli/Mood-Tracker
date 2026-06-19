import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const floatingVariants = {
  animate: {
    y: [0, -12, 0],
    transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
  },
};

export default function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div variants={floatingVariants} animate="animate">
        <div
          style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            filter: 'drop-shadow(0 0 20px rgba(0,245,255,0.5))',
          }}
        >
          🧠
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #00f5ff 0%, #ff00aa 50%, #ffd700 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          letterSpacing: '0.08em',
        }}
      >
        MOOD TRACKER
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          fontSize: '1.25rem',
          color: 'var(--text-muted)',
          maxWidth: 480,
          marginBottom: '2.5rem',
          letterSpacing: '0.05em',
        }}
      >
        Level up your emotional intelligence. Track moods, build streaks, unlock achievements — stay{' '}
        <span style={{ color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>
          locked in
        </span>
        .
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <Link to="/signup">
          <motion.span
            className="btn btn-primary"
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,245,255,0.6)' }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'inline-block' }}
          >
            Start Quest
          </motion.span>
        </Link>
        <Link to="/login">
          <motion.span
            className="btn btn-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'inline-block' }}
          >
            Login
          </motion.span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          marginTop: '4rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          maxWidth: 600,
          width: '100%',
        }}
      >
        {[
          { icon: '📊', label: 'Analytics' },
          { icon: '🔥', label: 'Streaks' },
          { icon: '🏆', label: 'Achievements' },
          { icon: '💬', label: 'Daily Quotes' },
        ].map((feat, i) => (
          <motion.div
            key={feat.label}
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.1 }}
            whileHover={{ y: -4, borderColor: 'rgba(0,245,255,0.4)' }}
            style={{ padding: '1rem', cursor: 'default' }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{feat.icon}</div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
              }}
            >
              {feat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
