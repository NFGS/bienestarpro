import { generateSecret, generateSync, generateURI, verifySync } from 'otplib';

/**
 * Fachada delgada sobre otplib v13 (API funcional).
 * Aísla al resto del código de los cambios de API de la librería y centraliza
 * la política del proyecto (emisor, ventana de tolerancia).
 */
const ISSUER = 'BienestarPro';

/** Tolerancia de ±30 s (un paso) para desfases de reloj. */
const EPOCH_TOLERANCE_SECONDS = 30;

export function createOtpSecret(): string {
  return generateSecret();
}

export function otpauthUrl(label: string, secret: string): string {
  return generateURI({
    strategy: 'totp',
    issuer: ISSUER,
    label,
    secret,
  });
}

/** Código actual para un secreto (uso en pruebas y utilidades). */
export function generateOtpCode(secret: string): string {
  return generateSync({ secret });
}

export function verifyOtpCode(token: string, secret: string): boolean {
  const result = verifySync({
    token,
    secret,
    epochTolerance: EPOCH_TOLERANCE_SECONDS,
  });
  return result.valid;
}
