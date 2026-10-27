# BRICKWEEL · Sitio público y reservas

Aplicación React + Vite conectada con la API de la Entrega 2. El código de la aplicación y sus pruebas están dentro de `src`; la configuración de las herramientas permanece en la raíz de `frontend`.

## Portada pública

El inicio presenta BRICKWEEL como una escena 3D casi de pantalla completa, con letras de frente negro, cantos iridiscentes y gran profundidad inspiradas en DEEO. Las letras se distribuyen en dos filas en horizontal y tres en vertical, con recortes intencionales en los bordes, y pasan detrás del header transparente, sin franja ni línea divisoria. El título se inclina suavemente hacia el mouse, incluso sobre la navegación, y vuelve al centro al salir de la escena; permanece inmóvil con movimiento reducido y en interacción táctil. Debajo continúan las fotografías de noche, una carta de tragos que se abre al hacer scroll y una sección final de reservas. El header enlaza La noche, Tragos y Reservas. La carta filtra por categoría y muestra fotos, ingredientes y descripciones; funciona con teclado y respeta la preferencia de movimiento reducido.

`HomePage.jsx`, `HeroWordmark.jsx`, `CocktailMenu.jsx` y `home.css` contienen esta experiencia. Three.js y la fuente Helvetiker Bold local se cargan bajo demanda para el título; se conserva un nombre visible si WebGL no está disponible. El render se detiene cuando el título sale de pantalla o la pestaña queda oculta. Las cinco fotografías y las fuentes se sirven localmente. La selección de tragos es una propuesta editorial sin precios, pendiente de validación por el local. Las imágenes son de ambientación. Referencias, fuentes y decisiones: [landing-direction.md](design-review/landing-direction.md).

La portada funciona sin la API. El formulario, el listado y la agenda conservan la integración real con Express. La navegación usa HashRouter para que los enlaces directos y la recarga funcionen en GitHub Pages: `/#/reservas`, `/#/agenda` y `/#/reservas/nueva` bajo la URL base del proyecto.

## Ejecución independiente

Requisito: Node.js 22.12 o superior (probado con Node.js 24) y npm.

Desde la raíz del repositorio, en una terminal:

```bash
npm --prefix backend install
npm --prefix backend start
```

En otra terminal:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Abrir http://localhost:5173/Garayzar-Tomas-Brickwell/. Si el puerto está ocupado, Vite informa otro disponible. La API se inicia en http://localhost:3000. Las páginas de reservas informan el error y permiten reintentar si la API no está disponible.

## Organización

```text
frontend/
	src/
		assets/       Fotografía local de ambientación.
		components/   Layout, campos, botones, estados, notificaciones y diálogos.
		pages/        Listado/agenda y formulario de alta/edición.
		services/     Peticiones HTTP y procesamiento de respuestas de la API.
		utils/        Validaciones, fechas, importes, filtros y contextos compartidos.
		styles/       Estilos generales, estructura y reservas.
		tests/        Pruebas de navegador y accesibilidad.
		App.jsx       Proveedores y navegación.
		main.jsx      Entrada React, tipografías y estilos.
```

Las pruebas unitarias están junto al servicio y las funciones que verifican. La agenda reutiliza el listado, los filtros y los diálogos; alta y edición comparten el mismo formulario. No se incluyen reservas ficticias en la aplicación.

## Pantallas y operaciones

- `/reservas`: resumen calculado con datos reales, listado, búsqueda por ID de reserva/cliente/sector/paquete, filtros por fecha y estado, y paginación de ocho registros.
- `/agenda`: reservas desde hoy, agrupadas por fecha y sin canceladas.
- `/reservas/nueva`: creación con estado inicial `PENDIENTE` asignado por el servidor.
- `/reservas/:id/editar`: consulta individual y modificación de datos y estado.
- El detalle consulta `GET /api/reservas/:id`; eliminar requiere confirmar en un diálogo.
- Las rutas inexistentes muestran una pantalla de recuperación.

Los filtros quedan en la URL. Se muestran estados de carga, listados vacíos, errores de red/API y notificaciones de éxito. Los controles se bloquean durante un envío. Las consultas tienen un límite de 15 segundos y se cancelan al abandonar la pantalla.

## Integración

`src/services/reservaService.js` centraliza los cinco endpoints `GET`, `POST`, `PUT` y `DELETE` de `/api/reservas`. Interpreta `{ success, data }` y conserva los mensajes `{ success: false, message }`. No hay llamadas a `fetch` en componentes o páginas.

Por defecto se utiliza `/api` y el proxy de Vite apunta a `http://localhost:3000`, tanto en desarrollo como en preview. Esto permite usar el backend original sin modificar su configuración CORS.

Variables opcionales en `frontend/.env.local`:

```dotenv
API_PROXY_TARGET=http://localhost:3000
VITE_API_URL=/api
```

Reiniciar Vite después de cambiarlas. `API_PROXY_TARGET` solo configura el proxy; `VITE_API_URL` es pública y nunca debe contener secretos. Para apuntar directamente a otro origen, ese servidor deberá permitir CORS.

## Validación y accesibilidad

- Campos obligatorios con `label`, errores asociados mediante `aria-describedby` y `aria-invalid`, foco en el primer error y notificación común.
- Fecha de alta desde mañana, horario válido, IDs enteros positivos e importes finitos no negativos.
- Como protección del formulario, el anticipo no puede superar el total.
- Al editar, una fecha que no cambió se omite del `PUT`: permite actualizar reservas pasadas según el contrato del backend.
- HTML semántico, navegación activa, enlace para saltar al contenido y foco visible.
- Diálogos nativos con foco contenido, Escape, retorno al control de origen y foco inicial en conservar al eliminar.
- Notificaciones dentro del diálogo cuando está abierto, anunciadas con `role="alert"` o `role="status"`.
- Estados con texto además de color, iconos con nombres accesibles, imagen con alternativa textual y respeto por movimiento reducido.
- Diseño responsivo probado entre 320 y 1440 px; auditoría automatizada axe para reglas WCAG A/AA en los estados cubiertos. No reemplaza una auditoría manual integral.

## Diseño e identidad

La portada del 27/10/2026 sigue el nuevo pedido basado en DEEO Studio: negro, volumen 3D con cantos de color sin acabado plateado, fotografías grandes y carta con aspecto de libro. Helvetiker Bold para el título 3D, Barlow Condensed para el resto de la marca, Georgia para los títulos editoriales y Manrope para navegación y textos. La carta destaca BRICKWELL en la tapa y abre en 2,8 segundos; con movimiento reducido no se anima. El resto del sitio conserva la marca BRICKWEEL. Las capturas están en `design-review/home-*.png` y `design-review/carta-*.png`.

### Área de reservas

El área de reservas continúa el lenguaje de la portada: fondo negro `#080809`, superficies `#141416`, texto claro y acciones verde pálido `#D3EFB1`. La navegación superior sustituye a la barra lateral, el resumen se presenta como una franja de datos y el listado y el formulario usan secciones abiertas, sin paneles blancos. Los diálogos y las notificaciones, incluidos los portales, comparten el tema oscuro. Las variables semánticas `--color-*` están en `src/styles/global.css`; `layout.css` define la estructura y `reservas.css` las vistas operativas. Los estados tienen etiquetas y colores propios; las acciones destructivas se distinguen en rosa.

Manrope se sirve localmente para datos y formularios, Georgia para títulos y Barlow Condensed para la marca, que permite volver al sitio público. Las fotos se muestran en la portada. Este rediseño de reservas no agrega dependencias ni modifica el contrato de la API.

El listado reúne búsqueda, fecha y estado, muestra los filtros activos y conserva los parámetros en la URL. La agenda agrupa por fecha las reservas desde hoy sin canceladas. El formulario organiza fecha/horario, referencias e importes, con un resumen que pasa debajo de los campos en móvil. Los IDs se explican sin inventar catálogos.

El panel se implementó a partir de los tres Word incorporados al repositorio, sus imágenes y el modelo del dominio. Ese alcance anterior priorizaba la gestión; el pedido del 27/10 añade la portada pública como inicio. El documento final también describe funciones futuras que la API todavía no implementa, incluidos autenticación, eventos, disponibilidad y pagos.

La dirección, las referencias consultadas y las limitaciones están documentadas en [design-review/README.md](design-review/README.md). Allí también se enlazan las capturas del rediseño.

## Alcance del backend

La API existente solamente implementa el CRUD de reservas. Clientes, sectores y paquetes se ingresan por ID porque no hay endpoints de catálogo. La carta de la portada es contenido editorial estático. No se simulan eventos, entradas, autenticación ni disponibilidad. Incorporar la gestión de esos módulos requiere desarrollar sus APIs.

Las reservas se almacenan en memoria: reiniciar el backend elimina los datos. El frontend no agrega persistencia local para ocultar esa limitación. La validación visual no sustituye las validaciones ni la autorización que necesite el servidor en producción.

## Verificación

Desde `frontend`:

```bash
npm test
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Las pruebas E2E inician una API aislada en el puerto 3101 y otro Vite en el 5175, sin reutilizar servidores existentes. Ambos puertos deben estar libres y las dependencias del backend instaladas. Se comprueban CRUD, validaciones, filtros, agenda, carga, fallos y reintentos, errores dentro del diálogo, paginación, historial, accesibilidad y tamaños móviles/escritorio. Los datos de prueba se eliminan de esa API temporal; no se toca la API del puerto 3000. Las capturas se generan en `test-results` (ignorado por Git).

`npm run format` aplica formato al código del frontend.

## Build y despliegue

```bash
npm run build
npm run preview
```

Preview sirve el build local y utiliza el mismo proxy, con la API encendida. `.github/workflows/pages.yml` compila y publica `frontend/dist` al actualizar `main`. Pages debe tener **GitHub Actions** como fuente y no necesita dominio personalizado. La base de Vite es `/Garayzar-Tomas-Brickwell/` y las rutas usan hash.

GitHub Pages no ejecuta Express ni el proxy de Vite. Para habilitar reservas en producción, alojar la API por separado, permitir CORS desde `https://garypoui.github.io` y definir la variable del repositorio `VITE_API_URL` con su URL HTTPS terminada en `/api`. Volver a ejecutar el workflow después de cambiarla. Es una URL pública, no un secreto.
