/* WORK — carousel 3D loop. Diport dari hero OCULAR (se-garis huyml.co), lalu dihybrida ke arah huyml:
   - intro "kocok/deal kartu" setelah load (kartu dikocok dari tumpukan pusat lalu dibagi ke posisinya)
   - komposisi hibrida: pusat + 2 sudut mengintip + 2 kartu melayang redup di ruang tengah
   - fly-by kamera saat transisi: kartu keluar menekuk ke arah kamera (translateZ+rotateY liar),
     kartu masuk muncul dari kedalaman
   - teks info & counter ganti INSTAN saat indeks aktif berubah (tanpa nunggu scroll settle)
   Tanpa GSAP / reduced-motion → html.no-wn → fallback grid CSS. */
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
  var ORDER = ['aethelgard-7e0', 'vroeger-koffiehuis', 'lexier', 'elan-fashion-editorial', 'vipera-emeraude', 'aelian', 'cerulean-chic', 'cheriel-landing', 'ocular-45z', 'glint-landing-58i'];

  var N = slideData.length;
  var currentIndex = -1;
  var slides = document.querySelectorAll('.slide');
  var wraps = document.querySelectorAll('.parallax-wrap');
  var scrollArea = document.getElementById('wscroll');
  var uiLayer = document.getElementById('wui');
  if (!slides.length || !scrollArea) { document.documentElement.classList.add('no-wn'); return; }

  var H = window.innerHeight, W = window.innerWidth;
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

  var slug = (location.hash || '').replace('#', '');
  var startIdx = ORDER.indexOf(slug);
  if (startIdx < 0) startIdx = 0;
  var startY = (centerIndex + startIdx) * H;
  var targetScrollY = startY, currentScrollY = startY, lastScrollY = startY, velocity = 0;
  scrollArea.scrollTop = startY;

  var mouseX = 0, mouseY = 0, curRX = 0, curRY = 0;
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpKF(a, b, t) {
    var cp = [];
    for (var k = 0; k < 8; k++) cp[k] = lerp(a.cp[k], b.cp[k], t);
    return { w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), b: lerp(a.b, b.b, t), o: lerp(a.o, b.o, t), rz: lerp(a.rz, b.rz, t), cp: cp };
  }

  // keyframe posisi (px) — hibrida OCULAR + scatter huyml
  function keyframes() {
    var Wc = W < 820 ? Math.min(W * 0.72, 430) : Math.min(W * 0.46, 760);
    var Hc = Wc / 1.45;
    var pw = Math.max(150, W * 0.11);
    var nw = Math.max(140, W * 0.10);
    return {
      center: { w: Wc, h: Hc, x: (W - Wc) / 2, y: (H - Hc) / 2 - H * 0.06, b: 1, o: 1, rz: 0, cp: [0, 0, 100, 0, 100, 100, 0, 100] },
      prev: { w: pw, h: pw * 0.72, x: W - pw * 0.82, y: -pw * 0.1, b: 0.3, o: 1, rz: 3, cp: [0, 0, 100, 0, 100, 80, 0, 100] },
      next: { w: nw, h: nw * 0.62, x: -nw * 0.1, y: H - nw * 0.5, b: 0.4, o: 1, rz: -3, cp: [0, 20, 100, 0, 100, 100, 0, 100] },
      farPrev: { w: W * 0.22, h: W * 0.22 * 0.66, x: W * 0.05, y: H * 0.26, b: 0.5, o: 0.85, rz: -8, cp: [0, 0, 100, 0, 100, 100, 0, 100] },
      farNext: { w: W * 0.20, h: W * 0.20 * 0.66, x: W * 0.76, y: H * 0.56, b: 0.5, o: 0.85, rz: 7, cp: [0, 0, 100, 0, 100, 100, 0, 100] }
    };
  }

  // pose slide ke-idx pada progress tertentu (+ efek fly-by kamera saat transisi)
  function poseFor(idx, progress, KF) {
    var pMod = ((progress % N) + N) % N;
    var df = idx - pMod;
    if (df > N / 2) df -= N;
    if (df < -N / 2) df += N;

    var p, m, z = 0, ry = 0, rx = 0;
    if (df <= -2) {
      var exP = Math.abs(df + 2);
      p = { w: KF.farPrev.w, h: KF.farPrev.h, x: KF.farPrev.x, y: KF.farPrev.y - exP * H * 0.13, b: KF.farPrev.b, o: Math.max(0, KF.farPrev.o - exP * 0.45), rz: KF.farPrev.rz, cp: KF.farPrev.cp };
    } else if (df >= 2) {
      var exN = Math.abs(df - 2);
      p = { w: KF.farNext.w, h: KF.farNext.h, x: KF.farNext.x, y: KF.farNext.y + exN * H * 0.13, b: KF.farNext.b, o: Math.max(0, KF.farNext.o - exN * 0.45), rz: KF.farNext.rz, cp: KF.farNext.cp };
    } else if (df <= -1) {
      p = lerpKF(KF.prev, KF.farPrev, df + 2);
    } else if (df >= 1) {
      p = lerpKF(KF.next, KF.farNext, df - 1);
      // kartu masuk: muncul dari kedalaman, menekuk lalu lurus saat jadi pusat
      m = Math.sin(Math.min(1, df) * Math.PI);
      z = -m * 320; ry = m * 13; rx = -m * 5;
    } else if (df < 0) {
      p = lerpKF(KF.prev, KF.center, df + 1);
      // kartu keluar: terbang menekuk melewati kamera di tengah transisi
      m = Math.sin(-df * Math.PI);
      z = m * 400; ry = -m * 16; rx = m * 7;
    } else {
      p = lerpKF(KF.center, KF.next, df);
      m = Math.sin(df * Math.PI);
      z = -m * 320; ry = m * 13; rx = -m * 5;
    }
    p.z = z; p.ry = ry; p.rx = rx;
    return p;
  }

  function applyPose(el, wrapEl, p, isCenter) {
    el.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,' + p.z + 'px) rotateZ(' + p.rz + 'deg) rotateY(' + p.ry + 'deg) rotateX(' + p.rx + 'deg)';
    el.style.width = p.w + 'px';
    el.style.height = p.h + 'px';
    el.style.clipPath = 'polygon(' + p.cp[0] + '% ' + p.cp[1] + '%, ' + p.cp[2] + '% ' + p.cp[3] + '%, ' + p.cp[4] + '% ' + p.cp[5] + '%, ' + p.cp[6] + '% ' + p.cp[7] + '%)';
    el.style.filter = 'brightness(' + p.b + ')';
    el.style.opacity = p.o;
    wrapEl.style.transform = isCenter
      ? 'scale(1.1) perspective(1000px) rotateX(' + curRX + 'deg) rotateY(' + curRY + 'deg)'
      : 'scale(1) perspective(1000px) rotateX(0deg) rotateY(0deg)';
  }

  /* ---------- teks UI: ganti INSTAN saat indeks berubah ---------- */
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
      y: '-40%', opacity: 0, duration: 0.1, stagger: 0.012, ease: 'power2.in',
      onComplete: function () {
        setText(i);
        gsap.set(els, { y: '40%', opacity: 0 });
        gsap.to(els, { y: '0%', opacity: 1, duration: 0.26, stagger: 0.025, ease: 'power3.out' });
      }
    });
  }

  /* ---------- render loop ---------- */
  var running = false;
  function renderLoop() {
    if (!running) return;
    W = window.innerWidth; H = window.innerHeight;
    targetScrollY = scrollArea.scrollTop;
    currentScrollY = lerp(currentScrollY, targetScrollY, 0.17);
    velocity = Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;

    if (velocity > 0.5) gsap.set(uiLayer, { filter: 'blur(' + Math.min(velocity * 0.2, 10) + 'px)' });
    else gsap.set(uiLayer, { filter: 'blur(0px)' });

    curRY = lerp(curRY, mouseX * 10, 0.05);
    curRX = lerp(curRX, -mouseY * 10, 0.05);

    var progress = currentScrollY / H;
    var KF = keyframes();
    for (var idx = 0; idx < N; idx++) {
      var p = poseFor(idx, progress, KF);
      var isC = Math.abs(idx - (((progress % N) + N) % N) < 0.5) || Math.abs(idx - (((progress % N) + N) % N) + N) < 0.5 || Math.abs(idx - (((progress % N) + N) % N) - N) < 0.5;
      applyPose(slides[idx], wraps[idx], p, isC);
      slides[idx].style.zIndex = Math.round(100 - Math.abs(((idx - (((progress % N) + N) % N) + N * 1.5) % N) - N / 2) * 10);
    }

    if ((progress < 10 || progress > 80) && targetScrollY % H === 0 && Math.abs(targetScrollY - currentScrollY) < 1) {
      var phase = Math.round(progress) % N;
      var reset = centerIndex + phase;
      scrollArea.scrollTop = reset * H;
      targetScrollY = currentScrollY = reset * H;
    }

    var active = ((Math.round(progress) % N) + N) % N;
    if (active !== currentIndex) updateUI(active);   // responsif: tanpa gate velocity

    requestAnimationFrame(renderLoop);
  }

  /* ---------- intro: kocok & bagi kartu (ala deck shuffle huyml) ---------- */
  function intro() {
    var KF = keyframes();
    var P0 = centerIndex + startIdx;
    uiLayer.style.opacity = 0;
    var tl = gsap.timeline({ onComplete: function () { running = true; renderLoop(); } });
    for (var idx = 0; idx < N; idx++) {
      var el = slides[idx];
      var target = poseFor(idx, P0, KF);
      // tumpukan terkocok di pusat: bertumpuk miring, lalu "dibagikan" ke posisinya
      var from = {
        x: W / 2 - 170 + (idx - N / 2) * 7, y: H / 2 - 120 + (idx % 3 - 1) * 9,
        width: 340, height: 238, opacity: 0, rotationZ: (idx - N / 2) * 5,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', filter: 'brightness(0.6)'
      };
      var to = {
        x: target.x, y: target.y, width: target.w, height: target.h, opacity: target.o,
        rotationZ: target.rz,
        clipPath: 'polygon(' + target.cp[0] + '% ' + target.cp[1] + '%, ' + target.cp[2] + '% ' + target.cp[3] + '%, ' + target.cp[4] + '% ' + target.cp[5] + '%, ' + target.cp[6] + '% ' + target.cp[7] + '%)',
        filter: 'brightness(' + target.b + ')',
        duration: 0.9, ease: 'power3.out'
      };
      el.style.zIndex = 100 - idx;
      tl.fromTo(el, from, to, 0.08 * idx);
    }
    tl.to(uiLayer, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.5);
  }

  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    var pts = scrollArea.children;
    for (var i = 0; i < pts.length; i++) pts[i].style.height = H + 'px';
  });
  window.addEventListener('hashchange', function () {
    var i = ORDER.indexOf((location.hash || '').replace('#', ''));
    if (i >= 0) scrollArea.scrollTop = (centerIndex + i) * H;
  });

  updateUIFirst(startIdx);
  intro();
})();
