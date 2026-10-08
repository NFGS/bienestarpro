# Checklist Meta / WhatsApp — BienestarPro

**Propósito:** preparar la ruta oficial de WhatsApp (Meta Cloud API) y evitar bloqueos por uso no oficial.

## 1. Cuenta y verificación

- [ ] Crear cuenta en Meta Business Suite (business.facebook.com) con responsable definido
- [ ] Verificación de negocio: reunir documentos (RUT o documento del titular, sitio/correo verificable)
- [ ] Identificar si la verificación se hace a nombre de persona natural (estudiante) o de una empresa/entidad
- [ ] Registrar el número dedicado del proyecto (número nuevo, no personal, con SIM activa)
- [ ] Definir nombre visible del remitente (máximo 25 caracteres, sin "SENA" sin autorización — usar "BienestarPro")
- [ ] Revisar política de uso y ventana de servicio de 24 h

## 2. Desarrollo (mientras se verifica)

- [ ] Usar número de prueba de Meta (hasta 5 destinatarios verificados) para el desarrollo
- [ ] Confirmar que el adaptador del hub de notificaciones permite conmutar entre números sin tocar negocio
- [ ] Endpoint de webhook con HTTPS (disponible en capa gratuita o túnel de desarrollo)

## 3. Plantillas iniciales (categoría: utility)

| Plantilla | Contenido | Variables |
|---|---|---|
| `refrigerio_convocatoria` | "Hola {{1}}, hay refrigerio programado para tu ficha {{2}} el {{3}} a las {{4}}. Confirma con un toque." | Nombre, ficha, fecha, hora |
| `refrigerio_recordatorio` | "Recuerda: refrigerio para tu ficha {{1}} hoy a las {{2}}. Confirma tu asistencia." | Ficha, hora |
| `refrigerio_entrega` | "Tu refrigerio de hoy quedó registrado. ¡Gracias!" | — |

- [ ] Redactar y enviar plantillas a revisión de Meta
- [ ] Verificar aprobación (puede tardar días; iniciar temprano)

## 4. Presupuesto y costos

- [ ] Documentar tarifas vigentes de Meta para Colombia (mensajes utility)
- [ ] Nota de coyuntura: desde el 1-oct-2026 las respuestas de servicio se cobran tras 1.000 gratis/mes por número
- [ ] Método de pago configurado (o plan explícito de contingencia con número de prueba)
- [ ] Definir límite de gasto mensual y quién lo administra

## 5. Cumplimiento y privacidad

- [ ] Aviso de privacidad para usuarios de WhatsApp (Ley 1581)
- [ ] Consentimiento de aprendices (o representante legal si son menores) para recibir mensajes
- [ ] Opción de salida/desactivación por usuario

## 6. Estado del trámite

| Fecha | Paso | Estado | Responsable |
|---|---|---|---|
| | | | |
