# ADR-0006: Identidad propia con puerto de federación (Google/Microsoft/Keycloak)

- **Estado:** Aceptada
- **Fecha:** 2026-10-09
- **Decisores:** Nelson Fabián Gallego Sánchez (semillerista / desarrollador principal), dirección técnica del proyecto
- **Relacionados:** SPEC §3; RF-01; RF-05; RNF-08

## Contexto y problema

La plataforma debe autenticar a perfiles muy distintos (aprendices, instructores, funcionarios, cafetería, portería) con usuarios de baja alfabetización digital: el inicio de sesión debe ser simple (documento o correo + contraseña) y, a la vez, los roles administrativos y de portería exigen segundo factor TOTP. No está garantizado que todos los usuarios tengan cuenta de Google o Microsoft institucional (ni que la federación con los servicios del SENA esté disponible en el corto plazo), y el piloto no tiene presupuesto para un servicio de identidad pago. La federación futura debe ser posible sin reescribir los módulos.

## Alternativas consideradas

1. **Opción A (elegida):** Identidad propia (credenciales locales) implementada detrás de un puerto `IdentityProvider`, con adaptadores de federación previstos.
   - Pros: control total y costo cero; login simple para los perfiles no técnicos; la federación futura solo agrega un adaptador; TOTP se integra en el flujo propio.
   - Contras: la responsabilidad de seguridad es nuestra (hashing, bloqueos, recuperación de contraseña, rotación de tokens); hay que mantener y documentar el puerto.
2. **Opción B:** Keycloak desde el inicio.
   - Pros: estándar maduro (OIDC), TOTP, federación y administración incluidas.
   - Contras: operación pesada para una sola máquina con 15 GB de RAM; sobredimensionado para la escala del piloto; más tiempo de puesta en marcha que de desarrollo.
3. **Opción C:** Solo OAuth con Google/Microsoft.
   - Pros: cero gestión de contraseñas.
   - Contras: no todos los usuarios tienen las cuentas; menores de edad con restricciones; dependencia externa total desde el día 1.
4. **Opción D:** Servicio SaaS de identidad (p. ej. Auth0).
   - Pros: rápido y completo.
   - Contras: costo al crecer, datos de aprendices en un tercero adicional (Ley 1581), dependencia estratégica.

## Decisión

Usaremos **identidad propia** con estas reglas:

- **D1 —** Login con correo o documento + contraseña; hashing con Argon2id; tokens de acceso de vida corta + refresh rotativo.
- **D2 —** Bloqueo temporal por intentos fallidos (configurable) y registro de accesos en auditoría (RF-01, RF-04).
- **D3 —** TOTP obligatorio para administración y portería (RF-05, RNF-08), con recuperación auditada.
- **D4 —** La lógica de identidad vive detrás del puerto `IdentityProvider`; un adaptador local hoy; adaptadores de federación (Google Workspace, Microsoft, Keycloak) cuando exista la necesidad institucional, sin tocar los módulos de dominio.

## Consecuencias

- **Positivas:** costo cero y control total; experiencia de acceso simple para los perfiles no técnicos; federación futura barata de adoptar; sin dependencia de terceros desde el día 1.
- **Negativas / trade-offs:** asumimos la superficie de seguridad de credenciales (phishing de contraseñas, fuerza bruta, recuperación abusada); requiere disciplina de pruebas de seguridad; el puerto debe mantenerse estable.
- **Neutrales:** cuando llegue la federación institucional, convivirán ambos flujos (local y federado) durante la transición.

## Cumplimiento / verificación

- Pruebas de bloqueo por intentos fallidos, expiración de tokens y rotación de refresh.
- Verificación de RNF-08: 100% de cuentas de administración y portería con TOTP activo.
- Auditoría de accesos consultable (CU-04).

## Enlaces

- `SPEC.md` §3 (actores y roles, TOTP obligatorio)
- `docs/01-requisitos/01-ers-borrador-v0.1.md` (RF-01, RF-05)
