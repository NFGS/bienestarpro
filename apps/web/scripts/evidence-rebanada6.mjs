/**
 * Evidencia de la rebanada 6 (M6): noticias y campañas — creación segmentada,
 * publicación con difusión al segmento y analítica agregada.
 * Requisitos: API en http://127.0.0.1:3001, web en http://localhost:5173 y el
 * usuario demo con TOTP enrolado.
 * Uso (desde apps/web): TOTP_SECRET=<secreto> node scripts/evidence-rebanada6.mjs
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

await page.click('button:has-text("Noticias")');
await page.waitForSelector('h2:has-text("Crear publicación")');

await page.fill('#pub-title', 'Jornada de salud para aprendices');
await page.fill(
  '#pub-content',
  'La jornada de salud se realizará el viernes en el auditorio principal. Trae tu carné.',
);
await page.selectOption('#pub-segment-type', 'ficha');
await page.selectOption('#pub-segment-value', { label: 'Ficha 2847012' });
await page.click('button:has-text("Crear publicación")');
await page.waitForSelector('text=Publicación creada');

await page.locator('button:has-text("Publicar")').first().click();
await page.waitForSelector('text=Publicada:');

await page.locator('button:has-text("Marcar lectura")').first().click();
await page.locator('button:has-text("Marcar lectura")').first().click();
await page.waitForSelector('text=Lecturas 2');

await page.screenshot({
  path: `${OUT}/rebanada-6-noticias.png`,
  fullPage: true,
});

await browser.close();
console.log('Evidencia lista en', OUT);
