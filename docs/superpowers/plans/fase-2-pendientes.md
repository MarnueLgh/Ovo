# Pendientes que vienen de la fase 1

Antes de generar contenido con IA, conviene resolver estos puntos que dejaron las revisiones de la fase 1:

- **Migraciones:** la base en vivo ya tiene aplicado `drizzle/0000_baseline.sql`, pero sin registro. Hay que marcar 0000 como aplicada en `__drizzle_migrations` antes del primer `npm run db:migrate`. `drizzle-kit push` falla con la base poblada.
- **Hidratación:** `CalculoSubneteo` usa `Math.random` dentro de `useState`. Hoy funciona porque `calculo` nunca es el primer ejercicio de una lección; hay que generar el problema al montar el componente.
- **Seed:** `db:seed` borra todo sin preguntar. Hay que agregar una protección, por ejemplo negarse a correr si ya hay intentos, salvo que se use `--force`.
- **Restricciones de base de datos:** agregar `unique (lessonId, position)` y `unique (unitId, number)` en la primera migración real.
- **Esquema de la IA:** las opciones de `CasoPractico` deben pedir `.min(2)`.
- **Funciones aplazadas desde §3.2:** la ficha "+ Materia" y la lista de PDFs de la unidad, que llegan junto con la pantalla Material.
- **Contraste:** el amarillo de `.u-now` queda en ~4.55:1, casi al límite. Un color de materia más claro no pasaría AA.
- **Menores aceptados:** el orden de relacionar es fijo por pregunta; no se anuncia cada par por lector de pantalla; el servidor confía en el `score`/`conceptId` del cliente (en la fase 3, `conceptId` debe derivarse en el servidor); `aria-controls` de "¿Por qué?" apunta a un panel que no siempre existe; el script que genera los íconos no está en el repo.
