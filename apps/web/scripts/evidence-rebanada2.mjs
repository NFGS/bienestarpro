/**
 * Evidencia de la rebanada 2 (M9): directorio de fichas con detalle de
 * aprendices, consentimientos e instructores.
 * Requisitos: API en http://127.0.0.1:3001, web en http://localhost:5173 y el
 * usuario demo con TOTP enrolado.
 * Uso (desde apps/web): TOTP_SECRET=<secreto> node scripts/evidence-rebanada2.mjs
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

// Programa de ejemplo (si el centro aún no tiene): vía API con el token de la sesión.
const token = await page.evaluate(() => {
  const raw = sessionStorage.getItem('bienestarpro.session');
  return raw ? JSON.parse(raw).accessToken : null;
});
await page.evaluate(async (accessToken) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
  const res = await fetch('http://localhost:3001/api/programs', { headers });
  const programs = await res.json();
  if (Array.isArray(programs) && programs.length === 0) {
    await fetch('http://localhost:3001/api/programs', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Análisis y Desarrollo de Software' }),
    });
  }
}, token);

// Directorio de fichas (RF-06, RF-07, RF-10)
await page.click('button:has-text("Fichas")');
await page.waitForSelector('h2:has-text("Crear ficha")');

await page.selectOption('#group-program', { index: 1 });
await page.fill('#group-code', '2847012');
await page.selectOption('#group-journey', 'manana');
await page.click('button:has-text("Crear ficha")');
await page.waitForSelector('strong:has-text("Ficha 2847012")');
await page.screenshot({
  path: `${OUT}/rebanada-2-fichas.png`,
  fullPage: true,
});

// Detalle de la ficha (RF-08, RF-09, RF-11)
await page.click('button:has-text("Abrir")');
await page.waitForSelector('h2:has-text("Datos de la ficha")');
await page.screenshot({
  path: `${OUT}/rebanada-2-ficha-detalle.png`,
  fullPage: true,
});

// Registrar aprendiz y su consentimiento
const document = String(Date.now()).slice(-10);
await page.fill('#learner-document', document);
await page.fill('#learner-name', 'Aprendiz de Ejemplo');
await page.click('button:has-text("Registrar aprendiz")');
await page.waitForSelector('text=Aprendiz de Ejemplo');
await page
  .locator('button:has-text("Registrar consentimiento")')
  .last()
  .click();
await page.waitForSelector('text=Consentimiento vigente');
await page.screenshot({
  path: `${OUT}/rebanada-2-detalle-con-aprendiz.png`,
  fullPage: true,
});

await browser.close();
console.log('Evidencia lista en', OUT);
