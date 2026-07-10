/* Product film — play while in view, pause off-screen, sound toggle.
   Reduced motion: no autoplay, native controls instead. */
(function () {
  function init() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.product-film').forEach(function (sec) {
      if (sec.__filmInit) return;
      sec.__filmInit = true;
      var video = sec.querySelector('video');
      var btn = sec.querySelector('.product-film__sound');
      if (!video) return;
      if (reduce) {
        video.removeAttribute('autoplay');
        video.pause();
        video.setAttribute('controls', '');
        return;
      }
      if (btn) btn.hidden = false;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              var p = video.play();
              if (p && p.catch) p.catch(function () {});
            } else {
              video.pause();
            }
          });
        }, { threshold: 0.2 }).observe(video);
      }
      if (btn) {
        btn.addEventListener('click', function () {
          video.muted = !video.muted;
          btn.classList.toggle('is-on', !video.muted);
          btn.setAttribute('aria-pressed', String(!video.muted));
          btn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
          if (!video.muted) {
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
          }
        });
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
