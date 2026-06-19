import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementToast({ achievement, onClose }) {
  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={achievement.id}
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 10000,
          maxWidth: 340,
          padding: '1.25rem',
          background: 'rgba(10,14,25,0.95)',
          border: '1px solid #ffd700',
          borderRadius: 12,
          boxShadow: '0 0 30px rgba(255,215,0,0.4), 0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ repeat: 2, duration: 0.4 }}
          style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: 8 }}
        >
          {achievement.icon || '🏆'}
        </motion.div>

        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            color: '#ffd700',
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          ACHIEVEMENT UNLOCKED
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.95rem',
            textAlign: 'center',
            color: '#fff',
            marginBottom: 6,
          }}
        >
          {achievement.title}
        </h3>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {achievement.description}
        </p>

        {achievement.xp && (
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.75rem',
              color: '#00f5ff',
            }}
          >
            +{achievement.xp} XP
          </div>
        )}

        <motion.button
          type="button"
          className="btn btn-gold"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '0.5rem',
            fontSize: '0.6rem',
          }}
        >
          Claim
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
