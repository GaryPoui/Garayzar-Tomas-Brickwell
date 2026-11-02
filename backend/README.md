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

- `GET /api/reservas` — Obtener todas las reservas.
- `GET /api/reservas/:id` — Obtener una reserva por ID.
- `POST /api/reservas` — Crear una reserva.
- `PUT /api/reservas/:id` — Modificar una reserva.
- `DELETE /api/reservas/:id` — Eliminar una reserva.
- `GET /api/catalogo` — Sectores, mesas y paquetes; sin fecha, no confirma disponibilidad.
- `GET /api/catalogo?fecha=2026-12-20&excluir=1` — Disponibilidad por noche; `excluir` permite editar la propia reserva.

## Reservar mesa y combos

```json
{
  "fecha": "2026-12-20",
  "horario": "23:30",
  "cliente": 1,
  "mesa": 1,
  "personas": 4,
  "combos": [{ "id": 2, "cantidad": 2 }],
  "anticipo": 0
}
```

Los IDs se obtienen del catálogo. La API calcula sector, paquete y precio total desde la mesa y los combos; no acepta un total manipulado. Guarda una descripción de la mesa y un desglose de combos con precios unitarios y subtotales. Las cantidades admitidas son de 1 a 10 por combo, sin duplicados. Omitir combos o enviar `[]` reserva solamente la mesa.

Una mesa admite una reserva por fecha con estado `PENDIENTE`, `CONFIRMADA` o `ACTIVA`, sin distinguir turnos horarios. Un conflicto devuelve HTTP 409. Cancelar, finalizar, eliminar o cambiar de mesa/fecha libera la anterior. Se valida capacidad, fecha real desde mañana, horario, identificadores e importes finitos; el anticipo no puede superar el total. La edición de una reserva pasada sigue siendo posible si no se reenvía su fecha.

El catálogo contiene tarifas de referencia y un plano orientativo, no confirmados por el local. No hay cobro, autorización ni persistencia durable. El CRUD anterior sin `mesa` sigue disponible para compatibilidad con la Entrega 2.

## Hosting y CORS

`CORS_ORIGIN` acepta una lista de orígenes separados por comas. Por defecto permite GitHub Pages y desarrollo en el puerto 5173. CORS no sustituye autenticación ni protege la API de accesos fuera del navegador. `PORT` lo asigna el proveedor de hosting. La raíz del repositorio incluye `render.yaml` para crear un Blueprint en Render; no constituye un despliegue ya realizado.

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
  "cliente": 1,
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
Al reiniciar el servidor, las reservas se eliminan.

## Manejo de errores

Los mensajes están centralizados en `enums/Messages.js`.

Los errores personalizados están definidos en `exceptions/AppError.js`.

El middleware `middlewares/errorHandler.js` centraliza todas las respuestas de error.
