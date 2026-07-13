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

  // Back in stock notify: posts a Shopify contact form via fetch (the chip
  // area lives inside the product form, so a nested <form> is not an option).
  // Delegated so it survives the section re-render on variant change.
  function initRestock() {
    if (window.__pdpRestockInit) return;
    window.__pdpRestockInit = true;

    function submit(wrap) {
      var input = wrap.querySelector('[data-restock-email]');
      var btn = wrap.querySelector('[data-restock-submit]');
      if (!input || !btn) return;
      if (!input.value || !input.checkValidity()) {
        input.reportValidity();
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Sending';
      var fd = new FormData();
      fd.append('form_type', 'contact');
      fd.append('utf8', '✓');
      fd.append('contact[email]', input.value);
      fd.append('contact[Restock]', wrap.dataset.product + ' / ' + wrap.dataset.variant + ' (variant ' + wrap.dataset.variantId + ')');
      fetch('/contact', { method: 'POST', body: fd })
        .then(function () {
          var done = document.createElement('div');
          done.className = 'conversion-chip';
          done.textContent = "Thanks. We'll email you when it's back in stock.";
          wrap.replaceWith(done);
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'Notify me';
        });
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-restock-submit]');
      if (!btn) return;
      submit(btn.closest('[data-restock]'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var input = e.target.closest && e.target.closest('[data-restock-email]');
      if (!input) return;
      e.preventDefault();
      submit(input.closest('[data-restock]'));
    });
  }

  function init() {
    initReveals();
    initStickyAtc();
    initScrollButtons();
    initRestock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
