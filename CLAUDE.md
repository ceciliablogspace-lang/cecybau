# Sitio de Cecilia Bautista — cecybau.com

## Quién es la usuaria
Cecilia Bautista ("Cecy") es **artista visual** (arquitecta, pintora e ilustradora, CDMX). **No sabe programar**: háblale en español, explica con pasos simples y clics exactos, nada de jerga técnica. Ella pide cambios en el chat y Claude hace todo el código.

## Qué es este proyecto
Portafolio y tienda de arte de Cecilia. Sitio **HTML/CSS/JS estático puro** (sin frameworks, sin build).

- **Dominio**: cecybau.com (comprado en Squarespace; DNS ya apunta a Vercel — no tocar).
- **Hosting**: Vercel, proyecto `cecybau`, auto-deploy desde la rama `main`.
- **Flujo de trabajo**: editar archivos → commit → `git push` a `main` → Vercel publica en ~20 s. Push directo a main está bien (así trabaja ella).

## Estructura
- `index.html` — inicio: chorros de acuarela animados (rectos, NO "orgánicos": ya se probó y no le gustó), nombre, CTA, obra Colibrí, noticias.
- `galeria.html` — 24 obras en 3 secciones (Pintura / Grabado / Formato pequeño) con ficha, precio y badge "Disponible". Imágenes en `images/obras/`.
- `noticias.html`, `eventos.html` (placeholder "próximamente"), `sobre-mi.html` (bio + foto), `contacto.html`.
- `script.js` — año del footer, lightbox de obras, botón flotante de WhatsApp.
- `styles.css` — todo el estilo. Paleta: fondo blanco, tinta #2b2622, acento terracota #c47a6d, tipografías Cormorant Garamond + Jost.

## Reglas del contenido
- **Marca**: "Cecilia Bautista" (nombre completo, lo prefiere; NO "Cecy Bau" en textos).
- **Precios**: son los del dossier ×1.5, con nota "no incluyen envío". Si ella da un precio nuevo, aplicar también ×1.5 salvo que diga lo contrario.
- **Ventas**: WhatsApp 5525228756 (wa.me/525525228756) vía botón flotante abajo-izquierda; sin botones de compra por obra (le parecen intrusivos).
- **Instagram**: @ceci_ly (footer y contacto).
- **Correo**: ceciliablogspace@gmail.com.
- Cuando venda una obra: cambiar badge a "Vendida" (clase `.badge--sold` ya existe).

## Pendientes conocidos
- Confirmar precio de "Oponente" (dossier decía "$2,0000"; en web está $3,000).
- Página de Encargos/Comisiones (ella dará detalles).
- Fotos profesionales de obra cuando las tenga.
