"use strict";

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str - The string to sanitize.
 * @returns {string} The sanitized string safe for innerHTML.
 */
function sanitizeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Saves the user's API key to localStorage and resumes.
 */
async function ui_saveApiKey() {
  const val = document.getElementById('api-key-input').value.trim();
  if (val) {
    const enc = await encryptData(val);
    localStorage.setItem('kivi_api_key', enc);
    GEMINI_API_KEY = val;
    document.getElementById('settings-modal').hidden = true;
    api_call(true);
  }
}


// --- EVENTS & INIT ---
if (typeof document !== 'undefined' && document.getElementById('app')) {
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

  // Dynamic Event Bindings for CSP Compliance
  // Onboarding
  document.querySelectorAll('.ob-next-btn').forEach(b => {
    b.onclick = () => {
      if (typeof ui_nextOnboarding === 'function') ui_nextOnboarding();
    };
  });

  document.querySelectorAll('.ob-skip-btn').forEach(b => {
    b.onclick = () => {
      if (typeof ui_finishOnboarding === 'function') ui_finishOnboarding(true);
    };
  });

  const obStartBtn = document.getElementById('ob-btn-start');
  if (obStartBtn) {
    obStartBtn.onclick = () => {
      if (typeof ui_finishOnboarding === 'function') ui_finishOnboarding(false);
    };
  }

  // API Key Save
  const saveKeyBtn = document.getElementById('save-api-key-btn');
  if (saveKeyBtn) {
    saveKeyBtn.onclick = () => {
      if (typeof ui_saveApiKey === 'function') ui_saveApiKey();
    };
  }

  // Sheet close buttons
  const contextSheetClose = document.getElementById('context-sheet-close');
  if (contextSheetClose) {
    contextSheetClose.onclick = () => {
      if (typeof ui_closeSheet === 'function') ui_closeSheet();
    };
  }

  const crisisSheetClose = document.getElementById('crisis-sheet-close');
  if (crisisSheetClose) {
    crisisSheetClose.onclick = () => {
      if (typeof ui_closeCrisisSheet === 'function') ui_closeCrisisSheet();
    };
  }

  // Crisis sheet trigger link
  const crisisLinkBtn = document.getElementById('crisis-link-btn');
  if (crisisLinkBtn) {
    crisisLinkBtn.onclick = () => {
      if (typeof ui_openCrisisSheet === 'function') ui_openCrisisSheet();
    };
  }

  // Breathe toggle button
  const breatheToggle = document.getElementById('breathe-toggle');
  if (breatheToggle) {
    breatheToggle.onclick = () => {
      if (typeof ui_toggleBreathing === 'function') ui_toggleBreathing();
    };
  }

  // History list card delegation
  const historyList = document.getElementById('history-list');
  if (historyList) {
    historyList.onclick = (e) => {
      const card = e.target.closest('.history-card');
      if (card) {
        const isExpanded = card.getAttribute('aria-expanded') === 'true';
        card.setAttribute('aria-expanded', !isExpanded);
      }
    };
  }

  // SVG Graph tooltip delegation
  const moodGraph = document.getElementById('mood-graph');
  if (moodGraph) {
    moodGraph.onclick = (e) => {
      if (e.target.classList.contains('data-point')) {
        const tooltipData = e.target.getAttribute('data-tooltip');
        if (tooltipData && typeof ui_showTooltip === 'function') {
          ui_showTooltip(e, tooltipData);
        }
      }
    };
  }

  // --- INIT ---
  store_load();

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
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sanitizeHTML, ui_saveApiKey };
}
