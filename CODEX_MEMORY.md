# Memoria de Codex — Brickell’s

## Supabase gratuito — continuación del 23/11/2026

- Cierre verificado: API pública desplegada en `91a3ee8058d2a270beb15e5ff4e7096703aed935`, `storage: postgres`. Se mantuvieron el usuario, su contraseña, una sesión ya emitida, la reserva cancelada y el historial después de ese despliegue real. Luego se retiraron exclusivamente los fixtures de la prueba pública (cliente sintético, reserva, sesiones y avisos). En Supabase quedaron los catálogos y la cuenta ADMIN privada. El archivo privado de acceso para el usuario permanece en `backend/data/acceso-produccion.txt`. El video sigue a cargo del usuario.
- Estado posterior al pendiente descrito abajo: el usuario cambió a la cuenta correcta de Render, workspace My Workspace, proyecto `prj-dbkb0t0n74is73buot70`, servicio `srv-dbkb0tdg1s2s739r77og` (brickwell-api, Free, Ohio). Se importó solamente DATABASE_URL mediante el archivo privado ignorado `backend/data/render.env` y se guardó con Save only. Se publicó `97600c4bd9118ba6d284bfd7d439e443d1170ad5`; GitHub Pages terminó correctamente en `45267324964` y la API pública devolvió esa revisión con `storage: postgres`.
- Se creó una cuenta ADMIN con identificador interno `administracion@brickwell.test`, ID 7, contraseña aleatoria privada guardada en `backend/data/acceso-produccion.txt`, fuera de Git. No corresponde a un buzón ni usa la clave demo. No volver a ejecutar test:cloud sobre esta base ahora que se utiliza como instancia pública.
- Prueba en API pública aprobada: registro 201, login 200, datos inválidos 400, email duplicado 409, gestión prohibida a cliente 403, reserva 201 con precio calculado 118000 ARS, duplicado rechazado 409, cancelación y mesa liberada, logout y token revocado 401. Fixture sintética privada en `backend/data/verificacion-publica.json`; se conserva una sesión para comprobar persistencia tras el despliegue siguiente de documentación y luego se limpiará ese fixture únicamente.
- El usuario pidió revisar la consigna completa, terminar faltantes y agregar un servicio gratuito para guardar usuarios. Confirmó crear Brickwell en la organización Supabase `srjicdqejuyefmhkqlnx`, plan Free, costo consultado USD 0/mes. Video a su cargo.
- Proyecto Supabase creado: `uyvboesqimqanwqauzqz`, región `sa-east-1`, nombre Brickwell. Es independiente de Nuestro rincon. Esquema privado `brickwell`, tablas JSONB `records` y `sequences`, índices únicos de email/sesión/mesa/cliente/entrada y RLS. Rol dedicado `brickwell_backend`, solo CRUD; sin credenciales de administrador en React.
- La conexión final privada está en `backend/.env`, ignorado por Git. Nunca mostrarla, versionarla ni enviarla al frontend. Se rotó después de crear el esquema; la clave inicial registrada en la migración ya no sirve. Supavisor puede tardar aproximadamente un minuto en aceptar una contraseña rotada.
- Certificado público oficial en `backend/certs/supabase-ca.crt` y procedencia/huella en su README. PostgreSQL usa TLS con `rejectUnauthorized: true` y validación de hostname. No desactivar validaciones por el error SELF_SIGNED_CERT_IN_CHAIN.
- Repositorios y servicios adaptados a async/await sin cambiar el contrato HTTP ni las capas MVC. `database.js` usa pg si existe DATABASE_URL y conserva SQLite local en caso contrario. AsyncLocalStorage propaga la conexión transaccional; advisory lock de PostgreSQL serializa escrituras entre instancias. Cola local evita intercalar transacciones SQLite. La demo elimina DATABASE_URL del entorno y no carga `.env`.
- `render.yaml` sigue gratuito y declara DATABASE_URL secreto (`sync: false`). En Render, el backend nuevo exige DATABASE_URL salvo ALLOW_EPHEMERAL_SQLITE=true explícito. No hacer push del cambio antes de configurar la conexión en el servicio existente para no fallar el arranque.
- Verificado: 15 pruebas backend, 10 frontend, lint y formato, build y 21 E2E. `npm --prefix backend run test:cloud` pasó contra Supabase con registro/login HTTP, persistencia de sesión y perfil desde otro proceso, dos procesos reservando la misma mesa (201/409), cancelación/disponibilidad, dos procesos compitiendo por un único cupo (201/409), rollback y revocación de sesión. Fixtures UUID limpiadas; no ejecutar esta prueba optativa cuando la base ya tenga usuarios reales.
- Seguridad de Supabase: advisors sin observaciones. Datos locales anteriores no se importan automáticamente. La base local existente solo tenía catálogos y dos cuentas demo; no se migraron esas cuentas públicas a la nube.
- Despliegue todavía pendiente al escribir esta nota. El usuario autorizó configurar Render usando el navegador y dejó Render/Supabase abiertos. Browser host no disponible; control nativo de Chrome sí funciona. La cuenta visible de Render tiene workspace Ailu y solo ailu-y-tomy (no modificar ese servicio). Se pidió al usuario abrir la cuenta que contiene brickwell-api; respondió que iba a cambiarla y preguntó cuál. Se indicó la cuenta asociada a GaryPoui/Garayzar-Tomas-Brickwell, sin afirmar un email desconocido.
- GitHub CLI autenticado como GaryPoui al ejecutar fuera del sandbox. Dentro puede reportar token inválido por el bloqueo de red. No confundirlo con una credencial realmente vencida. Mantener todos los secretos fuera de Git.

## Actualización del 23/11/2026

Esta sección reemplaza las limitaciones de las notas anteriores. El usuario pidió revisar toda la consigna y luego autorizó completar los faltantes. El video queda a su cargo. La autorización anterior de detener pruebas correspondía al cierre del 16/11 y ya no aplica a esta tarea.

### Implementación de la entrega final

- SQLite local mediante `node:sqlite`, Node >=22.13. Base por defecto `backend/data/brickwell.sqlite`, ignorada por Git. `DATABASE_PATH=:memory:` en pruebas; no borrar ni resetear la base de uso habitual. Secuencias persistentes, índices únicos y transacciones para reservas y cupos de entradas.
- Autenticación separada en controlador, servicio, repositorios de usuarios/sesiones y middlewares. Modelos de usuario por rol. Sesiones revocables y persistentes, hashes scrypt y tokens aleatorios almacenados como hash.
- Registro exige nombre, email único, contraseña de 10 a 128 caracteres con mayúscula/minúscula/número, fecha de nacimiento con edad de 16 a 120 años y teléfono de 8 a 15 dígitos.
- El alta sin mesa fue retirada. Solo mesas existentes/sectores habilitados y combos activos, cantidades estrictas; precio calculado en servidor. Una reserva vigente por mesa/fecha y otra por cliente/fecha.
- Cancelación del cliente integrada en React con confirmación y conservación del historial. Anticipación por defecto de dos horas, configurable por ADMIN entre 2 y 168 horas. Solo el personal registra anticipos y descuentos. Recepción no puede eliminar definitivamente reservas. Los estados finales no se reabren y el check-in exige el día de la reserva.
- El personal crea reservas a nombre de un cliente previamente registrado mediante un selector. No se asignan al operador. La reserva conserva los precios acordados si solo cambia de estado. Las notas internas no se exponen al cliente.
- Carta real en `/api/carta`; se retiró el catálogo estático del frontend. Combos de carta y reservas comparten precios del backend. Gestión de sectores (cuatro mesas nuevas por sector), paquetes y carta; recepción solo cambia disponibilidad de tragos.
- Calendario público `/eventos` y flyer; gestión administrativa de eventos, publicación, estados, capacidad y entradas. Las imágenes opcionales son URLs HTTPS.
- Entradas: una vigente por cliente/evento, cupo transaccional, solicitud con pago pendiente, acreditación por personal, ingreso único y cancelación que libera cupo. Una gratuita se confirma automáticamente. Cancelar un evento cancela sus entradas y genera avisos. No se implementó una pasarela de cobro ni reembolso automático.
- Nuevas pantallas de usuarios/roles/baja lógica, perfil, historial, avisos privados, reportes financieros para ADMIN y políticas de cancelación. Avisos internos persistentes y recordatorios idempotentes; no email, SMS ni WhatsApp. Búsqueda de recordatorios cada minuto con API activa y al consultar avisos.
- `frontend/src/services/negocioService.js` centraliza los endpoints nuevos. `useRemote` maneja carga, cancelación, error y reintento. Se conserva el diseño y componentes de diálogos existentes.
- Playwright usa variables `env` compatibles con Windows y Linux. Pruebas aisladas en puertos 3101/5175 y SQLite en memoria; `NODE_ENV=test` eleva solo el límite de intentos de autenticación para la suite.
- Se normalizó el formato a LF mediante Prettier y `.gitattributes`. No reintroducir CRLF ni el alta de reservas sin mesa para mantener expectativas antiguas de pruebas.

### Ejecución y publicación

- Demo local: `npm --prefix backend run demo` y, en otra terminal, `npm --prefix frontend run dev`. Frontend en `http://localhost:5173/Garayzar-Tomas-Brickwell/`.
- ADMIN demo: `admin@brickwell.test` / `Brickwell-demo-12345`; recepción: `recepcion@brickwell.test` / `Recepcion-demo-12345`. Solo el modo demo configura estas cuentas y escucha en 127.0.0.1. El arranque normal no tiene credenciales predeterminadas.
- README principal, backend, frontend y ADMIN_DEMO actualizados. El README incluye un recorrido sugerido para el video; el video no fue grabado.
- Publicación del 23/11: código subido a `main`, commit `a36e4df0e0c3e676de94375f064d7cff03dc8fea`. GitHub Pages terminó build y deploy correctamente en la ejecución `45253650405`; la API de Render devolvió ese mismo commit en el campo `revision` de su healthcheck. Se verificaron registro, alta de reserva de prueba futura, rechazo de duplicado, cancelación, historial, disponibilidad liberada y revocación de sesión en la API pública. No confundir esta publicación con persistencia durable: Render gratuito conserva disco efímero y todavía no se provisionó un volumen.
- El usuario autorizó publicar y completar lo pendiente excepto el video. GitHub CLI está autenticado como GaryPoui y `VITE_API_URL` apunta a Render. Se preparó `render.persistent.yaml` (Starter + disco 1 GB + `/var/data/brickwell.sqlite`) sin activarlo: requiere aprobación de cargos recurrentes (costo base consultado: USD 7,25/mes, más impuestos/excedentes) y acceso a Render. Se sugirió instalar/conectar Render, aún no confirmado; quedó pendiente una pregunta de autorización de gasto. Computer Use se detuvo por no poder verificar la URL de Chrome; no volver a intentar UI en ese turno.
- Mantener explícitas las limitaciones: tarifas/plano de referencia, pago en el local, avisos internos, historial de combos reservados (no ventas independientes en barra).

### Verificación de este trabajo

- Backend: 12 pruebas aprobadas, con validaciones, permisos, conflictos, estados, cupo concurrente, recordatorios y una prueba entre procesos que conserva usuario/sesión/reserva además de secuencias.
- Frontend: 10 unitarias aprobadas; lint sin advertencias, comprobación de formato y build aprobados. El build conserva el aviso de tamaño del módulo Three.js cargado bajo demanda.
- Suite E2E final: **21/21 aprobadas**. Incluye cancelación, gestión, calendario/entradas, perfil, políticas, errores/reintentos y comprobaciones de accesibilidad y desbordes. Se corrigió una revocación de sesión involuntaria al guardar el perfil y se verificó su conservación al recargar. Capturas en `frontend/test-results` (ignoradas por Git).

## Actualización del 16/11/2026

Esta sección prevalece sobre las notas históricas inferiores cuando haya diferencias.

### Trabajo realizado

- Se inició la revisión de la consigna de integración completa, excluyendo el video. Ya existen autenticación, roles, catálogo y reservas con disponibilidad; no volver a implementarlos ni reemplazar el diseño existente.
- Se completó la cancelación propia en el backend: `DELETE /api/reservas/:id` requiere sesión y, para clientes, delega en `ReservaService.cancelarPropia`. Solo el titular puede cancelar una reserva pendiente o confirmada cuya fecha sea posterior al día actual.
- La cancelación conserva el registro con estado `CANCELADA` y libera la disponibilidad de la mesa. Una reserva ajena responde 404; un estado o una fecha que impiden cancelar responden 409 mediante el manejo centralizado de errores.
- Para el personal, el mismo endpoint conserva el borrado físico anterior. La modificación mediante `PUT` sigue restringida al personal. Se mantuvo la separación entre rutas, controlador, servicio y repositorio.
- Se agregó cobertura HTTP en `backend/test/auth.test.js` para titularidad, cancelación, rechazo de una segunda cancelación, conservación del registro y disponibilidad liberada. Se actualizó la expectativa anterior que prohibía cualquier DELETE de un cliente.
- El usuario pidió detener las pruebas y publicar el trabajo. No ejecutar más pruebas en este cierre ni afirmar que se verificó toda la consigna o el recorrido completo desde React.

### Pendientes para continuar

- Conectar la cancelación propia desde la agenda/listado del cliente, respetando los componentes y estilos existentes: acción de cancelar, confirmación, bloqueo durante el envío, mensajes de éxito/error y actualización del listado/disponibilidad desde la API. Hoy la nueva operación solo está disponible en backend.
- Mantener las peticiones HTTP centralizadas en `frontend/src/services`; comprobar cómo el servicio y el estado compartido existentes procesan el DELETE antes de reutilizarlos para la cancelación, ya que el registro cancelado no se elimina.
- Actualizar la documentación funcional/API para distinguir cancelación de cliente y eliminación del personal.
- Completar la revisión de las partes 1 a 4 de la consigna y documentar otros faltantes solo si se confirman. No se terminó una auditoría integral ni debe darse la entrega por completa.
- Cuando el usuario autorice retomar las comprobaciones, verificar el flujo de cliente desde React y los casos límite de fecha/estado, además de las comprobaciones necesarias del proyecto. El video queda expresamente fuera del alcance.
- El almacenamiento sigue siendo volátil: reiniciar el backend elimina los datos. No afirmar persistencia durable ni pagos reales. Un push al repositorio no acredita un despliegue verificado.

## Ampliación del 02/11/2026

- Actualización posterior: API desplegada en Render gratuito, `https://brickwell-api.onrender.com`; carpeta `backend`, Node 22, `npm ci`, `npm start`. GitHub `VITE_API_URL=https://brickwell-api.onrender.com/api`. CORS comprobado desde Pages. Mantiene memoria volátil y sin pagos ni autenticación: publicación de demostración.
- Conversión mobile-first de los cinco CSS: base móvil y ampliaciones min-width; prueba de inicio directo a 320 px. Cliente HTTP espera hasta 90 s en producción por arranque en frío, 15 s localmente.

- Catálogo real en `GET /api/catalogo`, opcionales `fecha` y `excluir`. Tres sectores orientativos, doce mesas y cuatro combos; no afirmar tarifas ni plano reales.
- Nuevas reservas usan `MesaReservaForm`: mapa relativo al escenario, capacidades, personas y cantidades de combos. Cliente continúa por ID. Reservas antiguas sin mesa conservan el editor anterior.
- Reservas con mesa calculan total en servidor, guardan desglose y rechazan duplicados por mesa/fecha (409). Estados pendiente, confirmada y activa ocupan; cancelada y finalizada liberan. Sin pasarela de pago ni persistencia durable.
- Backend con CORS configurable (`CORS_ORIGIN`) y plantilla `render.yaml`; GitHub Pages NO aloja la API. Desplegar API con cuenta propia y configurar `VITE_API_URL` antes de afirmar integración pública.
- La última hoja animada de la carta comparte contenido y estilos con el índice interactivo, incluidas categorías y paginación. Giro de tapa 1,1 s; tres hojas escalonadas completan en 1,26 s.
- `npm --prefix backend test` verifica catálogo, CORS, importes, combos, capacidad y disponibilidad por HTTP; E2E de frontend amplía mapa, errores de catálogo y conflicto de mesa.

Las notas siguientes son históricas; los puntos anteriores reemplazan las limitaciones antiguas de catálogo y formulario.

Actualizada el 26 de octubre de 2026.

## Proyecto y decisiones aceptadas

- Repositorio: `GaryPoui/Garayzar-Tomas-Brickwell`, rama de trabajo `main`. Verificar siempre el checkout y los cambios pendientes antes de continuar.
- El producto actual es un espacio de gestión de reservas. React + Vite en `frontend`; Express MVC en `backend`. El inicio redirige a `/reservas`; también existen `/agenda`, `/reservas/nueva` y `/reservas/:id/editar`.
- El usuario pidió un rediseño integral y autorizó reemplazar las decisiones estéticas anteriores. El brief utilizado fue `Prompt_rediseno_Brickells (1).md`, entregado desde Descargas. Las decisiones implementadas están resumidas en `frontend/design-review/README.md` para no depender de ese archivo externo.
- Se leyeron `2.Modelo del dominio.md` y los tres Word incorporados al repositorio, incluidas sus imágenes. El entregable anterior plantea una landing; el brief nuevo mantiene la gestión de reservas. El documento final contempla funciones futuras que la API todavía no implementa.
- Identidad implementada: azul tinta `#1A2540`, cobre `#A7432D`, fondo `#F4F6FA`, superficies blancas. Variables semánticas `--color-*` en `frontend/src/styles/global.css`; estructura en `layout.css` y pantallas en `reservas.css`.
- Manrope local para datos y formularios; Georgia para la marca. Sin fotografía de ambientación ni eslóganes repetidos en el panel. Estados con etiquetas explícitas y colores independientes de la marca; eliminación con tratamiento propio.
- Se instalaron y leyeron `frontend-design`, `webapp-testing` y `web-design-guidelines`. Su instalación pertenece al entorno personal de Codex; no se copian esas instalaciones al repositorio.
- Se consultaron SevenRooms, Death & Co, Linear y las guías de Vercel. OpenTable permitió consultar contenido textual pero falló al cargar visualmente en Chromium; no afirmar que se inspeccionó su interfaz visual.

## Contrato que debe conservarse

- CRUD real de reservas en `/api/reservas`, con respuestas `{ success, data }` y errores `{ success: false, message }`. Las peticiones se centralizan en `frontend/src/services/reservaService.js`.
- El backend almacena reservas en memoria: reiniciarlo elimina los registros. No sustituirlo con datos ficticios o almacenamiento local.
- No existen endpoints de catálogo. Cliente, sector y paquete se ingresan por ID con ayudas; no inventar nombres ni equivalencias.
- Conservar los cinco estados, ARS con formato argentino, fecha de alta desde mañana, horario válido, IDs enteros positivos, importes finitos no negativos y anticipo no mayor que el total.
- En edición se omite la fecha del PUT cuando no cambió, permitiendo modificar otros datos de reservas pasadas.
- Agenda: desde hoy, sin canceladas, por fecha y horario. No representa disponibilidad ni capacidad.
- Mantener filtros y paginación en la URL, consultas cancelables, controles bloqueados durante envíos, foco de diálogos, Escape, retorno del foco y confirmación de eliminación.
- El alcance del rediseño no incorpora autenticación, pagos, eventos ni permisos que todavía no estén implementados.

## Ejecución y comprobación

Requiere Node.js 22.12 o superior. Desde la raíz, iniciar en terminales separadas:

```bash
npm --prefix backend start
npm --prefix frontend run dev
```

Frontend en `http://localhost:5173`; API en `http://localhost:3000/api/reservas`. Verificar también `/api/reservas` a través del proxy del frontend. Los procesos deben comprobarse en cada nueva sesión: esta memoria no garantiza que sigan activos.

Controles ejecutados correctamente al cerrar el rediseño:

```bash
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run format:check
npm --prefix frontend run build
npm --prefix frontend run test:e2e
git diff --check
```

- Las seis E2E usan una API aislada en 3101 y Vite en 5175; esos puertos deben estar libres. No reutilizar el backend habitual para datos de prueba.
- Se comprobaron 320, 390, 768, 1280 y 1440 px: listado vacío/cargado, agenda y formulario con errores sin desborde horizontal global. Axe no detectó problemas en los estados cubiertos; esto no acredita una auditoría manual integral.
- Capturas entregables y decisiones: `frontend/design-review/`. Los datos fotografiados provienen de la API temporal de pruebas; el servidor habitual no recibió reservas de demostración.
- Capturas adicionales: `frontend/test-results`, ignorado por Git y regenerado por las E2E. Antes de capturar, esperar el encabezado y las filas de la ruta destino y volver al inicio de la página.
- Para capturas de solo lectura del servidor habitual: desde `frontend`, ejecutar `node design-review/capture.mjs` con ambos servicios activos.

## Publicación y continuidad

- El usuario pidió guardar esta memoria y subirla al repositorio junto con todos los cambios del rediseño.
- Incluir código, documentación, capturas entregables y esta memoria; conservar las exclusiones existentes para dependencias, builds, archivos de entorno y resultados temporales.
- La nota equivalente de memoria personal de Codex debe guardarse como un archivo nuevo en `~/.codex/memories/extensions/ad_hoc/notes/`; no editar directamente el registro de memorias.
- Después de publicar, verificar que el commit local coincide con `origin/main` y que el árbol queda limpio. No confundir un push a GitHub con un despliegue web.
