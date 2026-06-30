Cómo usar la skill de auditoría en tu proyecto

El flujo es así:

Paso 1 — Recopilar el código

bash
bash .openclaw/tmp/code-review/scripts/collect_code.sh /home/work/.openclaw/workspace/SassBlumRedise-oWeb
bash .openclaw/tmp/code-review/scripts/collect_code.sh /home/work/.openclaw/workspace/SassBlumRedise-oWeb
Esto genera 4 archivos en SassBlumRedise-oWeb/.openclaw/tmp/code-review/:

STATS.md — Estadísticas y stack
CONFIG.md — Configuración y dependencias
BACKEND.md — Todo el código backend
FRONTEND.md — Todo el código frontend

Paso 2 — Yo leo esos archivos y evalúo contra 7 estándares (ISO 25010, OWASP, WCAG, SOLID, REST, 12-Factor, CWE/SANS)

Paso 3 — Genero el reporte en REPORTE_AUDITORIA.md con puntuación, brechas, código corregido y plan de mejora.

Para ver los resultados en VSCode

Los reportes ya están en tu proyecto como archivos Markdown:

REPORTE_AUDITORIA.md
REPORTE_AUDITORIA_TOTAL.md

En VSCode solo abre cualquiera de estos archivos y presiona Ctrl+Shift+V para ver el reporte formateado con tablas y colores.

¿Quieres que ejecute una nueva auditoría ahora?

Puedo correr el análisis completo del proyecto SassBlum con la skill y generar un reporte actualizado. Solo dime:

1.¿Auditoría completa (los 7 estándares, ~700 puntos)?
2.¿Algo específico (solo seguridad, solo frontend, solo accesibilidad)?

También si quieres que el reporte se genere en un archivo específico para que lo abras directo en VSCode, me dices.
