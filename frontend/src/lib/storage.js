const PREFIX = "fuel:";

export const storage = {
  get(key) {
    return localStorage.getItem(PREFIX + key);
  },
  set(key, val) {
    localStorage.setItem(PREFIX + key, val);
  },
  getJSON(key, fallback = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  setJSON(key, val) {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  },
};
