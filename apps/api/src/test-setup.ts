import 'reflect-metadata';

/** Carga el `.env` local antes de que las pruebas importen la aplicación. */
try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: variables del entorno (CI).
}

// Pruebas deterministas: el relay de notificaciones no arranca solo; cada
// spec que lo necesite invoca `relay.tick()` explícitamente.
process.env.NOTIFICATIONS_RELAY_ENABLED = 'false';

// El planificador de recordatorios de reuniones (M8) tampoco arranca solo:
// las pruebas invocan `runReminders()` de forma explícita.
process.env.MEETINGS_SCHEDULER_ENABLED = 'false';
