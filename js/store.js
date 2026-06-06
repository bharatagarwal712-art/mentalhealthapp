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

function store_save() {
  try {
    localStorage.setItem('kivi_data', JSON.stringify({ profile: state.profile, sessions: state.sessions }));
  } catch (e) {
    if (e.name === 'QuotaExceededError') alert("Kivi memory full. Older sessions may need clearing.");
  }
}

function store_addSession(session) {
  state.sessions.push(session);
  store_save();
}

function store_updateSession(id, msgObj) {
  const s = state.sessions.find(x => x.id === id);
  if (s) { s.messages.push(msgObj); store_save(); }
}

function store_clear() {
  localStorage.removeItem('kivi_data');
  location.reload();
}
