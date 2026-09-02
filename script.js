/* Cecilia Bautista — propuesta editorial */

// Año del pie
var y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();

// Nav: borde sutil al hacer scroll
var nav = document.getElementById("nav");
if (nav) {
  var onScroll = function () {
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// Menú móvil
var toggle = document.querySelector(".nav-toggle");
var links = document.querySelector(".nav-links");
if (toggle && links) {
  var setMenu = function (open) {
    links.classList.toggle("open", open);
    if (nav) nav.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "✕" : "☰";
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Menú");
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", function () {
    setMenu(!links.classList.contains("open"));
  });
  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
}

// Aparición suave (fade-up) al entrar en pantalla.
// Nada puede quedarse invisible: lo que ya está en pantalla se muestra de
// inmediato, y por si algo falla, a los 3 segundos se muestra todo.
var reveals = document.querySelectorAll(".reveal");

function mostrarLoVisible() {
  reveals.forEach(function (el) {
    if (el.classList.contains("in")) return;
    var r = el.getBoundingClientRect();
    if (r.top < (window.innerHeight || 0) && r.bottom > 0) el.classList.add("in");
  });
}

function mostrarTodo() {
  reveals.forEach(function (el) { el.classList.add("in"); });
}

if (reveals.length) {
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });

    mostrarLoVisible();
    window.addEventListener("load", mostrarLoVisible);
    window.addEventListener("resize", mostrarLoVisible, { passive: true });
    window.addEventListener("scroll", mostrarLoVisible, { passive: true });
    setTimeout(mostrarTodo, 3000);
  } else {
    mostrarTodo();
  }
}

// Ficha de obra (lightbox) — lee datos de data-* en la obra.
// Es un diálogo modal accesible: se abre con clic o con teclado, atrapa el
// foco mientras está abierto y lo devuelve a donde estaba al cerrarse.
var pieces = document.querySelectorAll("[data-lb]");
if (pieces.length) {
  var lb = document.createElement("div");
  lb.className = "lb";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-labelledby", "lb-titulo");
  lb.setAttribute("tabindex", "-1");
  lb.hidden = true;
  lb.innerHTML =
    '<button class="lb__close" type="button" aria-label="Cerrar la ficha de la obra">&times;</button>' +
    '<div class="lb__inner">' +
      '<div class="lb__img"><img alt="" /></div>' +
      '<div class="lb__meta">' +
        '<h3 id="lb-titulo"></h3><dl></dl>' +
        '<a class="btn-line lb__inq" target="_blank" rel="noopener">Preguntar por esta obra</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(lb);

  var lbImg = lb.querySelector(".lb__img img");
  var lbTitle = lb.querySelector("h3");
  var lbDl = lb.querySelector("dl");
  var lbInq = lb.querySelector(".lb__inq");
  var lbClose = lb.querySelector(".lb__close");
  var waBase = "https://wa.me/525525228756?text=";
  var ultimoDisparador = null;

  var rows = function (data) {
    var out = "";
    [
      ["Año", data.year],
      ["Técnica", data.medium],
      ["Medidas", data.size],
      ["Precio", data.price],
      ["Disponibilidad", data.status],
    ].forEach(function (r) {
      if (r[1]) out += '<div class="row"><span class="k">' + r[0] + "</span>" + r[1] + "</div>";
    });
    return out;
  };

  // Todo lo que está fuera del diálogo deja de ser navegable con Tab
  var fondo = function (apagado) {
    [].forEach.call(document.body.children, function (el) {
      if (el === lb) return;
      if (el.tagName === "SCRIPT") return;
      if (apagado) {
        el.setAttribute("aria-hidden", "true");
        if ("inert" in el) el.inert = true;
      } else {
        el.removeAttribute("aria-hidden");
        if ("inert" in el) el.inert = false;
      }
    });
  };

  var enfocables = function () {
    return [].filter.call(
      lb.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null || el === lbClose; }
    );
  };

  var open = function (el) {
    var d = el.dataset;
    var img = el.querySelector("img");
    ultimoDisparador = document.activeElement;
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    // hereda las medidas para que la ficha no brinque al cargar
    if (img.getAttribute("width")) lbImg.setAttribute("width", img.getAttribute("width"));
    if (img.getAttribute("height")) lbImg.setAttribute("height", img.getAttribute("height"));
    lbTitle.textContent = d.title || "";
    lbDl.innerHTML = rows(d);
    lbInq.href = waBase + encodeURIComponent(
      "Hola Cecilia, me interesa la obra “" + (d.title || "") + "”. ¿Me cuentas sobre su disponibilidad?"
    );
    lbInq.setAttribute("aria-label", "Preguntar por “" + (d.title || "") + "” por WhatsApp");
    lb.hidden = false;
    void lb.offsetWidth;          // fuerza el reflujo para que corra la transición
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    // el foco entra primero: si apagamos el fondo antes, el navegador
    // quita el foco del disparador y se va al <body>
    lb.focus();
    fondo(true);
  };

  var close = function () {
    if (lb.hidden) return;
    lb.classList.remove("open");
    document.body.style.overflow = "";
    fondo(false);
    if (ultimoDisparador && ultimoDisparador.focus) ultimoDisparador.focus();
    ultimoDisparador = null;
    // se oculta del todo al terminar el desvanecido
    setTimeout(function () {
      if (!lb.classList.contains("open")) lb.hidden = true;
    }, 360);
  };

  // Cada obra abre su ficha: con clic en la imagen o con el botón "Ver detalles"
  pieces.forEach(function (el) {
    el.style.cursor = "zoom-in";
    el.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) return;   // respeta enlaces reales
      ev.preventDefault();
      open(el);
    });
    var boton = el.querySelector("[data-lb-btn]");
    if (boton) {
      boton.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        open(el);
      });
    }
  });

  lbClose.addEventListener("click", close);
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });

  lb.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    var f = enfocables();
    if (!f.length) { e.preventDefault(); return; }
    var primero = f[0], ultimo = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === lb)) {
      e.preventDefault(); ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault(); primero.focus();
    }
  });
}

// Filtros de la galería — sin recargar la página y manejables con teclado
var filtros = document.querySelector("[data-filtros]");
if (filtros) {
  var botones = filtros.querySelectorAll(".filtros__btn");
  var secciones = document.querySelectorAll("[data-tecnica]");
  var aviso = document.querySelector("[data-filtros-vacio]");

  var aplicar = function (filtro) {
    var visibles = 0;
    secciones.forEach(function (sec) {
      var obras = sec.querySelectorAll(".obra");
      var mostradas = 0;
      obras.forEach(function (obra) {
        var ok =
          filtro === "todas" ||
          (filtro === "disponibles"
            ? (obra.dataset.status || "").toLowerCase() === "disponible"
            : sec.dataset.tecnica === filtro);
        obra.hidden = !ok;
        if (ok) mostradas++;
      });
      // Una sección sin obras visibles se oculta entera, salvo en "Todas",
      // donde se conserva su nota de "Próximamente".
      var soon = sec.querySelector(".tecnica__soon");
      var conservar = filtro === "todas" || (soon && sec.dataset.tecnica === filtro);
      sec.hidden = mostradas === 0 && !conservar;
      if (!sec.hidden) visibles += mostradas;
    });
    if (aviso) aviso.hidden = visibles > 0;
  };

  botones.forEach(function (b) {
    b.addEventListener("click", function () {
      botones.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      aplicar(b.dataset.filtro);
    });
  });
}

// Botón flotante de WhatsApp (discreto)
var wa = document.createElement("a");
wa.className = "wa-float";
wa.href = waFloatHref();
wa.target = "_blank";
wa.rel = "noopener";
wa.setAttribute("aria-label", "WhatsApp");
wa.title = "WhatsApp";
wa.innerHTML =
  '<svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4 29l7.3-2.3c1.5.8 3.1 1.2 4.7 1.2 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.8c-1.5 0-3-.4-4.3-1.1l-.3-.2-4.3 1.4 1.4-4.2-.2-.3c-1.3-1.6-2-3.6-2-5.6 0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.5 10-9.9 10zm5.4-7.3c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1c-.3-.1-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1s0-.4.1-.6c.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5s0-.4 0-.5c-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>';
document.body.appendChild(wa);

function waFloatHref() {
  return "https://wa.me/525525228756?text=" +
    encodeURIComponent("Hola Cecilia, vengo de cecybau.com y me gustaría platicar contigo");
}
