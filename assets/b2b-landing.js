/* B2B landing — instant program tabs + scroll reveal.
   Tabs are real links (each program is server-rendered at its own URL); this
   enhances them with prefetch + in-place section swap. Skipped entirely in
   the theme editor (designMode) so section settings stay editable. */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveals(root) {
    var els = (root || document).querySelectorAll('.b2b-reveal:not(.is-visible)');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initReveals(); });
  } else {
    initReveals();
  }

  if (window.Shopify && window.Shopify.designMode) return;
  if (window.__b2bLandingInit) return;
  window.__b2bLandingInit = true;

  var cache = {};
  var currentPath = window.location.pathname;

  function getSection(doc) {
    return (doc || document).querySelector('.b2b');
  }

  function tabLink(target) {
    return target && target.closest ? target.closest('.b2b-tabs a[href]') : null;
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
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var incoming = getSection(doc);
    var current = getSection(document);
    if (!incoming || !current) { window.location.href = url; return; }
    current.replaceWith(incoming);
    var title = doc.querySelector('title');
    if (title) document.title = title.textContent;
    if (push) history.pushState({ b2b: true }, '', url);
    currentPath = new URL(url, window.location.origin).pathname;
    incoming.setAttribute('tabindex', '-1');
    incoming.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    initReveals(incoming);
  }

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
    // Hash-only entries (the #inquire anchor) — let the browser handle it.
    if (window.location.pathname === currentPath) return;
    var url = window.location.pathname + window.location.search;
    Promise.resolve(prefetch(url)).then(function (html) {
      if (html) swap(html, url, false); else window.location.reload();
    });
  });
})();
