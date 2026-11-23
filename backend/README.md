# API de BRICKWEEL

API REST Express con PostgreSQL de Supabase y SQLite local incluido en Node.js. Requiere Node 22.13 o superior.

## Arranque y configuración

```bash
npm ci
npm run demo
```

El modo de demostración crea las cuentas indicadas en el README principal y limita la escucha a localhost. Para el arranque habitual:

```bash
npm start
```

Se carga `backend/.env` si existe. La plantilla `backend/.env.example` contiene las variables admitidas:

- `PORT`: 3000 por defecto.
- `HOST`: dirección de escucha; modo demo usa 127.0.0.1.
- `DATABASE_URL`: conexión privada del Session Pooler de Supabase (puerto 5432), con el rol `brickwell_backend`. Si se configura, tiene prioridad sobre SQLite. Solo backend; nunca una variable `VITE_*`.
- `DATABASE_CA_CERT`: CA PEM opcional; por defecto se incluye el certificado oficial de Supabase. Siempre se verifica TLS.
- `DATABASE_PATH`: archivo SQLite local; por defecto `backend/data/brickwell.sqlite`. `:memory:` es para pruebas. En Render se exige la base remota; `ALLOW_EPHEMERAL_SQLITE=true` solo permite volver explícitamente a un disco efímero.
- `CORS_ORIGIN`: orígenes permitidos separados por comas.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: pareja opcional para crear una cuenta ADMIN si su email todavía no existe.
- `RECEPCION_EMAIL`, `RECEPCION_PASSWORD`: pareja opcional equivalente para recepción.

La configuración inicial crea cuentas solamente la primera vez; no modifica ni eleva una cuenta preexistente con el mismo email. Las cuentas posteriores se gestionan desde Usuarios. No versionar `.env` ni la base. En producción usar credenciales privadas.

## Arquitectura

- `routes`: URL, método y middlewares de autorización.
- `controllers`: traducen la solicitud y utilizan el formato de respuestas común mediante `handler`.
- `services`: validaciones, permisos de negocio, precios, disponibilidad, estados y transacciones.
- `repositories`: lectura y escritura asíncrona de entidades en PostgreSQL o SQLite; `RecordRepository` comparte las operaciones de almacenamiento.
- `models`: entidades de dominio; usuarios diferenciados por perfil, reservas, eventos, flyers y entradas.
- `middlewares`: autenticación, límite de intentos, errores y rutas inexistentes.
- `exceptions`: errores con estado HTTP.
- `responses`: respuestas HTTP consistentes.
- `database.js`: conexión, esquema, secuencias e índices únicos. Las reservas por mesa/fecha y cliente/fecha y las entradas por cliente/evento se protegen también en la base.

Ambos motores almacenan documentos JSON (JSONB en PostgreSQL) con colección e identificador; las secuencias persisten y no reutilizan IDs eliminados. `AsyncLocalStorage` conserva la conexión de cada transacción anidada. PostgreSQL usa una conexión del pool y un advisory lock transaccional compartido por las instancias para serializar las escrituras del negocio. SQLite usa `BEGIN IMMEDIATE` y una cola local para evitar intercalar transacciones asíncronas. Un fallo revierte todas las escrituras.

El esquema alojado se define en `sql/postgres.sql`. Se aplica como dueño de la base después de crear un rol LOGIN `brickwell_backend` con contraseña privada aleatoria. El rol de la aplicación solo tiene CRUD en `brickwell`, con RLS; no tiene DDL ni acceso a otros esquemas. No se usan claves `service_role` ni el usuario `postgres` desde la aplicación. El esquema privado no se expone a la Data API.

Los catálogos se inicializan una sola vez en cada base; no se reemplazan en cada despliegue. La demo local y Supabase son bases independientes. Los registros de SQLite no se importan ni se borran automáticamente.

## Endpoints

Todas las rutas siguientes llevan el prefijo `/api`.

| Método y ruta                        | Acceso y operación                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| POST `/auth/registro`                | Público. Nombre, email, password, fechaNacimiento y telefono. Siempre crea CLIENTE.            |
| POST `/auth/login`                   | Público. Email y password.                                                                     |
| GET `/auth/sesion`                   | Sesión actual.                                                                                 |
| POST `/auth/logout`                  | Revoca la sesión actual.                                                                       |
| PUT `/perfil`                        | Edita nombre, fechaNacimiento y telefono propios.                                              |
| GET `/catalogo?fecha=YYYY-MM-DD`     | Público. Sectores habilitados, mesas y combos activos con disponibilidad por noche.            |
| GET `/catalogo?fecha=...&excluir=ID` | Personal autenticado, para editar una reserva existente.                                       |
| GET `/carta`                         | Público. Tragos disponibles y combos con precios del catálogo.                                 |
| GET `/reservas`                      | Cliente: propias. Personal: todas.                                                             |
| GET `/reservas/:id`                  | Detalle respetando titularidad.                                                                |
| POST `/reservas`                     | Cliente reserva para sí. Personal selecciona un cliente registrado mediante `cliente`.         |
| PUT `/reservas/:id`                  | Personal: datos, anticipo, descuento, notas y transición permitida de estado.                  |
| DELETE `/reservas/:id`               | Cliente: cancela la propia sin borrarla. ADMIN: elimina definitivamente. Recepción: prohibido. |
| GET `/eventos`                       | Público. Eventos publicados y activos, con disponibilidad.                                     |
| GET `/eventos/:id`                   | Público. Detalle del evento publicado.                                                         |
| POST `/eventos/:id/entradas`         | CLIENTE. Solicita una entrada; precio e identidad desde el servidor.                           |
| GET `/entradas`                      | Cliente: propias. Personal: todas.                                                             |
| PUT `/entradas/:id`                  | Cliente: cancelar. Personal: acreditar pago, registrar ingreso o cancelar.                     |
| GET `/historial`                     | Historial propio de reservas y entradas.                                                       |
| GET `/avisos`                        | Avisos propios. Genera recordatorios pendientes de forma idempotente.                          |
| PUT `/avisos/:id`                    | Marca un aviso propio como leído.                                                              |
| GET `/clientes`                      | Personal: clientes activos para registrar reservas a su nombre.                                |
| GET `/clientes/:id/historial`        | ADMIN. Historial del cliente.                                                                  |
| GET `/gestion/catalogo/:tipo`        | Personal. `tipo`: sectores, paquetes o carta.                                                  |
| POST `/gestion/catalogo/:tipo`       | ADMIN. Alta. Un sector nuevo genera cuatro mesas.                                              |
| PUT `/gestion/catalogo/:tipo/:id`    | ADMIN: edición. Recepción: solo `disponible` en carta.                                         |
| DELETE `/gestion/catalogo/:tipo/:id` | ADMIN. Baja si no rompe el historial.                                                          |
| GET/POST `/gestion/eventos`          | ADMIN. Listado completo o creación como borrador.                                              |
| PUT/DELETE `/gestion/eventos/:id`    | ADMIN. Edición o eliminación permitida por estado e historial.                                 |
| GET/POST `/gestion/usuarios`         | ADMIN. Listado o alta con rol validado.                                                        |
| PUT `/gestion/usuarios/:id`          | ADMIN. Perfil, rol o baja lógica `activo: false`; revoca sesiones cuando corresponde.          |
| GET `/gestion/reportes`              | ADMIN. Importes e historial de clientes.                                                       |
| GET `/configuracion`                 | Público. Política vigente de cancelación y reembolsos.                                         |
| PUT `/gestion/configuracion`         | ADMIN. Configura política; anticipación mínima de 2 a 168 horas.                               |

Ejemplo de registro:

```json
{
  "nombre": "Cliente de ejemplo",
  "email": "cliente@example.com",
  "password": "Una-clave-segura-123",
  "fechaNacimiento": "2000-01-01",
  "telefono": "2262551234"
}
```

Registro/login responden `{ "success": true, "data": { "user": {}, "token": "..." } }`. Enviar `Authorization: Bearer <token>` para operaciones privadas. Tokens aleatorios almacenados como hash, duración de siete días y revocación al salir. Contraseñas con scrypt, sal aleatoria y verificación temporal constante. Registro/login admiten 30 solicitudes por IP cada 15 minutos; las pruebas aisladas usan un límite mayor con `NODE_ENV=test`.

Ejemplo de reserva de cliente:

```json
{
  "fecha": "2099-12-20",
  "horario": "23:30",
  "mesa": 1,
  "personas": 4,
  "combos": [{ "id": 2, "cantidad": 2 }]
}
```

No enviar precio, cliente, anticipo ni descuento desde una cuenta de cliente. El servidor asigna la titularidad y calcula el precio. El personal puede seleccionar `cliente` y registrar `anticipo` o `descuento` (porcentaje de 0 a 100). No se procesa un pago electrónico.

## Validaciones y estados

Se validan objetos, tipos numéricos estrictos, fechas reales, email único, teléfono de 8 a 15 dígitos, edad mínima de 16 años y máxima de 120, contraseña de 10 a 128 caracteres con mayúscula, minúscula y número, existencia de entidades, capacidad, cantidades, precios y permisos. Se rechazan booleanos donde se espera un número. Un JSON malformado devuelve 400.

Las reservas no se superponen por mesa ni por cliente en una fecha. El check-in solo se registra el día reservado. Los estados finales son inmutables. El precio acordado queda guardado en la reserva; solo cambia al modificar su selección o aplicar un descuento autorizado.

Una entrada con precio queda `PENDIENTE_PAGO`; el personal registra `CONFIRMADA` tras recibir el dinero. Una gratuita se confirma automáticamente. `USADA` registra un ingreso único al evento del día. Cancelar libera el cupo. Cancelar un evento cancela sus entradas y notifica a los titulares; los reembolsos se coordinan con el local.

Los avisos son internos y persistentes. El servidor busca recordatorios cada minuto mientras está ejecutándose y también al consultar avisos. No envía emails ni SMS y no genera recordatorios mientras el proceso está suspendido.

## Respuestas y pruebas

Éxito: `{ "success": true, "data": ... }`. Error: `{ "success": false, "message": "Mensaje claro" }`. Códigos: 400 datos inválidos, 401 sesión inválida, 403 permisos insuficientes, 404 inexistente/no perteneciente, 409 conflicto de negocio, 413 cuerpo demasiado grande, 429 límite de intentos y 500 error inesperado.

```bash
npm test
npm audit --omit=dev
```

Las pruebas usan SQLite en memoria salvo la prueba de reinicio, que utiliza una base temporal fuera del proyecto y la elimina al terminar. No modifican la base normal.

## Verificación del almacenamiento remoto

```bash
npm run test:cloud
```

Prueba optativa con `DATABASE_URL` en `.env`, dirigida a una base de pruebas. Verifica el contrato HTTP, datos y sesiones desde nuevos procesos, conflicto de reservas entre dos procesos, cupo de evento, rollback y logout persistente. Sus registros usan UUID y se eliminan al terminar. La suite habitual `npm test` siempre fuerza SQLite aislado y nunca usa la conexión remota del entorno.

El endpoint `/` devuelve `storage: "postgres"` o `"sqlite"` además de la revisión del despliegue. No publica contraseñas ni la URL de conexión.
