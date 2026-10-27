/* storage.js — bewaart de spelstand robuust in IndexedDB.
   Waarom niet (alleen) localStorage? Dat kan door Android bij opslagdruk of een
   "gegevens wissen" worden geleegd — en dan is het huisdier + alle munten weg.
   IndexedDB + navigator.storage.persist() + een back-upknop maken het kind-proof.
   localStorage wordt nog als goedkope spiegel bijgehouden voor migratie/herstel. */

const DB_NAME = 'tafelpret';
const STORE = 'kv';
const KEY = 'save.v1';
const LS_KEY = 'tafelpret.save.v1';

const DEFAULT_STATE = {
  pet: null,          // { type, face, name }
  coins: 0,
  food: 80,           // 0..100
  happy: 80,          // 0..100
  soundOn: true,      // geluid aan/uit
  lastSeen: Date.now(),
  owned: {},          // { itemId: true }
  worn: { hat: null, neck: null, item: null },
  mastery: {},        // { tafel(1..12): aantalGoed } — voor de sterren
  factStats: {},      // { "axb": { seen, correct, wrong, streak, avgMs, lastWrong } } — voor adaptief oefenen
};

// Eén gedeelde, muteerbare spelstand. We muteren 'm in-place (nooit herbinden),
// zodat alle modules die `State` lezen altijd de actuele waarden zien.
const State = structuredClone(DEFAULT_STATE);

/* ---------- IndexedDB-minihelper (geen externe dependency) ---------- */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, val) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- Laden, opslaan, herstellen ---------- */
function applyData(data) {
  if (!data) return;
  // Reset naar defaults en leg de opgeslagen velden eroverheen (in-place).
  Object.keys(State).forEach(k => delete State[k]);
  Object.assign(State, structuredClone(DEFAULT_STATE), data);
}

async function loadStateAsync() {
  let data = null;
  try {
    data = await idbGet(KEY);
  } catch (e) { /* IndexedDB niet beschikbaar */ }
  if (!data) {
    // Migreer een eventuele oude localStorage-save.
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) { /* genegeerd */ }
  }
  applyData(data);
  return State;
}

let saveTimer = null;
function saveState() {
  State.lastSeen = Date.now();
  // Debounce de IndexedDB-schrijf; spiegel direct naar localStorage als back-up.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { idbSet(KEY, State).catch(() => {}); }, 150);
  try { localStorage.setItem(LS_KEY, JSON.stringify(State)); } catch (e) { /* vol/privé-modus */ }
}

// Vraag Android/Chrome om de opslag niet zomaar op te ruimen.
async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = await navigator.storage.persisted();
      if (!already) await navigator.storage.persist();
    }
  } catch (e) { /* genegeerd */ }
}

/* ---------- Back-up (export) & herstel (import) ---------- */
function exportSave() {
  const blob = new Blob([JSON.stringify(State, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tafelpret-backup.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importSave(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      applyData(JSON.parse(reader.result));
      saveState();
      onDone && onDone(true);
    } catch (e) {
      onDone && onDone(false);
    }
  };
  reader.readAsText(file);
}
