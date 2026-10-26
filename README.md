# Garayzar-Tomas-Brickwell

Sistema de reservas para Brickell's Pub Bar & Night Club.

- [Backend](backend/README.md): API REST Express y arquitectura MVC de la Entrega 2.
- [Frontend](frontend/README.md): aplicación React, integración, diseño, accesibilidad y pruebas.
- [Modelo del dominio](2.Modelo%20del%20dominio.md): entidades y relaciones del sistema.

## Inicio rápido

Con Node.js 22.12 o superior, ejecutar desde la raíz del repositorio:

```bash
npm --prefix backend install
npm --prefix frontend install
```

En dos terminales separadas:

```bash
npm --prefix backend start
```

```bash
npm --prefix frontend run dev
```

Frontend: http://localhost:5173. API: http://localhost:3000/api/reservas.

Las reservas se guardan en memoria y se pierden al reiniciar el backend. El rediseño y su relación con los documentos Word están documentados en el [frontend](frontend/README.md) y en la [revisión visual](frontend/design-review/README.md).
