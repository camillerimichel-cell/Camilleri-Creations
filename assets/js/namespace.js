/*
 * Camilleri Creations — shared client namespace.
 *
 * Establishes the single global `window.CC` under which every feature module
 * (mailto, gallery, feed, quiz, questionnaire) attaches its pure functions.
 *
 * ── Zero-build runtime ──────────────────────────────────────────────────────
 * This file (and all sibling modules in assets/js/) are plain browser scripts
 * included with <script src>. There is no bundler, no framework, no build step.
 * The published site ships exactly these files.
 *
 * ── Module-export-for-tests pattern ─────────────────────────────────────────
 * Each logic module is authored so its pure functions can be:
 *   1. attached to `window.CC.<module>` for use by the pages in the browser, and
 *   2. imported by Node (Vitest + fast-check) for property/unit testing,
 * WITHOUT any build step and WITHOUT shipping any test dependency to the site.
 *
 * The convention every module follows:
 *
 *     // assets/js/example.js
 *     (function (root) {
 *       // ---- pure logic ----
 *       function doThing(x) { return x; }
 *
 *       var api = { doThing: doThing };
 *
 *       // Attach to the browser namespace when a window exists.
 *       if (root && root.CC) root.CC.example = api;
 *
 *       // Export for Node/Vitest when a module system is present.
 *       if (typeof module !== "undefined" && module.exports) {
 *         module.exports = api;
 *       }
 *     })(typeof window !== "undefined" ? window : globalThis);
 *
 * Notes:
 *   - In the browser, `window.CC` is created by THIS file, so namespace.js must
 *     be included BEFORE the feature modules on every page.
 *   - `module`/`module.exports` only exist under Node, so the export branch is a
 *     no-op in the browser — no test code is ever evaluated or shipped.
 *   - Feature modules keep side effects (e.g. setting window.location) in thin
 *     wrappers separate from the pure functions, so tests import pure logic only.
 */
(function (root) {
  root.CC = root.CC || {};

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.CC;
  }
})(typeof window !== "undefined" ? window : globalThis);
