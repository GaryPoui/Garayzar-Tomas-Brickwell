# Brickell's · Frontend de reservas

Aplicación React + Vite conectada con la API de la Entrega 2. El código de la aplicación y sus pruebas están dentro de `src`; la configuración de las herramientas permanece en la raíz de `frontend`.

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

Abrir http://localhost:5173. Si el puerto está ocupado, Vite informa otro disponible. La API se inicia en http://localhost:3000. El frontend se ejecuta por separado: si la API no está disponible, informa el error y permite reintentar.

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

## Diseño y boceto pendiente

Se revisaron los 29 archivos originales del repositorio, incluidos todos los modelos y la documentación. La carpeta `frontend` estaba vacía; no había un boceto, enlace al diseño, logotipo ni imágenes del negocio entre los archivos disponibles. Por eso **no es posible certificar fidelidad al boceto original**. Esta propuesta debe contrastarse con ese material cuando se incorpore, antes de dar por cumplido ese criterio de evaluación.

La propuesta conserva el nombre Brickell's y el dominio de pub/boliche: marca tipográfica, navegación oscura, superficies claras, acción principal verde lima y tonos diferenciados por estado. La vista inicial es la gestión de reservas, no una landing. Las filas se reorganizan en móvil y los formularios tienen un resumen de importes. Los estilos y recursos están separados para permitir adaptar el diseño sin cambiar la integración.

La fotografía `src/assets/bar.jpg` es de ambientación y **no representa una foto verificada del local**. Fuente: [Unsplash](https://images.unsplash.com/photo-1514933651103-005eec06c04b). Las tipografías Manrope y Barlow Condensed se sirven localmente mediante Fontsource; los iconos son de Lucide.

## Alcance del backend

La API existente solamente implementa el CRUD de reservas. Clientes, sectores y paquetes se ingresan por ID porque no hay endpoints de catálogo. No se simulan eventos, entradas, carta, autenticación ni disponibilidad. Estos modelos existen, pero incorporar sus pantallas operativas requiere desarrollar sus APIs.

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

Preview sirve el build local y utiliza el mismo proxy, con la API encendida. Para un despliegue real, publicar `dist`, redirigir las rutas del frontend a `index.html` y configurar `/api` hacia el backend en el servidor web. El proxy de Vite no forma parte de los archivos estáticos generados.
