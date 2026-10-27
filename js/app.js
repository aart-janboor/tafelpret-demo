/* app.js — navigatie tussen schermen en het aan elkaar knopen van alles. */

const SCREENS = ['adopt', 'home', 'practice', 'quiz', 'result', 'shop', 'progress'];

function show(screen) {
  SCREENS.forEach(s => {
    document.getElementById('screen-' + s).classList.toggle('hidden', s !== screen);
  });
  document.getElementById('topbar').classList.toggle('hidden', screen === 'adopt');
  if (screen === 'home') renderPet();
  if (screen === 'shop') renderShop();
  if (screen === 'practice') renderTableGrid();
  if (screen === 'progress') renderProgress();
}

/* ---------- Adoptie (eerste keer) ---------- */
let chosenPet = null;

function renderAdopt() {
  const wrap = document.getElementById('petChoices');
  wrap.innerHTML = '';
  PET_TYPES.forEach(p => {
    const b = document.createElement('button');
    b.className = 'pet-choice';
    b.textContent = p.face;
    b.onclick = () => {
      chosenPet = p;
      [...wrap.children].forEach(c => c.classList.remove('selected'));
      b.classList.add('selected');
      updateAdoptBtn();
    };
    wrap.appendChild(b);
  });
  document.getElementById('petNameInput').addEventListener('input', updateAdoptBtn);
  document.getElementById('adoptBtn').onclick = () => {
    const name = document.getElementById('petNameInput').value.trim() || 'Maatje';
    State.pet = { type: chosenPet.type, face: chosenPet.face, name };
    saveState(State);
    show('home');
  };
}

function updateAdoptBtn() {
  const name = document.getElementById('petNameInput').value.trim();
  document.getElementById('adoptBtn').disabled = !(chosenPet && name.length > 0);
}

/* ---------- Tafels kiezen ---------- */
let selectedTables = new Set([2]);
let selectedLength = 10;

function renderTableGrid() {
  const grid = document.getElementById('tableGrid');
  grid.innerHTML = '';
  for (let t = 1; t <= 12; t++) {
    const b = document.createElement('button');
    b.className = 'table-cell' + (selectedTables.has(t) ? ' selected' : '');
    const stars = '⭐'.repeat(starsForTable(t));
    b.innerHTML = `${t}<div class="mini-stars">${stars}</div>`;
    b.onclick = () => {
      if (selectedTables.has(t)) selectedTables.delete(t); else selectedTables.add(t);
      renderTableGrid();
      updateStartBtn();
    };
    grid.appendChild(b);
  }

  const lc = document.getElementById('lengthChoices');
  lc.innerHTML = '';
  [5, 10, 20].forEach(n => {
    const b = document.createElement('button');
    b.className = 'length-choice' + (selectedLength === n ? ' selected' : '');
    b.textContent = n;
    b.onclick = () => { selectedLength = n; renderTableGrid(); };
    lc.appendChild(b);
  });
  updateStartBtn();
}

function updateStartBtn() {
  document.getElementById('startQuizBtn').disabled = selectedTables.size === 0;
}

/* ---------- Resultaat ---------- */
function showResult() {
  show('result');
  const total = QuizState.length;
  const ok = QuizState.correct;
  document.getElementById('resultScore').textContent = `${ok}/${total}`;
  document.getElementById('resultCoins').textContent = `+${QuizState.coinsEarned}`;
  const ratio = ok / total;
  const stars = ratio === 1 ? '⭐⭐⭐' : ratio >= 0.7 ? '⭐⭐' : ratio >= 0.4 ? '⭐' : '✨';
  document.getElementById('resultStars').textContent = stars;
  document.getElementById('resultPet').textContent = ratio >= 0.7 ? '🎉' : (State.pet ? State.pet.face : '🐱');
  document.getElementById('resultTitle').textContent =
    ratio === 1 ? 'Helemaal goed! 🏆' : ratio >= 0.7 ? 'Goed gedaan! 💖' : 'Lekker geoefend! 👍';
  if (ratio >= 0.7) { bigConfetti(); Sound.fanfare(); } else { Sound.stars(); }
}

/* ---------- Voortgang ---------- */
function renderProgress() {
  // "Hier nog op oefenen": sommen die fout/traag gingen (adaptief).
  const weak = weakFacts(6);
  const panel = document.getElementById('weakPanel');
  const weakList = document.getElementById('weakList');
  panel.classList.toggle('hidden', weak.length === 0);
  weakList.innerHTML = '';
  weak.forEach(label => {
    const chip = document.createElement('span');
    chip.className = 'weak-chip';
    chip.textContent = label;
    weakList.appendChild(chip);
  });

  const list = document.getElementById('progressList');
  list.innerHTML = '';
  for (let t = 1; t <= 12; t++) {
    const n = starsForTable(t);
    const row = document.createElement('div');
    row.className = 'progress-row';
    row.innerHTML = `
      <span class="pname">Tafel van ${t}</span>
      <span class="pstars">${'⭐'.repeat(n)}${'☆'.repeat(3 - n)}</span>`;
    list.appendChild(row);
  }
}

/* ---------- Confetti ---------- */
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');
let confettiPieces = [];
function resizeCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
resizeCanvas();
addEventListener('resize', resizeCanvas);

function spawnConfetti(count) {
  const colors = ['#ff8fb8', '#b98cff', '#7ad7c4', '#ffd45e', '#8cc8ff'];
  for (let i = 0; i < count; i++) {
    confettiPieces.push({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }
  if (confettiPieces.length) requestAnimationFrame(drawConfetti);
}
function tinyConfetti() { spawnConfetti(14); }
function bigConfetti() { spawnConfetti(90); }

function drawConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiPieces = confettiPieces.filter(p => p.y < canvas.height + 20);
  confettiPieces.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });
  if (confettiPieces.length) requestAnimationFrame(drawConfetti);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* ---------- Opstarten ---------- */
function init() {
  applyDecay();
  saveState(State);
  buildNumpad();
  renderAdopt();

  // Navigatieknoppen
  document.getElementById('goPracticeBtn').onclick = () => show('practice');
  document.getElementById('goShopBtn').onclick = () => show('shop');
  document.getElementById('goProgressBtn').onclick = () => show('progress');
  document.querySelectorAll('.back-btn').forEach(b => {
    b.onclick = () => show(b.dataset.back);
  });

  // Huisdier aaien = klein beetje blijer
  document.getElementById('petDisplay').onclick = () => {
    bouncePet();
    playWithPet(2);
    Sound.purr();
    document.getElementById('barHappy').style.width = State.happy + '%';
    document.getElementById('petSpeech').textContent = petSpeak();
  };

  // Tafels kiezen
  document.getElementById('selectAllBtn').onclick = () => {
    selectedTables = new Set(Array.from({ length: 12 }, (_, i) => i + 1)); renderTableGrid();
  };
  document.getElementById('selectNoneBtn').onclick = () => { selectedTables = new Set(); renderTableGrid(); };
  document.getElementById('selectEasyBtn').onclick = () => { selectedTables = new Set([1, 2, 5, 10]); renderTableGrid(); };
  document.getElementById('startQuizBtn').onclick = () => {
    show('quiz');
    startQuiz([...selectedTables].sort((a, b) => a - b), selectedLength);
  };

  // Winkel-tabs
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.onclick = () => {
      currentShopTab = tab.dataset.tab;
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t === tab));
      renderShop();
    };
  });

  // Resultaatknoppen
  document.getElementById('againBtn').onclick = () => { show('quiz'); startQuiz([...selectedTables].sort((a, b) => a - b), selectedLength); };
  document.getElementById('resultHomeBtn').onclick = () => show('home');

  // Toetsenbord-ondersteuning (handig op desktop)
  addEventListener('keydown', e => {
    if (document.getElementById('screen-quiz').classList.contains('hidden')) return;
    if (e.key >= '0' && e.key <= '9') pressKey(e.key);
    else if (e.key === 'Backspace') pressKey('del');
    else if (e.key === 'Enter') pressKey('ok');
  });

  // Geluid aan/uit
  const soundBtn = document.getElementById('soundBtn');
  const refreshSoundBtn = () => { soundBtn.textContent = State.soundOn === false ? '🔇' : '🔊'; };
  refreshSoundBtn();
  soundBtn.onclick = () => {
    State.soundOn = State.soundOn === false;   // toggle (default aan)
    saveState();
    refreshSoundBtn();
    if (State.soundOn) Sound.tap();
  };

  // Back-up en herstel (voor de ouder)
  document.getElementById('backupBtn').onclick = () => exportSave();
  const restoreInput = document.getElementById('restoreInput');
  document.getElementById('restoreBtn').onclick = () => restoreInput.click();
  restoreInput.onchange = () => {
    if (!restoreInput.files[0]) return;
    importSave(restoreInput.files[0], ok => {
      restoreInput.value = '';
      if (ok) { renderPet(); show(State.pet ? 'home' : 'adopt'); }
      else alert('Kon dit back-upbestand niet lezen.');
    });
  };

  // Audio ontgrendelen bij de eerste aanraking (browser-vereiste).
  const unlock = () => { Sound.unlock(); removeEventListener('pointerdown', unlock); };
  addEventListener('pointerdown', unlock, { once: true });

  // Startscherm bepalen
  show(State.pet ? 'home' : 'adopt');
}

// Installeren op de tablet: vang de prompt en toon een eigen knop.
let deferredInstall = null;
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  const btn = document.getElementById('installBtn');
  if (btn) {
    btn.classList.remove('hidden');
    btn.onclick = async () => {
      btn.classList.add('hidden');
      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall = null;
    };
  }
});
addEventListener('appinstalled', () => {
  const btn = document.getElementById('installBtn');
  if (btn) btn.classList.add('hidden');
});

// Opstarten: eerst de spelstand laden, dan persistente opslag vragen, dan de app.
(async () => {
  await loadStateAsync();
  await requestPersistentStorage();
  init();
})();
