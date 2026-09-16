# Sitio de Cecilia Bautista — cecybau.com

## Quién es la usuaria
Cecilia Bautista ("Cecy") es **artista visual** (arquitecta, pintora e ilustradora, CDMX). **No sabe programar**: háblale en español, explica con pasos simples y clics exactos, nada de jerga técnica. Ella pide cambios en el chat y Claude hace todo el código.

## Qué es este proyecto
Portafolio y tienda de arte de Cecilia. Sitio **HTML/CSS/JS estático puro** (sin frameworks, sin build).

- **Dominio**: cecybau.com (comprado en Squarespace; DNS ya apunta a Vercel — no tocar).
- **Hosting**: Vercel, proyecto `cecybau`, auto-deploy desde la rama `main`.
- **Flujo de trabajo**: editar archivos → commit → `git push` a `main` → Vercel publica en ~20 s. Push directo a main está bien (así trabaja ella).

## Estructura
El sitio se remodeló (diseño editorial, agosto 2026). Tipografías **Inter + Newsreader**,
fondo blanco cálido #fdfcfa, tinta #1b1a18. Todo en español, con las mismas direcciones de antes.

- `index.html` — inicio: nombre, una obra grande ("Torito" óleo), selección de obra,
  próxima exposición y bloque de Sobre mí. (Ya no hay chorros de acuarela ni noticias.)
- `galeria.html` — 4 secciones por técnica: **Acuarela / Óleo / Grabado / Vidrio y cerámica**,
  con medidas, año y precio. Al dar clic se abre la ficha (lightbox) con año, técnica, medidas,
  precio, disponibilidad y botón "Preguntar por esta obra" que abre WhatsApp con el título.
  Las secciones sin obra llevan `<p class="tecnica__soon">Próximamente</p>`.
- `eventos.html` — exposición Identidad Íntima (Helena Café, 5 de septiembre).
- `sobre-mi.html` (bio + foto), `contacto.html` ("Hablemos" + WhatsApp / correo / Instagram).
- `styles.css` y `script.js` — diseño nuevo. El JS trae: menú de celular a pantalla completa
  (quita el backdrop-filter al abrir, si no queda encerrado en la barra), aparición fade-up
  que NO depende del scroll, ficha de obra y botón flotante de WhatsApp (abajo-derecha).
- `anterior/` — copia completa del sitio viejo (incluye `noticias.html`), bloqueada en
  robots.txt. Es el respaldo visible: cecybau.com/anterior/.
- Obra publicada: Acuarela 1 · Óleo 6 · Grabado 3 · Vidrio y cerámica 3 (Luchador $450, Música y viento $450, Torito $500 — precios confirmados por Cecilia, sep 2026; Torito con foto en altar de cempasúchil). Fotos en `images/obras/`
  (las 24 obras viejas siguen ahí por si las pide de vuelta).

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

## Al agregar una obra nueva a la galería (importante)
Cada `<figure class="obra">` necesita, además de la foto:
- `width` y `height` en el `<img>` (medidas reales del archivo; evitan que la página brinque).
- Un `<button class="obra__ver" type="button" data-lb-btn aria-label="Ver detalles de TÍTULO">Ver detalles</button>`
  dentro del `<figcaption>`.
- Los `data-*` (title, year, medium, size, price, status): de ahí salen la ficha
  ampliada, el mensaje de WhatsApp y los datos estructurados.
**Y hay que regenerar el bloque JSON-LD (`ItemList` de `VisualArtwork`) del `<head>` de
`galeria.html`**, que es estático y se arma leyendo esos mismos `data-*`.
Los filtros funcionan solos: la sección lleva `data-tecnica="acuarela|oleo|grabado|vidrio"`.

## Accesibilidad ya resuelta (no romper)
- Grises AA: `--muted #6f6a63` (5.2:1) y `--faint #77726a` (4.7:1) sobre `--bg`. No aclararlos.
- La ficha ampliada es un diálogo modal con foco atrapado (ver `script.js`). El CSS de `.lb`
  NO debe usar `visibility` en la transición: impide enfocar el diálogo al abrirlo.
- Cada página lleva `<link rel="canonical">` absoluto y su JSON-LD.

## Verificar antes de publicar
`python3 -m http.server 8899` + Playwright (`executablePath: '/opt/pw-browsers/chromium'`) para revisar en compu y celular antes de hacer push.

## Versión experimental (prueba, septiembre 2026)
`experimento.html` + `experimento.css` + `experimento.js` — página aparte, `noindex`,
NO toca el sitio normal. Cecy pidió algo al estilo activetheory.net.
Fondo negro, dos lienzos WebGL escritos a mano (sin librerías):
tinta viva que sigue el dedo en la portada, y las obras dibujadas con shader
(se deforman al hacer scroll, se iluminan al acercarse). En celular la obra se
ilumina sola al quedar al centro de la pantalla. Respaldos: si el aparato pide
menos movimiento o no hay WebGL, se ven las fotos tal cual. **Está a prueba:
si a ella le gusta se vuelve el sitio principal; si no, se borran los 3 archivos.**

### Entrada experimental 2 (`experimento2.html`) — la que le gustó
Segunda prueba, **solo la portada**, también `noindex` y también aparte.
**Fondo blanco cálido `#fdfcfa` y tinta `#1b1a18`: los mismos colores de su
sitio de siempre** (ella pidió fondo blanco, no negro).

Ciclo de tres momentos, en `experimento2.js` (variable `fase`):
1. `entrando` — ~63,000 puntos con el color exacto de la pintura llegan
   volando y arman el cuadro.
2. `nitida` — **aparece la foto de verdad, nítida**, encima de los puntos
   (`<img id="nitida">`, colocada por JS justo sobre el cuadro con
   `colocarNitida()`), y los puntos se apagan con el uniform `uVelo`.
   Se queda ~5 s. **La pieza se ve completa a ~0.9 s de abrir la página**
   (empezó en ~3.7 s; Cecilia pidió acelerar dos veces porque "la gente no
   sabe esperar"). Si se vuelven a tocar los ritmos de `acercar()` en la
   máquina de fases, no pasarse de ahí.
   El cruce de puntos a foto dura ~0.3 s y `uVelo` vale `1 - nitidez`
   exacto: como los puntos y la foto están en el mismo lugar, el cruce se
   ve como si la pintura se enfocara, no como una imagen tapando a otra.
   Si a `uVelo` se le vuelve a poner un factor (1.25, etc.) la imagen se
   aclara a medio camino y se nota el cambio.
3. `saliendo` — la foto se va, los puntos se sueltan y entra la siguiente
   obra. Son 4 obras en rotación.

Al tocar: la foto se rompe en puntos, estalla y se rearma sola.
WebGL a mano con `gl.POINTS`, sin librerías. Las animaciones van por
**tiempo real** (función `acercar`), no por cuadros, para que el ritmo sea
igual en celular lento que en compu rápida.

Usa `images/experimento/*.jpg`: recortes **solo de la pintura** (sin marco ni
pared), generados con PIL a partir de las fotos originales, que no se tocaron.
Si agrega obras nuevas hay que recortarlas igual, si no se ve la pared blanca.
Respaldo (`.respaldo`): sin WebGL o con "menos movimiento", se ve la obra
quieta — su `max-height` va en **vh, no en %** (dentro de la rejilla el % no
se respeta y la foto se desbordaba tapando el nombre).

## Pendientes conocidos
- Va a subir más obra enmarcada (acuarela, grabado, vidrio y cerámica) — las secciones ya están listas.
- Los 3 óleos publicados traen marcos distintos (negro grueso / negro con lino / madera clara). Se le sugirió unificar; ella decide.
- Página de Encargos/Comisiones (ella dará detalles).
- Si repone obra vieja: confirmar precio de "Oponente" (dossier decía "$2,0000"; en web estaba $3,000).
