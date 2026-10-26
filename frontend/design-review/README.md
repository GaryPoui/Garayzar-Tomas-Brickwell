# Rediseño de Brickell’s

## Dirección y criterio

La propuesta sigue el brief de rediseño del 26/10/2026: un espacio de gestión de reservas con identidad de pub bar y night club. Se leyeron los README, el modelo del dominio y los tres Word del repositorio, incluidas las imágenes incrustadas en la investigación y el entregable visual.

La composición usa una navegación nocturna, una zona de trabajo clara y un solo acento de acción. La marca lleva el carácter tipográfico; los datos mantienen una lectura sobria. La referencia local es el rótulo de la fachada incluida en la investigación, sin pretender reproducir su logotipo. La propuesta reemplaza tanto el verde lima anterior como el índigo/lavanda del entregable.

| Rol | Valor | Criterio |
| --- | --- | --- |
| Estructura y marca | `#1A2540` | Navegación y resumen de la reserva |
| Acción principal | `#A7432D` | Crear y guardar, con texto blanco |
| Hover principal | `#873421` | Respuesta al puntero |
| Fondo de trabajo | `#F4F6FA` | Separar estructura de contenido |
| Superficies | `#FFFFFF` | Datos y formularios |
| Texto | `#182033` | Jerarquía y legibilidad |
| Texto secundario | `#5C6475` | Ayudas y contexto |
| Foco | `#315CB3` | Indicador de teclado |

Manrope local se utiliza para toda la información. Georgia queda reservada para la marca. La escala es de 30–34 px para títulos, 14–16 px para lectura/controles y 12–13 px para metadatos. Los campos móviles tienen 16 px. Los controles y acciones tienen al menos 44 px de alto; los botones de icono miden 44 × 44 px.

La revisión del plan contra el negocio descartó un hero comercial, la fotografía genérica, los pasos numerados y una tarjeta por dato. Se mantuvo una banda de resumen compartida, una lista de trabajo y una ficha lateral para el formulario. Los acentos de marca no sustituyen las etiquetas de estado ni el tratamiento de eliminación.

## Pantallas

- **Reservas:** título directo, acción principal visible, indicadores con alcance explícito, filtros juntos y filtros activos legibles. El listado conserva las seis columnas en escritorio y se reorganiza en móvil.
- **Agenda:** agrupación por fecha con encabezados propios. Desde hoy y sin canceladas, ordenada por fecha y horario. No representa disponibilidad ni cupos.
- **Alta/edición:** tres grupos sin numeración, ayudas para los IDs y resumen de fecha, horario, total, anticipo y saldo. En móvil, el resumen precede a las acciones también en el orden del documento.
- **Detalle, confirmación y recuperación:** mismos tokens y componentes para diálogos, notificaciones, carga, errores, lista vacía, filtros sin resultados y rutas inexistentes.

Se conserva el servicio HTTP, el contrato de los cinco endpoints, los estados existentes, las validaciones, las cancelaciones de consultas y el tratamiento de fechas sin cambios al editar. No se modificó el backend ni se agregaron dependencias.

## Referencias realmente consultadas

- [SevenRooms](https://sevenrooms.com/platform/table-management/): se abrió la página y se capturó su imagen pública de gestión con listado de llegadas junto al plano. Se adaptó la jerarquía de horario/estado; no se incorporó el plano ni capacidad.
- [Death & Co](https://www.deathandcompany.com/): se capturó la portada pública con fotografía de bar y una marca tipográfica protagonista. Se tomó la distinción entre identidad del local e información de trabajo; la fotografía no se trasladó al panel.
- [Linear](https://linear.app/features): se abrieron y capturaron secciones públicas de producto. Se tomó la separación de navegación/contenido y la disciplina de alineación. No se accedió a una cuenta ni se afirma haber inspeccionado pantallas privadas.
- [OpenTable](https://www.opentable.com/): se consultó el contenido público sobre búsqueda y filtros. Chromium devolvió `ERR_HTTP2_PROTOCOL_ERROR` en dos intentos; no se pudo verificar visualmente su interfaz. No se atribuye una composición visual observada a esta referencia.
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) y [reglas de revisión](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): se consultaron para revisar foco, formularios, teclado, semántica, movimiento reducido y tamaño táctil.

Se instalaron y leyeron `frontend-design` y `webapp-testing` de Anthropic y `web-design-guidelines` de Vercel. Se aprovechó el Playwright JavaScript existente, conforme al brief, sin incorporar otra infraestructura.

## Capturas

Las capturas con datos provienen exclusivamente de la API aislada de pruebas; no se cargaron reservas ficticias en el servidor habitual. Los IDs y fechas reflejan esa ejecución temporal.

| Pantalla | Escritorio | Móvil |
| --- | --- | --- |
| Reservas con los cinco estados | [Ver](reservas-datos-desktop.png) | [Ver](reservas-datos-mobile.png) |
| Agenda con reservas | [Ver](agenda-datos-desktop.png) | [Ver](agenda-datos-mobile.png) |
| Formulario | [Ver](formulario-desktop.png) | [Ver](formulario-mobile.png) |
| Formulario con errores | [Ver](formulario-errores-datos-desktop.png) | [Ver](formulario-errores-datos-mobile.png) |
| Listado vacío | [Ver](reservas-desktop.png) | [Ver](reservas-mobile.png) |

Las E2E generan además capturas en `frontend/test-results` a 320, 390, 768, 1280 y 1440 px para listado cargado, agenda, formulario con errores y listado vacío. Ese directorio se regenera en cada ejecución. Las capturas anteriores y de referencias se guardaron localmente para comparación y están ignoradas por Git.

Para actualizar las capturas del servidor habitual, desde `frontend`, con ambos servicios activos:

```bash
node design-review/capture.mjs
```

Este script solo consulta páginas. Para regenerar las vistas con datos aislados, ejecutar `npm run test:e2e`.

## Verificación

- Pruebas unitarias de servicio y validaciones: correctas.
- Oxlint, Prettier y build de producción: correctos.
- Seis pruebas E2E con API real aislada: correctas. Cubren CRUD, filtros, paginación, agenda, errores y reintentos, diálogo de eliminación y navegación por historial.
- Axe: sin hallazgos en los estados cubiertos (listado vacío/cargado, detalle y formulario con errores). No equivale a una auditoría manual integral.
- Comprobaciones de ancho: sin desborde horizontal global en los cinco tamaños.
- Revisión visual de capturas de escritorio y móvil, con corrección del contorno del contenedor principal y de la sincronización de las capturas con la navegación.

La revisión de los archivos modificados corrigió: controles sin `name`/autocomplete en filtros, ausencia de una etiqueta visible de búsqueda, tamaño insuficiente de acciones y textos secundarios, colores anteriores escritos directamente y orden del resumen/acciones en móvil. Los controles interactivos conservan foco visible; el contenedor `main` recibe foco al navegar sin dibujar un marco alrededor de todo el espacio de trabajo.

## Límites del producto

La API guarda reservas en memoria: reiniciarla elimina los registros. No existen endpoints de catálogo, por lo que se siguen ingresando IDs. Los documentos describen autenticación, permisos, eventos, pagos y disponibilidad como alcance del sistema completo; este rediseño no los implementa ni representa como disponibles. El HTML `mockup_brickells.html` mencionado en el Word no se encuentra en el checkout; sí se inspeccionó el mockup incrustado.
