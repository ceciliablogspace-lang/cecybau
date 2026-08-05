# Sitio de Cecilia Bautista — cecybau.com

## Quién es la usuaria
Cecilia Bautista ("Cecy") es **artista visual** (arquitecta, pintora e ilustradora, CDMX). **No sabe programar**: háblale en español, explica con pasos simples y clics exactos, nada de jerga técnica. Ella pide cambios en el chat y Claude hace todo el código.

## Qué es este proyecto
Portafolio y tienda de arte de Cecilia. Sitio **HTML/CSS/JS estático puro** (sin frameworks, sin build).

- **Dominio**: cecybau.com (comprado en Squarespace; DNS ya apunta a Vercel — no tocar).
- **Hosting**: Vercel, proyecto `cecybau`, auto-deploy desde la rama `main`.
- **Flujo de trabajo**: editar archivos → commit → `git push` a `main` → Vercel publica en ~20 s. Push directo a main está bien (así trabaja ella).

## Estructura
- `index.html` — inicio: chorros de acuarela animados (rectos, NO "orgánicos": ya se probó y no le gustó), nombre, CTA y noticias. (La obra destacada "Colibrí" se quitó a petición suya.)
- `galeria.html` — 4 secciones por técnica: **Acuarela / Óleo / Grabado / Vidrio y cerámica**. Las secciones sin obra llevan `<p class="page-sub">Próximamente</p>`. Imágenes en `images/obras/`.
  - Se vaciaron las 24 obras viejas (sus fotos siguen en `images/obras/` por si las pide de vuelta).
  - Actualmente publicadas solo 3 óleos de 2026: Música y viento I, Abriendo la noche, Música y viento II.
- `eventos.html` (placeholder "próximamente"), `sobre-mi.html` (bio + foto), `contacto.html`.
- `noticias.html` sigue en el repo pero **fuera del menú** (Cecy pidió quitar la pestaña de Noticias). Tampoco está en el sitemap. El bloque de noticias del inicio sí se quedó.
- `script.js` — año del footer, lightbox de obras, botón flotante de WhatsApp.
- `styles.css` — todo el estilo. Paleta: fondo blanco, tinta #2b2622, acento terracota #c47a6d, tipografías Cormorant Garamond + Jost.

## Reglas del contenido
- **Marca**: "Cecilia Bautista" (nombre completo, lo prefiere; NO "Cecy Bau" en textos).
- **Precios**: los del dossier van ×1.5. Si da un precio nuevo, preguntar/confirmar si ya es precio final de web (en las obras de 2026 los dio finales, sin ×1.5). Nota actual de la galería: "Los precios incluyen el marco y no incluyen envío".
- **Ventas**: WhatsApp 5525228756 (wa.me/525525228756) vía botón flotante abajo-derecha; sin botones de compra por obra (le parecen intrusivos).
- **Instagram**: @ceci_ly (footer y contacto).
- **Correo**: ceciliablogspace@gmail.com.
- Cuando venda una obra: cambiar badge a "Vendida" (clase `.badge--sold` ya existe).
- **Títulos**: usa números romanos (Alquimia I, Música y viento II). Prefiere "Música y viento", no "Música de viento".

## Cómo recibir sus fotos (importante)
Cecy manda las fotos desde el celular y **no llegan como archivo** a `/root/.claude/uploads/`.
Sí quedan embebidas en base64 en el transcript de la sesión:
`/root/.claude/projects/-home-user-cecybau/<session-id>.jsonl` → bloques `{"type":"image","source":{"type":"base64",...}}`.
Extraerlas de ahí con Python, convertir a JPG (máx 1600 px, calidad 88) y guardar en `images/obras/`.
No pedirle que las descargue: su celular no tiene espacio y Drive/Google están bloqueados por el proxy de red.

## Verificar antes de publicar
`python3 -m http.server 8899` + Playwright (`executablePath: '/opt/pw-browsers/chromium'`) para revisar en compu y celular antes de hacer push.

## Pendientes conocidos
- Va a subir más obra enmarcada (acuarela, grabado, vidrio y cerámica) — las secciones ya están listas.
- Los 3 óleos publicados traen marcos distintos (negro grueso / negro con lino / madera clara). Se le sugirió unificar; ella decide.
- Página de Encargos/Comisiones (ella dará detalles).
- Si repone obra vieja: confirmar precio de "Oponente" (dossier decía "$2,0000"; en web estaba $3,000).
