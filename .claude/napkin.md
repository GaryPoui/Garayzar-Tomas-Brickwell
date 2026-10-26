# Napkin Runbook

## Execution & Validation
1. **[2026-10-26] Iniciar ambos servicios desde la raiz**
   Do instead: ejecutar `npm --prefix backend start` y `npm --prefix frontend run dev`; verificar el frontend en 5173 y `/api/reservas` en 3000 y mediante el proxy del frontend.
2. **[2026-10-26] Reservas temporales**
   Do instead: conservar el backend activo si se necesitan sus reservas; el almacenamiento en memoria se vacia al reiniciarlo.

3. **[2026-10-26] Pruebas de navegador aisladas**
   Do instead: ejecutar `npm --prefix frontend run test:e2e` con 3101 y 5175 libres; sus datos se crean y eliminan en una API temporal, sin tocar el backend habitual de 3000.
4. **[2026-10-26] Capturas despues de navegar**
   Do instead: esperar el encabezado y las filas de la ruta destino y volver al inicio antes de cada captura completa; el clic de navegacion por si solo no garantiza que React ya cambio de vista.
