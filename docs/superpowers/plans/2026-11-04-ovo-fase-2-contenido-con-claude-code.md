# Ovo Fase 2: contenido real generado con Claude Code — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El usuario pone los PDFs o fotos de una unidad en `material/`, le pide a Claude Code que genere la unidad y corre `npm run importar`. Las lecciones aparecen en Ovo citando la página de donde salió cada ejercicio, con variantes al repetir, respuesta abierta por autoevaluación y un botón "Esto está mal". Todo sin usar ninguna API de IA.

**Architecture:** Claude Code escribe un *paquete de unidad* en JSON (`contenido/*.json`) siguiendo una skill del proyecto. Un script de Node (`scripts/importar.ts`) hace cuatro cosas:
- valida el paquete con Zod, usando los mismos esquemas que la app;
- extrae el texto de cada página de los PDFs con `unpdf` y verifica las citas;
- guarda todo en Postgres dentro de una transacción;
- registra el hash del paquete para no importarlo dos veces.

La app solo lee: elige una variante por concepto al jugar y marca como reportados los ejercicios con "Esto está mal".

**Tech Stack:** el de la fase 1 (Next.js 16, Drizzle, Supabase, Zod 4, Vitest) más `unpdf` (dependencia de desarrollo, solo para el importador) y `tsx`, que ya está instalado.

**Spec:** `docs/superpowers/specs/2026-11-03-ovo-design.md`, en particular §4, §6.0 (modo actual) y §5. Pendientes heredados: `docs/superpowers/plans/fase-2-pendientes.md`.

## Global Constraints

- Todo el texto de la interfaz y de los mensajes del importador va en español.
- **Todo sale únicamente del material** (§6). Cada ejercicio, salvo `calculo`, lleva `source: { file, page, quote? }`. Lo único inventable son las frases para recordar.
- `material/` y `contenido/` se agregan a `.gitignore` y nunca se suben a git.
- Migraciones: `drizzle-kit push` está roto con la base poblada. Los cambios de esquema se hacen con `npm run db:generate` y `npm run db:migrate`, empezando en `0001`. Toda tabla nueva lleva `.enableRLS()`.
- La app solo accede a la base de datos del lado del servidor y llama a `requireUser()` en cada página y acción.
- Las reglas de movimiento, accesibilidad y diseño son las mismas de la fase 1: solo `transform`/`opacity`, `cubic-bezier(.23,1,.32,1)`, menos de 300 ms, respetar `prefers-reduced-motion`, foco visible, sin desbordes a 375 px.
- Nunca imprimir `.env.local`. Nunca correr `db:seed` contra la base real (borra todo). Los agentes no inician sesión con la cuenta real del usuario.

## Review Focus

1. **Importar el mismo paquete dos veces** no debe duplicar lecciones: el importador lo rechaza con un mensaje claro. → tarea 3.
2. **Cita que no aparece en la página** (por espacios, guiones al final de línea o acentos distintos): se normaliza antes de comparar. Si de verdad no está, el importador avisa, busca en qué página sí aparece y, si no aparece en ninguna, la marca `verified:false` sin fallar el paquete entero. → tareas 2 y 3.
3. **Paquete con un error de esquema** (por ejemplo, un caso práctico con dos opciones correctas): el importador no escribe **nada**, porque todo va en una sola transacción, e indica la ruta exacta del error (`lessons[1].exercises[3]`). → tarea 3.
4. **Repetir una lección** muestra otra variante de cada concepto, si existe, y nunca deja la lección vacía. → tarea 4.
5. **Presionar "Esto está mal" dos veces o sin conexión** no rompe la lección y no la deja sin ejercicios a medio camino: el ejercicio actual se puede saltar. → tarea 5.

---

### Task 1: Migraciones al día y pendientes heredados

**Files:**
- Create: `scripts/marcar-baseline.ts`, migración `drizzle/0001_*.sql` (generada)
- Modify: `src/db/schema.ts`, `src/db/seed.ts`, `src/lib/exercises/types.ts`, `src/components/lesson/CalculoSubneteo.tsx`, `package.json`, `.gitignore`, `README.md`

**Interfaces:**
- Produces (cambios de esquema):
  - `exercises` agrega `variantGroup text` (nullable) y `reportedAt timestamptz` (nullable).
  - Tabla nueva `files(id, unitId → units, name text, kind text 'pdf'|'imagen', pages int)` con `unique(unitId, name)`.
  - Tabla nueva `imports(id, hash text unique, file text, importedAt timestamptz default now())`.
  - `unique(lessonId, position)` en `exercises`, `unique(unitId, position)` en `lessons`, `unique(subjectId, number)` en `units`.
  - Todo con `.enableRLS()`.
- Produces: script `db:marcar-baseline`, que inserta en `drizzle.__drizzle_migrations` la fila de `0000_baseline` (con el hash y el `created_at` que espera el migrador instalado) solo si no existe.

- [ ] **Step 1:** Leer cómo el migrador de `drizzle-orm` instalado calcula el hash y lee `created_at` (en `node_modules/drizzle-orm/migrator*`), y escribir `scripts/marcar-baseline.ts` con ese mismo cálculo. Debe ser idempotente: si la fila existe, no hace nada.
- [ ] **Step 2:** Correr `npm run db:marcar-baseline`, editar `schema.ts`, `npm run db:generate` (debe producir **solo** los cambios nuevos como `0001`) y `npm run db:migrate`. Esperado: termina sin error, y una consulta de verificación muestra `rowsecurity=true` en `files` e `imports` y las columnas nuevas en `exercises`.
- [ ] **Step 3:** Pendientes de la fase 1:
  - `seed.ts` se niega a correr si `attempts` o `lesson_completions` tienen filas, salvo que se pase `--force`; el mensaje explica por qué.
  - `CasoPractico.options` pasa a `.min(2)`, con una prueba que rechace un caso de 1 opción.
  - `CalculoSubneteo` genera el problema al montarse, sin `Math.random` durante el render.
- [ ] **Step 4:** Agregar `material/` y `contenido/` a `.gitignore`. Actualizar el README: el flujo de migraciones (`db:generate` y `db:migrate`; la baseline ya está marcada) y la protección del seed.
- [ ] **Step 5:** Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y hacer commit.

### Task 2: Esquema del paquete, respuesta abierta y funciones puras

**Files:**
- Create: `src/lib/content/pack.ts`, `src/lib/content/quotes.ts`, `src/lib/content/variants.ts`
- Modify: `src/lib/exercises/types.ts`, `src/lib/exercises/grade.ts`
- Test: `src/lib/content/pack.test.ts`, `quotes.test.ts`, `variants.test.ts`, `src/lib/exercises/grade.test.ts`

**Interfaces:**
- Produces:
  - Tipo nuevo `Abierta = { kind:'abierta'; question; modelAnswer; keyPoints: string[] }` (de 2 a 6 elementos clave), agregado a `ExercisePayloadSchema`.
  - `gradeAbierta(total: number, checked: number): { score: number; correct: boolean }`; `correct` solo si `checked === total`.
  - `Source` agrega `verified?: boolean`.
  - `PackSchema` (Zod) y `type Pack`:
    ```
    { subject: string,                       // nombre exacto de una materia existente
      unit: { number: int>=1, title: string },
      files: { name: string, kind: 'pdf'|'imagen' }[],           // relativos a material/<materia>/<unidad>/
      concepts: { key: string, name: string }[],
      lessons: ({ title: string } | { lessonId: uuid })[] & each { exercises: PackExercise[] } }
    PackExercise = ExercisePayload & { concept: string /* key */, group?: string, source?: Source }
    ```
    Reglas con `superRefine`:
    - toda `concept` existe en `concepts`;
    - todo `source.file` existe en `files`;
    - todo ejercicio que no sea `calculo` tiene `source`;
    - las `key` de los conceptos son únicas;
    - cada lección tiene entre 1 y 12 ejercicios.

    Los errores deben incluir la ruta (`lessons.1.exercises.3`).
  - `normalizeForMatch(s: string): string`: quita acentos, pasa a minúsculas, une las palabras cortadas con guion al final de línea y colapsa los espacios.
  - `findQuotePage(quote: string, pages: string[], hint: number): number | null`: devuelve `hint` si la cita está en esa página; si no, la primera página donde aparece (empezando en 1); si no aparece, `null`.
  - `pickVariants<T extends { id: string; group: string | null; position: number }>(rows: T[], seen: Map<string, number>): T[]`: deja un ejercicio por `group`, el de menos intentos (`seen.get(id) ?? 0`) y, si empatan, el de menor `position`. Las filas con `group` nulo pasan siempre. El orden del resultado es por `position`.

- [ ] **Step 1: Escribir las pruebas que fallan**
```ts
expect(gradeAbierta(4, 3)).toEqual({ score: 0.75, correct: false })
expect(gradeAbierta(3, 3)).toEqual({ score: 1, correct: true })
expect(normalizeForMatch('Atenua-\nción  de la SEÑAL')).toBe('atenuacion de la senal')
expect(findQuotePage('fibra monomodo', ['nada', 'La Fibra   monomodo usa…'], 1)).toBe(2)
expect(findQuotePage('no existe', ['a', 'b'], 1)).toBeNull()
// pickVariants: grupo g1 con a(pos0, 2 intentos) y b(pos1, 0) → elige b; null-group c pasa; orden por position
expect(pickVariants([{id:'a',group:'g1',position:0},{id:'b',group:'g1',position:1},{id:'c',group:null,position:2}], new Map([['a',2]])).map(r=>r.id)).toEqual(['b','c'])
// PackSchema: concept inexistente → error cuyo path es ['lessons',0,'exercises',0,'concept']
// PackSchema: caso_practico sin source → error; pack válido mínimo (1 concepto, 1 lección, 1 relacionar) → ok
```
- [ ] **Step 2:** Correr las pruebas. Esperado: FAIL. **Step 3:** Implementar. **Step 4:** Correr las pruebas. Esperado: PASS. **Step 5:** Commit.

### Task 3: Importador `npm run importar`

**Files:**
- Create: `scripts/importar.ts`, `scripts/fixtures/` (un PDF de 2 páginas con texto más un paquete de ejemplo), `src/lib/content/import.ts`
- Test: `src/lib/content/import.test.ts`
- Modify: `package.json` (`"importar": "tsx scripts/importar.ts"`)

**Interfaces:**
- Consumes: `PackSchema`, `findQuotePage`, `normalizeForMatch` (tarea 2); las tablas (tarea 1).
- Produces:
  - CLI: `npm run importar -- <ruta.json> [--dry-run]`.
  - Lee los archivos desde `material/<subject>/<unit.number>/<file.name>`, donde `subject` es el nombre exacto de la materia; por ejemplo `material/Telecomunicaciones I/3/Tema3.pdf`. Si falta un archivo, es un error que se reporta antes de escribir.
  - Función pura `planImport(pack, pagesByFile: Map<string, string[] | null>, existing: { unitId?: string; lessonCount: number; conceptIds: Map<string,string> })` que devuelve `{ warnings: string[], rows: {...} }`. Esta función decide las posiciones, la reubicación de citas y `verified`, sin tocar la base de datos.

- [ ] **Step 1:** Escribir pruebas de `planImport`:
  - Una cita en una página equivocada se reubica y deja un aviso.
  - Una cita inexistente queda `verified:false` y deja un aviso.
  - Una imagen (`pages` es `null`) no se verifica.
  - Las lecciones nuevas se numeran después de las existentes (`existing.lessonCount = 2` → `position` 2, 3…).
  - Las lecciones `{ lessonId }` agregan ejercicios al final de esa lección.
  - El `group` por omisión es `concept + ':' + kind`.
- [ ] **Step 2:** Implementar `planImport` hasta que las pruebas pasen.
- [ ] **Step 3:** Implementar el CLI:
  - calcula el `sha256` del JSON y, si ya está en `imports`, termina con "Este paquete ya se importó el <fecha>";
  - valida con `PackSchema`; si falla, imprime cada error con su ruta y termina con código 1 sin escribir nada;
  - extrae el texto por página con `unpdf` (dependencia de desarrollo);
  - en una sola transacción: crea la unidad si no existe (`subject` + `number`), crea o reutiliza conceptos por nombre, registra `files` con su número de páginas, inserta lecciones y ejercicios, e inserta en `imports`;
  - imprime un resumen ("Unidad 3 · 2 lecciones nuevas · 14 ejercicios · 1 cita sin verificar").
  
  Con `--dry-run`, imprime el resumen y no escribe nada.
- [ ] **Step 4:** Verificar contra la base real con el paquete de `scripts/fixtures`, que apunta a una materia existente y a la **unidad 99**:
  - `--dry-run` sí escribe el resumen;
  - la importación real funciona;
  - una segunda importación se rechaza;
  - un paquete roto no escribe nada.
  
  Después, **borrar exactamente** lo que creó el fixture (unidad 99, sus lecciones, ejercicios, conceptos, archivos y su fila de `imports`) con un script de limpieza que se queda en `scripts/fixtures/limpiar.ts`.
- [ ] **Step 5:** Commit.

### Task 4: Variantes y respuesta abierta en el reproductor

**Files:**
- Create: `src/components/lesson/Abierta.tsx`
- Modify: `src/lib/queries.ts` (`getLessonForPlay`, `getLessonSummary`), `src/components/lesson/LessonPlayer.tsx`, `src/components/lesson/leccion.css`

**Interfaces:**
- Consumes: `pickVariants`, `gradeAbierta`, `Abierta` (tarea 2).
- Produces: `getLessonForPlay` aplica `pickVariants` con los conteos de intentos por ejercicio de esa lección (una sola consulta agrupada) y excluye los ejercicios con `retiredAt`. El resto de la interfaz no cambia.

- [ ] **Step 1:** Componente `Abierta`:
  - un `textarea` (con su etiqueta) y el botón "Comparar", deshabilitado si el texto está vacío;
  - al comparar, muestra la respuesta modelo y una casilla por elemento clave ("Marca los que incluiste");
  - "Comprobar" envía `gradeAbierta(total, marcados)` por `onResult`;
  - muestra la fuente ("Vuelve a leerlo en {file}, p. {page}").
- [ ] **Step 2:** Agregar la rama `abierta` a `LessonPlayer`. En `getLessonSummary`, la etiqueta de `abierta` es "Respuesta abierta".
- [ ] **Step 3:** Verificar con un paquete de fixture que tenga 2 variantes de un concepto y una respuesta abierta:
  - la primera vez aparece la variante A;
  - después de responderla, al repetir la lección aparece la B;
  - la respuesta abierta guarda un `score` proporcional.
  
  Si usas una forma temporal de saltarte el login, quítala antes del commit. Limpia los datos del fixture.
- [ ] **Step 4:** Correr el detector de diseño, `tsc`, las pruebas y `build`. Hacer commit.

### Task 5: Botón "Esto está mal" y lista de reportados

**Files:**
- Modify: `src/app/(lesson)/leccion/[lessonId]/actions.ts`, `src/components/lesson/LessonPlayer.tsx`
- Create: `scripts/reportados.ts` (`npm run reportados`)

**Interfaces:**
- Produces:
  - Server action `reportExercise(exerciseId: string): Promise<void>`: llama a `requireUser`, valida el UUID con Zod y hace `update exercises set retired_at = now(), reported_at = now() where id = $1 and retired_at is null`. Es idempotente.
  - `npm run reportados` imprime los reportados que todavía no tienen reemplazo, agrupados por materia y unidad: id, lección (id y título), tipo, concepto, fuente y el texto principal del ejercicio. Así Claude Code puede generar un paquete `{ lessonId }` de reemplazo.

- [ ] **Step 1:** En la lección, cada ejercicio muestra un enlace discreto "Esto está mal" con confirmación en línea ("¿Quitar este ejercicio? Sí · No"), no un modal. Al confirmar:
  - llama a la acción y salta al siguiente ejercicio sin registrar intento;
  - si falla, avisa "No se pudo reportar" y deja seguir;
  - si era el último, termina la lección normalmente.
- [ ] **Step 2:** Verificar con un fixture que reportar saca el ejercicio de la lección al recargar, que un doble clic no falla y que `npm run reportados` lo lista. Limpia los datos del fixture.
- [ ] **Step 3:** Commit.

### Task 6: Pantalla Material, archivos en el camino y la skill `generar-unidad`

**Files:**
- Create: `.claude/skills/generar-unidad/SKILL.md`, `src/app/(app)/material/material.css`
- Modify: `src/app/(app)/material/page.tsx` (reemplaza "Próximamente"), `src/app/(app)/materia/[subjectId]/page.tsx` (lista de archivos de la unidad actual en la columna derecha), `src/lib/queries.ts`, `README.md`

**Interfaces:**
- Produces: `getMaterial()` devuelve, por materia y unidad, los archivos, el número de lecciones y ejercicios activos, y el total de reportados pendientes.

- [ ] **Step 1:** La página Material lista cada materia → sus unidades → los archivos (nombre y páginas) y los conteos. Arriba va un bloque fijo, "Cómo agregar material", con 3 pasos:
  1. guarda los archivos en `material/<Materia>/<número de unidad>/`;
  2. en Claude Code escribe `/generar-unidad <Materia> <número>`;
  3. corre `npm run importar -- contenido/<archivo>.json`.
  
  En el camino, la tarjeta de la unidad actual lista sus archivos, como pedía §3.2.
- [ ] **Step 2:** Escribir la skill `generar-unidad` (en español). Debe cubrir:
  - las entradas (materia y número de unidad) y que lea **todo** `material/<Materia>/<N>/`: PDFs con la herramienta Read por páginas e imágenes con Read;
  - las reglas de §6: solo usar el material, citar página y fragmento literal corto, no crear un ejercicio si el material no alcanza, y que lo único inventable sean frases para recordar;
  - qué tipos usar según la materia (§4): teoría en todas; `caso_practico` en Telecom y Administración de la FI; `abierta` en Derecho; `calculo` (subneteo) solo cuando la unidad trata subneteo;
  - el tamaño: lecciones de 6 a 10 ejercicios y de 2 a 3 variantes (`group`) por concepto;
  - cómo leer `src/lib/content/pack.ts` como esquema autoritativo;
  - escribir el paquete en `contenido/<materia>-u<N>-<fecha>.json`, correr `npm run importar -- <archivo> --dry-run`, corregir hasta que no haya errores y mostrarle al usuario el resumen y los avisos antes de importar de verdad;
  - el modo reemplazo: leer `npm run reportados` y generar paquetes `{ lessonId }`.
- [ ] **Step 3:** README: sección "Generar contenido", con el flujo y la skill.
- [ ] **Step 4:** Verificar `tsc`, las pruebas, `build` y el detector. Hacer commit.

### Task 7: Primera unidad real, con el usuario

- [ ] **Step 1 (acción del usuario):** poner el material de una unidad real (se sugiere Telecom) en `material/Telecomunicaciones I/<N>/`.
- [ ] **Step 2 (controlador, en esta sesión):** correr `/generar-unidad` con ese material, hacer el `--dry-run`, mostrarle el resumen al usuario e importar cuando lo apruebe.
- [ ] **Step 3 (acción del usuario):** jugar una lección en el iPhone y reportar con "Esto está mal" lo que no sirva.
