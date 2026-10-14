/**
 * Evidencia de la rebanada 7 (M7): encuestas — creación anónima segmentada,
 * publicación con invitación al segmento, respuesta del aprendiz y resultados
 * agregados con exportación CSV.
 * Requisitos: API en http://127.0.0.1:3001, web en http://localhost:5173 y el
 * usuario demo con TOTP enrolado.
 * Uso (desde apps/web): TOTP_SECRET=<secreto> node scripts/evidence-rebanada7.mjs
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
const APRENDIZ = {
  identifier: 'aprendiz.demo@bienestarpro.local',
  password: 'Aprendiz123*',
};

if (!SECRET) {
  throw new Error('Define TOTP_SECRET (secreto TOTP del usuario demo)');
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

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
  // Las páginas internas tienen "Volver"; el Home tiene "Cerrar sesión".
  const volver = page.locator('button:has-text("Volver")');
  if ((await volver.count()) > 0) {
    await volver.first().click();
    await page.waitForSelector('text=Hola,');
  }
  await page.click('button:has-text("Cerrar sesión")');
  await page.waitForSelector('#identifier');
}

// 1) Coordinación: crea la encuesta anónima segmentada a la ficha 2847012.
await login(COORD, true);
await page.click('button:has-text("Encuestas")');
await page.waitForSelector('h2:has-text("Crear encuesta")');

await page.fill('#survey-title', 'Pulso de bienestar del mes');
await page.fill(
  '#survey-description',
  'Cuéntanos cómo te sentiste en las actividades de bienestar.',
);
await page.getByLabel('Encuesta anónima').check();
await page.fill('#survey-min', '3');
await page.selectOption('#survey-segment-type', 'ficha');
await page.selectOption('#survey-segment-value', { label: 'Ficha 2847012' });
await page.fill('#survey-q-0', '¿Participaste en la actividad de bienestar?');
await page.getByLabel('Opción 1 de la pregunta 1').fill('Sí');
await page.getByLabel('Opción 2 de la pregunta 1').fill('No');
await page.click('button:has-text("+ Agregar pregunta")');
await page.fill('#survey-q-1', 'Califica la actividad (1 a 5)');
await page.selectOption('#survey-q-1-type', 'escala');
await page.click('button:has-text("Crear encuesta")');
await page.waitForSelector('text=Encuesta creada');

// 2) Publica y difunde la invitación al segmento por el hub.
await page.locator('button:has-text("Publicar")').first().click();
await page.waitForSelector('text=Publicada:');
await page.screenshot({
  path: `${OUT}/rebanada-7-gestion.png`,
  fullPage: true,
});

// 3) Aprendiz: ve la encuesta de su ficha y responde en anonimato (3 veces;
//    el anonimato impide deduplicar, así se supera el umbral de 3).
await logout();
await login(APRENDIZ, false);
await page.click('button:has-text("Encuestas")');
await page.waitForSelector('text=Pulso de bienestar del mes');
await page.screenshot({
  path: `${OUT}/rebanada-7-responder.png`,
  fullPage: true,
});
await page.getByRole('radio', { name: 'Sí' }).check();
await page.getByRole('radio', { name: '4' }).check();
await page.click('button:has-text("Enviar respuestas")');
await page.waitForSelector('text=Respuestas enviadas');
await page.screenshot({
  path: `${OUT}/rebanada-7-envio.png`,
  fullPage: true,
});
for (let intento = 0; intento < 2; intento += 1) {
  await page.waitForTimeout(700);
  await page.click('button:has-text("Enviar respuestas")');
  await page.waitForTimeout(700);
}

// 4) Coordinación: resultados agregados (ficha visible: 3 >= umbral) + CSV.
await logout();
await login(COORD, true);
await page.click('button:has-text("Encuestas")');
await page.waitForSelector('h2:has-text("Encuestas (")');
await page.locator('button:has-text("Resultados")').first().click();
await page.waitForSelector('text=Total: 3 respuestas');
await page.screenshot({
  path: `${OUT}/rebanada-7-resultados.png`,
  fullPage: true,
});

const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('button:has-text("Exportar CSV")'),
]);
await download.saveAs(`${OUT}/rebanada-7-resultados.csv`);

await browser.close();
console.log('Evidencia lista en', OUT);
