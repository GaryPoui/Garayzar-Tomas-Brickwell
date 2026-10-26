# Prompt para rediseñar Brickell’s

Preparado el 26/10/2026 a partir de la rama `main` de https://github.com/GaryPoui/Garayzar-Tomas-Brickwell.

Este archivo contiene un prompt completo para entregar a un agente de programación. La revisión que lo origina se basó en la estructura del repositorio, los README, el modelo de dominio y el código de las pantallas, estilos, componentes, integración y validaciones. No se ejecutó la aplicación ni se inspeccionaron visualmente sus pantallas; el agente implementador deberá hacerlo. Los documentos Word del repositorio deberán leerse durante esa etapa. El boceto original no está incluido, según el README.

---

## Inicio del prompt — copiar desde aquí

Actuá como diseñador de producto y desarrollador frontend senior. Quiero que rediseñes e implementes una nueva identidad visual para mi aplicación Brickell’s, un sistema de reservas de un pub bar y boliche.

Repositorio: https://github.com/GaryPoui/Garayzar-Tomas-Brickwell.git

No me convencen los colores actuales ni la dirección visual que había pensado anteriormente. Tenés libertad para replantear la composición, la tipografía, los componentes y el lenguaje visual. Busco un cambio perceptible y coherente en todas las pantallas, más profundo que cambiar el color de los botones. Elegí la propuesta principal de este brief y avanzá con la implementación sin detenerte por decisiones visuales rutinarias.

### 1. Entendé la aplicación antes de diseñar

Inspeccioná el estado actual del repositorio, sus instrucciones locales y cambios pendientes. Leé los README, `2.Modelo del dominio.md` y los documentos Word para comprender el negocio y los requisitos académicos. Diferenciá los requisitos funcionales de las decisiones estéticas anteriores: estas últimas pueden reemplazarse.

La versión revisada utiliza:

- React 19, Vite y React Router en `frontend`.
- CSS propio en `frontend/src/styles/global.css`, `layout.css` y `reservas.css`.
- Manrope y Barlow Condensed mediante Fontsource; iconos Lucide.
- Express y arquitectura MVC en `backend/src`.
- Un CRUD real de reservas en `/api/reservas`, con datos almacenados en arrays en memoria.
- Playwright, axe, pruebas unitarias, Oxlint y Prettier.

El producto implementado es un espacio de gestión. Las rutas actuales son `/reservas`, `/agenda`, `/reservas/nueva` y `/reservas/:id/editar`, además de la pantalla para rutas inexistentes. El inicio redirige a reservas. Conservá ese propósito y esos recorridos.

El dominio contempla usuarios, clientes, empleados, administradores, sectores, paquetes, eventos, flyers, entradas y carta. Sin embargo, la API actual solo implementa reservas. No agregues pantallas operativas de esos otros módulos ni simules autenticación, compra de entradas, pagos o disponibilidad para completar el diseño.

Clientes, sectores y paquetes actualmente se ingresan mediante IDs. Mejorá la explicación y la presentación de esos campos. Solo podrán convertirse en selectores con nombres reales si encontrás endpoints existentes y utilizables; no inventes un catálogo ni asignaciones como “sector 1 = VIP”.

### 2. Usá estas referencias con un propósito concreto

Abrí las referencias y examiná las capturas de producto o pantallas públicas disponibles antes de trasladar patrones. Si no podés visualizar alguna, informá esa limitación; no afirmes haber visto pantallas privadas. Las siguientes aplicaciones tienen alcances mayores que Brickell’s: tomá criterios de diseño, no sus funcionalidades completas.

| Referencia | Qué estudiar y adaptar | Aplicación en Brickell’s |
| --- | --- | --- |
| SevenRooms — https://sevenrooms.com/platform/table-management/ | Organización del trabajo de reservas, visibilidad de estados y lectura rápida durante un turno. Revisar especialmente las imágenes del producto, no solo la landing comercial. | Listado, agenda, jerarquía de fecha/horario y estado. No implementar plano de mesas ni capacidad sin datos que lo respalden. |
| OpenTable — https://www.opentable.com/ | Patrones públicos de búsqueda, filtros y selección de fecha y horario. | Barra de filtros fácil de comprender y formulario con una secuencia clara. Mantener el contexto de gestión interna. |
| Death & Co — https://www.deathandcompany.com/ | Referencia de identidad de un negocio de coctelería: estudiar fotografía, tratamiento de marca y relación entre ambiente y reservas. | Personalidad de marca en navegación y detalles. Mantener la fotografía contenida para priorizar los datos. |
| Linear — https://linear.app/features | Estudiar las imágenes del producto para aprender sobre jerarquía, navegación, alineación y densidad de información. | Una estructura ordenada y consistente entre listado, agenda, detalle y formulario. Adaptar los principios al pub, sin copiar su identidad. |

Combiná la claridad operativa de las referencias de reservas, la identidad de un bar y la disciplina de una aplicación de trabajo. No copies logotipos, textos, ilustraciones ni composiciones completas. No conviertas el panel en una landing con un hero gigante, carruseles o secciones comerciales que desplacen las reservas.

### 3. Aplicá skills reales de diseño y revisión

Si tu entorno admite skills, buscá estas por nombre y autor y leé sus instrucciones completas. Si no están instaladas, consultá sus fuentes como guía. No bloquees el trabajo por la instalación de una skill ni afirmes usar una que no tenés disponible. El brief del usuario y el contrato funcional del proyecto tienen prioridad.

1. **`frontend-design`, de Anthropic**
   Fuente: https://github.com/anthropics/skills/tree/main/skills/frontend-design
   Usala para definir dirección artística, jerarquía tipográfica, composición e identidad propia. Elaborá un plan breve y revisalo contra el negocio antes de construir. Evitá que el resultado parezca una plantilla genérica.

2. **`web-design-guidelines`, de Vercel Labs**
   Fuente: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
   Usala para auditar los archivos del frontend modificados. Consultá también https://vercel.com/design/guidelines y las reglas actuales que referencia la skill. Revisá foco, teclado, formularios, contraste, semántica, estados y comportamiento móvil. Corregí los hallazgos relevantes.

3. **`webapp-testing`, de Anthropic**, como complemento de validación.
   Fuente: https://github.com/anthropics/skills/tree/main/skills/webapp-testing
   Sirve para inspección del navegador y capturas. El proyecto ya tiene Playwright en JavaScript: aprovechá primero su configuración y sus pruebas; evitá introducir otra infraestructura de pruebas si no hace falta.

Las dos primeras orientan diseño y revisión de interfaz; la tercera ayuda a comprobar el resultado implementado.

### 4. Nueva dirección de color

El código revisado tiene verde lima `#D6F587`, verdes oscuros y apagados, y fondo `#F4F5F2`. Reemplazá esa identidad completa: hay colores escritos directamente en los tres archivos CSS, además de las variables de `:root`. No alcanza con modificar `--accent`.

**Propuesta principal: azul tinta + cobre + blanco frío.**

Quiero una estética de bar contemporáneo, con carácter nocturno en la marca y buena legibilidad durante el trabajo. El azul organiza la estructura; el cobre destaca las acciones; las superficies claras permiten consultar reservas sin fatiga visual. Estos colores son una propuesta nueva para Brickell’s, no una paleta extraída de las referencias.

| Rol | Color | Uso |
| --- | --- | --- |
| Marca y navegación | `#1A2540` | Sidebar y elementos de identidad. |
| Acción principal | `#A7432D` | Crear, guardar y acción principal del diálogo; texto blanco. |
| Acción al pasar el puntero | `#873421` | Hover de la acción principal. |
| Fondo general | `#F4F6FA` | Área de trabajo. |
| Superficie | `#FFFFFF` | Listados, campos y paneles. |
| Texto principal | `#182033` | Datos, títulos y etiquetas. |
| Texto secundario | `#5C6475` | Ayudas y metadatos legibles. |
| Borde decorativo | `#DDE2EB` | Separadores de superficies. Para límites de controles, ajustar al contraste necesario. |
| Acento suave | `#F7E8E1` | Fondos de selección y detalles vinculados al cobre. |

Definí variables semánticas como `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-brand`, `--color-primary`, `--color-primary-hover`, `--color-border` y `--color-focus`. Ajustá la combinación de cada componente según su contraste real. Los bordes decorativos suaves no sustituyen el indicador de foco ni los límites necesarios para reconocer un campo.

Separá los colores de marca de los estados funcionales. Pendiente, confirmada, activa, finalizada y cancelada deben conservar etiquetas explícitas y distinguirse sin depender únicamente del color. No uses el cobre de la acción principal para identificar por sí solo una eliminación: la acción destructiva necesita texto y tratamiento propios.

Estas son alternativas completas, por si luego quiero elegir otra dirección. No mezcles las tres ni construyas un selector de temas:

| Dirección | Marca / estructura | Acción principal | Fondo | Sensación buscada |
| --- | --- | --- | --- | --- |
| Azul tinta y cobre — predeterminada | `#1A2540` | `#A7432D` | `#F4F6FA` | Bar contemporáneo, sobrio y cálido en sus acentos. |
| Ciruela y rosa | `#40243A` | `#9B365F` | `#F8F4F7` | Más expresiva y vinculada a la noche. Acento decorativo rosa `#F3A9BC`. |
| Petróleo y champán | `#163C46` | `#175766` | `#F3F6F7` | Reservada y elegante. Champán `#E5BD7D` para pequeños acentos o navegación con texto oscuro. |

Implementá la primera de forma consistente. La ausencia de una elección posterior no debe detener el trabajo.

### 5. Rediseño por pantalla

**Estructura general**

- Conservá el nombre Brickell’s y la identificación de pub bar y night club. No confundas el nombre del repositorio con la marca del negocio.
- Navegación sencilla para reservas, agenda y creación. La ruta activa tiene que reconocerse por forma o indicador además de color.
- Reducí el protagonismo de la fotografía y los eslóganes repetidos. La foto actual `src/assets/bar.jpg` es de ambientación, no una imagen verificada del local.
- La fotografía puede omitirse si no aporta. No agregues recursos remotos innecesarios.
- Usá una tipografía de lectura para datos y formularios; reservá una segunda familia, si se justifica, para la marca. Podés conservar Manrope y Barlow Condensed si su tratamiento funciona con la nueva dirección.
- Escala orientativa: títulos principales de 28–36 px, cuerpo de 14–16 px y datos secundarios de 12–14 px. Evitá las etiquetas de 9–10 px presentes en parte del CSS actual. En móvil, campos de al menos 16 px para evitar zoom automático.
- Espaciado consistente con una base de 4/8 px, bordes discretos y radios moderados. No rodees cada texto con una tarjeta.

**Reservas**

- Encabezado directo con título, contexto útil y una acción “Nueva reserva” claramente prioritaria.
- Resumen compacto calculado con los datos reales. Cada indicador debe explicar qué cuenta. No llames “ingresos cobrados” a la suma de precios de reservas, ni “ocupación” a un valor que no tiene capacidad disponible como denominador.
- Búsqueda, fecha y estado juntos, con filtros activos comprensibles y opción de limpiar. Conservá filtros y paginación en la URL.
- En escritorio, listado con columnas bien alineadas: reserva/cliente, fecha/horario, sector/paquete, importes, estado y acciones. Usá números tabulares para importes.
- Podés mantener la lista actual o convertirla en una tabla semántica si mejora la experiencia. Si la convertís, asegurá encabezados y lectura accesible.
- En móvil, reordená cada reserva para que se lean primero identificación, fecha y estado, con importes y acciones accesibles. Evitá scroll horizontal global.
- Conservá búsqueda, filtros, paginación, detalle, edición, eliminación y actualización.

**Agenda**

- Diferenciala mediante agrupaciones por fecha, encabezados claros y orden cronológico.
- Conservá el criterio actual: desde hoy y sin reservas canceladas.
- No presentes un calendario de disponibilidad, un plano de mesas ni cupos inventados. La agrupación por fecha ya puede ofrecer una experiencia útil.

**Crear y editar**

- Agrupá los campos en fecha/horario, referencias de cliente/sector/paquete e importes.
- Es un solo formulario: los grupos no necesitan numerarse como si fueran un asistente de tres pasos.
- Etiquetas persistentes, ayudas breves y errores junto a los campos. No reemplaces etiquetas por placeholders.
- Resumen de fecha, horario, precio total, anticipo y saldo pendiente. En escritorio puede acompañar al formulario; en móvil debe seguir un orden natural sin tapar los botones.
- No muestres “Tu reserva” como si hubiera una cuenta de cliente autenticada: usá “Resumen de la reserva”.
- Crear y guardar deben comunicar progreso, evitar envíos dobles y ofrecer errores recuperables.

**Detalle, eliminación y estados especiales**

- Aplicá el mismo sistema visual a los diálogos, notificaciones, pantalla inexistente, carga, error de conexión, listado vacío y búsqueda sin resultados.
- Mantené el foco dentro del diálogo, Escape y la devolución del foco al cerrarlo.
- Eliminar exige confirmación con identificación de la reserva y una opción clara para conservarla.
- Los estados vacíos orientan hacia una acción útil. No rellenes la aplicación con reservas de demostración para que el diseño parezca completo.
- Evitá exponer terminología técnica como “API conectada” en el flujo principal si no ayuda al operador. Conservá la información de error y recuperación cuando la conexión falla.

### 6. Contrato funcional que debe sobrevivir al rediseño

- Mantené los cinco endpoints y los formatos `{ success, data }` y `{ success: false, message }`.
- Conservá las peticiones en `frontend/src/services/reservaService.js`; evitá llamadas dispersas desde los componentes.
- No sustituyas el backend por mocks, localStorage o datos ficticios. El almacenamiento en memoria y su pérdida al reiniciar deben seguir documentados.
- En el alta, la fecha debe ser desde mañana y el servidor asigna `PENDIENTE`.
- Conservá las validaciones de horario, IDs enteros positivos, importes finitos no negativos y anticipo menor o igual al total del formulario.
- En edición, mantené el tratamiento especial que omite la fecha del PUT si no cambió, para no impedir actualizar otros campos de reservas pasadas.
- Conservá los cinco estados existentes y la moneda ARS con formato argentino.
- Mantené las cancelaciones de consultas, el manejo de errores y los controles deshabilitados durante los envíos.
- No modifiques el alcance académico ni el backend para resolver decisiones visuales. Si descubrís un problema funcional fuera del rediseño, documentalo aparte.

### 7. Proceso y comprobación

1. Ejecutá la versión actual, inspeccioná todas las rutas y registrá capturas de referencia si tu entorno lo permite.
2. Escribí un plan breve con paleta, tipografía, jerarquía y cambios concretos por pantalla. Revisalo contra este brief y avanzá a implementarlo.
3. Trabajá sobre los componentes compartidos y los tres archivos de estilos para lograr consistencia. Reemplazá también los colores directos que mantengan la identidad verde anterior. No acumules parches CSS contradictorios.
4. Respetá las dependencias actuales. No migres a Next.js, Tailwind o una biblioteca de componentes únicamente por comodidad; el rediseño puede resolverse con la base existente.
5. Revisá teclado, foco visible, etiquetas, mensajes anunciados, contraste WCAG AA y movimiento reducido. Apuntá a 4,5:1 para texto normal y 3:1 cuando corresponda para texto grande y elementos de interfaz. Los controles táctiles deben ser cómodos; apuntá a 44 × 44 px.
6. Probá al menos 320, 390, 768, 1280 y 1440 px, con datos vacíos, reservas cargadas y formularios con errores. Generá capturas y miralas para corregir cortes, alineaciones, espacios excesivos y texto pequeño. No alcanza con que el build pase.
7. Ejecutá los controles existentes desde `frontend`: `npm test`, `npm run lint`, `npm run format:check`, `npm run build` y `npm run test:e2e`. Instalá dependencias y Chromium si corresponde. Las E2E actuales usan servidores aislados: respetá su configuración y evitá tocar datos del servidor habitual.
8. Si cambia el texto de la interfaz, actualizá las expectativas de las pruebas cuando corresponda, manteniendo la intención de las verificaciones. No elimines pruebas ni reduzcas cobertura para ocultar una regresión.
9. Si algún control no puede ejecutarse por el entorno, indicá exactamente cuál y por qué. No declares una verificación que no hiciste.

### 8. Entrega esperada

Entregá el rediseño implementado, no solo recomendaciones o una maqueta. Incluí:

- Código coherente con la estructura existente.
- Resumen de la nueva identidad y de qué criterio tomaste de cada referencia realmente consultada.
- Variables de color y componentes reutilizables que faciliten ajustes posteriores.
- Capturas de escritorio y móvil de listado, agenda y formulario, si el entorno permite generarlas.
- Resultados reales de pruebas y limitaciones pendientes.
- README actualizado si cambian instrucciones o decisiones de diseño documentadas.

El resultado debe sentirse como una aplicación de reservas diseñada para Brickell’s: reconocible, cómoda para trabajar y coherente de principio a fin. Se tiene que notar el cambio en composición, jerarquía y componentes además del cambio de paleta.

## Fin del prompt
