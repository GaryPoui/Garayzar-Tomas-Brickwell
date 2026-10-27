# BRICKWEEL — portada pública

Pedido del 27/10/2026: reemplazar el inicio centrado en gestión por una web de boliche inspirada en https://deeo.studio/. Este pedido reemplaza el alcance visual del brief anterior.

## Dirección antes de implementar

- Negro pista `#080809`, blanco humo `#f1efe9`, plata `#b8bdc9`, violeta reflejo `#bcb0ee` y papel de carta `#eae6dd`.
- Barlow Condensed 700 para las letras metálicas y la marca; Georgia para los titulares editoriales; Manrope para navegación y lectura. Fuentes servidas localmente.
- Header fijo y discreto; nombre de nueve letras a todo el ancho; fotografía panorámica; introducción editorial alineada a la izquierda y galería asimétrica; carta que abre con scroll; reservas y pie.

```text
BRICKWEEL                            La noche  Tragos  Reservas
               B R I C K W E E L (cromo)
                    fotografía de ambiente
Una noche que se queda con vos.                 introducción
fotografía grande                     fotografía de barra
                         La carta
             [selección de tragos | foto y descripción]
Tu próxima noche empieza acá.                  Reservar una mesa
```

Revisión del concepto: conservar la tipografía escultórica y el contraste oscuro de la referencia, pero cambiar su portfolio por escenas de noche y una carta de bar. No agregar tarjetas estadísticas, secciones de agencia ni una grilla de servicios. La apertura del libro responde al scroll y tiene un botón alternativo, navegación por teclado y versión sin movimiento. Las fotos son de ambientación; no se presentan como fotos documentales del local.

## Contenido y alcance

La selección de tragos es una propuesta editorial sin precios, pendiente de validación por el local. No consulta ni representa un catálogo del backend. Las reservas llevan al formulario y al listado existentes; el backend Express sigue siendo necesario para su funcionamiento. El inicio público no dispara consultas de reservas.

Fotografías de Unsplash, descargadas para servirlas desde el sitio:

- DJ: https://images.unsplash.com/photo-1470225620780-dba8ba36b745
- Barra: https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2
- Público y luces: https://images.unsplash.com/photo-1506157786151-b8491531f063
- Tragos cítricos: https://images.unsplash.com/photo-1551024709-8f23befc6f87
- Cóctel con whisky: https://images.unsplash.com/photo-1470337458703-46ad1756a187

La referencia se inspeccionó con Chromium en 1440 × 1000, incluyendo portada y scroll. No se copiaron sus imágenes ni su implementación.

## Comprobaciones y capturas

Build, lint, formato y pruebas unitarias correctos. Ocho pruebas E2E cubren la portada sin consultas a la API, apertura por scroll, selección y filtros de tragos, teclado, menú móvil, navegación hacia reservas y regreso, imágenes cargadas, movimiento reducido y CRUD existente. Se revisaron 320, 390, 768 y 1440 px sin desborde horizontal y sin infracciones axe WCAG A/AA en los estados comprobados.

Capturas: [portada escritorio](home-desktop.png), [portada móvil](home-mobile.png), [carta escritorio](carta-desktop.png), [carta móvil](carta-mobile.png), [sitio completo escritorio](home-full-desktop.png), [sitio completo móvil](home-full-mobile.png). Se regeneran con `node design-review/capture-home.mjs` y `SITE_URL` opcional; por defecto usa el servidor de revisión en el puerto 5177.
