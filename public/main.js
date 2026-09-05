(function () {
  if (typeof window === 'undefined') return;
  // If the modern React SPA root is present, do nothing
  if (document.getElementById('root')) return;

  // Stale static HTML cache self-healing migration:
  // If an old browser cache serves the obsolete static HTML page, immediately upgrade to the modern SPA.
  try {
    var key = '__stale_purged';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      var path = window.location.pathname.replace(/\.html$/, '');
      window.location.replace(path + (path.endsWith('/') ? '' : '/') + '?v=' + Date.now());
    }
  } catch (e) {
    window.location.reload(true);
  }
})();
