/* ===========================================================
   Cecilia Bautista — entrada experimental
   Cada obra se descompone en decenas de miles de puntos que
   traen el color exacto de su pintura. Los puntos llegan
   volando, arman el cuadro, y se vuelven a deshacer para
   armar el siguiente. El dedo o el cursor los aparta.
   WebGL escrito a mano, sin librerías.
   =========================================================== */

(function () {
  'use strict';

  var OBRAS = [
    { src: '/images/experimento/torito.jpg',               titulo: 'Torito',                dato: 'Óleo sobre lienzo · 2025' },
    { src: '/images/experimento/abriendo-la-noche.jpg',     titulo: 'Abriendo la noche',     dato: 'Óleo sobre cartón · 2026' },
    { src: '/images/experimento/persiguiendo-el-tiempo.jpg', titulo: 'Persiguiendo el tiempo', dato: 'Óleo · 2024' },
    { src: '/images/experimento/musica-y-viento-i.jpg',     titulo: 'Música y viento I',     dato: 'Óleo sobre lienzo · 2026' }
  ];

  var lona = document.getElementById('polvo');
  var fichaCaja = document.getElementById('ficha');
  var fichaTitulo = fichaCaja ? fichaCaja.querySelector('.ficha__titulo') : null;
  var fichaDato = fichaCaja ? fichaCaja.querySelector('.ficha__dato') : null;
  var pista = document.getElementById('pista');

  /* --- el nombre entra letra por letra --- */
  (function partirNombre() {
    var h1 = document.querySelector('[data-split]');
    if (!h1) return;
    var texto = h1.textContent.trim();
    h1.textContent = '';
    var n = 0;
    texto.split(' ').forEach(function (palabra, pi, todas) {
      var caja = document.createElement('span');
      caja.style.display = 'inline-block';
      caja.style.whiteSpace = 'nowrap';
      palabra.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ltr';
        s.textContent = ch;
        s.style.animationDelay = (1.9 + n * 0.04) + 's';
        caja.appendChild(s);
        n++;
      });
      h1.appendChild(caja);
      if (pi < todas.length - 1) h1.appendChild(document.createTextNode(' '));
    });
    h1.setAttribute('aria-label', texto);
  })();

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var chico = Math.min(window.innerWidth, window.innerHeight) < 700;

  /* ---------------------------------------------------------------
     Respaldo: sin WebGL o con "menos movimiento", se ve la obra fija
     --------------------------------------------------------------- */

  function respaldo() {
    if (lona) lona.style.display = 'none';
    if (document.querySelector('.respaldo')) return;
    var caja = document.createElement('div');
    caja.className = 'respaldo';
    var img = document.createElement('img');
    img.src = OBRAS[0].src;
    img.alt = OBRAS[0].titulo + ' — óleo de Cecilia Bautista';
    caja.appendChild(img);
    document.body.insertBefore(caja, document.body.firstChild);
    if (pista) pista.textContent = 'Obra: ' + OBRAS[0].titulo;
  }

  var gl = null;
  if (lona && !quieto) {
    gl = lona.getContext('webgl', { alpha: false, antialias: false, depth: false, premultipliedAlpha: false })
      || lona.getContext('experimental-webgl', { alpha: false, antialias: false, depth: false });
  }
  if (!gl) { respaldo(); return; }

  /* ---------------------------------------------------------------
     Shaders
     --------------------------------------------------------------- */

  var VS = [
    'attribute vec2 aRejilla;',   /* 0..1 dentro de la obra */
    'attribute vec3 aColor;',
    'attribute vec2 aAzar;',
    'uniform vec2 uRes;',
    'uniform vec2 uCuadro;',      /* tamaño del cuadro en pixeles */
    'uniform vec2 uCentro;',
    'uniform float uArma;',       /* 0 = polvo suelto, 1 = cuadro armado */
    'uniform float uTime;',
    'uniform vec2 uDedo;',
    'uniform float uDedoVivo;',
    'uniform float uPunto;',
    'uniform float uGolpe;',      /* estallido al tocar */
    'uniform float uVelo;',       /* 1 puntos visibles, 0 ya mandan la foto */
    'varying vec3 vColor;',
    'varying float vAlfa;',
    'void main(){',
    /* dónde le toca quedarse a este punto */
    '  vec2 meta=uCentro+(aRejilla-0.5)*uCuadro;',
    /* de dónde viene: cada punto trae su propio rumbo y distancia */
    '  float ang=aAzar.x*6.2831853;',
    '  float lejos=(0.16+aAzar.y*0.72)*max(uRes.x,uRes.y)*0.6;',
    '  vec2 suelto=meta+vec2(cos(ang),sin(ang))*lejos;',
    /* cada punto llega a su tiempo: los de abajo tardan un poco más */
    '  float propio=clamp(uArma*1.9-aAzar.y*0.55-aRejilla.y*0.32,0.0,1.0);',
    '  propio=propio*propio*(3.0-2.0*propio);',
    '  vec2 pos=mix(suelto,meta,propio);',
    /* respiración: nunca se quedan del todo quietos */
    '  float amp=mix(26.0,3.2,propio);',
    '  pos+=vec2(sin(uTime*0.7+aAzar.x*40.0),cos(uTime*0.62+aAzar.y*37.0))*amp;',
    /* el dedo aparta la pintura */
    '  vec2 d=pos-uDedo;',
    '  float dist=length(d);',
    '  float radio=mix(90.0,170.0,uDedoVivo);',
    '  float empuje=exp(-dist*dist/(radio*radio))*uDedoVivo;',
    '  pos+=normalize(d+vec2(0.0001))*empuje*115.0;',
    /* al tocar, todo sale disparado un momento */
    '  pos+=vec2(cos(ang),sin(ang))*uGolpe*190.0;',
    '  vec2 ndc=vec2(pos.x/uRes.x*2.0-1.0, 1.0-pos.y/uRes.y*2.0);',
    '  gl_Position=vec4(ndc,0.0,1.0);',
    '  gl_PointSize=uPunto*(1.0+empuje*1.9)*mix(0.6,1.0,propio);',
    /* mientras vuelan brillan un poco más, como chispa */
    '  vColor=aColor*mix(0.88,1.0,propio)*(1.0-empuje*0.22);',
    '  vAlfa=mix(0.42,1.0,propio)*uVelo;',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'varying vec3 vColor;',
    'varying float vAlfa;',
    'void main(){',
    '  vec2 p=gl_PointCoord-0.5;',
    '  float d=dot(p,p);',
    '  if(d>0.25) discard;',
    '  float borde=smoothstep(0.25,0.135,d);',
    '  gl_FragColor=vec4(vColor,borde*vAlfa);',
    '}'
  ].join('\n');

  function compilar(tipo, fuente) {
    var sh = gl.createShader(tipo);
    gl.shaderSource(sh, fuente);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compilar(gl.VERTEX_SHADER, VS);
  var fs = compilar(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { respaldo(); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(prog));
    respaldo();
    return;
  }
  gl.useProgram(prog);

  var A = {
    rejilla: gl.getAttribLocation(prog, 'aRejilla'),
    color: gl.getAttribLocation(prog, 'aColor'),
    azar: gl.getAttribLocation(prog, 'aAzar')
  };
  var U = {};
  ['uRes', 'uCuadro', 'uCentro', 'uArma', 'uTime', 'uDedo', 'uDedoVivo', 'uPunto', 'uGolpe', 'uVelo']
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  /* ---------------------------------------------------------------
     Leer los colores de cada obra
     --------------------------------------------------------------- */

  /* cuántos puntos por lado: menos en celular para que no caliente */
  var LADO = chico ? 150 : 252;

  var rejillaBuf = gl.createBuffer();
  var azarBuf = gl.createBuffer();
  var totalPuntos = 0;

  /* La rejilla y el azar son iguales para todas las obras: se suben una
     sola vez. Lo único que cambia de obra a obra es el color. */
  function armarRejilla(cols, filas) {
    var n = cols * filas;
    var rej = new Float32Array(n * 2);
    var azar = new Float32Array(n * 2);
    var i = 0;
    for (var y = 0; y < filas; y++) {
      for (var x = 0; x < cols; x++) {
        rej[i * 2] = (x + 0.5) / cols;
        rej[i * 2 + 1] = (y + 0.5) / filas;
        azar[i * 2] = Math.random();
        azar[i * 2 + 1] = Math.random();
        i++;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, rejillaBuf);
    gl.bufferData(gl.ARRAY_BUFFER, rej, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, azarBuf);
    gl.bufferData(gl.ARRAY_BUFFER, azar, gl.STATIC_DRAW);
    totalPuntos = n;
  }

  var lienzo2d = document.createElement('canvas');
  var ctx2d = lienzo2d.getContext('2d', { willReadFrequently: true });

  function leerColores(img, cols, filas) {
    lienzo2d.width = cols;
    lienzo2d.height = filas;
    ctx2d.clearRect(0, 0, cols, filas);
    ctx2d.drawImage(img, 0, 0, cols, filas);
    var datos = ctx2d.getImageData(0, 0, cols, filas).data;
    var col = new Float32Array(cols * filas * 3);
    for (var i = 0; i < cols * filas; i++) {
      col[i * 3] = datos[i * 4] / 255;
      col[i * 3 + 1] = datos[i * 4 + 1] / 255;
      col[i * 3 + 2] = datos[i * 4 + 2] / 255;
    }
    return col;
  }

  var cargadas = [];
  var listas = 0;
  var colsG = 0, filasG = 0;

  OBRAS.forEach(function (obra, idx) {
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      var aspecto = img.naturalWidth / img.naturalHeight;
      /* misma cantidad de puntos para todas, repartidos según su forma */
      var cols, filas;
      if (aspecto >= 1) { cols = LADO; filas = Math.round(LADO / aspecto); }
      else { filas = LADO; cols = Math.round(LADO * aspecto); }

      /* la primera obra define la rejilla; las demás se ajustan a ella
         para poder intercambiar solo el color */
      if (!colsG) { colsG = cols; filasG = filas; armarRejilla(colsG, filasG); }

      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, leerColores(img, colsG, filasG), gl.STATIC_DRAW);

      cargadas[idx] = { buf: buf, aspecto: aspecto, src: obra.src, titulo: obra.titulo, dato: obra.dato };
      listas++;
      if (idx === 0) arrancar();
    };
    img.onerror = function () { listas++; if (idx === 0) respaldo(); };
    img.src = obra.src;
  });

  /* ---------------------------------------------------------------
     Movimiento
     --------------------------------------------------------------- */

  var dpr = 1, anchoCSS = 0, altoCSS = 0;

  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    anchoCSS = window.innerWidth;
    altoCSS = window.innerHeight;
    lona.width = Math.floor(anchoCSS * dpr);
    lona.height = Math.floor(altoCSS * dpr);
    gl.viewport(0, 0, lona.width, lona.height);
  }

  /* El cuadro se centra en el hueco REAL que dejan los textos: se miden
     la línea de arriba y el bloque de abajo, y lo que sobra es su espacio. */
  var cajaArriba = document.querySelector('.arriba');
  var cajaAbajo = document.querySelector('.abajo');

  function encuadre(aspecto) {
    var techo = 0, piso = 0;
    if (cajaArriba) techo = cajaArriba.getBoundingClientRect().bottom;
    if (cajaAbajo) piso = cajaAbajo.getBoundingClientRect().top;
    if (!piso || piso <= techo) { techo = altoCSS * 0.08; piso = altoCSS * 0.72; }

    var margen = Math.min(28, altoCSS * 0.03);
    var hueco = Math.max(120, piso - techo - margen * 2);
    var alto = hueco;
    var ancho = alto * aspecto;
    var maxAncho = anchoCSS * (chico ? 0.88 : 0.5);
    if (ancho > maxAncho) { ancho = maxAncho; alto = ancho / aspecto; }

    return { w: ancho, h: alto, cx: anchoCSS / 2, cy: techo + margen + hueco / 2 };
  }

  var dedo = { x: -9999, y: -9999 };
  var dedoVivo = 0, dedoMeta = 0;
  var golpe = 0;

  window.addEventListener('pointermove', function (e) {
    dedo.x = e.clientX; dedo.y = e.clientY; dedoMeta = 1;
  }, { passive: true });
  window.addEventListener('pointerleave', function () { dedoMeta = 0; });
  window.addEventListener('touchmove', function (e) {
    if (e.touches[0]) { dedo.x = e.touches[0].clientX; dedo.y = e.touches[0].clientY; dedoMeta = 1; }
  }, { passive: true });
  window.addEventListener('touchend', function () { dedoMeta = 0; }, { passive: true });

  /* tocar = estallido */
  function estallar(e) {
    if (e && e.target && e.target.closest && e.target.closest('a')) return;
    golpe = 1;
    /* la foto se rompe y vuelve a ser polvo, que se rearma solo */
    nitidez = 0;
    arma = 0.3;
    fase = 'entrando';
    reloj = 0;
    if (pista) pista.textContent = 'Otra vez';
  }
  window.addEventListener('pointerdown', estallar, { passive: true });

  var nitida = document.getElementById('nitida');

  var actual = 0;
  var arma = 0;        /* 0 polvo suelto, 1 cuadro armado con puntos */
  var nitidez = 0;     /* 0 se ven los puntos, 1 se ve la foto de verdad */
  var fase = 'entrando';   /* entrando → nitida → saliendo */
  var reloj = 0;
  var t0 = 0;
  var ultimo = 0;
  var corriendo = false;

  /* Suavizado por tiempo real, no por cuadros: así el ritmo es el mismo
     en una compu rápida y en un celular lento. */
  function acercar(valor, meta, ritmo, dt) {
    return valor + (meta - valor) * (1 - Math.exp(-ritmo * dt));
  }

  /* La foto de verdad se coloca justo donde los puntos armaron el cuadro.
     Solo se reescribe cuando de veras cambia, para no mover el DOM cada
     cuadro de animación. */
  var ultimaCaja = '';

  function colocarNitida(enc) {
    if (!nitida) return;
    var caja = [Math.round(enc.cx - enc.w / 2), Math.round(enc.cy - enc.h / 2),
                Math.round(enc.w), Math.round(enc.h)].join(',');
    if (caja === ultimaCaja) return;
    ultimaCaja = caja;
    nitida.style.left = (enc.cx - enc.w / 2) + 'px';
    nitida.style.top = (enc.cy - enc.h / 2) + 'px';
    nitida.style.width = enc.w + 'px';
    nitida.style.height = enc.h + 'px';
  }

  function ponerFicha(obra) {
    if (!fichaTitulo || !fichaDato) return;
    fichaTitulo.textContent = obra.titulo;
    fichaDato.textContent = obra.dato;
    if (nitida && obra.src) { nitida.src = obra.src; ultimaCaja = ''; }
  }

  function arrancar() {
    if (corriendo) return;
    corriendo = true;
    medir();
    ponerFicha(cargadas[0]);
    t0 = performance.now();
    ultimo = t0;
    requestAnimationFrame(paso);
  }

  var oculto = false;
  document.addEventListener('visibilitychange', function () { oculto = document.hidden; });

  var redim;
  window.addEventListener('resize', function () {
    clearTimeout(redim);
    redim = setTimeout(medir, 160);
  });

  function paso(ahora) {
    requestAnimationFrame(paso);
    if (oculto) return;

    var t = (ahora - t0) / 1000;
    var dt = Math.min((ahora - ultimo) / 1000, 0.06);
    ultimo = ahora;

    var obra = cargadas[actual];
    if (!obra) return;

    /* Tres momentos:
         entrando → los puntos llegan y arman el cuadro
         nitida   → aparece la foto de verdad encima y se queda un rato
         saliendo → la foto se va, los puntos se sueltan, entra la siguiente */
    reloj += dt;

    if (fase === 'entrando') {
      arma = acercar(arma, 1, 1.5, dt);
      nitidez = acercar(nitidez, 0, 9, dt);
      if (arma > 0.965) { fase = 'nitida'; reloj = 0; }

    } else if (fase === 'nitida') {
      arma = acercar(arma, 1, 2.2, dt);
      /* la foto aparece despacito; los puntos se apagan debajo */
      nitidez = acercar(nitidez, 1, 2.0, dt);
      if (reloj > 5.2 && listas > 1) { fase = 'saliendo'; reloj = 0; }

    } else {
      nitidez = acercar(nitidez, 0, 5.5, dt);
      if (fichaCaja) fichaCaja.classList.add('oculta');
      /* primero se va la foto, y ya que no está, se sueltan los puntos */
      if (reloj > 0.4) arma = acercar(arma, 0, 3.3, dt);
      if (reloj > 2.1) {
        var siguiente = (actual + 1) % OBRAS.length;
        if (cargadas[siguiente]) {
          actual = siguiente;
          ponerFicha(cargadas[actual]);
        }
        if (fichaCaja) fichaCaja.classList.remove('oculta');
        fase = 'entrando';
        reloj = 0;
      }
    }

    dedoVivo = acercar(dedoVivo, dedoMeta, 5.0, dt);
    golpe *= Math.exp(-6.3 * dt);
    if (golpe < 0.002) golpe = 0;

    var enc = encuadre(obra.aspecto);
    colocarNitida(enc);
    if (nitida) nitida.style.opacity = nitidez.toFixed(3);
    /* el punto debe ser un pelín más gordo que el hueco entre puntos,
       si no se ve rayada la pintura */
    var paso_px = (enc.w / colsG) * dpr;
    var tam = Math.max(1.6, paso_px * 1.75);

    gl.clearColor(0.992, 0.988, 0.980, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, rejillaBuf);
    gl.enableVertexAttribArray(A.rejilla);
    gl.vertexAttribPointer(A.rejilla, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, azarBuf);
    gl.enableVertexAttribArray(A.azar);
    gl.vertexAttribPointer(A.azar, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, obra.buf);
    gl.enableVertexAttribArray(A.color);
    gl.vertexAttribPointer(A.color, 3, gl.FLOAT, false, 0, 0);

    gl.uniform2f(U.uRes, lona.width, lona.height);
    gl.uniform2f(U.uCuadro, enc.w * dpr, enc.h * dpr);
    gl.uniform2f(U.uCentro, enc.cx * dpr, enc.cy * dpr);
    gl.uniform1f(U.uArma, arma);
    gl.uniform1f(U.uTime, t);
    gl.uniform2f(U.uDedo, dedo.x * dpr, dedo.y * dpr);
    gl.uniform1f(U.uDedoVivo, dedoVivo);
    gl.uniform1f(U.uPunto, tam);
    gl.uniform1f(U.uGolpe, golpe);
    /* los puntos se apagan a medida que aparece la foto nítida */
    gl.uniform1f(U.uVelo, Math.max(0, 1 - nitidez * 1.25));

    gl.drawArrays(gl.POINTS, 0, totalPuntos);
  }

})();
