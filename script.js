// Muestra el año actual en el pie de página automáticamente.
document.getElementById("year").textContent = new Date().getFullYear();

// Botón flotante de WhatsApp (abajo a la izquierda, en todas las páginas).
const wa = document.createElement("a");
wa.className = "wa-float";
wa.href = "https://wa.me/525525228756?text=" + encodeURIComponent("Hola Cecy, vengo de cecybau.com y me gustaría platicar contigo");
wa.target = "_blank";
wa.rel = "noopener";
wa.setAttribute("aria-label", "Escríbeme por WhatsApp");
wa.title = "Escríbeme por WhatsApp";
wa.innerHTML = '<svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4 29l7.3-2.3c1.5.8 3.1 1.2 4.7 1.2 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.8c-1.5 0-3-.4-4.3-1.1l-.3-.2-4.3 1.4 1.4-4.2-.2-.3c-1.3-1.6-2-3.6-2-5.6 0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.5 10-9.9 10zm5.4-7.3c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1c-.3-.1-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1s0-.4.1-.6c.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5s0-.4 0-.5c-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>';
document.body.appendChild(wa);

// Lightbox: clic en una obra para verla en grande.
const obras = document.querySelectorAll(".card img");
if (obras.length) {
  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.innerHTML = '<figure><img alt="" /><figcaption></figcaption><span class="lightbox__close" aria-label="Cerrar">&times;</span></figure>';
  document.body.appendChild(overlay);

  const big = overlay.querySelector("img");
  const cap = overlay.querySelector("figcaption");

  obras.forEach((img) => {
    img.addEventListener("click", () => {
      big.src = img.src;
      big.alt = img.alt;
      const ficha = img.closest(".card").querySelector("figcaption");
      const titulo = ficha.querySelector("strong");
      const datos = ficha.querySelector("span");
      cap.textContent = (titulo ? titulo.textContent : "") + (datos ? " — " + datos.textContent : "");
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });

  const cerrar = () => {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  };
  overlay.addEventListener("click", cerrar);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });
}
