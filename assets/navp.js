/* WHY ✴︎ GGG — nav hover preview: kartu info di bawah link nav (felix-nieto). Desktop saja. */
(function () {
  'use strict';
  if (window.__navp) return;
  window.__navp = true;
  if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;

  var INFO = {
    'index.html': ['01', 'Home', 'Hero · 01 Archive · 02 Log — the front door.'],
    'about.html': ['02', 'About', 'Bio, quick facts, principles.'],
    'work.html': ['03', 'Work', '3D loop carousel — ten live projects.'],
    'contact.html': ['04', 'Contact', 'One viewport. Say hi.']
  };

  var css = '.nv-card{position:fixed;z-index:80;display:none;max-width:250px;'
    + 'background:rgba(10,10,12,.94);border:1px solid rgba(255,255,255,.14);padding:12px 14px;'
    + 'font-family:"JetBrains Mono",monospace;pointer-events:none}'
    + '.nv-card.show{display:block}'
    + '.nv-card b{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;'
    + 'color:#e9e9ea;font-weight:500;margin-bottom:6px}'
    + '.nv-card b i{font-style:normal;color:#f0d9a0;margin-right:8px}'
    + '.nv-card span{font-size:10px;letter-spacing:.06em;line-height:1.7;color:#9a9a9e}'
    + '@media (prefers-reduced-motion: reduce){.nv-card{transition:none!important}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var card = document.createElement('div');
  card.className = 'nv-card';
  card.setAttribute('aria-hidden', 'true');
  document.body.appendChild(card);

  function fileOf(a) {
    try {
      var p = new URL(a.getAttribute('href'), location.href).pathname.split('/').pop();
      return p || 'index.html';
    } catch (e) { return ''; }
  }
  function show(a) {
    var info = INFO[fileOf(a)];
    if (!info) return;
    card.innerHTML = '<b><i>' + info[0] + '</i>' + info[1] + '</b><span>' + info[2] + '</span>';
    var r = a.getBoundingClientRect();
    card.classList.add('show');
    var w = card.offsetWidth, left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    card.style.left = left + 'px';
    card.style.top = (r.bottom + 12) + 'px';
  }
  function hide() { card.classList.remove('show'); }
  var links = document.querySelectorAll('header nav a');
  for (var i = 0; i < links.length; i++) {
    (function (a) {
      a.addEventListener('mouseenter', function () { show(a); });
      a.addEventListener('mouseleave', hide);
      a.addEventListener('focus', function () { show(a); });
      a.addEventListener('blur', hide);
    })(links[i]);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true, capture: true });
})();
