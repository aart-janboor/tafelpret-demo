/* pet.js — het huisdier: weergave, stats en praatjes. */

const PET_TYPES = [
  { type: 'cat',    face: '🐱' },
  { type: 'dog',    face: '🐶' },
  { type: 'rabbit', face: '🐰' },
  { type: 'fox',    face: '🦊' },
  { type: 'dragon', face: '🐲' },
  { type: 'penguin',face: '🐧' },
];

const HAPPY_LINES = [
  'Ik hou van jou! 💖', 'Wat ben jij slim!', 'Samen zijn we top!',
  'Nog een tafel? 🎉', 'Jij kan dit!', 'Jammie, bedankt! 😋',
];
const HUNGRY_LINES = ['Ik heb honger... 🥺', 'Mag ik iets eten?', 'Mijn buikje knort!'];
const SAD_LINES = ['Speel je met me? 🥹', 'Ik mis je!', 'Een beetje aandacht graag?'];

// Laat stats langzaam zakken op basis van verstreken tijd sinds lastSeen.
function applyDecay() {
  const hours = (Date.now() - State.lastSeen) / 36e5;
  if (hours <= 0) return;
  State.food = Math.max(0, State.food - hours * 3);   // ~3 punten/uur
  State.happy = Math.max(0, State.happy - hours * 2);
}

function petMoodFace() {
  if (!State.pet) return '🐾';
  if (State.food < 25) return '😿';
  if (State.happy < 25) return '🥺';
  return State.pet.face;
}

function petSpeak() {
  let pool = HAPPY_LINES;
  if (State.food < 30) pool = HUNGRY_LINES;
  else if (State.happy < 30) pool = SAD_LINES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function feedPet(amount) {
  State.food = Math.min(100, State.food + amount);
  State.happy = Math.min(100, State.happy + Math.round(amount / 3));
  saveState(State);
}

function playWithPet(amount) {
  State.happy = Math.min(100, State.happy + amount);
  saveState(State);
}

function addCoins(n) {
  State.coins += n;
  saveState(State);
}

// Teken het huisdier op het home-scherm (gezicht + accessoires + stats).
function renderPet() {
  if (!State.pet) return;
  document.getElementById('petFace').textContent = petMoodFace();
  document.getElementById('topPetFace').textContent = State.pet.face;
  document.getElementById('topPetName').textContent = State.pet.name;
  document.getElementById('coinCount').textContent = State.coins;

  const hat = State.worn.hat ? SHOP_INDEX[State.worn.hat]?.emoji : '';
  const neck = State.worn.neck ? SHOP_INDEX[State.worn.neck]?.emoji : '';
  const item = State.worn.item ? SHOP_INDEX[State.worn.item]?.emoji : '';
  document.getElementById('petAccessoryHat').textContent = hat || '';
  document.getElementById('petAccessoryNeck').textContent = neck || '';
  document.getElementById('petAccessoryItem').textContent = item || '';

  document.getElementById('barFood').style.width = State.food + '%';
  document.getElementById('barHappy').style.width = State.happy + '%';
  document.getElementById('petSpeech').textContent = petSpeak();
}

function bouncePet() {
  const el = document.getElementById('petFace');
  el.classList.remove('bounce');
  void el.offsetWidth; // forceer herstart animatie
  el.classList.add('bounce');
}
