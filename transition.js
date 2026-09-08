/* ========================================================================
 * WHY GGG — refined WebGL page transition (signature staircase / skyline)
 *
 * Pure vanilla WebGL, no deps, no page screenshots.
 *
 * Flow:
 *   click internal link -> one-way stair "curtain" sweeps down over the page
 *   (soft warm gray veil, blocky skyline leading edge) -> navigate.
 *   Destination pre-paints the same veil in <head> (no white flash) and then
 *   sweeps the curtain back up to reveal the new page.
 *
 * Refinements over the previous build:
 *   - Cover is a one-way fast sweep; reveal rises with a silky ease and a
 *     small pull-back near the top just before it finishes (see revealQ):
 *     "naik, lalu di penghujung turun sedikit, baru tuntas".
 *   - Reveal starts as soon as DOM+fonts are ready (capped), NOT on slow
 *     window 'load' — no dead time staring at a static veil.
 *   - Same-page links (Home/logo/href="#" placeholders) are no longer
 *     treated as navigations (no pointless full reload + cover).
 *   - Browser back/forward & bfcache restores are handled (pageshow):
 *     a page restored while covered re-runs the reveal; a restored page that
 *     was already visible stays visible. No stuck veil.
 *   - After reveal, scrolls to the target #anchor if the URL has one.
 *   - Reduced-motion -> instant native navigation (no veil).
 *   - No-WebGL -> short CSS fade cover + slide-away reveal fallback.
 * ======================================================================== */
(function(){
  'use strict';

  var VEIL   = '#c9c6cd';           // soft warm gray-off-white (matches strip)
  var VEIL_RGB = [0.788, 0.776, 0.804];

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If the user asked for reduced motion we never animate: clear any
  // leftover arrival veil + flag so nothing can get stuck on screen.
  if(reduced){
    var s = document.getElementById('wgl-veil');
    if(s) s.remove();
    try{ sessionStorage.removeItem('__wgl_a'); }catch(e){}
    return;
  }

  /* ---------- capability probe ---------- */
  var cv0 = document.createElement('canvas');
  var hasGL = false;
  try{ hasGL = !!(cv0.getContext('webgl') || cv0.getContext('experimental-webgl')); }catch(e){}

  // Are we arriving from another page that animated a cover?
  var arriving = false;
  try{ arriving = sessionStorage.getItem('__wgl_a') === '1'; }catch(e){}

  /* ---------- geometry / timings ---------- */
  // Staircase columns as before, slightly tightened.
  var N_COLS = 54.0;
  var STAGGER = 0.34;   // diagonal slope of the leading edge
  var JITTER  = 0.22;   // blocky height variation between columns

  // p (edge position) mapping:
  //   covered = uv.y > edgeY ; edge sweeps from "open" (page visible) to
  //   "closed" (fully covered) one-way; reveal is the reverse one-way.
  var P_OPEN   = 1.15 + STAGGER + JITTER;
  var P_CLOSED = -0.15 - JITTER;

  var COVER_MS  = 540;   // outgoing sweep
  var REVEAL_MS = 680;   // incoming reveal
  var START_DELAY_MS = 60; // tiny settle after DOM+fonts before reveal starts
  var SAFE_MAX_MS    = 1300; // absolute cap so a stuck load never blocks reveal

  /* ---------- shaders ---------- */
  var vs =
    'precision highp float;\n' +
    'attribute vec2 aPos;\n' +
    'varying vec2 vUv;\n' +
    'void main(){ vUv = aPos; gl_Position = vec4(aPos*2.0-1.0, 0.0, 1.0); }\n';

  var fs =
    '#define N_COLS '  + N_COLS.toFixed(1)  + '\n' +
    '#define STAGGER ' + STAGGER.toFixed(2) + '\n' +
    '#define JITTER '  + JITTER.toFixed(2)  + '\n' +
    'precision highp float;\n' +
    'varying vec2 vUv;\n' +
    'uniform sampler2D uJitter;\n' +
    'uniform float uProgress;\n' +
    '\n' +
    'void main(){\n' +
    '  vec2 uv = vUv;\n' +
    '  float p = uProgress;\n' +
    '  float colId = floor(clamp(uv.x, 0.0, 0.9999) * N_COLS);\n' +
    '  float colFrac = colId / (N_COLS - 1.0);\n' +
    '  float baseEdge = p - (1.0 - colFrac) * STAGGER;\n' +
    '  float j = texture2D(uJitter, vec2((colId + 0.5)/N_COLS, 0.5)).r;\n' +
    '  float offset = (j - 0.5) * JITTER;\n' +
    '  float edgeY = baseEdge + offset;\n' +
    // Covered = above the edge (veil fills from the top down to the skyline).
    '  float covered = smoothstep(edgeY - 0.005, edgeY + 0.005, uv.y);\n' +
    '  vec3 col = vec3(' + VEIL_RGB[0].toFixed(3) + ', ' + VEIL_RGB[1].toFixed(3) + ', ' + VEIL_RGB[2].toFixed(3) + ');\n' +
    '  gl_FragColor = vec4(col, covered);\n' +
    '}\n';

  /* ---------- helpers ---------- */
  function _rng(seed){ var t=seed>>>0; return function(){ t+=0x6D2B79F5; var r=Math.imul(t^t>>>15,1|t); r=r+Math.imul(r^r>>>7,61|r)^r; return ((r^r>>>14)>>>0)/4294967296; }; }

  function mkJit(){
    var s=N_COLS|0, STEPS=10.0;
    var rand = _rng(1337);
    var vals = new Array(s);
    var v = 0.6, nextChange = 0, target = v;
    for(var x=0;x<s;x++){
      if(x>=nextChange){
        var delta = (rand()-0.5)*0.6;
        target = Math.max(0.1, Math.min(0.9, v + delta));
        nextChange = x + 1 + Math.floor(rand()*3);
      }
      v = target;
      vals[x] = Math.floor(v*STEPS + 0.5)/STEPS;
    }
    var mn=vals[0], mx=vals[0];
    for(var k=1;k<s;k++){ if(vals[k]<mn)mn=vals[k]; if(vals[k]>mx)mx=vals[k]; }
    var rng=mx-mn||1;
    var cv=document.createElement('canvas'); cv.width=s; cv.height=1;
    var cx=cv.getContext('2d');
    var im=cx.createImageData(s,1), d=im.data;
    for(var i=0;i<s;i++){
      var t=(vals[i]-mn)/rng;
      var px=Math.max(0,Math.min(255,Math.floor(t*255)));
      d[i*4]=px; d[i*4+1]=px; d[i*4+2]=px; d[i*4+3]=255;
    }
    cx.putImageData(im,0,0);
    return cv;
  }
  function mkGL(cv){
    var gl=null;
    try{ gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false}); }catch(e){}
    if(!gl) try{ gl=cv.getContext('experimental-webgl',{antialias:true,alpha:true,premultipliedAlpha:false}); }catch(e){}
    return gl;
  }
  function sh(gl,t,s){
    var x=gl.createShader(t); gl.shaderSource(x,s); gl.compileShader(x);
    if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){ return null; }
    return x;
  }
  function mkPr(gl){
    var v=sh(gl,gl.VERTEX_SHADER,vs), f=sh(gl,gl.FRAGMENT_SHADER,fs);
    if(!v||!f) return null;
    var p=gl.createProgram(); gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) return null;
    return p;
  }
  function bindQuad(gl,p){
    var b=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1, 0,1,1,0,1,1]),gl.STATIC_DRAW);
    var l=gl.getAttribLocation(p,'aPos');
    gl.enableVertexAttribArray(l);
    gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
  }
  function upT(gl,t,s){
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,s);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  }

  /* ---------- overlay / GL state ---------- */
  var ov, cv, gl, prg, jTex, uP, uJ, quadBound=false;

  function ensure(){
    if(ov) return;
    ov=document.createElement('div');
    ov.id='wgl-ov';
    ov.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none;opacity:0;background:transparent;';
    cv=document.createElement('canvas');
    cv.style.cssText='width:100%;height:100%;display:block;';
    ov.appendChild(cv);
    document.body.appendChild(ov);
    gl=mkGL(cv);
    if(gl){
      prg=mkPr(gl);
      if(prg){
        gl.useProgram(prg);
        bindQuad(gl,prg);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        jTex=gl.createTexture();
        upT(gl,jTex,mkJit());
        uP=gl.getUniformLocation(prg,'uProgress');
        uJ=gl.getUniformLocation(prg,'uJitter');
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,jTex);
        gl.uniform1i(uJ,0);
        quadBound=true;
      }
    }
    resize();
  }
  function resize(){
    if(!cv) return;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width =Math.floor(window.innerWidth*dpr);
    cv.height=Math.floor(window.innerHeight*dpr);
  }
  function drawAt(p){
    if(!gl||!prg) return;
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prg);
    if(!quadBound){ bindQuad(gl,prg); quadBound=true; }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,jTex);
    gl.uniform1i(uJ,0);
    gl.uniform1f(uP,p);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }

  /* ---------- scroll lock ---------- */
  function lockScroll(on){
    if(on){
      document.body.style.overflow='hidden';
      document.documentElement.style.overflow='hidden';
    } else {
      document.body.style.overflow='';
      document.documentElement.style.overflow='';
    }
  }

  /* ---------- easing ---------- */
  // easeInCubic — cover *accelerates* toward the cut: it closes decisively
  // instead of lingering in the near-white fully-covered state.
  function easeInCubic(t){ return t*t*t; }
  // easeOutCubic — reveal starts fast, settles gently.
  function easeOutCubic(t){ return 1-Math.pow(1-t,3); }

  // REVEAL CURVE — "rise, then a small pull-back at the top, then finish".
  // q is the reveal progress (0 = fully covered, 1 = fully open).
  //   Phase A (rise):   q climbs 0 -> RISE_Q, stair edge sweeps up the screen.
  //   Phase B (dip):    q pulls back to PULL_Q — just before the end the
  //                     stairs briefly sweep back DOWN (a visible flick near
  //                     the top), then...
  //   Phase C (finish): q climbs PULL_Q -> 1 and the veil clears for good.
  var RISE_T = 0.52;   // end of the main upward sweep (fraction of duration)
  var RISE_Q = 0.80;   // how "open" the rise reaches before pulling back
  var PULL_T = 0.74;   // end of the pull-back (fraction of duration)
  var PULL_Q = 0.72;   // how far the stairs descend again (must stay < RISE_Q)
  function revealQ(t){
    if(t <= RISE_T){
      var r = t / RISE_T;
      return RISE_Q * easeOutCubic(r);
    }
    if(t <= PULL_T){
      var r2 = (t - RISE_T) / (PULL_T - RISE_T);
      return RISE_Q + (PULL_Q - RISE_Q) * easeInCubic(r2);
    }
    var r3 = (t - PULL_T) / (1 - PULL_T);
    return PULL_Q + (1 - PULL_Q) * easeOutCubic(r3);
  }

  /* ---------- state ---------- */
  var busy=false;      // a cover/reveal is in flight
  var covered=false;   // this document is currently fully under the veil
  var raf=0;

  /* ---------- CSS fallbacks (no WebGL) ---------- */
  function fallbackCover(onDone){
    ov.style.transition='opacity 0.22s ease';
    ov.style.opacity='0';
    ov.style.background=VEIL;
    ov.style.transform='';
    void ov.offsetWidth;
    ov.style.opacity='1';
    ov.style.pointerEvents='auto';
    setTimeout(function(){ onDone&&onDone(); }, 340);
  }
  function fallbackReveal(onDone){
    ov.style.transition='none';
    ov.style.background=VEIL;
    ov.style.opacity='1';
    ov.style.transform='translateY(0)';
    ov.style.pointerEvents='auto';
    void ov.offsetWidth;
    ov.style.transition='transform 0.85s cubic-bezier(0.77,0,0.175,1)';
    ov.style.transform='translateY(-102%)';
    setTimeout(function(){
      ov.style.opacity='0';
      ov.style.background='transparent';
      ov.style.pointerEvents='none';
      lockScroll(false);
      onDone&&onDone();
    }, 900);
  }

  /* ---------- animation ---------- */
  function animate(dur, fromP, toP, phase, onDone){
    if(!gl||!prg){ if(phase==='cover') fallbackCover(onDone); else fallbackReveal(onDone); return; }

    resize();
    ov.style.opacity='1';
    ov.style.pointerEvents='auto';
    ov.style.background='transparent';   // canvas does all the painting
    ov.style.transition='none';

    // Paint the starting frame synchronously so there is never a transparent gap.
    drawAt(fromP);

    var t0=0;
    function frame(now){
      if(!t0) t0=now;
      var t=Math.min(1,(now-t0)/dur);
      var p = phase==='cover'
        ? fromP + (toP-fromP)*easeInCubic(t)
        : fromP + (toP-fromP)*revealQ(t);
      drawAt(p);
      if(t<1){
        cancelAnimationFrame(raf);
        raf=requestAnimationFrame(frame);
      } else {
        drawAt(toP);
        if(phase==='cover'){
          // Let the browser actually present the final full veil, then leave.
          covered=true;
          setTimeout(function(){ onDone&&onDone(); }, 30);
        } else {
          covered=false;
          ov.style.opacity='0';
          ov.style.pointerEvents='none';
          lockScroll(false);
          onDone&&onDone();
        }
      }
    }
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(frame);
  }

  /* ---------- destination helpers ---------- */
  function scrollToIntent(){
    var h=window.location.hash;
    if(h && h.length>1){
      var id=h.slice(1);
      try{ id=decodeURIComponent(id); }catch(e){}
      var el=document.getElementById(id);
      if(el){ try{ el.scrollIntoView({block:'start', behavior: reduced?'auto':'smooth'}); }catch(e2){ try{ el.scrollIntoView(); }catch(e3){} } return; }
    }
    window.scrollTo(0,0);
  }

  /* ---------- enter / reveal ---------- */
  function beginReveal(){
    if(busy) return;         // already animating
    busy=true;
    ensure();
    resize();

    var veil=document.getElementById('wgl-veil');
    if(veil) veil.remove();

    lockScroll(true);
    ov.style.background='transparent';
    ov.style.opacity='1';
    ov.style.pointerEvents='auto';

    if(gl&&prg){
      // First frame fully covered drawn synchronously above the removed veil.
      drawAt(P_CLOSED);
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          animate(REVEAL_MS, P_CLOSED, P_OPEN, 'reveal', function(){ busy=false; scrollToIntent(); });
        });
      });
    } else {
      fallbackReveal(function(){ busy=false; scrollToIntent(); });
    }
  }

  function scheduleEnter(){
    if(!covered) return;
    // Start as soon as DOM is parsed & fonts ready (capped), never on a slow
    // window 'load'. Nothing waits on media.
    var fired=false, safeT=0;
    function fire(){ if(fired) return; fired=true; clearTimeout(safeT); beginReveal(); }
    function afterFonts(){
      setTimeout(fire, START_DELAY_MS);
    }
    function domReady(){
      if(document.fonts && document.fonts.ready && document.fonts.ready.then){
        var done=false, t=setTimeout(function(){ done=true; afterFonts(); }, 250);
        document.fonts.ready.then(function(){ if(done) return; clearTimeout(t); done=true; afterFonts(); });
      } else afterFonts();
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', domReady, {once:true});
    else domReady();
    window.addEventListener('load', fire, {once:true,passive:true});
    safeT=setTimeout(fire, SAFE_MAX_MS);
  }

  /* ---------- outgoing cover ---------- */
  function goTo(url){
    if(busy) return;
    busy=true;
    ensure();
    lockScroll(true);
    try{ sessionStorage.setItem('__wgl_a','1'); }catch(e){}
    covered=true;
    animate(COVER_MS, P_OPEN, P_CLOSED, 'cover', function(){
      window.location.href = url;
    });
  }

  /* ---------- link classification ---------- */
  function shouldTransition(a){
    if(!a.href) return false;
    var raw=a.getAttribute('href');
    if(raw==='#'||raw==='#!') return false;                 // placeholder link
    if(a.target && a.target!=='' && a.target!=='_self') return false;
    if(a.hasAttribute('download')||a.getAttribute('data-notransition')!==null) return false;
    var u; try{ u=new URL(a.href); }catch(e){ return false; }
    if(u.protocol!=='http:'&&u.protocol!=='https:') return false;
    if(u.origin!==window.location.origin) return false;
    // Same page (identical path+query): native scroll / nothing. Never reload.
    if(u.pathname===window.location.pathname && u.search===window.location.search) return false;
    var ext=(u.pathname.split('.').pop()||'').toLowerCase();
    var skip=['jpg','jpeg','png','webp','gif','svg','mp4','webm','mp3','wav','pdf','zip','css','js','woff','woff2','ttf','ico','xml','txt','map','json'];
    return skip.indexOf(ext)===-1;
  }

  function init(){
    document.addEventListener('click', function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0) return;
      var a=e.target.closest('a');
      if(!a) return;
      var raw=a.getAttribute('href');
      if(raw==='#'||raw==='#!'||raw==='javascript:void(0)'){ e.preventDefault(); return; }
      if(!shouldTransition(a)){
        // Non-transitioned internal link to the exact same URL (no hash):
        // suppress the pointless full reload (logo/Home while already home).
        var u; try{ u=new URL(a.href); }catch(e2){ return; }
        var samePath = u.origin===window.location.origin &&
                       u.pathname===window.location.pathname &&
                       u.search===window.location.search;
        if(samePath && !u.hash){
          // Already on this URL without an anchor: skip the pointless reload,
          // but still give the expected "back to top" behaviour.
          e.preventDefault();
          if(window.scrollY>0){
            try{ window.scrollTo({top:0, behavior: reduced?'auto':'smooth'}); }
            catch(e2){ window.scrollTo(0,0); }
          }
        }
        return;
      }
      e.preventDefault();
      goTo(a.href);
    }, false);

    window.addEventListener('resize', resize, {passive:true});

    // Fresh arrival with an animated cover in sessionStorage.
    if(arriving){
      covered=true;
      scheduleEnter();
      // Flag sudah "dikonsumsi": refresh/direct-load berikutnya tidak perlu veil.
      try{ sessionStorage.removeItem('__wgl_a'); }catch(e2){}
    }

    // bfcache / history restores: re-reveal only if this document was
    // left in the fully-covered state (i.e. we animated away from it).
    window.addEventListener('pageshow', function(ev){
      if(ev.persisted && covered && !busy){
        covered=true;
        scheduleEnter();
      }
    }, false);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
