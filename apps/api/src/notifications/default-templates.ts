/**
 * Plantillas por defecto del sistema (vigentes cuando el centro no ha
 * configurado una propia). Variables: {{name}}, {{date}}, {{journey}},
 * {{confirmUrl}}.
 */
export const DEFAULT_TEMPLATES: Record<string, string> = {
  evento_convocatoria:
    'Hola {{name}}. Se programó un refrigerio para el {{date}} (jornada {{journey}}). Confirma tu asistencia aquí: {{confirmUrl}}',
  evento_recordatorio:
    '{{name}}, recuerda confirmar tu refrigerio del {{date}} (jornada {{journey}}): {{confirmUrl}}',
  reunion_aviso: 'Hola {{name}}. Tienes una reunión programada: {{detail}}',
  generico: 'Hola {{name}}. {{detail}}',
};

export const DEFAULT_SUBJECTS: Record<string, string> = {
  evento_convocatoria: 'Convocatoria de refrigerio — BienestarPro',
  evento_recordatorio: 'Recordatorio de refrigerio — BienestarPro',
  reunion_aviso: 'Aviso de reunión — BienestarPro',
  generico: 'Aviso — BienestarPro',
};

export function renderContent(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}
