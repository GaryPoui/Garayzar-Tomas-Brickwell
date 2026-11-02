# Garayzar-Tomas-Brickwell

Sitio público de BRICKWEEL Pub Bar & Night Club, con carta de tragos interactiva y reservas de mesas por sector, mapa respecto al escenario y combos anticipados.

Web: https://garypoui.github.io/Garayzar-Tomas-Brickwell/

API pública: https://brickwell-api.onrender.com/api/catalogo

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

Las reservas se guardan en memoria y se pierden al reiniciar el backend. GitHub Pages sirve el frontend y se conecta con la API Express desplegada en Render. El servicio gratuito puede tardar hasta 90 segundos en responder al salir de reposo; la aplicación mantiene el estado de carga y permite cancelar al navegar. La [dirección de la portada](frontend/design-review/landing-direction.md) documenta las referencias y las imágenes.

La interfaz usa estilos base para móvil y ampliaciones con `min-width` en tablet y escritorio. Las pruebas incluyen inicio directo a 320 px, controles táctiles, accesibilidad, mapa, carta y pantallas hasta 1920 px.

## Mesas y combos

Reservas muestra tres tipos de mesa con precios y capacidad. Al crear una reserva se eligen fecha, personas, sector y mesa desde un mapa orientativo del escenario, pista y barra. Se pueden agregar cantidades de cuatro combos. La API calcula el total y evita reservar dos veces la misma mesa para la misma noche; cancelar o finalizar libera la mesa. Las reservas existentes sin mesa conservan su editor anterior.

El plano y las tarifas son de referencia, no datos confirmados del local. Los combos se incluyen en la reserva; no hay pasarela de pago ni cobros en línea. El cliente continúa identificándose por su ID, sin inventar una autenticación.

## Publicar la API

La API está desplegada en `https://brickwell-api.onrender.com`, con carpeta raíz `backend`, Node 22, `npm ci` y `npm start`, en el plan gratuito. La variable de GitHub `VITE_API_URL` apunta a `https://brickwell-api.onrender.com/api`. El backend permite CORS desde `https://garypoui.github.io`. Los cambios de frontend se publican mediante GitHub Actions y los de backend se despliegan desde `main` en Render. `render.yaml` conserva una configuración equivalente para recrear el servicio.

La memoria se pierde al reiniciar o suspender la API: esta es una publicación de demostración. Antes de aceptar reservas o pagos reales hacen falta persistencia, autenticación, tarifas y plano confirmados.

## Pruebas

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run test:e2e
```
