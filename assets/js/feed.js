/*
 * Camilleri Creations — News & Blog feed logic.
 *
 * Pure functions for ordering, formatting, and selecting News_Blog_Posts.
 * Follows the module-export-for-tests pattern documented in namespace.js:
 * attaches to window.CC.feed in the browser and exports for Node/Vitest.
 *
 * A post is a plain object of shape:
 *   { id: string, title: string, date: string (ISO "YYYY-MM-DD"),
 *     category: string, href: string }
 */
(function (root) {
  var MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  /**
   * Order posts by publication date DESC, ties broken by id ASC (lexicographic).
   * Deterministic, stable, idempotent. Does not mutate the input.
   * @param {Array} posts
   * @returns {Array} a new sorted array
   */
  function sortPosts(posts) {
    if (!posts) return [];
    return posts.slice().sort(function (a, b) {
      var da = a && a.date ? String(a.date) : "";
      var db = b && b.date ? String(b.date) : "";
      if (da < db) return 1;   // later date first (DESC)
      if (da > db) return -1;
      var ia = a && a.id != null ? String(a.id) : "";
      var ib = b && b.id != null ? String(b.id) : "";
      if (ia < ib) return -1;  // id ASC
      if (ia > ib) return 1;
      return 0;
    });
  }

  /**
   * Format an ISO date ("YYYY-MM-DD") as "D Month YYYY" — e.g. "14 February 2026".
   * Day has no leading zero; month is a full name; year is four digits.
   * @param {string} iso
   * @returns {string}
   */
  function formatDate(iso) {
    if (iso == null) return "";
    var s = String(iso);
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (!m) return s;
    var year = m[1];
    var monthIdx = parseInt(m[2], 10) - 1;
    var day = parseInt(m[3], 10);
    if (monthIdx < 0 || monthIdx > 11) return s;
    return day + " " + MONTHS[monthIdx] + " " + year;
  }

  /**
   * Return the post whose id matches, or null if none.
   * @param {Array} posts
   * @param {string} id
   * @returns {object|null}
   */
  function selectPost(posts, id) {
    if (!posts) return null;
    for (var i = 0; i < posts.length; i++) {
      var p = posts[i];
      if (p && String(p.id) === String(id)) return p;
    }
    return null;
  }

  var api = {
    sortPosts: sortPosts,
    formatDate: formatDate,
    selectPost: selectPost
  };

  if (root && root.CC) root.CC.feed = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
