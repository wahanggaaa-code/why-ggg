#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
why·ggg — bangun arsitektur multi-halaman + View Transitions (blur fokus + morph).
Baca: main/index.html (Home) & main/about.html sebagai bahan; tulis ulang menjadi
Home (index.html) + About (about.html) + halaman projek (work/*.html).
Output halaman statis siap commit (deploy tidak perlu menjalankan build).

MENAMBAH/MENGUBAH PROYEK: cukup edit daftar WORK di bawah, lalu jalankan
`python3 tools/build-site.py`. Semua halaman projek + grid di Home ter-regenerate.
"""
import os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, 'index.html')
ABOUT = os.path.join(ROOT, 'about.html')
WORKD = os.path.join(ROOT, 'work')
os.makedirs(WORKD, exist_ok=True)

# ============================ DATA PROYEK ============================
# format: dict(slug, vt, img, alt, kind, tag, year, blurb, story=[...])
# slug  -> nama file  work/<slug>.html ; vt -> nama view-transition
# img   -> file gambar (di root repo, dipakai relative dari work/ -> ../)
# ganti konten sesukamu. Urutan = urutan tampil di grid & prev/next.
WORK = [
  dict(
    slug='the-hidden-archive', vt='vt-hiddenarchive',
    img='aethelgard-hero.webp', alt='The Hidden Archive — Landing Page',
    kind='Landing Page', tag='editorial · landing', year='2026',
    blurb='Arsip digital tempat narasi disembunyikan di balik lapisan scroll dan cahaya.',
    story=[
      'Sebuah arsip digital yang menyembunyikan narasi di balik lapisan scroll dan cahaya. '
      'Proyek ini lahir dari rasa penasaran: bagaimana sebuah halaman bisa terasa seperti '
      'ruangan — bukan sekadar dokumen.',
      'Interaksi sengaja dibuat pelan: judul muncul per kata, arsip bergulir seperti membuka '
      'lemari tua, dan tiap karya menyimpan sudut gelap yang baru terlihat bila kamu mau berlama-lama.',
      'Dibangun vanilla — HTML/CSS/JS murni, ditambah View Transitions untuk perpindahan '
      'antar halaman yang mulus tanpa framework.',
    ],
  ),
  dict(
    slug='the-architecture-of-silence', vt='vt-silence',
    img='archive-cover.webp', alt='The Architecture of Silence',
    kind='Editorial Archive', tag='editorial · archive', year='2026',
    blurb='Riset visual tentang sunyi sebagai elemen struktur — ruang kosong yang disengaja.',
    story=[
      'Sebuah riset visual tentang sunyi sebagai elemen struktur. Bukan ketiadaan, melainkan '
      'ruang kosong yang disengaja — jeda yang membuat hal lain terdengar.',
      'Susunan tipografi & grid dibuat senyap: banyak udara, sedikit hiasan. Yang muncul '
      'justru tekstur dari material dan ritme halaman.',
      'Eksplorasi ini menjadi fondasi bahasa visual yang dipakai lintas projek lain.',
    ],
  ),
  dict(
    slug='lexier-cover', vt='vt-lexiercover',
    img='lexier-cover.webp', alt='Lexier Cover',
    kind='Identity — Cover', tag='identity · print', year='2025',
    blurb='Identitas visual untuk Lexier — dari sampul hingga bahasa rupa keseluruhan.',
    story=[
      'Identitas visual untuk Lexier, dibangun dari satu sampul: tata letak tegas, warna '
      'hangat, dan tipografi yang percaya diri tanpa berteriak.',
      'Sistemnya modular — dari kartu nama hingga media sosial tetap terasa satu suara.',
      'Proses: sketsa di atas kertas, disetel ulang di layar, diuji pada cetakan sungguhan.',
    ],
  ),
  dict(
    slug='lexier-poster', vt='vt-lexierposter',
    img='lexier-poster.webp', alt='Lexier Poster',
    kind='Poster Series', tag='print · motion', year='2025',
    blurb='Seri poster yang memperlakukan teks sebagai bentuk — hierarki yang bermain.',
    story=[
      'Seri poster yang memperlakukan teks sebagai bentuk, bukan sekadar penyampai pesan.',
      'Tiap poster adalah satu komposisi mandiri: skala, kontras, dan irama dibiarkan '
      'bermain — hasilnya tetap dalam satu bahasa rupa.',
      'Beberapa versi dihidupkan sebagai motion singkat untuk media layar.',
    ],
  ),
  dict(
    slug='brush-script', vt='vt-brushscript',
    img='st-06.webp', alt='Brush Script',
    kind='Type Exploration', tag='type · experiment', year='2025',
    blurb='Eksperimen goresan kuas yang dipahat ulang jadi abjad — liar namun terkontrol.',
    story=[
      'Eksperimen tipografi: goresan kuas dipahat ulang menjadi abjad. Liar, tapi tetap '
      'terkontrol — seperti tulisan tangan yang sadar sedang diawasi.',
      'Bermula dari pindaian coretan, lalu di-trace dan diberi irama ketebalan yang konsisten.',
      'Masih tahap eksplorasi; beberapa huruf dipakai untuk logo & judul kecil.',
    ],
  ),
]

# ============================ CSS bersama (VT + grid + projek) ============================
VT_CSS = r"""
/* ============ View Transitions (cross-document) ============ */
header nav a.active{ color:#e9e9ea; }
header nav a.active::before,header nav a.active::after{ opacity:1; }
@view-transition{ navigation:auto; }
header{ view-transition-name:vt-nav; }
/* blur fokus — watak transisi antar halaman asli */
::view-transition-old(root){ animation:vtblurOut .3s ease-in both; }
::view-transition-new(root){ animation:vtblurIn .55s cubic-bezier(.16,1,.3,1) both; }
@keyframes vtblurOut{ to{opacity:0; filter:blur(15px); transform:scale(1.045);} }
@keyframes vtblurIn { from{opacity:0; filter:blur(20px); transform:scale(1.05);} }
@media (prefers-reduced-motion: reduce){
  ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){
    animation:none !important;
  }
}
"""
# nama VT per projek (thumbnail di Home == hero di halaman projek => morph)
VT_NAME_CSS = "\n".join(".%s{ view-transition-name:%s; }" % (w['slug'], w['vt']) for w in WORK)

GRID_CSS = r"""
/* ============ Grid karya di Home ============ */
.work-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;margin-top:34px;}
.wcard{display:block;text-decoration:none;color:var(--txt,#e9e9ea);border:1px solid rgba(255,255,255,.07);
  border-radius:16px;overflow:hidden;background:rgba(255,255,255,.015);
  transition:transform .45s cubic-bezier(.16,1,.3,1),border-color .3s;}
.wcard:hover{transform:translateY(-4px);border-color:rgba(240,217,160,.35);}
.wcard img{width:100%;display:block;object-fit:cover;aspect-ratio:16/11;margin:0;}
.wcard .wc-body{padding:15px 18px 18px;}
.wcard .wc-name{font-family:"General Sans",sans-serif;font-weight:600;font-size:17px;letter-spacing:-.01em;margin:0 0 4px;}
.wcard .wc-kind{font-family:"JetBrains Mono",monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:#9a9a9e;margin:0 0 12px;}
.wcard .wc-go{display:inline-flex;align-items:center;gap:7px;font-family:"JetBrains Mono",monospace;
  font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#e9e9ea;}
.wcard .wc-go::after{content:"→";transition:transform .3s;}
.wcard:hover .wc-go::after{transform:translateX(5px);}
"""
PROJ_CSS = r"""
/* ============ Halaman projek ============ */
body.work-page{ }
.crumb{display:flex;gap:14px;align-items:center;margin-bottom:26px;
  font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;}
.crumb a{color:#9a9a9e;text-decoration:none;}
.crumb a:hover{color:#e9e9ea;}
.crumb span{color:#e9e9ea;opacity:.35;}
.whero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:20px;border:1px solid rgba(255,255,255,.08);
  display:block;margin:0 0 34px;}
.w-title{font-size:clamp(34px,6vw,76px);line-height:.95;font-weight:700;letter-spacing:-.045em;color:#e9e9ea;margin:0 0 16px;}
.w-kind{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;
  color:#9a9a9e;margin:0 0 8px;}
.w-meta{display:flex;flex-wrap:wrap;gap:30px;border-top:1px solid rgba(255,255,255,.07);
  border-bottom:1px solid rgba(255,255,255,.07);padding:14px 2px;margin:0 0 36px;
  font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;}
.w-meta b{display:block;color:#9a9a9e;font-weight:600;margin-bottom:3px;}
.w-meta span{color:#e9e9ea;}
.w-story{display:grid;grid-template-columns:1.5fr .9fr;gap:48px;align-items:start;}
.w-story p{color:#cfcbc3;font-size:16px;line-height:1.75;margin:0 0 18px;max-width:64ch;}
.w-story aside h4{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  color:#9a9a9e;margin:0 0 12px;}
.w-facts{list-style:none;margin:0;padding:0;}
.w-facts li{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06);
  font-size:14px;color:#e3e0d8;}
.w-facts li span{color:#9a9a9e;font-family:"JetBrains Mono",monospace;font-size:11px;}
.w-prevnext{display:flex;justify-content:space-between;gap:20px;margin-top:64px;padding-top:22px;
  border-top:1px solid rgba(255,255,255,.07);
  font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;}
.w-prevnext a{color:#e9e9ea;text-decoration:none;max-width:45%;}
.w-prevnext a small{display:block;color:#9a9a9e;font-size:9px;letter-spacing:.2em;margin-bottom:4px;}
.w-prevnext a:hover{color:#f0d9a0;}
@media(max-width:760px){ .w-story{grid-template-columns:1fr;} .w-prevnext{flex-direction:column;} }
"""

def quote(s): return s

def read(f): return open(f, encoding='utf-8').read()

def cut(text, start_marker, end_marker):
    i = text.index(start_marker)
    j = text.index(end_marker, i)
    return text[i:j]

def strip_script_tags(html):
    return re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S)

def strip_prepaint(html):
    # hapus blok pre-paint curtain (script pertama di head, berisi __wgl_a)
    return re.sub(r'<script>\s*/\* Pre-paint[^<]*?__wgl_a.*?</script>', '', html, flags=re.S)

def head_for(html, title=None, extra_style=''):
    # ambil persis <head>..</head> (tanpa doctype/html), sisipkan title & css
    i = html.index('<head>')
    j = html.index('</head>', i) + len('</head>')
    h = strip_prepaint(html[i:j])
    h = re.sub(r'<title>.*?</title>', '<title>%s</title>' % (title or 'WHY ✴︎ GGG'), h, flags=re.S)
    h = h.replace('</head>', '<style id="vtCss">\n' + extra_style + '\n</style>\n</head>')
    return h

def main_style(html):
    m = re.search(r'<style>\s*(.*?)\s*</style>', html, re.S)
    return m.group(1)

def nav_html(active, base=''):
    """Nav sama di semua halaman. base: prefix relatif ('' di root, '../' di work/)."""
    def href(x):
        if x=='home': return base+'index.html'
        if x=='about': return base+'about.html'
        if x=='work': return base+'index.html#work'
        if x=='contact': return base+'index.html#closing'
    items=[]
    for key,label in [('home','Home'),('about','About'),('work','Work'),('contact','Contact')]:
        on = ' class="active"' if key==active else ''
        items.append('<a href="%s"%s>%s</a>' % (href(key), on, label))
    return ''.join(items)

def header(active, base=''):
    logo = _LOGO.replace('href="./"', 'href="%sindex.html"' % base)
    return '<header>\n  %s\n  <nav aria-label="Navigasi utama">\n    %s\n  </nav>\n</header>' % (logo, nav_html(active, base))

def footer(base=''):
    return ('<footer>\n    <span>© 2026 WHY ✴︎ GGG — All Rights Reserved</span>\n'
            '  </footer>')

def js_shared():
    return r'''
  document.documentElement.classList.add('js');
  // Reveal on scroll (.rv)
  (function(){
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll('.rv');
    if(els.length && 'IntersectionObserver' in window && !reduced){
      const io = new IntersectionObserver((es)=>{ es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('revealed'); io.unobserve(en.target); } }); },
        {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
      els.forEach(el=> io.observe(el));
    } else { els.forEach(el=> el.classList.add('revealed')); }
  })();
'''

# ---------- baca bahan ----------
home_src = read(INDEX)
about_src = read(ABOUT)

_LOGO = re.search(r'<a class="logo"[\s\S]*?</a>', home_src).group(0)

style_base = main_style(home_src)   # CSS identitas Home (juga gaya header/hero/dll)
about_style = main_style(about_src)

def base_head(home_title, extra_style):
    return head_for(home_src, home_title, extra_style)

def home_page():
    head = base_head('WHY ✴︎ GGG — Personal Landing', VT_CSS + VT_NAME_CSS + GRID_CSS)
    # ===== body: susun dari potongan asli =====
    # loader
    loader = cut(home_src, '<div id="loader">', '<div id="main">')
    # main container sampai sebelum work, ganti work, lanjut setelah work
    pre = '<div id="main">\n  <div id="grain"></div>\n\n' + header('home')
    hero = cut(home_src, '<section id="hero"', '<section id="manifesto"')
    manifest = cut(home_src, '<section id="manifesto"', '<section id="work"')
    # ganti seluruh seksi work asli dengan grid
    work_head_html = cut(home_src, '<div class="work-head">', '</div>').split('</div>')[0] + '</div>' if False else None
    # ambil header work: cukup rekonstruksi sederhana
    workhead = '<div class="work-head">\n      <h2 class="archive-title scramble" style="margin:0;">01 ARCHIVE</h2>\n      <span class="count">%02d WORKS — NOW</span>\n    </div>' % len(WORK)
    cards=[]
    for w in WORK:
        cards.append(
          '<a class="wcard" href="%swork/%s.html">' % ('', w['slug']) +
          '<img class="%s" src="%s" alt="%s" loading="lazy" decoding="async" width="1200" height="825">' % (w['slug'], w['img'], w['alt']) +
          '<div class="wc-body"><h3 class="wc-name">%s</h3><p class="wc-kind">%s · %s</p>' % (w['kind'], w['tag'], w['year']) +
          '<span class="wc-go">Buka halaman</span></div></a>')
    worksec = ('<section id="work" aria-label="Arsip karya" style="scroll-margin-top:120px">\n' + workhead +
               '\n    <div class="work-grid">\n      ' + '\n      '.join(cards) + '\n    </div>\n  </section>')
    log = cut(home_src, '<section id="log"', '<section id="about"')
    abouttea = cut(home_src, '<section id="about"', '<section id="closing"')
    closing = cut(home_src, '<section id="closing"', '<section id="colophon"')
    colophon = cut(home_src, '<section id="colophon"', '<footer>')
    foot = footer('')

    body_inner = '\n'.join([pre, hero, manifest, worksec, log, abouttea, closing, colophon, foot, '</div>'])

    script = '<script>\n' + js_shared() + r'''
  // Scramble heading (01 ARCHIVE)
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
  // Loader — main sekali per sesi; perpindahan VT tidak memutar intro lagi
  (function(){
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const l = document.getElementById('loader');
    if(!l) return;
    let seen=false; try{ seen = sessionStorage.getItem('__intro')==='1'; }catch(e){}
    function hide(){ if(l.classList.contains('gone'))return; l.classList.add('out'); setTimeout(function(){ l.classList.add('gone'); },900); }
    if(reduced || seen){ l.classList.add('gone'); return; }
    try{ sessionStorage.setItem('__intro','1'); }catch(e){}
    let hid=false;
    function later(){ if(!hid){hid=true; hide();} }
    window.addEventListener('load', function(){ setTimeout(later, 600); }, {once:true});
    setTimeout(later, 3400);
  })();
''' + '</script>'

    return '<!doctype html>\n<html lang="id">\n' + head + '\n<body>\n' + loader + '\n' + body_inner + '\n' + script + '\n</body>\n</html>\n'

def project_pages():
    out=[]
    n=len(WORK)
    for i,w in enumerate(WORK):
        prev=WORK[(i-1)%n]; nxt=WORK[(i+1)%n]
        base='../'
        head = head_for(about_src, '%s — WHY ✴︎ GGG' % w['kind'], VT_CSS + VT_NAME_CSS + PROJ_CSS)
        # karena halaman di subfolder work/, prefix aset relatif dengan ../
        head = (head.replace('href="fonts/', 'href="../fonts/')
                    .replace('href="favicon.svg"', 'href="../favicon.svg"')
                    .replace('href="logo.png"', 'href="../logo.png"'))
        facts = ''.join('<li>%s<span>%s</span></li>' % kv for kv in [
            ('Jenis', w['kind']), ('Tahun', w['year']), ('Tag', w['tag']), ('Status', 'Arsip')])
        story=''.join('<p>%s</p>' % p for p in w['story'])
        crumb = '<div class="crumb"><a href="%s">← Home</a><span>/</span><a href="%s#work">Work</a><span>/</span><span>%s</span></div>' % (base+'index.html', base+'index.html', w['slug'])
        heroimg = '<img class="whero %s" src="%s%s" alt="%s" width="1600" height="900">' % (w['slug'], base, w['img'], w['alt'])
        body = ('<div id="main">\n  <div id="grain"></div>\n\n' + header('work', base) + '\n'
                + '<div class="wrap" style="max-width:1120px;margin:0 auto;padding:96px 40px 60px;position:relative;z-index:2;">\n'
                + crumb + heroimg
                + '<div class="w-kind">%s</div>' % w['tag']
                + '<h1 class="w-title">%s</h1>' % w['kind']
                + '<div class="w-meta"><div><b>Arsip</b><span>%02d</span></div><div><b>Tahun</b><span>%s</span></div><div><b>Tipe</b><span>%s</span></div><div><b>Teknis</b><span>vanilla stack</span></div></div>'
                % (i+1, w['year'], w['kind'])
                + '<div class="w-story"><div>' + story + '</div><aside><h4>Fakta</h4><ul class="w-facts">' + facts + '</ul></aside></div>'
                + '<div class="w-prevnext">'
                + '<a href="%s.html"><small>← Sebelumnya</small>%s</a>' % (prev['slug'], prev['kind'])
                + '<a href="%s.html" style="text-align:right"><small>Berikutnya →</small>%s</a>' % (nxt['slug'], nxt['kind'])
                + '</div>\n</div>\n' + footer(base) + '\n</div>\n')
        html = '<!doctype html>\n<html lang="id">\n' + head + '\n<body class="work-page">\n' + body + '\n<script>' + js_shared() + '</script>\n</body>\n</html>\n'
        out.append((w['slug'], html))
    return out

# ---------- about: buang curtain & pre-paint, pakai VT + nav konsisten ----------
def build_about():
    ab = strip_prepaint(about_src)
    ab = re.sub(r'<script src="transition\.js\?v=[0-9a-z]+"></script>','',ab)
    ab = ab.replace('<a href="./">Home</a>', '<a href="index.html">Home</a>')
    ab = ab.replace('<a href="./#work">Work</a>', '<a href="index.html#work">Work</a>')
    ab = ab.replace('<a href="./#closing">Contact</a>', '<a href="index.html#closing">Contact</a>')
    ab = ab.replace('<a href="./">← Home</a>', '<a href="index.html">← Home</a>')
    ab = re.sub(r'(<a class="logo" href=")\./(")', r'\1index.html\2', ab)
    ab = ab.replace('</head>', '<style id="vtCss">\n' + VT_CSS + '\n</style>\n</head>')
    return ab

# ---------- bangun SEMUA dulu, baru tulis ----------
home_html = home_page()
proj_pages = project_pages()
about_html = build_about()

open(INDEX,'w').write(home_html)
print('index.html regenerated (grid + VT)')

for slug,html in proj_pages:
    open(os.path.join(WORKD, slug+'.html'),'w').write(html)
print('project pages:', len(WORK), 'di work/')

open(ABOUT,'w').write(about_html)
print('about.html updated (VT + nav)')

