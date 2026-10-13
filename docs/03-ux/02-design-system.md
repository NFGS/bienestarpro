---
name: BienestarPro
description: "Design system institucional del área de Bienestar al Aprendiz: claro, accesible y operable sin conexión."
colors:
  primary: "#2B7A00"
  primary-hover: "#236300"
  primary-pressed: "#1C4E00"
  on-primary: "#FFFFFF"
  brand-green: "#39A900"
  accent-orange: "#FF7B00"
  surface: "#FFFFFF"
  surface-alt: "#F3F6F0"
  text-primary: "#202A19"
  text-secondary: "#55654B"
  text-disabled: "#8A9683"
  border-input: "#76856E"
  border-subtle: "#D5DFCE"
  success: "#157347"
  success-tint: "#E5F3E8"
  warning: "#8F5B00"
  warning-tint: "#FDF3DC"
  error: "#B3261E"
  error-tint: "#FBECEA"
  info: "#0F5CA8"
  info-tint: "#E8F1FA"
  neutral-tint: "#EDF1EB"
  focus-ring: "#1C4E00"
  qr-ink: "#000000"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.01em"
  small:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "12px 24px"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "12px 24px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "12px 24px"
  button-tertiary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "12px 16px"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "12px 24px"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "52px"
    padding: "12px 16px"
  chip-success:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-warning:
    backgroundColor: "{colors.warning-tint}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-error:
    backgroundColor: "{colors.error-tint}"
    textColor: "{colors.error}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-info:
    backgroundColor: "{colors.info-tint}"
    textColor: "{colors.info}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-neutral:
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  card-event:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
  banner-offline:
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  banner-sync:
    backgroundColor: "{colors.info-tint}"
    textColor: "{colors.info}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  banner-error:
    backgroundColor: "{colors.error-tint}"
    textColor: "{colors.error}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  banner-success:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  nav-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    height: "64px"
    padding: "8px 16px"
  nav-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    height: "64px"
    padding: "8px 16px"
---

# Design System: BienestarPro

**Estado:** v0.1, Fase 3 (UX). Establecido antes de la implementación de la interfaz; cuando exista código de UI se vuelve a extraer los tokens reales y se genera el DESIGN.md raíz con su sidecar `.impeccable/design.json`.

**Fecha:** 2026-10-12

**Fuentes:** `SPEC.md` sección 3 (roles); ERS v0.1 (RNF-01, RNF-02, RNF-04, RNF-05, RNF-12); `02-casos-de-uso.md` (CU-12, CU-14, CU-15); `00-revision-muestras-diseno.md` (anti-referencia visual).

**Nota de modo:** el frontmatter YAML es la capa normativa de tokens (formato DESIGN.md de Google Stitch); el cuerpo en markdown explica dónde y por qué se aplica cada token. Los contrastes fueron calculados con la fórmula de luminancia relativa de WCAG 2.1 y verificados por script; el MCP `google-design` no estaba disponible en esta sesión, por lo que la paleta se derivó de la identidad institucional SENA (verde y naranja) y se validó con cálculo exacto.

## Overview

**Creative North Star: "La señalética clara"**

La interfaz de BienestarPro se comporta como la buena señalética de un centro de formación: se lee de lejos, muestra siempre dónde se está y qué está pasando, y anuncia el siguiente paso con una sola indicación por vez. El tono es institucional y sereno, propio del SENA: confianza y claridad por encima de la expresión. Como anti-referencia explícita quedan registradas las muestras externas revisadas (`00-revision-muestras-diseno.md`): no se adopta su tema oscuro cinematográfico, su densidad alta ni su estética de entretenimiento, porque perjudican la legibilidad en aulas y patios con luz variable y elevan la carga cognitiva para personas con baja alfabetización digital (RNF-01, RNF-04).

La densidad es cómoda y móvil primero: el aprendiz opera desde un celular económico con datos limitados, de pie en un patio o en la fila de la cafetería, con prisa durante la entrega de refrigerios (CU-14). Por eso cada pantalla tiene un propósito y una sola acción principal, con objetivos táctiles grandes. Los roles institucionales (coordinación, auxiliar, cafetería) trabajan en escritorio con listas, tablas simples e informes; el mismo sistema de tokens sirve a ambos mundos sin bifurcarse.

El material es sobrio: tema claro único en v1, superficies planas separadas por bordes, sombras solo cuando algo flota o responde, movimiento breve (150 a 200 ms) y funcional. La identidad no depende de recursos pesados: cero fuentes descargadas, iconos SVG en línea, imágenes sobrias. La aplicación debe instalar, abrir y operar igual con datos limitados o sin conexión (RNF-02, RNF-12), y responder con agilidad en la operación de jornada (RNF-05).

**Principios de diseño** (derivados de las restricciones reales del proyecto):

| # | Principio | Qué significa | Qué lo funda |
|---|---|---|---|
| 1 | Una tarea por pantalla | Cada pantalla tiene un propósito y una sola acción principal; los flujos largos se parten en pasos (ver detalle del evento, confirmar, ver el resultado) | RNF-01 (80% de tareas clave sin ayuda, SUS 70 o más); baja alfabetización digital; prisa en la entrega (CU-14) |
| 2 | Acciones grandes y visibles | Botones de 48 px en móvil, texto de 18 px, acción primaria visible sin desplazarse; nada de acciones ocultas tras gestos o menús | RNF-01, RNF-04; contexto físico (aulas, patios, cafetería) |
| 3 | El estado siempre es visible | Sin conexión, enviando, confirmado, entregado, plazo vencido: banners y chips con icono y texto; nunca incertidumbre | RNF-02 (offline-first); CU-14 FA-3; CU-16 FA-1 |
| 4 | Español claro, cero jerga | Verbos directos, frases cortas, sin anglicismos ni tecnicismos ("Enviando...", no "sincronizando"; "Sin conexión", no "modo offline") | RNF-01; convención del proyecto (documentación y UI en español claro) |
| 5 | Ligero y estable con datos limitados | Cero fuentes descargadas, tema claro único, movimiento mínimo; la red lenta o ausente nunca bloquea la operación crítica | RNF-02, RNF-05, RNF-12; contexto de datos limitados de los aprendices |

**Key Characteristics:**

- Tema claro institucional en verde SENA profundo; un solo verde para texto y acciones (#2B7A00).
- Tipografía del sistema; ningún texto por debajo de 16 px; cuerpo de 18 px.
- Densidad cómoda: filas de lista de 56 px mínimo; objetivo táctil de 44 px mínimo (48 px en móvil para acciones principales).
- Superficies planas con borde; la sombra solo señala flotación o respuesta.
- El estado se comunica con icono + texto + color, nunca con color solo.
- Navegación con etiquetas siempre visibles, nunca solo iconos.
- Movimiento breve (150 a 200 ms) que se anula con `prefers-reduced-motion`.
- Operación sin conexión visible y sin jerga: contadores concretos ("3 entregas por enviar").

## Colors

Paleta institucional serena: el verde SENA profundo es la única voz de acción, los neutros con matiz verde ordenan las superficies, y una familia semántica cubre los estados del sistema (éxito, advertencia, error, información, sin conexión).

### Primary

- **Verde SENA profundo** (#2B7A00): la voz única de acción y de enlace. Botón primario de cada pantalla ("Confirmar asistencia", "Escanear código"), enlaces dentro de texto, elemento activo de la navegación. Sobre blanco: 5.40:1.
- **Verde SENA profundo, hover** (#236300): estado hover del botón primario. Con texto blanco: 7.35:1.
- **Verde SENA profundo, presionado** (#1C4E00): estado activo del botón primario. Con texto blanco: 9.82:1.
- **Texto sobre primario** (#FFFFFF): texto de los botones primarios. Sobre el primario: 5.40:1.
- **Verde oficial SENA** (#39A900): solo elementos gráficos no textuales: barras de progreso, ilustración, acentos grandes. Sobre blanco mide 3.07:1: alcanza para gráficos (3:1, WCAG 1.4.11) pero no para texto (4.5:1). Nunca se usa como color de texto.

### Secondary

- **Naranja institucional** (#FF7B00): decorativo puro. Franja fina de identidad en el borde superior de la barra de navegación y acentos gráficos. Sobre blanco mide 2.60:1, por lo que nunca carga significado por sí mismo; cuando el naranja avisa algo (advertencia), habla el ámbar institucional.
- **Ámbar institucional** (#8F5B00): texto y bordes de advertencia: plazo vencido, cupo agotado, ventana de confirmación cerrada, entrega duplicada. Sobre blanco: 5.73:1; sobre su tinte: 5.19:1.

### Neutral

- **Superficie** (#FFFFFF): tarjetas, campos, hojas de confirmación, barra de navegación.
- **Fondo alterno** (#F3F6F0): fondo de la aplicación, encabezados de tabla, hover del botón secundario. Neutro con matiz verde.
- **Texto principal** (#202A19): casi negro con matiz verde; todo el texto de lectura. Sobre blanco: 14.93:1.
- **Texto secundario** (#55654B): metadatos, marcas de tiempo, texto de apoyo, navegación inactiva. Sobre blanco: 6.27:1.
- **Texto deshabilitado** (#8A9683): solo controles inactivos. Exento de contraste según WCAG 1.4.3 (componentes inactivos); se documenta por honestidad.
- **Borde de campo** (#76856E): borde de 1.5 px de los campos de formulario. Sobre blanco: 3.92:1 (cumple 1.4.11).
- **Borde sutil** (#D5DFCE): bordes de tarjetas y divisores. Decorativo, sin requisito de contraste.
- **Tinte neutro** (#EDF1EB): fondo del banner "Sin conexión" y del chip "Cerrado".

### Colores de estado

- **Éxito** (#157347) sobre **tinte de éxito** (#E5F3E8): confirmado, entregado, enviado. En el tinte: 5.12:1.
- **Advertencia** (#8F5B00) sobre **tinte de advertencia** (#FDF3DC): plazo vencido, cupo agotado, rechazos con motivo. En el tinte: 5.19:1.
- **Error** (#B3261E) sobre **tinte de error** (#FBECEA): fallos de envío, entregas rechazadas. En el tinte: 5.69:1.
- **Información** (#0F5CA8) sobre **tinte de información** (#E8F1FA): "Enviando..." y avisos en progreso. En el tinte: 5.90:1.
- **Anillo de foco** (#1C4E00): doble anillo (blanco interior + verde oscuro exterior). Sobre superficie: 9.82:1.
- **Tinta del QR** (#000000) sobre superficie: módulos del código QR. 21:1, para fiabilidad de escaneo.

### Contrastes verificados (AA)

Ratios calculados con la fórmula de luminancia relativa de WCAG 2.1 y verificados por script (evidencia ejecutada en esta sesión). Umbral para texto normal: 4.5:1 (WCAG 1.4.3). Umbral para gráficos y foco: 3:1 (WCAG 1.4.11).

| Par texto/fondo | Uso | Ratio | Umbral | Resultado |
|---|---|---|---|---|
| Texto principal / superficie | Lectura en tarjetas y diálogos | 14.93:1 | 4.5:1 | Cumple |
| Texto principal / fondo alterno | Lectura sobre fondo de app y encabezados de tabla | 13.69:1 | 4.5:1 | Cumple |
| Texto principal / tinte neutro | Mensaje del banner "Sin conexión" | 13.07:1 | 4.5:1 | Cumple |
| Texto principal / tinte de éxito | Mensaje del banner de éxito | 13.02:1 | 4.5:1 | Cumple |
| Texto principal / tinte de advertencia | Mensaje del banner de advertencia | 13.53:1 | 4.5:1 | Cumple |
| Texto principal / tinte de error | Mensaje del banner de error | 13.00:1 | 4.5:1 | Cumple |
| Texto principal / tinte de información | Mensaje del banner "Enviando..." | 13.08:1 | 4.5:1 | Cumple |
| Texto secundario / superficie | Metadatos, navegación inactiva | 6.27:1 | 4.5:1 | Cumple |
| Texto secundario / fondo alterno | Metadatos sobre fondo de app | 5.75:1 | 4.5:1 | Cumple |
| Texto secundario / tinte neutro | Chip "Cerrado" | 5.49:1 | 4.5:1 | Cumple |
| Primario / superficie | Enlaces, botones secundario y terciario | 5.40:1 | 4.5:1 | Cumple |
| Primario / fondo alterno | Hover del botón secundario | 4.95:1 | 4.5:1 | Cumple |
| Blanco / primario | Texto del botón primario | 5.40:1 | 4.5:1 | Cumple |
| Blanco / primario hover | Texto del botón primario en hover | 7.35:1 | 4.5:1 | Cumple |
| Blanco / primario presionado | Texto del botón primario presionado | 9.82:1 | 4.5:1 | Cumple |
| Éxito / superficie | Texto o icono de éxito sobre blanco | 5.87:1 | 4.5:1 | Cumple |
| Éxito / tinte de éxito | Chip y banner de éxito | 5.12:1 | 4.5:1 | Cumple |
| Advertencia / superficie | Texto o icono de advertencia sobre blanco | 5.73:1 | 4.5:1 | Cumple |
| Advertencia / tinte de advertencia | Chip y banner de advertencia | 5.19:1 | 4.5:1 | Cumple |
| Error / superficie | Texto o icono de error sobre blanco | 6.54:1 | 4.5:1 | Cumple |
| Error / tinte de error | Chip y banner de error | 5.69:1 | 4.5:1 | Cumple |
| Información / superficie | Texto o icono de información sobre blanco | 6.74:1 | 4.5:1 | Cumple |
| Información / tinte de información | Chip y banner "Enviando..." | 5.90:1 | 4.5:1 | Cumple |
| Borde de campo / superficie | Borde de campos de formulario (no textual) | 3.92:1 | 3:1 | Cumple |
| Anillo de foco / superficie | Anillo exterior del foco (no textual) | 9.82:1 | 3:1 | Cumple |
| Anillo de foco / primario | Anillo pegado al botón verde, sin halo | 1.82:1 | 3:1 | No cumple; resuelto por diseño: el foco usa siempre el doble anillo con halo blanco (el anillo exterior se mide contra la superficie, 9.82:1, y el anillo blanco interior contra el botón, 5.40:1) |
| Verde oficial / superficie | Como texto | 3.07:1 | 4.5:1 | No cumple como texto; permitido solo en gráficos (pasa 3:1 de 1.4.11) |
| Naranja institucional / superficie | Como gráfico con significado | 2.60:1 | 3:1 | No cumple; degradado a decorativo puro (franja de identidad) |
| Texto deshabilitado / superficie | Controles inactivos | 3.10:1 | 4.5:1 | Exento (WCAG 1.4.3, componentes inactivos) |
| Tinta del QR / superficie | Módulos del QR | 21.00:1 | 4.5:1 | Cumple |

### Named Rules

**La Regla del Verde Único.** Un solo verde expresa texto y acción: #2B7A00. El verde oficial #39A900 es gráfico (progreso, ilustración) y el tinte #E5F3E8 solo aparece en chips y banners de éxito. Si algo es verde y sólido, es acción; si algo es verde y claro con icono, es éxito o confirmación.

**La Regla del Estado con Icono.** Ningún estado se comunica solo con color: todo chip y todo banner lleva icono y texto (WCAG 1.4.1; usuarios con daltonismo y baja alfabetización digital).

**La Regla del Naranja Decorativo.** El naranja #FF7B00 nunca carga significado: es franja y acento de identidad. Toda advertencia textual usa el ámbar #8F5B00.

## Typography

**Display Font:** fuentes del sistema (pila nativa: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)
**Body Font:** la misma pila nativa.
**Label/Mono Font:** no existe familia distinta; las cifras de informes usan `font-variant-numeric: tabular-nums` sobre la misma pila.

**Character:** sobria, institucional y de lectura cómoda a distancia (patios, cafetería, luz variable). La identidad tipográfica no viene de una familia decorativa sino de la escala, el peso y el color. Cero kilobytes de fuentes descargadas: la PWA instala y abre igual con datos limitados o sin conexión (RNF-02, RNF-12), y el render nativo (Roboto en Android económicos, Segoe UI en Windows de los funcionarios) es el más legible en cada dispositivo.

Contrapartida documentada: se evaluó Atkinson Hyperlegible (diseñada para baja visión, disponible en Google Fonts) como familia de cuerpo. Se pospone a la validación de usabilidad de Fase 0 (RNF-01): si en las pruebas con aprendices la pila nativa no alcanza los umbrales (80% sin ayuda, SUS 70), se adopta mediante ADR con subconjunto de pesos, `font-display: swap` y caché del service worker. Hoy gana la pila nativa por costo cero en datos y render familiar del dispositivo.

### Hierarchy

- **Display** (700, 1.875rem / 30px, 1.2): título de la pantalla de QR y de estados vacíos; una o dos palabras ("Tu refrigerio de hoy").
- **Headline** (700, 1.5rem / 24px, 1.25): título de pantalla en móvil y escritorio, y encabezado de informes.
- **Title** (600, 1.25rem / 20px, 1.3): título de tarjeta de evento, título de sección, título de diálogo y de estado vacío.
- **Body** (400, 1.125rem / 18px, 1.5): texto de lectura, mensaje de banner, texto de diálogo. Longitud máxima de 65 a 70 caracteres por línea en informes.
- **Body fuerte** (600, 1.125rem / 18px, 1.5): texto de botones, nombres en listas, datos clave del aprendiz.
- **Label** (600, 1rem / 16px, 1.45, interletrado 0.01em): etiquetas de formulario, chips, navegación, encabezados de tabla.
- **Small** (400, 1rem / 16px, 1.45): celdas de tabla, marcas de tiempo, texto de ayuda, metadatos de tarjeta.

### Named Rules

**La Regla de los 16.** Ningún texto de interfaz baja de 16 px (1rem): ni marcas de tiempo, ni pies de tarjeta, ni texto de ayuda. Lo funda RNF-04 (zoom 200% sin pérdida), la baja alfabetización digital y la luz variable de aulas y patios.

**La Regla de Cero Descargas.** v1 no descarga fuentes web. Adoptar una fuente externa exige ADR con subconjunto, `font-display: swap` y caché del service worker.

## Layout

Móvil primero: el diseño se define en el celular del aprendiz y se expande al escritorio del funcionario.

- **Contenedor:** máximo 1100px centrado en escritorio. Margen de pantalla: 16px en móvil; 24px desde 768px; 32px desde 1280px.
- **Densidad cómoda:** filas de lista de 56px mínimo; campos de 52px (48px en escritorio); botones de 48px en móvil y 44px en escritorio. Objetivo táctil mínimo de 44px en todo elemento interactivo, incluidos chips y casillas (la casilla visible puede medir 24px, pero su área de toque mide 44px).
- **Puntos de corte:** 640px, 768px, 1024px, 1280px. Navegación inferior por debajo de 768px; barra superior desde 768px.
- **Retícula de tarjetas:** una columna en móvil; dos desde 768px; tres desde 1024px (eventos, noticias). Los formularios son siempre de una sola columna.
- **Reflujo:** sin desplazamiento bidireccional a 320px de ancho (WCAG 1.4.10): las tablas se convierten en tarjetas o listas; nada se recorta ni se pierde.
- **Orientación libre** (WCAG 1.3.4): la aplicación funciona en vertical y horizontal; la pantalla de QR reordena en horizontal (código a un lado, datos al otro).
- **Áreas seguras:** la navegación inferior respeta `env(safe-area-inset-bottom)`.

**Ritmo de espaciado** (escala base 4 y 8):

| Token | Valor | Uso típico |
|---|---|---|
| space-1 | 4px | Interior de chips; separación icono-texto |
| space-2 | 8px | Entre etiqueta y campo; entre elementos relacionados |
| space-3 | 12px | Relleno vertical de filas de lista; interior de banners |
| space-4 | 16px | Relleno de tarjetas; margen de pantalla en móvil |
| space-5 | 24px | Entre secciones; margen de pantalla en escritorio; relleno de la tarjeta de QR |
| space-6 | 32px | Entre bloques grandes de una pantalla |
| space-7 | 48px | Descanso mayor; espacio del icono en estados vacíos |
| space-8 | 64px | Separación del contenido principal (QR, estado vacío) |

## Elevation & Depth

Plano por defecto: las superficies se separan con borde sutil (#D5DFCE) y con tono (fondo alterno), no con sombra. La sombra señala flotación o respuesta, nunca decoración.

### Shadow Vocabulary

- **Sombra 1, flotación suave** (`box-shadow: 0 2px 6px rgba(32, 42, 25, 0.10)`): hover de tarjetas y barra de búsqueda fija de la lista de asistencia.
- **Sombra 2, flotación alta** (`box-shadow: 0 8px 24px rgba(32, 42, 25, 0.16)`): menús desplegables, diálogos y avisos emergentes.
- **Foco, doble anillo** (`box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #1C4E00`): anillo blanco interior y anillo verde oscuro exterior. El blanco garantiza 3:1 contra el botón verde (5.40:1) y el verde oscuro contra la superficie (9.82:1); funciona sobre cualquier fondo. Obligatorio en todo control interactivo con `:focus-visible`; nunca `outline: none` sin un reemplazo equivalente o mejor.

### Named Rules

**La Regla del Descanso Plano.** En reposo, nada proyecta sombra. La sombra aparece al flotar (menú, diálogo) o al responder (hover, foco) y desaparece al volver al reposo.

**La Regla del Movimiento Breve.** Transiciones de 150 ms (micro-estados) y 200 ms (aparición de banners y diálogos), con `cubic-bezier(0.4, 0, 0.2, 1)`. Con `prefers-reduced-motion: reduce` las transiciones se anulan y el indicador giratorio se sustituye por texto ("Enviando...").

## Shapes

Lenguaje de forma rectangular y sobria: esquinas suaves que ordenan, no burbujas.

- **Radio pequeño** (8px): botones y campos de formulario.
- **Radio medio** (12px): tarjetas y banners de estado.
- **Radio grande** (16px): diálogos, hojas de confirmación y tarjeta de la pantalla de QR.
- **Radio completo** (999px): chips, pastillas y avatar de iniciales.
- **Bordes:** campos con 1.5px de borde de campo (#76856E); tarjetas con 1px de borde sutil (#D5DFCE); foco siempre con doble anillo.
- **El QR** vive siempre en tarjeta blanca con zona de silencio de 16px alrededor del código y mínimo 240px de lado.

## Components

Cada componente declara forma, color, tamaños y estados. Reglas transversales: objetivo táctil mínimo de 44px (48px en móvil para acciones principales); iconos SVG en línea (trazo 2px, 24px), sin fuentes de iconos ni peticiones externas; todo estado se comunica con icono y texto.

### Botones

- **Forma:** radio 8px; alto 48px en móvil y 44px en escritorio; relleno 12px 24px; texto body fuerte (18px, peso 600). La acción primaria de la pantalla va a ancho completo en móvil.
- **Primario:** fondo verde profundo, texto blanco (5.40:1). Un solo botón primario visible por pantalla (Principio 1).
- **Secundario:** fondo superficie, borde 2px verde profundo, texto verde (5.40:1); hover con fondo alterno (4.95:1). Para "Cancelar asistencia", "Exportar planilla".
- **Terciario:** texto verde sin borde, relleno 12px 16px. Acciones de apoyo ("Buscar aprendiz", "Ver historial"). Nunca es el único camino a una acción crítica.
- **Peligro:** fondo superficie, borde 2px color error, texto error (6.54:1). Solo dentro de confirmaciones de acciones destructivas.
- **Estados:** reposo; hover (oscurece en 150 ms); foco (doble anillo); presionado (#1C4E00); deshabilitado (texto deshabilitado y borde sutil; si una acción crítica está deshabilitada, un texto de ayuda explica el motivo: nunca un botón gris sin razón); cargando (indicador giratorio de 20px y texto "Procesando...", conserva su ancho, `aria-busy="true"`, bloquea el reenvío).

### Campos de formulario

- **Etiqueta siempre visible encima** (label 16px, peso 600); nunca el placeholder como etiqueta (RNF-01). Campo: alto 52px en móvil y 48px en escritorio, radio 8px, borde 1.5px (#76856E, 3.92:1), fondo superficie, texto body 18px.
- **Ayuda y error:** texto de ayuda debajo (small 16px, texto secundario); error con icono y mensaje (small 16px, color error) vinculados con `aria-describedby`; el campo en error cambia su borde a 2px color error.
- **Estados:** reposo; foco (doble anillo); error (borde 2px, icono y mensaje); deshabilitado; solo lectura. Los select son nativos (menú del sistema, familiar para el usuario); casillas y radios de 24px visuales con área de toque de 44px.
- **Búsqueda de la lista de asistencia:** campo con icono de lupa y botón de limpiar; fija al desplazar, con sombra 1.

### Chips de estado

- **Forma:** radio completo, relleno 4px 12px, texto label (16px, peso 600), icono de 16px.
- **Semánticos** (siempre icono y texto): éxito "Confirmado" y "Entregado" (verde sobre tinte de éxito); información "Enviando..." (azul sobre tinte de información); advertencia "Plazo vencido" y "Cupo agotado" (ámbar sobre tinte de advertencia); error "Rechazado" (rojo sobre tinte de error); neutro "Cerrado" (texto secundario sobre tinte neutro).
- **De interacción** (filtros, pestañas): reposo con texto secundario sobre superficie y borde sutil; seleccionado con texto principal, borde 2px verde profundo y marca. El estado seleccionado nunca depende solo del color.

### Tarjeta de evento (con insignia de estado)

- **Forma:** radio 12px, borde 1px sutil, fondo superficie, relleno 16px; hover con sombra 1 en escritorio.
- **Contenido:** título (title 20px, peso 600); fecha, lugar y jornada con iconos (small 16px, texto secundario); insignia de estado (chip) en la esquina superior; acción.
- **Estados del evento:**
  - Abierto: chip de éxito "Abierto" y botón primario "Confirmar asistencia".
  - Confirmado: chip de éxito "Confirmado" y botón secundario "Cancelar asistencia" (pide confirmación).
  - Plazo vencido: chip de advertencia y texto "El plazo para confirmar terminó." (CU-12 FA-1).
  - Lleno: chip de advertencia "Cupo agotado".
  - Cerrado: chip neutro "Cerrado", sin acción.
  - Cancelado: chip de error y nota breve.
- En móvil la tarjeta es la unidad de la retícula; la insignia siempre lleva texto, nunca solo color.

### Pantalla de QR del aprendiz (componente firma)

- **Forma:** tarjeta blanca centrada, radio 16px, relleno 24px; título display (30px, peso 700), por ejemplo "Tu refrigerio de hoy"; QR de mínimo 240px con tinta negra sobre blanco y zona de silencio de 16px; debajo: nombre (body fuerte), documento y ficha (small), evento y fecha (small), chip de estado.
- **Instrucción en español claro:** "Muéstralo en la cafetería" (body 18px).
- **Sin conexión:** el QR se guarda en el dispositivo y sigue mostrándose; un banner informa "Sin conexión. Tu código sigue válido." (RNF-02; CU-14 FA-3).
- **Estados:** válido; sin evento activo (estado vacío: "No tienes refrigerios activos" con acción "Ver próximos eventos"); ventana cerrada (banner de advertencia "El plazo terminó", CU-12 FA-1); sin derecho (chip de advertencia con explicación breve); cargando (esqueleto de carga y texto "Cargando tu código...").
- **Accesibilidad:** el QR lleva texto alternativo descriptivo y el número de documento se muestra como texto, como respaldo si el escáner o la pantalla fallan (la entrega manual de CU-14 FA-4 busca por documento).

### Lista de asistencia del auxiliar (componente firma; la pantalla más usada en la entrega)

- **Encabezado:** título del evento y contador "Entregados: 32 de 40" (body fuerte) con barra de progreso en verde oficial.
- **Búsqueda fija** por nombre o documento, con sombra 1 al desplazar.
- **Botón primario persistente "Escanear código"** (48px) que abre la cámara: el QR es el camino principal (CU-14); la búsqueda es el respaldo manual (FA-4) y exige motivo obligatorio.
- **Filas:** mínimo 56px, relleno 12px 16px, divisor sutil; nombre (body fuerte 18px, peso 600) con ficha y jornada (small); chip de estado a la derecha. Tocar la fila abre la hoja de confirmación "¿Registrar entrega de [nombre]?" con campo de motivo obligatorio y botón primario "Registrar entrega"; si el aprendiz ya tiene una entrega registrada, la hoja muestra la advertencia y el botón pasa a estilo peligro (RF-18).
- **Estados de fila:** pendiente (chip neutro); entregado (chip de éxito con hora visible, "Entregado 14:32"); rechazado (chip de error con motivo abreviado); por enviar (chip de información "Enviando..." cuando la entrega se registró sin conexión).
- **Estados de pantalla:** cargando (esqueleto de carga y texto "Cargando lista..."); vacía por filtro ("No encontramos ese aprendiz" con acción "Registrar entrega manual"); sin aprendices (estado vacío); sin conexión (banner neutro persistente y contador local "3 entregas por enviar"); error de envío (banner de error con acción "Reintentar").
- Todo registro local queda marcado visualmente hasta confirmarse como enviado (RNF-02: 100% de registros sincronizados sin pérdida ni duplicados).

### Tablas simples para informes

- **Uso:** consolidado de cafetería (CU-15), planillas de entrega (CU-34) y tablero de indicadores (CU-36), en escritorio.
- **Forma:** encabezado con label 16px peso 600 sobre fondo alterno, fijo al desplazar; celdas small 16px; filas de 48px mínimo; números alineados a la derecha con `tabular-nums`; primera columna alineada a la izquierda; divisores sutiles, sin filas alternadas.
- **En móvil (por debajo de 768px) la tabla no se muestra como tabla:** se transforma en tarjetas o lista (una ficha por jornada o evento con sus cantidades). Solo si una vista de planilla lo exige, se permite desplazamiento horizontal con primera columna fija y un degradado en el borde como pista, como excepción documentada.
- **Estados:** con datos; vacía ("No hay eventos para este día", CU-15 FA-2); cargando (esqueleto de carga); error ("No pudimos cargar el informe" con acción "Reintentar").

### Navegación

- **Móvil, barra inferior** (por debajo de 768px): máximo cinco destinos, cada uno con icono de 24px y etiqueta 16px peso 600 siempre visible (nunca solo iconos: baja alfabetización digital). Alto de 64px más área segura. Ejemplo para el aprendiz: Inicio, Refrigerios, Noticias, Ajustes. Cada rol ve sus propios destinos.
- **Estados:** activo (icono y etiqueta en verde profundo con indicador de 3px arriba); inactivo (texto secundario); foco (doble anillo); presionado (fondo alterno).
- **Escritorio, barra superior** (desde 768px): marca "BienestarPro", enlaces de sección (label 16px, peso 600) y menú de usuario con avatar de iniciales y nombre. Activo con subrayado de 2px en verde profundo (no solo color). Estados: reposo, hover (fondo alterno), foco, activo.
- **Franja institucional:** línea de 4px (verde oficial y naranja) en el borde superior de la barra: identidad SENA, decorativa.

### Banners de estado

- **Forma:** franja al inicio del contenido, radio 12px, relleno 12px 16px, icono de 24px y texto body 18px; alto mínimo 48px. Título o idea principal en el color del estado; mensaje en texto principal.
- **Sin conexión** (tinte neutro, icono de señal tachada): "Sin conexión. Puedes seguir trabajando; todo se envía cuando vuelva la conexión." Persistente mientras dure; no se cierra a mano. (RNF-02; CU-14 FA-3.)
- **Enviando** (tinte de información, indicador giratorio): "Enviando 3 entregas..." con número concreto; al terminar cambia solo al banner de éxito.
- **Error** (tinte de error, icono de alerta): "No pudimos enviar 2 entregas." con botón "Reintentar"; nunca se cierra solo; `aria-live="assertive"`.
- **Éxito** (tinte de éxito, icono de verificación): "3 entregas enviadas." Se cierra solo a los 5 segundos (se pausa si recibe foco o cursor); `aria-live="polite"`.
- **Aparición:** 200 ms; sin transición cuando el movimiento está reducido.

### Estados vacíos

- **Patrón:** icono de 48px (verde oficial o texto secundario), título (title 20px, peso 600), una frase (body 18px) y una acción (botón secundario o terciario). Nunca un vacío sin salida.
- **Ejemplos:** historial del aprendiz ("Aún no tienes refrigerios entregados" con acción "Ver próximos eventos", CU-17 FA-2); directorio del instructor ("No tienes fichas asignadas todavía", CU-08 FA-1); consolidado de cafetería ("No hay eventos para mañana", CU-15 FA-2); tablero ("No hay datos de este periodo", CU-36 FA-1).

## Do's and Don'ts

### Do:

- **Do** usar un solo botón primario por pantalla y mantenerlo visible sin desplazarse.
- **Do** mantener todo texto en 16 px o más, con cuerpo de 18 px.
- **Do** acompañar todo estado de icono y texto, nunca solo de color.
- **Do** confirmar toda acción destructiva con una pregunta en español claro y botones que digan exactamente qué pasa ("Sí, cancelar mi asistencia").
- **Do** declarar el estado de conexión con banners y contadores concretos ("3 entregas por enviar").
- **Do** usar `tabular-nums` en cifras de informes y alinearlas a la derecha.
- **Do** convertir tablas en tarjetas o listas por debajo de 768 px.
- **Do** probar los flujos clave con lector de pantalla (TalkBack primero) y teclado antes de cerrarlos (RNF-04).

### Don't:

- **Don't** mostrar jerga técnica ("sincronizando", "caché", "token", "API", "fallback", "modo offline"); en la interfaz se dice "Enviando...", "Sin conexión", "Registro manual".
- **Don't** anidar modales ni abrir diálogos desde diálogos: una decisión a la vez.
- **Don't** ejecutar acciones destructivas sin confirmación explícita.
- **Don't** usar tema oscuro por defecto: v1 es tema claro único (luz variable en aulas y patios; rechazo documentado en `00-revision-muestras-diseno.md`).
- **Don't** cargar fuentes decorativas ni fuentes web en v1 (Regla de Cero Descargas).
- **Don't** mostrar tablas densas en móvil.
- **Don't** usar iconos sin etiqueta en la navegación, ni gestos ocultos (deslizar para eliminar, mantener presionado) como único camino a una acción.
- **Don't** usar el verde oficial #39A900 ni el naranja #FF7B00 como color de texto.
- **Don't** cerrar los errores automáticamente ni dejar indicadores giratorios sin texto.
- **Don't** dejar un botón deshabilitado sin explicar el motivo.
- **Don't** usar placeholders como etiquetas de campo.

## Voz y tono

Reglas de microcopy en español:

1. Verbos directos que nombran la acción: "Confirmar asistencia", "Escanear código", "Registrar entrega".
2. Frases cortas: una idea por mensaje.
3. Cero anglicismos y cero tecnicismos (tabla de reemplazo abajo).
4. Números concretos, no vaguedades: "Enviando 3 entregas...", nunca "sincronizando datos".
5. Sin culpar al usuario: el sistema asume ("No pudimos enviar. Intenta de nuevo.", nunca "Escribiste mal").
6. Tono institucional sereno: sin humor en los errores, sin exclamaciones en avisos críticos; cercano solo en confirmaciones ("Te esperamos en el evento").
7. Segunda persona para el aprendiz ("tu código", "tu ficha"); impersonal en informes y vistas de operación.

| Término evitado | En BienestarPro se dice |
|---|---|
| login / log in | Iniciar sesión |
| feedback | Opinión |
| check | Marca de verificación |
| sync / sincronizar | Enviando... / Enviado |
| download | Descargar |
| upload | Cargar |
| tap | Toca |
| offline | Sin conexión |
| dashboard | Tablero |
| toast | Aviso breve |
| link | Enlace |
| default | Predeterminado |
| form | Formulario |

**Ejemplos por flujo crítico:**

**CU-12, confirmar asistencia (aprendiz):**
- Pantalla: título del evento con fecha, jornada y lugar; botón primario "Confirmar asistencia"; botón secundario "No voy a asistir".
- Éxito: banner "Asistencia confirmada. Te esperamos el [fecha]." y chip "Confirmado".
- Cancelar la asistencia: diálogo "¿Cancelar tu asistencia? Se libera tu cupo para otro aprendiz." Botones: "Sí, cancelar" (peligro) y "Seguir inscrito" (primario).
- Plazo vencido (FA-1): banner de advertencia "El plazo para confirmar terminó." sin botones de acción.
- Sin conexión: "Sin conexión. Guardamos tu confirmación y la enviamos cuando vuelva la conexión."

**CU-14, registrar entrega (auxiliar):**
- Escaneo exitoso: banner de éxito "Entrega registrada: [nombre], 14:32", breve, que devuelve solo el flujo al escáner para no frenar la fila.
- Código ya usado (FA-1): banner de advertencia "Este código ya se usó hoy a las 9:15." con acción "Ver entregas".
- Sin derecho o sin confirmación (FA-2): advertencia con el motivo concreto ("No confirmó asistencia.") y acción autorizada explícita "Registrar con autorización" (queda auditada con motivo).
- Sin conexión (FA-3): registro local, chip "Enviando..." y contador "3 entregas por enviar".
- Registro manual (FA-4): búsqueda por nombre o documento y hoja "¿Registrar entrega de [nombre]?" con campo de motivo obligatorio ("Motivo: el aprendiz no tiene su código").

**Error de red (cualquier flujo):**
- Banner de error "No pudimos enviar. Revisa la conexión e intenta de nuevo." con botón "Reintentar". Nunca códigos de error técnicos ("Error 500") ni mensajes en inglés.

## Accesibilidad

Lista de verificación WCAG 2.1 AA aplicada al design system (RNF-04). Los contrastes están verificados en la tabla de Colors; esta lista fija cómo se aplica cada criterio.

| Criterio | Requisito | Aplicación en BienestarPro |
|---|---|---|
| 1.1.1 | Alternativa textual | QR con texto alternativo descriptivo y número de documento visible como texto |
| 1.3.4 | Orientación | Vertical y horizontal; la pantalla de QR reordena en horizontal |
| 1.3.5 | Identificar el propósito de la entrada | `autocomplete` en nombre y correo |
| 1.4.1 | Sin depender solo del color | Regla del Estado con Icono: todo chip y banner lleva icono y texto |
| 1.4.3 | Contraste mínimo 4.5:1 | 23 pares de texto verificados en la tabla de Colors; los 4 pares restantes tienen regla de diseño o exención documentada |
| 1.4.4 | Zoom 200% sin pérdida | Todo el texto en rem; nada de texto en px fijos |
| 1.4.10 | Reflujo a 320px | Sin desplazamiento bidireccional; tablas convertidas en tarjetas o lista |
| 1.4.11 | Contraste no textual 3:1 | Borde de campo 3.92:1; doble anillo de foco 9.82:1; verde oficial 3.07:1 solo en gráficos |
| 1.4.12 | Espaciado de texto | Cuerpo con interlineado 1.5; el espaciado ajustable no rompe la composición |
| 2.1.1 | Teclado | Toda acción operable con teclado; el escaneo de QR tiene respaldo manual (CU-14 FA-4) |
| 2.3.1 | Sin parpadeos | Sin contenido que parpadee más de 3 veces por segundo; movimiento breve y funcional |
| 2.4.7 | Foco visible | Doble anillo en todo control interactivo; nunca `outline: none` sin equivalente |
| 2.5.5 (reforzada) | Tamaño de objetivo | 44px mínimo en todo elemento interactivo; 48px en móvil para acciones principales (estándar del proyecto, por encima del mínimo de la norma) |
| 3.3.2 | Etiquetas o instrucciones | Etiqueta siempre visible encima del campo; texto de ayuda cuando hace falta |
| 3.3.3 | Prevención de errores | Confirmación explícita en acciones destructivas e irreversibles |
| 4.1.2 | Nombre, rol y valor | Controles nativos primero; ARIA solo donde el nativo no alcanza |
| 4.1.3 | Mensajes de estado | Banners con `aria-live`: `polite` en éxito y enviando, `assertive` en error |
| Movimiento reducido | `prefers-reduced-motion` | Transiciones anuladas; indicador giratorio sustituido por texto "Enviando..." |
| Idioma | Idioma declarado | `lang="es-CO"` en el documento |

Pendiente para Fase 4 (construcción): auditoría automática (axe o Lighthouse) y revisión manual con TalkBack y teclado en los flujos CU-12, CU-14 y CU-15, como exige RNF-04.

## Tokens de implementación (CSS)

El frontmatter YAML es la fuente normativa; este bloque es su traducción uno a uno a variables CSS para la interfaz. Si un valor cambia, cambia en el frontmatter y aquí en el mismo commit.

```css
:root {
  /* Color */
  --color-primary: #2B7A00;
  --color-primary-hover: #236300;
  --color-primary-pressed: #1C4E00;
  --color-on-primary: #FFFFFF;
  --color-brand-green: #39A900;   /* solo gráficos */
  --color-accent-orange: #FF7B00; /* solo decorativo */
  --color-surface: #FFFFFF;
  --color-surface-alt: #F3F6F0;
  --color-text-primary: #202A19;
  --color-text-secondary: #55654B;
  --color-text-disabled: #8A9683;
  --color-border-input: #76856E;
  --color-border-subtle: #D5DFCE;
  --color-success: #157347;
  --color-success-tint: #E5F3E8;
  --color-warning: #8F5B00;
  --color-warning-tint: #FDF3DC;
  --color-error: #B3261E;
  --color-error-tint: #FBECEA;
  --color-info: #0F5CA8;
  --color-info-tint: #E8F1FA;
  --color-neutral-tint: #EDF1EB;
  --color-focus-ring: #1C4E00;
  --color-qr-ink: #000000;

  /* Tipografía */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --text-display: 700 1.875rem/1.2 var(--font-sans);
  --text-headline: 700 1.5rem/1.25 var(--font-sans);
  --text-title: 600 1.25rem/1.3 var(--font-sans);
  --text-body: 400 1.125rem/1.5 var(--font-sans);
  --text-body-strong: 600 1.125rem/1.5 var(--font-sans);
  --text-label: 600 1rem/1.45 var(--font-sans);
  --text-small: 400 1rem/1.45 var(--font-sans);

  /* Espaciado */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Radios */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 999px;

  /* Sombra y foco */
  --shadow-1: 0 2px 6px rgba(32, 42, 25, 0.10);
  --shadow-2: 0 8px 24px rgba(32, 42, 25, 0.16);
  --focus-ring: 0 0 0 2px #FFFFFF, 0 0 0 4px #1C4E00;

  /* Toque y movimiento */
  --touch-min: 44px;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Notas de implementación: los tamaños de texto se declaran en rem (zoom 200% sin pérdida, WCAG 1.4.4); los objetivos táctiles se verifican con área de interacción real, no solo con el tamaño visual; el doble anillo de foco se implementa con `box-shadow` sobre `:focus-visible` para no depender del `outline` nativo del navegador.

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-12 | Creación del design system (Fase 3, UX) a partir del ERS v0.1, SPEC sección 3 y la revisión de muestras v0.1. Paleta verificada por cálculo WCAG 2.1. |
