// Muestra el año actual en el pie de página automáticamente.
document.getElementById("year").textContent = new Date().getFullYear();

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
