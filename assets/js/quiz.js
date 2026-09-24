/*
 * Camilleri Creations — "What Necklace Am I" quiz logic (Req 4).
 *
 * Pure, deterministic, fully client-side: no fetch/XHR, no storage (Req 4.1).
 * Follows the module-export-for-tests pattern documented in namespace.js:
 * attaches to window.CC.quiz in the browser and exports for Node/Vitest,
 * with no build step.
 *
 * Data model:
 *   Question : { id, text, options: [{ id, label, weight }] }  (2..6 options)
 *   QUESTIONS: Question[]                                        (length 3..10)
 *   RESULTS  : { [resultId]: { name, description, image } }
 *
 * Quiz state is a plain object:
 *   { index: number, answers: { [questionId]: optionId } }
 *
 * `answers` maps question id -> selected option id. `weight` is the resultId
 * an option contributes toward; computeResult tallies weights and picks the
 * winner deterministically (highest tally, ties broken by RESULTS key ASC).
 */
(function (root) {
  // ---- static question set (3..10 questions, each 2..6 options) ----
  var QUESTIONS = [
    {
      id: "q1",
      text: "Pick a colour that feels most like you.",
      options: [
        { id: "q1a", label: "Ocean teal", weight: "sea-glass" },
        { id: "q1b", label: "Warm amber", weight: "amber-drop" },
        { id: "q1c", label: "Soft rose", weight: "rose-petal" },
        { id: "q1d", label: "Midnight blue", weight: "midnight" }
      ]
    },
    {
      id: "q2",
      text: "Where would you rather spend an afternoon?",
      options: [
        { id: "q2a", label: "By the sea", weight: "sea-glass" },
        { id: "q2b", label: "By a crackling fire", weight: "amber-drop" },
        { id: "q2c", label: "In a flower garden", weight: "rose-petal" },
        { id: "q2d", label: "Stargazing", weight: "midnight" }
      ]
    },
    {
      id: "q3",
      text: "Choose a word that draws you in.",
      options: [
        { id: "q3a", label: "Fresh", weight: "sea-glass" },
        { id: "q3b", label: "Cosy", weight: "amber-drop" },
        { id: "q3c", label: "Gentle", weight: "rose-petal" },
        { id: "q3d", label: "Mysterious", weight: "midnight" }
      ]
    },
    {
      id: "q4",
      text: "How do you like your jewellery to feel?",
      options: [
        { id: "q4a", label: "Light and breezy", weight: "sea-glass" },
        { id: "q4b", label: "Bold and grounding", weight: "amber-drop" },
        { id: "q4c", label: "Delicate and pretty", weight: "rose-petal" },
        { id: "q4d", label: "Striking and dramatic", weight: "midnight" }
      ]
    },
    {
      id: "q5",
      text: "Which occasion excites you most?",
      options: [
        { id: "q5a", label: "A seaside walk", weight: "sea-glass" },
        { id: "q5b", label: "A candlelit dinner", weight: "amber-drop" },
        { id: "q5c", label: "A spring celebration", weight: "rose-petal" },
        { id: "q5d", label: "An evening gala", weight: "midnight" }
      ]
    }
  ];

  // ---- result definitions ----
  var RESULTS = {
    "amber-drop": {
      name: "Amber Drop",
      description:
        "Warm, welcoming and full of glow. You gravitate to cosy comfort and rich tones.",
      image: "assets/quiz/amber-drop.jpg"
    },
    "midnight": {
      name: "Midnight",
      description:
        "Deep, striking and a little mysterious. You love drama and quiet confidence.",
      image: "assets/quiz/midnight.jpg"
    },
    "rose-petal": {
      name: "Rose Petal",
      description:
        "Gentle, romantic and delicate. Soft beauty and pretty details are your signature.",
      image: "assets/quiz/rose-petal.jpg"
    },
    "sea-glass": {
      name: "Sea Glass",
      description:
        "Fresh, breezy and calm. You are drawn to the sea and effortless, light designs.",
      image: "assets/quiz/sea-glass.jpg"
    }
  };

  // ---- helpers ----
  // Find a question by list index; returns null when out of range.
  function questionAt(index) {
    if (index == null || index < 0 || index >= QUESTIONS.length) return null;
    return QUESTIONS[index];
  }

  // Shallow-copy the answers map so state updates stay immutable.
  function cloneAnswers(answers) {
    var out = {};
    if (answers) {
      for (var k in answers) {
        if (Object.prototype.hasOwnProperty.call(answers, k)) out[k] = answers[k];
      }
    }
    return out;
  }

  // ---- pure logic ----

  // A fresh state positioned at the first question with no recorded answers.
  function initialState() {
    return { index: 0, answers: {} };
  }

  // Record the option chosen for the question at qIndex. Returns a new state;
  // does not mutate the input. Ignores an out-of-range qIndex.
  function recordAnswer(state, qIndex, optionId) {
    state = state || initialState();
    var q = questionAt(qIndex);
    var answers = cloneAnswers(state.answers);
    if (q) answers[q.id] = optionId;
    return { index: state.index, answers: answers };
  }

  // Attempt to advance from the current question.
  //   - No selection recorded for the current question (Req 4.5): stay put,
  //     requireSelection = true.
  //   - Selection present on a non-final question (Req 4.3): index moves +1.
  //   - Selection present on the final question (Req 4.4): index stays at the
  //     final question so the page can display the result.
  // Returns { state, requireSelection }; never mutates the input.
  function advance(state) {
    state = state || initialState();
    var q = questionAt(state.index);
    var selected = q && state.answers ? state.answers[q.id] : undefined;
    var hasSelection = selected != null;
    if (!hasSelection) {
      return {
        state: { index: state.index, answers: cloneAnswers(state.answers) },
        requireSelection: true
      };
    }
    var isFinal = state.index >= QUESTIONS.length - 1;
    var nextIndex = isFinal ? state.index : state.index + 1;
    return {
      state: { index: nextIndex, answers: cloneAnswers(state.answers) },
      requireSelection: false
    };
  }

  // True when the current state sits on the final question.
  function isFinalQuestion(state) {
    state = state || initialState();
    return state.index >= QUESTIONS.length - 1;
  }

  // True when every question has a recorded answer.
  function isComplete(state) {
    state = state || initialState();
    for (var i = 0; i < QUESTIONS.length; i++) {
      var id = QUESTIONS[i].id;
      if (!state.answers || state.answers[id] == null) return false;
    }
    return true;
  }

  // Deterministic reduction of the recorded answers into a resultId.
  // Tallies the weight of each selected option; the highest tally wins, with
  // ties broken by resultId ASC so identical answer sets always agree (Req 4.6).
  function computeResult(answers) {
    var tally = {};
    if (answers) {
      for (var i = 0; i < QUESTIONS.length; i++) {
        var q = QUESTIONS[i];
        var chosen = answers[q.id];
        if (chosen == null) continue;
        for (var j = 0; j < q.options.length; j++) {
          var opt = q.options[j];
          if (opt.id === chosen) {
            tally[opt.weight] = (tally[opt.weight] || 0) + 1;
            break;
          }
        }
      }
    }
    var winner = null;
    var best = -1;
    // Iterate RESULTS keys in sorted order for a stable tie-break.
    var keys = Object.keys(RESULTS).sort();
    for (var k = 0; k < keys.length; k++) {
      var rid = keys[k];
      var count = tally[rid] || 0;
      if (count > best) {
        best = count;
        winner = rid;
      }
    }
    return winner;
  }

  // Return a fresh state at the first question, clearing all answers (Req 4.7).
  function restart(state) {
    return initialState();
  }

  var api = {
    QUESTIONS: QUESTIONS,
    RESULTS: RESULTS,
    initialState: initialState,
    recordAnswer: recordAnswer,
    advance: advance,
    isFinalQuestion: isFinalQuestion,
    isComplete: isComplete,
    computeResult: computeResult,
    restart: restart
  };

  // Attach to the browser namespace when a window exists.
  if (root && root.CC) root.CC.quiz = api;

  // Export for Node/Vitest when a module system is present.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
