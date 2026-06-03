import { createDefaultState } from '../data/gameData.js';

export class SaveManager {
  constructor(storageKey = 'alan-campus-hustle-save-v1') {
    this.storageKey = storageKey;
    this.lastSaveAt = 0;
  }

  load() {
    const fallback = createDefaultState();
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return this.mergeDefaults(fallback, parsed);
    } catch (error) {
      console.warn('Save load failed, using defaults.', error);
      return fallback;
    }
  }

  mergeDefaults(defaults, incoming) {
    if (Array.isArray(defaults)) return Array.isArray(incoming) ? incoming : defaults;
    if (typeof defaults !== 'object' || defaults === null) return incoming ?? defaults;
    const result = { ...defaults };
    Object.keys(defaults).forEach((key) => {
      result[key] = this.mergeDefaults(defaults[key], incoming?.[key]);
    });
    Object.keys(incoming || {}).forEach((key) => {
      if (!(key in result)) result[key] = incoming[key];
    });
    return result;
  }

  save(state, force = false) {
    const now = performance.now();
    if (!force && now - this.lastSaveAt < 1800) return;
    this.lastSaveAt = now;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Autosave failed.', error);
    }
  }

  wipe() {
    localStorage.removeItem(this.storageKey);
  }

  hasSave() {
    return Boolean(localStorage.getItem(this.storageKey));
  }
}
