# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Un solo usuario: el dueño, estudiante de informática. Estudia sus materias del semestre en iPhone (PWA instalada) y en una laptop Lenovo, en ratos cortos de unos 5 minutos.

## Product Purpose
Ovo convierte los PDFs de los profesores y los apuntes propios en lecciones cortas e interactivas al estilo Duolingo, con exámenes por unidad que hay que aprobar para avanzar. El objetivo es comprender, no memorizar: cada ejercicio obliga a aplicar, comparar o razonar. El éxito es volver todos los días (racha) y aprobar el examen de cada unidad.

## Positioning
Todo el contenido sale del material real de sus clases y cita el PDF y la página de origen; lo que se puede calificar con código se califica con código para nunca dar por buena una respuesta incorrecta.

## Operating Context
El contenido lo genera Claude Code con la skill `generar-unidad` a partir de `material/<Materia>/<N>/` y se importa con `npm run importar`. Supabase (Postgres + Auth) y Vercel. Acceso solo con el correo dueño.

## Capabilities and Constraints
- Materia → Unidad → Subsección → Lección (estudio y práctica) → Ejercicio. Examen de unidad pendiente (fase 3).
- Racha diaria, panel de estadísticas, repaso por concepto.
- Presupuesto muy ajustado (meta ~$2 USD/mes); preferir siempre lo más barato.
- No-metas: ejercicios de programación, porcentaje de PDF cubierto (rechazado explícitamente), varios usuarios, funciones sociales, app nativa.
- Especificación completa: `docs/superpowers/specs/2026-11-03-ovo-design.md`.

## Brand Commitments
Nombre "ovo", siempre en minúsculas. Mascota: una foca gris azulada (src/components/Foca.tsx); el ícono de la app la muestra asomándose desde abajo sobre fondo lila (scripts/iconos.tsx). Interfaz en español.

## Evidence on Hand
Materias reales del semestre y sus PDFs en `material/`. No hay usuarios externos, testimonios ni métricas públicas; no inventarlos.

## Product Principles
- Comprender antes que recordar.
- Constancia diaria sin culpa: la racha invita, no castiga.
- Nunca enseñar algo falso; citar la fuente.
- Lo más barato que funcione.
