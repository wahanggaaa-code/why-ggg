/* ========================================================================
 * WHY GGG — WebGL page transition
 * Stepped/staircase horizontal blinds wipe (multiple strips, like stairs)
 * with soft off-white color and wavy/noisy edges.
 *
 * Pure vanilla WebGL, no dependencies, no page screenshots.
 * Flow: click -> staggered white strips sweep down covering page ->
 * navigate -> new page loads -> strips sweep up in reverse to reveal.
 * ======================================================================== */
(function(){
  'use strict';

  var cv0 = document.createElement('canvas');
  var hasGL = false;
  try{ hasGL = !!(cv0.getContext('webgl')||cv0.getContext('experimental-webgl')); }catch(e){}
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pre-paint veil on entry so there's zero flash
  var arriving = false;
  try{ arriving = sessionStorage.getItem('__wgl_a')==='1'; }catch(e){}
  if(arriving && hasGL && !reduced){
    var vs0 = document.createElement('style');
    vs0.id = 'wgl-veil';
    vs0.textContent = 'html{background:#ebeaee!important;}body::before{content:"";position:fixed;inset:0;z-index:99999;background:#ebeaee;pointer-events:none;}';
    document.head.appendChild(vs0);
  }

  if(!hasGL || reduced){
    try{ sessionStorage.removeItem('__wgl_a'); }catch(e){}
    return;
  }

  /* ---------- shaders ---------- */
  var N_STRIPS = 10.0;
  var STAGGER = 0.55;

  var vs = [
    'precision highp float;',
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos; gl_Position = vec4(aPos*2.0-1.0, 0.0, 1.0); }'
  ].join('\n');

  var fs =
    '#define N_STRIPS ' + N_STRIPS.toFixed(1) + '\n' +
    '#define STAGGER ' + STAGGER.toFixed(2) + '\n' +
    'precision highp float;\n' +
    'varying vec2 vUv;\n' +
    'uniform sampler2D uDisp;\n' +
    'uniform float uProgress;\n' +
    'uniform float uDirection;\n' +
    'uniform float uTime;\n' +
    '\n' +
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n' +
    'float noise(vec2 p){\n' +
    '  vec2 i=floor(p), f=fract(p);\n' +
    '  f = f*f*(3.0-2.0*f);\n' +
    '  float a=hash(i);\n' +
    '  float b=hash(i+vec2(1.0,0.0));\n' +
    '  float c=hash(i+vec2(0.0,1.0));\n' +
    '  float dd=hash(i+vec2(1.0,1.0));\n' +
    '  return mix(mix(a,b,f.x), mix(c,dd,f.x), f.y);\n' +
    '}\n' +
    'float fbm(vec2 p){\n' +
    '  float v=0.0;\n' +
    '  float a=0.5;\n' +
    '  v+=a*noise(p); p*=2.03; a*=0.5;\n' +
    '  v+=a*noise(p); p*=2.03; a*=0.5;\n' +
    '  v+=a*noise(p); p*=2.03; a*=0.5;\n' +
    '  v+=a*noise(p); p*=2.03; a*=0.5;\n' +
    '  v+=a*noise(p);\n' +
    '  return v*(1.0/0.96875);\n' +
    '}\n' +
    '\n' +
    'void main(){\n' +
    '  vec2 uv = vUv;\n' +
    '  float p = uProgress;\n' +
    '\n' +
    '  // stripId 0 = bottom, stripId (N_STRIPS-1) = top.\n' +
    '  float stripId = floor(clamp(uv.y, 0.0, 0.9999) * N_STRIPS);\n' +
    '  float stripUv = fract(uv.y * N_STRIPS);\n' +
    '\n' +
    '  // Forward progress: 0 -> 1 means strips sweep down (covering).\n' +
    '  // During reveal we feed uProgress from 1 -> 0, which naturally reverses.\n' +
    '  // Top strips lead (lower stagger value) when coming down, so stagger is\n' +
    '  // proportional to how far down the strip is.\n' +
    '  float s_top0 = ((N_STRIPS - 1.0) - stripId) / (N_STRIPS - 1.0) * STAGGER;\n' +
    '  float localP = clamp((p - s_top0) / (1.0 - STAGGER + 0.001), 0.0, 1.0);\n' +
    '\n' +
    '  localP = smoothstep(0.0, 1.0, localP);\n' +
    '\n' +
    '  // Edge Y within strip: 0 at top of strip, 1 at bottom.\n' +
    '  float edgeY = mix(-0.15, 1.15, localP);\n' +
    '\n' +
    '  vec4 d = texture2D(uDisp, vec2(uv.x*1.0 + uTime*0.3, stripId*0.2));\n' +
    '  float mid = 1.0 - pow(2.0*localP - 1.0, 2.0);\n' +
    '  float wave = sin(uv.x*8.0 + uTime*3.0 + stripId*1.3) * 0.04 * mid;\n' +
    '  wave += (d.r - 0.5) * 0.10 * mid;\n' +
    '  wave += (fbm(vec2(uv.x*3.0 + uTime*0.5, stripId*0.3 + uTime*0.2)) - 0.5) * 0.06 * mid;\n' +
    '\n' +
    '  float edge = stripUv - edgeY + wave;\n' +
    '  // covered = 1 where above the edge (already swept), 0 below.\n' +
    '  float covered = smoothstep(0.015, -0.02, edge);\n' +
    '\n' +
    '  vec3 col = vec3(0.922, 0.918, 0.933);\n' +
    '  float g = fbm(uv*150.0 + uTime*2.0) - 0.5;\n' +
    '  col *= 1.0 + g*0.02;\n' +
    '\n' +
    '  float hair = smoothstep(0.02, 0.0, abs(edge)) * mid;\n' +
    '  col -= hair * vec3(0.07, 0.07, 0.09);\n' +
    '\n' +
    '  gl_FragColor = vec4(col, covered);\n' +
    '}\n';

  /* ---------- helpers ---------- */
  function mkDisp(){
    var s=256,cv=document.createElement('canvas');cv.width=cv.height=s;
    var cx=cv.getContext('2d'),im=cx.createImageData(s,s),d=im.data;
    for(var y=0;y<s;y++)for(var x=0;x<s;x++){
      var i=(y*s+x)*4,nr=0,ng=0,a=.5,f=1/40;
      for(var o=0;o<5;o++){
        nr+=(Math.sin(x*f+y*f*.4+o*1.9)*Math.cos(y*f*1.2-x*f*.3+o*2.1)*.5+.5)*a;
        ng+=(Math.sin(x*f*.7-y*f*.5+o*3.2)*Math.cos(y*f*.8+x*f*.4+o*.8)*.5+.5)*a;
        a*=.5; f*=2.07;
      }
      var k=1-Math.pow(.5,5);
      d[i]   = Math.max(0,Math.min(255,(nr/k)*255));
      d[i+1] = Math.max(0,Math.min(255,(ng/k)*255));
      d[i+2] = 128; d[i+3] = 255;
    }
    cx.putImageData(im,0,0); return cv;
  }
  function mkGL(cv){
    var gl = null;
    try{ gl = cv.getContext('webgl',{antialias:false,alpha:true,premultipliedAlpha:false}); }catch(e){}
    if(!gl) try{ gl = cv.getContext('experimental-webgl',{antialias:false,alpha:true,premultipliedAlpha:false}); }catch(e){}
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
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  }

  /* ---------- overlay ---------- */
  var ov, cv, gl, prg, dTex;
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
        dTex = gl.createTexture();
        upT(gl, dTex, mkDisp());
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

  /* ---------- animate ---------- */
  var busy=false, raf=0, covered=false;
  function animate(dur, fromP, toP, dir, onCover, onDone){
    if(!gl || !prg){
      // Fallback: solid veil
      ov.style.background='#ebeaee';
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
    var uDir=gl.getUniformLocation(prg,'uDirection');
    var uT=gl.getUniformLocation(prg,'uTime');
    var uR=gl.getUniformLocation(prg,'uResolution');
    var uD=gl.getUniformLocation(prg,'uDisp');
    gl.useProgram(prg);
    mkQd(gl,prg);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dTex);
    gl.uniform1i(uD,0);
    gl.uniform1f(uDir, dir);

    function frame(now){
      var el=now-t0, t=Math.min(1,el/dur);
      // Cubic ease-in-out
      var e = t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
      var p = fromP + (toP-fromP)*e;

      gl.viewport(0,0,cv.width,cv.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uP, p);
      gl.uniform1f(uT, el*0.001);
      gl.uniform2f(uR, cv.width, cv.height);
      gl.drawArrays(gl.TRIANGLES,0,6);

      if(dir<0 && t>=1 && !covered){
        covered=true;
        ov.style.background='#ebeaee';
        // Small hold at fully-covered state so white is seen before navigation
        setTimeout(function(){ onCover && onCover(); }, 60);
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
    // Cover: direction -1 (strips sweep down)
    animate(750, 0, 1, -1, function(){
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
    ov.style.background='#ebeaee';
    ov.style.pointerEvents='auto';
    document.body.style.overflow='hidden';
    var v = document.getElementById('wgl-veil');
    if(v) v.remove();

    if(gl && prg){
      gl.useProgram(prg);
      mkQd(gl,prg);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      if(!dTex){dTex=gl.createTexture();upT(gl,dTex,mkDisp());}
      gl.viewport(0,0,cv.width,cv.height);
      gl.clearColor(0.922,0.918,0.933,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      var uP=gl.getUniformLocation(prg,'uProgress');
      var uDir=gl.getUniformLocation(prg,'uDirection');
      var uT=gl.getUniformLocation(prg,'uTime');
      var uR=gl.getUniformLocation(prg,'uResolution');
      var uD=gl.getUniformLocation(prg,'uDisp');
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,dTex);gl.uniform1i(uD,0);
      gl.uniform1f(uDir,-1);
      gl.uniform1f(uP,1);gl.uniform1f(uT,0);
      gl.uniform2f(uR,cv.width,cv.height);
      gl.drawArrays(gl.TRIANGLES,0,6);

      function reveal(){
        // Animate p from 1→0 with same direction=-1; progress going back up = strips
        // sweep up in reverse order (bottom strips lead), which is the mirror
        // of the cover animation.
        animate(800, 1, 0, -1, null, function(){ busy=false; });
      }
      requestAnimationFrame(function(){ requestAnimationFrame(reveal); });
    } else {
      ov.style.background='#ebeaee';
      ov.style.transform='translateY(0)';
      ov.style.transition='transform .75s cubic-bezier(.77,0,.175,1)';
      requestAnimationFrame(function(){
        ov.style.transform='translateY(-100%)';
        setTimeout(function(){ov.remove();document.body.style.overflow='';busy=false;},800);
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
