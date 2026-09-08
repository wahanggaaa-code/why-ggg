/* WORK — stage kartu 3D scatter, scroll-driven (pola efek: flying cards ala huyml.co).
   Tanpa GSAP / reduced-motion → CSS fallback grid tetap terbaca. */
(function () {
  'use strict';
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('ws-on');

  var cards = [].slice.call(document.querySelectorAll('.wcard'));
  var wis = [].slice.call(document.querySelectorAll('.wi'));
  var nowEl = document.getElementById('wNow');
  var N = cards.length;
  if (!N) return;

  // Scatter deterministik: tiap kartu punya posisi jauh / fokus / lewat-kamera.
  function sgn(i) { return i % 2 ? 1 : -1; }
  function far(i)  { return { x: sgn(i) * (16 + (i * 7) % 20) + 'vw', y: (((i * 13) % 22) - 11) + 'vh', rz: sgn(i) * (-15 + (i * 5) % 9), ry: sgn(i) * (20 + (i * 3) % 12), rx: ((i * 11) % 14) - 7 }; }
  function mid(i)  { return { x: (sgn(i) * ((i * 5) % 9)) + 'vw', y: (((i * 7) % 10) - 5) + 'vh', rz: sgn(i) * -3, ry: sgn(i) * 5, rx: -1.5 }; }
  function pass(i) { return { x: sgn(i) * (24 + (i * 3) % 14) + 'vw', y: (((i * 17) % 26) - 13) + 'vh', rz: sgn(i) * 12 }; }

  var slot = 1 / N;
  var tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#stageW', start: 'top top', end: 'bottom bottom', scrub: 0.55,
      onUpdate: function (st) {
        var idx = Math.max(0, Math.min(N - 1, Math.floor(st.progress * N + 0.35)));
        for (var k = 0; k < N; k++) wis[k] && wis[k].classList.toggle('on', k === idx);
        if (nowEl) nowEl.textContent = String(idx + 1).padStart(2, '0');
      } }
  });

  cards.forEach(function (card, i) {
    var f = far(i), m = mid(i), p = pass(i);
    tl.fromTo(card,
      { x: f.x, y: f.y, z: -2600, rotationX: f.rx, rotationY: f.ry, rotationZ: f.rz, scale: 0.72, opacity: 0 },
      { x: m.x, y: m.y, z: -140, rotationX: m.rx, rotationY: m.ry, rotationZ: m.rz, scale: 1, opacity: 1, duration: slot * 1.55, ease: 'power2.out' },
      i * slot);
    tl.to(card,
      { x: p.x, y: p.y, z: 640, rotationZ: p.rz, opacity: 0, duration: slot * 1.15, ease: 'power1.in' },
      i * slot + slot * 1.55);
  });

  // Parallax tilt halus mengikuti pointer (desktop saja).
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var tilt = document.getElementById('wtilt');
    window.addEventListener('mousemove', function (e) {
      var tx = e.clientX / window.innerWidth - 0.5;
      var ty = e.clientY / window.innerHeight - 0.5;
      gsap.to(tilt, { rotationY: tx * 3.2, rotationX: -ty * 2.2, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
    }, { passive: true });
  }
})();
