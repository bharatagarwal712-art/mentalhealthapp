"use strict";

// --- UI-SCREENS ---
/**
 * Switches the active tab, utilizing the View Transitions API if available for smooth animation.
 * @param {string} tab - The ID of the tab to switch to (e.g., 'checkin', 'chat', 'timeline').
 */
function ui_switchTab(tab) {
  if (!document.startViewTransition) {
    _performSwitch(tab);
  } else {
    document.startViewTransition(() => _performSwitch(tab));
  }
}

/**
 * Internal helper to perform the DOM manipulation for tab switching.
 * @param {string} tab - The target tab ID.
 */
function _performSwitch(tab) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${tab}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });
  const btn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  btn.classList.add('active');
  btn.setAttribute('aria-current', 'page');
  
  if (tab === 'chat') { state.unreadKivi = false; ui_updateChatDot(); }
  if (tab === 'timeline') { ui_renderTimeline(); }
  if (tab !== 'breathe' && _breatheRunning) { ui_toggleBreathing(); }
  state.activeTab = tab;
}

/**
 * Sets the greeting message based on the current time and user profile.
 */
function ui_setGreeting() {
  const hr = new Date().getHours();
  let gr = hr < 11 ? "Good morning" : hr < 17 ? "Good afternoon" : hr < 21 ? "Good evening" : "Still up?";
  const nm = state.profile?.name ? ` ${state.profile.name}` : "";
  document.getElementById('greeting').textContent = `${gr}${nm}`;
}

// --- UI-CHECKIN ---
function ui_selectMood(val) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector(`.mood-btn[data-val="${val}"]`);
  btn.classList.add('selected');
  btn.classList.remove('anim-burst');
  void btn.offsetWidth; // trigger reflow
  btn.classList.add('anim-burst');
  
  document.getElementById('mood-label').textContent = `Feeling ${state.moodLabels[val]}`;
  document.getElementById('checkin-bg').style.backgroundColor = `color-mix(in srgb, var(--mood-${val}) 8%, transparent)`;
  ui_updateSummonBtn();
}

function ui_updateSummonBtn() {
  const mood = document.querySelector('.mood-btn.selected');
  document.getElementById('summon-btn').disabled = !mood;
}

function ui_summonKivi() {
  const moodVal = parseInt(document.querySelector('.mood-btn.selected').dataset.val);
  const exam = state.profile.primaryExam || "General";
  const note = document.getElementById('checkin-note').value.trim();
  
  const newSession = {
    id: Date.now().toString(), timestamp: Date.now(),
    mood: moodVal, moodLabel: state.moodLabels[moodVal],
    exam: exam, note: note, messages: []
  };
  state.currentSession = newSession;
  store_addSession(newSession);
  state.graphDrawn = false; // invalidate cache
  
  document.getElementById('pill-emoji').textContent = state.moodEmojis[moodVal];
  document.getElementById('pill-exam').textContent = exam;
  
  document.getElementById('chat-log').innerHTML = '';
  ui_clearQuickReplies();
  ui_switchTab('chat');
  api_sendOpening();
}

// --- UI-CHAT ---
function ui_appendBubble(role, text) {
  const wrap = document.createElement('div');
  wrap.className = `bubble-wrap anim-slide-up ${role === 'model' ? 'kivi' : 'user'}`;
  const bub = document.createElement('div');
  bub.className = 'bubble';
  bub.textContent = text;
  const time = document.createElement('div');
  time.className = 'bubble-time';
  time.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  wrap.appendChild(bub);
  wrap.appendChild(time);
  document.getElementById('chat-log').appendChild(wrap);
  ui_scrollToBottom();
}

function ui_showTyping() {
  const wrap = document.createElement('div');
  wrap.id = 'typing-indicator';
  wrap.className = 'bubble-wrap kivi anim-slide-up';
  wrap.innerHTML = `<div class="bubble typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  document.getElementById('chat-log').appendChild(wrap);
  ui_scrollToBottom();
  document.getElementById('chat-log').setAttribute('aria-busy', 'true');
}

function ui_hideTyping() {
  const ind = document.getElementById('typing-indicator');
  if (ind) ind.remove();
  document.getElementById('chat-log').setAttribute('aria-busy', 'false');
}

// Quick replies rendering moved to js/quickReplies.js and attached to window.ui_renderQuickReplies
function ui_clearQuickReplies() { document.getElementById('quick-replies').innerHTML = ''; }
function ui_scrollToBottom() { requestAnimationFrame(() => { const l = document.getElementById('chat-log'); l.scrollTop = l.scrollHeight; }); }
function ui_updateChatDot() { document.getElementById('chat-dot').classList.toggle('visible', state.unreadKivi && state.activeTab !== 'chat'); }

// --- UI-TIMELINE ---
/**
 * Renders the timeline screen: graph, stats, insight and history.
 */
function ui_renderTimeline() {
  if (!state.sessions.length) return;
  if (!state.graphDrawn) {
    ui_drawGraph(state.sessions);
    ui_renderStatCards(state.sessions);
    ui_renderHistory(state.sessions);
    state.graphDrawn = true;
    if (state.sessions.length >= 3) api_fetchInsight();
  }
  const svg = document.getElementById('mood-graph');
  svg.classList.remove('graph-drawn');
  void svg.offsetWidth;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      svg.classList.add('graph-drawn');
      observer.disconnect();
    }
  });
  observer.observe(svg);
}

function ui_drawGraph(sessions) {
  const now = Date.now();
  const days14 = Array.from({length: 14}, (_, i) => {
    const d = new Date(now - (13 - i) * 86400000);
    return { dateStr: d.toDateString(), day: d.getDate(), pts: [] };
  });
  sessions.forEach(s => {
    const ds = new Date(s.timestamp).toDateString();
    const b = days14.find(x => x.dateStr === ds);
    if (b) b.pts.push(s);
  });
  
  let pathD = "", pointsHTML = "";
  const w = document.getElementById('mood-graph').clientWidth || 343;
  const h = 140, dx = w / 13;
  let prevX = null, prevY = null;
  
  days14.forEach((b, i) => {
    const x = i * dx;
    pointsHTML += `<text x="${x}" y="170" text-anchor="middle" class="graph-axis-text">${b.day}</text>`;
    if (!b.pts.length) { prevX = null; return; }
    const avgM = b.pts.reduce((sum, p) => sum + p.mood, 0) / b.pts.length;
    const y = h - ((avgM - 1) / 4) * (h - 20) - 10;
    
    if (prevX === null) pathD += `M ${x} ${y} `;
    else {
      const cpX1 = prevX + (x - prevX)/2, cpX2 = x - (x - prevX)/2;
      pathD += `C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y} `;
    }
    prevX = x; prevY = y;
    const mCol = `var(--mood-${Math.round(avgM)})`;
    const sExam = sanitizeHTML(b.pts.map(p=>p.exam).join(', '));
    const tooltipData = `Date: ${b.dateStr}&#10;Exams: ${sExam}&#10;Avg Mood: ${avgM.toFixed(1)}/5`;
    pointsHTML += `<circle cx="${x}" cy="${y}" r="5" fill="${mCol}" class="data-point" data-tooltip="${tooltipData}" />`;
  });
  
  const pathEl = `<path d="${pathD}" class="graph-path" id="graph-path-el" />`;
  let fillD = pathD;
  if (prevX !== null) {
    const firstM = pathD.match(/M ([\d.]+) ([\d.]+)/);
    if (firstM) fillD += ` L ${prevX} ${h} L ${firstM[1]} ${h} Z`;
  }
  const fillEl = `<path d="${fillD}" fill="url(#grad)" class="graph-fill" />`;
  const defs = `<defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--mood-5)" stop-opacity="0.4"/><stop offset="100%" stop-color="var(--mood-5)" stop-opacity="0"/></linearGradient></defs>`;
  
  document.getElementById('mood-graph').innerHTML = defs + fillEl + pathEl + pointsHTML;
  setTimeout(() => {
    const p = document.getElementById('graph-path-el');
    if (p) p.style.setProperty('--path-length', p.getTotalLength());
  }, 50);
}

function ui_renderStatCards(sessions) {
  const s7 = sessions.filter(s => s.timestamp > Date.now() - 7 * 86400000);
  const avg = s7.length ? (s7.reduce((a, b) => a + b.mood, 0) / s7.length).toFixed(1) : '-';
  const best = s7.length ? s7.reduce((a, b) => a.mood > b.mood ? a : b) : null;
  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card"><div class="stat-val">${avg} <span style="font-size:16px">⭐</span></div><div class="stat-label">7-day avg</div></div>
    <div class="stat-card"><div class="stat-val">${best ? state.moodEmojis[best.mood] : '-'}</div><div class="stat-label">Best mood</div></div>
    <div class="stat-card"><div class="stat-val">${sessions.length}</div><div class="stat-label">Total Check-ins</div></div>
  `;
}

function ui_renderHistory(sessions) {
  const hl = document.getElementById('history-list');
  hl.innerHTML = '';
  [...sessions].reverse().forEach(s => {
    const d = sanitizeHTML(new Date(s.timestamp).toLocaleDateString());
    const kiviMsg = sanitizeHTML(s.messages.find(m => m.role === 'model')?.content || "No reply");
    const safeExam = sanitizeHTML(s.exam);
    const safeNote = sanitizeHTML(s.note || 'No note');
    const fullNote = sanitizeHTML(s.note || 'None');
    
    hl.innerHTML += `
      <div class="history-card" aria-expanded="false">
        <div class="history-head"><span class="hist-date">${d}</span><span class="hist-chip">${safeExam}</span></div>
        <div class="hist-main"><span class="hist-emoji">${state.moodEmojis[s.mood]}</span><span class="hist-preview">${safeNote}</span></div>
        <div class="hist-full"><b>Note:</b> ${fullNote}<div class="hist-kivi"><b>Kivi:</b> ${kiviMsg}</div></div>
      </div>
    `;
  });
}

function ui_triggerSend(text) {
  const val = text || document.getElementById('chat-input').value.trim();
  if (!val) return;
  document.getElementById('chat-input').value = '';
  document.getElementById('chat-input').style.height = 'auto';
  document.getElementById('chat-input').readOnly = true;
  document.getElementById('send-btn').disabled = true;
  ui_clearQuickReplies();
  ui_appendBubble('user', val);
  store_updateSession(state.currentSession.id, { role: 'user', content: val });
  ui_showTyping();
  api_call(false);
}

function ui_closeSheet() { document.getElementById('context-sheet').classList.remove('visible'); }

/** Opens the crisis helplines bottom sheet. */
function ui_openCrisisSheet() { document.getElementById('crisis-sheet').classList.add('visible'); }

/** Closes the crisis helplines bottom sheet. */
function ui_closeCrisisSheet() { document.getElementById('crisis-sheet').classList.remove('visible'); }

// --- BREATHING EXERCISE ---
let _breatheTimer = null;
let _breatheRunning = false;

/**
 * Runs a single 4-7-8 breathing cycle and loops.
 */
function _breatheCycle() {
  const ring = document.getElementById('breathe-ring');
  const phase = document.getElementById('breathe-phase');
  const count = document.getElementById('breathe-count');

  const tick = (label, cls, seconds, cb) => {
    ring.className = `breathe-ring ${cls}`;
    phase.textContent = label;
    let s = seconds;
    count.textContent = s;
    const interval = setInterval(() => {
      s--;
      count.textContent = s > 0 ? s : '';
      if (s <= 0) { clearInterval(interval); cb(); }
    }, 1000);
  };

  if (!_breatheRunning) return;
  tick('Breathe In', 'inhale', 4, () => {
    if (!_breatheRunning) return;
    tick('Hold', 'hold', 7, () => {
      if (!_breatheRunning) return;
      tick('Breathe Out', 'exhale', 8, () => {
        if (_breatheRunning) _breatheCycle();
      });
    });
  });
}

/**
 * Toggles the 4-7-8 breathing exercise on or off.
 */
function ui_toggleBreathing() {
  const btn = document.getElementById('breathe-toggle');
  _breatheRunning = !_breatheRunning;
  if (_breatheRunning) {
    btn.textContent = 'Stop';
    _breatheCycle();
  } else {
    btn.textContent = 'Start';
    const ring = document.getElementById('breathe-ring');
    ring.className = 'breathe-ring';
    document.getElementById('breathe-phase').textContent = 'Ready';
    document.getElementById('breathe-count').textContent = 'Tap to begin';
  }
}

function ui_showTooltip(e, text) {
  const tt = document.getElementById('graph-tooltip');
  tt.innerHTML = text.replace(/\n/g, '<br>');
  tt.style.left = e.clientX + 'px';
  tt.style.top = (e.clientY - 40) + 'px';
  tt.classList.add('visible');
  setTimeout(() => tt.classList.remove('visible'), 2500);
}

function ui_nextOnboarding() {
  let valid = true;
  if (state.obStep === 2) {
    const val = document.getElementById('ob-name').value.trim();
    if (!/^[a-zA-Z0-9 ]+$/.test(val)) valid = false;
    else state.profile = { name: val };
  }
  if (valid) {
    const stepChange = () => {
      document.querySelector(`.ob-step[data-step="${state.obStep}"]`).classList.remove('active');
      state.obStep++;
      document.querySelector(`.ob-step[data-step="${state.obStep}"]`).classList.add('active');
      document.querySelectorAll('.ob-dot').forEach((d, i) => d.classList.toggle('active', i === state.obStep-1));
    };
    if (document.startViewTransition) document.startViewTransition(stepChange);
    else stepChange();
  }
}

function ui_finishOnboarding(skip = false) {
  if (!skip && state.obStep === 3) {
    const chip = document.querySelector('#ob-exams .exam-chip.selected');
    if (chip) state.profile = { ...state.profile, primaryExam: chip.dataset.val };
  }
  store_save();
  const finish = () => {
    document.getElementById('onboarding').hidden = true;
    document.getElementById('app').hidden = false;
    ui_setGreeting();
  };
  if (document.startViewTransition) document.startViewTransition(finish);
  else finish();
}
