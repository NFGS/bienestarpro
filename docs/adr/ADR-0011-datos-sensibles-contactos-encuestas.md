# ADR-0011: Datos sensibles — contactos de emergencia y anonimato en encuestas

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** SPEC §5; ADR-0003; ADR-0007; RF-11; RF-28; RF-29; RF-34; RNF-03; RN-07; RN-08

## Contexto y problema

El sistema trata dos categorías de datos especialmente delicadas:

1. **Contactos de emergencia** de los aprendices (nombre, parentesco, teléfono de terceros): necesarios para actuar en una emergencia, pero sensibles por naturaleza y por tratarse de datos de terceros que no consintieron directamente.
2. **Encuestas** con doble uso (gestión institucional e investigación SENNOVA): si no son anónimas por diseño, la sinceridad de las respuestas cae y crece el riesgo legal; pero el anonimato mal implementado (identificadores ocultos, segmentos pequeños) es una falsa promesa.

Aplica la Ley 1581 de 2012 y el Decreto 1377 de 2013 (consentimiento, finalidad, minimización), con la particularidad de que parte de la población son menores de edad (autorización del representante legal).

## Alternativas consideradas

1. **Opción A (elegida):** Acceso mínimo auditado + minimización + anonimato por diseño en encuestas, con cifrado según evaluación de riesgo.
   - Pros: cumplimiento verificable; protege a los aprendices y al centro; el anonimato real mejora la calidad de los datos de investigación.
   - Contras: más operación (auditoría de lecturas, umbrales de agregación); resultados con menor granularidad; coordinación con ética SENNOVA para menores.
2. **Opción B:** Solo RBAC en claro (acceso por rol, sin auditoría de lecturas ni cifrado adicional).
   - Pros: simplicidad.
   - Contras: respaldos y exportaciones quedan expuestos; no defendible ante auditoría; incumple el principio de responsabilidad demostrada.
3. **Opción C:** Cifrado a nivel de campo con gestión de claves propia desde el inicio.
   - Pros: máxima protección en reposo.
   - Contras: complejidad alta para el equipo (rotación de claves, recuperación); se adopta condicionalmente: solo si el threat model lo exige para contactos de emergencia.
4. **Opción D:** Encuestas siempre identificadas.
   - Pros: permite cruces y seguimiento individual.
   - Contras: sesgo en respuestas sensibles; riesgo legal; contradice el uso investigativo.

## Decisión

- **D1 — Contactos de emergencia:** registro solo con consentimiento vigente (RF-28); visibilidad restringida a roles autorizados; **cada lectura queda auditada** (RF-29, RN-07); cifrado en reposo provisto por la infraestructura y cifrado a nivel de aplicación **si la evaluación de riesgo (threat model) lo exige**; retención definida y borrado al retiro del aprendiz.
- **D2 — Encuestas anónimas:** sin identificador de usuario en las respuestas; **umbral mínimo de respuestas por segmento** antes de mostrar desgloses (RN-08, RF-35); prohibidos los cruces que permitan reidentificación.
- **D3 — Consentimiento versionado y revocable** (RF-11): cada consentimiento registra fecha y versión del aviso; la revocación excluye al aprendiz de los procesos correspondientes.
- **D4 — Menores de edad:** autorización del representante legal según el formato del proyecto; los grupos focales de investigación no registran datos identificables.
- **D5 — Datos sintéticos en desarrollo:** nunca datos reales de aprendices en entornos de desarrollo o pruebas.

## Consecuencias

- **Positivas:** cumplimiento de Ley 1581 y del marco ético SENNOVA; confianza de la comunidad; encuestas con datos más honestos; auditoría lista para una revisión institucional.
- **Negativas / trade-offs:** la auditoría de lecturas y los umbrales de agregación son operación adicional; con pocos respondientes, algunos desgloses no se podrán mostrar; el cifrado de campo, si se exige, agrega complejidad.
- **Neutrales:** la minimización reduce la cantidad de datos disponibles para analítica futura (aceptado por diseño).

## Cumplimiento / verificación

- 100% de lecturas de contactos de emergencia auditadas (RNF-03).
- Prueba de anonimato: en encuestas anónimas no existe `usuario_id` en las respuestas; los segmentos pequeños no muestran desglose.
- Consentimientos consultables y revocables con versión e historial.
- Revisión de retención y borrado programada.

## Enlaces

- `SPEC.md` §5 (datos y privacidad)
- `docs/sennova/01-protocolo-investigacion.md` §5.6 (consideraciones éticas)
- `docs/02-arquitectura/03-threat-model.md` (evaluación de riesgo)
