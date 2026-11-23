# BRICKWEEL

Sistema de reservas de mesas, carta digital, eventos y entradas para un pub bar y boliche. React + Vite en `frontend`; API Express con capas MVC y persistencia SQLite en `backend`.

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

La base local se guarda en `backend/data/brickwell.sqlite`, fuera de Git. Cuentas, sesiones, reservas, catálogo, eventos, entradas, políticas y avisos sobreviven al reinicio del proceso cuando se conserva ese archivo. `DATABASE_PATH=:memory:` se utiliza exclusivamente para pruebas aisladas.

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

Las E2E inician una API aislada en 3101 y Vite en 5175. Funcionan en Windows y Linux y no modifican la base de uso habitual. Si Chromium no está instalado: `npm --prefix frontend exec playwright install chromium`.

## Publicación

Frontend existente: <https://garypoui.github.io/Garayzar-Tomas-Brickwell/>. API configurada históricamente: <https://brickwell-api.onrender.com/api/catalogo>.

Los cambios locales deben publicarse para aparecer en esas URLs. GitHub Pages requiere `VITE_API_URL` con la URL de la API y CORS debe permitir el origen del frontend. `render.yaml` conserva la configuración del servicio gratuito existente.

**SQLite requiere almacenamiento persistente en el hosting.** Un archivo en el disco efímero de Render gratuito puede perderse durante reinicios, suspensiones o despliegues. Para conservar datos allí se necesita un volumen persistente y `DATABASE_PATH` apuntando a ese volumen, o migrar el repositorio a una base alojada. Este cambio de infraestructura no está provisionado por el código y no se contrataron servicios pagos.

La configuración opcional [render.persistent.yaml](render.persistent.yaml) deja preparado el servicio con plan Starter, disco de 1 GB montado en `/var/data` y la base en `/var/data/brickwell.sqlite`. No reemplaza automáticamente a `render.yaml` ni activa cargos al subir el repositorio. Su aplicación requiere aprobar el costo y acceso al servicio. Los datos ya guardados deben respaldarse antes de cambiar el disco o la ruta de la base.

## Video de defensa

Pendiente de grabar y adjuntar en Teams como MP4 de 5 a 10 minutos.

Un recorrido posible es registrar un cliente, elegir fecha/mesa/combos, crear la reserva, confirmar desde otra sesión de administración, consultar la confirmación del cliente y cancelar para verificar que la mesa vuelve a estar disponible. Explicar las rutas, controlador, servicio, repositorio, modelo, validaciones, transacción y respuesta; luego mostrar los servicios HTTP, formulario, agenda y confirmaciones de React. El video debe mostrar la ejecución real.

Más información: [backend](backend/README.md), [frontend](frontend/README.md), [modelo del dominio](2.Modelo%20del%20dominio.md).
