# ADR-0013: Alcance del piloto — módulos completos y orden de construcción

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), cliente interno (área de Bienestar al Aprendiz), dirección técnica del proyecto
- **Relacionados:** SPEC §2 y §9; ADR-0007; protocolo de investigación §1.4 y §3

## Contexto y problema

El cliente interno (área de Bienestar al Aprendiz) decidió que el piloto incluya **los módulos completos** del alcance acordado (orden 1 a 9 de SPEC §2: M4 Administración, M9 Fichas, M1 Refrigerios, M2 Notificaciones, M10 Contactos, M6 Noticias, M7 Encuestas, M8 Reuniones, M5 Informes), dejando M3 Portátiles y M11 IA/RAG para la Fase 5. La contraparte es el riesgo clásico: alcance amplio con un equipo semillero de una persona (con posible vinculación de 1 o 2 semilleristas adicionales). El proyecto ya identificó "alcance amplio" como riesgo principal (SPEC §9) y necesita una estrategia explícita de construcción.

## Alternativas consideradas

1. **Opción A (elegida):** Módulos completos (orden 1 a 9) con rebanadas verticales, orden de construcción definido y timeboxing.
   - Pros: entrega el valor que el cliente pidió; más datos y flujo real para la investigación SENNOVA; permite medir métricas pre/post completas en el piloto.
   - Contras: riesgo de atrasos; exige disciplina de alcance y capacidad de decir "no" a cambios tardíos.
2. **Opción B:** MVP mínimo (solo refrigerios + notificaciones) y el resto después.
   - Pros: menor riesgo, resultado más temprano.
   - Contras: rechazada por decisión del cliente interno; limitaría el piloto (fichas, contactos y comunicación son parte del dolor medido) y los datos de investigación.
3. **Opción C:** Todo incluido desde el inicio (con portátiles e IA).
   - Pros: alcance total.
   - Contras: inviable para el equipo; normalize el riesgo; la IA depende de hardware (máquina de 15 GB sin GPU) y los portátiles requieren diagnóstico de portería que no existe aún.

## Decisión

- **D1 —** El piloto cubre los **9 módulos del orden 1 a 9** de SPEC §2 (M3 y M11 quedan en Fase 5, diagnosticados en Fase 0).
- **D2 —** Construcción por **rebanadas verticales**: cada módulo se cierra de punta a punta (UI, API, datos, pruebas, evidencia) antes de abrir el siguiente.
- **D3 —** Orden de construcción: **M4 → M9 → M1 → M2 → M10 → M6 → M7 → M8 → M5** (justificado: identidad y fichas habilitan todo; refrigerios y notificaciones son el corazón del piloto; el resto consume los datos ya existentes; informes cierra porque necesita todos los datos).
- **D4 —** **Timeboxing** por rebanada con revisión de alcance ante desviaciones; todo cambio de alcance se documenta (ADR o nota) antes de implementarse, nunca de forma silenciosa.
- **D5 —** Mitigación de capacidad: vinculación de 1 o 2 semilleristas adicionales (solicitud incluida en el brief SENNOVA); si no se concreta, el timeboxing protege el cierre del orden 9.

## Consecuencias

- **Positivas:** el piloto entrega el valor completo decidido por el cliente; la investigación obtiene métricas ricas (pre/post por módulo); el orden reduce retrabajo (informes al final, sobre datos reales).
- **Negativas / trade-offs:** el riesgo de atraso es real y se asume con mitigaciones; el equipo (una persona) es el recurso más ajustado; cualquier desviación debe gestionarse con transparencia ante el cliente interno y el grupo SENNOVA.
- **Neutrales:** la Fase 5 (portátiles, IA) queda planificada con su propio diagnóstico y ADRs (ADR-0009, ADR-0012 diferidos).

## Cumplimiento / verificación

- Tablero de avance por módulo (rebanada cerrada = UI + API + pruebas + evidencia).
- El piloto se habilita al cerrar el orden 9 (SPEC §2).
- Revisión de alcance en cada reunión de seguimiento con el cliente interno y el grupo SENNOVA.

## Enlaces

- `SPEC.md` §2 (alcance por módulos) y §9 (riesgos)
- `docs/sennova/00-brief-reunion-sennova.md` (solicitud de semilleristas)
- `docs/sennova/01-protocolo-investigacion.md` §1.4 (delimitación)
