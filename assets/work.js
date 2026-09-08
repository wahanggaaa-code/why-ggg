/* WORK — carousel 3D loop. Mekanisme diport dari hero OCULAR (projek sendiri, se-garis dgn huyml.co):
   scroll-snap internal → progress → tiap slide di-lerp antara 3 keyframe posisi
   (sudut-kanan-atas = prev, pusat = center, sudut-kiri-bawah = next) dgn morph clip-path,
   velocity-blur pada UI, parallax mouse pada kartu pusat, dan loop infinito via reset snap.
   Tanpa GSAP / reduced-motion → kelas html.no-wn → fallback grid CSS. */
(function () {
  'use strict';
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm || !window.gsap) { document.documentElement.classList.add('no-wn'); return; }

  var slideData = [
    { cat: 'Editorial · Archive', title: 'Aethelgard — The Hidden Archive', desc: 'Arsip narasi fantasi: scroll berlapis, cahaya lilin, rahasia yang terbuka pelan.' },
    { cat: 'F&B · Brand', title: 'Vroeger Koffiehuis', desc: 'Rasa masa lalu diseduh hari ini — hangat, nostalgik, rendah hati.' },
    { cat: 'Type · Studio', title: 'LEXIER®', desc: 'Studio tipografi eksperimental: lebih baik salah daripada membosankan.' },
    { cat: 'Fashion · Editorial', title: 'ÉLAN — New Mood', desc: 'Editorial garis tegas dengan napas haute couture.' },
    { cat: 'Horlogerie · Luxury', title: 'VIPERA — Émeraude', desc: 'Waktu melingkar seperti ular — kemewahan yang sabar.' },
    { cat: 'Immersive · 3D', title: 'AELIAN — The Light Within', desc: 'Perjalanan cahaya & ruang; landing imersif yang tenang.' },
    { cat: 'Fashion · E-commerce', title: 'Cerulean Chic', desc: 'Katalog biru yang effortless — lookbook bersih beritme editorial.' },
    { cat: 'Fashion · Brand', title: 'CHERIEL', desc: 'Keanggunan abadi; guardians of grace dalam landing yang lembut.' },
    { cat: 'Cinematic · Portfolio', title: 'OCULAR', desc: 'Versi sinematik final — portfolio yang bergerak seperti film.' },
    { cat: 'Jewelry · Brand', title: 'GLINT', desc: 'See the light, wear the shine — kilau perhiasan dalam layout presisi.' }
  ];

  var N = slideData.length;
  var currentIndex = -1;
  var slides = document.querySelectorAll('.slide');
  var wraps = document.querySelectorAll('.parallax-wrap');
  var scrollArea = document.getElementById('wscroll');
  var uiLayer = document.getElementById('wui');
  if (!slides.length || !scrollArea) { document.documentElement.classList.add('no-wn'); return; }

  // snap points (tinggi piksel eksplisit agar snap tidak glitch) + click-through ke slide
  var H = window.innerHeight;
  var totalSections = 90, centerIndex = 40;
  for (var i = 0; i < totalSections; i++) {
    var d = document.createElement('div');
    d.className = 'snap-point';
    d.style.height = H + 'px';
    d.addEventListener('click', function (e) {
      this.style.pointerEvents = 'none';
      var elBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (elBelow && elBelow.closest('.slide')) elBelow.closest('.slide').click();
      this.style.pointerEvents = 'auto';
    });
    scrollArea.appendChild(d);
  }

  var startY = centerIndex * H;
  var targetScrollY = startY, currentScrollY = startY, lastScrollY = startY, velocity = 0;
  scrollArea.scrollTop = startY;

  var mouseX = 0, mouseY = 0, curRX = 0, curRY = 0;
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function lerp(a, b, t) { return a + (b - a) * t; }
  var cp = new Array(8);

  function renderLoop() {
    var W = window.innerWidth; H = window.innerHeight;
    targetScrollY = scrollArea.scrollTop;
    currentScrollY = lerp(currentScrollY, targetScrollY, 0.15);
    velocity = Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;

    // peripheral blur saat scroll kencang (tanda tangan huyml/OCULAR)
    if (velocity > 0.5) gsap.set(uiLayer, { filter: 'blur(' + Math.min(velocity * 0.2, 10) + 'px)' });
    else gsap.set(uiLayer, { filter: 'blur(0px)' });

    var tRY = mouseX * 10, tRX = -mouseY * 10;
    curRY = lerp(curRY, tRY, 0.05); curRX = lerp(curRX, tRX, 0.05);

    var progress = currentScrollY / H;
    var Wc = W < 820 ? Math.min(W * 0.72, 430) : Math.min(W * 0.46, 760);
    var Hc = Wc / 1.45;

    var pw = Math.max(150, W * 0.11);
    var kfPrev = { w: pw, h: pw * 0.72, x: W - pw * 0.82, y: -pw * 0.1, cp: [0, 0, 100, 0, 100, 80, 0, 100], b: 0.3 };
    var kfCenter = { w: Wc, h: Hc, x: (W - Wc) / 2, y: (H - Hc) / 2 - H * 0.06, cp: [0, 0, 100, 0, 100, 100, 0, 100], b: 1 };
    var nw = Math.max(140, W * 0.10);
    var kfNext = { w: nw, h: nw * 0.62, x: -nw * 0.1, y: H - nw * 0.5, cp: [0, 20, 100, 0, 100, 100, 0, 100], b: 0.4 };

    for (var idx = 0; idx < N; idx++) {
      var el = slides[idx];
      var pMod = ((progress % N) + N) % N;
      var diff = idx - pMod;
      if (diff > N / 2) diff -= N;
      if (diff < -N / 2) diff += N;

      var w, h, x, y, b, opacity;
      if (diff <= -1) {
        var ex = Math.abs(diff + 1);
        w = kfPrev.w; h = kfPrev.h; x = kfPrev.x; y = kfPrev.y - ex * H * 0.14;
        cp = kfPrev.cp; b = kfPrev.b; opacity = Math.max(0, 1 - ex * 1.5);
      } else if (diff >= 1) {
        var ex2 = Math.abs(diff - 1);
        w = kfNext.w; h = kfNext.h; x = kfNext.x; y = kfNext.y + ex2 * H * 0.14;
        cp = kfNext.cp; b = kfNext.b; opacity = Math.max(0, 1 - ex2 * 1.5);
      } else if (diff < 0) {
        var t = diff + 1;
        w = lerp(kfPrev.w, kfCenter.w, t); h = lerp(kfPrev.h, kfCenter.h, t);
        x = lerp(kfPrev.x, kfCenter.x, t); y = lerp(kfPrev.y, kfCenter.y, t);
        b = lerp(kfPrev.b, kfCenter.b, t);
        for (var k = 0; k < 8; k++) cp[k] = lerp(kfPrev.cp[k], kfCenter.cp[k], t);
        opacity = 1;
      } else {
        var t2 = diff;
        w = lerp(kfCenter.w, kfNext.w, t2); h = lerp(kfCenter.h, kfNext.h, t2);
        x = lerp(kfCenter.x, kfNext.x, t2); y = lerp(kfCenter.y, kfNext.y, t2);
        b = lerp(kfCenter.b, kfNext.b, t2);
        for (var k2 = 0; k2 < 8; k2++) cp[k2] = lerp(kfCenter.cp[k2], kfNext.cp[k2], t2);
        opacity = 1;
      }

      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      el.style.clipPath = 'polygon(' + cp[0] + '% ' + cp[1] + '%, ' + cp[2] + '% ' + cp[3] + '%, ' + cp[4] + '% ' + cp[5] + '%, ' + cp[6] + '% ' + cp[7] + '%)';
      el.style.filter = 'brightness(' + b + ')';
      el.style.opacity = opacity;
      el.style.zIndex = Math.round(100 - Math.abs(diff) * 10);

      if (Math.abs(diff) < 0.5) wraps[idx].style.transform = 'scale(1.1) perspective(1000px) rotateX(' + curRX + 'deg) rotateY(' + curRY + 'deg)';
      else wraps[idx].style.transform = 'scale(1) perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }

    // reset loop infinito saat idle di ujung area scroll
    if ((progress < 10 || progress > 80) && targetScrollY % H === 0 && Math.abs(targetScrollY - currentScrollY) < 1) {
      var phase = Math.round(progress) % N;
      var reset = centerIndex + phase;
      scrollArea.scrollTop = reset * H;
      targetScrollY = currentScrollY = reset * H;
    }

    var active = ((Math.round(progress) % N) + N) % N;
    if (active !== currentIndex && velocity < 0.5) updateUI(active);

    requestAnimationFrame(renderLoop);
  }

  function setText(i) {
    document.getElementById('t-counter').textContent = String(i + 1).padStart(2, '0');
    document.getElementById('t-cat').textContent = slideData[i].cat;
    document.getElementById('t-title').textContent = slideData[i].title;
    document.getElementById('t-desc').textContent = slideData[i].desc;
  }
  function updateUIFirst(i) {
    currentIndex = i; setText(i);
    gsap.set(['#t-counter', '#t-cat', '#t-title', '#t-desc'], { y: '0%', opacity: 1 });
  }
  function updateUI(i) {
    if (currentIndex === i) return;
    currentIndex = i;
    var els = ['#t-counter', '#t-cat', '#t-title', '#t-desc'];
    gsap.killTweensOf(els);
    gsap.to(els, {
      y: '-50%', opacity: 0, duration: 0.15, stagger: 0.02, ease: 'power2.in',
      onComplete: function () {
        setText(i);
        gsap.set(els, { y: '50%', opacity: 0 });
        gsap.to(els, { y: '0%', opacity: 1, duration: 0.35, stagger: 0.04, ease: 'power3.out' });
      }
    });
  }

  window.addEventListener('resize', function () {
    H = window.innerHeight;
    var pts = scrollArea.children;
    for (var i = 0; i < pts.length; i++) pts[i].style.height = H + 'px';
  });

  updateUIFirst(0);
  renderLoop();
})();
