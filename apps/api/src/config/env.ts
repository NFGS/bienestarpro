/**
 * Carga el `.env` local (si existe) antes de que los módulos lean variables
 * de entorno. En CI y despliegue las variables vienen del entorno y el
 * archivo no existe: el try/catch lo tolera.
 *
 * Importar este módulo como efecto secundario y ANTES que cualquier otro
 * módulo que lea `process.env` (ver main.ts).
 */
try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: se usan las variables del entorno.
}
