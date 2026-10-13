/**
 * Superficie pública compartida del monorepo BienestarPro.
 *
 * Regla del proyecto (AGENTS.md): no romper la API pública sin actualizar
 * este paquete. El sidecar Python mantiene el mismo contrato de salud de
 * forma manual (apps/ai/app/main.py) hasta la Fase 5.
 */

/** Prefijo global de la API core (NestJS). */
export const API_PREFIX = '/api';

/** Contrato de salud, idéntico en la API core y en el sidecar de IA. */
export interface HealthResponse {
  status: 'ok';
  service: 'api' | 'ai';
  version: string;
  /** Fecha y hora en formato ISO 8601 (UTC). */
  timestamp: string;
}
