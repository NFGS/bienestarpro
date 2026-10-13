# Revisión de las Muestras de Diseño — Insumo para el Design System

**Estado:** Borrador v0.1 — Fase 3 (UX).

**Fecha:** 2026-10-09

**Objeto:** revisar `assets/muestra-diseno-01.webp` y `assets/muestra-diseno-02.webp` contra las necesidades de BienestarPro, antes de definir el design system.

---

## 1. Qué son las muestras

Las dos imágenes corresponden a un **proyecto de portafolio de diseño web de terceros**: una plataforma ficticia de streaming ("HD Stream") con películas y series. La muestra 2 incluye la presentación completa: secciones "About Us" y "Our Vision", **style guide** (tipografía, colores), mockups de escritorio/tablet/TV y una página de cierre con datos de contacto del diseñador de origen.

**No son diseños de BienestarPro ni piezas encargadas para el proyecto.** Se conservan como referencia visual externa (moodboard).

## 2. Ficha de estilo de las muestras

| Aspecto | Valor en la muestra |
|---|---|
| Tipografía | Poppins (títulos), Lato (cuerpo) |
| Paleta | Azul brillante, rosa/rojo, negro, blanco |
| Tema | Oscuro, cinematográfico |
| Patrones | Hero con llamado a la acción, grillas de tarjetas, badges de calificación, carruseles por categoría, navegación con búsqueda |
| Formato | Mockups de escritorio, tablet y TV |

## 3. Qué es transferible a BienestarPro

1. **Grilla de tarjetas** para contenido tipo catálogo: eventos de refrigerio, servicios, noticias.
2. **Chips/badges de estado** (convocado, confirmado, entregado) — implementados con contraste AA, no como decoración.
3. **Navegación simple con búsqueda visible** en la parte superior (escritorio) e inferior (móvil).
4. **Hero sobrio** para avisos importantes (noticias y campañas segmentadas).
5. **Espaciado consistente y radios suaves** que dan orden sin ruido.

## 4. Qué NO es transferible (y por qué)

| Elemento de la muestra | Por qué no va en BienestarPro | Requisito afectado |
|---|---|---|
| Tema oscuro cinematográfico con texto gris | Contraste y legibilidad pobres en aulas y patios con luz; riesgo para usuarios de baja alfabetización digital | RNF-01, RNF-04 |
| Densidad alta (catálogos con letra pequeña) | Nuestros usuarios necesitan pocas acciones, grandes y claras: confirmar, mostrar QR, entregar | RNF-01 |
| Estética de entretenimiento ("hype") | Operamos un servicio institucional: tono claro, sobrio y de confianza SENA | Contexto institucional |
| Microcopy en inglés de marketing | La interfaz es en español claro, sin anglicismos | Convención del proyecto |

## 5. Veredicto

- **Conservar** como moodboard de patrones (tarjetas, badges, navegación), con la sección 3 como guía.
- **No adoptar** su dirección de arte ni su paleta como base.
- El design system de BienestarPro (`02-design-system.md`) parte de sus propias restricciones: accesibilidad WCAG AA, baja alfabetización digital, operación offline y tono institucional.

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-10-09 | Revisión inicial de las dos muestras |
