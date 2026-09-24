/*
 * Camilleri Creations — mailto helper module.
 *
 * Pure builders for `mailto:` links plus a thin side-effect wrapper. Every
 * submission across the site addresses a single recipient (CONTACT); there is
 * no backend, DB, or runtime network. Follows the module-export-for-tests
 * pattern documented in namespace.js: attach to `window.CC.mailto` in the
 * browser and export for Node/Vitest, with no build step.
 */
(function (root) {
  // ---- module constants ----
  var CONTACT = "camilleri.creations.uk@gmail.com";
  var GLASS_SUBJECT_PREFIX = "Glass Art Enquiry: ";

  // ---- pure logic ----
  // Build a mailto: URL addressed solely to CONTACT, with subject/body
  // percent-encoded via encodeURIComponent. Missing subject/body default to "".
  function buildMailto(opts) {
    opts = opts || {};
    var subject = opts.subject == null ? "" : String(opts.subject);
    var body = opts.body == null ? "" : String(opts.body);
    return (
      "mailto:" +
      CONTACT +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  // ---- side-effect wrapper (kept separate from pure builder) ----
  function openMailto(url) {
    root.location.href = url;
  }

  var api = {
    CONTACT: CONTACT,
    GLASS_SUBJECT_PREFIX: GLASS_SUBJECT_PREFIX,
    buildMailto: buildMailto,
    openMailto: openMailto,
  };

  // Attach to the browser namespace when a window exists.
  if (root && root.CC) root.CC.mailto = api;

  // Export for Node/Vitest when a module system is present.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
