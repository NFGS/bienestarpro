/**
 * Evidencia de la rebanada 1 (M4): captura el login y el inicio con la API real.
 * Requisitos: API en http://127.0.0.1:3001 y web en http://localhost:5173.
 * Uso (desde apps/web): node scripts/evidence-login.mjs
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.EVIDENCE_URL ?? 'http://localhost:5173';
const OUT = process.env.EVIDENCE_OUT ?? '../../docs/04-construccion/evidencias';
const DEMO = {
  identifier: 'coordinacion.demo@bienestarpro.local',
  password: 'Demo1234*',
};

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(BASE);
await page.waitForSelector('#identifier');
await page.screenshot({ path: `${OUT}/rebanada-1-login.png`, fullPage: true });

await page.fill('#identifier', DEMO.identifier);
await page.fill('#password', DEMO.password);
await page.click('button[type="submit"]');
await page.waitForSelector('text=Hola,');
await page.screenshot({ path: `${OUT}/rebanada-1-inicio.png`, fullPage: true });

await browser.close();
console.log('Evidencia lista en', OUT);
