# Napkin Runbook

## Execution & Validation
1. **[2026-10-26] Iniciar ambos servicios desde la raiz**
   Do instead: ejecutar `npm --prefix backend start` y `npm --prefix frontend run dev`; verificar el frontend en 5173 y `/api/reservas` en 3000 y mediante el proxy del frontend.
2. **[2026-10-26] Reservas temporales**
   Do instead: conservar el backend activo si se necesitan sus reservas; el almacenamiento en memoria se vacia al reiniciarlo.
