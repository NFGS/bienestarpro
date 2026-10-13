# Wireframes y prototipo de los flujos críticos — BienestarPro

**Estado:** Borrador v0.1 — Fase 3 (UX).
**Fecha:** 2026-10-12.
**Artefacto:** `docs/03-ux/prototipo/index.html` (prototipo estático autocontenido: CSS embebido con los tokens del design system, iconos SVG en línea, sin CDN ni fuentes externas, navegable con enlaces).
**Fuentes:** `02-design-system.md` v0.1 (fuente de verdad de tokens, componentes y reglas) · `02-casos-de-uso.md` v0.1 (CU-12, CU-14, CU-15) · `00-revision-muestras-diseno.md` v0.1 (patrones aprobados: tarjetas, chips de estado, navegación simple).

---

## 1. Alcance y método

Prototipo de **baja-media fidelidad** de los tres flujos críticos del piloto: contenido, estados y microcopy reales según el design system; sin lógica de aplicación (sin escáner de cámara, sin persistencia). Su propósito es servir de estímulo para la validación con usuarios (sección 9) antes de la implementación de la Fase 4.

- **12 pantallas de producto** (A1–A4, B1–B5, C1–C3) más una pantalla de **índice del prototipo** (navegación para el facilitador; no es parte del producto).
- **Navegación por fragmentos** (`#a1`, `#b2`...): cada pantalla es una sección que se muestra al navegar; sin scripts. La franja gris al pie de cada pantalla es navegación del prototipo, no del producto.
- **Datos sintéticos coherentes:** nombres («Aprendiz de Ejemplo 1»), documentos (CC 1.098.765.432...) y fichas (2847012, 2847013) ficticios, con una sola línea de tiempo: hoy lunes 12 de octubre de 2026 se confirma (flujo A) y se prepara (flujo C) para el evento del martes 13 de octubre; la entrega (flujo B) ocurre el martes. Los contadores son consistentes entre flujos (40 convocados, 35 confirmados, 14 entregados; el consolidado pasa de 32 a 35 confirmados en C3).
- **Mobile-first:** los flujos A y B se presentan en un marco de teléfono (máximo 430 px, centrado en pantallas grandes); el flujo C es una aplicación responsiva real (móvil a escritorio, contenedor de 1100 px).

## 2. Cómo usar el prototipo

1. Abrir `docs/03-ux/prototipo/index.html` en un navegador (funciona sin conexión).
2. Desde el índice, entrar a un flujo y recorrer las pantallas con los enlaces del producto (botones, tarjetas, menú), como lo haría un usuario.
3. La franja final de cada pantalla («Prototipo · Flujo... · Índice · Siguiente») es navegación del facilitador.
4. Los destinos del menú del producto sin pantalla en este prototipo (Inicio, Noticias, Ajustes, Eventos) no cambian de pantalla: mantienen al participante dentro de la tarea.
5. En la implementación las acciones serán botones (`<button>`); en el prototipo toda interacción navega con enlaces (`<a>`), que son operables con teclado y foco visible.

## 3. Mapa de pantallas

| Pantalla | Rol · dispositivo | CU origen | RF | HU | Propósito |
|---|---|---|---|---|---|
| A1 | Aprendiz · móvil | CU-12 | RF-15 | HU-13 | Lista de convocatorias con tarjeta de evento e insignia de estado |
| A2 | Aprendiz · móvil | CU-12 (paso 2-3) | RF-15 | HU-13 | Detalle del evento con botones grandes Confirmar / No asistir |
| A3 | Aprendiz · móvil | CU-12 (paso 4) | RF-15 | HU-13 | Estado «asistencia confirmada» con salida para cancelar |
| A4 | Aprendiz · móvil | CU-12 FA-1 | RF-15 | HU-13 | Estado «plazo vencido» sin acciones de confirmación |
| B1 | Auxiliar · móvil/tablet | CU-14 (paso 1) | RF-17 | HU-15 | Entrega del evento: botón «Escanear código» + contador y lista |
| B2 | Auxiliar · móvil/tablet | CU-14 (paso 4) | RF-17 | HU-15 | Resultado correcto del escaneo (nombre + confirmación visual) |
| B3 | Auxiliar · móvil/tablet | CU-14 FA-1, FA-2 | RF-17, RF-18 | HU-16 | Rechazo con motivo (código ya usado / sin confirmación) |
| B4 | Auxiliar · móvil/tablet | CU-14 FA-3 | RF-17 | HU-15 | Entrega sin conexión: registro local y contador por enviar |
| B5 | Auxiliar · móvil/tablet | CU-14 FA-4 | RF-18 | HU-16 | Entrega manual por documento con motivo obligatorio |
| C1 | Cafetería · móvil/escritorio | CU-15 (paso 1-2) | RF-19 | HU-17 | Consolidado del día por jornada y evento (cantidades) |
| C2 | Cafetería · móvil/escritorio | CU-15 (paso 3-4) | RF-19 | HU-17 | Preparación marcada (estado visible) |
| C3 | Cafetería · móvil/escritorio | CU-15 FA-1 | RF-19 | HU-17 | Aviso «consolidado actualizado» tras un cambio |

## 4. Flujo A — Confirmar asistencia (Aprendiz, móvil; CU-12)

### A1 — Convocatorias (tarjeta de evento)

**Contenido y estados:** encabezado «Refrigerios»; dos tarjetas de evento: una **abierta** (chip de éxito «Abierto» + botón primario «Confirmar asistencia») y una con **plazo vencido** (chip de advertencia + texto «El plazo para confirmar terminó.» + botón terciario «Ver detalle»). Menú inferior del aprendiz: Inicio, Refrigerios (activo), Noticias, Ajustes.

**Decisiones de diseño (design system):**
- Componente «Tarjeta de evento (con insignia de estado)»: radio 12 px, borde 1 px sutil, relleno 16 px; título 20 px/600; fecha, jornada y lugar con iconos (16 px, texto secundario); insignia de estado en la esquina superior.
- Estados de tarjeta «Abierto» y «Plazo vencido» tal como los define el componente; la insignia siempre lleva texto, nunca solo color (Regla del Estado con Icono).
- Botón primario a ancho completo y 48 px (Principio 2, «acciones grandes y visibles»; Botones: «la acción primaria de la pantalla va a ancho completo en móvil»).
- Navegación inferior con icono y etiqueta siempre visibles, alto 64 px, ítem activo con indicador de 3 px (Navegación).
- Patrón aprobado en `00-revision-muestras-diseno.md`: grilla de tarjetas y chips de estado con contraste AA (sección 3, transferible).

**Criterios de aceptación UX:**
- El participante identifica en menos de 10 segundos cuál convocatoria está abierta y cuál venció, sin ayuda.
- El botón «Confirmar asistencia» es alcanzable sin desplazarse en un celular de 4 pulgadas.
- Ningún estado se comunica solo con color (chips con icono y texto).

### A2 — Detalle del evento (confirmar o no asistir)

**Contenido y estados:** chip «Abierto»; título del evento; datos con iconos (Fecha: martes 13 de octubre de 2026; Jornada: Mañana; Lugar: Cafetería — Sede Norte; Ficha: 2847012); plazo visible («Puedes confirmar hasta hoy, lunes 12 de octubre, 6:00 p. m.»); botones grandes: primario «Confirmar asistencia» y secundario «No voy a asistir».

**Decisiones de diseño:**
- «Una tarea por pantalla» (Principio 1): la pantalla contiene una sola decisión (asistir o no), partida del listado.
- Microcopy de CU-12 en «Voz y tono»: botones «Confirmar asistencia» / «No voy a asistir»; verbos directos que nombran la acción.
- El plazo se muestra con texto de apoyo (small, texto secundario) para que la ventana de confirmación sea visible antes de actuar (CU-12 precondición 2).
- Botones de 48 px apilados a ancho completo; un solo primario por pantalla (Botones).

**Criterios de aceptación UX:**
- El participante completa la confirmación en 2 toques desde A1 (tarjeta → confirmar) sin ayuda.
- El participante verbaliza qué pasa si no confirma (el plazo cierra hoy a las 6:00 p. m.).

### A3 — Asistencia confirmada

**Contenido y estados:** banner de éxito «Asistencia confirmada. Te esperamos el martes 13 de octubre.»; chip «Confirmado»; datos del evento; nota «El día del evento presenta tu documento en la cafetería.»; botón secundario «Cancelar asistencia»; variante documentada: diálogo «¿Cancelar tu asistencia? Se libera tu cupo para otro aprendiz.» con botones «Sí, cancelar» (peligro) y «Seguir inscrito» (primario).

**Decisiones de diseño:**
- Banner de éxito con icono de verificación, tinte de éxito y `role="status"` (Banners de estado; 4.1.3: polite en éxito).
- Copia literal de «Voz y tono» para CU-12: «Asistencia confirmada. Te esperamos el [fecha].»
- Cancelación como acción destructiva con confirmación explícita y botones que dicen exactamente qué pasa (Do: «confirmar toda acción destructiva...»; WCAG 3.3.3).
- El diálogo usa la hoja de confirmación: radio 16 px y sombra 2 (la sombra señala flotación; Regla del Descanso Plano).
- El botón de cancelar es secundario, no primario: la acción feliz ya ocurrió (Botones: un primario por pantalla).

**Criterios de aceptación UX:**
- El participante reconoce el estado confirmado en menos de 5 segundos (banner + chip).
- Ante «Cancelar asistencia», el participante lee el efecto («se libera tu cupo») antes de decidir.

### A4 — Plazo vencido

**Contenido y estados:** banner de advertencia «El plazo para confirmar terminó.» con la causa concreta («La ventana de confirmación de este evento cerró el viernes 9 de octubre a las 6:00 p. m.») y sin botones de acción; chip «Plazo vencido»; datos del evento; botón terciario «Ver próximos eventos».

**Decisiones de diseño:**
- Copia de CU-12 FA-1 en «Voz y tono»: banner de advertencia «El plazo para confirmar terminó.» sin botones de acción.
- El estado se explica con la causa y la hora exacta (números concretos, no vaguedades; Voz y tono, regla 4).
- Salida de rescate con botón terciario «Ver próximos eventos» (Estados vacíos: «nunca un vacío sin salida»).

**Criterios de aceptación UX:**
- El participante explica por qué no puede confirmar (el plazo cerró) sin ayuda del moderador.
- El participante encuentra una salida (próximos eventos) sin quedarse atascado.

## 5. Flujo B — Registrar entrega de refrigerio (Auxiliar, móvil/tablet; CU-14)

### B1 — Entrega del evento (escanear y contador)

**Contenido y estados:** barra con título «Entrega de refrigerios» y subtítulo del evento; tarjeta de avance: Convocados 40 · Confirmados 35 · Entregados 14, barra de progreso «Entregados 14 de 35 confirmados»; botón primario «Escanear código» (48 px, a ancho completo, con icono de QR); búsqueda «Buscar aprendiz» (respaldo manual); lista de aprendices con chips: Entregado 7:14 a. m. (éxito), Pendiente (neutro), Rechazado con motivo «sin confirmación» (error). Menú del auxiliar: Inicio, Entregas (activo), Eventos, Ajustes.

**Decisiones de diseño:**
- Componente «Lista de asistencia del auxiliar» (componente firma): encabezado con evento y contador, barra de progreso en verde oficial, botón primario persistente «Escanear código» que abre la cámara, búsqueda como respaldo manual (FA-4), filas de 56 px con nombre (18 px/600), ficha y jornada (16 px) y chip de estado a la derecha.
- El botón primario queda visible sin desplazarse (Principio 2: prisa en la fila de la cafetería).
- La barra de progreso usa el verde oficial (#39A900, solo gráficos, 3.07:1 ≥ 3:1, WCAG 1.4.11) sobre pista blanca con borde sutil; el valor siempre está también como texto («Entregados 14 de 35»), nunca solo en la barra.
- Cifras con `tabular-nums` (Do: «usar tabular-nums en cifras»).
- Estados de fila del componente: pendiente (neutro), entregado (éxito con hora), rechazado (error con motivo abreviado).

**Criterios de aceptación UX:**
- El auxiliar localiza el botón de escaneo en menos de 5 segundos al abrir la pantalla.
- El auxiliar dice en voz alta cuántos refrigerios quedan por entregar (21) sin calcular.
- El auxiliar encuentra el camino manual (búsqueda) sin que se lo indiquen.

### B2 — Resultado correcto del escaneo

**Contenido y estados:** banner de éxito «Entrega registrada: Aprendiz de Ejemplo 2, 7:14 a. m.»; tarjeta de resultado con icono de verificación (48 px), nombre, documento, ficha, jornada y chip «Entregado 7:14 a. m.»; progreso actualizado «Entregados 15 de 35 confirmados»; botón primario «Escanear siguiente código» y terciario «Registrar entrega manual».

**Decisiones de diseño:**
- Copia de CU-14 en «Voz y tono»: «Entrega registrada: [nombre], [hora]», breve, que devuelve solo el flujo al escáner para no frenar la fila.
- Confirmación visual con icono + texto + chip (Regla del Estado con Icono), nunca solo color.
- El contador avanza en la misma pantalla (números concretos; el estado siempre es visible, Principio 3).

**Criterios de aceptación UX:**
- El auxiliar registra dos entregas seguidas sin volver al listado (camino corto).
- El auxiliar confirma con una mirada quién recibió el refrigerio y a qué hora.

### B3 — Rechazo con motivo

**Contenido y estados:** estado principal «Código ya usado»: banner de advertencia «Este código ya se usó hoy a las 6:52 a. m.» con acción «Ver entregas del evento», fila del aprendiz con chip «Entregado 6:52 a. m.» y botón primario «Escanear siguiente código». Variante «sin derecho o sin confirmación»: banner «No confirmó asistencia.» con la regla («No puede recibir el refrigerio sin autorización»), chip «Sin confirmación», botón secundario «Registrar con autorización» y terciario «Escanear siguiente código».

**Decisiones de diseño:**
- CU-14 FA-1 y FA-2 con la copia de «Voz y tono»: motivo concreto y acción «Ver entregas»; la continuación sin derecho exige autorización explícita («Registrar con autorización», que queda auditada con motivo).
- Un solo botón primario por pantalla (Principio 1): en la variante, el escaneo pasa a terciario y la autorización a secundario.
- El rechazo se comunica con icono + texto + color ámbar (Regla del Estado con Icono; el ámbar institucional #8F5B00 es la voz textual de advertencia, no el naranja decorativo).

**Criterios de aceptación UX:**
- El auxiliar explica el motivo del rechazo sin ayuda (ya se usó / no confirmó).
- El auxiliar identifica la acción autorizada y sabe que queda registrada con motivo.

### B4 — Entrega sin conexión

**Contenido y estados:** banner neutro persistente «Sin conexión. Puedes seguir registrando entregas; se envían cuando vuelva la conexión.»; contador local «3 entregas por enviar»; avance del evento (40/35/14) con barra; botón primario «Escanear código» activo; lista con filas «Enviando...» (información), «Entregado 7:02 a. m.» (éxito) y «Pendiente» (neutro).

**Decisiones de diseño:**
- CU-14 FA-3 y RNF-02: registro local marcado visualmente hasta confirmarse como enviado; contador con número concreto («3 entregas por enviar»), nunca «sincronizando datos».
- **Nota de microcopy:** la copia sugerida en el encargo («la entrega se guardará y se sincronizará») usaba un término vetado por el design system («sincronizar»); se aplicó la tabla de reemplazo de «Voz y tono» («se envían cuando vuelva la conexión»).
- El botón de escaneo sigue activo sin conexión (Principio 5: la red lenta o ausente nunca bloquea la operación crítica).
- Banner neutro persistente mientras dure la desconexión (Banners: no se cierra a mano).

**Criterios de aceptación UX:**
- El auxiliar continúa registrando entregas con el banner visible (no se detiene).
- El auxiliar dice cuántas entregas quedan por enviar (3) sin ayuda.

### B5 — Entrega manual (buscar por documento, motivo obligatorio)

**Contenido y estados:** búsqueda por documento con valor de ejemplo (CC 1.098.765.432) y botón «Buscar»; resultado (Aprendiz de Ejemplo 1, chip «Pendiente»); hoja de confirmación «¿Registrar entrega de Aprendiz de Ejemplo 1?» con campo «Motivo» obligatorio (ayuda: «Obligatorio. Por ejemplo: el aprendiz no tiene su código.») y botón primario «Registrar entrega». Variantes documentadas: motivo vacío (borde 2 px de error, icono y mensaje «Escribe el motivo para registrar la entrega.») y aprendiz ya entregado (advertencia «Este aprendiz ya recibió su refrigerio hoy a las 7:14 a. m.» con botón de peligro «Registrar otra entrega»).

**Decisiones de diseño:**
- CU-14 FA-4: búsqueda por documento o nombre y hoja con motivo obligatorio, con la copia de «Voz y tono».
- Etiqueta siempre visible encima del campo, nunca el placeholder como etiqueta (Campos de formulario; RNF-01).
- Error de campo con icono y mensaje vinculados con `aria-describedby`, `aria-invalid="true"` y `role="alert"` (Campos: borde 2 px, icono y mensaje).
- Variante «ya entregado» con botón de estilo peligro (RF-18: la hoja muestra la advertencia y el botón pasa a peligro; Botones: peligro solo en confirmaciones de acciones destructivas).
- El mensaje de error no culpa al usuario (Voz y tono, regla 5: el sistema asume).

**Criterios de aceptación UX:**
- El auxiliar completa una entrega manual en menos de 60 segundos sin ayuda.
- Al faltar el motivo, el auxiliar corrige el campo señalado sin reintentar a ciegas.

## 6. Flujo C — Consolidado para cafetería (móvil/escritorio; CU-15)

### C1 — Consolidado del día por jornada y evento

**Contenido y estados:** en móvil, barra «Consolidado» y menú inferior (Inicio, Consolidado activo, Ajustes); en escritorio (≥ 768 px), barra superior con marca «BienestarPro», sección activa con subrayado de 2 px y usuario con avatar de iniciales. Encabezado «Consolidado del martes 13 de octubre de 2026» con subtítulo «Preparación para mañana»; botón primario «Marcar en preparación»; tabla por jornada y evento (Mañana: Ficha 2847012, 40/32/32; Tarde: Ficha 2847013, 35/28/28; total del día 75/60/60); total a preparar: 60 refrigerios; marca de vigencia con fecha y hora.

**Decisiones de diseño:**
- Componente «Tablas simples para informes»: encabezado 16 px/600 sobre fondo alterno; celdas 16 px; filas de 48 px; números a la derecha con `tabular-nums`; divisores sutiles, sin filas alternadas.
- **Reflujo móvil (WCAG 1.4.10):** por debajo de 768 px la tabla se convierte en tarjetas (una por evento con sus cantidades etiquetadas), tal como lo exige el design system («en móvil la tabla no se muestra como tabla»); la semántica de tabla se conserva en el DOM (caption y `th` ocultos visualmente).
- Navegación por punto de corte: barra inferior por debajo de 768 px; barra superior desde 768 px (Navegación; Layout).
- Botón primario visible sin desplazarse (Principio 2) y a ancho automático en escritorio.
- Marca de vigencia («confirmaciones vigentes hoy, lunes 12 de octubre, 3:00 p. m.») para que el dato nunca sea ambiguo (Principio 3).

**Criterios de aceptación UX:**
- La cafetería dice cuántos refrigerios preparar en total (60) y por jornada (32 y 28) en menos de 30 segundos.
- La tarea «marcar la preparación» se completa en un toque desde la vista principal.

### C2 — Preparación marcada

**Contenido y estados:** banner de éxito «Preparación marcada. Quedó marcada hoy, lunes 12 de octubre, a las 4:10 p. m.»; chip «En preparación» junto al título; misma tabla y total (60); marca de vigencia actualizada (4:10 p. m.). Sin botón primario: la acción se completó.

**Decisiones de diseño:**
- CU-15 pasos 3-4: la marca de preparación queda visible y con hora (Principio 3: el estado siempre es visible).
- Sin botón primario después de actuar (Principio 1: una tarea por pantalla; la pantalla ya cumplió su propósito).
- Banner de éxito con `role="status"` (anuncio educado; 4.1.3).

**Criterios de aceptación UX:**
- La cafetería confirma que la preparación quedó marcada y sabe a qué hora.
- La cafetería no busca un botón que ya no necesita (la pantalla se entiende como estado, no como tarea pendiente).

### C3 — Consolidado actualizado (aviso)

**Contenido y estados:** banner de información «Consolidado actualizado. La ficha 2847012 pasó de 32 a 35 confirmados después de marcar la preparación.»; chip «En preparación»; tabla con la fila actualizada (40/35/35) y nota «3 confirmaciones nuevas»; total a preparar: 63 refrigerios con nota «3 refrigerios más que lo marcado»; marca de vigencia (5:40 p. m.).

**Decisiones de diseño:**
- CU-15 FA-1: si el consolidado cambia después de marcado, el sistema notifica la actualización a la cafetería.
- El cambio se comunica con números concretos (de 32 a 35; 3 más) y nunca depende solo del color (nota textual en la fila y en el total).
- Banner de información con icono de campana y `role="status"` (Banners: «Enviando...» y avisos en progreso usan el tinte de información).

**Criterios de aceptación UX:**
- La cafetería dice qué cambió y cuántos refrigerios adicionales debe preparar (3, en la jornada Mañana).
- La cafetería no confunde el aviso con un error (lo lee como información accionable).

## 7. Decisiones transversales

1. **Enlaces frente a botones:** en el prototipo toda interacción navega con enlaces (`<a>`, operable con teclado y foco visible); en la implementación, las acciones serán `<button>`. Documentado en el índice del prototipo.
2. **Variantes de estado en una pantalla (B3, B5, A3):** cada variante es un estado alternativo de la misma pantalla, separado con título propio; cada una contiene su propio control principal. En B3 la variante degrada el escaneo a terciario para respetar «un solo botón primario por pantalla».
3. **Menú del producto sin pantallas en el prototipo:** los destinos sin pantalla (Inicio, Noticias, Ajustes, Eventos) enlazan a la pantalla actual (no navegan) para no sacar al participante de la tarea durante la validación. El ítem activo es texto con `aria-current="page"`, no un enlace.
4. **Jerarquía tipográfica:** pantalla de índice con rol display (30 px, «una o dos palabras»: «BienestarPro»); títulos de pantalla en headline (24 px); títulos de tarjeta y sección en title (20 px); cuerpo 18 px; etiquetas y celdas 16 px (Regla de los 16). Ningún texto por debajo de 16 px.
5. **Franja institucional:** línea de 4 px (verde oficial y naranja) en el borde superior de la barra de navegación, decorativa (Navegación). Ver excepción justificada en 8.4.
6. **Hoja de confirmación sin borde:** la hoja (diálogo) usa solo sombra 2 (señal de flotación) y radio 16; el borde sutil queda para superficies en reposo (Elevación y profundidad).
7. **Tabla responsiva con un solo marcado:** la tabla del flujo C conserva la semántica (`<table>`, `caption`, `th`) y se transforma en tarjetas por debajo de 768 px con etiquetas `data-label`; evita duplicar contenido entre vistas.
8. **Movimiento:** transiciones de 150 ms con curva estándar solo en estados de botones; anuladas con `prefers-reduced-motion` (Regla del Movimiento Breve).

## 8. Verificación de accesibilidad (gate)

### 8.1 Contraste (WCAG 1.4.3 y 1.4.11) — verificado por script

Método: script Python propio con la fórmula de luminancia relativa de WCAG 2.1 (linealización sRGB, `L = 0.2126R + 0.7152G + 0.0722B`, razón `(L1+0.05)/(L2+0.05)`), ejecutado sobre los 28 pares de color usados en el prototipo. Umbral texto: 4.5:1; gráficos y foco: 3:1. Ejecutado el 2026-10-12; **28 de 28 pares cumplen**.

| Par | Uso | Razón | Umbral | Resultado |
|---|---|---|---|---|
| Texto principal / superficie | Lectura en tarjetas, hojas, barras y filas | 14.93:1 | 4.5:1 | Cumple |
| Texto principal / fondo alterno | Fondo de la app y encabezados de tabla | 13.69:1 | 4.5:1 | Cumple |
| Texto principal / tinte neutro | Banner «Sin conexión» y pie del prototipo | 13.07:1 | 4.5:1 | Cumple |
| Texto principal / tinte de éxito | Banner de éxito (mensaje) | 13.02:1 | 4.5:1 | Cumple |
| Texto principal / tinte de advertencia | Banner de advertencia (mensaje) | 13.53:1 | 4.5:1 | Cumple |
| Texto principal / tinte de error | Banner de error (mensaje) | 13.00:1 | 4.5:1 | Cumple |
| Texto principal / tinte de información | Banner de información (mensaje) | 13.08:1 | 4.5:1 | Cumple |
| Texto secundario / superficie | Metadatos, ayuda, chips neutros, nav inactiva | 6.27:1 | 4.5:1 | Cumple |
| Texto secundario / fondo alterno | Avatar y usuario de la barra superior | 5.75:1 | 4.5:1 | Cumple |
| Texto secundario / tinte neutro | Chip «Pendiente» y pie del prototipo | 5.49:1 | 4.5:1 | Cumple |
| Primario / superficie | Enlaces, botones secundario y terciario, nav activa | 5.40:1 | 4.5:1 | Cumple |
| Primario / fondo alterno | Hover de botones secundario/terciario e índice | 4.95:1 | 4.5:1 | Cumple |
| Blanco / primario | Botón primario (reposo) | 5.40:1 | 4.5:1 | Cumple |
| Blanco / primario hover | Botón primario (hover) | 7.35:1 | 4.5:1 | Cumple |
| Blanco / primario presionado | Botón primario (presionado) | 9.82:1 | 4.5:1 | Cumple |
| Éxito / superficie | Chip de éxito sobre tarjeta; icono de resultado | 5.87:1 | 4.5:1 | Cumple |
| Éxito / tinte de éxito | Chip y banner de éxito | 5.12:1 | 4.5:1 | Cumple |
| Advertencia / superficie | Chip de advertencia sobre tarjeta | 5.73:1 | 4.5:1 | Cumple |
| Advertencia / tinte de advertencia | Chip y banner de advertencia | 5.19:1 | 4.5:1 | Cumple |
| Error / superficie | Chip de error sobre tarjeta; texto de error de campo | 6.54:1 | 4.5:1 | Cumple |
| Error / tinte de error | Chip y banner de error | 5.69:1 | 4.5:1 | Cumple |
| Información / superficie | Chip «Enviando...», nota de tabla, icono «por enviar» | 6.74:1 | 4.5:1 | Cumple |
| Información / tinte de información | Chip «Enviando...» y banner de información | 5.90:1 | 4.5:1 | Cumple |
| Información / fondo alterno | Nota «3 refrigerios más» en el contenedor C | 6.18:1 | 4.5:1 | Cumple |
| Borde de campo / superficie | Borde de 1.5 px de los campos (no textual) | 3.92:1 | 3:1 | Cumple |
| Anillo de foco / superficie | Anillo exterior del doble anillo (no textual) | 9.82:1 | 3:1 | Cumple |
| Verde oficial / superficie | Relleno de la barra de progreso (no textual) | 3.07:1 | 3:1 | Cumple |
| Primario / superficie (indicador) | Indicador de 3 px y subrayado de 2 px (no textual) | 5.40:1 | 3:1 | Cumple |

Elementos decorativos exentos (documentados): franja institucional naranja (#FF7B00, decorativa, no carga significado; Regla del Naranja Decorativo), bordes sutiles (#D5DFCE). El texto deshabilitado (#8A9683) no se usa en el prototipo.

### 8.2 Objetivos táctiles (WCAG 2.5.5 reforzada por el proyecto: 44 px; 48 px en móvil para acciones principales)

| Elemento | Tamaño | Cumple |
|---|---|---|
| Botones (primario, secundario, terciario, peligro) | 48 px de alto, a ancho completo en móvil | Sí |
| Botón de volver en la barra | 44 × 44 px | Sí |
| Ítems del menú inferior | 64 px de alto + área segura | Sí |
| Enlaces de la barra superior (escritorio) | 64 px de alto | Sí |
| Enlaces del índice y del pie del prototipo | 48 px y 44 px de alto | Sí |
| Campos de formulario | 52 px de alto | Sí |
| Filas de lista | 56 px de alto (no interactivas en el prototipo) | Sí |

### 8.3 Foco visible, teclado y semántica

- **Foco visible (2.4.7):** doble anillo (`0 0 0 2px` blanco + `0 0 0 4px` verde oscuro) sobre `:focus-visible` en todo control interactivo; nunca `outline: none` sin reemplazo (Elevación: «Foco, doble anillo»).
- **Teclado (2.1.1):** todos los controles son `<a>`, `<input>` nativos; el orden de tabulación sigue el orden del DOM; las pantallas no activas están en `display: none` y quedan fuera del árbol de accesibilidad y del recorrido de tabulación.
- **Idioma (3.1.1):** `lang="es-CO"`.
- **Mensajes de estado (4.1.3):** banners con `role="status"` (éxito, información, advertencia y «Sin conexión»); error de campo con `role="alert"`.
- **Formularios (3.3.2):** etiqueta visible encima de cada campo; ayuda y error vinculados con `aria-describedby`; `aria-invalid="true"` en el campo con error.
- **Progreso:** `role="progressbar"` con `aria-valuenow/min/max` y el valor también como texto.
- **Navegación asistida:** un `<h1>` por pantalla visible; jerarquía sin saltos; `aria-current="page"` en el ítem activo del menú; `caption` en las tablas.

### 8.4 Detector de diseño (hook impeccable local) — hallazgos y excepciones

El detector anti-patrones (plugin local de impeccable, ejecutado automáticamente tras cada edición del archivo) reportó y se resolvieron:

| Hallazgo | Resolución |
|---|---|
| `cramped-padding` en los tres contenedores de tabla | Relleno interno de 12 px en `.table-wrap` |
| `flat-type-hierarchy` (paso máximo 1.20 < 1.25) | La pantalla de índice usa el rol display (30 px, «BienestarPro»); paso 30→20 = 1.5 |
| Aviso «borde fino + sombra amplia» en las hojas | La hoja de confirmación queda solo con sombra 2 (señal de flotación), sin borde |
| Aviso de saturación de rayas (em-dash) | Reducidas en la copia |

**Excepción justificada (2 hallazgos `side-tab`):** la franja institucional de 4 px en el borde superior de la barra de navegación es una norma explícita del design system («Franja institucional: línea de 4px (verde oficial y naranja) en el borde superior de la barra: identidad SENA, decorativa»). Es decorativa, no carga significado por sí misma (Regla del Naranja Decorativo) y está exenta de 1.4.11; el detector la marca como patrón genérico de «pestaña lateral», pero aquí es identidad institucional prescrita por la fuente de verdad del proyecto. Se conserva y se documenta como excepción con esta cita.

**Pendiente para la Fase 4 (construcción):** auditoría automática (axe/Lighthouse), revisión manual con TalkBack y teclado en dispositivo real para CU-12, CU-14 y CU-15, como exige RNF-04.

## 9. Guion de validación con usuarios (gate RNF-01)

**Objetivo:** validar los tres flujos críticos antes de la implementación.
**Umbrales (RNF-01):** 80 % o más de las tareas clave completadas **sin ayuda**; SUS ≥ 70.
**Participantes:** 3 a 5 aprendices (flujo A; muestra mínima de usabilidad) y, como los flujos B y C no pueden ejecutarse con rol de aprendiz, 1 auxiliar de Bienestar (flujo B) y 1 persona de la cafetería (flujo C). Si aparecen hallazgos críticos, repetir con 3 participantes más.

**Materiales:** prototipo abierto en un celular (flujos A y B) y en celular y computador (flujo C); guion del moderador; formato de observación (tarea, con/sin ayuda, tiempo, errores, comentarios); cuestionario SUS.

**Procedimiento por sesión (20 a 30 minutos):**
1. Consentimiento verbal: la sesión es para mejorar la interfaz; se registran solo observaciones anónimas (Ley 1581 de 2012; datos mínimos, sin identificación).
2. Tareas con pensamiento en voz alta (el moderador no señala dónde tocar).
3. Cuestionario SUS al final.
4. Cierre: preguntas abiertas («¿Qué cambiarías?»).

**Tareas por flujo:**

| # | Tarea (consigna al participante) | Camino esperado | Se mide |
|---|---|---|---|
| A-1 | «Llegó una convocatoria de refrigerio para mañana. Confirma tu asistencia.» | A1 → A2 → A3 | Finalización sin ayuda; toques; tiempo |
| A-2 | «¿Puedes cancelar la asistencia? ¿Qué pasa si lo haces?» | A3 → diálogo | Comprensión del efecto (se libera el cupo) |
| A-3 | «¿Puedes confirmar la asistencia al evento de cierre de trimestre? ¿Por qué no?» | A1 → A4 | Comprensión del estado plazo vencido |
| B-1 | «Es la hora de la entrega. Registra el refrigerio del aprendiz que llega con su código.» | B1 → B2 | Finalización sin ayuda; retorno al escáner |
| B-2 | «Otro aprendiz ya recibió el suyo. ¿Qué dice el sistema y qué haces?» | B3 | Comprensión del motivo y de la acción |
| B-3 | «Se cayó la conexión en plena entrega. ¿Puedes seguir registrando?» | B4 | Confianza offline (no se detiene) |
| B-4 | «Un aprendiz no tiene su código. Registra la entrega.» | B1 (búsqueda) → B5 | Finalización con motivo obligatorio |
| C-1 | «Prepara los refrigerios de mañana: ¿cuántos son en total y por jornada?» | C1 | Lectura correcta de cantidades (60; 32 y 28) |
| C-2 | «Marca que ya empezaste la preparación.» | C1 → C2 | Finalización sin ayuda |
| C-3 | «Llegaron confirmaciones nuevas después de marcar. ¿Qué cambió?» | C3 | Comprensión del aviso y del delta (3 más) |

**Métricas:** finalización sin ayuda (sí/no por tarea), toques hasta la meta, tiempo, errores de navegación, verbalizaciones de confusión, SUS (0 a 100).

**Cuestionario SUS (escala 1 a 5 por ítem; ítems impares: puntaje − 1; pares: 5 − puntaje; suma × 2.5):**
1. Creo que usaría este sistema con frecuencia.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría la ayuda de una persona técnica para usar este sistema.
5. Encontré las diversas funciones bien integradas.
6. Pensé que había demasiada inconsistencia en el sistema.
7. Imaginaría que la mayoría de las personas aprenderían a usar este sistema rápidamente.
8. Encontré el sistema muy engorroso de usar.
9. Me sentí muy seguro usando el sistema.
10. Necesitaría aprender muchas cosas antes de usar este sistema.

**Criterios de éxito y plan si no se cumplen:** 80 % de tareas sin ayuda (global y por flujo), SUS ≥ 70, y cero confusiones no recuperadas en los estados críticos (plazo vencido, sin conexión, rechazo con motivo). Si no se cumple: iterar el prototipo (microcopy, jerarquía, tamaños de objetivo), corregir y repetir solo las tareas fallidas con 3 participantes nuevos; registrar hallazgos y versión en este documento.

## 10. Evidencias

- **Capturas de pantalla:** generadas el 2026-10-13 con Playwright (Chromium headless) en `docs/03-ux/evidencias/`: 13 capturas de viewport real (390x844, `pantalla-<id>.png`) y 13 de página completa (`pantalla-<id>-completa.png`, para revisar todo el contenido; en estas últimas la barra fija inferior puede aparecer a mitad de imagen, artefacto conocido de la captura de página completa). Queda pendiente para la Fase 4 la auditoría axe/Lighthouse sobre la implementación real.
- **Verificación de contraste:** ejecutada por script (sección 8.1): 28/28 pares cumplen.
- **Detector anti-patrones:** ejecutado por el hook local de impeccable tras cada edición; hallazgos y excepciones en 8.4.

## 11. Trazabilidad

| Pantalla | CU | RF | HU | Verificación asociada |
|---|---|---|---|---|
| A1–A4 | CU-12 (incluye FA-1) | RF-15 | HU-13 | Tareas A-1 a A-3 del guion; contraste 8.1 |
| B1–B5 | CU-14 (incluye FA-1 a FA-4) | RF-17, RF-18 | HU-15, HU-16 | Tareas B-1 a B-4; contraste 8.1 |
| C1–C3 | CU-15 (incluye FA-1) | RF-19 | HU-17 | Tareas C-1 a C-3; contraste 8.1 |
| Transversal | — | RNF-01, RNF-02, RNF-04, RNF-05, RNF-12 | — | Gate del guion (RNF-01); verificación 8.1–8.3 (RNF-04); estados sin conexión (RNF-02) |

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-12 | Creación del prototipo (12 pantallas + índice) y de este documento, con verificación de contraste por script (28/28) y revisión del detector anti-patrones (hallazgos corregidos; franja institucional como excepción justificada). |
