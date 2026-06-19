const BASE = '/api';

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' && data) ||
      res.statusText;
    throw new Error(message || 'Request failed');
  }

  return data;
}

export async function api(path, options = {}) {
  const { body, headers = {}, ...rest } = options;
  const isFormData = body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...rest,
    headers: isFormData
      ? { ...headers }
      : {
          'Content-Type': 'application/json',
          ...headers,
        },
    body: body != null ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  return parseResponse(res);
}

export const authApi = {
  me: () => api('/auth/me'),
  login: (credentials) => api('/auth/login', { method: 'POST', body: credentials }),
  signup: (data) => api('/auth/signup', { method: 'POST', body: data }),
  logout: () => api('/auth/logout', { method: 'POST' }),
};

export const moodApi = {
  log: (entry) =>
    api('/moods', {
      method: 'POST',
      body: {
        mood: entry.mood,
        energy: entry.energy,
        stress: entry.stress,
        sleep_hours: entry.sleep_hours ?? entry.sleep ?? null,
        note: entry.note,
        activities: entry.activities,
      },
    }),
  today: () => api('/moods/today'),
  history: (page = 1, limit = 50) => api(`/moods?page=${page}&limit=${limit}`),
  remove: (id) => api(`/moods/${id}`, { method: 'DELETE' }),
};

export const statsApi = {
  dashboard: () => api('/stats/dashboard'),
  analytics: (days = 30) => api(`/stats/analytics?days=${days}`),
};

export const profileApi = {
  get: () => api('/profile'),
  update: (payload) => api('/profile', { method: 'PUT', body: payload }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api('/profile/avatar', { method: 'POST', body: formData });
  },
};

export const achievementsApi = {
  list: () => api('/achievements'),
};

export const quoteApi = {
  random: () => api('/quote'),
};

export function mapDashboard(data) {
  const user = data?.user ?? {};
  const recent = data?.recent_entries ?? [];
  const xpInLevel = user.xp != null ? user.xp % 100 : 0;

  return {
    level: user.level ?? 1,
    xp: xpInLevel,
    xpMax: 100,
    totalXp: user.xp ?? 0,
    streak: user.streak ?? 0,
    longestStreak: user.longest_streak ?? 0,
    totalEntries: user.total_entries ?? 0,
    username: user.username,
    avgMood:
      recent.length > 0
        ? (recent.reduce((sum, e) => sum + (e.mood_score || 0), 0) / recent.length).toFixed(1)
        : '—',
    weeklyTrend: recent
      .slice()
      .reverse()
      .map((e) => ({
        date: e.entry_date,
        mood: e.mood,
        score: e.mood_score,
      })),
    achievements: data?.achievements ?? [],
  };
}

export function mapAnalytics(data) {
  const averages = data?.averages ?? {};
  const trends = data?.trends ?? [];

  const insights = [];
  if (averages.mood_score != null) {
    insights.push(`Your average mood score over ${data.period_days} days is ${averages.mood_score}/10.`);
  }
  if (averages.stress != null && averages.stress > 7) {
    insights.push('Stress levels are elevated — consider rest activities and shorter work blocks.');
  }
  if (averages.energy != null && averages.energy < 4) {
    insights.push('Energy is running low — prioritize sleep and movement to recharge.');
  }
  if (averages.sleep_hours != null && averages.sleep_hours < 6) {
    insights.push(`Average sleep is ${averages.sleep_hours}h — aim for 7+ hours for better mood stability.`);
  }
  if (insights.length === 0) {
    insights.push('Keep logging daily to unlock personalized insights.');
  }

  return {
    moodDistribution: data?.mood_distribution ?? [],
    trendLine: trends.map((t) => ({
      date: String(t.entry_date).slice(5),
      score: t.mood_score,
      mood: t.mood,
    })),
    radar: [
      { stat: 'Energy', value: Number(averages.energy ?? 5) },
      { stat: 'Calm', value: Math.max(1, 10 - Number(averages.stress ?? 5)) },
      { stat: 'Sleep', value: Math.min(10, Number(averages.sleep_hours ?? 5) * 1.2) },
      { stat: 'Mood', value: Number(averages.mood_score ?? 5) },
      { stat: 'Logs', value: Math.min(10, Number(averages.total_entries ?? 0)) },
      { stat: 'Balance', value: Number(((Number(averages.mood_score ?? 5) + (10 - Number(averages.stress ?? 5))) / 2).toFixed(1)) },
    ],
    insights,
  };
}
