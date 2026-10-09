# Matriz de Trazabilidad Inicial (Discovery → Requisitos) — BienestarPro

**Propósito:** conectar cada paso del proceso actual con el dolor, la métrica, la evidencia y el **requisito candidato**. Es el esqueleto de la Fase 1 (especificación de requisitos) y el control de que ninguna funcionalidad se invente: **todo requisito nace de una evidencia recogida**.

**Estado:** inicial. Las celdas marcadas *por confirmar* se completan con las sesiones del discovery (`12-ficha-registro-sesion.md`). No es un documento de toddlers: los identificadores (`A`, `DOL`, `RC`, `RF`, `RNF`, `EV`) se mantienen estáveis durante todo el proyecto para el informe y la defensa.

**Regla de oro:** `RF` y `RNF` solo nacen con `EV` o con `DOL` respaldado. Un requisito sin evidencia se elimina, no se debate.

---

## 1. Proceso de refrigerios (AS-IS, pasos del diagrama)

| Paso | Actividad actual | Actores | Herramientas (por confirmar) | Dolor esperado | Métrica | Requisito candidato | Evidencia requerida | Estado |
|---|---|---|---|---|---|---|---|---|
| A1 | Definir jornada/evento y derecho a refrigerio | | | | | | EV: resolución/lineamiento | Por confirmar |
| A2 | Calcular cantidades a preparar | | | | R1 | | EV: planilla de solicitud | Por confirmar |
| A3 | Solicitar a cafetería | | | | R1 | | EV: correo/WhatsApp de orden | Por confirmar |
| A4 | Convocar a aprendices | | | C1–C4 | | | EV: mensaje real | Por confirmar |
| A5 | Entregar y verificar quién recibe | | | | R2, R6 | | EV: foto del punto de entrega | Por confirmar |
| A6 | Registrar la entrega | | | R5, R7 | | EV: planilla del día | Por confirmar |
| A7 | Cerrar, reportar y consolidar | | | R3, R4 | | EV: formato de informe | Por confirmar |

## 2. Proceso de registro de portátiles (diagnóstico, Fase 5)

| Paso | Actividad actual | Actores | Dolor esperado | Métrica | Requisito candidato | Evidencia requerida | Estado |
|---|---|---|---|---|---|---|---|
| B1 | Ingreso de equipos | | | T1, T2 | | EV: formato de portería | Por confirmar |
| B2 | Consulta del registro | | | T3 | | EV: quién consulta y para qué | Por confirmar |
| B3 | Incidente o pérdida | | | T3 | | EV: procedimiento actual | Por confirmar |

## 3. Servicios del área (según alcance del piloto)

| Área funcional | Dolor esperado | Requisito candidato (verbo + capacidad) | Evidencia requerida | Prioridad (por confirmar) |
|---|---|---|---|---|
| Notificaciones a aprendices | La información se pierde o llega tarde | "Enviar aviso de convocatoria y confirmar asistencia" | EV: mensaje actual + tasa de respuesta | Alta (por confirmar) |
| Registro de refrigerios | Planillas manuales, duplicados | "Registrar entrega y generar el cierre sin doble digitación" | EV: planilla del día | Alta |
| Noticias y campañas | Difusión manual | "Publicar y segmentar avisos por jornada" | EV: responsable actual | Media |
| Encuestas | Recolección dispersa | "Aplicar encuesta y consolidar respuestas" | EV: formato actual | Media |
| Reuniones | Agenda y actas dispersas | "Agendar reunión y generar acta" | EV: formato de acta | Media |
| Informes | Consolidación manual | "Generar informe semanal con datos existentes" | EV: formato de informe | Media |
| Fichas y contactos de emergencia | Listados desactualizados | "Administrar datos por ficha con consentimiento y privacidad" | EV: listado actual + consentimiento | Alta |
| Portátiles | Registro manual | "Registrar ingreso/salida de equipos" | EV: formato de portería | Fase 5 |

## 4. Candidatos a RNF (se confirman con medición)

| ID | Restricción | Justificación | Cómo se verifica |
|---|---|---|---|
| RNF-01 | La interfaz debe ser operable por personas con baja alfabetización digital | Requisito del cliente, no supuesto | Prueba con 3–5 aprendices; tiempo de tarea y errores |
| RNF-02 | Debe funcionar con conectividad intermitente (uso en portería y punto de entrega) | Observación de campo | Prueba en modo offline |
| RNF-03 | Cumplir la Ley 1581 de 2012: consentimiento, finalidad, minimización y acceso restringido | Obligación legal | Auditoría de datos + consentimiento firmado |
| RNF-04 | Accesibilidad: tamaño de letra, contraste, uso con lector de pantalla | Inclusión | Auditoría WCAG AA |
| RNF-05 | Tiempo de respuesta y disponibilidad definidos con medición | Aún sin medir | Prueba de carga con el volumen de la línea base |
| RNF-06 | Los datos personales no salen de la infraestructura del SENA sin base jurídica | Obligación legal y política institucional | Revisión de configuración y de terceros |

## 5. Trazabilidad de una línea de ejemplo

_(Rellenar con la primera sesión completada. Demuestra que la cadena "evidencia → dolor → requisito" funciona.)_

```
EV-D-E1-03  →  DOL-01 (planilla se arma a mano)  →  RC-01  →  RF-01  →  prueba / evidencia de validación
```

## 6. Reglas de mantenimiento

1. Cada sesión de discovery agrega filas; no se reescribe lo ya validado.
2. Un `DOL` sin evidencia se marca *hipótesis* y no alimenta requisitos.
3. Los identificadores no se reutilizan ni se renumeran (como en los ADR).
4. Al cerrar la Fase 1, esta matriz se versiona como *matriz de trazabilidad ERS* y se liga a la matriz de pruebas.
5. Cambio de alcance → nota en `docs/adr/` (decisión arquitectónica) antes que edición silenciosa de esta matriz.