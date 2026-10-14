/**
 * Evidencia de la rebanada 8 (M8): reuniones — agenda con convocados (persona
 * y ficha), RSVP del convocado, detalle del organizador y acta con compromisos.
 * Requisitos: API en http://127.0.0.1:3001, web en http://localhost:5173 y el
 * usuario demo con TOTP enrolado.
 * Uso (desde apps/web): TOTP_SECRET=<secreto> node scripts/evidence-rebanada8.mjs
 */
import { mkdirSync } from 'node:fs';
import { generateSync } from 'otplib';
import { chromium } from 'playwright';

const BASE = process.env.EVIDENCE_URL ?? 'http://localhost:5173';
const OUT = process.env.EVIDENCE_OUT ?? '../../docs/04-construccion/evidencias';
const SECRET = process.env.TOTP_SECRET;
const COORD = {
  identifier: 'coordinacion.demo@bienestarpro.local',
  password: 'Demo1234*',
};
const INSTRUCTOR = {
  identifier: 'instructor.demo@bienestarpro.local',
  password: 'Instructor123*',
};

if (!SECRET) {
  throw new Error('Define TOTP_SECRET (secreto TOTP del usuario demo)');
}

function localDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const now = new Date();
const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
const meetingTitle = `Comité de bienestar ${hhmm}`;

async function login(user, withTotp) {
  await page.goto(BASE);
  await page.waitForSelector('#identifier');
  await page.fill('#identifier', user.identifier);
  await page.fill('#password', user.password);
  await page.click('button[type="submit"]');
  if (withTotp) {
    await page.waitForSelector('#totp-code');
    await page.fill('#totp-code', generateSync({ secret: SECRET }));
    await page.click('button[type="submit"]');
  }
  await page.waitForSelector('text=Hola,');
}

async function logout() {
  const volver = page.locator('button:has-text("Volver")');
  if ((await volver.count()) > 0) {
    await volver.first().click();
    await page.waitForSelector('text=Hola,');
  }
  await page.click('button:has-text("Cerrar sesión")');
  await page.waitForSelector('#identifier');
}

// 1) Coordinación agenda la reunión (persona + ficha) con recordatorio.
await login(COORD, true);
await page.click('button:has-text("Reuniones")');
await page.waitForSelector('h2:has-text("Agendar reunión")');

const start = new Date(Date.now() + 2 * 24 * 3600 * 1000);
start.setHours(10, 0, 0, 0);
const end = new Date(start.getTime() + 3600 * 1000);
const reminder = new Date(Date.now() + 24 * 3600 * 1000);
reminder.setHours(8, 0, 0, 0);

await page.fill('#meeting-title', meetingTitle);
await page.fill(
  '#meeting-description',
  'Revisión del calendario de actividades y logística de refrigerios.',
);
await page.fill('#meeting-starts', localDateTime(start));
await page.fill('#meeting-ends', localDateTime(end));
await page.fill('#meeting-reminder', localDateTime(reminder));
await page.fill('#meeting-location', 'Auditorio principal');
await page.getByLabel(/Instructor Demo/).check();
await page.getByLabel(/Ficha 2847012/).check();
await page.click('button:has-text("Agendar reunión")');
await page.waitForSelector('text=Reunión agendada');
await page.screenshot({
  path: `${OUT}/rebanada-8-gestion.png`,
  fullPage: true,
});

// 2) El instructor convocado confirma su asistencia (CU-31 / RF-37).
await logout();
await login(INSTRUCTOR, false);
await page.click('button:has-text("Reuniones")');
await page.waitForSelector(`text=${meetingTitle}`);
await page.screenshot({
  path: `${OUT}/rebanada-8-invitacion.png`,
  fullPage: true,
});
await page
  .locator('section.card', { hasText: meetingTitle })
  .getByRole('button', { name: 'Confirmar asistencia' })
  .click();
await page.waitForSelector('text=Asistencia confirmada');
await page.screenshot({
  path: `${OUT}/rebanada-8-confirmacion.png`,
  fullPage: true,
});

// 3) Coordinación revisa el estado, completa la reunión y registra el acta
//    con un compromiso que luego marca como cumplido (CU-33 / RF-39).
await logout();
await login(COORD, true);
await page.click('button:has-text("Reuniones")');
await page.waitForSelector(`text=${meetingTitle}`);
await page
  .locator('.admin__row', { hasText: meetingTitle })
  .getByRole('button', { name: 'Abrir' })
  .click();
await page.waitForSelector('text=Convocados (');
await page.screenshot({
  path: `${OUT}/rebanada-8-detalle.png`,
  fullPage: true,
});
await page.click('button:has-text("Marcar realizada")');
await page.waitForSelector('text=ya puedes registrar el acta');
await page.click('button:has-text("Registrar acta")');
await page.fill(
  '#minutes-topics',
  'Acuerdos: calendario de actividades del semestre y logística de refrigerios.',
);
await page.fill('#minutes-attendees', 'Instructor Demo, Coordinación Bienestar');
await page
  .getByLabel('Compromiso 1')
  .fill('Enviar el acta a los convocados');
await page.click('button:has-text("Guardar acta")');
await page.waitForSelector('text=Acta guardada');
await page.screenshot({
  path: `${OUT}/rebanada-8-acta.png`,
  fullPage: true,
});
const commitment = page.getByRole('checkbox', {
  name: 'Enviar el acta a los convocados',
});
await commitment.waitFor({ state: 'visible' });
// Click simple (no check(): el checkbox es controlado y se actualiza tras el
// PATCH asíncrono, lo que rompe la verificación de estado de check()).
await commitment.click();
await page.waitForSelector('text=Cumplido', { timeout: 20_000 });
await page.screenshot({
  path: `${OUT}/rebanada-8-acta-cumplida.png`,
  fullPage: true,
});

await browser.close();
console.log('Evidencia lista en', OUT);
