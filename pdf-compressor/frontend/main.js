(function () {
  if (typeof window === 'undefined') return;
  // If modern React SPA root exists, do nothing
  if (document.getElementById('root')) return;

  // Self-healing migration for stale edge/browser caches:
  // If the browser loaded an old static HTML page without #root, upgrade to the modern React SPA immediately.
  try {
    var upgraded = sessionStorage.getItem('__spa_upgraded');
    if (!upgraded) {
      sessionStorage.setItem('__spa_upgraded', '1');
      var path = window.location.pathname.replace(/\.html$/, '');
      var search = window.location.search;
      var sep = search ? (search.indexOf('?') === 0 ? '&' : '?') : '?';
      window.location.replace(path + search + sep + 'spa=' + Date.now());
    }
  } catch (e) {
    if (window.location.search.indexOf('spa=') === -1) {
      window.location.replace(window.location.pathname.replace(/\.html$/, '') + '?spa=' + Date.now());
    }
  }
})();
