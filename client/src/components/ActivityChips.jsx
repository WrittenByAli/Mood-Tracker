import { motion } from 'framer-motion';

export const ACTIVITIES = [
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'exercise', label: 'Exercise', icon: '🏋️' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'rest', label: 'Rest', icon: '🛋️' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
];

export default function ActivityChips({ selected = [], onChange }) {
  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
      }}
    >
      {ACTIVITIES.map((act, i) => {
        const active = selected.includes(act.id);
        return (
          <motion.button
            key={act.id}
            type="button"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggle(act.id)}
            aria-pressed={active}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.5rem 0.85rem',
              borderRadius: 20,
              border: active
                ? '1px solid #00f5ff'
                : '1px solid rgba(255,255,255,0.15)',
              background: active
                ? 'rgba(0,245,255,0.15)'
                : 'rgba(0,0,0,0.3)',
              color: active ? '#00f5ff' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: active ? '0 0 12px rgba(0,245,255,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>{act.icon}</span>
            {act.label}
          </motion.button>
        );
      })}
    </div>
  );
}
