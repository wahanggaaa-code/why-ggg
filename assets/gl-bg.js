/* WHY ✴︎ GGG — ambient WebGL silk (raw WebGL1, tanpa three.js: ringan & deploy-safe) */
(function () {
  var canvas = document.getElementById('gl');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }) ||
           canvas.getContext('experimental-webgl');
  if (!gl) { document.body.classList.add('no-gl'); canvas.remove(); return; }

  var VSH = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FSH = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uTime;uniform float uScroll;uniform float uVel;uniform vec2 uPtr;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.;float a=.5;',
    ' for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes.xy;',
    ' vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' float t=uTime*.055;',
    ' vec2 q=vec2(fbm(p*1.6+vec2(0.,t)),fbm(p*1.6+vec2(5.2,1.3)-t*.6));',
    ' vec2 r=vec2(fbm(p*1.9+2.4*q+vec2(1.7,uScroll*1.6)),fbm(p*1.9+2.4*q+vec2(8.3,uScroll*1.2)));',
    ' float f=fbm(p*2.2+2.8*r);',
    ' vec3 col=mix(vec3(.0235,.0235,.0275),vec3(.055,.055,.066),smoothstep(.15,.85,f));',
    ' col+=vec3(.941,.851,.627)*pow(f,3.4)*.145;',                 /* warm sand  */
    ' col+=vec3(.910,.416,.369)*pow(1.-abs(f-.52)*2.,4.)*.055;',   /* rose edge  */
    ' float d=distance(uv*vec2(uRes.x/uRes.y,1.),uPtr*vec2(uRes.x/uRes.y,1.));',
    ' col+=vec3(.941,.851,.627)*exp(-d*4.5)*.045;',                /* pointer glow */
    ' col+=abs(uVel)*.05*f*vec3(.941,.851,.627);',                 /* scroll velocity flare */
    ' col*=1.-.42*pow(length(uv-.5),1.9);',                        /* vignette */
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); }
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VSH));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FSH));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { document.body.classList.add('no-gl'); canvas.remove(); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    scroll: gl.getUniformLocation(prog, 'uScroll'),
    vel: gl.getUniformLocation(prog, 'uVel'),
    ptr: gl.getUniformLocation(prog, 'uPtr')
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  /* resolusi internal rendah: silk frekuensi rendah aman di-upscale CSS —
     hemat GPU berat (mobile / software GL), grain tetap dari overlay SVG */
  var RS = coarse ? 0.5 : 0.62;
  var ptr = [0.5, 0.5], ptrT = [0.5, 0.5];
  var scrollP = 0, vel = 0, lastY = window.scrollY;

  function resize() {
    var w = Math.max(1, Math.round(window.innerWidth * RS));
    var hh = Math.max(1, Math.round(window.innerHeight * RS));
    if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  window.addEventListener('pointermove', function (e) {
    ptrT = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
  }, { passive: true });

  function metrics() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var y = window.scrollY || window.pageYOffset || 0;
    var p = Math.max(0, Math.min(1, y / max));
    vel += ((p - scrollP) * 26 - vel) * 0.12;
    scrollP = p;
  }
  window.addEventListener('scroll', metrics, { passive: true });

  var t0 = performance.now(), running = true, raf = 0, lastDraw = 0;
  function frame(now) {
    raf = 0;
    if (!running) return;
    if (now - lastDraw < 33) { if (!reduced) raf = requestAnimationFrame(frame); return; } /* cap ~30fps */
    lastDraw = now;
    ptr[0] += (ptrT[0] - ptr[0]) * 0.06;
    ptr[1] += (ptrT[1] - ptr[1]) * 0.06;
    vel *= 0.94;
    gl.uniform1f(U.time, (now - t0) / 1000);
    gl.uniform1f(U.scroll, scrollP);
    gl.uniform1f(U.vel, Math.max(-1, Math.min(1, vel)));
    gl.uniform2f(U.ptr, ptr[0], ptr[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', function () {
    if (reduced) return;
    if (document.hidden) { running = false; if (raf) cancelAnimationFrame(raf); }
    else if (!running) { running = true; raf = requestAnimationFrame(frame); }
  });
  raf = requestAnimationFrame(frame); /* reduced: satu frame statis lalu berhenti */
})();
