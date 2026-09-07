/* ========================================================================
 * WHY GGG — WebGL displacement page transition
 * Inspired by mariavasilyeva.com (Curtains.js-style displacement crossfade).
 * Pure vanilla JS, no external dependencies.
 *
 * How it works:
 *   1. Click local link -> show dark overlay immediately (so no freeze flash).
 *   2. Capture current viewport as "from" texture (SVG foreignObject -> canvas).
 *   3. Fetch target page, load in hidden iframe, capture viewport as "to" texture.
 *   4. Once both textures ready, run WebGL shader crossfade:
 *        UVs displaced by a procedural noise texture,
 *        "from" warps out, "to" warps in, colors mix smoothly.
 *   5. At end of shader, canvas is showing the "to" snapshot.
 *   6. Navigate for real. Browser unloads old page (canvas lingers as last
 *      frame) and loads new page — because the snapshot matches the new page
 *      the transition feels seamless.
 *
 * Respects prefers-reduced-motion. Falls back to native navigation if WebGL
 * fails or captures error.
 * ======================================================================== */
(function(){
  'use strict';

  // ----- Feature detection ------------------------------------------------
  var c = document.createElement('canvas');
  var supportsWebGL = false;
  try{ supportsWebGL = !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }catch(e){}
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!supportsWebGL || reducedMotion) return;

  // ----- Shaders ----------------------------------------------------------
  var vs = [
    'precision highp float;',
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){',
    '  vUv = vec2(aPos.x, 1.0 - aPos.y);',
    '  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Classic curtains.js displacement crossfade
  var fs = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uFrom;',
    'uniform sampler2D uTo;',
    'uniform sampler2D uDisp;',
    'uniform float uMix;',   // 0 = fully from, 1 = fully to
    'uniform float uPower;', // displacement strength
    '',
    'void main(){',
    '  vec2 uv = vUv;',
    '  vec4 d = texture2D(uDisp, uv);',
    '  float disp = d.r * 2.0 - 1.0;    // -1..1 from red',
    '  float dispY = d.g * 2.0 - 1.0;',
    '',
    '  // Displacement is strongest at middle of transition',
    '  float m = uMix;',
    '  float w = sin(m * 3.14159265); // 0->1->0 curve',
    '  float strength = uPower * w;',
    '',
    '  vec2 uvFrom = uv;',
    '  uvFrom.x += disp * strength * 0.6;',
    '  uvFrom.y += dispY * strength * 0.25;',
    '',
    '  vec2 uvTo = uv;',
    '  uvTo.x -= (1.0 - d.r) * strength * 0.6 + strength * 0.3;',
    '  uvTo.y -= (1.0 - d.g) * strength * 0.25;',
    '',
    '  vec4 cFrom = texture2D(uFrom, uvFrom);',
    '  vec4 cTo   = texture2D(uTo,   uvTo);',
    '',
    '  // Smooth mix',
    '  float e = smoothstep(0.0, 1.0, m);',
    '  vec4 col = mix(cFrom, cTo, e);',
    '',
    '  // Subtle chromatic aberration at peak',
    '  float ca = w * 0.012;',
    '  col.r = mix(col.r, texture2D(uTo, uvTo + vec2(ca,0)).r, e);',
    '  col.b = mix(col.b, texture2D(uTo, uvTo - vec2(ca,0)).b, e);',
    '',
    '  // Slight darkening at peak',
    '  col.rgb *= 1.0 - w * 0.15;',
    '',
    '  gl_FragColor = col;',
    '}'
  ].join('\n');

  // ----- Procedural displacement texture ----------------------------------
  function makeDisp(){
    var size = 512;
    var cv = document.createElement('canvas');
    cv.width = cv.height = size;
    var cx = cv.getContext('2d');
    var im = cx.createImageData(size,size);
    var d = im.data;
    for(var y=0;y<size;y++){
      for(var x=0;x<size;x++){
        var i=(y*size+x)*4;
        var nr=0,ng=0,amp=0.5,freq=1/96;
        for(var o=0;o<5;o++){
          nr += (Math.sin(x*freq+y*freq*0.3+o*2.7)*Math.cos(y*freq-x*freq*0.2+o*1.3)*0.5+0.5)*amp;
          ng += (Math.sin(x*freq*0.7-y*freq*0.6+o*4.1)*Math.cos(y*freq*1.1+x*freq*0.35+o*3.2)*0.5+0.5)*amp;
          amp*=0.5; freq*=2.05;
        }
        var k=1-Math.pow(0.5,5);
        d[i]   = Math.max(0,Math.min(255,(nr/k)*255));
        d[i+1] = Math.max(0,Math.min(255,(ng/k)*255));
        d[i+2] = 128;
        d[i+3] = 255;
      }
    }
    cx.putImageData(im,0,0);
    return cv;
  }

  // ----- GL helpers -------------------------------------------------------
  function glCtx(canvas){
    var gl = canvas.getContext('webgl',{antialias:false,preserveDrawingBuffer:true,alpha:false});
    if(!gl) gl = canvas.getContext('experimental-webgl',{antialias:false,preserveDrawingBuffer:true,alpha:false});
    return gl;
  }
  function compile(gl,t,src){
    var s=gl.createShader(t); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){return null;}
    return s;
  }
  function program(gl){
    var v=compile(gl,gl.VERTEX_SHADER,vs), f=compile(gl,gl.FRAGMENT_SHADER,fs);
    if(!v||!f) return null;
    var p=gl.createProgram(); gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) return null;
    return p;
  }
  function quad(gl,p){
    var b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
    var l=gl.getAttribLocation(p,'aPos');
    gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
  }
  function upload(gl,t,src){
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  }
  function solidCanvas(r,g,b){
    var c=document.createElement('canvas');c.width=c.height=2;
    var x=c.getContext('2d');
    x.fillStyle='rgb('+r+','+g+','+b+')';x.fillRect(0,0,2,2);
    return c;
  }

  // ----- Page -> canvas via SVG foreignObject -----------------------------
  function shootNode(node, bg, w, h, cb){
    var dpr = Math.min(window.devicePixelRatio||1,1.5);
    var cv = document.createElement('canvas');
    cv.width=Math.floor(w*dpr); cv.height=Math.floor(h*dpr);
    var cx = cv.getContext('2d');
    cx.scale(dpr,dpr);
    cx.fillStyle = bg||'#060607'; cx.fillRect(0,0,w,h);

    var clone = node.cloneNode(true);
    // Strip elements that don't serialize well / that we don't need
    clone.querySelectorAll('script,noscript,canvas,iframe').forEach(function(n){n.remove();});
    clone.querySelectorAll('video').forEach(function(v){
      var poster = v.getAttribute('poster');
      var d = document.createElement('div');
      d.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#060607;background-size:cover;background-position:center;'+(poster?'background-image:url('+poster+');':'');
      v.parentNode && v.parentNode.replaceChild(d,v);
    });
    // Overlay div created by our script won't be in clone (we haven't appended yet at shoot time)
    var body = clone.querySelector('body');
    if(body){ body.style.margin='0'; body.style.background=bg||'#060607'; }

    var html;
    try{ html = new XMLSerializer().serializeToString(clone); }catch(e){ cb(cv); return; }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:'+w+'px;height:'+h+'px;overflow:hidden;background:'+(bg||'#060607')+';">'+html+'</div></foreignObject></svg>';
    var blob,url;
    try{ blob = new Blob([svg],{type:'image/svg+xml;charset=utf-8'}); url=URL.createObjectURL(blob); }
    catch(e){ cb(cv); return; }
    var img = new Image();
    var done = false;
    function finish(){ if(done) return; done=true; URL.revokeObjectURL(url); cb(cv); }
    img.onload = function(){ try{ cx.drawImage(img,0,0,w,h); }catch(e){} finish(); };
    img.onerror = finish;
    img.src = url;
    setTimeout(finish, 2500);
  }

  function shootUrl(url, bg, cb){
    var w=window.innerWidth, h=window.innerHeight;
    fetch(url,{credentials:'same-origin'}).then(function(r){return r.text();}).then(function(html){
      var abs = new URL(url, location.href);
      var base = abs.href.substring(0, abs.href.lastIndexOf('/')+1);
      html = html.replace(/<head([^>]*)>/i,'<head$1><base href="'+base+'">');

      var fr = document.createElement('iframe');
      fr.style.cssText='position:fixed;left:-9999px;top:0;width:'+w+'px;height:'+h+'px;border:0;';
      document.body.appendChild(fr);
      var doc = fr.contentDocument;
      doc.open(); doc.write(html); doc.close();

      var cleaned = false;
      function cleanup(){ if(cleaned)return; cleaned=true; fr.remove(); }

      function snap(){
        try{
          var cl = doc.documentElement.cloneNode(true);
          cl.querySelectorAll('script,noscript,canvas,iframe').forEach(function(n){n.remove();});
          cl.querySelectorAll('video').forEach(function(v){
            var poster = v.getAttribute('poster');
            var d = doc.createElement('div');
            d.style.cssText='position:absolute;inset:0;width:100%;height:100%;background:#060607;background-size:cover;background-position:center;'+(poster?'background-image:url('+base+poster+');':'');
            v.parentNode && v.parentNode.replaceChild(d,v);
          });
          var b = cl.querySelector('body');
          if(b){ b.style.margin='0'; b.style.background=bg||'#060607'; }
          var ht = new XMLSerializer().serializeToString(cl);
          var sv = '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:'+w+'px;height:'+h+'px;overflow:hidden;background:'+(bg||'#060607')+';">'+ht+'</div></foreignObject></svg>';
          var bl = new Blob([sv],{type:'image/svg+xml;charset=utf-8'});
          var bu = URL.createObjectURL(bl);
          var im = new Image();
          var dn=false;
          function fin(){ if(dn)return; dn=true; URL.revokeObjectURL(bu); cleanup(); cb(cv); }
          var dpr = Math.min(window.devicePixelRatio||1,1.5);
          var cv = document.createElement('canvas');
          cv.width=Math.floor(w*dpr); cv.height=Math.floor(h*dpr);
          var cx = cv.getContext('2d');
          cx.scale(dpr,dpr);
          cx.fillStyle = bg||'#060607'; cx.fillRect(0,0,w,h);
          im.onload = function(){ try{ cx.drawImage(im,0,0,w,h); }catch(e){} fin(); };
          im.onerror = fin;
          im.src = bu;
          setTimeout(fin,2500);
        }catch(e){ cleanup(); cb(solidCanvas(6,6,7)); }
      }

      var ready=false;
      function go(){ if(ready)return; ready=true; setTimeout(snap,200); }
      fr.onload = go;
      setTimeout(go, 3000);
    }).catch(function(){ cb(solidCanvas(6,6,7)); });
  }

  // ----- Link interception ------------------------------------------------
  function localLink(a){
    if(!a.href) return false;
    if(a.target && a.target !== '' && a.target !== '_self') return false;
    if(a.hasAttribute('download')) return false;
    var u; try{u=new URL(a.href);}catch(e){return false;}
    if(u.origin !== location.origin) return false;
    if(u.protocol==='mailto:'||u.protocol==='tel:') return false;
    if(u.pathname===location.pathname && u.hash) return false;
    var ext=(u.pathname.split('.').pop()||'').toLowerCase();
    var skip=['jpg','jpeg','png','webp','gif','svg','mp4','webm','mp3','wav','pdf','zip','css','js','woff','woff2','ttf','ico','xml','txt','map','json'];
    return skip.indexOf(ext)===-1;
  }

  var busy = false;
  var DUR = 1100;

  function go(href){
    if(busy) return;
    busy = true;

    // Mark arrival for new page
    try{ sessionStorage.setItem('__wgl_a','1'); }catch(e){}

    // Lock scroll
    document.body.style.overflow='hidden';
    document.documentElement.style.overflow='hidden';

    // Build overlay
    var ov = document.createElement('div');
    ov.id='wgl-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#060607;';
    var loader = document.createElement('div');
    loader.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9a9a9e;transition:opacity .3s;';
    loader.textContent = '…';
    ov.appendChild(loader);
    var cv = document.createElement('canvas');
    cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .25s;display:block;';
    ov.appendChild(cv);
    document.body.appendChild(ov);

    function size(){
      var dpr=Math.min(window.devicePixelRatio||1,1.5);
      cv.width=Math.floor(window.innerWidth*dpr);
      cv.height=Math.floor(window.innerHeight*dpr);
    }
    size();

    var gl = glCtx(cv);
    var fallbackDone = false;
    function fallback(){
      if(fallbackDone) return;
      fallbackDone = true;
      window.location.href = href;
    }
    if(!gl){ fallback(); return; }

    var pr = program(gl);
    if(!pr){ fallback(); return; }
    gl.useProgram(pr);
    quad(gl,pr);

    var dispTex = gl.createTexture();
    upload(gl, dispTex, makeDisp());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    var black = solidCanvas(6,6,7);
    var tFrom = gl.createTexture(), tTo = gl.createTexture();
    upload(gl, tFrom, black);
    upload(gl, tTo, black);

    var uFrom = gl.getUniformLocation(pr,'uFrom');
    var uTo   = gl.getUniformLocation(pr,'uTo');
    var uDisp = gl.getUniformLocation(pr,'uDisp');
    var uMix  = gl.getUniformLocation(pr,'uMix');
    var uPow  = gl.getUniformLocation(pr,'uPower');

    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, dispTex); gl.uniform1i(uDisp,2);

    var fromReady = false, toReady = false;
    var t0 = 0, started = false;
    var navigated = false;

    function startIfReady(){
      if(fromReady && toReady && !started){
        started = true;
        t0 = performance.now();
        cv.style.opacity = '1';
        loader.style.opacity = '0';
        setTimeout(function(){ loader.remove(); }, 300);
      }
    }

    // Capture current page
    shootNode(document.documentElement, '#060607', window.innerWidth, window.innerHeight, function(c){
      gl.activeTexture(gl.TEXTURE0);
      upload(gl, tFrom, c);
      fromReady = true;
      startIfReady();
    });

    // Capture target page
    shootUrl(href, '#060607', function(c){
      gl.activeTexture(gl.TEXTURE1);
      upload(gl, tTo, c);
      toReady = true;
      startIfReady();
    });

    function frame(now){
      if(!started){ requestAnimationFrame(frame); return; }
      var el = now - t0;
      var t = Math.min(1, el/DUR);
      // smoothstep
      var m = t*t*(3-2*t);

      gl.viewport(0,0,cv.width,cv.height);
      gl.clearColor(6/255,6/255,7/255,1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,tFrom); gl.uniform1i(uFrom,0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,tTo);   gl.uniform1i(uTo,1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,dispTex); gl.uniform1i(uDisp,2);
      gl.uniform1f(uMix, m);
      gl.uniform1f(uPow, 0.45);

      gl.drawArrays(gl.TRIANGLES,0,6);

      // Navigate near the end so last frame = to-snapshot stays during unload
      if(t >= 0.92 && !navigated){
        navigated = true;
        window.location.href = href;
      }
      if(t < 1){ requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);

    // Hard safety net
    setTimeout(fallback, 5000);
  }

  // ----- Entry (new page after transition) --------------------------------
  function entry(){
    var a = false;
    try{ a = sessionStorage.getItem('__wgl_a') === '1'; }catch(e){}
    if(!a) return;
    try{ sessionStorage.removeItem('__wgl_a'); }catch(e){}

    // The browser unloaded the previous page, so its WebGL overlay is gone.
    // We arrive at the new page. The last frame the user saw was the "to"
    // snapshot from the shader (which matches our viewport). To avoid any
    // flash between the dead canvas and the newly-rendered document, we put
    // a brief #060607 veil that slides up quickly.
    var v = document.createElement('div');
    v.style.cssText='position:fixed;inset:0;z-index:99999;background:#060607;pointer-events:none;transform:translateY(0);transition:transform 0.55s cubic-bezier(0.77,0,0.175,1);';
    document.body.appendChild(v);
    document.body.style.overflow='hidden';
    void v.offsetWidth;
    requestAnimationFrame(function(){
      v.style.transform='translateY(-100%)';
      setTimeout(function(){ v.remove(); document.body.style.overflow=''; document.documentElement.style.overflow=''; }, 600);
    });
  }

  function init(){
    document.addEventListener('click', function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0) return;
      var a = e.target.closest('a');
      if(!a || !localLink(a)) return;
      e.preventDefault();
      go(a.href);
    }, false);

    if(document.readyState==='complete'){ entry(); }
    else{ window.addEventListener('load', entry); }
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); }
  else{ init(); }
})();
