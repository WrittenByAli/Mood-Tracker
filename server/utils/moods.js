const MOOD_TYPES = {
  ecstatic: 9,
  happy: 8,
  calm: 7,
  neutral: 5,
  tired: 4,
  anxious: 3,
  sad: 2,
  angry: 1,
};

function isValidMood(mood) {
  return Object.prototype.hasOwnProperty.call(MOOD_TYPES, mood);
}

function getMoodScore(mood) {
  return MOOD_TYPES[mood] ?? 5;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayDateString() {
  return localDateString();
}

function yesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateString(d);
}

module.exports = {
  MOOD_TYPES,
  isValidMood,
  getMoodScore,
  todayDateString,
  yesterdayDateString,
  localDateString,
};
