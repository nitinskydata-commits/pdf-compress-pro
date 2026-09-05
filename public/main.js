// Legacy cache buster: redirects any stale cached HTML page to its modern React route
(function () {
  if (typeof window !== 'undefined') {
    if (!document.getElementById('root')) {
      var target = '/';
      var loc = window.location.pathname.toLowerCase();
      if (loc.indexOf('contact') !== -1) target = '/contact';
      else if (loc.indexOf('privacy') !== -1) target = '/privacy';
      else if (loc.indexOf('terms') !== -1) target = '/terms';
      else if (loc.indexOf('compress') !== -1) target = '/pdf-compressor';
      window.location.replace(target);
    }
  }
})();
