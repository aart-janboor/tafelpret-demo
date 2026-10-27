/* quiz.js — de kern: tafelsommen genereren, antwoorden, munten en sterren. */

const QuizState = {
  tables: [],      // gekozen tafels, bijv. [2, 5]
  length: 10,      // aantal vragen
  questions: [],   // [{a, b, answer}]
  index: 0,
  correct: 0,
  streak: 0,
  coinsEarned: 0,
  input: '',
  locked: false,   // blokkeert invoer tijdens de feedback-animatie (voorkomt dubbeltellen)
};

const factKey = (a, b) => `${a}x${b}`;

/* Adaptief oefenen: elke som (a×b) krijgt een gewicht. Fout/traag/nieuw weegt
   zwaarder (komt vaker terug); goed beheerst weegt lichter. Zo oefent ze vanzelf
   meer op de sommen die nog niet lekker gaan, zonder dat het een toets wordt. */
function factWeight(key) {
  const s = State.factStats[key];
  if (!s || s.seen === 0) return 2.5;            // nieuwe som → netjes introduceren
  let w = 1;
  const acc = s.correct / s.seen;
  w += (1 - acc) * 4;                            // lage accuraatheid → zwaarder
  if (s.lastWrong) w += 3;                       // laatste keer fout → snel terug
  if (s.avgMs && s.avgMs > 4500) w += 1.5;       // traag beantwoord → wat vaker
  if (s.streak >= 3) w *= 0.4;                   // beheerst → minder vaak
  if (s.streak >= 6) w *= 0.5;                   // echt beheerst → nog minder
  return Math.max(0.15, w);                      // nooit helemaal uitsluiten (review)
}

function weightedPick(cands) {
  const weights = cands.map(q => factWeight(q.key));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < cands.length; i++) {
    r -= weights[i];
    if (r <= 0) return cands[i];
  }
  return cands[cands.length - 1];
}

// Bouw een ronde uit de gekozen tafels, gewogen naar wat nog geoefend moet worden.
function buildQuestions(tables, length) {
  const pool = [];
  tables.forEach(a => {
    for (let b = 1; b <= 12; b++) pool.push({ a, b, answer: a * b, key: factKey(a, b) });
  });
  const maxPerFact = Math.max(2, Math.ceil(length / 3)); // variatie bewaken
  const counts = {};
  const out = [];
  let lastKey = null;
  for (let i = 0; i < length; i++) {
    let cands = pool.filter(q => (counts[q.key] || 0) < maxPerFact && q.key !== lastKey);
    if (cands.length === 0) cands = pool.filter(q => q.key !== lastKey);
    if (cands.length === 0) cands = pool;
    const q = weightedPick(cands);
    counts[q.key] = (counts[q.key] || 0) + 1;
    lastKey = q.key;
    out.push(q);
  }
  return out;
}

// Sommen die nog aandacht nodig hebben (voor het voortgangsscherm).
function weakFacts(limit = 6) {
  return Object.entries(State.factStats)
    .filter(([, s]) => s.seen > 0 && (s.lastWrong || s.correct / s.seen < 0.8 || (s.avgMs && s.avgMs > 4500)))
    .map(([key, s]) => ({ key, score: (1 - s.correct / s.seen) + (s.lastWrong ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(f => f.key.replace('x', ' × '));
}

// Werk de per-som-statistiek bij na een antwoord.
function recordFact(q, correct, ms) {
  const k = q.key || factKey(q.a, q.b);
  const s = State.factStats[k] ||
    (State.factStats[k] = { seen: 0, correct: 0, wrong: 0, streak: 0, avgMs: null, lastWrong: false });
  s.seen++;
  if (correct) {
    s.correct++;
    s.streak++;
    s.lastWrong = false;
    s.avgMs = s.avgMs == null ? ms : Math.round(s.avgMs * 0.7 + ms * 0.3); // voortschrijdend gemiddelde
  } else {
    s.wrong++;
    s.streak = 0;
    s.lastWrong = true;
  }
  saveState();
}

function startQuiz(tables, length) {
  QuizState.tables = tables.slice();
  QuizState.length = length;
  QuizState.questions = buildQuestions(tables, length);
  QuizState.index = 0;
  QuizState.correct = 0;
  QuizState.streak = 0;
  QuizState.coinsEarned = 0;
  QuizState.input = '';
  QuizState.locked = false;
  renderQuestion();
}

function currentQuestion() { return QuizState.questions[QuizState.index]; }

function renderQuestion() {
  const q = currentQuestion();
  document.getElementById('questionText').textContent = `${q.a} × ${q.b}`;
  document.getElementById('miniPet').textContent = State.pet ? State.pet.face : '🐱';
  updateAnswerDisplay();
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';
  document.getElementById('streakCount').textContent = QuizState.streak;
  const pct = (QuizState.index / QuizState.length) * 100;
  document.getElementById('quizProgress').style.width = pct + '%';
  QuizState.shownAt = Date.now();   // voor het meten van "trage" sommen
}

function updateAnswerDisplay() {
  const el = document.getElementById('answerDisplay');
  el.textContent = QuizState.input === '' ? '_' : QuizState.input;
  el.className = 'answer-display';
}

function pressKey(key) {
  if (QuizState.locked) return;   // negeer invoer tijdens de feedback-animatie
  if (key === 'del') {
    QuizState.input = QuizState.input.slice(0, -1);
    updateAnswerDisplay();
  } else if (key === 'ok') {
    submitAnswer();
  } else if (QuizState.input.length < 3) {
    QuizState.input += key;
    updateAnswerDisplay();
    Sound.tap();
  }
}

function submitAnswer() {
  if (QuizState.locked || QuizState.input === '') return;
  const q = currentQuestion();
  const given = parseInt(QuizState.input, 10);
  const fb = document.getElementById('feedback');
  const ans = document.getElementById('answerDisplay');

  QuizState.locked = true;
  if (given === q.answer) {
    QuizState.correct++;
    QuizState.streak++;
    const bonus = QuizState.streak >= 3 ? 2 : 1;       // streak-bonus
    QuizState.coinsEarned += bonus;
    recordMastery(q.a);
    recordFact(q, true, Date.now() - QuizState.shownAt);
    ans.classList.add('correct');
    fb.textContent = QuizState.streak >= 3 ? `Super! 🔥 +${bonus} 🪙` : `Goed zo! +${bonus} 🪙`;
    fb.className = 'feedback good';
    document.getElementById('miniPet').classList.add('happy');
    tinyConfetti();
    Sound.correct();
    setTimeout(nextQuestion, 850);
  } else {
    QuizState.streak = 0;
    recordFact(q, false, 0);
    ans.classList.add('shake');
    fb.textContent = `Bijna! ${q.a} × ${q.b} = ${q.answer}`;
    fb.className = 'feedback bad';
    Sound.wrong();
    setTimeout(() => {
      QuizState.input = '';
      updateAnswerDisplay();
      document.getElementById('streakCount').textContent = QuizState.streak;
      QuizState.locked = false;   // weer invoer toestaan na de "fout"-feedback
    }, 1400);
  }
}

function nextQuestion() {
  document.getElementById('miniPet').classList.remove('happy');
  QuizState.input = '';
  QuizState.locked = false;
  QuizState.index++;
  if (QuizState.index >= QuizState.length) finishQuiz();
  else renderQuestion();
}

// Mastery: tel goede antwoorden per tafel; dat bepaalt de sterren.
function recordMastery(table) {
  State.mastery[table] = (State.mastery[table] || 0) + 1;
}

function starsForTable(table) {
  const c = State.mastery[table] || 0;
  if (c >= 50) return 3;
  if (c >= 25) return 2;
  if (c >= 10) return 1;
  return 0;
}

function finishQuiz() {
  document.getElementById('quizProgress').style.width = '100%';
  addCoins(QuizState.coinsEarned);
  playWithPet(Math.min(20, QuizState.correct)); // oefenen maakt je huisdier blij
  saveState(State);
  showResult();
}

function buildNumpad() {
  const pad = document.getElementById('numpad');
  const keys = ['1','2','3','4','5','6','7','8','9','del','0','ok'];
  pad.innerHTML = '';
  keys.forEach(k => {
    const b = document.createElement('button');
    b.className = 'numkey' + (k === 'ok' ? ' ok' : k === 'del' ? ' del' : '');
    b.textContent = k === 'del' ? '⌫' : k === 'ok' ? '✓' : k;
    b.onclick = () => pressKey(k);
    pad.appendChild(b);
  });
}
