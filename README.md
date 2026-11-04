# Ovo

App de estudio personal (un solo usuario) hecha con Next.js, Supabase y Drizzle. Se instala en el iPhone como PWA.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY y OVO_EMAIL
npm run db:migrate           # base de datos nueva: crea todo el esquema, con RLS (ver "Base de datos")
npm run db:seed              # OJO: BORRA los datos existentes y vuelve a sembrar (se niega si hay intentos; ver "Base de datos")
npm run dev
npm test
```

## Acceso (un solo usuario)

1. En Supabase (Authentication), desactiva "Allow new users to sign up" y crea el único usuario (correo y contraseña).
2. Pon `OVO_EMAIL` con el correo de ese usuario, en `.env.local` y en las variables de entorno de Vercel. Es solo de servidor (sin `NEXT_PUBLIC_`).

La app rechaza cualquier sesión cuyo correo no sea `OVO_EMAIL` (y todas, si la variable no está definida), aunque el registro se active por error.

## Base de datos

- Base de datos nueva y vacía: `npm run db:migrate` (la migración `0000` crea todo el esquema con RLS). No uses `db:push`: no aplica RLS ni registra las migraciones.
- La base real ya tiene aplicada `0000` (`drizzle/0000_baseline.sql`) y quedó marcada en `drizzle.__drizzle_migrations` con `npm run db:marcar-baseline` (idempotente; solo hace falta en una base que ya tenga ese esquema sin registro).
- Cambios de esquema: edita `src/db/schema.ts`, ejecuta `npm run db:generate` (crea `0001`, `0002`...), revisa el SQL y luego `npm run db:migrate`. Nunca uses `db:push`.
- `npm run db:seed` borra todo y vuelve a sembrar, así que se niega a correr si ya hay intentos o lecciones completadas. Para forzarlo (pierdes tu progreso): `npm run db:seed -- --force`.

## Generar contenido

El contenido lo genera Claude Code a partir de tu material (sin API de IA). La pantalla Material de la app repite estos pasos.

1. Guarda los PDFs e imágenes de la unidad en `material/<Materia>/<número de unidad>/` (el nombre de la materia, exacto como en la app). `material/` y `contenido/` no se suben a GitHub.
2. En Claude Code escribe `/generar-unidad <Materia> <número>`. La skill (`.claude/skills/generar-unidad/SKILL.md`) lee todo el material, escribe `contenido/<materia>-u<N>-<fecha>.json` y lo valida con `--dry-run`. Te muestra el resumen y los avisos antes de importar.
3. Importa: `npm run importar -- contenido/<archivo>.json` (opciones: `--dry-run` para solo validar, `--material <dir>` para otra carpeta de material). Las lecciones nuevas se agregan al final de la unidad.

**Ejercicios reportados** ("Esto está mal"): `npm run reportados` lista los que no tienen reemplazo. Pídele a Claude Code `/generar-unidad` en modo reemplazo y generará un paquete con `{ "lessonId": ... }` para cada lección, que se importa igual.

## Despliegue

Sube el repositorio (privado) a GitHub, impórtalo en Vercel y carga las 4 variables de entorno de `.env.example`.

## Instalar en el iPhone

Abre la URL en Safari, toca Compartir y elige "Agregar a pantalla de inicio". Se abre a pantalla completa. No hay modo sin conexión.

Los íconos se generan desde `public/icons/ovo.svg` (192, 512 y `apple-touch-icon.png` de 180 px).
