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
