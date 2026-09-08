#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
why·ggg — build multi-page + Horizontal Scroll Rail (arsitektur awwwards).

Home   = Hero + 01 ARCHIVE (rail horizontal, digerakkan scroll vertikal) + 02 LOG
About  = halaman sendiri   (base/about)
Contact= halaman sendiri   (baru, dari konten closing)
work/* = halaman projek    (rail -> klik -> morph ke hero projek)

Bahan dibaca dari tools/base/ (salinan main/index, main/about).
Jalankan:  python3 tools/build-site.py
MENAMBAH PROYEK: edit daftar WORK di bawah, jalankan ulang.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, 'tools', 'base')
INDEX_OUT = os.path.join(ROOT, 'index.html')
ABOUT_OUT = os.path.join(ROOT, 'about.html')
CONTACT_OUT = os.path.join(ROOT, 'contact.html')
WORKD = os.path.join(ROOT, 'work')
os.makedirs(WORKD, exist_ok=True)

BASE_INDEX = open(os.path.join(BASE, 'index.html'), encoding='utf-8').read()
BASE_ABOUT = open(os.path.join(BASE, 'about.html'), encoding='utf-8').read()

# ============================ DATA PROYEK ============================
WORK = [
  dict(slug='the-hidden-archive', img='aethelgard-hero.webp',
       alt='The Hidden Archive — Landing Page', kind='Landing Page', tag='editorial · landing', year='2026',
       blurb='Arsip digital tempat narasi disembunyikan di balik lapisan scroll dan cahaya.',
       story=['Sebuah arsip digital yang menyembunyikan narasi di balik lapisan scroll dan cahaya. '
              'Proyek ini lahir dari rasa penasaran: bagaimana sebuah halaman bisa terasa seperti '
              'ruangan — bukan sekadar dokumen.',
              'Interaksi sengaja dibuat pelan: judul muncul per kata, arsip bergulir seperti membuka '
              'lemari tua, dan tiap karya menyimpan sudut gelap yang baru terlihat bila kamu berlama-lama.',
              'Dibangun vanilla — HTML/CSS/JS murni, ditambah View Transitions untuk perpindahan '
              'antar halaman yang mulus tanpa framework.']),
  dict(slug='the-architecture-of-silence', img='archive-cover.webp',
       alt='The Architecture of Silence', kind='Editorial Archive', tag='editorial · archive', year='2026',
       blurb='Riset visual tentang sunyi sebagai elemen struktur — ruang kosong yang disengaja.',
       story=['Sebuah riset visual tentang sunyi sebagai elemen struktur. Bukan ketiadaan, melainkan '
              'ruang kosong yang disengaja — jeda yang membuat hal lain terdengar.',
              'Susunan tipografi & grid dibuat senyap: banyak udara, sedikit hiasan. Yang muncul '
              'justru tekstur dari material dan ritme halaman.',
              'Eksplorasi ini menjadi fondasi bahasa visual yang dipakai lintas projek lain.']),
  dict(slug='lexier-cover', img='lexier-cover.webp', alt='Lexier Cover',
       kind='Identity — Cover', tag='identity · print', year='2025',
       blurb='Identitas visual untuk Lexier — dari sampul hingga bahasa rupa keseluruhan.',
       story=['Identitas visual untuk Lexier, dibangun dari satu sampul: tata letak tegas, warna '
              'hangat, dan tipografi yang percaya diri tanpa berteriak.',
              'Sistemnya modular — dari kartu nama hingga media sosial tetap terasa satu suara.',
              'Proses: sketsa di atas kertas, disetel ulang di layar, diuji pada cetakan sungguhan.']),
  dict(slug='lexier-poster', img='lexier-poster.webp', alt='Lexier Poster',
       kind='Poster Series', tag='print · motion', year='2025',
       blurb='Seri poster yang memperlakukan teks sebagai bentuk — hierarki yang bermain.',
       story=['Seri poster yang memperlakukan teks sebagai bentuk, bukan sekadar penyampai pesan.',
              'Tiap poster adalah satu komposisi mandiri: skala, kontras, dan irama dibiarkan '
              'bermain — hasilnya tetap dalam satu bahasa rupa.',
              'Beberapa versi dihidupkan sebagai motion singkat untuk media layar.']),
  dict(slug='brush-script', img='st-06.webp', alt='Brush Script',
       kind='Type Exploration', tag='type · experiment', year='2025',
       blurb='Eksperimen goresan kuas yang dipahat ulang jadi abjad — liar namun terkontrol.',
       story=['Eksperimen tipografi: goresan kuas dipahat ulang menjadi abjad. Liar, tapi tetap '
              'terkontrol — seperti tulisan tangan yang sadar sedang diawasi.',
              'Bermula dari pindaian coretan, lalu di-trace dan diberi irama ketebalan yang konsisten.',
              'Masih tahap eksplorasi; beberapa huruf dipakai untuk logo & judul kecil.']),
]

def n_of(n): return '%02d' % n

# ============================ CSS ============================
def base_head_style(html):
    m = re.search(r'<style>\s*(.*?)\s*</style>', html, re.S)
    return m.group(1)

HOME_STYLE = base_head_style(BASE_INDEX)

VT_CSS = r"""
/* ===== View Transitions (cross-document) — blur fokus + header tetap ===== */
@view-transition{ navigation:auto; }
header{ view-transition-name:vt-nav; }
header nav a.active{ color:#e9e9ea; }
header nav a.active::before, header nav a.active::after{ opacity:1; }
::view-transition-old(root){ animation:vtblurOut .3s ease-in both; }
::view-transition-new(root){ animation:vtblurIn .55s cubic-bezier(.16,1,.3,1) both; }
@keyframes vtblurOut{ to{opacity:0; filter:blur(15px); transform:scale(1.045);} }
@keyframes vtblurIn { from{opacity:0; filter:blur(20px); transform:scale(1.05);} }
@media (prefers-reduced-motion: reduce){
  ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){ animation:none !important; }
}
"""

VT_NAMES = "\n".join(".%s{ view-transition-name:vt-%s; }" % (w['slug'], w['slug']) for w in WORK)

RAIL_CSS = r"""
/* ===== 01 ARCHIVE — Horizontal Scroll Rail (digerakkan scroll vertikal) ===== */
#work.archive{padding:clamp(30px,4.5vw,60px) 0 0;}
.aw-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;
  padding:0 clamp(20px,5vw,56px);margin-bottom:34px;}
.aw-head .archive-title{margin:0;}
.aw-count{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.2em;color:#9a9a9e;
  display:flex;align-items:baseline;gap:10px;}
.aw-count b{color:#e9e9ea;font-size:26px;font-weight:500;letter-spacing:.04em;}
.aw-count i{font-style:normal;opacity:.4;}
.rail-wrap{position:relative;width:100%;}
.rail-pin{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;
  display:flex;flex-direction:column;justify-content:center;}
.rail{display:flex;gap:clamp(20px,4vw,64px);padding:0 clamp(20px,5vw,56px);
  width:max-content;will-change:transform;}
.rslide{position:relative;flex:0 0 auto;width:min(78vw,620px);display:block;text-decoration:none;color:#e9e9ea;
  border-radius:18px;overflow:hidden;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);
  transition:border-color .3s, transform .5s cubic-bezier(.16,1,.3,1);}
.rslide:hover{border-color:rgba(240,217,160,.35);transform:translateY(-6px);}
.rslide .rcvr{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;display:block;}
.rslide .rcap{display:flex;align-items:center;gap:18px;padding:16px 20px 18px;}
.rslide .rc-idx{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.2em;color:var(--acc,#f0d9a0);}
.rslide .rc-mid{flex:1;min-width:0;}
.rslide .rc-mid b{display:block;font-family:"General Sans",sans-serif;font-weight:600;font-size:20px;
  letter-spacing:-.01em;line-height:1.15;}
.rslide .rc-mid span{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.16em;
  text-transform:uppercase;color:#9a9a9e;}
.rslide .rc-go{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.12em;color:#e9e9ea;
  white-space:nowrap;opacity:.85;transition:transform .3s;}
.rslide:hover .rc-go{transform:translateX(5px);color:var(--acc,#f0d9a0);}
/* HUD rail */
.rail-hud{position:absolute;right:clamp(16px,3vw,36px);bottom:22px;left:clamp(20px,5vw,56px);
  display:flex;align-items:center;justify-content:space-between;gap:18px;pointer-events:none;}
.rail-prog{flex:1;max-width:240px;height:1px;background:rgba(255,255,255,.16);position:relative;}
.rail-prog i{position:absolute;left:0;top:-1px;height:3px;width:0%;background:var(--acc,#f0d9a0);}
.rail-hint{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.3em;text-transform:uppercase;
  color:#9a9a9e;display:flex;align-items:center;gap:10px;}
.rail-hint .ar{color:var(--acc,#f0d9a0);}
.rail-btns{pointer-events:auto;display:flex;gap:8px;}
.rail-btns button{width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.14);
  background:rgba(255,255,255,.03);color:#e9e9ea;cursor:pointer;font-size:15px;line-height:1;
  transition:border-color .25s,background .25s;}
.rail-btns button:hover{border-color:var(--acc,#f0d9a0);background:rgba(240,217,160,.08);}
/* reduced-motion / fallback: rail jadi overflow scroll-snap biasa */
.rail-fallback{position:relative;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;
  scroll-snap-type:x mandatory;cursor:grab;scrollbar-width:none;}
.rail-fallback::-webkit-scrollbar{display:none;}
.rail-fallback .rail{transform:none !important;}
.rail-fallback .rslide{scroll-snap-align:center;}
@media (prefers-reduced-motion: reduce){
  .rail-pin{position:relative;height:auto;}
  .rail-fallback{overflow-x:auto;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory;}
  .rail-hud,.rail-btns{display:none;}
}
/* ===== mobile ===== */
@media(max-width:760px){
  #work.archive{padding:44px 0 0;}
  .rail{gap:16px;}
  .rslide{width:min(86vw,440px);}
  .rslide .rcap{padding:12px 14px 14px;gap:12px;}
  .rslide .rc-mid b{font-size:17px;}
  .rslide .rc-go{display:none;}
  .rail-hud{right:16px;left:16px;bottom:12px;}
  .rail-prog{max-width:38vw;}
  .rail-hint span:not(.ar){display:none;}
  .rail-btns button{width:36px;height:36px;font-size:14px;}
  .aw-count b{font-size:20px;}
}
@media(max-height:520px){
  .rail-pin{height:auto;position:relative;}
  .rail-wrap{height:auto !important;}
  .rail{transform:none !important;width:100%;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:6px;}
  .rail::-webkit-scrollbar{display:none;}
  .rslide{flex:0 0 auto;width:70vw;scroll-snap-align:center;}
  .rail-hud{display:none;}
}
"""

CONTACT_CSS = r"""
/* ===== Contact page ===== */
#contact-main{min-height:100svh;display:flex;align-items:center;
  padding:110px clamp(20px,6vw,72px) 70px;position:relative;z-index:2;}
#contact-main .cc{width:100%;max-width:1200px;margin:0 auto;}
.cc-kicker{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.32em;text-transform:uppercase;
  color:#9a9a9e;margin-bottom:26px;}
.cc-title{font-size:clamp(44px,10vw,150px);line-height:.86;font-weight:700;letter-spacing:-.05em;}
.cc-title em{font-style:normal;color:#f0d9a0;}
.cc-big{font-family:"General Sans",sans-serif;font-weight:600;
  font-size:clamp(30px,6vw,88px);letter-spacing:-.05em;line-height:.9;text-align:right;}
.cc-links{margin-top:46px;display:flex;gap:22px;flex-wrap:wrap;align-items:center;
  font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;}
.cc-links a{color:#e9e9ea;text-decoration:none;border-bottom:1px solid transparent;transition:border-color .25s,color .25s;}
.cc-links a:hover{color:#f0d9a0;border-color:rgba(240,217,160,.5);}
.cc-links .sep{color:#9a9a9e;opacity:.5;}
.cc-meta{margin-top:34px;font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.18em;
  text-transform:uppercase;color:#9a9a9e;}
@media(max-width:760px){
  .cc-big{text-align:left;margin-top:20px;}
}
"""

# ============================ helpers ============================
def frag(text, start_marker, end_marker):
    i = text.index(start_marker); j = text.index(end_marker, i)
    return text[i:j]

def strip_prepaint(html):
    return re.sub(r'<script>\s*/\* Pre-paint[^<]*?__wgl_a.*?</script>', '', html, flags=re.S)

def strip_transition_js(html):
    return re.sub(r'<script src="transition\.js\?v=[0-9a-z]+"></script>', '', html)

def cut_head(html, title, extra_style):
    i = html.index('<head>'); j = html.index('</head>', i) + len('</head>')
    head = html[i:j]
    head = strip_prepaint(head)
    head = re.sub(r'<title>.*?</title>', '<title>%s</title>' % title, head, flags=re.S)
    head = head.replace('</head>', '<style id="vtCss">\n' + extra_style + '\n</style>\n</head>')
    return head

def brand_logo(href):
    m = re.search(r'<a class="logo"[\s\S]*?</a>', BASE_INDEX)
    return m.group(0).replace('href="./"', 'href="%s"' % href)

NAV_LINKS = [('home','index.html','Home'),('about','about.html','About'),
             ('work','index.html#work','Work'),('contact','contact.html','Contact')]
def nav_html(active, base=''):
    out=[]
    for key,href,label in NAV_LINKS:
        on = ' class="active"' if key==active else ''
        out.append('<a href="%s%s"%s>%s</a>' % (base, href, on, label))
    return '\n      '.join(out)

def page_header(active, base=''):
    logo_href = base + 'index.html'
    return ('<header>\n    %s\n    <nav aria-label="Navigasi utama">\n      %s\n    </nav>\n  </header>'
            % (brand_logo(logo_href), nav_html(active, base)))

def grain_div():
    m = re.search(r'<div id="grain">.*?</div>', BASE_INDEX, re.S)
    return m.group(0)

def loader_html():
    return ('<div id="loader">\n  <div id="videoWrap">\n'
            '    <video id="crystalVideo" muted autoplay playsinline preload="auto">\n'
            '      <source src="crystal.mp4" type="video/mp4">\n    </video>\n'
            '  </div>\n</div>')

def hero_html():
    return frag(BASE_INDEX, '<section id="hero"', '<section id="manifesto"').rstrip()

def manifesto_html():
    i = BASE_INDEX.index('<section id="manifesto"')
    j = BASE_INDEX.index('</section>', i) + len('</section>')
    return BASE_INDEX[i:j].rstrip()

def log_html():
    return frag(BASE_INDEX, '<section id="log"', '<section id="about"').rstrip()

def footer_html():
    m = re.search(r'<footer>.*?</footer>', BASE_INDEX, re.S)
    return m.group(0)

def js_reveal():
    return r"""
  (function(){
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll('.rv');
    if(els.length && 'IntersectionObserver' in window && !reduced){
      const io = new IntersectionObserver((es)=>{ es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('revealed'); io.unobserve(en.target); } }); },
        {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
      els.forEach(el=> io.observe(el));
    } else { els.forEach(el=> el.classList.add('revealed')); }
  })();
"""

def js_scramble():
    return r"""
  (function(){
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll('.scramble');
    if(!els.length) return;
    els.forEach(el=>{ el.dataset.text = el.textContent; });
    if(reduced || !('IntersectionObserver' in window)) return;
    const GLYPHS = "#/\\<>+=*—01";
    function decode(el){
      const target = el.dataset.text; const dur=700; const t0=performance.now();
      function frame(t){
        const p=Math.min(1,(t-t0)/dur); const settled=Math.floor(p*target.length);
        let out="";
        for(let i=0;i<target.length;i++){ const ch=target[i]; if(ch===" "){out+=" ";continue;} out += i<settled?ch:GLYPHS[(Math.random()*GLYPHS.length)|0]; }
        el.textContent=out;
        if(p<1) requestAnimationFrame(frame); else el.textContent=target;
      }
      requestAnimationFrame(frame);
    }
    const io = new IntersectionObserver((es)=>{ es.forEach(en=>{ if(en.isIntersecting){ decode(en.target); io.unobserve(en.target); } }); },{threshold:0.6});
    els.forEach(el=> io.observe(el));
  })();
"""

def loader_js():
    return r"""
  (function(){
    // Intro selalu tampil SETIAP halaman utama dibuka/di-refresh (tanpa gate "sekali lihat").
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const l = document.getElementById('loader');
    if(!l) return;
    if(reduced){ l.classList.add('gone'); return; }
    const vw = document.getElementById('videoWrap');
    const vid = document.getElementById('crystalVideo');
    let done=false, ok=false;
    const t0 = performance.now();
    function hide(){
      if(done) return; done=true;
      l.classList.add('out');
      if(vw) vw.classList.add('out');
      setTimeout(function(){ l.classList.add('gone'); }, 850);
    }
    function at(ms){ const el=Math.max(0, ms-(performance.now()-t0)); setTimeout(hide, el); }
    function startPlay(){
      if(!vid){ at(900); return; }
      function playing(){ if(!ok){ ok=true; at(1900); } }
      let p=null;
      try{ p = vid.play(); }catch(e){}
      if(p && p.then){ p.then(playing).catch(function(){ at(900); }); }
      else { vid.addEventListener('playing', playing, {once:true}); }
      // video diam-diam sudah jalan tanpa event -> tetap selesaikan
      setTimeout(function(){ if(vid && !vid.paused && vid.currentTime>0) playing(); }, 800);
      // pengaman anti-lengket: intro pasti selesai walau video gagal total
      setTimeout(function(){ if(!ok) at(700); }, 2600);
    }
    startPlay();
  })();
"""

def rail_html():
    slides=[]
    for i,w in enumerate(WORK):
        slides.append(
          '<a class="rslide" href="work/%s.html">' % w['slug'] +
          '<img class="rcvr %s" src="%s" alt="%s" width="1200" height="750" loading="eager" decoding="async">' % (w['slug'], w['img'], w['alt']) +
          '<div class="rcap"><span class="rc-idx">%s</span>' % n_of(i+1) +
          '<span class="rc-mid"><b>%s</b><span>%s · %s</span></span>' % (w['kind'], w['tag'], w['year']) +
          '<span class="rc-go">Buka</span></div></a>')
    total = n_of(len(WORK))
    return ('<section id="work" class="archive" aria-label="Arsip karya" style="scroll-margin-top:0">\n'
            '  <div class="aw-head">\n'
            '    <h2 class="archive-title scramble" style="margin:0;">01 ARCHIVE</h2>\n'
            '    <div class="aw-count"><span id="awNow">01</span><i>/</i><b id="awTotal">' + total + '</b></div>\n'
            '  </div>\n'
            '  <div class="rail-wrap" id="railWrap">\n'
            '    <div class="rail-pin" id="railPin">\n'
            '      <div class="rail" id="rail">\n        ' + '\n        '.join(slides) + '\n      </div>\n'
            '      <div class="rail-hud">\n'
            '        <div class="rail-prog"><i id="railBar"></i></div>\n'
            '        <div class="rail-hint"><span>scroll</span><span class="ar">→</span></div>\n'
            '        <div class="rail-btns">\n'
            '          <button id="railPrev" type="button" aria-label="Sebelumnya">←</button>\n'
            '          <button id="railNext" type="button" aria-label="Berikutnya">→</button>\n'
            '        </div>\n'
            '      </div>\n'
            '    </div>\n'
            '  </div>\n'
            '</section>')

def rail_js():
    return r"""
  (function(){
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = document.getElementById('railWrap'), pin = document.getElementById('railPin'),
          rail = document.getElementById('rail');
    const nowEl = document.getElementById('awNow'), bar = document.getElementById('railBar');
    const prevB = document.getElementById('railPrev'), nextB = document.getElementById('railNext');
    if(!wrap || !rail) return;
    const total = document.querySelectorAll('.rslide').length;
    const totalTxt = document.getElementById('awTotal');
    if(totalTxt) totalTxt.textContent = n2(total);
    function n2(x){ return (x<10?'0':'')+x; }
    let H = 0, off = 0, range = 1, maxX = 0;

    function layout(){
      if(reduced){ wrap.style.height=''; pin.classList.add('rail-fallback'); return; }
      maxX = Math.max(0, rail.scrollWidth - window.innerWidth);
      if(maxX<=0){ wrap.style.height = '115vh'; range=1; H=window.innerHeight; return; }
      H = window.innerHeight;
      // jarak scroll vertikal = lebar yang harus digeser + ruang napas
      const extra = Math.max(H*0.4, 140);
      wrap.style.height = (H + maxX + extra) + 'px';
      range = (wrap.getBoundingClientRect().height - H);
      off = wrap.offsetTop;
      paint();
    }
    let raf=0;
    function paint(){
      const y = window.scrollY - off;
      let p = Math.max(0, Math.min(1, y/range));
      rail.style.transform = 'translate3d(' + (-p*maxX) + 'px,0,0)';
      const idx = Math.round(p*(total-1));
      if(nowEl) nowEl.textContent = n2(idx+1);
      if(bar) bar.style.width = (p*100).toFixed(2)+'%';
    }
    function onScroll(){ if(raf) return; raf = requestAnimationFrame(function(){ raf=0; paint(); }); }
    function toIndex(i){
      i = Math.max(0, Math.min(total-1, i));
      const p = total<=1 ? 0 : i/(total-1);
      const target = off + p*range;
      try{ window.scrollTo({top:target, behavior:'smooth'}); }catch(e){ window.scrollTo(0,target); }
    }
    if(prevB) prevB.addEventListener('click', function(){ const c=parseInt(nowEl.textContent,10)||1; toIndex(c-2); });
    if(nextB) nextB.addEventListener('click', function(){ const c=parseInt(nowEl.textContent,10)||0; toIndex(c); });
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', function(){ clearTimeout(window.__rw); window.__rw=setTimeout(layout,150); });
    if(document.readyState!=='complete') window.addEventListener('load', layout, {once:true});
    layout();
    // gambar bisa mengubah lebar rail setelah dimuat
    if('ResizeObserver' in window){ new ResizeObserver(function(){ layout(); }).observe(rail); }
  })();
"""

# ============================ Halaman ============================
def page_doc(title, head_css, inner_body, script, body_class=''):
    head = cut_head(BASE_INDEX, title, head_css)
    return ('<!doctype html>\n<html lang="id">\n' + head +
            '\n<body%s>\n%s\n<script>\n%s</script>\n</body>\n</html>\n' % ((' class="'+body_class+'"') if body_class else '', inner_body, script))

def home_page():
    head_css = HOME_STYLE + '\n' + VT_CSS + '\n' + VT_NAMES + '\n' + RAIL_CSS
    main = ('<div id="main">\n  ' + grain_div() + '\n\n  ' + page_header('home') + '\n\n  '
            + hero_html() + '\n\n  ' + manifesto_html() + '\n\n  ' + rail_html() + '\n\n  ' + log_html() + '\n\n  '
            + footer_html() + '\n</div>')
    loader = loader_html()
    script = js_reveal() + js_scramble() + loader_js() + rail_js()
    return page_doc('WHY ✴︎ GGG — Personal Landing', head_css, loader + '\n' + main, script)

def contact_page():
    head_css = HOME_STYLE + '\n' + VT_CSS + '\n' + CONTACT_CSS
    inner = ('<div id="main">\n  ' + grain_div() + '\n\n  ' + page_header('contact') + '\n\n'
             '  <div id="contact-main">\n    <div class="cc">\n'
             '      <div class="cc-kicker">[ Say hi ]</div>\n'
             '      <div class="cc-title">Building<br><em>quietly</em>.</div>\n'
             '      <div class="cc-big">ALL IN OR<br>NOTHING</div>\n'
             '      <div class="cc-links">\n'
             '        <a href="mailto:hi@whyggg.com">hi@whyggg.com</a><span class="sep">•</span>\n'
             '        <a href="#">DISCORD</a><span class="sep">•</span>\n'
             '        <a href="https://github.com/wahanggaaa-code" target="_blank" rel="noopener">GitHub</a>\n'
             '      </div>\n'
             '      <div class="cc-meta">Jakarta · Singapore · internet — UTC+7</div>\n'
             '    </div>\n  </div>\n\n  ' + footer_html() + '\n</div>')
    return page_doc('Contact — WHY ✴︎ GGG', head_css, inner, js_reveal())

def project_pages():
    out=[]
    n=len(WORK)
    head_css = HOME_STYLE + '\n' + VT_CSS + '\n' + VT_NAMES + '\n' + PROJ_CSS()
    for i,w in enumerate(WORK):
        prev=WORK[(i-1)%n]; nxt=WORK[(i+1)%n]
        facts = ''.join('<li>%s<span>%s</span></li>' % kv for kv in
                        [('Jenis', w['kind']),('Tahun', w['year']),('Tag', w['tag']),('Status','Arsip')])
        story = ''.join('<p>%s</p>' % p for p in w['story'])
        inner = ('<div id="main">\n  ' + grain_div() + '\n\n  ' + page_header('work', '../') + '\n\n'
                 '  <div class="wrap" style="max-width:1120px;margin:0 auto;padding:96px 40px 60px;position:relative;z-index:2;">\n'
                 '    <div class="crumb"><a href="../index.html">← Home</a><span>/</span>'
                 '<a href="../index.html#work">Archive</a><span>/</span><span>%s</span></div>\n'
                 '    <img class="whero %s" src="../%s" alt="%s" width="1600" height="900">\n'
                 '    <div class="w-kind">%s</div>\n'
                 '    <h1 class="w-title">%s</h1>\n'
                 '    <div class="w-meta"><div><b>Arsip</b><span>%s</span></div><div><b>Tahun</b><span>%s</span></div>'
                 '<div><b>Tipe</b><span>%s</span></div><div><b>Teknis</b><span>vanilla stack</span></div></div>\n'
                 '    <div class="w-story"><div>%s</div><aside><h4>Fakta</h4><ul class="w-facts">%s</ul></aside></div>\n'
                 '    <div class="w-prevnext">\n'
                 '      <a href="../work/%s.html"><small>← Sebelumnya</small>%s</a>\n'
                 '      <a href="../work/%s.html" style="text-align:right"><small>Berikutnya →</small>%s</a>\n'
                 '    </div>\n  </div>\n\n  ' + footer_html() + '\n</div>') % (
                 w['slug'].replace('-',' '), w['slug'], w['img'], w['alt'], w['tag'], w['kind'],
                 n_of(i+1), w['year'], w['kind'], story, facts, prev['slug'], prev['kind'], nxt['slug'], nxt['kind'])
        doc = page_doc('%s — WHY ✴︎ GGG' % w['kind'], head_css, inner, js_reveal() + js_scramble() if False else js_reveal())
        # catatan: project page tanpa scramble; footer path aset dari base relatif = salah di subfolder, perbaiki
        doc = doc.replace('href="fonts/','href="../fonts/').replace('href="favicon.svg"','href="../favicon.svg"')
        out.append((w['slug'], doc))
    return out

def PROJ_CSS():
    return r"""
.crumb{display:flex;gap:12px;align-items:center;margin-bottom:26px;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;}
.crumb a{color:#9a9a9e;text-decoration:none;}
.crumb a:hover{color:#e9e9ea;}
.crumb span{color:#e9e9ea;opacity:.35;}
.whero{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:20px;border:1px solid rgba(255,255,255,.08);display:block;margin:0 0 34px;}
.w-title{font-size:clamp(34px,6vw,76px);line-height:.95;font-weight:700;letter-spacing:-.045em;color:#e9e9ea;margin:0 0 16px;}
.w-kind{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9a9a9e;margin:0 0 8px;}
.w-meta{display:flex;flex-wrap:wrap;gap:30px;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);padding:14px 2px;margin:0 0 36px;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;}
.w-meta b{display:block;color:#9a9a9e;font-weight:600;margin-bottom:3px;}
.w-meta span{color:#e9e9ea;}
.w-story{display:grid;grid-template-columns:1.5fr .9fr;gap:48px;align-items:start;}
.w-story p{color:#cfcbc3;font-size:16px;line-height:1.75;margin:0 0 18px;max-width:64ch;}
.w-story aside h4{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#9a9a9e;margin:0 0 12px;}
.w-facts{list-style:none;margin:0;padding:0;}
.w-facts li{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:14px;color:#e3e0d8;}
.w-facts li span{color:#9a9a9e;font-family:"JetBrains Mono",monospace;font-size:11px;}
.w-prevnext{display:flex;justify-content:space-between;gap:20px;margin-top:64px;padding-top:22px;border-top:1px solid rgba(255,255,255,.07);font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;}
.w-prevnext a{color:#e9e9ea;text-decoration:none;max-width:45%;}
.w-prevnext a small{display:block;color:#9a9a9e;font-size:9px;letter-spacing:.2em;margin-bottom:4px;}
.w-prevnext a:hover{color:#f0d9a0;}
@media(max-width:760px){ .w-story{grid-template-columns:1fr;} .w-prevnext{flex-direction:column;} }
"""

def about_page():
    # about.html : base/about, nav + VT konsisten, buang curtain.
    ab = BASE_ABOUT
    ab = strip_prepaint(ab)
    ab = strip_transition_js(ab)
    # replace nav & logo href
    ab = ab.replace('<a href="./">Home</a>', '<a href="index.html">Home</a>')
    ab = ab.replace('<a href="./#work">Work</a>', '<a href="index.html#work">Work</a>')
    ab = ab.replace('<a href="./#closing">Contact</a>', '<a href="contact.html">Contact</a>')
    ab = ab.replace('<a href="./">← Home</a>', '<a href="index.html">← Home</a>')
    ab = re.sub(r'(<a class="logo" href=")\./(")', r'\1index.html\2', ab)
    ab = ab.replace('</head>', '<style id="vtCss">\n' + VT_CSS + '\n</style>\n</head>')
    return ab

def notfound_page():
    nf = open(os.path.join(BASE,'404.html'), encoding='utf-8').read()
    nf = strip_prepaint(nf); nf = strip_transition_js(nf)
    nf = nf.replace('</head>', '<style id="vtCss">\n' + VT_CSS + '\n</style>\n</head>')
    return nf

# ============================ main ============================
index_html   = home_page()
contact_html = contact_page()
proj_pages   = project_pages()
about_html   = about_page()
nf_html      = notfound_page()

open(INDEX_OUT,'w').write(index_html); print('index.html')
open(ABOUT_OUT,'w').write(about_html); print('about.html')
open(CONTACT_OUT,'w').write(contact_html); print('contact.html')
for slug,h in proj_pages:
    open(os.path.join(WORKD, slug+'.html'),'w').write(h); print('work/'+slug+'.html')
open(os.path.join(ROOT,'404.html'),'w').write(nf_html); print('404.html')
print('selesai')
