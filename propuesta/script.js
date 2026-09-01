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

// Aparición suave (fade-up) al entrar en pantalla
var reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && reveals.length) {
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach(function (el) { io.observe(el); });
} else {
  reveals.forEach(function (el) { el.classList.add("in"); });
}

// Ficha de obra (lightbox) — lee datos de data-* en la obra
var pieces = document.querySelectorAll("[data-lb]");
if (pieces.length) {
  var lb = document.createElement("div");
  lb.className = "lb";
  lb.innerHTML =
    '<button class="lb__close" aria-label="Cerrar">&times;</button>' +
    '<div class="lb__inner">' +
      '<div class="lb__img"><img alt="" /></div>' +
      '<div class="lb__meta">' +
        '<h3></h3><dl></dl>' +
        '<a class="btn-line lb__inq" target="_blank" rel="noopener">Preguntar por esta obra</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(lb);

  var lbImg = lb.querySelector(".lb__img img");
  var lbTitle = lb.querySelector("h3");
  var lbDl = lb.querySelector("dl");
  var lbInq = lb.querySelector(".lb__inq");
  var waBase = "https://wa.me/525525228756?text=";

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

  var open = function (el) {
    var d = el.dataset;
    lbImg.src = el.querySelector("img").src;
    lbImg.alt = el.querySelector("img").alt;
    lbTitle.textContent = d.title || "";
    lbDl.innerHTML = rows(d);
    lbInq.href = waBase + encodeURIComponent(
      "Hola Cecilia, me interesa la obra “" + (d.title || "") + "”. ¿Me cuentas sobre su disponibilidad?"
    );
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  var close = function () {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  };

  pieces.forEach(function (el) {
    el.style.cursor = "zoom-in";
    el.addEventListener("click", function (ev) {
      ev.preventDefault();
      open(el);
    });
  });
  lb.querySelector(".lb__close").addEventListener("click", close);
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
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
