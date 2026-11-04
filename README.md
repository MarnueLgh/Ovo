# Ovo

App de estudio personal (un solo usuario) hecha con Next.js, Supabase y Drizzle. Se instala en el iPhone como PWA.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY y OVO_EMAIL
npm run db:push              # SOLO en una base de datos nueva y vacía (ver "Base de datos")
npm run db:seed              # OJO: BORRA los datos existentes y vuelve a sembrar (se niega si hay intentos; ver "Base de datos")
npm run dev
npm test
```

## Acceso (un solo usuario)

1. En Supabase (Authentication), desactiva "Allow new users to sign up" y crea el único usuario (correo y contraseña).
2. Pon `OVO_EMAIL` con el correo de ese usuario, en `.env.local` y en las variables de entorno de Vercel. Es solo de servidor (sin `NEXT_PUBLIC_`).

La app rechaza cualquier sesión cuyo correo no sea `OVO_EMAIL` (y todas, si la variable no está definida), aunque el registro se active por error.

## Base de datos

- `npm run db:push` solo para una base de datos nueva y vacía.
- La base real ya tiene aplicada `0000` (`drizzle/0000_baseline.sql`) y quedó marcada en `drizzle.__drizzle_migrations` con `npm run db:marcar-baseline` (idempotente; solo hace falta en una base que ya tenga ese esquema sin registro).
- Cambios de esquema: edita `src/db/schema.ts`, ejecuta `npm run db:generate` (crea `0001`, `0002`...), revisa el SQL y luego `npm run db:migrate`. Nunca uses `db:push` en la base poblada: falla.
- `npm run db:seed` borra todo y vuelve a sembrar, así que se niega a correr si ya hay intentos o lecciones completadas. Para forzarlo (pierdes tu progreso): `npm run db:seed -- --force`.

## Despliegue

Sube el repositorio (privado) a GitHub, impórtalo en Vercel y carga las 4 variables de entorno de `.env.example`.

## Instalar en el iPhone

Abre la URL en Safari, toca Compartir y elige "Agregar a pantalla de inicio". Se abre a pantalla completa. No hay modo sin conexión.

Los íconos se generan desde `public/icons/ovo.svg` (192, 512 y `apple-touch-icon.png` de 180 px).
