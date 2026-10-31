// Shared storage for the planner and the homepage.
// Each week's days, habits and stickers are saved under that week's Monday,
// and the weekly/monthly goals under their month, so nothing gets overwritten.
//
//   weeklyPlanner.<user>.w.<YYYY-MM-DD monday>.<monday…sunday>   → plans
//   weeklyPlanner.<user>.w.<monday>.habits                        → water/sleep/mood
//   weeklyPlanner.<user>.w.<monday>.stickers                      → stickers
//   weeklyPlanner.<user>.m.<YYYY-MM>.<week1…week4|monthly>        → goals
//
// A plan list is saved as JSON: [{ "t": "Gym 7am", "d": false }, …]
(() => {
  const P = 'weeklyPlanner';
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const GOALS = ['week1', 'week2', 'week3', 'week4', 'monthly'];

  const user = () => localStorage.getItem(`${P}.currentUser`) || 'guest';
  const pad = (n) => String(n).padStart(2, '0');

  function iso(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseISO(value) {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
  }

  function mondayOf(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  const weekId = (date = new Date()) => iso(mondayOf(date));
  const monthId = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

  function addDays(weekIdValue, days) {
    const d = parseISO(weekIdValue);
    d.setDate(d.getDate() + days);
    return d;
  }

  const dayKey = (week, day) => `${P}.${user()}.w.${week}.${day}`;
  const goalKey = (month, goal) => `${P}.${user()}.m.${month}.${goal}`;
  const weekKey = (week, name) => `${P}.${user()}.w.${week}.${name}`;

  // Items from JSON, or from plain text saved by the older planner (one plan per line).
  function readItems(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item.t === 'string')
          .map((item) => ({ t: item.t, d: Boolean(item.d) }));
      }
    } catch { /* plain text */ }
    return raw.split('\n').map((line) => line.trim()).filter(Boolean).map((t) => ({ t, d: false }));
  }

  function writeItems(key, items) {
    const clean = items.map((item) => ({ t: String(item.t || '').trim(), d: Boolean(item.d) })).filter((item) => item.t);
    if (clean.length) localStorage.setItem(key, JSON.stringify(clean));
    else localStorage.removeItem(key);
  }

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // One-time move of notes from the old single-week planner into their week/month.
  function migrate() {
    const u = user();
    const flag = `${P}.${u}.migrated.v2`;
    if (localStorage.getItem(flag)) return;

    const savedWeek = parseISO(localStorage.getItem(`${P}.${u}.weekOf`)) || new Date();
    const week = weekId(savedWeek);
    DAYS.forEach((day) => {
      const legacy = `${P}.${u}.${day}`;
      const text = localStorage.getItem(legacy);
      if (text && !localStorage.getItem(dayKey(week, day))) writeItems(dayKey(week, day), readItems(legacy));
      if (text !== null) localStorage.removeItem(legacy);
    });

    const savedMonth = localStorage.getItem(`${P}.${u}.month`);
    const goalDate = new Date(savedWeek);
    if (savedMonth !== null && savedMonth !== '') goalDate.setMonth(Number(savedMonth), 1);
    const month = monthId(goalDate);
    GOALS.forEach((goal) => {
      const legacy = `${P}.${u}.${goal}`;
      const text = localStorage.getItem(legacy);
      if (text && !localStorage.getItem(goalKey(month, goal))) writeItems(goalKey(month, goal), readItems(legacy));
      if (text !== null) localStorage.removeItem(legacy);
    });

    localStorage.setItem(flag, '1');
  }

  window.PlannerStore = {
    DAYS, GOALS, user, iso, parseISO, mondayOf, weekId, monthId, addDays,
    dayKey, goalKey, weekKey, readItems, writeItems, readJSON, writeJSON, migrate
  };
})();
