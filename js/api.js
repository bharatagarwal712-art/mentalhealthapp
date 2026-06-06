// --- API ---
function api_buildSystemPrompt() {
  const recent = state.sessions.slice(-5);
  const avg = recent.length ? (recent.reduce((a, b) => a + b.mood, 0) / recent.length).toFixed(1) : 0;
  let trend = "just getting started";
  if (recent.length >= 2) trend = recent[recent.length-1].mood > recent[0].mood ? "improving" : "declining";
  
  let histTxt = recent.map(s => `${new Date(s.timestamp).toLocaleDateString()} - Mood ${s.mood}/5 - ${s.exam} - ${s.note?.substring(0,80)||'no note'}`).join('\n');
  const cur = state.currentSession;
  
  return `You are Kivi, a warm and emotionally intelligent mental wellness companion for Indian students preparing for competitive exams.
STUDENT HISTORY:\n${histTxt}\nMood trend is ${trend}, average mood is ${avg}/5.
TODAY:\nExam: ${cur.exam}\nMood: ${cur.moodLabel} (${cur.mood}/5)\nNote: ${cur.note}
RULES: 
1. Be extremely concise. Keep responses to 1-2 short sentences maximum.
2. Be highly helpful. Offer a quick, practical mental wellness step or a gentle guided question to help them reflect.
3. Provide MENTAL WELLNESS advice, NOT academic tutoring. Never tell them to study harder or solve specific problems. If they are stressed about a specific subject (e.g. JEE math, NEET biology), advise them to take a breather, step away from the desk, or approach it later with a fresh mind. Use their exam context (${cur.exam}) to empathize, but always pivot to emotional support.
4. Remember their history and reference it naturally. Acknowledge today's mood first.
5. If mood has been 2 or below for 3+ consecutive sessions, gently suggest speaking to someone they trust.
6. Never mention AI, Claude, Gemini, or memory system. You are Kivi, always.`;
}

async function api_call(isOpening = false) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_KEY_HERE') {
    setTimeout(() => ui_handleApiReply("Kivi needs a valid API key to talk. Please add it to config.js.", isOpening), 1000);
    return;
  }
  try {
    const sys = api_buildSystemPrompt();
    const msgs = state.currentSession.messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
    const body = {
      system_instruction: { parts: [{ text: sys }] },
      contents: msgs.length ? msgs : [{ role: "user", parts: [{ text: "Hi Kivi" }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.85, topP: 0.95 }
    };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (res.status === 429) throw new Error("429");
    const data = await res.json();
    if (data.promptFeedback?.blockReason) throw new Error("Blocked");
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Kivi couldn't connect right now. Try again in a moment.";
    ui_handleApiReply(reply, isOpening);
  } catch (e) {
    let msg = "Kivi lost connection. Let's try again.";
    if (e.message === "429") msg = "Kivi is a little overwhelmed right now. Try in a few seconds.";
    if (e.message === "Blocked") msg = "Kivi needs a moment. Let's try rephrasing that.";
    ui_handleApiReply(msg, isOpening);
  }
}

function ui_handleApiReply(reply, isOpening) {
  ui_hideTyping();
  ui_appendBubble('model', reply);
  store_updateSession(state.currentSession.id, { role: 'model', content: reply });
  document.getElementById('chat-input').readOnly = false;
  document.getElementById('send-btn').disabled = false;
  if (isOpening) {
    ui_renderQuickReplies(state.currentSession.mood);
    if (state.activeTab !== 'chat') { state.unreadKivi = true; ui_updateChatDot(); }
  }
}

function api_sendOpening() {
  ui_showTyping();
  api_call(true);
}
