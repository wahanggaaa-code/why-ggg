/* ========================================================================
 * WHY GGG — WebGL page transition
 * Displacement curtain wipe (horizontal band with wavy/noisy edge travels
 * across the screen covering the page, then reverse on entry).
 * Inspired by the distortion-curtain style of mariavasilyeva.com.
 *
 * Pure vanilla WebGL, no dependencies, no page screenshots (no tainted
 * canvas issues). Works via: click -> shader wipes curtain over page ->
 * navigate -> new page loads behind entry veil -> shader wipes curtain
 * away to reveal new page.
 * ======================================================================== */
(function(){
  'use strict';

  var cv0 = document.createElement('canvas');
  var hasGL = false;
  try{ hasGL = !!(cv0.getContext('webgl')||cv0.getContext('experimental-webgl')); }catch(e){}
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var arriving = false;
  try{ arriving = sessionStorage.getItem('__wgl_a')==='1'; }catch(e){}
  if(arriving && hasGL && !reduced){
    var vs0 = document.createElement('style');
    vs0.id = 'wgl-veil';
    vs0.textContent = 'html{background:#060607!important;}body::before{content:"";position:fixed;inset:0;z-index:99999;background:#060607;pointer-events:none;}';
    document.head.appendChild(vs0);
  }

  if(!hasGL || reduced){
    try{ sessionStorage.removeItem('__wgl_a'); }catch(e){}
    return;
  }

  /* ---------- shaders ---------- */
  var vs = [
    'precision highp float;',
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos; gl_Position = vec4(aPos*2.0-1.0, 0.0, 1.0); }'
  ].join('');

  var fs = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uDisp;',
    'uniform float uProgress;',
    'uniform float uTime;',
    'uniform vec2  uResolution;',
    '',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int j=0;j<5;j++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}',
    '',
    'void main(){',
    '  vec2 uv = vUv;',
    '  float p = uProgress;',
    '',
    '  // NOTE: vUv is (0,0) bottom-left, (1,1) top-right.',
    '  // Edge Y moves from -0.15 (off bottom, nothing covered) up to 1.15 (off top, fully covered).',
    '  float edgeY = mix(-0.15, 1.15, p);',
    '',
    '  vec4 d = texture2D(uDisp, uv*3.0 + vec2(uTime*0.4, 0.0));',
    '  float wave = sin(uv.x*12.0 + uTime*2.0) * 0.018 * sin(p*3.14159);',
    '  wave += (d.r - 0.5) * 0.08 * sin(p*3.14159);',
    '  wave += (fbm(vec2(uv.x*4.0+uTime*0.8, uv.y*2.0)) - 0.5) * 0.06 * sin(p*3.14159);',
    '',
    '  float edge = uv.y - edgeY + wave;',
    '',
    '  // uv.y < edgeY -> curtain (pixel below edge = covered by ink)',
    '  float curtain = 1.0 - smoothstep(-0.03, 0.02, edge);',
    '',
    '  float line = smoothstep(0.035, 0.0, abs(edge)) * sin(p*3.14159);',
    '  vec3 lineCol = mix(vec3(0.7,0.6,0.9), vec3(0.95,0.95,1.0), smoothstep(0.3,0.7,p)) * line * 0.7;',
    '',
    '  float fringe = smoothstep(0.06, 0.0, abs(edge)) * sin(p*3.14159);',
    '',
    '  float g = fbm(uv*200.0 + uTime*5.0) - 0.5;',
    '  vec3 bg = vec3(0.024,0.024,0.027);',
    '  bg *= 1.0 + g*0.1;',
    '  bg += fringe*vec3(0.03,-0.01,0.05)*0.4;',
    '  bg += lineCol;',
    '',
    '  float alpha = curtain;',
    '',
    '  gl_FragColor = vec4(bg, alpha);',
    '}'
  ].join('');

  /* ---------- helpers ---------- */
  function mkDisp(){
    var s=256,cv=document.createElement('canvas');cv.width=cv.height=s;
    var cx=cv.getContext('2d'),im=cx.createImageData(s,s),d=im.data;
    for(var y=0;y<s;y++)for(var x=0;x<s;x++){
      var i=(y*s+x)*4,nr=0,ng=0,a=.5,f=1/32;
      for(var o=0;o<5;o++){
        nr+=(Math.sin(x*f+y*f*.5+o*1.7)*Math.cos(y*f*1.3-x*f*.4+o*2.3)*.5+.5)*a;
        ng+=(Math.sin(x*f*.8-y*f*.6+o*3.1)*Math.cos(y*f*.9+x*f*.3+o*.9)*.5+.5)*a;
        a*=.5; f*=2.05;
      }
      var k=1-Math.pow(.5,5);
      d[i]   = Math.max(0,Math.min(255,(nr/k)*255));
      d[i+1] = Math.max(0,Math.min(255,(ng/k)*255));
      d[i+2] = 128; d[i+3] = 255;
    }
    cx.putImageData(im,0,0); return cv;
  }
  function mkGL(cv){var gl=cv.getContext('webgl',{antialias:false,alpha:true,premultipliedAlpha:false});if(!gl)gl=cv.getContext('experimental-webgl',{antialias:false,alpha:true,premultipliedAlpha:false});return gl;}
  function sh(gl,t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){console.warn('shader err',gl.getShaderInfoLog(x));return null;}return x;}
  function mkPr(gl){var v=sh(gl,gl.VERTEX_SHADER,vs),f=sh(gl,gl.FRAGMENT_SHADER,fs);if(!v||!f)return null;var p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.warn('prog err',gl.getProgramInfoLog(p));return null;}return p;}
  function mkQd(gl,p){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);var l=gl.getAttribLocation(p,'aPos');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);}
  function upT(gl,t,s){gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,s);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);}

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
  }
  function resize(){
    if(!cv) return;
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    cv.width  = Math.floor(innerWidth*dpr);
    cv.height = Math.floor(innerHeight*dpr);
  }

  /* ---------- animate ---------- */
  var busy=false, raf=0, covered=false;
  function animate(dur, fromP, toP, onCover, onDone){
    if(!gl || !prg){
      ov.style.background='#060607';
      ov.style.transition='opacity '+dur+'ms';
      ov.style.opacity = (toP>fromP)?'1':'0';
      ov.style.pointerEvents = (toP>0.5)?'auto':'none';
      if(toP>fromP) document.body.style.overflow='hidden';
      setTimeout(function(){
        if(toP>=1 && onCover){ onCover(); return; }
        if(toP<=0){ document.body.style.overflow=''; onDone&&onDone(); }
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
    var uR=gl.getUniformLocation(prg,'uResolution');
    var uD=gl.getUniformLocation(prg,'uDisp');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dTex);
    gl.uniform1i(uD,0);

    function frame(now){
      var el=now-t0, t=Math.min(1,el/dur);
      var e = t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
      var p = fromP + (toP-fromP)*e;

      gl.viewport(0,0,cv.width,cv.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uP, p);
      gl.uniform1f(uT, el*0.001);
      gl.uniform2f(uR, cv.width, cv.height);
      gl.drawArrays(gl.TRIANGLES,0,6);

      if(toP>fromP && p>=0.98 && !covered){
        covered=true;
        ov.style.background='#060607';
        onCover && onCover();
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
    animate(700, 0, 1, function(){ window.location.href = url; });
    setTimeout(function(){ window.location.href=url; }, 3000);
  }

  /* ---------- entry reveal ---------- */
  function entry(){
    if(!arriving) return;
    try{ sessionStorage.removeItem('__wgl_a'); }catch(e){}

    ensure();
    resize();
    ov.style.opacity='1';
    ov.style.background='#060607';
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
      gl.clearColor(0.024,0.024,0.027,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      var uP=gl.getUniformLocation(prg,'uProgress');
      var uT=gl.getUniformLocation(prg,'uTime');
      var uR=gl.getUniformLocation(prg,'uResolution');
      var uD=gl.getUniformLocation(prg,'uDisp');
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,dTex);gl.uniform1i(uD,0);
      gl.uniform1f(uP,1);gl.uniform1f(uT,0);gl.uniform2f(uR,cv.width,cv.height);
      gl.drawArrays(gl.TRIANGLES,0,6);

      function reveal(){ animate(750, 1, 0, null, function(){ busy=false; }); }
      requestAnimationFrame(function(){ requestAnimationFrame(reveal); });
    } else {
      ov.style.background='#060607';
      ov.style.transform='translateY(0)';
      ov.style.transition='transform .7s cubic-bezier(.77,0,.175,1)';
      requestAnimationFrame(function(){
        ov.style.transform='translateY(-100%)';
        setTimeout(function(){ov.remove();document.body.style.overflow='';busy=false;},750);
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
    window.addEventListener('resize', function(){ resize(); });
    if(document.readyState==='complete'){ setTimeout(entry,0); }
    else{ window.addEventListener('load', function(){ setTimeout(entry,0); }); }
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); }
  else{ init(); }
})();
