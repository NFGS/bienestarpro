/**
 * Evidencia de la rebanada 5 (M10): contactos de emergencia — registro con
 * consentimiento vigente desde el detalle de la ficha (lecturas auditadas).
 * Requisitos: API en http://127.0.0.1:3001, web en http://localhost:5173 y el
 * usuario demo con TOTP enrolado y la ficha 2847012 con consentimiento vigente.
 * Uso (desde apps/web): TOTP_SECRET=<secreto> node scripts/evidence-rebanada5.mjs
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

await page.click('button:has-text("Fichas")');
await page.waitForSelector('text=Ficha 2847012');
await page.locator('button:has-text("Abrir")').first().click();
await page.waitForSelector('h2:has-text("Aprendices")');

await page.click('button:has-text("Contactos de emergencia")');
await page.waitForSelector('label:has-text("Nombre del contacto")');
await page.screenshot({
  path: `${OUT}/rebanada-5-contactos-inicial.png`,
  fullPage: true,
});

await page.locator('input[id^="contact-name-"]').fill('Contacto de Ejemplo');
await page.locator('input[id^="contact-rel-"]').fill('Madre');
await page.locator('input[id^="contact-phone-"]').fill('+57 300 123 4567');
await page.click('button:has-text("Agregar contacto")');
await page.waitForSelector('text=Contacto de Ejemplo');
await page.screenshot({
  path: `${OUT}/rebanada-5-contactos.png`,
  fullPage: true,
});

await browser.close();
console.log('Evidencia lista en', OUT);
