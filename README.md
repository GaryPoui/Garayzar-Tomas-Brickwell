# BRICKWEEL

Sistema de reservas de mesas, carta digital, eventos y entradas para un pub bar y boliche. React + Vite en `frontend`; API Express con capas MVC en `backend`, PostgreSQL de Supabase para datos alojados y SQLite para la demo local.

## Ejecutar la entrega

Requisito: **Node.js 22.13 o superior** y npm. SQLite se incluye en Node y no requiere instalar un servidor de base de datos. En Node 22 puede aparecer un aviso de funcionalidad experimental.

Desde la raíz:

```bash
npm --prefix backend ci
npm --prefix frontend ci
```

En dos terminales:

```bash
npm --prefix backend run demo
```

```bash
npm --prefix frontend run dev
```

Abrir <http://localhost:5173/Garayzar-Tomas-Brickwell/>. API: <http://localhost:3000/api/catalogo>.

El modo `demo` escucha solo en `127.0.0.1` y crea cuentas locales explícitas:

| Perfil         | Email                    | Contraseña de demostración |
| -------------- | ------------------------ | -------------------------- |
| Administración | admin@brickwell.test     | Brickwell-demo-12345       |
| Recepción      | recepcion@brickwell.test | Recepcion-demo-12345       |

Los clientes crean su propia cuenta en **Crear cuenta**. Estas claves son públicas, solo para la demostración local. El arranque normal con `npm --prefix backend start` no configura cuentas predeterminadas. Ver [configuración del backend](backend/README.md).

## Funciones implementadas

| Área           | Operaciones disponibles desde React                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cuenta         | Registro con edad mínima de 16 años, email único, contraseña, teléfono; inicio/cierre de sesión y edición de perfil.                                                                    |
| Reservas       | Consulta por fecha, mapa de mesas y capacidad, combos con cantidades, creación, detalle e historial propio.                                                                             |
| Cancelación    | Cliente cancela con confirmación; el registro queda cancelado y se libera la mesa. La anticipación mínima por defecto es de dos horas.                                                  |
| Personal       | Consulta general, reserva a nombre de un cliente registrado, confirmación/rechazo, edición, anticipo recibido, descuento, notas y estados de check-in/cierre.                           |
| Administración | Eliminación definitiva de reservas, gestión de sectores, cuatro mesas por sector, combos, carta y usuarios; baja lógica de cuentas y cambio de rol.                                     |
| Carta          | Productos y precios desde la API; administración edita y recepción puede cambiar solamente la disponibilidad de tragos. Los combos comparten precios con las reservas.                  |
| Eventos        | Calendario público mensual y flyer con fecha, horario, artista, género, dress code, promociones, invitados e imágenes HTTPS opcionales. CRUD administrativo con borrador y publicación. |
| Entradas       | Solicitud por cliente, precio calculado por servidor, cupo disponible, historial, cancelación y liberación de cupo; personal acredita pago y registra ingreso.                          |
| Avisos         | Confirmaciones, cancelaciones, nuevas solicitudes y recordatorio de entradas confirmadas dentro de las 24 horas previas. Avisos privados, persistentes y marcables como leídos.         |
| Reportes       | Solo administración: anticipos, entradas con pago acreditado, saldos pendientes e historial y visitas de clientes.                                                                      |
| Políticas      | Administración configura la anticipación para cancelar mesas, con mínimo de dos horas, y el texto de reembolsos.                                                                        |

## Reglas del negocio

- La fecha de una nueva reserva es desde mañana, según la hora de Argentina. Fecha y horario deben ser reales.
- Una mesa admite una reserva vigente por noche; un cliente admite una reserva vigente por fecha. Se comprueban en servicios y mediante índices únicos de SQLite.
- El servidor exige una mesa existente y habilitada, respeta su capacidad y calcula los importes desde el catálogo. No existe el alta anterior sin mesa ni se acepta el precio enviado como precio definitivo.
- Los combos deben existir y estar activos; cada cantidad debe ser entera entre 1 y 10, sin duplicados.
- El registro público siempre crea clientes. Cada cliente consulta únicamente sus registros. Los permisos se aplican también en el backend.
- Solo el personal registra anticipos y descuentos. El anticipo no puede superar el total. Las notas internas no se exponen al cliente.
- Reserva: `PENDIENTE → CONFIRMADA → ACTIVA → FINALIZADA`; pendiente o confirmada pueden pasar a cancelada. Los estados finales no se reabren. El check-in se registra el día reservado.
- Evento: `BORRADOR → PUBLICADO → ACTIVO → FINALIZADO`; publicado puede volver a borrador sin entradas emitidas o cancelarse. Los estados finales no se reabren.
- Las entradas no superan la capacidad del evento; las verificaciones y escrituras se ejecutan dentro de una transacción. Hay una entrada vigente por cliente y evento. No se permite el doble ingreso.
- El catálogo conserva los precios acordados en reservas existentes cuando solo se cambia su estado. Cambiar mesa o combos recalcula el precio con el catálogo vigente.
- Se conservan los registros relacionados con historial; el servidor impide eliminaciones que rompan esas referencias.

## Persistencia y alcance operativo

El backend usa **Supabase PostgreSQL** cuando se configura `DATABASE_URL`. Usuarios, hashes de contraseña, sesiones, reservas, catálogo, eventos, entradas, políticas y avisos se guardan en la base remota; reiniciar o desplegar Render no elimina esos datos. El esquema `brickwell` es privado, tiene RLS y solo el rol del backend puede acceder. React continúa consumiendo Express: no recibe credenciales de base de datos.

Proyecto provisionado: [Brickwell en Supabase](https://supabase.com/dashboard/project/uyvboesqimqanwqauzqz), región São Paulo, en la organización gratuita autorizada. El plan Free tiene 500 MB de base y puede pausarse tras una semana sin actividad ([límites oficiales](https://supabase.com/pricing)). No se contrataron servicios pagos.

Para usar la base remota localmente: `npm --prefix backend start`, con la conexión privada en `backend/.env` (ignorado por Git). La demo `npm --prefix backend run demo` usa SQLite local y cuentas de ejemplo; no carga `.env`. Las bases son independientes.

Sin `DATABASE_URL`, SQLite guarda los datos en `backend/data/brickwell.sqlite`. `DATABASE_PATH=:memory:` se reserva para pruebas. Render exige `DATABASE_URL` para evitar volver accidentalmente al disco efímero. No borrar la base existente; los datos anteriores de SQLite no se copian automáticamente a Supabase.

Los pagos se coordinan con el local. Una entrada con precio mayor a cero queda **pendiente de pago** hasta que el personal acredita el dinero recibido; las gratuitas quedan confirmadas. No hay una pasarela de cobro ni devoluciones automáticas. Los avisos son internos a la aplicación, no correos, SMS ni mensajes de WhatsApp.

Los precios iniciales y el mapa son de referencia. Las imágenes son de ambientación. Las consumiciones del historial corresponden a combos reservados; el sistema no registra ventas independientes en barra.

## Verificación

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run format:check
npm --prefix frontend run build
npm --prefix frontend run test:e2e
git diff --check
```

Prueba adicional contra Supabase: `npm --prefix backend run test:cloud`, con `DATABASE_URL` en `backend/.env` y una base destinada a pruebas. Comprueba registro/login por HTTP, persistencia y perfil entre procesos, privacidad, reservas simultáneas, cupo de entradas, rollback y revocación de sesión. Crea registros con identificadores aleatorios y los limpia al terminar; no ejecutar sobre una base con usuarios reales.

Revisión de las partes 1–4: flujos existentes cubiertos por pruebas HTTP y 21 recorridos de Playwright desde React. Se mantienen las capas MVC, los servicios HTTP centralizados, las validaciones del servidor y los mensajes de éxito/error.

Las E2E inician una API aislada en 3101 y Vite en 5175. Funcionan en Windows y Linux y no modifican la base de uso habitual. Si Chromium no está instalado: `npm --prefix frontend exec playwright install chromium`.

## Publicación

Frontend existente: <https://garypoui.github.io/Garayzar-Tomas-Brickwell/>. API configurada históricamente: <https://brickwell-api.onrender.com/api/catalogo>.

Los cambios locales deben publicarse para aparecer en esas URLs. GitHub Pages requiere `VITE_API_URL` con la URL de la API y CORS debe permitir el origen del frontend. `render.yaml` conserva la configuración del servicio gratuito existente.

`render.yaml` mantiene **plan free** y declara `DATABASE_URL` como secreto (`sync: false`): se carga en Environment del servicio de Render, nunca en GitHub Pages ni en variables `VITE_*`. El certificado público de Supabase está incluido en `backend/certs`; la conexión valida el certificado y el nombre del servidor. El healthcheck `/` informa `storage: "postgres"` cuando se utiliza la base alojada.

La alternativa histórica `render.persistent.yaml` requiere un plan pago y ya no es necesaria para conservar los datos usando Supabase.

## Video de defensa

Pendiente de grabar y adjuntar en Teams como MP4 de 5 a 10 minutos.

Un recorrido posible es registrar un cliente, elegir fecha/mesa/combos, crear la reserva, confirmar desde otra sesión de administración, consultar la confirmación del cliente y cancelar para verificar que la mesa vuelve a estar disponible. Explicar las rutas, controlador, servicio, repositorio, modelo, validaciones, transacción y respuesta; luego mostrar los servicios HTTP, formulario, agenda y confirmaciones de React. El video debe mostrar la ejecución real.

Más información: [backend](backend/README.md), [frontend](frontend/README.md), [modelo del dominio](2.Modelo%20del%20dominio.md).
