/* Product film — play while in view, pause off-screen, per-frame sound
   toggle. Reduced motion: no autoplay, native controls instead. */
(function () {
  function init() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.product-film').forEach(function (sec) {
      if (sec.__filmInit) return;
      sec.__filmInit = true;
      var videos = sec.querySelectorAll('video');
      if (!videos.length) return;
      if (reduce) {
        videos.forEach(function (v) {
          v.removeAttribute('autoplay');
          v.pause();
          v.setAttribute('controls', '');
        });
        return;
      }
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            var v = e.target;
            if (e.isIntersecting) {
              var p = v.play();
              if (p && p.catch) p.catch(function () {});
            } else {
              v.pause();
            }
          });
        }, { threshold: 0.2 });
        videos.forEach(function (v) { io.observe(v); });
      }
      sec.querySelectorAll('.product-film__sound').forEach(function (btn) {
        var frame = btn.closest('.product-film__frame') || sec;
        var video = frame.querySelector('video');
        if (!video) return;
        btn.hidden = false;
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
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
