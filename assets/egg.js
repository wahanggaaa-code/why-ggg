/* WHY ✴︎ GGG — easter egg: pesan console + spark ×5 lintas halaman */
(function () {
  'use strict';
  try {
    console.log('%cWHY ✴︎ GGG%c — building quietly.\npenasaran sama kodenya? sapa: hi@whyggg.com',
      'font-weight:bold', 'font-weight:normal');
  } catch (e) { /* abaikan */ }

  var KEY_N = 'whyggg_spark_n', KEY_P = 'whyggg_spark_pending';
  function get(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { window.sessionStorage.removeItem(k); } catch (e) {} }

  function toast() {
    var t = document.createElement('div');
    t.textContent = 'spark ×5 — penasaran ya.';
    t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99;'
      + 'font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;'
      + 'color:#e9e9ea;background:rgba(6,6,7,.88);border:1px solid rgba(255,255,255,.16);'
      + 'padding:12px 18px;pointer-events:none;opacity:0;transition:opacity .4s;white-space:nowrap;';
    document.body.appendChild(t);
    var logo = document.querySelector('header .logo');
    if (logo && logo.animate) {
      try { logo.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' }); } catch (e) {}
    }
    requestAnimationFrame(function () { t.style.opacity = '1'; });
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 450); }, 1800);
  }

  // pending dari halaman sebelumnya (valid 6 detik)
  try {
    var p = get(KEY_P);
    if (p && Date.now() - parseInt(p, 10) < 6000) { del(KEY_P); del(KEY_N); setTimeout(toast, 900); }
  } catch (e) {}

  document.addEventListener('click', function (e) {
    var logo = e.target && e.target.closest ? e.target.closest('header .logo') : null;
    if (!logo) return; // navigasi normal dibiarkan — hitungan lintas halaman via session
    var n = (parseInt(get(KEY_N) || '0', 10) || 0) + 1;
    if (n < 5) { set(KEY_N, String(n)); return; }
    del(KEY_N);
    var nav = true; // klik ke-5: toast di halaman tujuan (atau sini bila tak navigasi)
    try { nav = new URL(logo.href, location.href).pathname !== location.pathname; } catch (e2) {}
    if (nav) set(KEY_P, String(Date.now()));
    else setTimeout(toast, 700);
  });
})();
