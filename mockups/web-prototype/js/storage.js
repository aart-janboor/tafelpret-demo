/* storage.js — bewaart de spelstand in de browser (localStorage).
   In de Flutter-app wordt dit vervangen door Hive/Isar of shared_preferences. */

const STORAGE_KEY = 'tafelpret.save.v1';

const DEFAULT_STATE = {
  pet: null,          // { type, face, name }
  coins: 0,
  food: 80,           // 0..100
  happy: 80,          // 0..100
  lastSeen: Date.now(),
  owned: {},          // { itemId: true }
  worn: { hat: null, neck: null, item: null },
  mastery: {},        // { tafel(1..12): aantalGoed }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return Object.assign(structuredClone(DEFAULT_STATE), parsed);
  } catch (e) {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(state) {
  state.lastSeen = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Globale spelstand
const State = loadState();
