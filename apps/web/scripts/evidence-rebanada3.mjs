/**
 * Evidencia de la rebanada 3 (M1): eventos de refrigerio de punta a punta —
 * creación, publicación, detalle con cupos y entrega manual.
 * Requisitos: API en http://127.0.0.1:3001, web en http://localhost:5173 y el
 * usuario demo con TOTP enrolado.
 * Uso (desde apps/web): TOTP_SECRET=<secreto> node scripts/evidence-rebanada3.mjs
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

// Crear y publicar el evento (RF-12/13/14)
await page.click('button:has-text("Refrigerios")');
await page.waitForSelector('h2:has-text("Crear evento")');
await page.fill('#event-date', '2026-11-10');
await page.selectOption('#event-journey', 'manana');
await page.click('button:has-text("Crear evento")');
await page.waitForSelector('strong:has-text("2026-11-10 · manana")');
await page
  .locator('button:has-text("Publicar")')
  .first()
  .click();
await page.waitForSelector('text=Evento publicado');
await page.screenshot({
  path: `${OUT}/rebanada-3-eventos.png`,
  fullPage: true,
});

// Detalle con cupos (RF-13/16)
await page
  .locator('button:has-text("Abrir")')
  .first()
  .click();
await page.waitForSelector('h2:has-text("Cupos por ficha")');
await page.screenshot({
  path: `${OUT}/rebanada-3-evento-detalle.png`,
  fullPage: true,
});

// Pantalla de entrega (RF-17/18)
await page.click('button:has-text("Abrir entrega")');
await page.waitForSelector('h2:has-text("Escanear código")');
await page.screenshot({
  path: `${OUT}/rebanada-3-entrega.png`,
  fullPage: true,
});

// Entrega manual con un aprendiz de ejemplo del directorio
const token = await page.evaluate(() => {
  const raw = sessionStorage.getItem('bienestarpro.session');
  return raw ? JSON.parse(raw).accessToken : null;
});
const learnerDocument = await page.evaluate(async (accessToken) => {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const groupsRes = await fetch('http://localhost:3001/api/groups', { headers });
  const groups = await groupsRes.json();
  const group = groups.find((item) => item.code === '2847012');
  if (!group) {
    return null;
  }
  const learnersRes = await fetch(
    `http://localhost:3001/api/learners?groupId=${group.id}`,
    { headers },
  );
  const learners = await learnersRes.json();
  const active = learners.find((item) => item.status === 'activo');
  return active ? active.document : null;
}, token);

if (!learnerDocument) {
  throw new Error('No se encontró un aprendiz activo en la ficha 2847012');
}

await page.fill('#manual-document', learnerDocument);
await page.click('button:has-text("Buscar")');
await page.waitForSelector('button:has-text("Registrar entrega manual")');
await page.fill('#manual-reason', 'Evidencia: entrega de ejemplo verificada');
await page.click('button:has-text("Registrar entrega manual")');
await page.waitForSelector('text=Entrega manual registrada');
await page.screenshot({
  path: `${OUT}/rebanada-3-entrega-exito.png`,
  fullPage: true,
});

await browser.close();
console.log('Evidencia lista en', OUT);
