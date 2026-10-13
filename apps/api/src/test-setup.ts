import 'reflect-metadata';

/** Carga el `.env` local antes de que las pruebas importen la aplicación. */
try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: variables del entorno (CI).
}
