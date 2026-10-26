# Memoria de Codex — Brickell’s

Actualizada el 26 de octubre de 2026.

## Proyecto y decisiones aceptadas

- Repositorio: `GaryPoui/Garayzar-Tomas-Brickwell`, rama de trabajo `main`. Verificar siempre el checkout y los cambios pendientes antes de continuar.
- El producto actual es un espacio de gestión de reservas. React + Vite en `frontend`; Express MVC en `backend`. El inicio redirige a `/reservas`; también existen `/agenda`, `/reservas/nueva` y `/reservas/:id/editar`.
- El usuario pidió un rediseño integral y autorizó reemplazar las decisiones estéticas anteriores. El brief utilizado fue `Prompt_rediseno_Brickells (1).md`, entregado desde Descargas. Las decisiones implementadas están resumidas en `frontend/design-review/README.md` para no depender de ese archivo externo.
- Se leyeron `2.Modelo del dominio.md` y los tres Word incorporados al repositorio, incluidas sus imágenes. El entregable anterior plantea una landing; el brief nuevo mantiene la gestión de reservas. El documento final contempla funciones futuras que la API todavía no implementa.
- Identidad implementada: azul tinta `#1A2540`, cobre `#A7432D`, fondo `#F4F6FA`, superficies blancas. Variables semánticas `--color-*` en `frontend/src/styles/global.css`; estructura en `layout.css` y pantallas en `reservas.css`.
- Manrope local para datos y formularios; Georgia para la marca. Sin fotografía de ambientación ni eslóganes repetidos en el panel. Estados con etiquetas explícitas y colores independientes de la marca; eliminación con tratamiento propio.
- Se instalaron y leyeron `frontend-design`, `webapp-testing` y `web-design-guidelines`. Su instalación pertenece al entorno personal de Codex; no se copian esas instalaciones al repositorio.
- Se consultaron SevenRooms, Death & Co, Linear y las guías de Vercel. OpenTable permitió consultar contenido textual pero falló al cargar visualmente en Chromium; no afirmar que se inspeccionó su interfaz visual.

## Contrato que debe conservarse

- CRUD real de reservas en `/api/reservas`, con respuestas `{ success, data }` y errores `{ success: false, message }`. Las peticiones se centralizan en `frontend/src/services/reservaService.js`.
- El backend almacena reservas en memoria: reiniciarlo elimina los registros. No sustituirlo con datos ficticios o almacenamiento local.
- No existen endpoints de catálogo. Cliente, sector y paquete se ingresan por ID con ayudas; no inventar nombres ni equivalencias.
- Conservar los cinco estados, ARS con formato argentino, fecha de alta desde mañana, horario válido, IDs enteros positivos, importes finitos no negativos y anticipo no mayor que el total.
- En edición se omite la fecha del PUT cuando no cambió, permitiendo modificar otros datos de reservas pasadas.
- Agenda: desde hoy, sin canceladas, por fecha y horario. No representa disponibilidad ni capacidad.
- Mantener filtros y paginación en la URL, consultas cancelables, controles bloqueados durante envíos, foco de diálogos, Escape, retorno del foco y confirmación de eliminación.
- El alcance del rediseño no incorpora autenticación, pagos, eventos ni permisos que todavía no estén implementados.

## Ejecución y comprobación

Requiere Node.js 22.12 o superior. Desde la raíz, iniciar en terminales separadas:

```bash
npm --prefix backend start
npm --prefix frontend run dev
```

Frontend en `http://localhost:5173`; API en `http://localhost:3000/api/reservas`. Verificar también `/api/reservas` a través del proxy del frontend. Los procesos deben comprobarse en cada nueva sesión: esta memoria no garantiza que sigan activos.

Controles ejecutados correctamente al cerrar el rediseño:

```bash
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run format:check
npm --prefix frontend run build
npm --prefix frontend run test:e2e
git diff --check
```

- Las seis E2E usan una API aislada en 3101 y Vite en 5175; esos puertos deben estar libres. No reutilizar el backend habitual para datos de prueba.
- Se comprobaron 320, 390, 768, 1280 y 1440 px: listado vacío/cargado, agenda y formulario con errores sin desborde horizontal global. Axe no detectó problemas en los estados cubiertos; esto no acredita una auditoría manual integral.
- Capturas entregables y decisiones: `frontend/design-review/`. Los datos fotografiados provienen de la API temporal de pruebas; el servidor habitual no recibió reservas de demostración.
- Capturas adicionales: `frontend/test-results`, ignorado por Git y regenerado por las E2E. Antes de capturar, esperar el encabezado y las filas de la ruta destino y volver al inicio de la página.
- Para capturas de solo lectura del servidor habitual: desde `frontend`, ejecutar `node design-review/capture.mjs` con ambos servicios activos.

## Publicación y continuidad

- El usuario pidió guardar esta memoria y subirla al repositorio junto con todos los cambios del rediseño.
- Incluir código, documentación, capturas entregables y esta memoria; conservar las exclusiones existentes para dependencias, builds, archivos de entorno y resultados temporales.
- La nota equivalente de memoria personal de Codex debe guardarse como un archivo nuevo en `~/.codex/memories/extensions/ad_hoc/notes/`; no editar directamente el registro de memorias.
- Después de publicar, verificar que el commit local coincide con `origin/main` y que el árbol queda limpio. No confundir un push a GitHub con un despliegue web.
