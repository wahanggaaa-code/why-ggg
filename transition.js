/* BUILD v20260908f — EXACTLY like the reference video: a curtain pulled UP.
 *   cover  = veil rises from the BOTTOM of the old page to cover (swipe up).
 *   reveal = veil keeps rising: new page opens from the BOTTOM, veil exits
 *            through the TOP (swipe up). Cache-bust ?v=20260908b.
 * ========================================================================
 * WHY GGG — WebGL page transition (signature staircase / skyline)
 *
 * Pure vanilla WebGL, no deps, no page screenshots.
 *
 * Motion matches ref-transition.2.mp4 — the veil always travels UP:
 *   COVER (click, old page): veil region is BELOW the stair edge (uSide=1).
 *     The edge starts below the bottom of the screen and RISES; the veil
 *     grows from the bottom up until the screen is fully covered.
 *   REVEAL (new page): veil region is ABOVE the stair edge (uSide=0). The
 *     edge again starts low (fully covered) and RISES; the veil shrinks and
 *     exits through the TOP, so the new page appears from the BOTTOM of the
 *     screen first — the same upward curtain motion as the reference.
 *
 * Refinements kept from the audit:
 *   - Same-page links (Home/logo/href="#" placeholders) never navigate.
 *   - Browser back/forward & bfcache restores handled (no stuck veil).
 *   - After reveal, scrolls to target #anchor if present.
 *   - Reduced-motion -> instant native navigation.
 *   - No-WebGL -> CSS veil: slides up over the page (cover) then slides up
 *     off the top (reveal).
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
  // RACING STEPS — NOT a smooth wave, NOT a uniform staircase. Several wide
  // columns ("anak tangga") each rise at its OWN randomised speed, so they
  // visibly race: fast columns finish first and wait at the top while slower
  // ones catch up ("balapan"). Same race plays in cover and in reveal (only
  // the veil side flips via uniform uSide).
  var N_COLS   = 12.0;   // number of racing steps across the width
  var P_LOW    = -0.15;  // an edge at/below the screen bottom
  var P_HIGH   =  1.15;  // an edge at/above the screen top
  // Speeds are CLOSE together so the columns stay near each other while they
  // race (no single column far ahead). SCALE = 1/SPEED_MIN guarantees that at
  // the end of the phase (uTime=1) EVERY column has fully arrived — the
  // screen always closes completely before the reveal starts.
  var SPEED_MIN = 0.78;  // slowest column speed factor
  var SPEED_MAX = 1.00;  // fastest column speed factor
  var SPEED_SCALE = 1.0 / SPEED_MIN; // stretch clock so slowest finishes at uTime=1
  var COVER_HOLD_MS = 100; // hold the fully-closed veil before navigating
                           // (screen closes first, then the new-page transition)

  var COVER_MS  = 620;   // cover: veil rises from bottom to fill (swipe up)
  var REVEAL_MS = 780;   // reveal: veil rises out the top, page opens bottom-up
  var START_DELAY_MS = 40; // minimal settle so cover->reveal stays readable
  var SAFE_MAX_MS    = 1000; // absolute cap so a stuck load never blocks reveal

  /* ---------- shaders ---------- */
  var vs =
    'precision highp float;\n' +
    'attribute vec2 aPos;\n' +
    'varying vec2 vUv;\n' +
    'void main(){ vUv = aPos; gl_Position = vec4(aPos*2.0-1.0, 0.0, 1.0); }\n';

  var fs =
    '#define N_COLS ' + N_COLS.toFixed(1) + '\n' +
    '#define SCALE ' + SPEED_SCALE.toFixed(4) + '\n' +
    'precision highp float;\n' +
    'varying vec2 vUv;\n' +
    'uniform float uTime;\n' +     // 0..1 across the phase duration
    'uniform float uSide;\n' +     // 1 = veil below edge (cover), 0 = veil above edge (reveal)
    '\n' +
    'float hash(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
    'float easeInQuad(float x){ return x * x; }\n' +
    '\n' +
    'void main(){\n' +
    '  vec2 uv = vUv;\n' +
    // Which racing step is this pixel in? Every pixel in one step shares the
    // same speed -> the step edge stays a clean vertical wall (not a wave).
    '  float k = floor(clamp(uv.x, 0.0, 0.9999) * N_COLS);\n' +
    '  float kf = k / (N_COLS - 1.0);\n' +
    // Deterministic, stable per-column speed (random heights of finishing).
    '  float r = hash(vec2(kf * 13.17, 7.33));\n' +
    '  float sp = ' + SPEED_MIN.toFixed(3) + ' + ' + (SPEED_MAX-SPEED_MIN).toFixed(3) + ' * r;\n' +
    // Column-local progress: fast columns clamp at 1 early (they win the race
    // and wait), slow columns are still catching up -> visible chasing.
    '  float tt = clamp(sp * SCALE * uTime, 0.0, 1.0);\n' +
    '  float edgeY = mix(' + P_LOW.toFixed(3) + ', ' + P_HIGH.toFixed(3) + ', easeInQuad(tt));\n' +
    // Portable coverage (ascending smoothstep + mix), veil side via uSide:
    '  float above = smoothstep(edgeY - 0.004, edgeY + 0.004, uv.y);\n' +
    '  float covered = mix(above, 1.0 - above, uSide);\n' +
    '  vec3 col = vec3(' + VEIL_RGB[0].toFixed(3) + ', ' + VEIL_RGB[1].toFixed(3) + ', ' + VEIL_RGB[2].toFixed(3) + ');\n' +
    '  gl_FragColor = vec4(col, covered);\n' +
    '}\n';
  /* ---------- helpers ---------- */
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

  /* ---------- overlay / GL state ---------- */
  var ov, cv, gl, prg, uTime, uSide, quadBound=false;
  var sideSel = 1; // 1 = veil below edge (cover), 0 = veil above edge (reveal)

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
        uTime=gl.getUniformLocation(prg,'uTime');
        uSide=gl.getUniformLocation(prg,'uSide');
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
  function drawT(t){
    if(!gl||!prg) return;
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prg);
    if(!quadBound){ bindQuad(gl,prg); quadBound=true; }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uSide, sideSel);
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

  /* ---------- state ---------- */
  var busy=false;      // a cover/reveal is in flight
  var covered=false;   // this document is currently fully under the veil
  var raf=0;

  /* ---------- CSS fallbacks (no WebGL) ----------
   * Mirrors the reference-video direction:
   *   cover  = veil slides UP from the bottom of the screen to cover
   *   reveal = veil slides UP off the top, page opens from the bottom
   */
  function fallbackCover(onDone){
    ov.style.transition='none';
    ov.style.background=VEIL;
    ov.style.opacity='1';
    ov.style.transform='translateY(101%)';   // parked just below the screen
    ov.style.pointerEvents='auto';
    void ov.offsetWidth;
    ov.style.transition='transform 0.62s cubic-bezier(0.55,0,0.3,1)';
    ov.style.transform='translateY(0)';      // rises up over the page
    setTimeout(function(){ onDone&&onDone(); }, 680);
  }
  function fallbackReveal(onDone){
    ov.style.transition='none';
    ov.style.background=VEIL;
    ov.style.opacity='1';
    ov.style.transform='translateY(0)';
    ov.style.pointerEvents='auto';
    void ov.offsetWidth;
    ov.style.transition='transform 0.78s cubic-bezier(0.55,0,0.3,1)';
    ov.style.transform='translateY(-102%)';  // rises up off the top (reveal bottom-up)
    setTimeout(function(){
      ov.style.opacity='0';
      ov.style.background='transparent';
      ov.style.pointerEvents='none';
      lockScroll(false);
      onDone&&onDone();
    }, 900);
  }

  /* ---------- animation ---------- */
  // Both phases drive a single progress t = 0..1 (uTime). Each column runs
  // that t through its OWN speed in the shader, which is what creates the
  // racing/chasing feel.
  function animate(dur, phase, onDone){
    if(!gl||!prg){ if(phase==='cover') fallbackCover(onDone); else fallbackReveal(onDone); return; }

    resize();
    ov.style.opacity='1';
    ov.style.pointerEvents='auto';
    ov.style.background='transparent';   // canvas does all the painting
    ov.style.transition='none';

    // Paint the starting frame synchronously so there is never a transparent gap.
    drawT(0);

    var t0=0;
    function frame(now){
      if(!t0) t0=now;
      var t=Math.min(1,(now-t0)/dur);
      drawT(t);
      if(t<1){
        cancelAnimationFrame(raf);
        raf=requestAnimationFrame(frame);
      } else {
        drawT(1);
        if(phase==='cover'){
          // Screen is now FULLY covered (every column arrived thanks to
          // SCALE). Hold it briefly so it reads as "menutup dulu", THEN the
          // page swaps and the entry transition appears.
          covered=true;
          setTimeout(function(){ onDone&&onDone(); }, COVER_HOLD_MS);
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
      // Reveal = veil-above rising out of the top (like the ref video).
      sideSel = 0;
      // First frame fully covered drawn synchronously above the removed veil.
      drawT(0);
      requestAnimationFrame(function(){
        animate(REVEAL_MS, 'reveal', function(){ busy=false; scrollToIntent(); });
      });
    } else {
      fallbackReveal(function(){ busy=false; scrollToIntent(); });
    }
  }

  function scheduleEnter(){
    if(!covered) return;
    // Start reveal as soon as the DOM is parsed + a tiny settle — never wait
    // on fonts/media, so there is no long static veil between the "naik"
    // (cover) and "turun" (reveal) halves of the one effect.
    var fired=false, safeT=0;
    function fire(){ if(fired) return; fired=true; clearTimeout(safeT); beginReveal(); }
    function start(){ setTimeout(fire, START_DELAY_MS); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
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
    // Cover = veil-below rising to fill from the bottom (like the ref video).
    sideSel = 1;
    animate(COVER_MS, 'cover', function(){
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
