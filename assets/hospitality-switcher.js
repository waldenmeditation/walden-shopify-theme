/* Hospitality landing — instant program-switcher.
   Tabs are real links (each program has its own server-rendered URL).
   This enhances them: prefetch on intent, then swap just the .hosp section
   in place and update history so switching feels instant. Falls back to a
   normal navigation if anything is unavailable or JS is off. */
(function () {
  if (window.__hospSwitcherInit) return;
  window.__hospSwitcherInit = true;

  var cache = {};

  function getSection(doc) {
    return (doc || document).querySelector('.hosp');
  }

  function tabLink(target) {
    return target && target.closest ? target.closest('a.hosp-switcher__tab[href]') : null;
  }

  function prefetch(url) {
    if (!cache[url]) {
      cache[url] = fetch(url, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.text() : null; })
        .catch(function () { cache[url] = null; return null; });
    }
    return cache[url];
  }

  function swap(html, url, push) {
    if (!html) { window.location.href = url; return; }
    var incoming = getSection(new DOMParser().parseFromString(html, 'text/html'));
    var current = getSection(document);
    if (!incoming || !current) { window.location.href = url; return; }
    current.replaceWith(incoming);
    var title = new DOMParser().parseFromString(html, 'text/html').querySelector('title');
    if (title) document.title = title.textContent;
    if (push) history.pushState({ hosp: true }, '', url);
    window.scrollTo(0, 0);
  }

  // Warm the cache on hover / focus so the click is instant.
  ['mouseover', 'focusin', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      var a = tabLink(e.target);
      if (a) prefetch(a.getAttribute('href'));
    }, { passive: true });
  });

  document.addEventListener('click', function (e) {
    var a = tabLink(e.target);
    if (!a) return;
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var url = a.getAttribute('href');
    Promise.resolve(prefetch(url)).then(function (html) { swap(html, url, true); });
  });

  window.addEventListener('popstate', function () {
    var url = window.location.pathname + window.location.search;
    Promise.resolve(prefetch(url)).then(function (html) {
      if (html) swap(html, url, false); else window.location.reload();
    });
  });
})();
