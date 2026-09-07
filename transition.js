/* ========================================================================
 * WHY GGG — WebGL page transition
 * Staircase/skyline mask wipe (blocky stepped leading edge with many
 * small vertical columns, like a city skyline / stairs). Soft warm
 * off-white color, clean & ultra-smooth, no visible noise.
 *
 * Pure vanilla WebGL, no dependencies, no page screenshots.
 * Flow: click -> soft white veil with jagged stair edge sweeps down
 * covering page -> navigate -> new page loads -> veil sweeps up to reveal.
 * ======================================================================== */
(function(){
  'use strict';

  var cv0 = document.createElement('canvas');
  var hasGL = false;
  try{ hasGL = !!(cv0.getContext('webgl')||cv0.getContext('experimental-webgl')); }catch(e){}
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pre-paint veil on entry so there's zero flash — matches strip color
  var VEIL = '#c9c6cd'; // soft warm gray-off-white, very easy on eyes over dark bg
  var VEIL_RGB = [0.788, 0.776, 0.804];

  var arriving = false;
  try{ arriving = sessionStorage.getItem('__wgl_a')==='1'; }catch(e){}
  if(arriving && hasGL && !reduced){
    var vs0 = document.createElement('style');
    vs0.id = 'wgl-veil';
    vs0.textContent = 'html{background:'+VEIL+'!important;}body::before{content:"";position:fixed;inset:0;z-index:99999;background:'+VEIL+';pointer-events:none;}';
    document.head.appendChild(vs0);
  }

  if(!hasGL || reduced){
    try{ sessionStorage.removeItem('__wgl_a'); }catch(e){}
    return;
  }

  /* ---------- shaders ---------- */
  // N_COLS: number of vertical columns forming the staircase skyline.
  // STAGGER: how far the leading-edge "V" spans (0 = flat edge, 1 = max slope).
  // JITTER: amplitude of per-column random height offset (0..1 fraction of column size).
  var N_COLS = 50.0;
  var STAGGER = 0.35;
  var JITTER = 0.25;

  var vs =
    'precision highp float;\n' +
    'attribute vec2 aPos;\n' +
    'varying vec2 vUv;\n' +
    'void main(){ vUv = aPos; gl_Position = vec4(aPos*2.0-1.0, 0.0, 1.0); }\n';

  var fs =
    '#define N_COLS ' + N_COLS.toFixed(1) + '\n' +
    '#define STAGGER ' + STAGGER.toFixed(2) + '\n' +
    '#define JITTER ' + JITTER.toFixed(2) + '\n' +
    'precision highp float;\n' +
    'varying vec2 vUv;\n' +
    'uniform sampler2D uJitter;\n' +
    'uniform float uProgress;\n' +
    '\n' +
    'void main(){\n' +
    '  vec2 uv = vUv;\n' +
    '  float p = uProgress;\n' +
    '\n' +
    '  float colId = floor(clamp(uv.x, 0.0, 0.9999) * N_COLS);\n' +
    '  float colFrac = colId / (N_COLS - 1.0);\n' +
    '\n' +
    '  float baseEdge = p - colFrac * STAGGER;\n' +
    '  float j = texture2D(uJitter, vec2((colId + 0.5)/N_COLS, 0.5)).r;\n' +
    '  float offset = (j - 0.5) * JITTER;\n' +
    '  float edgeY = baseEdge + offset;\n' +
    '\n' +
    '  // Covered where uv.y (1=top, 0=bottom) is above the edge.\n' +
    '  float covered = smoothstep(edgeY - 0.005, edgeY + 0.005, uv.y);\n' +
    '\n' +
    '  vec3 col = vec3(0.788, 0.776, 0.804);\n' +
    '  gl_FragColor = vec4(col, covered);\n' +
    '}\n';

  /* ---------- helpers ---------- */
  // Seeded pseudo-random (mulberry32) for deterministic, same-pattern-every-time stairs.
  function _rng(seed){ var t=seed>>>0; return function(){ t+=0x6D2B79F5; var r=Math.imul(t^t>>>15,1|t); r=r+Math.imul(r^r>>>7,61|r)^r; return ((r^r>>>14)>>>0)/4294967296; }; }

  function mkJit(){
    var s=N_COLS|0, STEPS=10.0;
    var rand = _rng(1337);
    // Build blocks: pick new random heights every 1-3 columns, step up/down.
    var vals = new Array(s);
    var v = 0.6;
    var nextChange = 0;
    var target = v;
    for(var x=0;x<s;x++){
      if(x>=nextChange){
        // Step to a new random level within [0.1, 0.9], max 0.3 away from current
        var delta = (rand()-0.5)*0.6;
        target = Math.max(0.1, Math.min(0.9, v + delta));
        nextChange = x + 1 + Math.floor(rand()*3); // blocks 1-3 cols wide
      }
      // Hold at target (blocky: flat top between changes)
      v = target;
      vals[x] = Math.floor(v*STEPS + 0.5)/STEPS;
    }
    var mn=vals[0],mx=vals[0];
    for(var x3=1;x3<s;x3++){ if(vals[x3]<mn)mn=vals[x3]; if(vals[x3]>mx)mx=vals[x3]; }
    var rng=mx-mn||1;

    var cv=document.createElement('canvas'); cv.width=s; cv.height=1;
    var cx=cv.getContext('2d');
    var im=cx.createImageData(s,1), d=im.data;
    for(var x4=0;x4<s;x4++){
      var t = (vals[x4]-mn)/rng;
      var px = Math.max(0,Math.min(255, Math.floor(t*255)));
      d[x4*4]=px; d[x4*4+1]=px; d[x4*4+2]=px; d[x4*4+3]=255;
    }
    cx.putImageData(im,0,0);
    return cv;
  }
  function mkGL(cv){
    var gl = null;
    try{ gl = cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false}); }catch(e){}
    if(!gl) try{ gl = cv.getContext('experimental-webgl',{antialias:true,alpha:true,premultipliedAlpha:false}); }catch(e){}
    return gl;
  }
  function sh(gl,t,s){
    var x=gl.createShader(t); gl.shaderSource(x,s); gl.compileShader(x);
    if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){
      console.warn('shader err', gl.getShaderInfoLog(x));
      return null;
    }
    return x;
  }
  function mkPr(gl){
    var v=sh(gl,gl.VERTEX_SHADER,vs), f=sh(gl,gl.FRAGMENT_SHADER,fs);
    if(!v||!f) return null;
    var p=gl.createProgram(); gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
      console.warn('prog err', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }
  function mkQd(gl,p){
    var b=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
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

  /* ---------- overlay ---------- */
  var ov, cv, gl, prg, jTex;
  function ensure(){
    if(ov) return;
    ov = document.createElement('div');
    ov.id = 'wgl-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;opacity:0;';
    cv = document.createElement('canvas');
    cv.style.cssText = 'width:100%;height:100%;display:block;';
    ov.appendChild(cv);
    document.body.appendChild(ov);
    gl = mkGL(cv);
    prg = null;
    if(gl){
      prg = mkPr(gl);
      if(prg){
        gl.useProgram(prg);
        mkQd(gl,prg);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        jTex = gl.createTexture();
        upT(gl, jTex, mkJit());
      }
    }
    resize();
  }
  function resize(){
    if(!cv) return;
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    cv.width  = Math.floor(innerWidth*dpr);
    cv.height = Math.floor(innerHeight*dpr);
  }

  /* ---------- easing ---------- */
  // Quadratic ease-in-out — gentler acceleration than cubic for a silkier feel.
  function ease(t){
    return t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
  }

  /* ---------- animate ---------- */
  var busy=false, raf=0, covered=false;
  function animate(dur, fromP, toP, onCover, onDone){
    if(!gl || !prg){
      ov.style.background=VEIL;
      ov.style.transition='opacity '+dur+'ms';
      ov.style.opacity = (toP>fromP)?'1':'0';
      ov.style.pointerEvents = (toP>0.5)?'auto':'none';
      if(toP>fromP) document.body.style.overflow='hidden';
      setTimeout(function(){
        if(toP>=1 && onCover){ onCover(); return; }
        if(toP<=0){ ov.style.pointerEvents='none'; document.body.style.overflow=''; onDone&&onDone(); }
      }, dur);
      return;
    }
    resize();
    ov.style.opacity='1';
    ov.style.background='transparent';
    ov.style.pointerEvents='auto';
    document.body.style.overflow='hidden';
    covered=false;
    var t0=performance.now();
    var uP=gl.getUniformLocation(prg,'uProgress');
    var uT=gl.getUniformLocation(prg,'uTime');
    var uD=gl.getUniformLocation(prg,'uJitter');
    gl.useProgram(prg);
    mkQd(gl,prg);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, jTex);
    gl.uniform1i(uD,0);

    function frame(now){
      var el=now-t0, t=Math.min(1,el/dur);
      var e = ease(t);
      // p goes from fromP to toP. For cover: 0 -> (1+STAGGER) so the last
      // (rightmost) column clears the bottom edge by the end. For reveal we
      // come back from (1+STAGGER) -> 0.
      var span = 1.0 + STAGGER;
      var p = fromP + (toP-fromP)*e;

      gl.viewport(0,0,cv.width,cv.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uP, p);
      gl.uniform1f(uT, el*0.001);
      gl.drawArrays(gl.TRIANGLES,0,6);

      if(toP>fromP && t>=1 && !covered){
        covered=true;
        ov.style.background=VEIL;
        setTimeout(function(){ onCover && onCover(); }, 50);
      }

      if(t<1){
        raf=requestAnimationFrame(frame);
      } else {
        if(toP<=0){
          ov.style.opacity='0';
          ov.style.background='transparent';
          ov.style.pointerEvents='none';
          document.body.style.overflow='';
          onDone && onDone();
        }
      }
    }
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(frame);
  }

  /* ---------- link interception ---------- */
  function local(a){
    if(!a.href) return false;
    if(a.target && a.target!=='' && a.target!=='_self') return false;
    if(a.hasAttribute('download')||a.getAttribute('data-notransition')!==null) return false;
    var u; try{u=new URL(a.href);}catch(e){return false;}
    if(u.origin!==location.origin) return false;
    if(u.protocol==='mailto:'||u.protocol==='tel:') return false;
    if(u.pathname===location.pathname&&u.search===location.search&&u.hash) return false;
    var ext=(u.pathname.split('.').pop()||'').toLowerCase();
    var skip=['jpg','jpeg','png','webp','gif','svg','mp4','webm','mp3','wav','pdf','zip','css','js','woff','woff2','ttf','ico','xml','txt','map','json'];
    return skip.indexOf(ext)===-1;
  }

  function goTo(url){
    if(busy) return;
    busy=true;
    ensure();
    try{ sessionStorage.setItem('__wgl_a','1'); }catch(e){}
    // Cover: sweep down, p -0.1 -> 1+STAGGER so full coverage, slower for smoothness
    animate(1100, -0.1, 1.0+STAGGER, function(){
      window.location.href = url;
    });
  }

  /* ---------- entry reveal ---------- */
  function entry(){
    if(!arriving) return;
    try{ sessionStorage.removeItem('__wgl_a'); }catch(e){}

    ensure();
    resize();
    ov.style.opacity='1';
    ov.style.background=VEIL;
    ov.style.pointerEvents='auto';
    document.body.style.overflow='hidden';
    var v = document.getElementById('wgl-veil');
    if(v) v.remove();

    if(gl && prg){
      gl.useProgram(prg);
      mkQd(gl,prg);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      if(!jTex){jTex=gl.createTexture();upT(gl,jTex,mkJit());}
      gl.viewport(0,0,cv.width,cv.height);
      gl.clearColor(VEIL_RGB[0],VEIL_RGB[1],VEIL_RGB[2],1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      var uP=gl.getUniformLocation(prg,'uProgress');
      var uT=gl.getUniformLocation(prg,'uTime');
      var uD=gl.getUniformLocation(prg,'uJitter');
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,jTex);gl.uniform1i(uD,0);
      gl.uniform1f(uP,1.0+STAGGER);gl.uniform1f(uT,0);
      gl.drawArrays(gl.TRIANGLES,0,6);

      function reveal(){
        animate(1100, 1.0+STAGGER, -0.1, null, function(){ busy=false; });
      }
      requestAnimationFrame(function(){ requestAnimationFrame(reveal); });
    } else {
      ov.style.background=VEIL;
      ov.style.transform='translateY(0)';
      ov.style.transition='transform .9s cubic-bezier(.77,0,.175,1)';
      requestAnimationFrame(function(){
        ov.style.transform='translateY(-100%)';
        setTimeout(function(){ov.remove();document.body.style.overflow='';busy=false;},950);
      });
    }
  }

  function init(){
    document.addEventListener('click', function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0) return;
      var a = e.target.closest('a');
      if(!a || !local(a)) return;
      e.preventDefault();
      goTo(a.href);
    }, false);
    window.addEventListener('resize', resize);
    if(document.readyState==='complete'){ setTimeout(entry,0); }
    else{ window.addEventListener('load', function(){ setTimeout(entry,0); }); }
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); }
  else{ init(); }
})();
