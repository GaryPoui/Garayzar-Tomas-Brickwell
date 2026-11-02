# Backend Brickell's — Entrega MVC

Esta carpeta contiene la implementación del backend solicitada para la segunda entrega.

## Arquitectura

```text
backend/src/
├── controllers
├── services
├── repositories
├── models
├── routes
├── middlewares
├── responses
├── exceptions
├── enums
└── utils
```

La entidad principal utilizada para el CRUD es `Reserva`.

## Instalación

Desde la carpeta `backend`:

```bash
npm install
npm start
```

Servidor por defecto:

```text
http://localhost:3000
```

## Endpoints

Base:

```text
/api/reservas
```

- `GET /api/reservas` — Cliente: sus reservas. Personal: todas las reservas.
- `GET /api/reservas/:id` — Obtener una reserva por ID.
- `POST /api/reservas` — Crear una reserva.
- `PUT /api/reservas/:id` — Modificar o validar una reserva; solo personal.
- `DELETE /api/reservas/:id` — Eliminar una reserva; solo personal.
- `GET /api/catalogo` — Sectores, mesas y paquetes; sin fecha, no confirma disponibilidad.
- `GET /api/catalogo?fecha=2026-12-20&excluir=1` — Disponibilidad por noche; `excluir` permite editar la propia reserva.

## Autenticación

- `POST /api/auth/registro`: `{ "nombre": "Tu nombre", "email": "nombre@example.com", "password": "una-clave-de-10-caracteres" }`.
- `POST /api/auth/login`: `{ "email": "nombre@example.com", "password": "una-clave-de-10-caracteres" }`.
- Ambas devuelven `{ success: true, data: { user: { id, nombre, email, rol }, token } }`.
- `GET /api/auth/sesion`: devuelve el usuario de la sesión.
- `POST /api/auth/logout`: revoca la sesión actual.

Las operaciones de reservas, sesión y cierre requieren `Authorization: Bearer <token>`. Sin una sesión válida responden 401. Al crear, el servidor obtiene `cliente` exclusivamente de la sesión e ignora cualquier ID enviado. Un `CLIENTE` solo puede listar o consultar sus reservas; consultar una ajena responde 404. Modificar, validar o eliminar exige `ADMIN` o `RECEPCIONISTA` y devuelve 403 a clientes, incluso si la reserva es propia. El personal puede consultar y gestionar todas las reservas; no puede cambiar su propietario. El catálogo sigue siendo público.

Validar una pendiente consiste en `PUT /api/reservas/:id` con `{ "estado": "CONFIRMADA" }`, manteniendo las validaciones de disponibilidad existentes. El registro público siempre asigna `CLIENTE`, independientemente del rol enviado en el cuerpo.

Contraseñas de 10 a 128 caracteres, con scrypt y sal aleatoria. Tokens opacos aleatorios de 256 bits, almacenados como hash, con vencimiento a los siete días y revocación al salir. Registro y login tienen un límite compartido de 30 solicitudes por IP cada 15 minutos. Usuarios y sesiones se guardan en memoria: no hay persistencia durable, recuperación de contraseña ni verificación de email.

### Cuentas de personal

La API crea las cuentas de personal al arrancar si se configuran sus variables de entorno:

- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: cuenta con rol `ADMIN`.
- `RECEPCION_EMAIL` y `RECEPCION_PASSWORD`: cuenta con rol `RECEPCIONISTA`.

Cada pareja es opcional, pero ambas variables deben definirse juntas. Se aplica la misma validación de email y contraseña del registro. No hay un administrador con contraseña fija ni un endpoint público para elevar permisos. Configurar estos valores en el entorno local o en el panel privado del proveedor, sin versionar contraseñas. Como el almacenamiento sigue en memoria, las cuentas configuradas se recrean al reiniciar, pero las reservas se pierden.

## Reservar mesa y combos

```json
{
  "fecha": "2026-12-20",
  "horario": "23:30",
  "mesa": 1,
  "personas": 4,
  "combos": [{ "id": 2, "cantidad": 2 }],
  "anticipo": 0
}
```

Los IDs se obtienen del catálogo. La API calcula sector, paquete y precio total desde la mesa y los combos; no acepta un total manipulado. Guarda una descripción de la mesa y un desglose de combos con precios unitarios y subtotales. Las cantidades admitidas son de 1 a 10 por combo, sin duplicados. Omitir combos o enviar `[]` reserva solamente la mesa.

Una mesa admite una reserva por fecha con estado `PENDIENTE`, `CONFIRMADA` o `ACTIVA`, sin distinguir turnos horarios. Un conflicto devuelve HTTP 409. Cancelar, finalizar, eliminar o cambiar de mesa/fecha libera la anterior. Se valida capacidad, fecha real desde mañana, horario, identificadores e importes finitos; el anticipo no puede superar el total. La edición de una reserva pasada sigue siendo posible si no se reenvía su fecha.

El catálogo contiene tarifas de referencia y un plano orientativo, no confirmados por el local. No hay cobro ni persistencia durable. El CRUD anterior sin `mesa` sigue disponible para compatibilidad con la Entrega 2, también protegido por sesión y propiedad.

## Hosting y CORS

`CORS_ORIGIN` acepta una lista de orígenes separados por comas. Por defecto permite GitHub Pages y desarrollo en el puerto 5173. CORS no sustituye autenticación ni protege la API de accesos fuera del navegador. `PORT` lo asigna el proveedor de hosting.

API desplegada en `https://brickwell-api.onrender.com`, servicio gratuito `brickwell-api`, raíz `backend`, Node 22, build `npm ci` y arranque `npm start`. La raíz del repositorio incluye `render.yaml` para recrear la configuración. Las peticiones iniciales pueden demorarse mientras el servicio sale de reposo; el frontend público admite hasta 90 segundos. El almacenamiento en memoria y las tarifas orientativas limitan esta publicación a una demostración.

```bash
npm test
npm audit --omit=dev
```

## Ejemplo para crear una reserva

La fecha debe ser como mínimo el día siguiente al actual.

```json
{
  "fecha": "2026-12-20",
  "horario": "23:30",
  "sector": 2,
  "paquete": 1,
  "precioTotal": 50000,
  "anticipo": 15000
}
```

El estado inicial se asigna automáticamente como `PENDIENTE`.

## Formato de respuestas

Respuesta exitosa:

```json
{
  "success": true,
  "data": {}
}
```

Respuesta de error:

```json
{
  "success": false,
  "message": "La reserva no existe."
}
```

## Persistencia

La información se almacena temporalmente en memoria mediante un array dentro de `ReservaRepository.js`.
Al reiniciar el servidor, las cuentas, sesiones y reservas se eliminan. La autenticación no reemplaza una base de datos persistente.

## Manejo de errores

Los mensajes están centralizados en `enums/Messages.js`.

Los errores personalizados están definidos en `exceptions/AppError.js`.

El middleware `middlewares/errorHandler.js` centraliza todas las respuestas de error.
