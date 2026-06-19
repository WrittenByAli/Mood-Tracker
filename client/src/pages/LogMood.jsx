import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MoodOrb from '../components/MoodOrb';
import ActivityChips from '../components/ActivityChips';
import StatSlider from '../components/StatSlider';
import AchievementToast from '../components/AchievementToast';
import { moodApi } from '../api/client';

export default function LogMood() {
  const navigate = useNavigate();
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState('');
  const [note, setNote] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [achievement, setAchievement] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mood) {
      setError('Select a mood to continue');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await moodApi.log({
        mood,
        energy,
        stress,
        sleep_hours: sleep ? Number(sleep) : null,
        note,
        activities,
      });

      if (result.achievements_unlocked?.length) {
        setAchievement(result.achievements_unlocked[0]);
        setTimeout(() => navigate('/dashboard'), 2500);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to save mood');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <AchievementToast achievement={achievement} onClose={() => setAchievement(null)} />

      <h1 className="page-title">Mood Log Entry</h1>

      <form onSubmit={handleSubmit}>
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '1.5rem', marginBottom: '1.25rem' }}
        >
          <h3
            style={{
              fontSize: '0.7rem',
              color: '#00f5ff',
              marginBottom: '1.25rem',
              letterSpacing: '0.15em',
            }}
          >
            SELECT MOOD ORB
          </h3>
          <MoodOrb selected={mood} onSelect={setMood} size="lg" />
        </motion.div>

        <div className="page-grid page-grid-2">
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ padding: '1.5rem' }}
          >
            <h3
              style={{
                fontSize: '0.7rem',
                color: '#ff00aa',
                marginBottom: '1rem',
                letterSpacing: '0.15em',
              }}
            >
              VITAL STATS
            </h3>
            <StatSlider label="Energy Level" value={energy} onChange={setEnergy} type="energy" />
            <StatSlider label="Stress Level" value={stress} onChange={setStress} type="stress" />

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label htmlFor="sleep">Sleep (hours)</label>
              <input
                id="sleep"
                type="number"
                className="input-field"
                min="0"
                max="24"
                step="0.5"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                placeholder="7.5"
              />
            </div>
          </motion.div>

          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
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
              ACTIVITIES
            </h3>
            <ActivityChips selected={activities} onChange={setActivities} />

            <div className="input-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
              <label htmlFor="note">Notes</label>
              <textarea
                id="note"
                className="textarea-field"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened today? Any triggers or wins..."
                rows={4}
              />
            </div>
          </motion.div>
        </div>

        {error && <p className="error-msg" style={{ marginTop: '1rem' }}>{error}</p>}

        <motion.button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !mood}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '0.85rem' }}
        >
          {loading ? 'Transmitting...' : 'Save Entry + Earn XP'}
        </motion.button>
      </form>
    </div>
  );
}
