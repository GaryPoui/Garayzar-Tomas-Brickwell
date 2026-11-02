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

Las cuentas, sesiones y reservas se guardan en memoria y se pierden al reiniciar el backend. GitHub Pages sirve el frontend y se conecta con la API Express desplegada en Render. El servicio gratuito puede tardar hasta 90 segundos en responder al salir de reposo; la aplicación mantiene el estado de carga y permite cancelar al navegar. La [dirección de la portada](frontend/design-review/landing-direction.md) documenta las referencias y las imágenes.

La interfaz usa estilos base para móvil y ampliaciones con `min-width` en tablet y escritorio. Las pruebas incluyen inicio directo a 320 px, controles táctiles, accesibilidad, mapa, carta y pantallas hasta 1920 px.

## Mesas y combos

Reservas muestra tres tipos de mesa con precios y capacidad. Al crear una reserva se eligen fecha, personas, sector y mesa desde un mapa orientativo del escenario, pista y barra. Se pueden agregar cantidades de cuatro combos. La API calcula el total y evita reservar dos veces la misma mesa para la misma noche; cancelar o finalizar libera la mesa. Las reservas existentes sin mesa conservan su editor anterior.

El plano y las tarifas son de referencia, no datos confirmados del local. Los combos se incluyen en la reserva; no hay pasarela de pago ni cobros en línea. Para reservar se requiere registro e inicio de sesión. El servidor asigna la reserva al usuario autenticado. Cada cliente consulta únicamente sus reservas; administración y recepción pueden gestionar las de todos los usuarios. No se solicita un ID de cliente.

## Cuentas y acceso

Las rutas `/#/registro` y `/#/login` permiten crear una cuenta e ingresar con email y contraseña. El registro inicia sesión y devuelve al destino solicitado. La sesión se conserva al recargar la misma pestaña, vence a los siete días y se revoca al cerrar sesión. Una sesión inválida devuelve al acceso. Las contraseñas se guardan con scrypt y sal aleatoria, nunca en texto plano. No se implementan recuperación de contraseña ni verificación de email.

El registro público siempre crea un `CLIENTE`, sin permitir elegir ni enviar un rol privilegiado. El cliente tiene dos secciones: **Agenda**, con todas sus reservas y estados, y **Reservar**, con la selección de mesa y combos. No puede editar, validar ni eliminar reservas, tampoco mediante peticiones directas a la API.

Los roles `ADMIN` y `RECEPCIONISTA` conservan Reservas, Agenda y Nueva reserva. Pueden consultar las reservas de todos los clientes, editarlas, validar pendientes como confirmadas y eliminarlas. La edición conserva al dueño original. Las cuentas de personal se crean al iniciar la API configurando `ADMIN_EMAIL` y `ADMIN_PASSWORD`, o `RECEPCION_EMAIL` y `RECEPCION_PASSWORD`. No hay credenciales predeterminadas en producción; deben definirse fuera del repositorio. Ver [configuración de acceso](backend/README.md#cuentas-de-personal).

## Publicar la API

La API está desplegada en `https://brickwell-api.onrender.com`, con carpeta raíz `backend`, Node 22, `npm ci` y `npm start`, en el plan gratuito. La variable de GitHub `VITE_API_URL` apunta a `https://brickwell-api.onrender.com/api`. El backend permite CORS desde `https://garypoui.github.io`. Los cambios de frontend se publican mediante GitHub Actions y los de backend se despliegan desde `main` en Render. `render.yaml` conserva una configuración equivalente para recrear el servicio.

La memoria se pierde al reiniciar o suspender la API: esta es una publicación de demostración. Antes de aceptar reservas o pagos reales hacen falta persistencia durable de cuentas y reservas, recuperación de cuenta, tarifas y plano confirmados.

## Pruebas

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run test:e2e
```
