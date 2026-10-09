# Casos de Uso — BienestarPro (Borrador v0.1)

**Estado:** Borrador v0.1 — derivado del ERS borrador v0.1 (`01-ers-borrador-v0.1.md`). Pendiente de validación con las sesiones de discovery (Fase 0).

**Fecha:** 2026-10-09

**Convenciones:**
- Numeración `CU-01` a `CU-36`, consecutiva, sin gaps. Los identificadores no se renumeran.
- Naming: verbo en infinitivo + sustantivo (regla SENA).
- Actores en sustantivo singular.
- Cada CU referencia su RF (ERS §4) y su HU (`03-historias-usuario.md`).
- Los CU de este borrador se derivan de documentos de proyecto (SPEC, ERS, matriz inicial); las sesiones de discovery pueden ajustar flujos y actores.

**Totales del borrador:** 36 CU, 39 HU referenciadas.

---

## M4 Administración

### CU-01: Iniciar sesión
- **Actor primario**: Usuario
- **Módulo**: M4 Administración
- **Precondiciones**:
  1. El usuario está registrado y activo.
  2. El usuario cuenta con credenciales institucionales.
- **Flujo principal**:
  1. El usuario ingresa su usuario y contraseña.
  2. El sistema valida las credenciales.
  3. El sistema verifica si el rol del usuario exige segundo factor (TOTP).
  4. El usuario ingresa el código TOTP cuando se le solicita.
  5. El sistema valida el código y crea la sesión.
  6. El sistema muestra el panel de inicio según el rol y el ámbito del usuario.
- **Flujos alternos**:
  - FA-1: Si las credenciales son inválidas, el sistema muestra un error genérico e incrementa el contador de intentos fallidos.
  - FA-2: Si el código TOTP es inválido, el sistema muestra error y permite reintentar.
  - FA-3: Si la cuenta está bloqueada por intentos fallidos, el sistema informa el bloqueo temporal y no permite el acceso.
- **Postcondiciones**:
  1. Sesión activa con rol y ámbito asignados.
  2. El acceso queda registrado en la auditoría.
- **RF asociado**: RF-01
- **HU asociada**: HU-01

### CU-02: Gestionar usuarios y roles
- **Actor primario**: Superadmin
- **Módulo**: M4 Administración
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de administración.
- **Flujo principal**:
  1. El actor consulta la lista de usuarios del centro.
  2. El actor crea o selecciona un usuario.
  3. El actor asigna o modifica el rol y su ámbito (centro, programa o ficha).
  4. El sistema valida la asignación y la guarda.
  5. El sistema registra el cambio en la auditoría.
- **Flujos alternos**:
  - FA-1: Si el actor no tiene permiso para el rol solicitado, el sistema rechaza la operación.
  - FA-2: Si el usuario está inactivo, el sistema permite reactivarlo antes de asignar roles.
- **Postcondiciones**:
  1. Usuario con rol y ámbito actualizados.
  2. Cambio auditado.
- **RF asociado**: RF-02
- **HU asociada**: HU-02

### CU-03: Administrar centros
- **Actor primario**: Superadmin
- **Módulo**: M4 Administración
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos globales.
- **Flujo principal**:
  1. El actor consulta la lista de centros.
  2. El actor crea un centro o selecciona uno existente.
  3. El actor configura los datos del centro (nombre, regional, parámetros operativos).
  4. El sistema guarda la configuración y aplica el aislamiento de datos del centro.
  5. El sistema registra la operación en la auditoría.
- **Flujos alternos**:
  - FA-1: Si el nombre del centro ya existe, el sistema solicita confirmación o corrección.
  - FA-2: Si el actor intenta desactivar un centro con operación activa, el sistema advierte y solicita confirmación.
- **Postcondiciones**:
  1. Centro creado o actualizado con datos aislados de otros centros.
  2. Operación auditada.
- **RF asociado**: RF-03
- **HU asociada**: HU-03

### CU-04: Consultar auditoría
- **Actor primario**: Superadmin
- **Módulo**: M4 Administración
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de auditoría.
- **Flujo principal**:
  1. El actor define los filtros de consulta (fecha, usuario, tipo de acción).
  2. El sistema consulta los registros de auditoría.
  3. El sistema muestra los resultados paginados.
  4. El actor exporta o revisa el detalle de un registro.
- **Flujos alternos**:
  - FA-1: Si no hay registros para los filtros, el sistema informa que no hay resultados.
  - FA-2: Si el actor intenta editar o eliminar un registro, el sistema lo impide (solo lectura).
- **Postcondiciones**:
  1. Consulta realizada sin alterar los registros.
- **RF asociado**: RF-04
- **HU asociada**: HU-04

### CU-05: Configurar segundo factor (TOTP)
- **Actor primario**: Usuario
- **Módulo**: M4 Administración
- **Precondiciones**:
  1. El usuario tiene sesión activa.
  2. El rol del usuario exige TOTP (administración o portería).
- **Flujo principal**:
  1. El usuario accede a la configuración de seguridad.
  2. El sistema muestra el código QR de enrolamiento.
  3. El usuario escanea el código con su aplicación TOTP.
  4. El usuario ingresa el código generado para verificar.
  5. El sistema valida y activa el segundo factor.
- **Flujos alternos**:
  - FA-1: Si el código de verificación es inválido, el sistema muestra error y permite reintentar.
  - FA-2: Si el usuario pierde el dispositivo, solicita restablecimiento al Superadmin, que queda auditado.
- **Postcondiciones**:
  1. Segundo factor activo para el usuario.
  2. Enrolamiento auditado.
- **RF asociado**: RF-05
- **HU asociada**: HU-05

---

## M9 Fichas por jornada

### CU-06: Gestionar programas y fichas
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M9 Fichas por jornada
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos sobre el centro.
- **Flujo principal**:
  1. El actor registra o selecciona un programa de formación.
  2. El actor crea una ficha con jornada (mañana, tarde, noche), fechas y programa.
  3. El sistema valida los datos y guarda la ficha.
  4. El actor edita o desactiva fichas existentes cuando corresponde.
  5. El sistema refleja los cambios en el directorio.
- **Flujos alternos**:
  - FA-1: Si la ficha ya existe para el programa y jornada, el sistema advierte posible duplicado.
  - FA-2: Si la ficha tiene eventos activos, el sistema impide desactivarla hasta cerrarlos.
- **Postcondiciones**:
  1. Programa y ficha registrados o actualizados.
  2. Directorio actualizado.
- **RF asociado**: RF-06, RF-07
- **HU asociada**: HU-06

### CU-07: Gestionar aprendices e instructores
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M9 Fichas por jornada
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos sobre el centro.
  2. Existe la ficha destino.
- **Flujo principal**:
  1. El actor selecciona la ficha.
  2. El actor registra o importa aprendices y los asigna a la ficha.
  3. El actor registra instructores y los asigna como directores o instructores de ficha.
  4. El sistema valida y guarda las asignaciones.
  5. El sistema actualiza el directorio de la ficha.
- **Flujos alternos**:
  - FA-1: Si un aprendiz ya está asignado a la ficha, el sistema evita el duplicado.
  - FA-2: Si se retira un aprendiz, el sistema conserva su historial y lo excluye de convocatorias nuevas.
- **Postcondiciones**:
  1. Aprendices e instructores asignados a la ficha.
  2. Historial conservado.
- **RF asociado**: RF-08, RF-09
- **HU asociada**: HU-07

### CU-08: Consultar directorio de fichas
- **Actor primario**: Instructor
- **Módulo**: M9 Fichas por jornada
- **Precondiciones**:
  1. El actor tiene sesión activa.
- **Flujo principal**:
  1. El actor accede al directorio de fichas.
  2. El actor aplica filtros por jornada o programa.
  3. El sistema muestra las fichas dentro del ámbito del actor.
  4. El actor consulta el detalle de una ficha (aprendices, instructores, jornada).
- **Flujos alternos**:
  - FA-1: Si el actor no tiene fichas asignadas, el sistema muestra el directorio vacío con un mensaje informativo.
  - FA-2: Si el actor intenta ver una ficha fuera de su ámbito, el sistema deniega el acceso.
- **Postcondiciones**:
  1. Consulta realizada respetando el ámbito del rol.
- **RF asociado**: RF-10
- **HU asociada**: HU-08

### CU-09: Gestionar consentimientos de datos
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M9 Fichas por jornada
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos sobre el centro.
  2. Existe el aprendiz en el directorio.
- **Flujo principal**:
  1. El actor selecciona un aprendiz.
  2. El sistema muestra el estado del consentimiento de tratamiento de datos.
  3. El actor registra el consentimiento con fecha y versión del aviso de privacidad.
  4. El sistema guarda el consentimiento y habilita al aprendiz para procesos que tratan datos personales.
- **Flujos alternos**:
  - FA-1: Si el aprendiz revoca el consentimiento, el sistema lo registra y excluye al aprendiz de los procesos correspondientes.
  - FA-2: Si el aprendiz no tiene consentimiento, el sistema bloquea su inclusión en notificaciones y procesos con datos personales.
- **Postcondiciones**:
  1. Consentimiento registrado, consultable y revocable.
- **RF asociado**: RF-11
- **HU asociada**: HU-09

---

## M1 Refrigerios

### CU-10: Crear evento de refrigerio
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M1 Refrigerios
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos sobre el centro.
  2. Existen fichas activas con aprendices.
- **Flujo principal**:
  1. El actor crea un evento con fecha, jornada y fichas convocadas.
  2. El sistema calcula los cupos según las reglas configuradas.
  3. El actor revisa el consolidado de cupos y ajusta si es necesario.
  4. El actor publica el evento.
  5. El sistema activa el evento y dispara la convocatoria.
- **Flujos alternos**:
  - FA-1: Si no hay fichas seleccionadas, el sistema impide publicar el evento.
  - FA-2: Si el cálculo de cupos no coincide con lo esperado, el actor ajusta cupos (CU-13) antes de publicar.
- **Postcondiciones**:
  1. Evento activo con cupos calculados y reglas registradas.
  2. Convocatoria disparada.
- **RF asociado**: RF-12, RF-13
- **HU asociada**: HU-10, HU-11

### CU-11: Convocar aprendices
- **Actor primario**: Sistema
- **Módulo**: M1 Refrigerios
- **Precondiciones**:
  1. Existe un evento publicado.
  2. Los aprendices convocados tienen consentimiento vigente.
- **Flujo principal**:
  1. El sistema identifica los aprendices de las fichas del evento.
  2. El sistema genera la convocatoria con enlace o código de confirmación.
  3. El sistema envía la convocatoria por el hub de notificaciones según preferencias.
  4. El sistema registra convocados, notificados y confirmados.
- **Flujos alternos**:
  - FA-1: Si un canal falla, el hub aplica la cascada de fallback (CU-18).
  - FA-2: Si un aprendiz no tiene consentimiento, el sistema lo excluye de la convocatoria y lo reporta.
- **Postcondiciones**:
  1. Convocatoria enviada y registrada.
  2. Consolidado del evento actualizado.
- **RF asociado**: RF-14
- **HU asociada**: HU-12

### CU-12: Confirmar asistencia
- **Actor primario**: Aprendiz
- **Módulo**: M1 Refrigerios
- **Precondiciones**:
  1. El aprendiz recibió la convocatoria.
  2. La ventana de confirmación está abierta.
- **Flujo principal**:
  1. El aprendiz abre el enlace o ingresa el código de la convocatoria.
  2. El sistema muestra el detalle del evento (fecha, jornada, lugar).
  3. El aprendiz confirma o rechaza su asistencia.
  4. El sistema registra la respuesta y actualiza el consolidado.
- **Flujos alternos**:
  - FA-1: Si la ventana de confirmación venció, el sistema informa que el plazo terminó.
  - FA-2: Si el aprendiz cambia su respuesta dentro de la ventana, el sistema actualiza el registro.
- **Postcondiciones**:
  1. Respuesta registrada en el evento.
  2. Consolidado actualizado en tiempo real.
- **RF asociado**: RF-15
- **HU asociada**: HU-13

### CU-13: Ajustar cupos
- **Actor primario**: Auxiliar Bienestar
- **Módulo**: M1 Refrigerios
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de operación.
  2. Existe un evento en borrador o activo.
- **Flujo principal**:
  1. El actor selecciona el evento y el ítem de cupo a ajustar.
  2. El actor ingresa el nuevo valor y el motivo del ajuste.
  3. El sistema valida el cambio y recalcula el consolidado.
  4. El sistema registra el ajuste en la auditoría.
- **Flujos alternos**:
  - FA-1: Si el nuevo valor es menor a las entregas ya registradas, el sistema advierte y solicita confirmación.
  - FA-2: Si el actor no tiene permiso, el sistema rechaza la operación.
- **Postcondiciones**:
  1. Cupo ajustado con motivo auditado.
  2. Consolidado recalculado.
- **RF asociado**: RF-16
- **HU asociada**: HU-14

### CU-14: Registrar entrega de refrigerio
- **Actor primario**: Auxiliar Bienestar
- **Módulo**: M1 Refrigerios
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de operación.
  2. Existe un evento activo en la jornada actual.
- **Flujo principal**:
  1. El actor abre el modo de entrega del evento.
  2. El actor escanea el QR del aprendiz.
  3. El sistema valida el código, el derecho y el estado de confirmación.
  4. El sistema registra la entrega y muestra la confirmación visual.
  5. El actor repite el proceso con cada aprendiz.
- **Flujos alternos**:
  - FA-1: Si el QR ya fue usado en el evento, el sistema muestra el motivo del rechazo.
  - FA-2: Si el aprendiz no tiene derecho o no confirmó, el sistema muestra la advertencia correspondiente y permite continuar solo con autorización.
  - FA-3: Si no hay conexión, el sistema registra la entrega localmente y la sincroniza al recuperar la red.
  - FA-4: Si el aprendiz no tiene QR disponible, el actor registra la entrega manual buscando por documento o nombre, con motivo obligatorio.
- **Postcondiciones**:
  1. Entrega registrada y auditada.
  2. Consolidado del evento actualizado.
- **RF asociado**: RF-17, RF-18
- **HU asociada**: HU-15, HU-16

### CU-15: Generar consolidado para cafetería
- **Actor primario**: Cafetería
- **Módulo**: M1 Refrigerios
- **Precondiciones**:
  1. El actor tiene sesión activa con rol de cafetería.
  2. Existen eventos activos para el día siguiente.
- **Flujo principal**:
  1. El actor consulta el consolidado del día.
  2. El sistema muestra las cantidades por jornada y evento, con los ajustes y confirmaciones vigentes.
  3. El actor marca la preparación del consolidado.
  4. El sistema registra la marca de preparación.
- **Flujos alternos**:
  - FA-1: Si el consolidado cambia después de marcado, el sistema notifica la actualización a la cafetería.
  - FA-2: Si no hay eventos para el día, el sistema muestra el consolidado vacío.
- **Postcondiciones**:
  1. Consolidado consultado y preparación marcada.
- **RF asociado**: RF-19
- **HU asociada**: HU-17

### CU-16: Cerrar evento de refrigerio
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M1 Refrigerios
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos sobre el centro.
  2. El evento está activo y la jornada terminó.
- **Flujo principal**:
  1. El actor selecciona el evento y solicita el cierre.
  2. El sistema calcula planificados, entregados, no reclamados y porcentaje de desperdicio.
  3. El sistema genera el reporte de cierre.
  4. El actor confirma el cierre.
  5. El sistema bloquea nuevas entregas del evento.
- **Flujos alternos**:
  - FA-1: Si hay entregas pendientes de sincronización offline, el sistema espera la sincronización antes de cerrar.
  - FA-2: Si el actor intenta cerrar un evento sin jornada terminada, el sistema advierte y solicita confirmación.
- **Postcondiciones**:
  1. Evento cerrado con reporte de cierre.
  2. Datos disponibles para informes.
- **RF asociado**: RF-20
- **HU asociada**: HU-18

### CU-17: Consultar historial de entregas
- **Actor primario**: Aprendiz
- **Módulo**: M1 Refrigerios
- **Precondiciones**:
  1. El actor tiene sesión activa.
- **Flujo principal**:
  1. El actor accede a su historial de entregas.
  2. El sistema muestra los eventos con fecha, estado y resultado.
  3. El actor consulta el detalle de una entrega.
- **Flujos alternos**:
  - FA-1: Si un rol autorizado consulta el historial de otro aprendiz, el sistema registra la lectura en la auditoría.
  - FA-2: Si no hay entregas registradas, el sistema muestra el historial vacío.
- **Postcondiciones**:
  1. Historial consultado según el ámbito del rol.
- **RF asociado**: RF-21
- **HU asociada**: HU-19

---

## M2 Notificaciones

### CU-18: Enviar notificación multicanal
- **Actor primario**: Sistema
- **Módulo**: M2 Notificaciones
- **Precondiciones**:
  1. Existe un evento o publicación que dispara la notificación.
  2. El destinatario tiene preferencias configuradas o valores por defecto.
- **Flujo principal**:
  1. El sistema determina los destinatarios y el tipo de mensaje.
  2. El sistema selecciona la plantilla vigente y arma el mensaje.
  3. El sistema verifica preferencias y horario silencioso.
  4. El sistema envía por el canal primario disponible.
  5. El sistema registra el estado del envío.
- **Flujos alternos**:
  - FA-1: Si el canal primario falla, el sistema intenta el siguiente canal de la cascada (push, WhatsApp, correo).
  - FA-2: Si el mensaje cae en horario silencioso y no es crítico, el sistema lo pospone a la ventana permitida.
  - FA-3: Si se supera el límite anti-spam, el sistema agrupa o pospone el mensaje.
- **Postcondiciones**:
  1. Notificación enviada o pospuesta con estado registrado.
- **RF asociado**: RF-22
- **HU asociada**: HU-20

### CU-19: Gestionar plantillas de mensajes
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M2 Notificaciones
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de comunicación.
- **Flujo principal**:
  1. El actor consulta las plantillas existentes por tipo y canal.
  2. El actor crea o edita una plantilla con variables dinámicas.
  3. El actor previsualiza el mensaje con datos de ejemplo.
  4. El actor publica la plantilla.
  5. El sistema versiona la plantilla y la deja disponible para envíos.
- **Flujos alternos**:
  - FA-1: Si la plantilla tiene variables no reconocidas, el sistema muestra el error y no permite publicar.
  - FA-2: Si se edita una plantilla en uso, el sistema crea una nueva versión sin alterar los envíos ya realizados.
- **Postcondiciones**:
  1. Plantilla versionada y disponible.
- **RF asociado**: RF-23
- **HU asociada**: HU-21

### CU-20: Configurar preferencias de notificación
- **Actor primario**: Usuario
- **Módulo**: M2 Notificaciones
- **Precondiciones**:
  1. El actor tiene sesión activa.
- **Flujo principal**:
  1. El actor accede a sus preferencias de notificación.
  2. El actor selecciona los canales preferidos.
  3. El actor configura su horario silencioso.
  4. El sistema guarda las preferencias y las aplica a los envíos siguientes.
- **Flujos alternos**:
  - FA-1: Si el actor desactiva todos los canales, el sistema advierte que no recibirá avisos no críticos.
  - FA-2: Si un aviso es crítico, el sistema lo envía aunque esté en horario silencioso y registra la excepción.
- **Postcondiciones**:
  1. Preferencias guardadas y aplicadas.
- **RF asociado**: RF-24, RF-25
- **HU asociada**: HU-22, HU-23

### CU-21: Consultar acuses de entrega
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M2 Notificaciones
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de comunicación.
- **Flujo principal**:
  1. El actor consulta el historial de notificaciones de un evento o publicación.
  2. El sistema muestra el estado de cada envío (enviado, entregado, leído, fallido).
  3. El actor filtra por estado o canal.
  4. El actor revisa el detalle de un envío fallido.
- **Flujos alternos**:
  - FA-1: Si un envío falló definitivamente, el sistema muestra el motivo y sugiere canal alternativo.
  - FA-2: Si no hay envíos para el filtro, el sistema informa que no hay resultados.
- **Postcondiciones**:
  1. Acuses consultados.
- **RF asociado**: RF-26
- **HU asociada**: HU-24

### CU-22: Programar recordatorios de evento
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M2 Notificaciones
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos sobre el evento.
  2. Existe un evento activo con convocados sin confirmar.
- **Flujo principal**:
  1. El actor configura los momentos de recordatorio (por ejemplo, 24 horas y 2 horas antes).
  2. El sistema programa los recordatorios.
  3. En cada momento, el sistema identifica a los convocados sin confirmar.
  4. El sistema envía el recordatorio y registra el envío.
- **Flujos alternos**:
  - FA-1: Si el evento se cancela, el sistema cancela los recordatorios pendientes.
  - FA-2: Si un convocado confirma antes del recordatorio, el sistema lo excluye del envío.
- **Postcondiciones**:
  1. Recordatorios programados y enviados según configuración.
- **RF asociado**: RF-27
- **HU asociada**: HU-25

---

## M10 Contactos de emergencia

### CU-23: Registrar contactos de emergencia
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M10 Contactos de emergencia
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos sobre el centro.
  2. El aprendiz tiene consentimiento vigente.
- **Flujo principal**:
  1. El actor selecciona un aprendiz.
  2. El actor registra los contactos de emergencia (nombre, parentesco, teléfono).
  3. El sistema valida los datos y los guarda asociados a la ficha del aprendiz.
  4. El sistema registra la operación en la auditoría.
- **Flujos alternos**:
  - FA-1: Si el aprendiz no tiene consentimiento, el sistema bloquea el registro.
  - FA-2: Si el teléfono no tiene formato válido, el sistema muestra el error y solicita corrección.
- **Postcondiciones**:
  1. Contactos registrados y asociados al aprendiz.
- **RF asociado**: RF-28
- **HU asociada**: HU-26

### CU-24: Consultar contactos de emergencia
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M10 Contactos de emergencia
- **Precondiciones**:
  1. El actor tiene sesión activa con rol autorizado para datos sensibles.
- **Flujo principal**:
  1. El actor busca al aprendiz por documento o nombre.
  2. El sistema valida que el rol esté autorizado.
  3. El sistema muestra los contactos de emergencia del aprendiz.
  4. El sistema registra la lectura en la auditoría (usuario, fecha, aprendiz consultado).
- **Flujos alternos**:
  - FA-1: Si el rol no está autorizado, el sistema deniega el acceso y registra el intento.
  - FA-2: Si el aprendiz no tiene contactos registrados, el sistema lo informa.
- **Postcondiciones**:
  1. Consulta realizada y auditada.
- **RF asociado**: RF-29
- **HU asociada**: HU-27

---

## M6 Noticias y campañas

### CU-25: Publicar noticia o campaña
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M6 Noticias y campañas
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de comunicación.
- **Flujo principal**:
  1. El actor redacta la noticia o campaña.
  2. El actor selecciona el segmento (centro, programa, ficha o jornada).
  3. El actor previsualiza el alcance y el contenido.
  4. El actor publica de inmediato o programa la publicación.
  5. El sistema publica y notifica al segmento según las reglas del hub.
- **Flujos alternos**:
  - FA-1: Si el segmento no tiene destinatarios, el sistema advierte antes de publicar.
  - FA-2: Si la campaña está programada, el actor puede cancelarla antes de su publicación.
- **Postcondiciones**:
  1. Publicación visible para el segmento.
  2. Notificaciones disparadas según reglas.
- **RF asociado**: RF-30, RF-31
- **HU asociada**: HU-28

### CU-26: Consultar analítica de campañas
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M6 Noticias y campañas
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de comunicación.
  2. Existen publicaciones previas.
- **Flujo principal**:
  1. El actor selecciona una publicación.
  2. El sistema muestra métricas agregadas (vistas, lecturas, clics) por día.
  3. El actor compara el alcance entre publicaciones.
- **Flujos alternos**:
  - FA-1: Si la publicación no tiene datos suficientes, el sistema lo informa.
  - FA-2: Las métricas nunca exponen datos personales de los lectores.
- **Postcondiciones**:
  1. Analítica consultada.
- **RF asociado**: RF-32
- **HU asociada**: HU-29

---

## M7 Encuestas

### CU-27: Crear encuesta
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M7 Encuestas
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de encuestas.
- **Flujo principal**:
  1. El actor crea una encuesta con título y descripción.
  2. El actor agrega preguntas (selección única, múltiple o escala).
  3. El actor define si la encuesta es anónima.
  4. El actor previsualiza la encuesta.
  5. El actor publica la encuesta y el sistema congela su estructura.
- **Flujos alternos**:
  - FA-1: Si la encuesta no tiene preguntas, el sistema impide publicarla.
  - FA-2: Si la encuesta es anónima, el sistema advierte que no se podrá identificar a los respondientes.
- **Postcondiciones**:
  1. Encuesta publicada y habilitada para aplicación.
- **RF asociado**: RF-33
- **HU asociada**: HU-30

### CU-28: Aplicar encuesta
- **Actor primario**: Aprendiz
- **Módulo**: M7 Encuestas
- **Precondiciones**:
  1. La encuesta está publicada y el actor pertenece al segmento.
- **Flujo principal**:
  1. El actor recibe la invitación a responder la encuesta.
  2. El actor abre la encuesta y responde las preguntas.
  3. El sistema valida las respuestas obligatorias.
  4. El actor envía sus respuestas.
  5. El sistema registra la respuesta (sin identificador de usuario si es anónima).
- **Flujos alternos**:
  - FA-1: Si faltan respuestas obligatorias, el sistema las señala antes de enviar.
  - FA-2: Si el actor ya respondió y la encuesta no permite repetir, el sistema lo informa.
- **Postcondiciones**:
  1. Respuesta registrada según el modo de la encuesta.
- **RF asociado**: RF-34
- **HU asociada**: HU-31

### CU-29: Consultar resultados de encuesta
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M7 Encuestas
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de encuestas.
  2. La encuesta tiene respuestas registradas.
- **Flujo principal**:
  1. El actor selecciona la encuesta.
  2. El sistema muestra los resultados agregados por pregunta y segmento.
  3. El actor exporta los resultados para el informe.
- **Flujos alternos**:
  - FA-1: Si un segmento tiene menos respuestas que el mínimo configurado, el sistema oculta ese desglose para proteger el anonimato.
  - FA-2: Si no hay respuestas, el sistema lo informa.
- **Postcondiciones**:
  1. Resultados consultados y exportables.
- **RF asociado**: RF-35
- **HU asociada**: HU-32

---

## M8 Reuniones y agenda

### CU-30: Agendar reunión
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M8 Reuniones y agenda
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de agenda.
- **Flujo principal**:
  1. El actor crea una reunión con fecha, hora y lugar o enlace.
  2. El actor selecciona los convocados (personas o fichas).
  3. El sistema valida los datos y guarda la reunión.
  4. El sistema notifica a los convocados.
- **Flujos alternos**:
  - FA-1: Si la reunión se edita o cancela, el sistema notifica la actualización a los convocados.
  - FA-2: Si hay conflicto de horario con otra reunión del mismo organizador, el sistema advierte.
- **Postcondiciones**:
  1. Reunión agendada y convocados notificados.
- **RF asociado**: RF-36
- **HU asociada**: HU-33

### CU-31: Gestionar confirmaciones de reunión
- **Actor primario**: Instructor
- **Módulo**: M8 Reuniones y agenda
- **Precondiciones**:
  1. El actor fue convocado a una reunión.
- **Flujo principal**:
  1. El actor abre la invitación de la reunión.
  2. El actor confirma o rechaza su asistencia.
  3. El sistema registra la respuesta.
  4. El organizador ve el estado de confirmación actualizado.
- **Flujos alternos**:
  - FA-1: Si el actor cambia su respuesta, el sistema actualiza el estado.
  - FA-2: Si la reunión fue cancelada, el sistema deshabilita la confirmación.
- **Postcondiciones**:
  1. Estado de confirmación actualizado.
- **RF asociado**: RF-37
- **HU asociada**: HU-34

### CU-32: Enviar recordatorios de reunión
- **Actor primario**: Sistema
- **Módulo**: M8 Reuniones y agenda
- **Precondiciones**:
  1. Existe una reunión agendada con convocados sin confirmar.
- **Flujo principal**:
  1. El sistema identifica las reuniones próximas.
  2. El sistema identifica a los convocados sin confirmar.
  3. El sistema envía el recordatorio por el hub de notificaciones.
  4. El sistema registra el envío.
- **Flujos alternos**:
  - FA-1: Si la reunión se cancela, el sistema cancela los recordatorios pendientes.
  - FA-2: Si el convocado ya confirmó, el sistema lo excluye del recordatorio.
- **Postcondiciones**:
  1. Recordatorios enviados y registrados.
- **RF asociado**: RF-38
- **HU asociada**: HU-35

### CU-33: Registrar acta de reunión
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M8 Reuniones y agenda
- **Precondiciones**:
  1. La reunión se realizó.
  2. El actor tiene permisos sobre la reunión.
- **Flujo principal**:
  1. El actor abre la reunión y registra el acta (asistentes, temas, compromisos).
  2. El sistema guarda el acta asociada a la reunión.
  3. El sistema notifica a los convocados que el acta está disponible.
  4. El actor marca los compromisos como cumplidos cuando corresponde.
- **Flujos alternos**:
  - FA-1: Si el acta se edita después de publicada, el sistema conserva el historial de cambios.
  - FA-2: Si un convocado no asistió, el sistema lo refleja en la lista de asistentes.
- **Postcondiciones**:
  1. Acta registrada y consultable.
  2. Compromisos con seguimiento.
- **RF asociado**: RF-39
- **HU asociada**: HU-36

---

## M5 Informes

### CU-34: Generar planilla de entrega exportable
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M5 Informes
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de informes.
  2. Existe un evento con datos de entrega.
- **Flujo principal**:
  1. El actor selecciona el evento.
  2. El sistema genera la planilla (convocados, confirmados, entregados).
  3. El actor exporta la planilla en PDF o Excel.
  4. El sistema registra la exportación.
- **Flujos alternos**:
  - FA-1: Si el evento aún está activo, el sistema advierte que la planilla es preliminar.
  - FA-2: Si no hay datos de entrega, el sistema genera la planilla con los convocados.
- **Postcondiciones**:
  1. Planilla exportada y consistente con los datos del evento.
- **RF asociado**: RF-40
- **HU asociada**: HU-37

### CU-35: Generar informe consolidado periódico
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M5 Informes
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de informes.
  2. Existen eventos cerrados en el periodo.
- **Flujo principal**:
  1. El actor selecciona el periodo (semanal o mensual).
  2. El sistema consolida eventos, entregas, no reclamados, desperdicio y participación.
  3. El actor revisa el informe y lo exporta.
  4. El sistema registra la generación del informe.
- **Flujos alternos**:
  - FA-1: Si el periodo no tiene eventos cerrados, el sistema lo informa.
  - FA-2: Si hay eventos sin cerrar en el periodo, el sistema los excluye y lo advierte.
- **Postcondiciones**:
  1. Informe consolidado generado sin doble digitación.
- **RF asociado**: RF-41
- **HU asociada**: HU-38

### CU-36: Consultar tablero de indicadores
- **Actor primario**: Coordinación Bienestar
- **Módulo**: M5 Informes
- **Precondiciones**:
  1. El actor tiene sesión activa con permisos de informes.
- **Flujo principal**:
  1. El actor accede al tablero y selecciona el periodo.
  2. El sistema muestra los indicadores operativos (entregas, no reclamados, desperdicio, participación por jornada).
  3. El actor filtra por jornada o ficha.
  4. El sistema respeta el ámbito del rol en los datos mostrados.
- **Flujos alternos**:
  - FA-1: Si no hay datos del periodo, el sistema muestra el tablero vacío con un mensaje.
  - FA-2: Si el actor no tiene permisos sobre un ámbito, el sistema limita los datos a su alcance.
- **Postcondiciones**:
  1. Indicadores consultados y consistentes con los reportes exportables.
- **RF asociado**: RF-42
- **HU asociada**: HU-39

---

## Trazabilidad CU a RF (resumen)

| CU | RF | CU | RF |
|---|---|---|---|
| CU-01 | RF-01 | CU-19 | RF-23 |
| CU-02 | RF-02 | CU-20 | RF-24, RF-25 |
| CU-03 | RF-03 | CU-21 | RF-26 |
| CU-04 | RF-04 | CU-22 | RF-27 |
| CU-05 | RF-05 | CU-23 | RF-28 |
| CU-06 | RF-06, RF-07 | CU-24 | RF-29 |
| CU-07 | RF-08, RF-09 | CU-25 | RF-30, RF-31 |
| CU-08 | RF-10 | CU-26 | RF-32 |
| CU-09 | RF-11 | CU-27 | RF-33 |
| CU-10 | RF-12, RF-13 | CU-28 | RF-34 |
| CU-11 | RF-14 | CU-29 | RF-35 |
| CU-12 | RF-15 | CU-30 | RF-36 |
| CU-13 | RF-16 | CU-31 | RF-37 |
| CU-14 | RF-17, RF-18 | CU-32 | RF-38 |
| CU-15 | RF-19 | CU-33 | RF-39 |
| CU-16 | RF-20 | CU-34 | RF-40 |
| CU-17 | RF-21 | CU-35 | RF-41 |
| CU-18 | RF-22 | CU-36 | RF-42 |

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-09 | Creación del borrador a partir del ERS v0.1 |
