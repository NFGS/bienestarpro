# ERS — Especificación de Requisitos de Software (Borrador v0.1) — BienestarPro

**Estado:** Borrador v0.1 — derivado de `SPEC.md` v0.1 y de la matriz de trazabilidad inicial. Pendiente de validación con las sesiones de discovery (Fase 0).

**Fecha:** 2026-10-09

**Proyecto:** BienestarPro — plataforma de operación integral de bienestar al aprendiz (Centro de Comercio y Turismo, SENA Regional Quindío, Armenia).

**Documentos fuente:** `SPEC.md` v0.1; `docs/01-requisitos/00-matriz-trazabilidad-inicial.md`; `docs/sennova/01-protocolo-investigacion.md`.

> **BORRADOR.** Regla de oro del proyecto: todo requisito nace de evidencia (EV) o de un dolor (DOL) respaldado. Los requisitos de este documento se derivan de documentos de proyecto ya existentes (SPEC, brief, matriz inicial) y quedan marcados como "Por confirmar en Fase 0" cuando dependen de las sesiones de campo. Las sesiones de discovery pueden añadir, modificar o eliminar requisitos; los identificadores no se renumeran (regla de la matriz).

> **Salvedad sobre la matriz de referencia.** Las skills SENA del entorno (`sena-requirements-builder`, `sena-adso-framework`) validan contra una matriz de 17 módulos / 68 RF / 30 RNF / 66 CU / 69 HU / 6 actores que pertenece al proyecto AgroConnect (otro proyecto ADSO; actores Productor, Comprador). Esa matriz NO aplica a BienestarPro: este proyecto usa sus propios módulos M1–M11 (`SPEC.md` §2), sus propios actores (`SPEC.md` §3) y numeración propia. De las skills se conservan el formato de plantillas, las reglas de naming y las reglas de trazabilidad.

---

## 1. Introducción y propósito

Este documento especifica los requisitos funcionales (RF) y no funcionales (RNF) del piloto de BienestarPro (fase F4), el sistema que automatiza la operación del área de Bienestar al Aprendiz: refrigerios, notificaciones multicanal, fichas por jornada, contactos de emergencia, noticias y campañas, encuestas, reuniones e informes.

El ERS es la línea base para el diseño (Fase 2), la construcción (Fase 4) y las pruebas. Su trazabilidad se mantiene en `00-matriz-trazabilidad-inicial.md` y se cierra contra casos de uso (CU) e historias de usuario (HU).

## 2. Alcance

### 2.1 Incluido (piloto F4)

| Módulo | Nombre | Contenido en el piloto |
|---|---|---|
| M4 | Administración | Identidad, RBAC multi-centro, auditoría (mínimo para operar) |
| M9 | Fichas por jornada | Directorio maestro: programas, fichas, jornadas, instructores, aprendices |
| M1 | Refrigerios | Eventos, cupos por reglas, convocatoria, confirmación, entrega con QR, cierre |
| M2 | Notificaciones | Hub multicanal (correo, WhatsApp, push), plantillas, preferencias, acuses |
| M10 | Contactos de emergencia | Directorio restringido con auditoría de accesos |
| M6 | Noticias y campañas | Publicación segmentada y analítica básica |
| M7 | Encuestas | Pulso y encuestas con resultados agregados (doble uso: institucional e investigación) |
| M8 | Reuniones y agenda | Programación, RSVP y recordatorios |
| M5 | Informes | Planillas, exportables PDF/Excel y tablero |

### 2.2 Excluido (Fase 5)

- **M3 Portátiles**: registro de ingreso/salida en modo kiosco, visitantes y reportes. Se diagnostica en Fase 0 y se construye en Fase 5.
- **M11 IA/RAG**: asistente sobre normativa y clasificación de mensajes. Fase 5.

## 3. Actores y roles

| Rol | Alcance | Capacidades principales |
|---|---|---|
| Superadmin (TI) | Global | Configuración, centros (tenants), auditoría |
| Coordinación Bienestar | Centro | Jornadas, cupos, publicar, informes, usuarios |
| Auxiliar Bienestar | Centro | Operar entregas, ajustar cupos, marcar con QR |
| Instructor / Director de ficha | Ficha | Ver su ficha, confirmar, resúmenes |
| Vocero / Subvocero | Ficha | Apoyo operativo del grupo |
| Aprendiz | Propio | Confirmar/no asistir, QR, historial |
| Cafetería | Centro | Consolidado diario, marcar preparación |
| Vigilante / Portería | Centro | Módulo portátiles en modo kiosco (Fase 5) |
| Visitante | — | Entidad del registro de portátiles (sin cuenta, Fase 5) |

Modelo RBAC + ABAC por ámbito (centro/programa/ficha) con Row-Level Security en PostgreSQL. TOTP obligatorio para administración y portería.

## 4. Requisitos funcionales

### 4.1 M4 Administración

### RF-01: Iniciar sesión en la plataforma
- **Módulo**: M4 Administración
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir que los usuarios se autentiquen con credenciales institucionales y accedan a las funciones según su rol y ámbito (centro, programa, ficha).
- **Criterio de aceptación**: Un usuario con credenciales válidas accede a su panel; con credenciales inválidas recibe un error genérico sin revelar si el usuario existe; tras un número configurable de intentos fallidos la cuenta se bloquea temporalmente.
- **CU asociados**: CU-01
- **Fuente**: SPEC §3 (RBAC); matriz §3 (Fichas y contactos)
- **Estado**: Por confirmar en Fase 0

### RF-02: Gestionar usuarios y roles
- **Módulo**: M4 Administración
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir crear, editar, activar y desactivar usuarios, y asignarles roles con ámbito (centro, programa o ficha).
- **Criterio de aceptación**: Un usuario con rol autorizado asigna un rol a otro usuario y el cambio queda auditado; un usuario sin permiso recibe error de autorización.
- **CU asociados**: CU-02
- **Fuente**: SPEC §3 (RBAC)
- **Estado**: Por confirmar en Fase 0

### RF-03: Administrar centros (multi-tenant)
- **Módulo**: M4 Administración
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir al Superadmin crear y configurar centros (tenants), garantizando el aislamiento de datos entre centros.
- **Criterio de aceptación**: Los datos de un centro no son visibles ni modificables desde otro centro (verificado con pruebas de aislamiento); la creación de un centro queda auditada.
- **CU asociados**: CU-03
- **Fuente**: SPEC §4 (multi-tenant desde el día 1)
- **Estado**: Por confirmar en Fase 0

### RF-04: Consultar auditoría de acciones críticas
- **Módulo**: M4 Administración
- **Prioridad**: Media
- **Descripción**: El sistema debe registrar y permitir consultar las acciones críticas (accesos, cambios de roles, ajustes de cupos, lecturas de datos sensibles) con usuario, fecha y contexto.
- **Criterio de aceptación**: Toda acción crítica genera un registro consultable por roles autorizados; el registro no puede editarse ni eliminarse desde la aplicación.
- **CU asociados**: CU-04
- **Fuente**: SPEC §3 y §5 (auditoría); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-05: Configurar segundo factor (TOTP)
- **Módulo**: M4 Administración
- **Prioridad**: Alta
- **Descripción**: El sistema debe exigir segundo factor TOTP a los roles de administración y portería, con enrolamiento y verificación.
- **Criterio de aceptación**: Un usuario de administración o portería sin TOTP configurado no puede operar; el enrolamiento y la verificación funcionan con aplicaciones TOTP estándar.
- **CU asociados**: CU-05
- **Fuente**: SPEC §3 (TOTP obligatorio)
- **Estado**: Por confirmar en Fase 0

### 4.2 M9 Fichas por jornada

### RF-06: Gestionar programas de formación
- **Módulo**: M9 Fichas por jornada
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir registrar y mantener los programas de formación del centro.
- **Criterio de aceptación**: Un usuario autorizado crea, edita y desactiva programas; los programas inactivos no aparecen en formularios de fichas nuevas.
- **CU asociados**: CU-06
- **Fuente**: SPEC §2 (M9); matriz §3 (Fichas)
- **Estado**: Por confirmar en Fase 0

### RF-07: Gestionar fichas y jornadas
- **Módulo**: M9 Fichas por jornada
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir registrar fichas con su jornada (mañana, tarde, noche), fechas de inicio y fin, programa y estado.
- **Criterio de aceptación**: Una ficha creada queda asociada a un programa y una jornada; el listado permite filtrar por jornada y programa.
- **CU asociados**: CU-06
- **Fuente**: SPEC §2 (M9); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-08: Gestionar aprendices y su asignación a fichas
- **Módulo**: M9 Fichas por jornada
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir registrar aprendices y asignarlos a una ficha, con estado activo/inactivo.
- **Criterio de aceptación**: Un aprendiz asignado a una ficha aparece en el directorio de esa ficha; al retirarlo, deja de aparecer en convocatorias nuevas sin perder su historial.
- **CU asociados**: CU-07
- **Fuente**: SPEC §2 (M9); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-09: Gestionar instructores y directores de ficha
- **Módulo**: M9 Fichas por jornada
- **Prioridad**: Media
- **Descripción**: El sistema debe permitir registrar instructores y asignarlos como directores o instructores de una o varias fichas.
- **Criterio de aceptación**: Un instructor asignado ve únicamente las fichas de su ámbito; la asignación queda auditada.
- **CU asociados**: CU-07
- **Fuente**: SPEC §3 (Instructor / Director de ficha)
- **Estado**: Por confirmar en Fase 0

### RF-10: Consultar el directorio de fichas
- **Módulo**: M9 Fichas por jornada
- **Prioridad**: Media
- **Descripción**: El sistema debe ofrecer un directorio consultable de fichas con sus jornadas, programas, aprendices e instructores, filtrable por jornada y programa.
- **Criterio de aceptación**: La consulta respeta el ámbito del rol (un instructor solo ve sus fichas; coordinación ve todo el centro).
- **CU asociados**: CU-08
- **Fuente**: SPEC §2 (M9); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-11: Gestionar consentimientos de datos personales
- **Módulo**: M9 Fichas por jornada
- **Prioridad**: Alta
- **Descripción**: El sistema debe registrar el consentimiento de tratamiento de datos personales de cada aprendiz (Ley 1581 de 2012), con fecha y versión del aviso de privacidad.
- **Criterio de aceptación**: Un aprendiz sin consentimiento registrado no recibe notificaciones ni aparece en procesos que traten datos personales; el consentimiento es consultable y revocable.
- **CU asociados**: CU-09
- **Fuente**: SPEC §5 (Ley 1581); matriz §4 (RNF-03)
- **Estado**: Por confirmar en Fase 0

### 4.3 M1 Refrigerios

### RF-12: Crear evento de refrigerio
- **Módulo**: M1 Refrigerios
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir crear un evento de refrigerio con fecha, jornada, fichas convocadas y reglas de cupo.
- **Criterio de aceptación**: Un evento creado queda en estado borrador y es editable; al publicarlo pasa a estado activo y dispara la convocatoria.
- **CU asociados**: CU-10
- **Fuente**: SPEC §2 (M1); matriz §3 (Registro de refrigerios)
- **Estado**: Por confirmar en Fase 0

### RF-13: Calcular cupos por reglas
- **Módulo**: M1 Refrigerios
- **Prioridad**: Alta
- **Descripción**: El sistema debe calcular los cupos del evento según reglas configurables (derecho por jornada y ficha, cupo por aprendiz).
- **Criterio de aceptación**: El cálculo es reproducible: dado el mismo conjunto de reglas y fichas, el sistema produce el mismo consolidado; las reglas aplicadas quedan registradas en el evento.
- **CU asociados**: CU-10
- **Fuente**: SPEC §2 (M1); matriz §3
- **Estado**: Por confirmar en Fase 0 (reglas exactas por validar con el área)

### RF-14: Convocar aprendices al evento
- **Módulo**: M1 Refrigerios
- **Prioridad**: Alta
- **Descripción**: El sistema debe convocar a los aprendices de las fichas del evento mediante el hub de notificaciones, con enlace o código para confirmar.
- **Criterio de aceptación**: La convocatoria se envía por los canales disponibles según preferencias; el evento registra cuántos convocados, notificados y confirmados hay en todo momento.
- **CU asociados**: CU-11
- **Fuente**: SPEC §2 (M1, M2); matriz §3 (Notificaciones)
- **Estado**: Por confirmar en Fase 0

### RF-15: Confirmar o rechazar asistencia (RSVP)
- **Módulo**: M1 Refrigerios
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir que el aprendiz confirme o rechace su asistencia al evento dentro de una ventana de tiempo definida.
- **Criterio de aceptación**: La confirmación actualiza el consolidado del evento en tiempo real; fuera de la ventana, el sistema informa que el plazo venció.
- **CU asociados**: CU-12
- **Fuente**: SPEC §2 (M1); matriz §3
- **Estado**: Por confirmar en Fase 0 (ventana de confirmación por definir)

### RF-16: Ajustar cupos manualmente
- **Módulo**: M1 Refrigerios
- **Prioridad**: Media
- **Descripción**: El sistema debe permitir que el auxiliar ajuste los cupos de un evento (aumentar o reducir) con motivo obligatorio.
- **Criterio de aceptación**: Todo ajuste queda auditado con usuario, fecha, valor anterior, valor nuevo y motivo; el consolidado se recalcula.
- **CU asociados**: CU-13
- **Fuente**: SPEC §3 (Auxiliar Bienestar); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-17: Registrar entrega con QR
- **Módulo**: M1 Refrigerios
- **Prioridad**: Alta
- **Descripción**: El sistema debe validar la entrega del refrigerio leyendo el QR del aprendiz y verificando su derecho y estado de confirmación.
- **Criterio de aceptación**: Un QR válido y con derecho registra la entrega en menos de 5 segundos; un QR ya usado o sin derecho muestra el motivo del rechazo; la operación funciona sin conexión y sincroniza al recuperar red.
- **CU asociados**: CU-14
- **Fuente**: SPEC §2 (M1, PWA offline-first); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-18: Registrar entrega manual (excepción)
- **Módulo**: M1 Refrigerios
- **Prioridad**: Media
- **Descripción**: El sistema debe permitir registrar una entrega sin QR (fallback) buscando al aprendiz por documento o nombre, con motivo obligatorio.
- **Criterio de aceptación**: La entrega manual queda auditada con el motivo; el sistema advierte si el aprendiz ya tiene una entrega registrada en el evento.
- **CU asociados**: CU-14
- **Fuente**: SPEC §2 (M1); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-19: Generar consolidado diario para cafetería
- **Módulo**: M1 Refrigerios
- **Prioridad**: Alta
- **Descripción**: El sistema debe generar el consolidado de cantidades a preparar por jornada y día para la cafetería, y permitir marcar la preparación.
- **Criterio de aceptación**: La cafetería consulta el consolidado del día siguiente con las cantidades por jornada; el consolidado refleja los ajustes y confirmaciones vigentes.
- **CU asociados**: CU-15
- **Fuente**: SPEC §2 (M1); matriz §3 (Cafetería)
- **Estado**: Por confirmar en Fase 0

### RF-20: Cerrar evento de refrigerio
- **Módulo**: M1 Refrigerios
- **Prioridad**: Alta
- **Descripción**: El sistema debe cerrar el evento calculando entregados, no reclamados y desperdicio, y generando el reporte de cierre.
- **Criterio de aceptación**: El cierre produce un reporte con planificados, entregados, no reclamados y porcentaje de desperdicio; el evento cerrado no admite nuevas entregas.
- **CU asociados**: CU-16
- **Fuente**: SPEC §2 (M1); matriz §3; baseline §1 (R3, R4)
- **Estado**: Por confirmar en Fase 0

### RF-21: Consultar historial de entregas por aprendiz
- **Módulo**: M1 Refrigerios
- **Prioridad**: Media
- **Descripción**: El sistema debe permitir consultar el historial de entregas de un aprendiz (fecha, evento, estado).
- **Criterio de aceptación**: El aprendiz ve su propio historial; los roles autorizados ven el historial de su ámbito; el acceso queda auditado.
- **CU asociados**: CU-17
- **Fuente**: SPEC §2 (M1); matriz §3
- **Estado**: Por confirmar en Fase 0

### 4.4 M2 Notificaciones

### RF-22: Enviar notificaciones multicanal con fallback
- **Módulo**: M2 Notificaciones
- **Prioridad**: Alta
- **Descripción**: El sistema debe enviar notificaciones por correo, WhatsApp y push web, con fallback en cascada (push, luego WhatsApp, luego correo) según disponibilidad y preferencias.
- **Criterio de aceptación**: Un envío registra el canal efectivo utilizado; si el canal primario falla, el sistema intenta el siguiente según la cascada y registra el resultado de cada intento.
- **CU asociados**: CU-18
- **Fuente**: SPEC §6 (canales y fallback); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-23: Gestionar plantillas de mensajes
- **Módulo**: M2 Notificaciones
- **Prioridad**: Media
- **Descripción**: El sistema debe permitir crear y versionar plantillas de mensajes por tipo de evento y canal, con variables dinámicas (nombre, ficha, fecha, lugar).
- **Criterio de aceptación**: Una plantilla publicada queda versionada; los envíos usan la versión vigente al momento del envío y queda registrada la versión usada.
- **CU asociados**: CU-19
- **Fuente**: SPEC §6 (plantillas versionadas)
- **Estado**: Por confirmar en Fase 0

### RF-24: Configurar preferencias de notificación
- **Módulo**: M2 Notificaciones
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir que cada usuario configure sus canales preferidos y su horario silencioso.
- **Criterio de aceptación**: Los envíos respetan las preferencias y el horario silencioso configurados; los avisos críticos pueden marcarse como excepción con registro del motivo.
- **CU asociados**: CU-20
- **Fuente**: SPEC §6 (preferencias, horario silencioso); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-25: Aplicar límites anti-spam (rate-limit)
- **Módulo**: M2 Notificaciones
- **Prioridad**: Media
- **Descripción**: El sistema debe aplicar límites de envío por usuario y por canal para evitar saturación, agrupando o posponiendo mensajes cuando se exceda el límite.
- **Criterio de aceptación**: Al superar el límite configurado, los mensajes se agrupan o posponen según la política definida y el evento queda registrado; no se pierde ningún aviso crítico.
- **CU asociados**: CU-20
- **Fuente**: SPEC §6 (rate-limit anti-spam)
- **Estado**: Por confirmar en Fase 0

### RF-26: Registrar acuses de entrega y reintentos
- **Módulo**: M2 Notificaciones
- **Prioridad**: Alta
- **Descripción**: El sistema debe registrar el estado de cada notificación (enviado, entregado, leído, fallido) y reintentar los fallidos con retroceso progresivo.
- **Criterio de aceptación**: Cada notificación tiene un estado consultable; los fallos reintentan hasta un máximo configurable y luego quedan marcados como fallidos definitivos.
- **CU asociados**: CU-21
- **Fuente**: SPEC §6 (registro sent/delivered/read/failed)
- **Estado**: Por confirmar en Fase 0

### RF-27: Programar recordatorios de eventos
- **Módulo**: M2 Notificaciones
- **Prioridad**: Media
- **Descripción**: El sistema debe programar recordatorios automáticos de eventos de refrigerio (por ejemplo, 24 horas y 2 horas antes) para los convocados que no han confirmado.
- **Criterio de aceptación**: Los recordatorios se envían en los momentos configurados solo a quienes no han confirmado; cada envío queda registrado.
- **CU asociados**: CU-22
- **Fuente**: SPEC §2 (M1, M2); matriz §3
- **Estado**: Por confirmar en Fase 0

### 4.5 M10 Contactos de emergencia

### RF-28: Registrar contactos de emergencia
- **Módulo**: M10 Contactos de emergencia
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir registrar los contactos de emergencia de cada aprendiz (nombre, parentesco, teléfono) con su consentimiento.
- **Criterio de aceptación**: Un contacto solo se registra con consentimiento vigente del aprendiz; los datos quedan asociados a la ficha del aprendiz.
- **CU asociados**: CU-23
- **Fuente**: SPEC §5 (datos sensibles); matriz §3 (Fichas y contactos)
- **Estado**: Por confirmar en Fase 0

### RF-29: Consultar contactos de emergencia con acceso restringido
- **Módulo**: M10 Contactos de emergencia
- **Prioridad**: Alta
- **Descripción**: El sistema debe permitir consultar los contactos de emergencia solo a roles autorizados, registrando cada lectura en la auditoría.
- **Criterio de aceptación**: Un rol no autorizado no puede ver los contactos; cada consulta de un rol autorizado queda auditada con usuario, fecha y aprendiz consultado.
- **CU asociados**: CU-24
- **Fuente**: SPEC §5 (acceso por rol mínimo + auditoría de lecturas)
- **Estado**: Por confirmar en Fase 0

### 4.6 M6 Noticias y campañas

### RF-30: Publicar noticias y avisos segmentados
- **Módulo**: M6 Noticias y campañas
- **Prioridad**: Media
- **Descripción**: El sistema debe permitir publicar noticias y avisos segmentados por centro, programa, ficha o jornada.
- **Criterio de aceptación**: Una publicación llega solo al segmento seleccionado; el autor puede previsualizar el alcance antes de publicar.
- **CU asociados**: CU-25
- **Fuente**: SPEC §2 (M6); matriz §3 (Noticias y campañas)
- **Estado**: Por confirmar en Fase 0

### RF-31: Programar campañas
- **Módulo**: M6 Noticias y campañas
- **Prioridad**: Baja
- **Descripción**: El sistema debe permitir programar la publicación de campañas para una fecha y hora futuras.
- **Criterio de aceptación**: Una campaña programada se publica automáticamente en la fecha y hora definidas; puede cancelarse antes de su publicación.
- **CU asociados**: CU-25
- **Fuente**: SPEC §2 (M6)
- **Estado**: Por confirmar en Fase 0

### RF-32: Consultar analítica básica de campañas
- **Módulo**: M6 Noticias y campañas
- **Prioridad**: Baja
- **Descripción**: El sistema debe mostrar métricas básicas de alcance y lectura de las publicaciones (vistas, lecturas, clics).
- **Criterio de aceptación**: El autor ve las métricas de sus publicaciones agregadas por día; las métricas no exponen datos personales de los lectores.
- **CU asociados**: CU-26
- **Fuente**: SPEC §2 (M6, analítica básica)
- **Estado**: Por confirmar en Fase 0

### 4.7 M7 Encuestas

### RF-33: Crear encuestas
- **Módulo**: M7 Encuestas
- **Prioridad**: Media
- **Descripción**: El sistema debe permitir crear encuestas con preguntas de selección única, selección múltiple y escala, definiendo si son anónimas.
- **Criterio de aceptación**: Una encuesta creada queda en borrador y es editable; al publicarla se congela su estructura y se habilita para aplicación.
- **CU asociados**: CU-27
- **Fuente**: SPEC §2 (M7); matriz §3 (Encuestas)
- **Estado**: Por confirmar en Fase 0

### RF-34: Aplicar encuestas con anonimato por diseño
- **Módulo**: M7 Encuestas
- **Prioridad**: Media
- **Descripción**: El sistema debe aplicar encuestas a segmentos (fichas, jornadas) garantizando el anonimato cuando la encuesta esté marcada como anónima (sin identificador de usuario).
- **Criterio de aceptación**: En modo anónimo, la respuesta no almacena identificador de usuario; el sistema evita mostrar resultados de segmentos con menos de un mínimo de respuestas configurable.
- **CU asociados**: CU-28
- **Fuente**: SPEC §5 (anonimato por diseño); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-35: Consolidar resultados de encuestas
- **Módulo**: M7 Encuestas
- **Prioridad**: Media
- **Descripción**: El sistema debe consolidar los resultados de las encuestas en reportes agregados (doble uso: institucional e investigación).
- **Criterio de aceptación**: Los resultados se muestran agregados por pregunta y segmento; son exportables para el informe de investigación.
- **CU asociados**: CU-29
- **Fuente**: SPEC §2 (M7); matriz §3
- **Estado**: Por confirmar en Fase 0

### 4.8 M8 Reuniones y agenda

### RF-36: Agendar reuniones
- **Módulo**: M8 Reuniones y agenda
- **Prioridad**: Media
- **Descripción**: El sistema debe permitir agendar reuniones con fecha, hora, lugar o enlace, y lista de convocados (personas o fichas).
- **Criterio de aceptación**: Una reunión agendada notifica a los convocados; el organizador puede editarla o cancelarla y los convocados reciben la actualización.
- **CU asociados**: CU-30
- **Fuente**: SPEC §2 (M8); matriz §3 (Reuniones)
- **Estado**: Por confirmar en Fase 0

### RF-37: Gestionar confirmaciones de reunión (RSVP)
- **Módulo**: M8 Reuniones y agenda
- **Prioridad**: Baja
- **Descripción**: El sistema debe permitir que los convocados confirmen o rechacen su asistencia a una reunión.
- **Criterio de aceptación**: El organizador ve el estado de confirmación de cada convocado; los cambios se reflejan en tiempo real.
- **CU asociados**: CU-31
- **Fuente**: SPEC §2 (M8, RSVP)
- **Estado**: Por confirmar en Fase 0

### RF-38: Enviar recordatorios de reunión
- **Módulo**: M8 Reuniones y agenda
- **Prioridad**: Baja
- **Descripción**: El sistema debe enviar recordatorios automáticos de las reuniones a los convocados que no han confirmado.
- **Criterio de aceptación**: El recordatorio se envía en el momento configurado; cada envío queda registrado en el historial de notificaciones.
- **CU asociados**: CU-32
- **Fuente**: SPEC §2 (M8, recordatorios)
- **Estado**: Por confirmar en Fase 0

### RF-39: Registrar acta de reunión
- **Módulo**: M8 Reuniones y agenda
- **Prioridad**: Baja
- **Descripción**: El sistema debe permitir registrar el acta de una reunión con asistentes, temas y compromisos.
- **Criterio de aceptación**: El acta queda asociada a la reunión y es consultable por los convocados; los compromisos pueden marcarse como cumplidos.
- **CU asociados**: CU-33
- **Fuente**: SPEC §2 (M8); matriz §3 (generar acta)
- **Estado**: Por confirmar en Fase 0

### 4.9 M5 Informes

### RF-40: Generar planilla de entrega exportable
- **Módulo**: M5 Informes
- **Prioridad**: Alta
- **Descripción**: El sistema debe generar la planilla de entrega de un evento (convocados, confirmados, entregados) exportable en PDF y Excel.
- **Criterio de aceptación**: La planilla exportada coincide con los datos del evento al momento de la exportación; el formato es legible e imprimible.
- **CU asociados**: CU-34
- **Fuente**: SPEC §2 (M5); matriz §3 (Informes)
- **Estado**: Por confirmar en Fase 0

### RF-41: Generar informe consolidado periódico
- **Módulo**: M5 Informes
- **Prioridad**: Media
- **Descripción**: El sistema debe generar informes consolidados (semanal o mensual) con los datos existentes: eventos, entregas, no reclamados, desperdicio y participación.
- **Criterio de aceptación**: El informe se genera sin doble digitación a partir de los datos registrados; es exportable y comparable entre periodos.
- **CU asociados**: CU-35
- **Fuente**: SPEC §2 (M5); matriz §3
- **Estado**: Por confirmar en Fase 0

### RF-42: Consultar tablero de indicadores
- **Módulo**: M5 Informes
- **Prioridad**: Media
- **Descripción**: El sistema debe ofrecer un tablero con indicadores operativos del área (entregas, no reclamados, desperdicio, participación por jornada).
- **Criterio de aceptación**: El tablero muestra los indicadores del periodo seleccionado y respeta el ámbito del rol; los datos coinciden con los reportes exportables.
- **CU asociados**: CU-36
- **Fuente**: SPEC §2 (M5, tablero); matriz §3
- **Estado**: Por confirmar en Fase 0

## 5. Requisitos no funcionales

### RNF-01: Usabilidad para baja alfabetización digital
- **Categoría**: Usabilidad
- **Descripción**: La interfaz debe ser operable por personas con baja alfabetización digital sin capacitación extensa.
- **Métrica**: Prueba de usabilidad con 3 a 5 aprendices: porcentaje de tareas clave completadas sin ayuda, tiempo por tarea y escala SUS.
- **Criterio de aceptación (propuesto)**: Al menos 80% de los participantes completa las tareas clave sin ayuda y SUS mayor o igual a 70. Umbrales a validar en Fase 0.
- **Fuente**: matriz §4 (RNF-01)

### RNF-02: Operación con conectividad intermitente (offline-first)
- **Categoría**: Disponibilidad
- **Descripción**: Las operaciones críticas (entrega de refrigerios, portería) deben funcionar sin conexión y sincronizar al recuperar la red.
- **Métrica**: Prueba en modo offline: registros creados sin conexión y sincronizados al reconectar; pérdida de datos.
- **Criterio de aceptación (propuesto)**: 100% de los registros creados offline se sincronizan sin pérdida ni duplicados al recuperar la conexión.
- **Fuente**: matriz §4 (RNF-02); SPEC §4 (PWA offline-first)

### RNF-03: Cumplimiento de la Ley 1581 de 2012
- **Categoría**: Seguridad
- **Descripción**: El sistema debe cumplir consentimiento, finalidad, minimización y acceso restringido sobre datos personales.
- **Métrica**: Auditoría de datos: porcentaje de datos personales con consentimiento registrado; porcentaje de accesos a datos sensibles auditados.
- **Criterio de aceptación (propuesto)**: 100% de los datos personales tratados tienen consentimiento vigente y 100% de los accesos a datos sensibles quedan auditados.
- **Fuente**: matriz §4 (RNF-03); SPEC §5

### RNF-04: Accesibilidad WCAG 2.1 AA
- **Categoría**: Usabilidad
- **Descripción**: La interfaz debe cumplir criterios de accesibilidad AA: contraste, tamaño de letra, navegación por teclado y compatibilidad con lector de pantalla en flujos clave.
- **Métrica**: Auditoría con herramientas automáticas y revisión manual de los flujos clave.
- **Criterio de aceptación (propuesto)**: Contraste mínimo 4.5:1 en texto normal; flujos clave navegables por teclado; sin errores críticos de accesibilidad en la auditoría.
- **Fuente**: matriz §4 (RNF-04)

### RNF-05: Rendimiento y disponibilidad
- **Categoría**: Performance
- **Descripción**: El sistema debe responder con tiempos adecuados para la operación en jornada y estar disponible en horario operativo.
- **Métrica**: Latencia P95 de operaciones de lectura y escritura; disponibilidad mensual en horario operativo.
- **Criterio de aceptación (propuesto)**: Latencia P95 menor a 300 ms en operaciones de lectura y disponibilidad mayor o igual a 99% en horario operativo. Valores a confirmar con la medición de línea base.
- **Fuente**: matriz §4 (RNF-05)

### RNF-06: Residencia y tratamiento de datos en infraestructura controlada
- **Categoría**: Seguridad
- **Descripción**: Los datos personales no deben salir de la infraestructura del SENA sin base jurídica ni autorización.
- **Métrica**: Revisión de configuración y de terceros que procesan datos; transferencias no autorizadas detectadas.
- **Criterio de aceptación (propuesto)**: Cero transferencias de datos personales a terceros sin base jurídica documentada.
- **Fuente**: matriz §4 (RNF-06)

### RNF-07: Aislamiento multi-tenant
- **Categoría**: Seguridad
- **Descripción**: El sistema debe garantizar el aislamiento de datos entre centros mediante Row-Level Security.
- **Métrica**: Pruebas de aislamiento entre centros (intentos de acceso cruzado).
- **Criterio de aceptación (propuesto)**: Cero fugas de datos entre centros en las pruebas de aislamiento.
- **Fuente**: SPEC §4 (multi-tenant, RLS)

### RNF-08: Seguridad del acceso administrativo
- **Categoría**: Seguridad
- **Descripción**: Los roles de administración y portería deben usar segundo factor TOTP obligatorio.
- **Métrica**: Porcentaje de cuentas de administración y portería con TOTP activo; bloqueos por intentos fallidos.
- **Criterio de aceptación (propuesto)**: 100% de las cuentas de administración y portería con TOTP activo; bloqueo temporal tras intentos fallidos configurables.
- **Fuente**: SPEC §3 (TOTP obligatorio)

### RNF-09: Respeto de preferencias y horario silencioso
- **Categoría**: Usabilidad
- **Descripción**: Las notificaciones deben respetar las preferencias de canal y el horario silencioso de cada usuario, salvo avisos críticos marcados como excepción.
- **Métrica**: Porcentaje de envíos que respetan preferencias y horario; excepciones registradas con motivo.
- **Criterio de aceptación (propuesto)**: 100% de los envíos no críticos respetan preferencias y horario silencioso; toda excepción queda registrada.
- **Fuente**: SPEC §6 (preferencias, horario silencioso)

### RNF-10: Trazabilidad de notificaciones
- **Categoría**: Disponibilidad
- **Descripción**: Cada notificación debe tener estado consultable (enviado, entregado, leído, fallido) y política de reintentos.
- **Métrica**: Porcentaje de notificaciones con estado registrado; reintentos ejecutados y resultado.
- **Criterio de aceptación (propuesto)**: 100% de las notificaciones registran estado final; los fallos reintentan con retroceso progresivo hasta el máximo configurado.
- **Fuente**: SPEC §6 (sent/delivered/read/failed)

### RNF-11: Observabilidad
- **Categoría**: Disponibilidad
- **Descripción**: El sistema debe emitir logs estructurados, métricas y trazas de los componentes críticos (hub de notificaciones, entregas, sincronización offline).
- **Métrica**: Cobertura de logs estructurados en componentes críticos; alertas definidas y probadas.
- **Criterio de aceptación (propuesto)**: Los componentes críticos emiten logs estructurados y al menos una alerta operativa probada por componente.
- **Fuente**: SPEC §7 (observabilidad)

### RNF-12: Compatibilidad PWA
- **Categoría**: Compatibilidad
- **Descripción**: La aplicación debe funcionar en navegadores modernos y ser instalable como PWA en Android, iOS y escritorio.
- **Métrica**: Pruebas en las dos últimas versiones de Chrome, Edge, Firefox y Safari; auditoría de instalabilidad.
- **Criterio de aceptación (propuesto)**: Funciona en las dos últimas versiones de los navegadores objetivo e instala como PWA en Android, iOS y escritorio.
- **Fuente**: SPEC §4 (PWA); matriz §4

## 6. Reglas de negocio

| ID | Regla | Fuente | Estado |
|---|---|---|---|
| RN-01 | El derecho a refrigerio se define por jornada y ficha según el lineamiento del centro. | matriz §3 | Por confirmar en Fase 0 |
| RN-02 | Los cupos se calculan por reglas configurables; todo ajuste manual requiere rol autorizado y queda auditado. | SPEC §2 (M1) | Por confirmar en Fase 0 |
| RN-03 | La confirmación de asistencia tiene una ventana de tiempo; sin confirmación no se garantiza cupo. | SPEC §2 (M1) | Por confirmar en Fase 0 |
| RN-04 | La entrega se valida con QR único por aprendiz y evento; el fallback manual queda auditado con motivo. | SPEC §2 (M1) | Por confirmar en Fase 0 |
| RN-05 | El horario silencioso por defecto es configurable; solo los avisos críticos pueden exceptuarlo con registro. | SPEC §6 | Por confirmar en Fase 0 |
| RN-06 | La cascada de notificación es push, luego WhatsApp, luego correo. | SPEC §6 | Por confirmar en Fase 0 |
| RN-07 | Los contactos de emergencia solo son visibles para roles autorizados y toda lectura queda auditada. | SPEC §5 | Por confirmar en Fase 0 |
| RN-08 | Las encuestas anónimas no almacenan identificador de usuario y no muestran segmentos con pocas respuestas. | SPEC §5 | Por confirmar en Fase 0 |

## 7. Exclusiones y trabajo futuro

- **M3 Portátiles** (Fase 5): registro de ingreso/salida en modo kiosco, visitantes y reportes. Diagnóstico en Fase 0.
- **M11 IA/RAG** (Fase 5): asistente sobre normativa y clasificación de mensajes.
- Integraciones con sistemas institucionales (Sofía Plus, Territorium): solo se identifican datos y restricciones en Fase 0; no se integran en el piloto.

## 8. Pendientes para el discovery

1. Reglas exactas de derecho a refrigerio por jornada y ficha (RN-01).
2. Ventana de confirmación de asistencia y política de cupos sin confirmación (RN-03).
3. Volumen real de mensajes y consultas repetitivas (baseline C1 a C4) para calibrar rate-limit.
4. Umbrales de usabilidad y accesibilidad con usuarios reales (RNF-01, RNF-04).
5. Valores de rendimiento y disponibilidad a partir de la línea base (RNF-05).
6. Formato actual de planilla de entrega, informe y acta (para que los exportables sean compatibles).
7. Procedimiento actual de portería para el diagnóstico de M3 (Fase 5).
8. Confirmación de canales disponibles y estado del trámite de WhatsApp (SPEC §6).

## 9. Trazabilidad resumida (RF a CU)

| RF | CU | RF | CU |
|---|---|---|---|
| RF-01 | CU-01 | RF-22 | CU-18 |
| RF-02 | CU-02 | RF-23 | CU-19 |
| RF-03 | CU-03 | RF-24 | CU-20 |
| RF-04 | CU-04 | RF-25 | CU-20 |
| RF-05 | CU-05 | RF-26 | CU-21 |
| RF-06 | CU-06 | RF-27 | CU-22 |
| RF-07 | CU-06 | RF-28 | CU-23 |
| RF-08 | CU-07 | RF-29 | CU-24 |
| RF-09 | CU-07 | RF-30 | CU-25 |
| RF-10 | CU-08 | RF-31 | CU-25 |
| RF-11 | CU-09 | RF-32 | CU-26 |
| RF-12 | CU-10 | RF-33 | CU-27 |
| RF-13 | CU-10 | RF-34 | CU-28 |
| RF-14 | CU-11 | RF-35 | CU-29 |
| RF-15 | CU-12 | RF-36 | CU-30 |
| RF-16 | CU-13 | RF-37 | CU-31 |
| RF-17 | CU-14 | RF-38 | CU-32 |
| RF-18 | CU-14 | RF-39 | CU-33 |
| RF-19 | CU-15 | RF-40 | CU-34 |
| RF-20 | CU-16 | RF-41 | CU-35 |
| RF-21 | CU-17 | RF-42 | CU-36 |

**Totales del borrador:** 42 RF, 12 RNF, 36 CU referenciados (los CU se especifican en `02-casos-de-uso.md`; las HU en `03-historias-usuario.md`).

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-09 | Creación del borrador a partir de SPEC v0.1 y la matriz inicial |
