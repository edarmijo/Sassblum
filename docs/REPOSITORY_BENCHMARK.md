# Referentes y método de profesionalización del repositorio

Fecha de observación: **15 de agosto de 2026**.

## Método reproducible

No existe un premio universal que determine el “mejor repositorio”. La comparación de SassBlum usa
una rúbrica de artefactos observables y evita convertir popularidad en calidad. Cualquier persona
puede repetirla sobre la rama por defecto de cada referente:

1. abrir el repositorio y registrar URL, rama y fecha;
2. comprobar si existen README, licencia, seguridad, contribución, ownership y soporte;
3. ejecutar o inspeccionar el inicio rápido sin completar información ausente;
4. seguir la navegación hacia arquitectura, API, pruebas, despliegue y cambios;
5. revisar CI, lockfiles, releases y controles de cadena de suministro;
6. puntuar cada dimensión de 0 a 2: ausente, parcial o verificable;
7. conservar enlaces directos y justificar cada puntuación con un artefacto, no con estrellas.

| Dimensión | Evidencia mínima para 2 puntos |
|---|---|
| Orientación | propósito, audiencia, capacidades, requisitos e inicio rápido coherentes |
| Navegación | índice por audiencia y una fuente canónica por tema |
| Operación | variables, despliegue, migración, health, backup, restauración y rollback |
| Calidad | comandos reproducibles, CI bloqueante, alcance y limitaciones declaradas |
| Gobierno | contribución, ownership, cambios, releases y soporte |
| Seguridad | reporte privado, secretos fuera de Git y controles automatizados verificables |

La puntuación no certifica seguridad ni corrección. Sirve para detectar brechas editoriales y de
mantenimiento en un momento concreto.

## Referentes oficiales

| Referente | Evidencia observable | Patrón adoptado en SassBlum |
|---|---|---|
| [React](https://github.com/react/react) | README breve que deriva a documentación, guía de contribución, licencia, seguridad y soporte | README como portal, no como manual monolítico |
| [Kubernetes](https://github.com/kubernetes/kubernetes) | separación explícita de uso, desarrollo, soporte, gobierno, roadmap y ownership | documentos diferenciados por responsabilidad y audiencia |
| [Django](https://github.com/django/django) | documentación y proceso de contribución mantenidos junto al framework | comandos verificables y documentación tratada como código |
| [FastAPI](https://github.com/fastapi/fastapi) | navegación clara entre tutorial, referencia, despliegue y contribución | explicación progresiva: producto, tareas, referencia y operación |
| [OpenSSF Scorecard](https://github.com/ossf/scorecard) | controles automatizables de salud de seguridad y cadena de suministro | backlog explícito para escaneo, protección de ramas y dependencias |

Las estrellas y forks no forman parte de la puntuación: pueden cambiar diariamente y no demuestran
que un patrón sea apropiado para un repositorio de entrega privada.

## Resultado aplicado a SassBlum

- README convertido en portal de producto con inicio rápido y límites explícitos.
- Centro documental separado por usuario, desarrollo, operación, calidad y seguridad.
- Manual de entrega versionado en LaTeX y derivado únicamente de fuentes canónicas del repositorio.
- Política de seguridad, contribución, CODEOWNERS, plantillas y changelog incorporados.
- Exportaciones documentadas solo como PDF y Excel; no se afirma RLS general de Supabase.
- Demo protegida para impedir su ejecución accidental en producción.
- Migraciones separadas del arranque normal del contenedor.

## Brechas que requieren decisión o evidencia externa

1. formalizar licencia, cesión y soporte con SassBlum y las partes correspondientes;
2. publicar el commit final, obtener CI verde y crear un tag/release inmutable;
3. transferir ownership y segundo administrador de los servicios externos;
4. probar restauración de backup y registrar RTO/RPO observados;
5. convertir la cobertura ya reproducible en tendencia/umbral acordado e incorporar escaneo
   automatizado de secretos, dependencias e imágenes;
6. publicar un contrato OpenAPI cuando se acuerde mantenerlo como fuente verificable.
