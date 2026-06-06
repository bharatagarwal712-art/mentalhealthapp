// --- EVENTS ---
document.querySelectorAll('.nav-btn').forEach(b => {
  b.onclick = () => ui_switchTab(b.dataset.tab);
});

document.querySelectorAll('.mood-btn').forEach(b => {
  b.onclick = () => ui_selectMood(b.dataset.val);
});

document.getElementById('summon-btn').onclick = ui_summonKivi;

document.getElementById('send-btn').onclick = () => ui_triggerSend();
document.getElementById('chat-input').onkeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ui_triggerSend(); }
};

let resizeTimer;
document.getElementById('chat-input').oninput = function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  }, 100);
};

document.getElementById('chat-context-pill').onclick = () => {
  document.getElementById('sheet-mood').textContent = `Mood: ${state.currentSession.moodLabel}`;
  document.getElementById('sheet-exam').textContent = `Exam: ${state.currentSession.exam}`;
  document.getElementById('sheet-note').textContent = state.currentSession.note || 'No note provided.';
  document.getElementById('context-sheet').classList.add('visible');
};

document.getElementById('reset-app-btn').onclick = () => {
  if (confirm("Are you sure you want to log out? All history will be permanently deleted.")) {
    store_clear();
  }
};

// --- INIT ---
store_load();
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_KEY_HERE') document.getElementById('setup-banner').hidden = false;

// setup ob chips
const exams = ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'CUET', 'Board exams'];
const obE = document.getElementById('ob-exams');
exams.forEach(e => {
  const c = document.createElement('button');
  c.className = 'exam-chip'; c.dataset.val = e; c.textContent = e;
  c.onclick = () => { obE.querySelectorAll('.exam-chip').forEach(x=>x.classList.remove('selected')); c.classList.add('selected'); };
  obE.appendChild(c);
});

if (!state.profile) {
  document.getElementById('onboarding').hidden = false;
} else {
  document.getElementById('app').hidden = false;
  ui_setGreeting();
}
