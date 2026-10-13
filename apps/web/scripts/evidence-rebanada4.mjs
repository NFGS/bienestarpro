/**
 * Evidencia de la rebanada 4 (M2): preferencias de notificación, plantillas
 * y acuses de la convocatoria de un evento.
 * Requisitos: API en http://127.0.0.1:3001 (con Redis para el relay), web en
 * http://localhost:5173 y el usuario demo con TOTP enrolado.
 * Uso (desde apps/web): TOTP_SECRET=<secreto> node scripts/evidence-rebanada4.mjs
 */
import { mkdirSync } from 'node:fs';
import { generateSync } from 'otplib';
import { chromium } from 'playwright';

const BASE = process.env.EVIDENCE_URL ?? 'http://localhost:5173';
const OUT = process.env.EVIDENCE_OUT ?? '../../docs/04-construccion/evidencias';
const SECRET = process.env.TOTP_SECRET;
const DEMO = {
  identifier: 'coordinacion.demo@bienestarpro.local',
  password: 'Demo1234*',
};

if (!SECRET) {
  throw new Error('Define TOTP_SECRET (secreto TOTP del usuario demo)');
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(BASE);
await page.waitForSelector('#identifier');
await page.fill('#identifier', DEMO.identifier);
await page.fill('#password', DEMO.password);
await page.click('button[type="submit"]');
await page.waitForSelector('#totp-code');
await page.fill('#totp-code', generateSync({ secret: SECRET }));
await page.click('button[type="submit"]');
await page.waitForSelector('text=Hola,');

const token = await page.evaluate(() => {
  const raw = sessionStorage.getItem('bienestarpro.session');
  return raw ? JSON.parse(raw).accessToken : null;
});

// Asegura correo en el aprendiz activo de la ficha de ejemplo (destinatario).
await page.evaluate(async (accessToken) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const groups = await (
    await fetch('http://localhost:3001/api/groups', { headers })
  ).json();
  const group = groups.find((item) => item.code === '2847012');
  if (!group) {
    return;
  }
  const learners = await (
    await fetch(`http://localhost:3001/api/learners?groupId=${group.id}`, {
      headers,
    })
  ).json();
  const active = learners.find((item) => item.status === 'activo');
  if (active && !active.email) {
    await fetch(`http://localhost:3001/api/learners/${active.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ email: 'aprendiz.demo@bienestarpro.local' }),
    });
  }
}, token);

// Preferencias de notificación (RF-24)
await page.click('button:has-text("Preferencias")');
await page.waitForSelector('h2:has-text("Canales de notificación")');
await page.fill('#quiet-start', '20:00');
await page.fill('#quiet-end', '06:00');
await page.click('button:has-text("Guardar preferencias")');
await page.waitForSelector('text=Preferencias guardadas');
await page.screenshot({
  path: `${OUT}/rebanada-4-preferencias.png`,
  fullPage: true,
});

// Plantillas versionadas (RF-23)
await page.click('button:has-text("Volver")');
await page.waitForSelector('text=Hola,');
await page.click('button:has-text("Plantillas")');
await page.waitForSelector('h2:has-text("Crear plantilla")');
await page.selectOption('#tpl-type', 'evento_convocatoria');
await page.fill(
  '#tpl-content',
  'Hola {{name}}: hay refrigerio el {{date}} (jornada {{journey}}). Confirma aquí: {{confirmUrl}}',
);
await page.click('button:has-text("Crear plantilla")');
await page.waitForSelector('text=Plantilla creada');
await page.screenshot({
  path: `${OUT}/rebanada-4-plantillas.png`,
  fullPage: true,
});

// Acuses de la convocatoria (RF-26): publicar y ver el envío por correo
await page.click('button:has-text("Volver")');
await page.waitForSelector('text=Hola,');
await page.click('button:has-text("Refrigerios")');
await page.waitForSelector('h2:has-text("Crear evento")');
await page.fill('#event-date', '2026-12-01');
await page.selectOption('#event-journey', 'manana');
await page.click('button:has-text("Crear evento")');
await page.waitForSelector('strong:has-text("2026-12-01 · manana")');
await page.locator('button:has-text("Publicar")').first().click();
await page.waitForSelector('text=Evento publicado');
await page.locator('button:has-text("Abrir")').first().click();
await page.waitForSelector('h2:has-text("Notificaciones (acuses)")');

for (let attempt = 0; attempt < 8; attempt++) {
  await page.waitForTimeout(3000);
  await page.click('button:has-text("Actualizar")');
  const sent = await page.locator('.chip:has-text("enviado")').count();
  if (sent > 0) {
    break;
  }
}
await page.screenshot({
  path: `${OUT}/rebanada-4-acuses.png`,
  fullPage: true,
});

await browser.close();
console.log('Evidencia lista en', OUT);
