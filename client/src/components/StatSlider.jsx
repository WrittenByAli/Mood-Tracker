import { motion } from 'framer-motion';

const ACCENT = {
  energy: { color: '#00f5ff', gradient: 'linear-gradient(90deg, #004466, #00f5ff)' },
  stress: { color: '#ff00aa', gradient: 'linear-gradient(90deg, #440022, #ff00aa)' },
};

export default function StatSlider({ label, value, onChange, min = 1, max = 10, type = 'energy' }) {
  const accent = ACCENT[type] || ACCENT.energy;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="stat-slider" style={{ marginBottom: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <label
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: accent.color,
          }}
        >
          {label}
        </label>
        <motion.span
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: accent.color,
            textShadow: `0 0 10px ${accent.color}`,
            minWidth: 28,
            textAlign: 'right',
          }}
        >
          {value}
        </motion.span>
      </div>

      <div style={{ position: 'relative', height: 32 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            right: 0,
            height: 6,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${accent.color}33`,
          }}
        >
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              height: '100%',
              background: accent.gradient,
              borderRadius: 3,
              boxShadow: `0 0 8px ${accent.color}66`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <motion.div
          animate={{ left: `calc(${pct}% - 10px)` }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: accent.color,
            boxShadow: `0 0 12px ${accent.color}`,
            pointerEvents: 'none',
            border: '2px solid white',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: 4,
        }}
      >
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
