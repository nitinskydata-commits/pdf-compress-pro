// Legacy cache-buster: refreshes stale browser caches to load the new React app
(function () {
  if (typeof window !== 'undefined') {
    if (!document.getElementById('root')) {
      // If the old HTML is loaded, reload to fetch the new SPA
      setTimeout(function () {
        window.location.reload();
      }, 100);
    }
  }
})();
