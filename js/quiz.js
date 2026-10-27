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

// Bouw een lijst vragen uit de gekozen tafels (a = tafel, b = 1..12).
function buildQuestions(tables, length) {
  const all = [];
  tables.forEach(a => {
    for (let b = 1; b <= 12; b++) all.push({ a, b, answer: a * b });
  });
  shuffle(all);
  // Herhaal indien er minder unieke sommen zijn dan de gewenste lengte.
  const out = [];
  while (out.length < length) out.push(...all);
  return out.slice(0, length);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
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
    ans.classList.add('correct');
    fb.textContent = QuizState.streak >= 3 ? `Super! 🔥 +${bonus} 🪙` : `Goed zo! +${bonus} 🪙`;
    fb.className = 'feedback good';
    document.getElementById('miniPet').classList.add('happy');
    tinyConfetti();
    Sound.correct();
    setTimeout(nextQuestion, 850);
  } else {
    QuizState.streak = 0;
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
