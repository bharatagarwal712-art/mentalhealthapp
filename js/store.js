"use strict";

/**
 * Global state object containing the user's profile, session history, and UI state.
 * @type {Object}
 */
const state = {
  profile: null,
  sessions: [],
  currentSession: null,
  activeTab: 'checkin',
  graphDrawn: false,
  unreadKivi: false,
  obStep: 1,
  moodLabels: { 1: 'Terrible', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' },
  moodEmojis: { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😊' }
};

/**
 * Loads the user's state from localStorage.
 */
function store_load() {
  try {
    const data = localStorage.getItem('kivi_data');
    if (data) {
      const parsed = JSON.parse(data);
      state.profile = parsed.profile || null;
      state.sessions = parsed.sessions || [];
    }
  } catch (e) { console.error("Load failed", e); }
}

/**
 * Saves the current state (profile and sessions) to localStorage.
 */
function store_save() {
  try {
    localStorage.setItem('kivi_data', JSON.stringify({ profile: state.profile, sessions: state.sessions }));
  } catch (e) {
    if (e.name === 'QuotaExceededError') alert("Kivi memory full. Older sessions may need clearing.");
  }
}

/**
 * Adds a new session to the state and persists it.
 * @param {Object} session - The new session object.
 */
function store_addSession(session) {
  state.sessions.push(session);
  store_save();
}

/**
 * Appends a message to a specific session and persists it.
 * @param {string} id - The session ID.
 * @param {Object} msgObj - The message object {role, content}.
 */
function store_updateSession(id, msgObj) {
  const s = state.sessions.find(x => x.id === id);
  if (s) { s.messages.push(msgObj); store_save(); }
}

/**
 * Clears all user data from localStorage and reloads the application.
 */
function store_clear() {
  localStorage.removeItem('kivi_data');
  location.reload();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { state, store_load, store_save, store_addSession, store_updateSession, store_clear };
}
