/*
 * Camilleri Creations — "What Would You Like to See More Of" questionnaire logic.
 *
 * Pure selection-model functions for the client-only questionnaire game.
 * Follows the module-export-for-tests pattern documented in namespace.js:
 * attaches to window.CC.questionnaire in the browser and exports for Node/Vitest.
 * No network, no storage — submission is handled elsewhere via mailto.js.
 *
 * Data shapes:
 *   QQuestion: { id: string, text: string,
 *                type: 'single' | 'multi',
 *                options: [{ id: string, label: string }] }
 *   State:     { [qId: string]: Set<optionId> }   (single-select holds <= 1)
 */
(function (root) {
  // ---- static question set (labeled options; single/multi types) ----
  var QUESTIONS = [
    {
      id: "content",
      text: "What kind of content would you like to see more of?",
      type: "multi",
      options: [
        { id: "glass", label: "Glass art pieces" },
        { id: "behind-scenes", label: "Behind-the-scenes / making-of" },
        { id: "apps", label: "Smart apps and tools" },
        { id: "family", label: "Family-focused ideas" }
      ]
    },
    {
      id: "glass-style",
      text: "Which glass-art style appeals to you most?",
      type: "single",
      options: [
        { id: "vases", label: "Vases" },
        { id: "bowls", label: "Bowls" },
        { id: "jewellery", label: "Jewellery" },
        { id: "decor", label: "Home decor" }
      ]
    },
    {
      id: "frequency",
      text: "How often would you like updates?",
      type: "single",
      options: [
        { id: "weekly", label: "Weekly" },
        { id: "monthly", label: "Monthly" },
        { id: "occasionally", label: "Occasionally" }
      ]
    }
  ];

  // ---- pure logic ----

  /**
   * Toggle an option for a question, returning a NEW state (input not mutated).
   * single: selecting any option replaces the selection with exactly that option (Req 5.3).
   * multi:  toggles the option in/out of the selection set.
   * @param {object} state   { [qId]: Set<optionId> }
   * @param {string} qId
   * @param {string} optId
   * @returns {object} new state
   */
  function toggle(state, qId, optId) {
    state = state || {};

    // Shallow-clone the state map, cloning each Set so the input is untouched.
    var next = {};
    for (var key in state) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        next[key] = new Set(state[key]);
      }
    }

    var q = findQuestion(qId);
    var isSingle = q ? q.type === "single" : false;

    if (isSingle) {
      // Replace selection with exactly this option.
      next[qId] = new Set([optId]);
    } else {
      var set = next[qId] ? new Set(next[qId]) : new Set();
      if (set.has(optId)) {
        set.delete(optId);
      } else {
        set.add(optId);
      }
      next[qId] = set;
    }

    return next;
  }

  /**
   * True when at least one question has at least one selected option (Req 5.5).
   * @param {object} state
   * @returns {boolean}
   */
  function hasAnyAnswer(state) {
    if (!state) return false;
    for (var qId in state) {
      if (Object.prototype.hasOwnProperty.call(state, qId)) {
        var set = state[qId];
        if (set && set.size > 0) return true;
      }
    }
    return false;
  }

  /**
   * Build the email body: EVERY question paired with its selected option
   * label(s); unanswered questions marked "(unanswered)" (Req 5.7, 5.8).
   * @param {Array} questions  QQuestion[]
   * @param {object} state     { [qId]: Set<optionId> }
   * @returns {string}
   */
  function buildBody(questions, state) {
    questions = questions || [];
    state = state || {};

    var lines = [];
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (!q) continue;
      var selected = state[q.id];
      var answer;
      if (selected && selected.size > 0) {
        answer = labelsFor(q, selected).join(", ");
      } else {
        answer = "(unanswered)";
      }
      lines.push(q.text + "\n  " + answer);
    }
    return lines.join("\n\n");
  }

  // ---- helpers ----

  function findQuestion(qId) {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (QUESTIONS[i] && QUESTIONS[i].id === qId) return QUESTIONS[i];
    }
    return null;
  }

  // Map a question's selected option ids to their labels, in the question's
  // declared option order (deterministic). Unknown ids fall back to the id.
  function labelsFor(q, selectedSet) {
    var labels = [];
    var opts = (q && q.options) || [];
    var seen = new Set();
    for (var i = 0; i < opts.length; i++) {
      var opt = opts[i];
      if (opt && selectedSet.has(opt.id)) {
        labels.push(opt.label);
        seen.add(opt.id);
      }
    }
    // Include any selected ids not present in options (defensive).
    selectedSet.forEach(function (id) {
      if (!seen.has(id)) labels.push(String(id));
    });
    return labels;
  }

  var api = {
    QUESTIONS: QUESTIONS,
    toggle: toggle,
    hasAnyAnswer: hasAnyAnswer,
    buildBody: buildBody
  };

  // Attach to the browser namespace when a window exists.
  if (root && root.CC) root.CC.questionnaire = api;

  // Export for Node/Vitest when a module system is present.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
