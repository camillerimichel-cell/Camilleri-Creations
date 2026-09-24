/*
 * Camilleri Creations — glass gallery pure logic (gallery.js)
 *
 * Pure functions backing glass.html's carousel + per-image enquiry.
 * Follows the module-export-for-tests pattern documented in namespace.js:
 * attaches to window.CC.gallery in the browser AND exports for Node/Vitest,
 * with no build step and no test dependency shipped to the site.
 *
 * See design.md "3. gallery.js" and Data Models → Constants.
 *   _Requirements: 1.1, 1.3, 1.4, 2.3_
 */
(function (root) {
  // Generic alt fallback for images missing/empty alt text (Req 1.4).
  var GENERIC_ALT = "Glass-art work";

  // Image load guard timeout in ms (Req 1.6). Consumed by glass.html's loader.
  var IMAGE_LOAD_TIMEOUT_MS = 10000;

  // GLASS_SUBJECT_PREFIX is owned by mailto.js (single source of truth, Req 2.3).
  // Resolve it without coupling load order or the build:
  //   - Node/Vitest: require the sibling module.
  //   - Browser: read from window.CC.mailto if present.
  //   - Fallback: the fixed literal, kept identical to mailto.js.
  function resolveGlassSubjectPrefix() {
    if (typeof module !== "undefined" && module.exports) {
      try {
        var m = require("./mailto.js");
        if (m && typeof m.GLASS_SUBJECT_PREFIX === "string") {
          return m.GLASS_SUBJECT_PREFIX;
        }
      } catch (e) {
        /* mailto.js not present yet — fall through to literal */
      }
    }
    if (root && root.CC && root.CC.mailto &&
        typeof root.CC.mailto.GLASS_SUBJECT_PREFIX === "string") {
      return root.CC.mailto.GLASS_SUBJECT_PREFIX;
    }
    return "Glass Art Enquiry: ";
  }

  // ---- pure logic ----

  // Stable ascending alphanumeric sort by `file` (Req 1.1).
  // Returns a new array; a stable sort keeps equal-`file` entries in input order.
  function sortImages(entries) {
    var list = (entries || []).slice();
    return list.sort(function (a, b) {
      var fa = a && a.file != null ? String(a.file) : "";
      var fb = b && b.file != null ? String(b.file) : "";
      if (fa < fb) return -1;
      if (fa > fb) return 1;
      return 0;
    });
  }

  // Next index with wrap last -> first (Req 1.3).
  function nextIndex(i, n) {
    return (i + 1) % n;
  }

  // Previous index with wrap first -> last (Req 1.3).
  function prevIndex(i, n) {
    return (i - 1 + n) % n;
  }

  // Alt text with generic fallback when missing/empty (Req 1.4).
  function altFor(entry) {
    if (entry && typeof entry.alt === "string" && entry.alt.length > 0) {
      return entry.alt;
    }
    return GENERIC_ALT;
  }

  // Fixed-literal prefix + piece ref → enquiry subject (Req 2.3).
  function enquirySubject(ref) {
    return resolveGlassSubjectPrefix() + ref;
  }

  var api = {
    sortImages: sortImages,
    nextIndex: nextIndex,
    prevIndex: prevIndex,
    altFor: altFor,
    enquirySubject: enquirySubject,
    IMAGE_LOAD_TIMEOUT_MS: IMAGE_LOAD_TIMEOUT_MS,
    GENERIC_ALT: GENERIC_ALT
  };

  // Attach to the browser namespace when a window exists.
  if (root && root.CC) root.CC.gallery = api;

  // Export for Node/Vitest when a module system is present.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
