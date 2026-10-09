# Historias de Usuario — BienestarPro (Borrador v0.1)

**Estado:** Borrador v0.1 — derivado del ERS v0.1 y de los casos de uso v0.1. Pendiente de validación con las sesiones de discovery (Fase 0).

**Fecha:** 2026-10-09

**Convenciones:**
- Numeración `HU-01` a `HU-39`, consecutiva, sin gaps. Los identificadores no se renumeran.
- Formato: Como / Quiero / Para (INVEST).
- Criterios de aceptación en formato BDD (Dado / Cuando / Entonces), mínimo 3 por HU.
- Story points en escala Fibonacci (1, 2, 3, 5, 8).
- Cada HU referencia su CU padre (`02-casos-de-uso.md`) y su módulo.

**Totales del borrador:** 39 HU.

---

## M4 Administración

### HU-01: Iniciar sesión en la plataforma

**Como** usuario de la plataforma
**Quiero** iniciar sesión con mis credenciales institucionales
**Para** acceder a las funciones que corresponden a mi rol y ámbito

#### Criterios de aceptación
1. **Dado** un usuario registrado y activo, **Cuando** ingresa credenciales válidas, **Entonces** el sistema crea la sesión y muestra el panel según su rol.
2. **Dado** un usuario con credenciales inválidas, **Cuando** intenta ingresar, **Entonces** el sistema muestra un error genérico sin revelar si el usuario existe.
3. **Dado** un usuario que supera el número configurable de intentos fallidos, **Cuando** intenta ingresar de nuevo, **Entonces** el sistema bloquea temporalmente la cuenta y lo informa.

#### Metadata
- **CU asociado**: CU-01
- **Módulo**: M4 Administración
- **Story points**: 3
- **Prioridad**: Alta

### HU-02: Gestionar usuarios y roles

**Como** Superadmin
**Quiero** crear usuarios y asignarles roles con ámbito
**Para** que cada persona acceda solo a lo que le corresponde

#### Criterios de aceptación
1. **Dado** un Superadmin autenticado, **Cuando** asigna un rol con ámbito a un usuario, **Entonces** el sistema guarda el cambio y lo registra en la auditoría.
2. **Dado** un usuario sin permisos de administración, **Cuando** intenta asignar roles, **Entonces** el sistema rechaza la operación.
3. **Dado** un usuario inactivo, **Cuando** el Superadmin lo reactiva, **Entonces** el sistema permite asignarle roles nuevamente.

#### Metadata
- **CU asociado**: CU-02
- **Módulo**: M4 Administración
- **Story points**: 3
- **Prioridad**: Alta

### HU-03: Administrar centros (multi-tenant)

**Como** Superadmin
**Quiero** crear y configurar centros con datos aislados
**Para** que cada centro opere de forma independiente y segura

#### Criterios de aceptación
1. **Dado** un Superadmin autenticado, **Cuando** crea un centro con sus datos, **Entonces** el sistema lo guarda y aplica el aislamiento de datos.
2. **Dado** dos centros existentes, **Cuando** un usuario de un centro intenta acceder a datos del otro, **Entonces** el sistema deniega el acceso.
3. **Dado** un centro con operación activa, **Cuando** el Superadmin intenta desactivarlo, **Entonces** el sistema advierte y solicita confirmación.

#### Metadata
- **CU asociado**: CU-03
- **Módulo**: M4 Administración
- **Story points**: 5
- **Prioridad**: Alta

### HU-04: Consultar auditoría de acciones críticas

**Como** Superadmin
**Quiero** consultar el registro de acciones críticas con filtros
**Para** investigar incidentes y verificar el uso correcto del sistema

#### Criterios de aceptación
1. **Dado** un Superadmin autenticado, **Cuando** consulta la auditoría con filtros de fecha, usuario o tipo de acción, **Entonces** el sistema muestra los registros paginados.
2. **Dado** un registro de auditoría, **Cuando** cualquier usuario intenta editarlo o eliminarlo, **Entonces** el sistema lo impide.
3. **Dado** una consulta sin resultados, **Cuando** el Superadmin la ejecuta, **Entonces** el sistema informa que no hay registros para los filtros.

#### Metadata
- **CU asociado**: CU-04
- **Módulo**: M4 Administración
- **Story points**: 3
- **Prioridad**: Media

### HU-05: Configurar segundo factor (TOTP)

**Como** usuario con rol administrativo o de portería
**Quiero** configurar mi segundo factor TOTP
**Para** proteger mi cuenta con un nivel adicional de seguridad

#### Criterios de aceptación
1. **Dado** un usuario con rol que exige TOTP, **Cuando** accede a la configuración de seguridad, **Entonces** el sistema muestra el código QR de enrolamiento.
2. **Dado** un usuario que escaneó el código, **Cuando** ingresa el código de verificación correcto, **Entonces** el sistema activa el segundo factor.
3. **Dado** un usuario de administración o portería sin TOTP configurado, **Cuando** intenta operar, **Entonces** el sistema le exige configurarlo antes de continuar.

#### Metadata
- **CU asociado**: CU-05
- **Módulo**: M4 Administración
- **Story points**: 3
- **Prioridad**: Alta

---

## M9 Fichas por jornada

### HU-06: Gestionar programas y fichas

**Como** Coordinación Bienestar
**Quiero** registrar programas y fichas con su jornada
**Para** mantener actualizado el directorio maestro del centro

#### Criterios de aceptación
1. **Dado** una coordinadora autenticada, **Cuando** crea una ficha con programa, jornada y fechas, **Entonces** el sistema la guarda y la muestra en el directorio.
2. **Dado** una ficha existente, **Cuando** se intenta crear otra igual para el mismo programa y jornada, **Entonces** el sistema advierte el posible duplicado.
3. **Dado** una ficha con eventos activos, **Cuando** se intenta desactivar, **Entonces** el sistema lo impide hasta cerrar los eventos.

#### Metadata
- **CU asociado**: CU-06
- **Módulo**: M9 Fichas por jornada
- **Story points**: 3
- **Prioridad**: Alta

### HU-07: Gestionar aprendices e instructores

**Como** Coordinación Bienestar
**Quiero** registrar aprendices e instructores y asignarlos a las fichas
**Para** que las convocatorias y comunicaciones lleguen a las personas correctas

#### Criterios de aceptación
1. **Dado** una ficha existente, **Cuando** la coordinadora asigna aprendices, **Entonces** el sistema los muestra en el directorio de la ficha sin duplicados.
2. **Dado** un aprendiz retirado, **Cuando** se consulta su historial, **Entonces** el sistema conserva sus registros y lo excluye de convocatorias nuevas.
3. **Dado** un instructor asignado a una ficha, **Cuando** consulta el sistema, **Entonces** solo ve las fichas de su ámbito.

#### Metadata
- **CU asociado**: CU-07
- **Módulo**: M9 Fichas por jornada
- **Story points**: 5
- **Prioridad**: Alta

### HU-08: Consultar directorio de fichas

**Como** Instructor
**Quiero** consultar el directorio de fichas con filtros por jornada y programa
**Para** encontrar rápidamente la información de mis grupos

#### Criterios de aceptación
1. **Dado** un instructor autenticado, **Cuando** consulta el directorio, **Entonces** el sistema muestra solo las fichas de su ámbito.
2. **Dado** el directorio abierto, **Cuando** se aplica un filtro por jornada o programa, **Entonces** el sistema actualiza los resultados.
3. **Dado** un instructor sin fichas asignadas, **Cuando** abre el directorio, **Entonces** el sistema muestra un mensaje informativo.

#### Metadata
- **CU asociado**: CU-08
- **Módulo**: M9 Fichas por jornada
- **Story points**: 2
- **Prioridad**: Media

### HU-09: Gestionar consentimientos de datos

**Como** Coordinación Bienestar
**Quiero** registrar y consultar el consentimiento de tratamiento de datos de cada aprendiz
**Para** cumplir la Ley 1581 de 2012 y proteger los datos personales

#### Criterios de aceptación
1. **Dado** un aprendiz en el directorio, **Cuando** la coordinadora registra su consentimiento con fecha y versión del aviso, **Entonces** el sistema lo guarda y lo hace consultable.
2. **Dado** un aprendiz sin consentimiento, **Cuando** se intenta incluirlo en notificaciones o procesos con datos personales, **Entonces** el sistema lo bloquea y lo reporta.
3. **Dado** un aprendiz que revoca su consentimiento, **Cuando** la coordinadora lo registra, **Entonces** el sistema lo excluye de los procesos correspondientes.

#### Metadata
- **CU asociado**: CU-09
- **Módulo**: M9 Fichas por jornada
- **Story points**: 3
- **Prioridad**: Alta

---

## M1 Refrigerios

### HU-10: Crear evento de refrigerio

**Como** Coordinación Bienestar
**Quiero** crear un evento de refrigerio con fecha, jornada y fichas convocadas
**Para** organizar la entrega sin planillas manuales

#### Criterios de aceptación
1. **Dado** una coordinadora autenticada, **Cuando** crea un evento con fecha, jornada y fichas, **Entonces** el sistema lo guarda en borrador y permite editarlo.
2. **Dado** un evento en borrador, **Cuando** la coordinadora lo publica, **Entonces** el sistema lo activa y dispara la convocatoria.
3. **Dado** un evento sin fichas seleccionadas, **Cuando** se intenta publicar, **Entonces** el sistema lo impide.

#### Metadata
- **CU asociado**: CU-10
- **Módulo**: M1 Refrigerios
- **Story points**: 5
- **Prioridad**: Alta

### HU-11: Calcular cupos por reglas

**Como** Coordinación Bienestar
**Quiero** que el sistema calcule los cupos del evento según reglas configurables
**Para** planificar las cantidades correctas sin cálculos manuales

#### Criterios de aceptación
1. **Dado** un evento con fichas y reglas configuradas, **Cuando** el sistema calcula los cupos, **Entonces** el resultado es reproducible con los mismos datos.
2. **Dado** un cálculo de cupos, **Cuando** la coordinadora revisa el evento, **Entonces** el sistema muestra las reglas aplicadas.
3. **Dado** un cambio en las reglas, **Cuando** se recalcula el evento, **Entonces** el sistema actualiza el consolidado y lo registra.

#### Metadata
- **CU asociado**: CU-10
- **Módulo**: M1 Refrigerios
- **Story points**: 5
- **Prioridad**: Alta

### HU-12: Convocar aprendices al evento

**Como** Coordinación Bienestar
**Quiero** convocar a los aprendices de las fichas del evento por los canales disponibles
**Para** que todos se enteren a tiempo y puedan confirmar

#### Criterios de aceptación
1. **Dado** un evento publicado, **Cuando** el sistema dispara la convocatoria, **Entonces** los aprendices con consentimiento reciben el mensaje por sus canales preferidos.
2. **Dado** un evento activo, **Cuando** la coordinadora consulta el consolidado, **Entonces** ve convocados, notificados y confirmados en tiempo real.
3. **Dado** un aprendiz sin consentimiento, **Cuando** se dispara la convocatoria, **Entonces** el sistema lo excluye y lo reporta.

#### Metadata
- **CU asociado**: CU-11
- **Módulo**: M1 Refrigerios
- **Story points**: 5
- **Prioridad**: Alta

### HU-13: Confirmar asistencia

**Como** Aprendiz
**Quiero** confirmar o rechazar mi asistencia al evento desde mi celular
**Para** asegurar mi cupo y evitar filas innecesarias

#### Criterios de aceptación
1. **Dado** un aprendiz convocado con la ventana abierta, **Cuando** confirma su asistencia, **Entonces** el sistema registra la respuesta y actualiza el consolidado.
2. **Dado** un aprendiz que ya respondió, **Cuando** cambia su respuesta dentro de la ventana, **Entonces** el sistema actualiza el registro.
3. **Dado** un aprendiz que abre la convocatoria después de la ventana, **Cuando** intenta confirmar, **Entonces** el sistema informa que el plazo venció.

#### Metadata
- **CU asociado**: CU-12
- **Módulo**: M1 Refrigerios
- **Story points**: 3
- **Prioridad**: Alta

### HU-14: Ajustar cupos manualmente

**Como** Auxiliar Bienestar
**Quiero** ajustar los cupos de un evento con un motivo
**Para** corregir imprevistos manteniendo la trazabilidad

#### Criterios de aceptación
1. **Dado** un evento activo, **Cuando** el auxiliar ajusta un cupo con motivo, **Entonces** el sistema recalcula el consolidado y audita el cambio.
2. **Dado** un ajuste menor a las entregas ya registradas, **Cuando** el auxiliar lo intenta, **Entonces** el sistema advierte y solicita confirmación.
3. **Dado** un usuario sin permisos de operación, **Cuando** intenta ajustar cupos, **Entonces** el sistema rechaza la operación.

#### Metadata
- **CU asociado**: CU-13
- **Módulo**: M1 Refrigerios
- **Story points**: 2
- **Prioridad**: Media

### HU-15: Entregar refrigerio con QR

**Como** Auxiliar Bienestar
**Quiero** registrar la entrega escaneando el QR del aprendiz
**Para** entregar rápido y sin errores, incluso sin conexión

#### Criterios de aceptación
1. **Dado** un evento activo y un aprendiz con derecho, **Cuando** el auxiliar escanea su QR, **Entonces** el sistema registra la entrega en menos de 5 segundos.
2. **Dado** un QR ya usado en el evento, **Cuando** se escanea de nuevo, **Entonces** el sistema muestra el motivo del rechazo.
3. **Dado** el modo de entrega sin conexión, **Cuando** se registran entregas, **Entonces** el sistema las guarda localmente y las sincroniza al recuperar la red sin duplicados.

#### Metadata
- **CU asociado**: CU-14
- **Módulo**: M1 Refrigerios
- **Story points**: 8
- **Prioridad**: Alta

### HU-16: Registrar entrega manual (excepción)

**Como** Auxiliar Bienestar
**Quiero** registrar una entrega sin QR buscando al aprendiz por documento o nombre
**Para** no dejar sin refrigerio a quien tiene derecho pero no puede mostrar su código

#### Criterios de aceptación
1. **Dado** un aprendiz sin QR disponible, **Cuando** el auxiliar lo busca por documento o nombre y registra la entrega con motivo, **Entonces** el sistema la guarda y la audita.
2. **Dado** un aprendiz con entrega ya registrada en el evento, **Cuando** se intenta registrar otra, **Entonces** el sistema advierte el duplicado.
3. **Dado** un registro manual, **Cuando** la coordinadora revisa el cierre, **Entonces** el sistema muestra el motivo y el responsable del registro.

#### Metadata
- **CU asociado**: CU-14
- **Módulo**: M1 Refrigerios
- **Story points**: 3
- **Prioridad**: Media

### HU-17: Generar consolidado para cafetería

**Como** Cafetería
**Quiero** consultar el consolidado de cantidades por jornada y marcar la preparación
**Para** preparar exactamente lo necesario y reducir el desperdicio

#### Criterios de aceptación
1. **Dado** eventos activos para el día siguiente, **Cuando** la cafetería consulta el consolidado, **Entonces** el sistema muestra las cantidades por jornada y evento.
2. **Dado** un consolidado consultado, **Cuando** la cafetería marca la preparación, **Entonces** el sistema registra la marca.
3. **Dado** un consolidado marcado que cambia después, **Cuando** hay una actualización, **Entonces** el sistema notifica a la cafetería.

#### Metadata
- **CU asociado**: CU-15
- **Módulo**: M1 Refrigerios
- **Story points**: 3
- **Prioridad**: Alta

### HU-18: Cerrar evento de refrigerio

**Como** Coordinación Bienestar
**Quiero** cerrar el evento con el cálculo de entregados, no reclamados y desperdicio
**Para** medir el resultado y alimentar los informes

#### Criterios de aceptación
1. **Dado** un evento activo con la jornada terminada, **Cuando** la coordinadora lo cierra, **Entonces** el sistema genera el reporte con planificados, entregados, no reclamados y porcentaje de desperdicio.
2. **Dado** un evento cerrado, **Cuando** se intenta registrar una entrega nueva, **Entonces** el sistema lo impide.
3. **Dado** entregas pendientes de sincronización offline, **Cuando** se intenta cerrar, **Entonces** el sistema espera la sincronización antes de continuar.

#### Metadata
- **CU asociado**: CU-16
- **Módulo**: M1 Refrigerios
- **Story points**: 5
- **Prioridad**: Alta

### HU-19: Consultar historial de entregas

**Como** Aprendiz
**Quiero** consultar mi historial de entregas de refrigerios
**Para** verificar mi participación y resolver dudas

#### Criterios de aceptación
1. **Dado** un aprendiz autenticado, **Cuando** consulta su historial, **Entonces** el sistema muestra sus eventos con fecha y estado.
2. **Dado** un rol autorizado, **Cuando** consulta el historial de un aprendiz, **Entonces** el sistema registra la lectura en la auditoría.
3. **Dado** un aprendiz sin entregas, **Cuando** abre su historial, **Entonces** el sistema muestra el historial vacío.

#### Metadata
- **CU asociado**: CU-17
- **Módulo**: M1 Refrigerios
- **Story points**: 2
- **Prioridad**: Media

---

## M2 Notificaciones

### HU-20: Enviar notificación multicanal

**Como** sistema de notificaciones
**Quiero** enviar mensajes por correo, WhatsApp o push con fallback en cascada
**Para** que la información llegue por el canal disponible de cada persona

#### Criterios de aceptación
1. **Dado** un mensaje a enviar, **Cuando** el canal primario está disponible, **Entonces** el sistema lo envía y registra el estado.
2. **Dado** un fallo del canal primario, **Cuando** el sistema aplica la cascada, **Entonces** intenta el siguiente canal y registra cada intento.
3. **Dado** un mensaje no crítico en horario silencioso, **Cuando** se intenta enviar, **Entonces** el sistema lo pospone a la ventana permitida.

#### Metadata
- **CU asociado**: CU-18
- **Módulo**: M2 Notificaciones
- **Story points**: 8
- **Prioridad**: Alta

### HU-21: Gestionar plantillas de mensajes

**Como** Coordinación Bienestar
**Quiero** crear y versionar plantillas de mensajes con variables dinámicas
**Para** comunicar de forma consistente sin redactar cada mensaje

#### Criterios de aceptación
1. **Dado** una coordinadora autenticada, **Cuando** crea una plantilla con variables y la publica, **Entonces** el sistema la versiona y la deja disponible.
2. **Dado** una plantilla con variables no reconocidas, **Cuando** se intenta publicar, **Entonces** el sistema muestra el error y lo impide.
3. **Dado** una plantilla en uso, **Cuando** se edita, **Entonces** el sistema crea una nueva versión sin alterar los envíos ya realizados.

#### Metadata
- **CU asociado**: CU-19
- **Módulo**: M2 Notificaciones
- **Story points**: 3
- **Prioridad**: Media

### HU-22: Configurar preferencias de notificación

**Como** usuario de la plataforma
**Quiero** elegir mis canales preferidos y mi horario silencioso
**Para** recibir solo lo que me interesa y en momentos adecuados

#### Criterios de aceptación
1. **Dado** un usuario autenticado, **Cuando** configura sus canales y horario silencioso, **Entonces** el sistema guarda las preferencias y las aplica a los envíos siguientes.
2. **Dado** un usuario que desactiva todos los canales, **Cuando** guarda, **Entonces** el sistema advierte que no recibirá avisos no críticos.
3. **Dado** un aviso crítico en horario silencioso, **Cuando** se envía, **Entonces** el sistema lo entrega y registra la excepción.

#### Metadata
- **CU asociado**: CU-20
- **Módulo**: M2 Notificaciones
- **Story points**: 3
- **Prioridad**: Alta

### HU-23: Aplicar límites anti-spam

**Como** sistema de notificaciones
**Quiero** aplicar límites de envío por usuario y canal
**Para** evitar la saturación de mensajes sin perder avisos críticos

#### Criterios de aceptación
1. **Dado** un usuario que supera el límite configurado, **Cuando** se generan más mensajes, **Entonces** el sistema los agrupa o pospone según la política.
2. **Dado** un aviso crítico, **Cuando** se alcanza el límite, **Entonces** el sistema lo envía igualmente y lo registra.
3. **Dado** un envío agrupado, **Cuando** el usuario lo recibe, **Entonces** el mensaje incluye los avisos agrupados de forma legible.

#### Metadata
- **CU asociado**: CU-20
- **Módulo**: M2 Notificaciones
- **Story points**: 3
- **Prioridad**: Media

### HU-24: Consultar acuses de entrega

**Como** Coordinación Bienestar
**Quiero** consultar el estado de cada notificación enviada
**Para** verificar quién recibió la información y actuar sobre los fallos

#### Criterios de aceptación
1. **Dado** un evento o publicación con envíos, **Cuando** la coordinadora consulta los acuses, **Entonces** el sistema muestra el estado de cada notificación.
2. **Dado** un envío fallido definitivo, **Cuando** se revisa su detalle, **Entonces** el sistema muestra el motivo y sugiere un canal alternativo.
3. **Dado** un filtro sin resultados, **Cuando** se aplica, **Entonces** el sistema informa que no hay envíos para el filtro.

#### Metadata
- **CU asociado**: CU-21
- **Módulo**: M2 Notificaciones
- **Story points**: 3
- **Prioridad**: Alta

### HU-25: Programar recordatorios de evento

**Como** Coordinación Bienestar
**Quiero** programar recordatorios automáticos para los convocados sin confirmar
**Para** aumentar la confirmación sin enviar mensajes manuales

#### Criterios de aceptación
1. **Dado** un evento activo, **Cuando** la coordinadora configura los momentos de recordatorio, **Entonces** el sistema los programa.
2. **Dado** un momento de recordatorio, **Cuando** llega la hora, **Entonces** el sistema envía solo a los convocados sin confirmar y registra el envío.
3. **Dado** un evento cancelado, **Cuando** se cancela, **Entonces** el sistema cancela los recordatorios pendientes.

#### Metadata
- **CU asociado**: CU-22
- **Módulo**: M2 Notificaciones
- **Story points**: 3
- **Prioridad**: Media

---

## M10 Contactos de emergencia

### HU-26: Registrar contactos de emergencia

**Como** Coordinación Bienestar
**Quiero** registrar los contactos de emergencia de cada aprendiz con su consentimiento
**Para** actuar rápido ante una emergencia

#### Criterios de aceptación
1. **Dado** un aprendiz con consentimiento vigente, **Cuando** la coordinadora registra sus contactos, **Entonces** el sistema los guarda asociados a su ficha.
2. **Dado** un aprendiz sin consentimiento, **Cuando** se intenta registrar contactos, **Entonces** el sistema lo bloquea.
3. **Dado** un teléfono con formato inválido, **Cuando** se guarda, **Entonces** el sistema muestra el error y solicita corrección.

#### Metadata
- **CU asociado**: CU-23
- **Módulo**: M10 Contactos de emergencia
- **Story points**: 3
- **Prioridad**: Alta

### HU-27: Consultar contactos de emergencia

**Como** Coordinación Bienestar
**Quiero** consultar los contactos de emergencia solo con rol autorizado y con auditoría
**Para** proteger datos sensibles y saber quién los consulta

#### Criterios de aceptación
1. **Dado** un rol autorizado, **Cuando** consulta los contactos de un aprendiz, **Entonces** el sistema los muestra y registra la lectura en la auditoría.
2. **Dado** un rol no autorizado, **Cuando** intenta consultar contactos, **Entonces** el sistema deniega el acceso y registra el intento.
3. **Dado** un aprendiz sin contactos registrados, **Cuando** se consulta, **Entonces** el sistema lo informa.

#### Metadata
- **CU asociado**: CU-24
- **Módulo**: M10 Contactos de emergencia
- **Story points**: 3
- **Prioridad**: Alta

---

## M6 Noticias y campañas

### HU-28: Publicar noticia o campaña

**Como** Coordinación Bienestar
**Quiero** publicar noticias y campañas segmentadas por ficha o jornada
**Para** que cada grupo reciba solo la información que le corresponde

#### Criterios de aceptación
1. **Dado** una coordinadora autenticada, **Cuando** publica una noticia para un segmento, **Entonces** solo ese segmento la recibe.
2. **Dado** una campaña programada, **Cuando** llega la fecha y hora, **Entonces** el sistema la publica automáticamente.
3. **Dado** una campaña programada, **Cuando** se cancela antes de su publicación, **Entonces** el sistema no la publica.

#### Metadata
- **CU asociado**: CU-25
- **Módulo**: M6 Noticias y campañas
- **Story points**: 5
- **Prioridad**: Media

### HU-29: Consultar analítica de campañas

**Como** Coordinación Bienestar
**Quiero** ver métricas de alcance y lectura de mis publicaciones
**Para** saber si la información está llegando

#### Criterios de aceptación
1. **Dado** una publicación con datos, **Cuando** la coordinadora consulta su analítica, **Entonces** el sistema muestra vistas, lecturas y clics agregados por día.
2. **Dado** dos publicaciones, **Cuando** se comparan, **Entonces** el sistema muestra el alcance de cada una.
3. **Dado** cualquier consulta de analítica, **Cuando** se muestran métricas, **Entonces** estas nunca exponen datos personales de los lectores.

#### Metadata
- **CU asociado**: CU-26
- **Módulo**: M6 Noticias y campañas
- **Story points**: 3
- **Prioridad**: Baja

---

## M7 Encuestas

### HU-30: Crear encuesta

**Como** Coordinación Bienestar
**Quiero** crear encuestas con preguntas y modo anónimo
**Para** recoger opiniones de los aprendices de forma ordenada

#### Criterios de aceptación
1. **Dado** una coordinadora autenticada, **Cuando** crea una encuesta con preguntas y la publica, **Entonces** el sistema congela su estructura y la habilita.
2. **Dado** una encuesta sin preguntas, **Cuando** se intenta publicar, **Entonces** el sistema lo impide.
3. **Dado** una encuesta marcada como anónima, **Cuando** se publica, **Entonces** el sistema advierte que no se podrá identificar a los respondientes.

#### Metadata
- **CU asociado**: CU-27
- **Módulo**: M7 Encuestas
- **Story points**: 3
- **Prioridad**: Media

### HU-31: Aplicar encuesta

**Como** Aprendiz
**Quiero** responder las encuestas desde mi celular
**Para** dar mi opinión de forma rápida y segura

#### Criterios de aceptación
1. **Dado** un aprendiz del segmento con encuesta publicada, **Cuando** responde y envía, **Entonces** el sistema registra la respuesta.
2. **Dado** una encuesta anónima, **Cuando** se registra la respuesta, **Entonces** el sistema no almacena identificador de usuario.
3. **Dado** un envío con preguntas obligatorias sin responder, **Cuando** se intenta enviar, **Entonces** el sistema las señala antes de continuar.

#### Metadata
- **CU asociado**: CU-28
- **Módulo**: M7 Encuestas
- **Story points**: 3
- **Prioridad**: Media

### HU-32: Consultar resultados de encuesta

**Como** Coordinación Bienestar
**Quiero** consultar y exportar los resultados agregados de las encuestas
**Para** tomar decisiones y alimentar el informe de investigación

#### Criterios de aceptación
1. **Dado** una encuesta con respuestas, **Cuando** la coordinadora consulta los resultados, **Entonces** el sistema muestra los agregados por pregunta y segmento.
2. **Dado** un segmento con menos respuestas que el mínimo configurado, **Cuando** se consultan resultados, **Entonces** el sistema oculta ese desglose.
3. **Dado** resultados consultados, **Cuando** se exportan, **Entonces** el archivo es apto para el informe.

#### Metadata
- **CU asociado**: CU-29
- **Módulo**: M7 Encuestas
- **Story points**: 3
- **Prioridad**: Media

---

## M8 Reuniones y agenda

### HU-33: Agendar reunión

**Como** Coordinación Bienestar
**Quiero** agendar reuniones con convocados y notificación automática
**Para** asegurar la asistencia sin perseguir a cada persona

#### Criterios de aceptación
1. **Dado** una coordinadora autenticada, **Cuando** agenda una reunión con convocados, **Entonces** el sistema la guarda y notifica a los convocados.
2. **Dado** una reunión agendada, **Cuando** se edita o cancela, **Entonces** el sistema notifica la actualización.
3. **Dado** un conflicto de horario del organizador, **Cuando** se agenda, **Entonces** el sistema advierte el conflicto.

#### Metadata
- **CU asociado**: CU-30
- **Módulo**: M8 Reuniones y agenda
- **Story points**: 3
- **Prioridad**: Media

### HU-34: Gestionar confirmaciones de reunión

**Como** Instructor
**Quiero** confirmar o rechazar mi asistencia a una reunión
**Para** que el organizador sepa quién asistirá

#### Criterios de aceptación
1. **Dado** un convocado a una reunión, **Cuando** confirma o rechaza, **Entonces** el sistema registra la respuesta y actualiza el estado.
2. **Dado** un convocado que cambia su respuesta, **Cuando** la actualiza, **Entonces** el sistema refleja el cambio.
3. **Dado** una reunión cancelada, **Cuando** el convocado intenta confirmar, **Entonces** el sistema deshabilita la confirmación.

#### Metadata
- **CU asociado**: CU-31
- **Módulo**: M8 Reuniones y agenda
- **Story points**: 2
- **Prioridad**: Baja

### HU-35: Enviar recordatorios de reunión

**Como** sistema de agenda
**Quiero** enviar recordatorios a los convocados sin confirmar
**Para** reducir las ausencias a las reuniones

#### Criterios de aceptación
1. **Dado** una reunión próxima con convocados sin confirmar, **Cuando** llega el momento configurado, **Entonces** el sistema envía el recordatorio y lo registra.
2. **Dado** un convocado que ya confirmó, **Cuando** se envían recordatorios, **Entonces** el sistema lo excluye.
3. **Dado** una reunión cancelada, **Cuando** había recordatorios pendientes, **Entonces** el sistema los cancela.

#### Metadata
- **CU asociado**: CU-32
- **Módulo**: M8 Reuniones y agenda
- **Story points**: 3
- **Prioridad**: Baja

### HU-36: Registrar acta de reunión

**Como** Coordinación Bienestar
**Quiero** registrar el acta de la reunión con asistentes y compromisos
**Para** dejar constancia y hacer seguimiento

#### Criterios de aceptación
1. **Dado** una reunión realizada, **Cuando** la coordinadora registra el acta, **Entonces** el sistema la guarda asociada a la reunión.
2. **Dado** un acta publicada, **Cuando** se edita, **Entonces** el sistema conserva el historial de cambios.
3. **Dado** un compromiso registrado, **Cuando** se marca como cumplido, **Entonces** el sistema actualiza su estado.

#### Metadata
- **CU asociado**: CU-33
- **Módulo**: M8 Reuniones y agenda
- **Story points**: 3
- **Prioridad**: Baja

---

## M5 Informes

### HU-37: Generar planilla de entrega exportable

**Como** Coordinación Bienestar
**Quiero** generar y exportar la planilla de entrega de un evento
**Para** imprimirla o compartirla cuando se necesite

#### Criterios de aceptación
1. **Dado** un evento con datos de entrega, **Cuando** la coordinadora genera la planilla, **Entonces** el sistema la produce con convocados, confirmados y entregados.
2. **Dado** una planilla generada, **Cuando** se exporta, **Entonces** el archivo PDF o Excel coincide con los datos del evento.
3. **Dado** un evento aún activo, **Cuando** se genera la planilla, **Entonces** el sistema advierte que es preliminar.

#### Metadata
- **CU asociado**: CU-34
- **Módulo**: M5 Informes
- **Story points**: 3
- **Prioridad**: Alta

### HU-38: Generar informe consolidado periódico

**Como** Coordinación Bienestar
**Quiero** generar informes semanales o mensuales sin doble digitación
**Para** reportar resultados con datos confiables

#### Criterios de aceptación
1. **Dado** eventos cerrados en el periodo, **Cuando** la coordinadora genera el informe, **Entonces** el sistema consolida entregas, no reclamados, desperdicio y participación.
2. **Dado** un informe generado, **Cuando** se exporta, **Entonces** el archivo es comparable entre periodos.
3. **Dado** un periodo con eventos sin cerrar, **Cuando** se genera el informe, **Entonces** el sistema los excluye y lo advierte.

#### Metadata
- **CU asociado**: CU-35
- **Módulo**: M5 Informes
- **Story points**: 5
- **Prioridad**: Media

### HU-39: Consultar tablero de indicadores

**Como** Coordinación Bienestar
**Quiero** ver un tablero con los indicadores operativos del área
**Para** monitorear el desempeño sin armar reportes manuales

#### Criterios de aceptación
1. **Dado** datos en el periodo seleccionado, **Cuando** la coordinadora abre el tablero, **Entonces** el sistema muestra entregas, no reclamados, desperdicio y participación por jornada.
2. **Dado** el tablero abierto, **Cuando** se filtra por jornada o ficha, **Entonces** los indicadores se actualizan.
3. **Dado** un rol con ámbito limitado, **Cuando** consulta el tablero, **Entonces** el sistema limita los datos a su alcance.

#### Metadata
- **CU asociado**: CU-36
- **Módulo**: M5 Informes
- **Story points**: 5
- **Prioridad**: Media

---

## Resumen de story points por módulo

| Módulo | HU | Story points |
|---|---|---|
| M4 Administración | HU-01 a HU-05 | 17 |
| M9 Fichas por jornada | HU-06 a HU-09 | 13 |
| M1 Refrigerios | HU-10 a HU-19 | 41 |
| M2 Notificaciones | HU-20 a HU-25 | 23 |
| M10 Contactos de emergencia | HU-26, HU-27 | 6 |
| M6 Noticias y campañas | HU-28, HU-29 | 8 |
| M7 Encuestas | HU-30 a HU-32 | 9 |
| M8 Reuniones y agenda | HU-33 a HU-36 | 11 |
| M5 Informes | HU-37 a HU-39 | 13 |
| **Total** | **39 HU** | **141** |

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-09 | Creación del borrador a partir del ERS y los CU v0.1 |
