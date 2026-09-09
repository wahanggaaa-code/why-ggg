/* WHY ✴︎ GGG — deck-wipe: transisi antar-halaman ala kocokan kartu.
   EXIT: klik link internal -> 4 panel kartu sapu-menutup (WAAPI, transform saja) -> navigasi.
   ENTRY: halaman non-loader dibuka tertutup lalu sapu-membuka (berlaku juga untuk back/forward).
   index (loader kristal) + work (intro kocokan) tanpa entry — loader/intro adalah entry-nya.
   Reduced-motion / tanpa WAAPI -> navigasi native instan. Pengganti View Transitions blur. */
(function () {
  'use strict';
  if (window.__wipe) return;
  window.__wipe = true;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var canAnim = !reduced && !!document.body && !!(Element.prototype && Element.prototype.animate);
  if (!canAnim) { window.__wipeTo = function () { return false; }; return; }
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var NO_ENTRY = { 'index.html': 1, 'work.html': 1 };
  var EASE = 'cubic-bezier(.16,1,.3,1)';

  /* --- CSS + markup overlay (1 file, tanpa sentuh html/css lain) --- */
  var css = '#wipe{position:fixed;inset:0;z-index:9999;pointer-events:none;visibility:hidden;overflow:hidden}'
    + '#wipe.on{visibility:visible;pointer-events:all}'
    + '#wipe .wp{position:absolute;left:0;right:0;top:-2%;bottom:-2%;will-change:transform;transform:translateY(102%)}'
    + '#wipe.shut .wp{transform:translateY(0)}'
    + '#wipe .wp0{background:#060607}#wipe .wp1{background:#0c0c0e}'
    + '#wipe .wp2{background:#121215}#wipe .wp3{background:#1a1a1f;border-top:1px solid rgba(240,217,160,.55)}'
    + '#wipe .wl{position:absolute;left:24px;bottom:22px;font-family:"JetBrains Mono",monospace;'
    + 'font-size:11px;letter-spacing:.3em;color:#f0d9a0;opacity:0;transform:translateY(6px)}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
  var ov = document.createElement('div');
  ov.id = 'wipe';
  ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<div class="wp wp0"></div><div class="wp wp1"></div><div class="wp wp2"></div>'
    + '<div class="wp wp3"></div><div class="wl"></div>';
  document.body.appendChild(ov);
  var panels = [ov.children[0], ov.children[1], ov.children[2], ov.children[3]];
  var label = ov.children[4];
  var busy = false;

  var NAMES = { 'index': 'HOME', 'work': 'WORK', 'about': 'ABOUT', 'contact': 'CONTACT', 'lab': 'LAB', 'full': 'FULL' };
  function destName(href) {
    try {
      var p = new URL(href, location.href).pathname.split('/').pop() || 'index.html';
      var base = p.replace(/\.html?$/i, '').toLowerCase();
      return NAMES[base] || (base.toUpperCase() || 'HOME');
    } catch (e) { return '···'; }
  }
  /* Aturan wipe: origin sama + bukan lompat-hash sehalaman. Klik-reload sehalaman ikut wipe (terasa disengaja). */
  function wipeDest(href) {
    if (!href) return null;
    var u;
    try { u = new URL(href, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    var sameDoc = (u.pathname === location.pathname && u.search === location.search);
    if (sameDoc && u.hash) return null;
    return u.href;
  }
  function go(dest) {
    if (busy) return true;
    busy = true;
    label.textContent = '✴︎ ' + destName(dest);
    ov.classList.add('on');
    ov.classList.remove('shut');
    for (var i = 0; i < 4; i++) {
      panels[i].animate(
        [{ transform: 'translateY(102%)' }, { transform: 'translateY(0)' }],
        { duration: 380, delay: i * 60, easing: EASE, fill: 'both' });
    }
    label.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 300, delay: 200, easing: EASE, fill: 'both' });
    setTimeout(function () { location.href = dest; }, 620); /* anti-jam: selalu navigasi */
    return true;
  }
  window.__wipeTo = function (url) {
    if (busy || !canAnim) return false;
    var d = wipeDest(url);
    if (!d) return false;
    go(d);
    return true;
  };
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target;
    var a = (t && t.closest) ? t.closest('a[href]') : null;
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download') || (a.dataset && a.dataset.nowipe !== undefined)) return;
    var d = wipeDest(a.getAttribute('href'));
    if (!d) return;
    e.preventDefault();
    go(d);
  });
  /* back/forward via bfcache: overlay bisa pulih dalam keadaan menutup -> reset instan */
  function reset() {
    busy = false;
    ov.classList.remove('on');
    ov.classList.remove('shut');
    for (var i = 0; i < 4; i++) {
      try {
        var ans = panels[i].getAnimations();
        for (var j = 0; j < ans.length; j++) ans[j].cancel();
      } catch (e) {}
    }
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) reset(); });
  /* ENTRY: sapu-membuka di halaman non-loader */
  if (!NO_ENTRY[page]) {
    ov.classList.add('on');
    ov.classList.add('shut');
    setTimeout(function () {
      for (var i = 0; i < 4; i++) {
        panels[3 - i].animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(-102%)' }],
          { duration: 450, delay: i * 60, easing: EASE, fill: 'both' });
      }
      setTimeout(reset, 450 + 3 * 60 + 60);
    }, 60);
  }
})();
