/* WORK — carousel 3D loop. Diport dari hero OCULAR (se-garis huyml.co), lalu dihybrida ke arah huyml:
   - intro "kocok/deal kartu": riffle burst (tumpukan meledak jadi kipas 3D) lalu deal
     tengah-ke-luar + snap kartu utama; jalan setelah gerbang decode gambar
   - komposisi hibrida: pusat + 2 sudut mengintip + 2 kartu melayang redup di ruang tengah
   - fly-by kamera saat transisi: kartu keluar menekuk ke arah kamera (translateZ+rotateY liar),
     kartu masuk muncul dari kedalaman
   - teks info & counter ganti INSTAN saat indeks aktif berubah (tanpa nunggu scroll settle)
   - fling governor: momentum sentuh/lempar diganti luncuran berpagu maks 2.5 section
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

  var mouseX = 0, mouseY = 0, curRX = 0, curRY = 0, lastInput = 0, settling = false;
  var lastTouchT = -1e9, tSamples = []; // feel mobile: cap waktu & sampel kecepatan sentuh
  var coarsePtr = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  ['wheel', 'touchmove', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, function () {
      lastInput = performance.now();
      if (ev === 'touchstart' || ev === 'touchmove') lastTouchT = performance.now();
      if (settling) { gsap.killTweensOf(scrollArea); settling = false; }
    }, { passive: true });
  });
  // sampel kecepatan lepas-jari (jendela ~120ms) untuk governor fling
  window.addEventListener('touchmove', function () {
    var now = performance.now();
    tSamples.push([now, scrollArea.scrollTop]);
    while (tSamples.length > 2 && now - tSamples[0][0] > 120) tSamples.shift();
  }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (e.touches && e.touches.length) return; // masih ada jari lain
    var n = tSamples.length;
    if (n >= 2) {
      var a = tSamples[0], b = tSamples[n - 1], dt = (b[0] - a[0]) / 1000;
      if (dt > 0.015) flingTakeover((b[1] - a[1]) / dt);
    }
    tSamples.length = 0;
  }, { passive: true });
  // fling governor: momentum liar diganti luncuran berpagu (maks 2.5 section, snap presisi)
  function flingTakeover(v) {
    var dir = v > 0 ? 1 : -1, sp = Math.abs(v);
    if (sp < 900) return; // bukan fling -> soft-settle biasa
    var target = Math.round((scrollArea.scrollTop + dir * Math.min(sp * 0.45, H * 2.5)) / H) * H;
    if (target === Math.round(scrollArea.scrollTop / H) * H) return;
    if (settling) gsap.killTweensOf(scrollArea);
    settling = true; // blokir soft-settle sejak dini
    lastInput = performance.now();
    // bunuh momentum native dulu (overflow hidden 2 frame), baru luncurkan tween —
    // tanpa ini momentum impl-thread melawan tween dan bikin yoyo
    scrollArea.style.overflowY = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollArea.style.overflowY = '';
        if (!settling) return; // input baru masuk di tengah jalan -> batal
        gsap.to(scrollArea, {
          scrollTop: target,
          duration: 0.45 + (Math.abs(target - scrollArea.scrollTop) / H) * 0.22,
          ease: 'power3.out',
          onUpdate: function () { lastInput = performance.now(); },
          onComplete: function () { settling = false; }
        });
      });
    });
  }
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- drag pakai mouse (desktop): seret vertikal = pindah kartu ---------- */
  var finePtr = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (finePtr) {
    var dragging = false, dragMoved = false, dragY = 0, dragTop = 0;
    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; dragMoved = false;
      dragY = e.clientY; dragTop = scrollArea.scrollTop;
      if (settling) { gsap.killTweensOf(scrollArea); settling = false; }
      lastInput = performance.now();
      document.body.classList.add('w-drag');
      e.preventDefault(); // blokir native image-drag & seleksi teks saat menyeret
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerType !== 'mouse') return;
      if (Math.abs(e.clientY - dragY) > 4) dragMoved = true;
      scrollArea.scrollTop = dragTop + (dragY - e.clientY);
      lastInput = performance.now();
      var mNow = performance.now();
      tSamples.push([mNow, scrollArea.scrollTop]);
      while (tSamples.length > 2 && mNow - tSamples[0][0] > 120) tSamples.shift();
    }, { passive: true });
    var dragEnd = function () {
      if (!dragging) return;
      dragging = false;
      lastInput = performance.now();
      document.body.classList.remove('w-drag');
      var mN = tSamples.length; // lemparan mouse ikut meluncur (momentum)
      if (mN >= 2) {
        var mA = tSamples[0], mB = tSamples[mN - 1], mDt = (mB[0] - mA[0]) / 1000;
        if (mDt > 0.015) flingTakeover((mB[1] - mA[1]) / mDt);
      }
      tSamples.length = 0;
    };
    window.addEventListener('pointerup', dragEnd, { passive: true });
    window.addEventListener('pointercancel', dragEnd, { passive: true });
    // telan klik yang lahir dari drag agar kartu tak ikut terpicu
    document.addEventListener('click', function (e) {
      if (dragMoved) { dragMoved = false; e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpKF(a, b, t) {
    var cp = [];
    for (var k = 0; k < 8; k++) cp[k] = lerp(a.cp[k], b.cp[k], t);
    return { w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), b: lerp(a.b, b.b, t), o: lerp(a.o, b.o, t), rz: lerp(a.rz, b.rz, t), cp: cp };
  }

  // keyframe posisi (px) — hibrida OCULAR + scatter huyml; aspekdisamakan 1.45 agar gerak = scale uniform
  function keyframes() {
    var Wc = W < 820 ? Math.min(W * 0.72, 430) : Math.min(W * 0.46, 760);
    var Hc = Wc / 1.45;
    var pw = Math.max(150, W * 0.11);
    var nw = Math.max(140, W * 0.10);
    return {
      center: { w: Wc, h: Hc, x: (W - Wc) / 2, y: (H - Hc) / 2 - H * 0.06, b: 1, o: 1, rz: 0, cp: [0, 0, 100, 0, 100, 100, 0, 100] },
      prev: { w: pw, h: pw / 1.45, x: W - pw * 0.82, y: -pw * 0.1, b: 0.3, o: 1, rz: 3, cp: [0, 0, 100, 0, 100, 80, 0, 100] },
      next: { w: nw, h: nw / 1.45, x: -nw * 0.1, y: H - nw * 0.5, b: 0.4, o: 1, rz: -3, cp: [0, 20, 100, 0, 100, 100, 0, 100] },
      farPrev: { w: W * 0.22, h: W * 0.22 / 1.45, x: W * 0.05, y: H * 0.26, b: 0.5, o: 0.85, rz: -8, cp: [0, 0, 100, 0, 100, 100, 0, 100] },
      farNext: { w: W * 0.20, h: W * 0.20 / 1.45, x: W * 0.76, y: H * 0.56, b: 0.5, o: 0.85, rz: 7, cp: [0, 0, 100, 0, 100, 100, 0, 100] }
    };
  }
  var BASE = { w: 100, h: 69 };
  function sizeBase() {
    BASE.w = keyframes().center.w; BASE.h = keyframes().center.h;
    for (var i = 0; i < slides.length; i++) { slides[i].style.width = BASE.w + 'px'; slides[i].style.height = BASE.h + 'px'; }
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
    var s = p.w / BASE.w;
    el.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,' + p.z + 'px) rotateZ(' + p.rz + 'deg) rotateY(' + p.ry + 'deg) rotateX(' + p.rx + 'deg) scale(' + s + ')';
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
  var TEXT_VMAX = 1600; // px/detik — teks UI ditahan saat fling agar tak strobe
  var lastFrameT = performance.now(), lastBlur = -1; // feel: clock & bucket blur
  function renderLoop() {
    if (!running) return;
    W = window.innerWidth; H = window.innerHeight;
    var nowT = performance.now();
    var dtF = Math.min(0.05, Math.max(0.001, (nowT - lastFrameT) / 1000));
    lastFrameT = nowT;
    var damp = function (r) { return 1 - Math.pow(1 - r, dtF * 60); };
    // sentuh = sudah mulus dari sananya -> ikuti jari dengan ketat; wheel tetap mentega
    var trackRate = (nowT - lastTouchT < 900) ? 0.45 : 0.17;
    targetScrollY = scrollArea.scrollTop;
    currentScrollY = lerp(currentScrollY, targetScrollY, damp(trackRate));
    velocity = Math.abs(currentScrollY - lastScrollY) / dtF; // px/detik
    lastScrollY = currentScrollY;

    var blurPx = velocity > 30 ? Math.min(velocity / 300, 10) : 0;
    if (Math.abs(blurPx - lastBlur) > 0.4) { lastBlur = blurPx; gsap.set(uiLayer, { filter: 'blur(' + blurPx.toFixed(1) + 'px)' }); }

    curRY = lerp(curRY, mouseX * 10, damp(0.05));
    curRX = lerp(curRX, -mouseY * 10, damp(0.05));

    var progress = currentScrollY / H;
    var KF = keyframes();

    // soft-settle one-shot: saat inersia & input tenang, glissade halus ke indeks terdekat
    if (!settling && velocity < 25 && performance.now() - lastInput > 120) {
      var nearest = Math.round(progress);
      var gap = nearest * H - scrollArea.scrollTop;
      if (Math.abs(gap) > 1 && Math.abs(gap) < H * 0.5) {
        settling = true;
        gsap.to(scrollArea, { scrollTop: nearest * H, duration: 0.5, ease: 'power2.out', onComplete: function () { settling = false; } });
      }
    }

    for (var idx = 0; idx < N; idx++) {
      var p = poseFor(idx, progress, KF);
      var sEl = slides[idx];
      if (p.o <= 0.01) { // tak terlihat -> sembunyikan & lewati (hemat GPU HP)
        if (!sEl._hid) { sEl._hid = true; sEl.style.opacity = '0'; sEl.style.visibility = 'hidden'; }
        continue;
      } else if (sEl._hid) { sEl._hid = false; sEl.style.visibility = 'visible'; }
      var isC = Math.abs(idx - (((progress % N) + N) % N) < 0.5) || Math.abs(idx - (((progress % N) + N) % N) + N) < 0.5 || Math.abs(idx - (((progress % N) + N) % N) - N) < 0.5;
      applyPose(sEl, wraps[idx], p, isC);
      slides[idx].style.zIndex = Math.round(100 - Math.abs(((idx - (((progress % N) + N) % N) + N * 1.5) % N) - N / 2) * 10);
    }

    if ((progress < 10 || progress > 80) && targetScrollY % H === 0 && Math.abs(targetScrollY - currentScrollY) < 1) {
      var phase = Math.round(progress) % N;
      var reset = centerIndex + phase;
      scrollArea.scrollTop = reset * H;
      targetScrollY = currentScrollY = reset * H;
    }

    var active = ((Math.round(progress) % N) + N) % N;
    // throttle: saat fling cepat teks ditahan (tetap blur), tukar sekali saat tenang
    if (active !== currentIndex && velocity < TEXT_VMAX) {
      updateUI(active);
      if (coarsePtr && navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
    }

    requestAnimationFrame(renderLoop);
  }

  /* ---------- intro: kocok & bagi kartu (ala deck shuffle huyml) ---------- */
  function intro() {
    var KF = keyframes();
    var P0 = centerIndex + startIdx;
    uiLayer.style.opacity = 0;
    var wloadEl = document.getElementById('wload');
    var FULLCP = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    // pseudo-acak deterministik per kartu (koreografi konsisten tiap kunjungan)
    function rnd(seed) { var x = Math.sin(seed * 12.9898) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
    // jarak sirkular dari kartu aktif -> deal dibagikan dari tengah ke luar
    function dist(i) { var dd = Math.abs(i - startIdx) % N; return dd > N / 2 ? N - dd : dd; }
    // paused: dimainkan setelah gerbang decode di bawah (from langsung tampil via immediateRender)
    var tl = gsap.timeline({ paused: true, onComplete: function () { if (wloadEl) wloadEl.style.display = 'none'; running = true; renderLoop(); } });
    var spreadX = Math.min(W * 0.34, 380);
    for (var idx = 0; idx < N; idx++) {
      var el = slides[idx];
      var dd = dist(idx);
      var hero = dd === 0;
      var target = poseFor(idx, P0, KF);
      var r1 = rnd(idx * 4 + 1), r2 = rnd(idx * 4 + 2), r3 = rnd(idx * 4 + 3), r4 = rnd(idx * 4 + 4);
      var cpT = 'polygon(' + target.cp[0] + '% ' + target.cp[1] + '%, ' + target.cp[2] + '% ' + target.cp[3] + '%, ' + target.cp[4] + '% ' + target.cp[5] + '%, ' + target.cp[6] + '% ' + target.cp[7] + '%)';
      // state awal langsung (tanpa tween): redup + clip final; z = rumus renderLoop -> handoff tanpa pop
      el.style.filter = 'brightness(0.6)';
      el.style.clipPath = (cpT !== FULLCP) ? FULLCP : cpT;
      el.style.zIndex = 100 - dd * 10;
      // A. RIFFLE BURST: tumpukan meledak jadi kipas 3D liar (rotasi & z murni transform -> murah)
      tl.fromTo(el, {
        x: W / 2 - 170 + (idx - N / 2) * 7, y: H / 2 - 120 + (idx % 3 - 1) * 9,
        scale: 340 / BASE.w, opacity: 0, rotationZ: (idx - N / 2) * 5
      }, {
        x: W / 2 - 170 + r1 * spreadX,
        y: H / 2 - 150 + r2 * H * 0.20 - H * 0.06,
        scale: (340 / BASE.w) * 1.18,
        opacity: target.o,
        rotationZ: hero ? -18 : r1 * 50 + r3 * 10,
        rotationY: hero ? -70 : r2 * 55,
        rotationX: hero ? 16 : r3 * 28,
        z: hero ? 260 : (0.5 + 0.5 * r4) * 220,
        duration: 0.45, ease: 'power3.out'
      }, 0.03 * dd);
      // B. DEAL: tiap kartu mengayun ke posisinya, mendarat mentega
      var land = {
        x: target.x, y: target.y, scale: target.w / BASE.w, rotationZ: target.rz,
        rotationX: 0, rotationY: 0, z: 0,
        filter: 'brightness(' + target.b + ')',
        duration: 0.9, ease: 'expo.out', overwrite: 'auto'
      };
      if (cpT !== FULLCP) land.clipPath = cpT; // clip-path mahal -> tween hanya yang butuh
      var landPos = 0.42 + 0.06 * dd;
      tl.to(el, land, landPos);
      // snap kartu utama saat mendarat (kembali tepat ke target -> handoff mulus)
      if (hero) {
        var s0 = target.w / BASE.w;
        tl.to(el, { scale: s0 * 1.035, duration: 0.12, ease: 'power2.out' }, landPos + 0.9);
        tl.to(el, { scale: s0, duration: 0.35, ease: 'power3.inOut' }, landPos + 1.02);
      }
    }
    tl.fromTo(uiLayer, { y: 18 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.85);
    if (wloadEl) tl.to(wloadEl, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.9);
    // gerbang decode: intro jalan hanya setelah 10 gambar siap ter-decode (maks 2.5 dtk),
    // lalu 2 frame napas agar kompositor memegang layer sebelum tween pertama jalan.
    // kunjungan pertama = tak ada lagi upload tekstur GPU di tengah kocokan.
    var imgs = [];
    for (var gi = 0; gi < slides.length; gi++) {
      var gim = slides[gi].querySelector('img');
      if (gim) imgs.push(gim);
    }
    var allReady;
    try {
      allReady = Promise.all(imgs.map(function (im) {
        if (im.complete && im.naturalWidth) return Promise.resolve();
        if (im.decode) { try { return im.decode().then(function () {}, function () {}); } catch (e) {} }
        return new Promise(function (res) {
          im.addEventListener('load', res, { once: true });
          im.addEventListener('error', res, { once: true });
        });
      }));
    } catch (e) { allReady = Promise.resolve(); }
    Promise.race([allReady, new Promise(function (res) { setTimeout(res, 2500); })]).then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { tl.play(); });
      });
    });
  }

  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    var pts = scrollArea.children;
    for (var i = 0; i < pts.length; i++) pts[i].style.height = H + 'px';
    sizeBase();
  });
  // deep-link: meluncur halus via jalur loop terpendek (bisa diinterupsi input baru)
  window.addEventListener('hashchange', function () {
    var i = ORDER.indexOf((location.hash || '').replace('#', ''));
    if (i < 0) return;
    var p = Math.round(scrollArea.scrollTop / H);
    var act = ((p % N) + N) % N;
    var d = i - act;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    if (d === 0) return;
    if (settling) gsap.killTweensOf(scrollArea);
    settling = true;
    gsap.to(scrollArea, {
      scrollTop: (p + d) * H, duration: 0.9, ease: 'power3.inOut',
      onUpdate: function () { lastInput = performance.now(); },
      onComplete: function () { settling = false; }
    });
  });

  /* ---------- klik kartu: yang mengintip = pusatkan dulu; pusat = buka situs ---------- */
  function activeIndex() {
    var p = scrollArea.scrollTop / H;
    return ((Math.round(p) % N) + N) % N;
  }
  slides.forEach(function (el, idx) {
    el.addEventListener('click', function (e) {
      if (!running) { e.preventDefault(); return; }          // saat intro masih kocok
      var act = activeIndex();
      if (idx === act) return;                                 // kartu pusat → biarkan buka link
      e.preventDefault();                                      // kartu mengintip → pusatkan
      var p = Math.round(scrollArea.scrollTop / H);
      var d = idx - act;
      if (d > N / 2) d -= N;
      if (d < -N / 2) d += N;
      scrollArea.scrollTop = (p + d) * H;
    });
  });

  sizeBase();
  updateUIFirst(startIdx);
  intro();
})();
