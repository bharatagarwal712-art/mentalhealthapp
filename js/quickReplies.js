// quickReplies.js
// This module provides the ui_renderQuickReplies function that was previously in ui.js.
// It attaches the function to the global window object for legacy code compatibility.

(function () {
  /**
   * Renders contextual quick‑reply chips based on the user's mood and their registered exam.
   * @param {number} mood - The current mood value (1‑5).
   */
  function ui_renderQuickReplies(mood) {
    const qr = document.getElementById('quick-replies');
    if (!qr) return;
    qr.innerHTML = '';
    const exam = window.state?.profile?.primaryExam || 'General';

    const prompts = {
      low: {
        JEE:  ["My JEE mock score tanked", "Feeling lost in Maths", "Help me breathe"],
        NEET: ["My NEET mock score tanked", "Bio feels overwhelming", "Help me breathe"],
        UPSC: ["The syllabus feels endless", "I can't retain anything", "Help me breathe"],
        CAT:  ["My mock scores are dropping", "DI feels impossible", "Help me breathe"],
        GATE: ["Concepts aren't clicking", "I'm so far behind", "Help me breathe"],
        CUET: ["I'm not prepared enough", "Feeling overwhelmed", "Help me breathe"],
        "Board exams": ["I'm scared of boards", "I can't focus at all", "Help me breathe"],
        General: ["I want to give up", "Feeling really low", "Help me breathe"]
      },
      mid: {
        JEE:  ["Physics revision feels stuck", "How do I pace my prep?", "I need a study break"],
        NEET: ["Chemistry is still shaky", "How do I pace my prep?", "I need a study break"],
        UPSC: ["Current affairs are piling up", "How do I stay consistent?", "I need a break"],
        CAT:  ["My accuracy is inconsistent", "How do I manage time?", "I need a reset"],
        GATE: ["Core subjects feel heavy", "How do I pace revision?", "I need a break"],
        CUET: ["Sections feel unbalanced", "How do I prioritise?", "I need a reset"],
        "Board exams": ["One subject is dragging me down", "How do I stay consistent?", "I need a break"],
        General: ["I'm falling behind", "Help me focus today", "I need a reset"]
      },
      high: {
        JEE:  ["How do I maintain this streak?", "Dealing with rank pressure", "I feel prepared today!"],
        NEET: ["How do I maintain this streak?", "Dealing with college pressure", "I feel good today!"],
        UPSC: ["How do I keep consistency?", "Dealing with the long haul", "I feel good today!"],
        CAT:  ["How do I keep this momentum?", "Handling peer pressure", "I feel confident today!"],
        GATE: ["How do I stay in this zone?", "Feeling good about concepts", "I'm on track!"],
        CUET: ["How do I keep this up?", "Handling expectations", "I feel prepared today!"],
        "Board exams": ["How do I stay consistent?", "Managing exam stress", "I feel ready today!"],
        General: ["How do I stay consistent?", "Dealing with pressure", "I feel good today!"]
      }
    };

    const tier = mood <= 2 ? 'low' : mood === 3 ? 'mid' : 'high';
    const opts = (prompts[tier] && prompts[tier][exam]) || prompts[tier]['General'];

    opts.forEach((txt, i) => {
      const btn = document.createElement('button');
      btn.className = 'qr-chip';
      btn.textContent = txt;
      btn.style.animationDelay = `${i * 40}ms`;
      btn.onclick = () => {
        window.ui_clearQuickReplies();
        window.ui_triggerSend(txt);
      };
      qr.appendChild(btn);
    });
  }

  // Expose globally for legacy code.
  window.ui_renderQuickReplies = ui_renderQuickReplies;
})();
