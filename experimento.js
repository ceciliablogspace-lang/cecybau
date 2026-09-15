/* ===========================================================
   Cecilia Bautista — versión experimental
   Dos lienzos WebGL escritos a mano, sin librerías:
     1. #tinta   → tinta viva que sigue el dedo (portada)
     2. #lienzo  → las obras, dibujadas con shader y deformadas
   Si algo falla o el celular pide menos movimiento, la página
   se ve como una página normal con las fotos tal cual.
   =========================================================== */

(function () {
  'use strict';

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     Utilidades WebGL
     --------------------------------------------------------------- */

  function compilar(gl, tipo, fuente) {
    var sh = gl.createShader(tipo);
    gl.shaderSource(sh, fuente);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function programa(gl, vs, fs) {
    var v = compilar(gl, gl.VERTEX_SHADER, vs);
    var f = compilar(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(p));
      return null;
    }
    gl.deleteShader(v);
    gl.deleteShader(f);
    return p;
  }

  function uniformes(gl, p) {
    var u = {};
    var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var nom = gl.getActiveUniform(p, i).name.replace('[0]', '');
      u[nom] = gl.getUniformLocation(p, nom);
    }
    return u;
  }

  function cuadro(gl) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    return b;
  }

  var RUIDO = [
    'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}',
    'float snoise(vec2 v){',
    '  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);',
    '  vec2 i=floor(v+dot(v,C.yy));',
    '  vec2 x0=v-i+dot(i,C.xx);',
    '  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);',
    '  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;',
    '  i=mod289(i);',
    '  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));',
    '  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);',
    '  m=m*m; m=m*m;',
    '  vec3 x=2.0*fract(p*C.www)-1.0;',
    '  vec3 h=abs(x)-0.5;',
    '  vec3 ox=floor(x+0.5);',
    '  vec3 a0=x-ox;',
    '  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);',
    '  vec3 g;',
    '  g.x=a0.x*x0.x+h.x*x0.y;',
    '  g.yz=a0.yz*x12.xz+h.yz*x12.yw;',
    '  return 130.0*dot(m,g);',
    '}'
  ].join('\n');

  /* ===============================================================
     1. TINTA — la portada
     =============================================================== */

  function iniciarTinta() {
    var lona = document.getElementById('tinta');
    if (!lona) return null;

    var gl = lona.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false })
          || lona.getContext('experimental-webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) return null;

    var VS = [
      'attribute vec2 aPos;',
      'varying vec2 vUv;',
      'void main(){ vUv=aPos; gl_Position=vec4(aPos*2.0-1.0,0.0,1.0); }'
    ].join('\n');

    /* Paso de simulación: arrastra la tinta por un campo de remolinos
       y le va bajando la intensidad, como acuarela secándose. */
    var SIM = [
      'precision highp float;',
      'varying vec2 vUv;',
      'uniform sampler2D uPrev;',
      'uniform vec2 uRes;',
      'uniform float uTime;',
      'uniform vec2 uPunto;',
      'uniform vec2 uDelta;',
      'uniform vec3 uColor;',
      'uniform float uFuerza;',
      'uniform float uRadio;',
      RUIDO,
      'vec2 remolino(vec2 p){',
      '  float e=0.035;',
      '  float a=snoise(p+vec2(0.0,e));',
      '  float b=snoise(p-vec2(0.0,e));',
      '  float c=snoise(p+vec2(e,0.0));',
      '  float d=snoise(p-vec2(e,0.0));',
      '  return vec2(a-b, d-c)/(2.0*e);',
      '}',
      'void main(){',
      '  vec2 uv=vUv;',
      '  float asp=uRes.x/uRes.y;',
      '  vec2 p=vec2(uv.x*asp,uv.y);',
      '  vec2 v=remolino(p*1.45+vec2(0.0,uTime*0.035));',
      '  v.y+=0.55;',                                  /* la tinta sube despacio */
      '  vec2 desplazo=v*0.00022;',
      '  desplazo.x/=asp;',
      '  vec4 prev=texture2D(uPrev,uv-desplazo);',
      /* se apaga de a poco y llega a cero de verdad */
      '  vec3 col=max(prev.rgb*0.988-0.0022,0.0);',
      /* Mancha nueva donde va el dedo. Se MEZCLA con lo que había, no se
         suma: así la tinta guarda su color en vez de quemarse en blanco,
         igual que la acuarela sobre el papel. */
      '  vec2 d=(uv-uPunto)*vec2(asp,1.0);',
      '  float caida=exp(-dot(d,d)/uRadio);',
      '  col=mix(col,uColor,clamp(caida*uFuerza*11.0,0.0,1.0));',
      /* la estela del movimiento, para que se sienta el trazo */
      '  vec2 d2=(uv-(uPunto-uDelta*0.5))*vec2(asp,1.0);',
      '  float estela=exp(-dot(d2,d2)/(uRadio*2.2));',
      '  col=mix(col,uColor,clamp(estela*uFuerza*5.0,0.0,1.0));',
      '  gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');

    /* Paso de pantalla: pone la tinta sobre el fondo oscuro,
       con grano de papel y viñeta para que no se vea plástico. */
    var VER = [
      'precision highp float;',
      'varying vec2 vUv;',
      'uniform sampler2D uTex;',
      'uniform vec2 uRes;',
      'uniform float uTime;',
      'float azar(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }',
      'void main(){',
      '  vec2 uv=vUv;',
      '  vec3 tinta=texture2D(uTex,uv).rgb;',
      '  float densa=max(max(tinta.r,tinta.g),tinta.b);',
      '  vec3 fondo=vec3(0.039,0.035,0.031);',
      '  vec3 col=fondo+tinta*1.15;',
      /* un halo tenue alrededor de la mancha */
      '  col+=vec3(0.035,0.028,0.024)*smoothstep(0.02,0.5,densa);',
      /* viñeta */
      '  vec2 c=uv-0.5; c.x*=uRes.x/uRes.y;',
      '  col*=1.0-smoothstep(0.35,0.95,length(c))*0.55;',
      /* grano */
      '  float g=azar(uv*uRes+uTime)*0.035-0.016;',
      '  col+=g;',
      '  gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');

    var pSim = programa(gl, VS, SIM);
    var pVer = programa(gl, VS, VER);
    if (!pSim || !pVer) return null;

    var uSim = uniformes(gl, pSim);
    var uVer = uniformes(gl, pVer);
    var buf = cuadro(gl);

    function enlazar(p) {
      var loc = gl.getAttribLocation(p, 'aPos');
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    /* --- dos texturas que se van turnando --- */
    var ancho = 0, alto = 0;
    var fbos = [null, null];
    var texs = [null, null];
    var actual = 0;

    function nuevaTextura(w, h) {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { t: t, f: f };
    }

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      lona.width = Math.floor(window.innerWidth * dpr);
      lona.height = Math.floor(window.innerHeight * dpr);

      /* la simulación corre chiquita: se ve igual y no calienta el celular */
      var tope = window.innerWidth < 760 ? 300 : 460;
      var escala = tope / Math.max(window.innerWidth, window.innerHeight);
      ancho = Math.max(64, Math.floor(window.innerWidth * escala));
      alto = Math.max(64, Math.floor(window.innerHeight * escala));

      for (var i = 0; i < 2; i++) {
        if (fbos[i]) { gl.deleteFramebuffer(fbos[i]); gl.deleteTexture(texs[i]); }
        var par = nuevaTextura(ancho, alto);
        texs[i] = par.t;
        fbos[i] = par.f;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    medir();

    /* --- el dedo / el ratón --- */
    var punto = { x: 0.5, y: 0.35 };
    var previo = { x: 0.5, y: 0.35 };
    var fuerza = 0;
    var tocado = false;
    var ultimoToque = -9999;

    var PALETA = [
      [0.86, 0.36, 0.21],   /* fuego */
      [0.22, 0.44, 0.68],   /* azul del torito */
      [0.76, 0.19, 0.28],   /* rojo del telón */
      [0.84, 0.62, 0.23],   /* dorado */
      [0.55, 0.28, 0.53]    /* bugambilia */
    ];
    var color = PALETA[0].slice();
    var destino = 0;
    var relojColor = 0;

    function mover(x, y) {
      previo.x = punto.x; previo.y = punto.y;
      punto.x = x / window.innerWidth;
      punto.y = 1 - y / window.innerHeight;
      tocado = true;
      ultimoToque = performance.now();
    }

    window.addEventListener('pointermove', function (e) { mover(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (e.touches[0]) mover(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    var t0 = performance.now();

    function paso(ahora) {
      var t = (ahora - t0) / 1000;

      /* si nadie toca, la tinta se pasea sola */
      if (ahora - ultimoToque > 1400) {
        previo.x = punto.x; previo.y = punto.y;
        punto.x = 0.5 + Math.cos(t * 0.31) * 0.26 + Math.sin(t * 0.17) * 0.07;
        punto.y = 0.42 + Math.sin(t * 0.24) * 0.2 + Math.cos(t * 0.41) * 0.05;
        tocado = true;
      }

      var dx = punto.x - previo.x;
      var dy = punto.y - previo.y;
      var vel = Math.sqrt(dx * dx + dy * dy);
      fuerza += ((tocado ? Math.min(0.012 + vel * 1.5, 0.085) : 0) - fuerza) * 0.14;

      /* El color se queda un buen rato en cada tono de su obra y cambia
         de golpe corto, para no pasar minutos en grises intermedios. */
      relojColor += 1 / 60;
      if (relojColor > 5.5) {
        relojColor = 0;
        destino = (destino + 1) % PALETA.length;
      }
      var meta = PALETA[destino];
      for (var i = 0; i < 3; i++) color[i] += (meta[i] - color[i]) * 0.1;

      /* --- simular --- */
      var otro = 1 - actual;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[otro]);
      gl.viewport(0, 0, ancho, alto);
      gl.useProgram(pSim);
      enlazar(pSim);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texs[actual]);
      gl.uniform1i(uSim.uPrev, 0);
      gl.uniform2f(uSim.uRes, ancho, alto);
      gl.uniform1f(uSim.uTime, t);
      gl.uniform2f(uSim.uPunto, punto.x, punto.y);
      gl.uniform2f(uSim.uDelta, dx, dy);
      gl.uniform3f(uSim.uColor, color[0], color[1], color[2]);
      gl.uniform1f(uSim.uFuerza, fuerza);
      gl.uniform1f(uSim.uRadio, window.innerWidth < 760 ? 0.0095 : 0.0058);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      actual = otro;

      /* --- pintar en pantalla --- */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, lona.width, lona.height);
      gl.useProgram(pVer);
      enlazar(pVer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texs[actual]);
      gl.uniform1i(uVer.uTex, 0);
      gl.uniform2f(uVer.uRes, lona.width, lona.height);
      gl.uniform1f(uVer.uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    return { paso: paso, medir: medir, lona: lona };
  }

  /* ===============================================================
     2. LIENZO — las obras dibujadas con shader
     =============================================================== */

  function iniciarObras() {
    var lona = document.getElementById('lienzo');
    var fotos = [].slice.call(document.querySelectorAll('img[data-gl]'));
    if (!lona || !fotos.length) return null;

    var gl = lona.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: false })
          || lona.getContext('experimental-webgl', { alpha: true, antialias: false, depth: false });
    if (!gl) return null;

    var VS = [
      'attribute vec2 aPos;',
      'uniform vec4 uRect;',   /* x, y, ancho, alto — en pixeles de pantalla */
      'uniform vec2 uRes;',
      'uniform float uOnda;',
      'varying vec2 vUv;',
      'void main(){',
      '  vec2 px=uRect.xy+aPos*uRect.zw;',
      /* la obra se curva un poco con la velocidad del scroll */
      '  px.y+=sin(aPos.x*3.14159)*uOnda;',
      '  vec2 ndc=vec2(px.x/uRes.x*2.0-1.0, 1.0-px.y/uRes.y*2.0);',
      '  vUv=aPos;',
      '  gl_Position=vec4(ndc,0.0,1.0);',
      '}'
    ].join('\n');

    var FS = [
      'precision highp float;',
      'varying vec2 vUv;',
      'uniform sampler2D uTex;',
      'uniform float uTime;',
      'uniform float uVel;',      /* velocidad del scroll, -1..1 */
      'uniform float uHover;',    /* 0..1 cuando el cursor está encima */
      'uniform vec2 uRaton;',     /* posición del cursor dentro de la obra */
      'uniform float uEntra;',    /* 0..1 aparición */
      'uniform vec2 uTam;',
      RUIDO,
      'void main(){',
      '  vec2 uv=vUv;',
      /* ondulación por scroll: la pintura se vuelve líquida al moverse */
      '  uv.x+=sin(uv.y*7.0+uTime*0.6)*uVel*0.018;',
      '  uv.y+=sin(uv.x*5.0-uTime*0.4)*uVel*0.012;',
      /* onda que sale del cursor */
      '  vec2 dif=uv-uRaton;',
      '  float dist=length(dif*vec2(uTam.x/uTam.y,1.0));',
      '  float onda=sin(dist*26.0-uTime*3.4)*exp(-dist*4.5)*uHover*0.022;',
      '  uv+=normalize(dif+vec2(0.0001))*onda;',
      /* la pintura respira aunque nadie la toque */
      '  uv+=vec2(snoise(uv*2.4+uTime*0.06), snoise(uv*2.4-uTime*0.05))*0.0022;',
      '  uv=clamp(uv,0.002,0.998);',
      /* separación de color: más fuerte mientras más rápido bajas */
      '  float sep=abs(uVel)*0.014+uHover*0.0035;',
      '  float r=texture2D(uTex,uv+vec2(sep,0.0)).r;',
      '  float g=texture2D(uTex,uv).g;',
      '  float b=texture2D(uTex,uv-vec2(sep,0.0)).b;',
      '  vec3 col=vec3(r,g,b);',
      /* La obra vive en penumbra: las orillas se funden con el negro de la
         página y al acercarte se ilumina, como cuadro en sala oscura. */
      '  vec2 c=(vUv-0.5)*2.0;',
      '  float radio=length(c*vec2(1.0,0.94));',
      '  float sombra=smoothstep(1.5,0.3,radio);',
      '  col*=mix(0.2,1.0,sombra)*(1.0+uHover*0.62);',
      '  col=min(col,vec3(1.0));',
      /* aparición: se revela de abajo hacia arriba con borde de tinta */
      '  float borde=snoise(vUv*4.0)*0.12;',
      '  float mascara=smoothstep(0.0,0.35,uEntra*1.45-(1.0-vUv.y)+borde);',
      '  col*=mix(0.35,1.0,mascara);',
      /* grano fino */
      '  col+=(fract(sin(dot(vUv*uTam,vec2(12.9898,78.233)))*43758.5453)-0.5)*0.02;',
      /* las esquinas se disuelven, sin orilla dura contra el fondo */
      '  float alfa=mascara*smoothstep(1.62,1.24,radio);',
      '  gl_FragColor=vec4(col, alfa);',
      '}'
    ].join('\n');

    var prog = programa(gl, VS, FS);
    if (!prog) return null;
    var u = uniformes(gl, prog);
    var buf = cuadro(gl);
    var aPos = gl.getAttribLocation(prog, 'aPos');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    /* En compu la obra se ilumina al pasar el cursor. En celular no hay
       cursor, así que se ilumina la que va quedando al centro de la pantalla. */
    var hayCursor = window.matchMedia('(hover: hover)').matches;

    /* --- una entrada por obra --- */
    var piezas = fotos.map(function (img) {
      var marco = img.parentNode;
      var p = {
        img: img,
        marco: marco,
        tex: null,
        hover: 0,
        hoverMeta: 0,
        raton: [0.5, 0.5],
        entra: 0,
        entraMeta: 0
      };

      function subir() {
        var t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        p.tex = t;
      }

      if (img.complete && img.naturalWidth) subir();
      else img.addEventListener('load', subir, { once: true });

      if (hayCursor) {
        marco.addEventListener('pointerenter', function () { p.hoverMeta = 1; });
        marco.addEventListener('pointerleave', function () { p.hoverMeta = 0; });
        marco.addEventListener('pointermove', function (e) {
          var r = marco.getBoundingClientRect();
          p.raton[0] = (e.clientX - r.left) / r.width;
          p.raton[1] = (e.clientY - r.top) / r.height;
        });
      }

      return p;
    });

    /* aparición al entrar en pantalla */
    if ('IntersectionObserver' in window) {
      var mirador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          var fig = e.target;
          fig.classList.add('visible');
          var p = piezas.filter(function (x) { return fig.contains(x.img); })[0];
          if (p) p.entraMeta = 1;
          mirador.unobserve(fig);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

      document.querySelectorAll('.pieza').forEach(function (f) { mirador.observe(f); });
    } else {
      document.querySelectorAll('.pieza').forEach(function (f) { f.classList.add('visible'); });
      piezas.forEach(function (p) { p.entraMeta = 1; });
    }

    /* velocidad del scroll */
    var yAnterior = window.scrollY;
    var vel = 0, velSuave = 0;
    window.addEventListener('scroll', function () {
      vel = (window.scrollY - yAnterior) / Math.max(window.innerHeight, 1);
      yAnterior = window.scrollY;
    }, { passive: true });

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      lona.width = Math.floor(window.innerWidth * dpr);
      lona.height = Math.floor(window.innerHeight * dpr);
    }
    medir();

    var t0 = performance.now();

    function paso(ahora) {
      var t = (ahora - t0) / 1000;
      velSuave += (vel - velSuave) * 0.12;
      vel *= 0.82;

      var dpr = lona.width / window.innerWidth;
      gl.viewport(0, 0, lona.width, lona.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(u.uRes, lona.width, lona.height);
      gl.uniform1f(u.uTime, t);

      for (var i = 0; i < piezas.length; i++) {
        var p = piezas[i];
        if (!p.tex) continue;

        var r = p.marco.getBoundingClientRect();
        if (r.bottom < -80 || r.top > window.innerHeight + 80) continue;

        if (!hayCursor) {
          var centro = Math.abs((r.top + r.height / 2) - window.innerHeight / 2);
          p.hoverMeta = Math.max(0, 1 - centro / (window.innerHeight * 0.45));
          p.raton[0] = 0.5;
          p.raton[1] = 0.5;
        }

        p.hover += (p.hoverMeta - p.hover) * 0.1;
        p.entra += (p.entraMeta - p.entra) * 0.035;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, p.tex);
        gl.uniform1i(u.uTex, 0);
        gl.uniform4f(u.uRect, r.left * dpr, r.top * dpr, r.width * dpr, r.height * dpr);
        gl.uniform1f(u.uVel, Math.max(-1, Math.min(1, velSuave * 5.5)));
        gl.uniform1f(u.uHover, p.hover);
        gl.uniform2f(u.uRaton, p.raton[0], p.raton[1]);
        gl.uniform1f(u.uEntra, p.entra);
        gl.uniform2f(u.uTam, r.width, r.height);
        gl.uniform1f(u.uOnda, -velSuave * 26 * dpr);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    return { paso: paso, medir: medir };
  }

  /* ===============================================================
     3. Texto: letras de la portada y palabras que se encienden
     =============================================================== */

  function partirTitulo() {
    var h1 = document.querySelector('[data-split]');
    if (!h1) return;
    var texto = h1.textContent.trim();
    h1.textContent = '';
    var n = 0;
    texto.split(' ').forEach(function (palabra, pi, todas) {
      var cont = document.createElement('span');
      cont.style.display = 'inline-block';
      cont.style.whiteSpace = 'nowrap';
      palabra.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ltr';
        s.textContent = ch;
        s.style.animationDelay = (0.35 + n * 0.045) + 's';
        cont.appendChild(s);
        n++;
      });
      h1.appendChild(cont);
      if (pi < todas.length - 1) h1.appendChild(document.createTextNode(' '));
    });
    h1.setAttribute('aria-label', texto);
  }

  function partirParrafo() {
    var p = document.querySelector('[data-lineas]');
    if (!p) return null;
    var texto = p.textContent.replace(/\s+/g, ' ').trim();
    p.textContent = '';
    var spans = [];
    texto.split(' ').forEach(function (palabra, i, todas) {
      var s = document.createElement('span');
      s.className = 'pal';
      s.textContent = palabra;
      p.appendChild(s);
      if (i < todas.length - 1) p.appendChild(document.createTextNode(' '));
      spans.push(s);
    });
    p.setAttribute('aria-label', texto);

    return function () {
      var r = p.getBoundingClientRect();
      var alcance = window.innerHeight * 0.78;
      var avance = (alcance - r.top) / (r.height + alcance * 0.35);
      avance = Math.max(0, Math.min(1, avance));
      var hasta = Math.round(avance * spans.length * 1.25);
      for (var i = 0; i < spans.length; i++) {
        spans[i].classList.toggle('on', i < hasta);
      }
    };
  }

  /* ===============================================================
     Arranque
     =============================================================== */

  partirTitulo();
  var actualizarTexto = partirParrafo();

  if (quieto) {
    /* Menos movimiento: página normal, fotos visibles, sin WebGL */
    document.querySelectorAll('.pieza').forEach(function (f) { f.classList.add('visible'); });
    document.querySelectorAll('.pal').forEach(function (s) { s.classList.add('on'); });
    return;
  }

  var tinta = iniciarTinta();
  var obras = iniciarObras();

  if (obras) {
    document.body.classList.add('gl');
  } else {
    /* sin WebGL para las obras: aparecen con CSS y ya */
    document.querySelectorAll('.pieza').forEach(function (f) { f.classList.add('visible'); });
  }

  /* ¿estamos viendo la portada? Si no, la tinta descansa. */
  var heroVisible = true;
  var hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      heroVisible = e[0].isIntersecting;
      if (tinta) tinta.lona.classList.toggle('duerme', !heroVisible);
    }, { threshold: 0.02 }).observe(hero);
  }

  var oculto = false;
  document.addEventListener('visibilitychange', function () { oculto = document.hidden; });

  /* el velo del menú aparece en cuanto sales de la portada */
  var barra = document.querySelector('.nav');
  function revisarBarra() {
    if (barra) barra.classList.toggle('velada', window.scrollY > window.innerHeight * 0.55);
  }
  window.addEventListener('scroll', revisarBarra, { passive: true });
  revisarBarra();

  var redim;
  window.addEventListener('resize', function () {
    clearTimeout(redim);
    redim = setTimeout(function () {
      if (tinta) tinta.medir();
      if (obras) obras.medir();
    }, 160);
  });

  function bucle(ahora) {
    requestAnimationFrame(bucle);
    if (oculto) return;
    if (tinta && heroVisible) tinta.paso(ahora);
    if (obras) obras.paso(ahora);
    if (actualizarTexto) actualizarTexto();
  }
  requestAnimationFrame(bucle);

})();
