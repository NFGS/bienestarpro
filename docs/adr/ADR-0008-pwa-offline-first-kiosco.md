# ADR-0008: PWA offline-first y modo kiosco (portería y entrega)

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** SPEC §4; ADR-0007; RF-17; RNF-02; RNF-12

## Contexto y problema

Los momentos críticos del sistema ocurren donde la conectividad es dudosa: el punto de entrega de refrigerios (aulas, patios) y la portería (registro de portátiles, Fase 5). Si el registro falla cuando no hay red, el proceso se rompe justo cuando más importa. Los usuarios del punto de entrega tienen baja alfabetización digital: la interfaz debe ser simple y resistente. No hay presupuesto ni equipo para desarrollar y mantener dos aplicaciones nativas (Android/iOS).

## Alternativas consideradas

1. **Opción A (elegida):** PWA offline-first (Vite + vite-plugin-pwa/Workbox) con cola local en IndexedDB y sincronización idempotente.
   - Pros: una sola base de código para computador y celular; funciona sin red en los puntos críticos; instalable desde el navegador (sin tiendas); reutiliza el mismo backend y contratos.
   - Contras: límites de iOS (instalación menos obvia, restricciones de almacenamiento); complejidad real de la sincronización (conflictos, duplicados); requiere disciplina de caché (invalidación de datos viejos).
2. **Opción B:** Aplicación nativa.
   - Pros: acceso completo a hardware y tiendas.
   - Contras: dos/three bases de código (Android/iOS/escritorio), publicación en tiendas, equipo inexistente para mantenerlas.
3. **Opción C:** Web online-only.
   - Pros: simplicidad máxima.
   - Contras: falla exactamente en el escenario crítico (punto de entrega sin red); inaceptable para el objetivo del sistema.
4. **Opción D:** Envoltorio nativo (Capacitor) desde el inicio.
   - Pros: offline más cómodo en algunos casos.
   - Contras: doble empaquetado y pipeline; postergable: la PWA cubre el piloto y Capacitor queda como opción futura si una necesidad real de tienda aparece.

## Decisión

Usaremos **PWA offline-first** con estas reglas:

- **D1 —** Shell de la aplicación precacheado (Workbox); estrategias de caché explícitas por tipo de dato; nada se cachea "por accidente".
- **D2 —** Operaciones críticas (entrega de refrigerios; kiosco de portería en Fase 5) usan **cola local en IndexedDB**: la operación se registra en el dispositivo y se sincroniza al recuperar la red.
- **D3 —** **Idempotencia por UUID generado en el cliente**: sincronizar dos veces no duplica entregas ni registros.
- **D4 —** El modo kiosco (pantalla fija, sesión de portería con TOTP) se diseña desde ahora aunque se implemente en Fase 5, para no rehacer la arquitectura del cliente.
- **D5 —** Instalable en Android, iOS y escritorio; verificación con auditoría de instalabilidad (RNF-12).

## Consecuencias

- **Positivas:** el punto crítico funciona aunque no haya red (RNF-02); una sola base de código; instalación sin tiendas; los contratos compartidos evitan divergencia con el backend.
- **Negativas / trade-offs:** la sincronización es la parte más delicada del sistema (conflictos, orden de eventos, duplicados): exige pruebas dedicadas; en iOS la instalación es manual para el usuario; la caché puede mostrar datos viejos si se invalida mal.
- **Neutrales:** la lógica offline vive en el cliente; el backend debe aceptar operaciones idempotentes como regla general.

## Cumplimiento / verificación

- Prueba en modo offline: se registran entregas sin red y se sincronizan sin pérdida ni duplicados (100% según RNF-02).
- Pruebas de idempotencia: reenvío del mismo UUID no altera el estado.
- Auditoría de instalabilidad y funcionalidad en las dos últimas versiones de los navegadores objetivo (RNF-12).

## Enlaces

- `SPEC.md` §4 (PWA offline-first)
- `docs/01-requisitos/01-ers-borrador-v0.1.md` (RF-17, RNF-02, RNF-12)
