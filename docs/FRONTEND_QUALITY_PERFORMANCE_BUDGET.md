# Presupuesto de calidad visual y rendimiento

## Objetivo

Mantener la identidad oscura, cian y futurista de SassBlum sin sacrificar legibilidad, estabilidad ni respuesta en móvil. Las imágenes se sirven según el espacio que ocupan; los efectos decorativos nunca deben competir con la interfaz crítica.

## Presupuestos aplicados

- WebGL: máximo 4 megapíxeles de framebuffer, 30 FPS decorativos y pausa cuando la pestaña no está visible.
- Móvil: fallback visual CSS en lugar de WebGL, máximo dos capas decorativas activas y controles táctiles de al menos 44 px.
- Blur: 8–10 px en superficies pequeñas; las tarjetas grandes usan fondo navy opaco para evitar recomposición continua.
- Texto: contraste normal mínimo 4.5:1; el color secundario de interfaz es `#7aa3b8`.
- Imágenes: WebP q82 para fotografía, WebP lossless para logos y ninguna ampliación artificial por encima del original.
- Movimiento: se respeta `prefers-reduced-motion`; los efectos interactivos requieren puntero fino.

## Pipeline responsive

| Grupo | Variantes | Criterio |
|---|---|---|
| Portadas de servicios | 320, 640, 960, 1280 | 1280 solo beneficia al modal grande |
| Galerías de servicios | 320, 640, 960 o ancho original | No necesitan resoluciones mayores en su layout actual |
| Proyectos | 320, 640 o ancho original | Nunca se amplía una fuente pequeña |
| Logos panorámicos | 160, 320, 640 lossless | 640 se usa en el inventario administrativo |
| Imagen de Nosotros | 320, 640, 960, 1280, 1600 | Fuente de 1600 para tablet y escritorio Retina |

El conjunto generado contiene 149 archivos: 108 de servicios, 17 de proyectos, 19 de clientes y 5 públicos. El catálogo ya no descarga las imágenes originales multi-megapíxel para mostrarlas como miniaturas.

## Validación

- Viewports comprobados: 375×812, 768×667/1024 y 1440×900.
- Sin scroll horizontal de contenido en las rutas públicas verificadas.
- El menú cambia a navegación completa de escritorio desde 1024 px; en móvil/tablet tiene scroll y respeta safe areas.
- La galería muestra título y categoría sin depender de hover en pantallas pequeñas o táctiles.
- Three.js permanece en login y páginas públicas de escritorio, pero se carga después del contenido crítico y usa densidad adaptativa.
- Build de producción correcto; TypeScript y ESLint sin errores; 74 pruebas frontend aprobadas.

## Límites de las fuentes actuales

No se debe interpolar contenido inexistente. El proyecto 11 (390 px), SCD (206 px), Velázquez (238 px), Acería (155 px) y la portada Router (673 px) solo pueden mejorar al reemplazar sus archivos por originales de mayor resolución o SVG. El pipeline conserva su tamaño intrínseco para evitar peso y falsa nitidez.
