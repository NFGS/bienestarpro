/**
 * Evidencia de la rebanada 1 (M4): flujo real con segundo factor TOTP y
 * páginas de administración (usuarios y auditoría).
 * Requisitos: API en http://127.0.0.1:3001, web en http://localhost:5173 y
 * el usuario demo con TOTP ya enrolado (ver README del plan de construcción).
 * Uso (desde apps/web): TOTP_SECRET=<secreto> node scripts/evidence-rebanada1.mjs
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

// Paso de segundo factor (RF-05)
await page.waitForSelector('#totp-code');
await page.screenshot({
  path: `${OUT}/rebanada-1-totp-login.png`,
  fullPage: true,
});
await page.fill('#totp-code', generateSync({ secret: SECRET }));
await page.click('button[type="submit"]');
await page.waitForSelector('text=Hola,');
await page.screenshot({
  path: `${OUT}/rebanada-1-inicio.png`,
  fullPage: true,
});

// Administración de usuarios (RF-02)
await page.click('text=Usuarios');
await page.waitForSelector('text=Crear usuario');
await page.screenshot({
  path: `${OUT}/rebanada-1-usuarios.png`,
  fullPage: true,
});

// Auditoría (RF-04)
await page.click('text=Volver');
await page.waitForSelector('text=Hola,');
await page.click('text=Auditoría');
await page.waitForSelector('text=login.success');
await page.screenshot({
  path: `${OUT}/rebanada-1-auditoria.png`,
  fullPage: true,
});

await browser.close();
console.log('Evidencia lista en', OUT);
