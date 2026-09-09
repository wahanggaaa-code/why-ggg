/* WHY ✴︎ GGG — command palette CMD+K: lompat ke halaman & projek (museumdepartment). */
(function () {
  'use strict';
  if (window.__cmdk) return;
  window.__cmdk = true;

  var PAGES = [
    { t: 'Home', k: 'page', h: 'index.html', d: 'hero · archive · log' },
    { t: 'Work', k: 'page', h: 'work.html', d: '3d carousel' },
    { t: 'Full index', k: 'page', h: 'full.html', d: 'every project' },
    { t: 'Lab', k: 'page', h: 'lab.html', d: 'experiments' },
    { t: 'About', k: 'page', h: 'about.html', d: 'bio & facts' },
    { t: 'Contact', k: 'page', h: 'contact.html', d: 'say hi' }
  ];
  var PROJ = [
    ['aethelgard-7e0', 'Aethelgard — The Hidden Archive', 'https://aethelgard-7e0.pages.dev/'],
    ['vroeger-koffiehuis', 'Vroeger Koffiehuis', 'https://vroeger-koffiehuis.pages.dev/'],
    ['lexier', 'LEXIER®', 'https://lexier.pages.dev/'],
    ['elan-fashion-editorial', 'ÉLAN — New Mood', 'https://elan-fashion-editorial.pages.dev/'],
    ['vipera-emeraude', 'VIPERA — Émeraude', 'https://vipera-emeraude.pages.dev/'],
    ['aelian', 'AELIAN — The Light Within', 'https://aelian.pages.dev/'],
    ['cerulean-chic', 'Cerulean Chic', 'https://cerulean-chic.pages.dev/'],
    ['cheriel-landing', 'CHERIEL', 'https://cheriel-landing.pages.dev/'],
    ['ocular-45z', 'OCULAR', 'https://ocular-45z.pages.dev/'],
    ['glint-landing-58i', 'GLINT', 'https://glint-landing-58i.pages.dev/']
  ];
  var ITEMS = PAGES.slice();
  PROJ.forEach(function (p) { ITEMS.push({ t: p[1], k: 'carousel', h: 'work.html#' + p[0], d: p[0] }); });
  PROJ.forEach(function (p) { ITEMS.push({ t: p[1], k: 'live', h: p[2], ext: true, d: 'live site' }); });
  ITEMS.push({ t: 'Copy email hi@whyggg.com', k: 'action', act: 'copy', d: 'clipboard' });

  var css = '.ck-ov{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.62);display:none}'
    + '.ck-ov.open{display:block}'
    + '.ck-p{width:min(580px,92vw);margin:11vh auto 0;background:#0a0a0c;border:1px solid rgba(255,255,255,.14)}'
    + '.ck-in{width:100%;box-sizing:border-box;background:none;border:0;border-bottom:1px solid rgba(255,255,255,.1);'
    + 'color:#e9e9ea;font-family:"JetBrains Mono",monospace;font-size:13px;letter-spacing:.06em;'
    + 'padding:15px 18px;outline:none}'
    + '.ck-in::placeholder{color:#9a9a9e}'
    + '.ck-list{max-height:46vh;overflow-y:auto;padding:6px 0}'
    + '.ck-it{display:flex;justify-content:space-between;gap:16px;align-items:baseline;'
    + 'padding:10px 18px;cursor:pointer;font-family:"JetBrains Mono",monospace;font-size:12px;'
    + 'letter-spacing:.04em;color:#c9c9cc;border-left:2px solid transparent}'
    + '.ck-it .k{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#9a9a9e;white-space:nowrap}'
    + '.ck-it.on{background:rgba(240,217,160,.08);color:#e9e9ea;border-left-color:#f0d9a0}'
    + '.ck-empty{padding:16px 18px;font-family:"JetBrains Mono",monospace;font-size:11px;color:#9a9a9e}'
    + '.ck-foot{padding:10px 18px;border-top:1px solid rgba(255,255,255,.1);'
    + 'font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.14em;color:#9a9a9e}'
    + '@media (prefers-reduced-motion: reduce){.ck-ov *{transition:none!important}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.className = 'ck-ov';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-label', 'Command palette');
  ov.innerHTML = '<div class="ck-p"><input class="ck-in" type="text" placeholder="ketik: halaman, projek, aksi…" '
    + 'aria-label="Cari"><div class="ck-list"></div>'
    + '<div class="ck-foot">↑↓ pilih · ↵ buka · esc tutup</div></div>';
  document.body.appendChild(ov);
  var input = ov.querySelector('.ck-in'), list = ov.querySelector('.ck-list'), foot = ov.querySelector('.ck-foot');
  var footHome = foot.textContent, shown = [], active = 0, isOpen = false;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function render() {
    var q = input.value.trim().toLowerCase();
    shown = ITEMS.filter(function (it) {
      return !q || (it.t + ' ' + (it.d || '') + ' ' + it.k).toLowerCase().indexOf(q) > -1;
    });
    if (active >= shown.length) active = 0;
    if (!shown.length) { list.innerHTML = '<div class="ck-empty">tidak ketemu — coba kata lain.</div>'; return; }
    var html = '';
    shown.forEach(function (it, i) {
      html += '<div class="ck-it' + (i === active ? ' on' : '') + '" data-i="' + i + '">'
        + '<span>' + esc(it.t) + '</span><span class="k">' + esc(it.k) + '</span></div>';
    });
    list.innerHTML = html;
  }
  function open() {
    if (isOpen) return;
    isOpen = true;
    ov.classList.add('open');
    input.value = ''; active = 0; foot.textContent = footHome;
    render();
    setTimeout(function () { input.focus(); }, 30);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    ov.classList.remove('open');
    input.blur();
  }
  function go(it) {
    if (!it) return;
    if (it.act === 'copy') {
      var done = function (ok) {
        foot.textContent = ok ? 'email tersalin ✓' : 'gagal menyalin — hi@whyggg.com';
        setTimeout(close, 900);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('hi@whyggg.com').then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
      return;
    }
    close();
    if (it.ext) { window.open(it.h, '_blank', 'noopener'); return; }
    if (it.h.charAt(0) === '#') {
      try {
        location.hash = it.h.slice(1);
        var cur = location.pathname.split('/').pop() || 'index.html';
        if (cur !== 'work.html') { if (!window.__wipeTo || !window.__wipeTo(it.h)) location.href = it.h; }
      } catch (e) { location.href = it.h; }
      return;
    }
    if (!window.__wipeTo || !window.__wipeTo(it.h)) location.href = it.h;
  }
  document.addEventListener('keydown', function (e) {
    var k = e.key && e.key.toLowerCase ? e.key.toLowerCase() : e.key;
    if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); isOpen ? close() : open(); return; }
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(1, shown.length); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(1, shown.length); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); go(shown[active]); }
  });
  input.addEventListener('input', function () { active = 0; render(); });
  list.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('.ck-it') : null;
    if (el) go(shown[parseInt(el.getAttribute('data-i'), 10)]);
  });
  list.addEventListener('mousemove', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('.ck-it') : null;
    if (!el) return;
    var i = parseInt(el.getAttribute('data-i'), 10);
    if (i !== active) { active = i; render(); }
  });
  ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
})();
