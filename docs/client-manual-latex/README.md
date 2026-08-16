# Manual integral de entrega al cliente

Fuente LaTeX modular del manual operativo de SassBlum. El documento reúne producto, uso,
arquitectura/API, despliegue y recuperación, pruebas, seguridad, contribución y cambios sin mezclar
material de evaluación o planificación histórica.

## Compilación

El archivo raíz es `main.tex`. En Overleaf selecciona **XeLaTeX**; localmente puede compilarse con
Tectonic:

```bash
tectonic main.tex --keep-logs --keep-intermediates
```

El log debe terminar sin referencias indefinidas, `Overfull` ni `Underfull` boxes relevantes.

## Estructura

```text
main.tex
config/preamble.tex
config/project-data.tex
chapters/01-producto.tex
chapters/02-usuario.tex
chapters/03-arquitectura-api.tex
chapters/04-despliegue-backup.tex
chapters/05-pruebas.tex
chapters/06-seguridad.tex
chapters/07-contribucion.tex
chapters/08-cambios.tex
assets/sassblum-wordmark-v3.pdf
```

El activo PDF es una conversión mecánica del wordmark canónico
`frontend/public/branding/sassblum-wordmark-v3.svg`; no modifica el diseño ni crea una marca nueva.

## Mantenimiento

- Actualiza conteos de pruebas, fecha y versión únicamente después de una ejecución verificable.
- Mantén rutas y variables sincronizadas con el código y los `.env.example`.
- No agregues secretos, datos personales, capturas privadas ni credenciales demo.
- Regenera el PDF después de cambios y revisa visualmente todas las páginas.
