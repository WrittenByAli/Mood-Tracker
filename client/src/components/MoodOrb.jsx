import { motion } from 'framer-motion';

export const MOODS = [
  { id: 'ecstatic', label: 'Ecstatic', emoji: '🤩', color: '#ffd700' },
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#00ff88' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#44aaff' },
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#8899aa' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#9966cc' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#ff8844' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#4488ff' },
  { id: 'angry', label: 'Angry', emoji: '😤', color: '#ff2244' },
];

export function getMoodColor(moodId) {
  return MOODS.find((m) => m.id === moodId)?.color ?? '#8899aa';
}

export default function MoodOrb({ selected, onSelect, size = 'md' }) {
  const orbSize = size === 'lg' ? 88 : size === 'sm' ? 56 : 72;

  return (
    <div
      className="mood-orb-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
        gap: '1rem',
        justifyItems: 'center',
      }}
    >
      {MOODS.map((mood, i) => {
        const isSelected = selected === mood.id;
        return (
          <motion.button
            key={mood.id}
            type="button"
            className={`mood-orb mood-${mood.id}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 260 }}
            whileHover={{ scale: 1.12, y: -4 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(mood.id)}
            aria-pressed={isSelected}
            aria-label={`Select ${mood.label} mood`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
            }}
          >
            <motion.div
              animate={
                isSelected
                  ? {
                      boxShadow: [
                        `0 0 20px ${mood.color}`,
                        `0 0 40px ${mood.color}`,
                        `0 0 20px ${mood.color}`,
                      ],
                      scale: [1, 1.08, 1],
                    }
                  : {}
              }
              transition={{ repeat: isSelected ? Infinity : 0, duration: 2 }}
              style={{
                width: orbSize,
                height: orbSize,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${mood.color}88, ${mood.color}22 60%, transparent 100%)`,
                border: isSelected
                  ? `2px solid ${mood.color}`
                  : '2px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: orbSize * 0.45,
                position: 'relative',
              }}
            >
              {isSelected && (
                <motion.div
                  layoutId="mood-ring"
                  style={{
                    position: 'absolute',
                    inset: -6,
                    borderRadius: '50%',
                    border: `2px solid ${mood.color}`,
                    opacity: 0.6,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <span style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.5))' }}>
                {mood.emoji}
              </span>
            </motion.div>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                color: isSelected ? mood.color : 'var(--text-muted)',
                textShadow: isSelected ? `0 0 8px ${mood.color}` : 'none',
              }}
            >
              {mood.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
