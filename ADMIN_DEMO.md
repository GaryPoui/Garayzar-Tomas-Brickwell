# Acceso para la demostración local

Desde la raíz:

```bash
npm --prefix backend run demo
```

En otra terminal:

```bash
npm --prefix frontend run dev
```

Abrir <http://localhost:5173/Garayzar-Tomas-Brickwell/#/login>.

| Rol           | Email                    | Contraseña           |
| ------------- | ------------------------ | -------------------- |
| ADMIN         | admin@brickwell.test     | Brickwell-demo-12345 |
| RECEPCIONISTA | recepcion@brickwell.test | Recepcion-demo-12345 |

Son cuentas explícitas de demostración local. El servidor de demo escucha solo en 127.0.0.1. El arranque normal no incorpora claves predeterminadas y estas credenciales no deben usarse para un servicio público.

El cliente se registra desde la interfaz con fecha de nacimiento y teléfono. Las cuentas, sesiones y datos se guardan en `backend/data/brickwell.sqlite`. Reiniciar el proceso conserva ese archivo. No borrar la base si se necesita conservar la demostración.

Para producción, configurar `ADMIN_EMAIL` y `ADMIN_PASSWORD` privados en el entorno del servicio. Se crean únicamente si el email no existe en esa base. En Render gratuito se configura `DATABASE_URL` de Supabase: esas cuentas y sus datos quedan en PostgreSQL. Las cuentas demo locales no se copian ni se habilitan en la base alojada.
