# Admin de prueba

Cuenta creada para probar el sistema localmente:

- Email: `admin@brickwell.test`
- Contrasena: `KDOjxqyMSkGaHQlt`
- Rol: `ADMIN`
- Acceso local: http://127.0.0.1:5176/Garayzar-Tomas-Brickwell/#/login

El administrador puede ver todas las reservas, editarlas, validar las pendientes
como confirmadas y eliminarlas. El registro publico solo crea clientes.

## Iniciar la API con esta cuenta

Desde la raiz del proyecto:

```bash
PORT=3103 ADMIN_EMAIL=admin@brickwell.test ADMIN_PASSWORD='KDOjxqyMSkGaHQlt' npm --prefix backend start
```

Para conectar el frontend local con esa API:

```bash
API_PROXY_TARGET=http://127.0.0.1:3103 npm --prefix frontend run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

La cuenta se crea al iniciar la API con ambas variables de entorno. Subir este
archivo no crea automaticamente el administrador en Render: alli se deben
configurar `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el panel privado del servicio.

## Advertencia

Estas credenciales son publicas al versionar este documento y son exclusivamente
para la demo local. No reutilizar esta contrasena ni configurar esta misma cuenta
en un servicio publico con datos reales. Para el hosting, usar una contrasena nueva
y privada que no se guarde en el repositorio.

Las cuentas, sesiones y reservas se almacenan en memoria. Al reiniciar la API se
pierden los datos; la cuenta admin se recrea si se mantienen sus variables de
entorno. No usar la demo para reservas o datos personales reales.
