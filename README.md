# Garayzar-Tomas-Brickwell

Sitio público de BRICKWEEL Pub Bar & Night Club, con carta de tragos interactiva y reservas de mesas por sector, mapa respecto al escenario y combos anticipados.

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

## Mesas y combos

Reservas muestra tres tipos de mesa con precios y capacidad. Al crear una reserva se eligen fecha, personas, sector y mesa desde un mapa orientativo del escenario, pista y barra. Se pueden agregar cantidades de cuatro combos. La API calcula el total y evita reservar dos veces la misma mesa para la misma noche; cancelar o finalizar libera la mesa. Las reservas existentes sin mesa conservan su editor anterior.

El plano y las tarifas son de referencia, no datos confirmados del local. Los combos se incluyen en la reserva; no hay pasarela de pago ni cobros en línea. El cliente continúa identificándose por su ID, sin inventar una autenticación.

## Publicar la API

`render.yaml` prepara un servicio Node en el plan gratuito de Render. Crear un Blueprint con este repositorio en una cuenta propia de Render. Una vez desplegado, configurar la variable del repositorio GitHub `VITE_API_URL` con la URL HTTPS del servicio terminada en `/api` y volver a ejecutar el workflow de Pages. El backend ya permite CORS desde `https://garypoui.github.io`.

Subir el repositorio y publicar Pages no inicia este servicio. La memoria se pierde al reiniciar o suspender la API: antes de aceptar reservas o pagos reales hacen falta persistencia, autenticación, tarifas y plano confirmados.

## Pruebas

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run test:e2e
```
