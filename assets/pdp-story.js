/* PDP story enhancements: scroll reveals, sticky add-to-cart bar,
   and "back to buy box" CTAs. Idempotent (multiple sections load it),
   skipped in the theme editor, reduced-motion safe. */
(function () {
  if (window.__pdpStoryInit) return;
  window.__pdpStoryInit = true;

  var designMode = window.Shopify && window.Shopify.designMode;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveals() {
    var els = document.querySelectorAll('.pdp-reveal:not(.is-visible)');
    if (!els.length) return;
    if (reduceMotion || designMode || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function initStickyAtc() {
    var bar = document.querySelector('[data-pdp-atc]');
    if (!bar || designMode) return;
    var mainButton = document.querySelector('.product-details .add-to-cart-button');
    if (!mainButton) return;
    bar.hidden = false;

    var barButton = bar.querySelector('[data-pdp-atc-button]');
    var barPrice = bar.querySelector('[data-pdp-atc-price]');
    var mainPrice = document.querySelector('.product-details .price');

    if (barButton) {
      barButton.addEventListener('click', function () {
        if (mainButton.disabled) {
          // Sold-out or unselected state: bring the user to the buy box instead.
          scrollToBuyBox();
          return;
        }
        mainButton.click();
      });
    }

    // Mirror the live price (updates when the variant changes).
    if (barPrice && mainPrice) {
      var syncPrice = function () {
        var text = (mainPrice.textContent || '').trim().replace(/\s+/g, ' ');
        if (text) barPrice.textContent = text;
      };
      syncPrice();
      new MutationObserver(syncPrice).observe(mainPrice, { childList: true, subtree: true, characterData: true });
    }

    // Mirror disabled/sold-out label.
    var syncState = function () {
      if (barButton) barButton.classList.toggle('is-disabled', !!mainButton.disabled);
    };
    syncState();
    new MutationObserver(syncState).observe(mainButton, { attributes: true, attributeFilter: ['disabled'] });

    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // Show only once the buy button has scrolled up out of view.
        var passed = !e.isIntersecting && e.boundingClientRect.bottom < 0;
        bar.classList.toggle('is-active', passed);
      });
    }, { threshold: 0 }).observe(mainButton);
  }

  function scrollToBuyBox() {
    var target = document.querySelector('.product-details') || document.querySelector('.product-information');
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function initScrollButtons() {
    document.querySelectorAll('[data-pdp-scroll-buy]').forEach(function (btn) {
      if (btn.__pdpBound) return;
      btn.__pdpBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToBuyBox();
      });
    });
  }

  function init() {
    initReveals();
    initStickyAtc();
    initScrollButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
