/* ========================================================================
 * WHY GGG — WebGL page transition
 * Curtain/distortion wipe inspired by mariavasilyeva.com
 * Single-file, no dependencies. Works cross-page on same origin.
 * ======================================================================== */
(function(){
  'use strict';

  var supportsWebGL = (function(){
    try{
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    }catch(e){ return false; }
  })();
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(!supportsWebGL || reducedMotion) return;

  // -------- Shaders --------------------------------------------------------
  var vs = [
    'precision highp float;',
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){',
    '  vUv = vec2(aPos.x, 1.0 - aPos.y);',
    '  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var fs = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uDisp;',
    'uniform float uProgress;',   // 0 -> 1 (one-way: current page -> curtain covers -> reveal next)
    'uniform float uPhase;',      // 0 = outgoing wipe up, 1 = incoming wipe down
    'uniform float uTime;',
    'uniform float uAspect;',
    'uniform vec2 uResolution;',
    '',
    '// Simple random / noise',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
    'float noise(vec2 p){',
    '  vec2 i=floor(p); vec2 f=fract(p);',
    '  float a=hash(i); float b=hash(i+vec2(1.,0.));',
    '  float c=hash(i+vec2(0.,1.)); float d=hash(i+vec2(1.,1.));',
    '  vec2 u=f*f*(3.-2.*f);',
    '  return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;',
    '}',
    '',
    'void main(){',
    '  vec2 uv = vUv;',
    '  vec2 center = uv - 0.5;',
    '  center.x *= uAspect;',
    '  float dist = length(center);',
    '',
    '  vec4 disp = texture2D(uDisp, uv);',
    '  float d = (disp.r - 0.5) * 2.0;',
    '',
    '  // Two phases:',
    '  // Phase A (uPhase=0, progress 0→1): WIPE IN the black curtain from bottom (covers page)',
    '  // Phase B (uPhase=1, progress 1→0): WIPE OUT the black curtain to top (reveals new page)',
    '  float p = uProgress;',
    '',
    '  // Curtain edge position: -0.2 (off bottom) → 1.2 (off top) in phase 0',
    '  float edgePos;',
    '  if(uPhase < 0.5){',
    '    edgePos = mix(-0.3, 1.3, p);',
    '  } else {',
    '    edgePos = mix(1.3, -0.3, 1.0 - p);',
    '  }',
    '',
    '  // Distorted edge using displacement + wave',
    '  float wave = sin(uv.x * 20.0 + uTime * 2.0) * 0.04 * sin(p * 3.14159);',
    '  float edgeDist = uv.y - edgePos + d * 0.12 * sin(p * 3.14159) + wave;',
    '',
    '  // Vignette/darkening at curtain',
    '  float curtain = smoothstep(0.02, -0.08, edgeDist);',
    '',
    '  // When curtain covers fully, show solid #060607 with subtle grain/shimmer',
    '  vec3 bg = vec3(0.024, 0.024, 0.027);',
    '  float shimmer = noise(uv * 80.0 + uTime * 8.0) * 0.02 * sin(p * 3.14159);',
    '  bg += shimmer;',
    '',
    '  // Edge highlight (thin white-ish line at wipe boundary)',
    '  float edgeLight = smoothstep(0.03, 0.0, abs(edgeDist)) * sin(p * 3.14159);',
    '  bg += edgeLight * vec3(0.9, 0.9, 0.92) * 0.35;',
    '',
    '  // Edge chromatic aberration smear',
    '  float smear = smoothstep(0.06, 0.0, abs(edgeDist)) * smoothstep(0.0, -0.1, edgeDist) * sin(p*3.14159);',
    '  bg += smear * vec3(0.02, 0.01, 0.03);',
    '',
    '  // Output: curtain alpha over page (we just draw dark color, page underneath is not in shader)',
    '  // We rely on canvas being opaque black covering the viewport; curtain controls visibility.',
    '  // We'll paint full bg color when curtain=1, transparent when curtain=0.',
    '  float alpha = curtain;',
    '  gl_FragColor = vec4(bg, alpha);',
    '}'
  ].join('\n');

  // -------- Displacement texture (procedural) -----------------------------
  function makeDispTexture(){
    var size = 512;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(size, size);
    var d = img.data;
    for(var y=0;y<size;y++){
      for(var x=0;x<size;x++){
        var i=(y*size+x)*4;
        var n = 0, amp = 0.5, freq = 1/64;
        for(var o=0;o<5;o++){
          n += (Math.sin(x*freq*1.3 + o*3.1 + y*freq*0.7) *
                Math.cos(y*freq*0.9 + o*4.3 + x*freq*1.1) * 0.5 + 0.5) * amp;
          amp *= 0.5;
          freq *= 2.1;
        }
        n = n / (1 - Math.pow(0.5,5));
        var v = Math.floor(n*255);
        // Add some directional bias
        var bias = Math.sin((x/size) * Math.PI) * 20;
        v = Math.max(0, Math.min(255, v + bias));
        d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
    return c;
  }

  // -------- GL helpers -----------------------------------------------------
  function createGL(canvas){
    var gl = canvas.getContext('webgl', {antialias:false, alpha:true, premultipliedAlpha:false});
    if(!gl) gl = canvas.getContext('experimental-webgl', {antialias:false, alpha:true});
    return gl;
  }
  function compileShader(gl, type, src){
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
      console.warn('shader err', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }
  function createProgram(gl){
    var v = compileShader(gl, gl.VERTEX_SHADER, vs);
    var f = compileShader(gl, gl.FRAGMENT_SHADER, fs);
    if(!v||!f) return null;
    var p = gl.createProgram();
    gl.attachShader(p,v); gl.attachShader(p,f);
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)){
      console.warn('program err', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }
  function makeQuad(gl, program){
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    return buf;
  }
  function makeTex(gl, src){
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if(src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    return t;
  }

  // -------- Overlay setup --------------------------------------------------
  function makeOverlay(){
    var ov = document.createElement('div');
    ov.id = 'wgl-transition';
    ov.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'pointer-events:none',
      'opacity:0','background:transparent',
      'will-change:opacity'
    ].join(';')+';';
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    ov.appendChild(canvas);
    document.body.appendChild(ov);
    return {ov:ov, canvas:canvas};
  }

  var animating = false;
  var PHASE_A_DUR = 650;   // wipe in curtain (covers current page)
  var PHASE_B_DUR = 700;   // wipe out curtain (reveals next page)
  var NAV_DELAY = 100;     // delay after curtain fully covers before navigating

  function go(href){
    if(animating) return;
    animating = true;

    // Mark arriving for next page
    try{ sessionStorage.setItem('__wgl_arriving','1'); }catch(e){}

    var out = makeOverlay();
    var ov = out.ov, canvas = out.canvas;
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    function resize(){
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    }
    resize();

    var gl = createGL(canvas);
    if(!gl){ window.location.href = href; return; }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var program = createProgram(gl);
    if(!program){ window.location.href = href; return; }
    gl.useProgram(program);
    makeQuad(gl, program);

    var dispCanvas = makeDispTexture();
    var dispTex = makeTex(gl, dispCanvas);

    var uDisp = gl.getUniformLocation(program, 'uDisp');
    var uProg = gl.getUniformLocation(program, 'uProgress');
    var uPhase = gl.getUniformLocation(program, 'uPhase');
    var uTime = gl.getUniformLocation(program, 'uTime');
    var uAspect = gl.getUniformLocation(program, 'uAspect');
    var uRes = gl.getUniformLocation(program, 'uResolution');

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dispTex);
    gl.uniform1i(uDisp, 0);

    // Freeze scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    ov.style.opacity = '1';
    ov.style.pointerEvents = 'auto';

    var t0 = performance.now();
    var navigated = false;

    function render(now){
      var elapsed = now - t0;
      var phase, progress;

      if(elapsed < PHASE_A_DUR){
        phase = 0;
        progress = Math.min(1, elapsed / PHASE_A_DUR);
        // ease-in cubic
        progress = progress * progress * progress;
      } else if(elapsed < PHASE_A_DUR + NAV_DELAY){
        phase = 0;
        progress = 1;
        if(!navigated){
          navigated = true;
          // Navigate — curtain stays covering, new page will run its own entry
          window.location.href = href;
        }
      } else {
        // If we somehow end up here (navigation cancelled), stay covered
        phase = 0;
        progress = 1;
      }

      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uProg, progress);
      gl.uniform1f(uPhase, phase);
      gl.uniform1f(uTime, elapsed*0.001);
      gl.uniform1f(uAspect, canvas.width/canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Safety: keep rendering up to PHASE_A_DUR + NAV_DELAY + small buffer
      if(elapsed < PHASE_A_DUR + NAV_DELAY + 200){
        requestAnimationFrame(render);
      }
    }
    requestAnimationFrame(render);

    // Fallback if navigation hangs
    setTimeout(function(){
      if(!navigated){
        window.location.href = href;
      }
    }, 3000);
  }

  // -------- Entry animation (on arriving page) -----------------------------
  function entry(){
    var arriving = false;
    try{ arriving = sessionStorage.getItem('__wgl_arriving') === '1'; }catch(e){}
    if(!arriving) return;
    try{ sessionStorage.removeItem('__wgl_arriving'); }catch(e){}

    // Build entry overlay: black full-screen that wipes UP to reveal
    var ov = document.createElement('div');
    ov.id = 'wgl-entry';
    ov.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'pointer-events:none',
      'background:transparent',
      'will-change:transform'
    ].join(';')+';';

    // Use WebGL canvas for the outgoing wipe (reverse of go())
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    ov.appendChild(canvas);
    document.body.appendChild(ov);

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    var dpr = Math.min(window.devicePixelRatio||1,2);
    canvas.width = window.innerWidth*dpr;
    canvas.height = window.innerHeight*dpr;

    var gl = createGL(canvas);
    if(!gl){
      // fallback simple CSS wipe
      ov.style.background = '#060607';
      ov.style.transform = 'translateY(0)';
      ov.style.transition = 'transform 0.7s cubic-bezier(0.77,0,0.175,1)';
      requestAnimationFrame(function(){
        ov.style.transform = 'translateY(-100%)';
        setTimeout(function(){ ov.remove(); document.body.style.overflow=''; }, 750);
      });
      return;
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var program = createProgram(gl);
    if(!program){ ov.remove(); document.body.style.overflow=''; return; }
    gl.useProgram(program);
    makeQuad(gl, program);
    var dispTex = makeTex(gl, makeDispTexture());
    var uDisp = gl.getUniformLocation(program, 'uDisp');
    var uProg = gl.getUniformLocation(program, 'uProgress');
    var uPhase = gl.getUniformLocation(program, 'uPhase');
    var uTime = gl.getUniformLocation(program, 'uTime');
    var uAspect = gl.getUniformLocation(program, 'uAspect');
    var uRes = gl.getUniformLocation(program, 'uResolution');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dispTex);
    gl.uniform1i(uDisp, 0);

    var t0 = performance.now();
    var DUR = PHASE_B_DUR;

    function render(now){
      var elapsed = now - t0;
      var p = Math.min(1, elapsed/DUR);
      // Phase 1 = incoming (wipe out curtain, progress 1 -> 0)
      // Here we want: start fully covered (prog=1), end fully revealed (prog=0)
      var progress = 1 - p;
      // ease out
      progress = 1 - (p*p*p);

      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uProg, progress);
      gl.uniform1f(uPhase, 1.0);
      gl.uniform1f(uTime, elapsed*0.001);
      gl.uniform1f(uAspect, canvas.width/canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if(p < 1){
        requestAnimationFrame(render);
      } else {
        ov.style.transition = 'opacity 0.2s';
        ov.style.opacity = '0';
        setTimeout(function(){
          ov.remove();
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }, 220);
      }
    }
    requestAnimationFrame(render);
  }

  // -------- Intercept local links -----------------------------------------
  function isLocalLink(a){
    if(!a.href) return false;
    if(a.target && a.target !== '' && a.target !== '_self') return false;
    if(a.hasAttribute('download')) return false;
    var url;
    try{ url = new URL(a.href); }catch(e){ return false; }
    if(url.origin !== location.origin) return false;
    if(url.protocol === 'mailto:' || url.protocol === 'tel:') return false;
    // Skip hash-only links on same page
    if(url.pathname === location.pathname && url.hash) return false;
    var ext = (url.pathname.split('.').pop()||'').toLowerCase();
    var skipExts = ['jpg','jpeg','png','webp','gif','svg','mp4','webm','mp3','wav','pdf','zip','css','js','woff','woff2','ttf','ico','xml','txt','map','json'];
    if(skipExts.indexOf(ext) !== -1) return false;
    return true;
  }

  function init(){
    document.addEventListener('click', function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0) return;
      var a = e.target.closest('a');
      if(!a) return;
      if(!isLocalLink(a)) return;
      e.preventDefault();
      go(a.href);
    }, false);

    // Run entry animation on load
    if(document.readyState === 'complete'){
      entry();
    } else {
      window.addEventListener('load', entry);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
