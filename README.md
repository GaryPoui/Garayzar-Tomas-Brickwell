# Garayzar-Tomas-Brickwell

Sitio público de BRICKWEEL Pub Bar & Night Club, con fotografías de ambientación, carta de tragos interactiva y acceso al sistema de reservas.

Web: https://garypoui.github.io/Garayzar-Tomas-Brickwell/

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

Frontend: http://localhost:5173/Garayzar-Tomas-Brickwell/. API: http://localhost:3000/api/reservas.

Las reservas se guardan en memoria y se pierden al reiniciar el backend. GitHub Pages sirve la portada y la carta; las operaciones de reservas necesitan la API Express alojada por separado. La [dirección de la nueva portada](frontend/design-review/landing-direction.md) documenta la referencia, las imágenes y el alcance del contenido.
