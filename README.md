# Ovo

App de estudio personal (un solo usuario) hecha con Next.js, Supabase y Drizzle. Se instala en el iPhone como PWA.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run db:push              # crea las tablas
npm run db:seed              # OJO: BORRA los datos existentes y vuelve a sembrar
npm run dev
npm test
```

## Despliegue

Sube el repositorio (privado) a GitHub, impórtalo en Vercel y carga las 3 variables de entorno de `.env.example`.

## Instalar en el iPhone

Abre la URL en Safari, toca Compartir y elige "Agregar a pantalla de inicio". Se abre a pantalla completa. No hay modo sin conexión.

Los íconos se generan desde `public/icons/ovo.svg` (192, 512 y `apple-touch-icon.png` de 180 px).
