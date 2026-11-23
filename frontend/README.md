# Frontend de BRICKWEEL

React + Vite, HashRouter para enlaces directos compatibles con GitHub Pages. Mantiene la portada 3D, carta con apertura animada y estética oscura; integra reservas, eventos, entradas y gestión con la API real.

## Ejecutar

Desde la raíz del repositorio, en terminales separadas:

```bash
npm --prefix backend run demo
```

```bash
npm --prefix frontend run dev
```

Abrir <http://localhost:5173/Garayzar-Tomas-Brickwell/>. Instalar previamente las dependencias con `npm ci` en cada carpeta. Requiere Node 22.13 o superior.

## Pantallas

| Ruta después de `#`                                        | Función                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/`                                                        | Portada, navegación por secciones y carta consultada desde `/api/carta`.              |
| `/registro`, `/login`                                      | Registro validado y acceso.                                                           |
| `/eventos`                                                 | Calendario público, flyer y solicitud confirmada de entradas.                         |
| `/agenda`                                                  | Cliente: todas sus reservas, incluidas canceladas. Personal: próximas no canceladas.  |
| `/reservar`                                                | Reserva propia por mesa y combos.                                                     |
| `/reservas`                                                | Listado general del personal.                                                         |
| `/reservas/nueva`                                          | Personal registra una reserva a nombre de un cliente existente.                       |
| `/reservas/:id/editar`                                     | Personal modifica datos y estados permitidos; los registros cerrados son de consulta. |
| `/entradas`                                                | Entradas propias o gestión del personal: pago, ingreso y cancelación.                 |
| `/historial`                                               | Reservas, combos reservados y eventos del cliente.                                    |
| `/perfil`                                                  | Edición de datos personales.                                                          |
| `/avisos`                                                  | Avisos propios, lectura y actualización cada 30 segundos.                             |
| `/gestion/eventos`                                         | ADMIN: CRUD, publicación y estados de eventos.                                        |
| `/gestion/usuarios`                                        | ADMIN: alta de usuarios, perfil, rol y baja lógica.                                   |
| `/gestion/sectores`, `/gestion/paquetes`, `/gestion/carta` | ADMIN: catálogo.                                                                      |
| `/carta-operativa`                                         | Personal: carta; recepción solo cambia disponibilidad.                                |
| `/reportes`, `/clientes/:id/historial`                     | ADMIN: reportes e historial de clientes.                                              |
| `/configuracion`                                           | ADMIN: políticas de cancelación y reembolsos.                                         |

Los clientes no ven gestión, anticipos ni descuentos. Pueden cancelar sus reservas mediante un diálogo, respetando la política del servidor. Recepción no puede borrar definitivamente reservas ni acceder a reportes financieros o gestión de usuarios/eventos. La API aplica los mismos permisos de forma independiente de las rutas de React.

## Integración y organización

Todas las peticiones HTTP se realizan desde `src/services`:

- `apiClient.js`: URL, Bearer, cancelación, espera y formato de respuestas.
- `reservaService.js`: operaciones de reservas.
- `catalogoService.js`: disponibilidad por noche y exclusión protegida al editar.
- `negocioService.js`: carta, eventos, entradas, gestión, perfil, avisos y reportes.

`useRemote` y `useCatalogo` coordinan carga, error, cancelación de consultas y reintento mediante esos servicios. No hay `fetch` en componentes o páginas. La carta y los combos tienen una única fuente de precios en el backend; no hay un listado comercial estático en React.

La sesión se guarda en `sessionStorage` de la pestaña y se comprueba al recargar. Un 401 invalida la sesión; un fallo de conexión permite reintentar. Las peticiones de desarrollo esperan hasta 15 segundos; producción hasta 90 segundos para el arranque de Render gratuito.

El proxy de Vite apunta a `http://localhost:3000`. Variables opcionales en `frontend/.env.local`:

```dotenv
API_PROXY_TARGET=http://localhost:3000
VITE_API_URL=/api
```

En GitHub Pages se necesita `VITE_API_URL=https://tu-api/api` al compilar; no existe el proxy de Vite en el hosting estático. La API debe permitir el origen mediante CORS.

## Verificación

```bash
npm test
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright inicia API y Vite aislados en 3101 y 5175; SQLite se ejecuta en memoria y las cuentas son de prueba. La configuración es compatible con Windows y Linux. No deben estar ocupados esos puertos.

La suite incluye flujos de cuenta, CRUD de reservas, privacidad, cancelación, disponibilidad, errores y reintentos, gestión de catálogo/usuarios, calendario, entradas y pago acreditado, perfil, políticas, accesibilidad automatizada y controles de desbordes a distintos tamaños. Las capturas y trazas se generan en `test-results`, fuera de Git. La auditoría automatizada no acredita todos los criterios de accesibilidad ni sustituye la revisión visual.

## Diseño y limitaciones

Fuentes y fotografías se sirven localmente; el título 3D carga Three.js bajo demanda y respeta movimiento reducido. Se conservan teclado, foco de diálogos y notificaciones, estados de carga y confirmaciones para acciones destructivas. Las pantallas nuevas reutilizan el tema y los componentes existentes.

El mapa y las tarifas iniciales son de referencia. Las imágenes son de ambientación. No hay cobro electrónico: la entrada queda pendiente hasta que el personal acredita el pago. Los avisos son internos a la aplicación. La persistencia depende del backend y de que el hosting conserve su archivo SQLite.

Referencias históricas de diseño: [design-review/README.md](design-review/README.md) y [landing-direction.md](design-review/landing-direction.md).
