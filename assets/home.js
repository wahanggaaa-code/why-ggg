/* WHY ✴︎ GGG — home v2 motion system: Lenis + GSAP/ScrollTrigger */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var mqMob = window.matchMedia('(max-width:760px)');
  document.documentElement.classList.add('js');

  function n2(x) { return (x < 10 ? '0' : '') + x; }
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* elemen rail dipakai semua mode (gsap / fallback) */
  var wrap = $('#railWrap'), pin = $('#railPin'), rail = $('#rail');
  var bar = $('#railBar'), nowEl = $('#awNow');
  var total = $$('.rslide').length;
  var totalTxt = $('#awTotal'); if (totalTxt) totalTxt.textContent = n2(total);
  function hud(p) {
    if (bar) bar.style.width = (p * 100).toFixed(2) + '%';
    if (nowEl) nowEl.textContent = n2(Math.round(p * (total - 1)) + 1);
  }
  function maxX() { return Math.max(0, rail.scrollWidth - window.innerWidth); }

  /* ============ LOADER — crystal video, videoWrap out, tirai naik (signature) ============
     Hanya muncul saat home dimuat langsung / refresh / back-forward.
     Bila tiba lewat transisi antar-halaman (flag __wgl_a dari transition.js),
     loader dilewati supaya curtain reveal "racing steps" tampil penuh seperti semula. */
  var loader = $('#loader'), videoWrap = $('#videoWrap'), crystal = $('#crystalVideo');
  var loaderDone = false, vtArriving = false;
  try { vtArriving = sessionStorage.getItem('__wgl_a') === '1'; } catch (e) {}
  function loaderOut() {
    if (loaderDone) return; loaderDone = true;
    if (reduced || !loader || vtArriving) {
      if (loader) loader.classList.add('gone');
      reveal(); return;
    }
    if (videoWrap) videoWrap.classList.add('out');        /* video pudar + mengecil dulu */
    setTimeout(function () {
      loader.classList.add('out');                         /* lalu tirai naik */
      setTimeout(reveal, 260);
    }, 380);
    setTimeout(function () { loader.classList.add('gone'); }, 1400);
  }
  if (vtArriving && loader) {
    loader.classList.add('gone');                          /* transisi ambil alih arrival */
    reveal();
  } else if (loader && crystal && !reduced) {
    var started = false;
    function startCrystal() {
      if (started) return; started = true;
      try {
        if (crystal.duration && isFinite(crystal.duration)) crystal.playbackRate = Math.max(1, crystal.duration / 1.6);
      } catch (e) {}
      var pr = crystal.play(); if (pr && pr.catch) pr.catch(function () {});
    }
    crystal.addEventListener('canplay', startCrystal);
    crystal.addEventListener('ended', loaderOut);
    crystal.addEventListener('error', loaderOut);
    setTimeout(loaderOut, 3000);                           /* anti-jam: maksimal 3 detik */
    if (crystal.readyState >= 2) startCrystal();
  } else {
    loaderOut();
  }
  /* reduced-motion: video hero tidak autoplay */
  if (reduced) { var hv = $('.hero-bg video'); if (hv) { hv.removeAttribute('autoplay'); hv.pause(); } }

  /* ================= GSAP + LENIS ================= */
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var lenis = null;
  if (!hasGsap || reduced) {
    if (!reduced && !hasGsap) document.documentElement.classList.remove('js');
  } else {
    gsap.registerPlugin(ScrollTrigger);
    if (fine && typeof window.Lenis !== 'undefined') {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.7 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.documentElement.style.scrollBehavior = 'auto';
    }
  }

  function scrollToY(y) {
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ================= HERO REVEAL ================= */
  var revealed = false;
  function reveal() {
    if (revealed) return; revealed = true;
    if (reduced || !hasGsap) {
      $$('.ln-i').forEach(function (el) { el.style.transform = 'none'; });
      return;
    }
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.hero-title .ln-i', { y: 0, duration: 1.15, stagger: 0.085 }, 0.1)
      .fromTo('.hero-desc', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.6)
      .fromTo('.hero-cue', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.9);
  }

  if (!hasGsap) return wireBasic();

  /* ================= MANIFESTO word scrub ================= */
  (function () {
    var el = $('#mfBig'); if (!el) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
        else if (part) { var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
      });
      node.parentNode.replaceChild(frag, node);
    });
    var words = el.querySelectorAll('.w');
    if (!reduced) gsap.fromTo(words, { opacity: 0.13 }, {
      opacity: 1, ease: 'none', stagger: { each: 0.04 },
      scrollTrigger: { trigger: '#manifesto', start: 'top 72%', end: 'bottom 58%', scrub: 0.6 }
    });
  })();

  /* ================= 01 ARCHIVE rail ================= */
  if (reduced) {
    pin.classList.add('rail-fallback');
  } else {
    var mm = gsap.matchMedia();
    /* --- desktop: pinned, scrubbed horizontal rail + parallax isi kartu --- */
    mm.add('(min-width:761px)', function () {
      var tween = gsap.to(rail, {
        x: function () { return -maxX(); }, ease: 'none',
        scrollTrigger: {
          trigger: wrap, start: 'top top',
          end: function () { return '+=' + (maxX() + window.innerHeight * 0.4); },
          pin: pin, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (s) { hud(s.progress); }
        }
      });
      $$('.rslide').forEach(function (card) {
        var img = card.querySelector('.rcvr');
        gsap.fromTo(img, { xPercent: -5 }, {
          xPercent: 5, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
      window.__railTween = tween;
      return function () {
        window.__railTween = null;
        gsap.set(rail, { clearProps: 'transform' });
        $$('.rslide .rcvr').forEach(function (img) { gsap.set(img, { clearProps: 'transform' }); });
        hud(0);
      };
    });
    /* --- mobile: native snap carousel (HUD dibaca dari scrollLeft) --- */
    mm.add('(max-width:760px)', function () {
      function onScroll() {
        var den = Math.max(1, rail.scrollWidth - rail.clientWidth);
        hud(Math.max(0, Math.min(1, rail.scrollLeft / den)));
      }
      rail.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return function () { rail.removeEventListener('scroll', onScroll); };
    });
  }

  /* arrows: desktop = scroll vertikal ke posisi scrub, mobile = scroll rail */
  function nativeIdx() {
    var cards = $$('.rslide'), r = rail.getBoundingClientRect();
    var pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0, best = 0, bd = Infinity;
    cards.forEach(function (c, i) {
      var d = Math.abs(c.getBoundingClientRect().left - (r.left + pad));
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function nativeTo(i) {
    var cards = $$('.rslide');
    i = Math.max(0, Math.min(cards.length - 1, i));
    var r = rail.getBoundingClientRect(), c = cards[i].getBoundingClientRect();
    var left = rail.scrollLeft + (c.left - r.left) - (parseFloat(getComputedStyle(rail).paddingLeft) || 0);
    rail.scrollTo({ left: left, behavior: reduced ? 'auto' : 'smooth' });
  }
  function go(dir) {
    if (mqMob.matches || reduced) { nativeTo(nativeIdx() + dir); return; }
    var tw = window.__railTween; if (!tw) return;
    var st = tw.scrollTrigger, p = Math.max(0, Math.min(1, (parseInt(nowEl.textContent, 10) - 1 + dir) / (total - 1)));
    scrollToY(st.start + p * (st.end - st.start));
  }
  var pb = $('#railPrev'), nb = $('#railNext');
  if (pb) pb.addEventListener('click', function () { go(-1); });
  if (nb) nb.addEventListener('click', function () { go(1); });

  /* ================= LOG + CLOSING reveal ================= */
  gsap.fromTo('.log-row', { y: 26, opacity: 0 }, {
    y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', stagger: 0.07,
    scrollTrigger: { trigger: '.log-list', start: 'top 84%', once: true }
  });
  gsap.fromTo('.cl-title', { y: 46, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1, ease: 'power4.out',
    scrollTrigger: { trigger: '#closing', start: 'top 72%', once: true }
  });
  gsap.fromTo('.cl-row', { y: 24, opacity: 0 }, {
    y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '#closing', start: 'top 55%', once: true }
  });

  /* ================= SCRAMBLE judul section ================= */
  (function () {
    var els = $$('.scramble'); if (!els.length || reduced) return;
    els.forEach(function (el) { el.dataset.text = el.textContent; });
    var GLYPHS = "#/\\<>+=*—01";
    function decode(el) {
      var target = el.dataset.text, dur = 700, t0 = performance.now();
      (function frame(t) {
        var p = Math.min(1, (t - t0) / dur), settled = Math.floor(p * target.length), out = '';
        for (var i = 0; i < target.length; i++) {
          var ch = target[i];
          out += ch === ' ' ? ' ' : (i < settled ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]);
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(frame); else el.textContent = target;
      })(t0);
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { decode(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ================= CUSTOM CURSOR ================= */
  if (fine && !reduced) {
    var cur = $('#cursor');
    if (cur) {
      var ring = cur.querySelector('.cur-ring'), label = cur.querySelector('.cur-label');
      var dot = cur.querySelector('.cur-dot');
      var qx = gsap.quickTo(dot, 'x', { duration: 0.16, ease: 'power2' });
      var qy = gsap.quickTo(dot, 'y', { duration: 0.16, ease: 'power2' });
      var rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
      var ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
      window.addEventListener('pointermove', function (e) {
        cur.classList.add('on');
        qx(e.clientX); qy(e.clientY); rx(e.clientX); ry(e.clientY);
      }, { passive: true });
      document.addEventListener('mouseover', function (e) {
        var view = e.target.closest && e.target.closest('.rslide');
        var link = e.target.closest && e.target.closest('a,button');
        cur.classList.toggle('is-view', !!view);
        cur.classList.toggle('is-link', !view && !!link);
        if (label) label.textContent = view ? 'View' : '';
      });
    }
    /* magnetic */
    $$('[data-mag]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        gsap.to(el, { x: Math.max(-14, Math.min(14, dx)), y: Math.max(-10, Math.min(10, dy)), duration: 0.5, ease: 'power3' });
      });
      el.addEventListener('pointerleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' }); });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* ================= fallback tanpa GSAP ================= */
  function wireBasic() {
    function onScroll() {
      var den = Math.max(1, rail.scrollWidth - rail.clientWidth);
      hud(Math.max(0, Math.min(1, rail.scrollLeft / den)));
    }
    if (rail) {
      rail.addEventListener('scroll', onScroll, { passive: true });
      pin.classList.add('rail-fallback');
      onScroll();
    }
    var pb2 = $('#railPrev'), nb2 = $('#railNext');
    if (pb2) pb2.addEventListener('click', function () { nativeTo(nativeIdx() - 1); });
    if (nb2) nb2.addEventListener('click', function () { nativeTo(nativeIdx() + 1); });
  }
})();
