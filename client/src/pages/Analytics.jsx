import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { statsApi, mapAnalytics } from '../api/client';
import { getMoodColor } from '../components/MoodOrb';

const CHART_TOOLTIP_STYLE = {
  background: 'rgba(10,14,25,0.95)',
  border: '1px solid rgba(0,245,255,0.3)',
  borderRadius: 8,
  color: '#e8f4ff',
  fontFamily: 'Rajdhani, sans-serif',
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    statsApi
      .analytics()
      .then((raw) => setData(mapAnalytics(raw)))
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

  const moodDistribution = data?.moodDistribution ?? [];
  const trendLine = data?.trendLine ?? [];
  const radarData = data?.radar ?? [
    { stat: 'Energy', value: data?.avgEnergy ?? 5 },
    { stat: 'Stress', value: data?.avgStress ?? 5 },
    { stat: 'Sleep', value: data?.avgSleep ?? 5 },
    { stat: 'Social', value: data?.socialScore ?? 5 },
    { stat: 'Activity', value: data?.activityScore ?? 5 },
    { stat: 'Balance', value: data?.balanceScore ?? 5 },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Analytics Hub</h1>

      {error && <p className="error-msg">{error}</p>}

      <div className="page-grid page-grid-2">
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '1.5rem' }}
        >
          <h3 style={{ fontSize: '0.7rem', color: '#00f5ff', marginBottom: '1rem', letterSpacing: '0.15em' }}>
            MOOD DISTRIBUTION
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={moodDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.1)" />
              <XAxis dataKey="mood" tick={{ fill: '#8899aa', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {moodDistribution.map((entry) => (
                  <Cell key={entry.mood} fill={getMoodColor(entry.mood)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ padding: '1.5rem' }}
        >
          <h3 style={{ fontSize: '0.7rem', color: '#ff00aa', marginBottom: '1rem', letterSpacing: '0.15em' }}>
            MOOD TREND
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,0,170,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#8899aa', fontSize: 10 }} />
              <YAxis domain={[1, 10]} tick={{ fill: '#8899aa', fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#ff00aa"
                strokeWidth={2}
                dot={{ fill: '#ff00aa', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#ffd700' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ padding: '1.5rem', gridColumn: '1 / -1' }}
        >
          <h3 style={{ fontSize: '0.7rem', color: '#ffd700', marginBottom: '1rem', letterSpacing: '0.15em' }}>
            WELLBEING RADAR
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,215,0,0.2)" />
              <PolarAngleAxis dataKey="stat" tick={{ fill: '#8899aa', fontSize: 12 }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#ffd700"
                fill="#ffd700"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {data?.insights?.length > 0 && (
          <motion.div
            className="glass-card glow-cyan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ padding: '1.5rem', gridColumn: '1 / -1' }}
          >
            <h3 style={{ fontSize: '0.7rem', color: '#00f5ff', marginBottom: '1rem', letterSpacing: '0.15em' }}>
              AI INSIGHTS
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.insights.map((insight, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,245,255,0.06)',
                    borderLeft: '3px solid #00f5ff',
                    borderRadius: '0 6px 6px 0',
                    color: 'var(--text-muted)',
                  }}
                >
                  {insight}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
