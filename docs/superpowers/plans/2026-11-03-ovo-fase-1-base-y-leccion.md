# Ovo Fase 1: base, camino y lección jugable — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una PWA en línea, protegida con contraseña, donde el usuario abre la materia Telecomunicaciones I, ve su camino de unidades y completa una lección con los ejercicios de dato clave, relacionar, caso práctico y subneteo, con la racha registrada. El contenido es de ejemplo y cargado a mano; todavía no hay IA.

**Architecture:** Un solo proyecto Next.js (App Router, TypeScript). Las páginas son componentes de servidor que leen Postgres (Supabase) con Drizzle. Los ejercicios son componentes de cliente. La calificación y la retroalimentación se calculan en el cliente con funciones puras, y el intento se guarda con una server action idempotente. La lógica pura (subneteo, calificación, racha, estado del camino) vive en `src/lib` y tiene pruebas con Vitest.

**Tech Stack:** Next.js (última estable), React, TypeScript, Drizzle ORM + `postgres`, Supabase (Postgres y Auth vía `@supabase/ssr`), Zod, Vitest. CSS puro con `next/font/google` (Rubik). Sin kit de UI ni librería de animación.

**Spec:** `docs/superpowers/specs/2026-11-03-ovo-design.md`. Prototipos visuales: `.superpowers/brainstorm/1054-1793762987/content/estructura-v2.html`, `leccion.html` y `subneteo.html`.

**Fases siguientes (planes aparte, cada uno entrega software funcional):**
- **Fase 2:** subir PDFs e imágenes, generar con IA (GPT-6.1 Terra), verificar citas, botón "Esto está mal", respuesta abierta calificada con GPT-6 Luna, variantes y "Repasar".
- **Fase 3:** examen de unidad con 80% y desbloqueo, crédito parcial en el examen, panel de estadísticas (cuadrícula tipo GitHub, barras semanales, conceptos que te cuestan, historial).

## Global Constraints

- Todo el texto de la interfaz va en español.
- Tipografía Rubik (`next/font/google`, pesos 400–800). Tema claro con los tokens de color de `estructura-v2.html` (`--bg:#F3F0FA`, `--ink:#1B1530`, `--mute:#6E6787`, `--line:#E6E1F2`, lila `#C6A8F7`/`#7A4FD8`, cielo `#5CB8F6`/`#1F86CF`, durazno `#FFB48C`/`#E3743F`, menta `#8DE2B0`/`#2EA864`, mantequilla `#FFE07A`/`#C99A08`).
- Un color por materia: Telecom lila, BD cielo, Implementación (Java) durazno, Cálculo menta. Las demás usan colores de la misma familia.
- La cabecera de la materia muestra **solo** "Unidad N".
- Movimiento: solo `transform` y `opacity`; curva `cubic-bezier(.23,1,.32,1)`; menos de 300 ms en la interfaz; los botones bajan con `scale(.97)` o `translateY` al presionar; todo respeta `prefers-reduced-motion`. Las acciones de teclado no se animan.
- Accesibilidad: foco visible, nombre accesible en los botones de ícono y encabezados sin saltos de nivel.
- Un solo usuario. Inicio de sesión con email y contraseña de Supabase. **El registro público está desactivado.** Todas las rutas, salvo `/login`, requieren sesión.
- Zona horaria de la racha: `America/Mexico_City` (decisión del plan; la constante `APP_TZ` vive en `src/lib/time.ts`).
- Mascota: el huevito con ojos del prototipo va en la barra de navegación. No se invierte más en ella.

## Review Focus

1. **La racha alrededor de la medianoche local:** un intento a las 23:30 y otro a las 00:10 (hora de CDMX) cuentan como dos días, aunque el servidor esté en UTC. → prueba en la tarea 4.
2. **Variantes de escritura en el subneteo:** `26` y `/26` valen igual; los espacios al inicio o al final no cuentan como error (`" 255.255.255.192 "`). → prueba en la tarea 2.
3. **Relacionar con el dedo en el iPhone:** arrastrar el cable no debe mover la página, y soltar sobre la tarjeta (no solo sobre el punto) debe contar. → paso de verificación con viewport de 375 px en la tarea 8.
4. **Doble clic en "Comprobar" o red caída:** la retroalimentación aparece aunque falle el guardado, y un mismo intento nunca se guarda dos veces (ID generado en el cliente + `onConflictDoNothing`). → prueba en la tarea 3 (`attemptId` estable) y verificación en la tarea 8.
5. **Unidad sin lecciones o lección sin ejercicios:** el camino muestra el bloque "Sube los PDFs de esta unidad" y no falla. → prueba en la tarea 4.

---

### Task 1: Proyecto base, git, Vitest y estilos globales

**Files:**
- Create: proyecto con `npx create-next-app@latest . --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*"` en `C:\Users\anuar\OneDrive\Escritorio\Coding\Ovo`
- Create: `vitest.config.ts`, `src/lib/sanity.test.ts`
- Modify: `src/app/globals.css` (reemplazar todo), `src/app/layout.tsx`
- Modify: `.gitignore` (agregar `.superpowers/`, `.env*.local`)

**Interfaces:**
- Produces: variables CSS globales (tokens de Global Constraints más `--ease`), la clase `.in` (entrada escalonada) y el layout raíz con Rubik y `lang="es"`. Script `npm test` → `vitest run`.

- [ ] **Step 1:** `git init`, después correr `create-next-app` con las opciones de arriba. La carpeta ya contiene `docs/` y `.superpowers/`, así que, si el CLI se niega por directorio no vacío, generar en una carpeta temporal y mover los archivos.
- [ ] **Step 2:** Instalar `vitest` como dependencia de desarrollo y agregar `"test": "vitest run"` a `package.json`. `vitest.config.ts` con el alias `@` → `src`.
- [ ] **Step 3:** Escribir `src/lib/sanity.test.ts` con `expect(1 + 1).toBe(2)` y correr `npm test`. Esperado: 1 passed.
- [ ] **Step 4:** Copiar a `globals.css` los tokens `:root`, el reset, `.in` + `@keyframes rise` y el bloque `prefers-reduced-motion` de `estructura-v2.html`. En `layout.tsx`, cargar Rubik con `next/font/google`, poner `<html lang="es">` y el título "Ovo".
- [ ] **Step 5:** `npm run build`. Esperado: compila sin errores.
- [ ] **Step 6:** Commit `chore: base Next.js, Vitest y estilos globales`.

### Task 2: Generador y calificador de subneteo

**Files:**
- Create: `src/lib/exercises/subnetting.ts`
- Test: `src/lib/exercises/subnetting.test.ts`

**Interfaces:**
- Produces:
  - `type SubnetProblem = { network: string; subnets: 4|8|16; answer: SubnetAnswer }`
  - `type SubnetAnswer = { prefix: string; mask: string; magic: string; hosts: string; rows: [string,string,string,string][] }` (3 filas: red, primer host, último host, broadcast)
  - `generateSubnetting(rand: () => number): SubnetProblem`. El tercer octeto sale de `[0,1,10,20,50,100]` y las subredes de `[4,8,16]`, cada uno con `Math.floor(rand()*len)`.
  - `type SubnetInput = Omit<SubnetAnswer,'rows'> & { rows: string[][] }`
  - `gradeSubnetting(answer: SubnetAnswer, input: SubnetInput): { fields: Record<string, boolean>; correct: number; total: 16; score: number }`. Las llaves de `fields` son `prefix`, `mask`, `magic`, `hosts` y `r{fila}c{col}`.
  - `explainSubnetting(p: SubnetProblem): string[]`: los 6 pasos del prototipo con los números del problema.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// rand que siempre da 0.99 → tercer octeto 100, 16 subredes
const p16 = generateSubnetting(() => 0.99)
expect(p16.network).toBe('192.168.100.0/24')
expect(p16.answer).toMatchObject({ prefix: '/28', mask: '255.255.255.240', magic: '16', hosts: '14' })
expect(p16.answer.rows[1]).toEqual(['192.168.100.16','192.168.100.17','192.168.100.30','192.168.100.31'])

// rand secuencial [0.9, 0.0] → 100 y 4 subredes
const p4 = generateSubnetting(seq([0.9, 0.0]))
expect(p4.answer).toMatchObject({ prefix: '/26', mask: '255.255.255.192', magic: '64', hosts: '62' })
expect(p4.answer.rows[2]).toEqual(['192.168.100.128','192.168.100.129','192.168.100.190','192.168.100.191'])

// test: 'acepta 26 o /26 y espacios'
const g = gradeSubnetting(p4.answer, { ...p4.answer, prefix: '26', mask: ' 255.255.255.192 ' })
expect(g.correct).toBe(16); expect(g.score).toBe(1)

// test: 'crédito parcial'
const bad = gradeSubnetting(p4.answer, { ...p4.answer, magic: '32', rows: [p4.answer.rows[0], p4.answer.rows[1], ['x','','','']] })
expect(bad.fields.magic).toBe(false); expect(bad.correct).toBe(11); expect(bad.score).toBeCloseTo(11/16)

// test: 'la explicación usa los números del problema'
expect(explainSubnetting(p4).join(' ')).toContain('2^2 = 4')
```
(`seq` es un helper de la prueba que devuelve los valores en orden.)

- [ ] **Step 2:** `npx vitest run src/lib/exercises/subnetting.test.ts`. Esperado: FAIL, el módulo no existe.
- [ ] **Step 3:** Implementar las tres funciones. Fórmulas: `bits=log2(n)`, `magic=256>>bits`, `mask='255.255.255.'+(256-magic)` y fila `i` = `[i*m, i*m+1, i*m+m-2, i*m+m-1]`. Normalizar con `s.trim().replace(/^\//,'')` antes de comparar.
- [ ] **Step 4:** Volver a correr la prueba. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: generador y calificador de subneteo`.

### Task 3: Tipos de ejercicio y calificación

**Files:**
- Create: `src/lib/exercises/types.ts`, `src/lib/exercises/grade.ts`
- Test: `src/lib/exercises/grade.test.ts`

**Interfaces:**
- Produces (esquemas Zod con su tipo inferido):
  - `DatoClave = { kind:'dato_clave'; title; lead; left:{title; bullets:string[]}; right:{title; bullets:string[]}; rule:{headline; text} }`
  - `Relacionar = { kind:'relacionar'; prompt; pairs:{term; definition}[] }` (de 3 a 6 pares)
  - `CasoPractico = { kind:'caso_practico'; question; scene; options:{text; correct:boolean; whyWrong?:string}[]; explanation }`. Exactamente una opción correcta; cada opción incorrecta lleva `whyWrong`.
  - `Calculo = { kind:'calculo'; generator:'subneteo' }`
  - `ExercisePayload` = la unión discriminada por `kind`. `parsePayload(x: unknown): ExercisePayload`
  - `Source = { file: string; page: number; quote?: string }`
  - `gradeCaso(p: CasoPractico, chosen: number): { correct: boolean; score: 0|1; whyWrong?: string }`
  - `gradeRelacionar(pairs: number, firstTryCorrect: number): { score: number; correct: boolean }` (`correct` solo si todos los pares salieron bien al primer intento)
  - `newAttemptId(): string` → `crypto.randomUUID()`

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
expect(() => parsePayload({ kind:'caso_practico', question:'q', scene:'s', explanation:'e',
  options:[{text:'a',correct:true},{text:'b',correct:true,whyWrong:'x'}] })).toThrow()       // dos correctas
expect(() => parsePayload({ kind:'caso_practico', question:'q', scene:'s', explanation:'e',
  options:[{text:'a',correct:true},{text:'b',correct:false}] })).toThrow()                   // falta whyWrong
expect(gradeCaso(caso, 0)).toEqual({ correct:false, score:0, whyWrong:'El cable directo sirve para unir equipos distintos…' })
expect(gradeRelacionar(4, 3)).toEqual({ score:0.75, correct:false })
expect(gradeRelacionar(4, 4)).toEqual({ score:1, correct:true })
expect(newAttemptId()).not.toBe(newAttemptId())
```

- [ ] **Step 2:** Correr la prueba. Esperado: FAIL.
- [ ] **Step 3:** Implementar con Zod, usando `.refine` para la regla de una sola opción correcta y `whyWrong` en las incorrectas.
- [ ] **Step 4:** Correr la prueba. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: tipos de ejercicio y calificación`.

### Task 4: Racha y estado del camino

**Files:**
- Create: `src/lib/time.ts`, `src/lib/streak.ts`, `src/lib/path.ts`
- Test: `src/lib/streak.test.ts`, `src/lib/path.test.ts`

**Interfaces:**
- Produces:
  - `APP_TZ = 'America/Mexico_City'`; `toLocalDay(d: Date): string` → `YYYY-MM-DD` en `APP_TZ` (con `Intl.DateTimeFormat('en-CA',{timeZone})`)
  - `computeStreak(activeDays: string[], today: string): { current: number; best: number }`. Si hoy no tiene actividad pero ayer sí, `current` es la racha que termina ayer, porque la racha no se rompe hasta que acaba el día.
  - `type NodeState = 'done'|'current'|'locked'`
  - `computeNodeStates(lessonIds: string[], completedIds: Set<string>): NodeState[]`. Las lecciones completadas son `done`, la primera sin completar es `current` y el resto `locked`. Si recibe `[]`, devuelve `[]`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
expect(toLocalDay(new Date('2026-11-04T05:30:00Z'))).toBe('2026-11-03') // 23:30 CDMX
expect(toLocalDay(new Date('2026-11-04T06:10:00Z'))).toBe('2026-11-04') // 00:10 CDMX
expect(computeStreak(['2026-11-01','2026-11-02','2026-11-03'], '2026-11-03')).toEqual({ current:3, best:3 })
expect(computeStreak(['2026-11-01','2026-11-02'], '2026-11-03')).toEqual({ current:2, best:2 })   // hoy aún no
expect(computeStreak(['2026-10-01','2026-10-02','2026-10-03','2026-11-02'], '2026-11-04')).toEqual({ current:0, best:3 })
expect(computeStreak([], '2026-11-03')).toEqual({ current:0, best:0 })
expect(computeNodeStates(['a','b','c'], new Set(['a']))).toEqual(['done','current','locked'])
expect(computeNodeStates(['a','b'], new Set(['a','b']))).toEqual(['done','done'])
expect(computeNodeStates([], new Set())).toEqual([])
```

- [ ] **Step 2:** Correr las pruebas. Esperado: FAIL.
- [ ] **Step 3:** Implementar. `computeStreak` ordena y quita duplicados de los días, y recorre hacia atrás desde hoy o desde ayer.
- [ ] **Step 4:** Correr las pruebas. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: racha y estado del camino`.

### Task 5: Base de datos (Supabase + Drizzle) y contenido de ejemplo

**Files:**
- Create: `drizzle.config.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/db/seed.ts`, `.env.example`
- Modify: `package.json` (scripts `db:push` → `drizzle-kit push`, `db:seed` → `tsx src/db/seed.ts`)

**Interfaces:**
- Consumes: `ExercisePayload`, `Source` y `parsePayload` (tarea 3).
- Produces (tablas Drizzle, todas las PK son `uuid` con `defaultRandom()`):
  - `subjects(id, name, color text, emoji text, position int)`
  - `units(id, subjectId → subjects, number int, title, position int)`
  - `concepts(id, unitId → units, name)`
  - `lessons(id, unitId → units, position int, title)`
  - `exercises(id, lessonId → lessons, conceptId → concepts null, position int, kind text, payload jsonb, source jsonb null, retiredAt timestamptz null)`. `retiredAt` queda listo para el botón de la fase 2.
  - `attempts(id uuid PK sin default, exerciseId → exercises, conceptId null, score real, correct boolean, durationMs int, answeredAt timestamptz default now())`
  - `lessonCompletions(id, lessonId → lessons, completedAt timestamptz default now())`
  - `db` exportado desde `src/db/index.ts` (`drizzle(postgres(process.env.DATABASE_URL!, { prepare:false }))`)
- Variables de entorno (`.env.example`): `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 1 (acción del usuario):** crear un proyecto gratuito en supabase.com. En Authentication → Sign In / Providers, **desactivar "Allow new users to sign up"** y crear un usuario con email y contraseña. Copiar a `.env.local` la URL, la anon key y la cadena de conexión del pooler en modo *transaction*. El implementador espera aquí y nunca escribe ni pide credenciales en el chat.
- [ ] **Step 2:** Escribir `schema.ts` e `index.ts`, y correr `npm run db:push`. Esperado: las 7 tablas creadas.
- [ ] **Step 3:** Escribir `seed.ts`. Borra y vuelve a crear:
  - las 7 materias del spec con su color y su emoji;
  - en Telecom (📡), la Unidad 1 "Fundamentos de señales" sin lecciones (para probar el bloque vacío) y la Unidad 2 "Medios de transmisión" con una lección "Cable directo vs. cruzado" de 4 ejercicios: el dato clave, relacionar y caso práctico copiados de `leccion.html` (todos los `whyWrong` incluidos), y un `calculo` de subneteo.
  
  Cada payload pasa por `parsePayload`. Los `source` apuntan a `{ file:'Tema2_Medios.pdf (ejemplo)', page:9 }`.
- [ ] **Step 4:** `npm run db:seed`, y después contar las filas con un script o en el editor SQL de Supabase. Esperado: 7 materias, 2 unidades de Telecom, 1 lección y 4 ejercicios.
- [ ] **Step 5:** Commit `feat: esquema de base de datos y contenido de ejemplo` (sin `.env.local`).

### Task 6: Inicio de sesión y protección de rutas

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/middleware.ts`, `src/app/login/page.tsx`, `src/app/login/actions.ts`

**Interfaces:**
- Produces: `createServerSupabase()` (patrón oficial de `@supabase/ssr` para el App Router) y la server action `signIn(formData)`, que redirige a `/` o devuelve `{ error: 'Correo o contraseña incorrectos.' }`. El middleware refresca la sesión y redirige a `/login` cualquier ruta sin sesión, salvo `/login`, `/manifest.webmanifest` y los íconos.

- [ ] **Step 1:** Instalar `@supabase/ssr` y `@supabase/supabase-js`, y escribir los clientes siguiendo la guía oficial de Next.js App Router de Supabase.
- [ ] **Step 2:** Página `/login` con el estilo del prototipo: tarjeta blanca, huevito, campos de correo y contraseña, y botón "Entrar". No hay enlace de registro.
- [ ] **Step 3:** Verificar con `npm run dev`:
  - `/` sin sesión redirige a `/login`;
  - una contraseña equivocada muestra el error;
  - la contraseña correcta lleva a `/`;
  - al recargar, la sesión sigue.
- [ ] **Step 4:** Commit `feat: inicio de sesión de un solo usuario`.

### Task 7: Barra de navegación y pantalla del camino

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/materia/[subjectId]/page.tsx`, `src/components/NavPill.tsx`, `src/components/PathNode.tsx`, `src/components/StreakTile.tsx`, `src/app/(app)/camino.css`
- Create: `src/lib/queries.ts`

**Interfaces:**
- Consumes: `db` y las tablas (tarea 5); `computeNodeStates`, `computeStreak` y `toLocalDay` (tarea 4).
- Produces:
  - `getSubjects()`
  - `getSubjectPath(subjectId)` → `{ subject, units: { unit, lessons: { lesson, state: NodeState }[] }[] }`
  - `getStreak(): Promise<{current; best}>`, que cuenta solo los días con una **lección completada** (`lessonCompletions.completedAt` pasado por `toLocalDay`), como pide el spec. En la fase 3 se suman los exámenes.

- [ ] **Step 1:** `(app)/layout.tsx` con `NavPill`: el huevito, Camino 🗺️ (activo), Panel 📊, Material 📚 y Ajustes ⚙️. Panel, Material y Ajustes llevan a una página sencilla "Próximamente", que se construye en las fases 2 y 3. Cada botón lleva `aria-label`.
- [ ] **Step 2:** `(app)/page.tsx` redirige a `/materia/{id de la primera materia}`.
- [ ] **Step 3:** Página de la materia, replicando `estructura-v2.html`:
  - fichas de materias;
  - cabecera de color que dice **solo "Unidad N"** (la unidad actual);
  - por cada unidad, su encabezado de color y los nodos en zigzag (`PathNode` con `done`, `current` con la burbuja "EMPEZAR" o `locked`), donde el nodo actual enlaza a `/leccion/[id]`;
  - en las unidades sin lecciones, el bloque "Sube los PDFs de esta unidad";
  - el bloque de examen se muestra como "Examen de unidad: próximamente" (fase 3);
  - columna derecha con `StreakTile` y la tarjeta "Siguiente lección".
- [ ] **Step 4:** Verificar en `npm run dev` contra el prototipo. Esperado: la Unidad 1 muestra el bloque vacío, la Unidad 2 muestra 1 nodo `current` con "EMPEZAR" y la racha es 0. Correr el detector de diseño: `node C:\Users\anuar\.claude\skills\impeccable\scripts\detect.mjs --json src/app src/components`, y corregir lo que encuentre.
- [ ] **Step 5:** Commit `feat: navegación y camino de la materia`.

### Task 8: Reproductor de lección con dato clave, relacionar y caso práctico

**Files:**
- Create: `src/app/(app)/leccion/[lessonId]/page.tsx`, `.../actions.ts`, `src/components/lesson/LessonPlayer.tsx`, `CheckBar.tsx`, `DatoClave.tsx`, `Relacionar.tsx`, `CasoPractico.tsx`, `leccion.css`

**Interfaces:**
- Consumes: `ExercisePayload`, `gradeCaso`, `gradeRelacionar` y `newAttemptId` (tarea 3); las tablas (tarea 5).
- Produces:
  - server action `recordAttempt({ id, exerciseId, conceptId, score, correct, durationMs }): Promise<void>`, que inserta con `.onConflictDoNothing()`;
  - server action `completeLesson(lessonId): Promise<void>`;
  - `type ExerciseResult = { score: number; correct: boolean }`; cada componente de ejercicio recibe `{ payload, onResult(r: ExerciseResult) }`.

- [ ] **Step 1:** La página de servidor carga los ejercicios de la lección (sin `retiredAt`, ordenados por `position`) y se los pasa a `LessonPlayer`, que tiene la barra de progreso arriba, la ✕ que regresa al camino, un ejercicio a la vez y la `CheckBar` abajo, con el comportamiento de `leccion.html`.
- [ ] **Step 2:** Portar `DatoClave`, `Relacionar` (cables en SVG, pointer events en `document`, `touch-action:none` en el conector; al soltar, se busca la tarjeta con `elementsFromPoint`) y `CasoPractico` (con "¿Por qué?" que muestra el `whyWrong` de la opción elegida, la respuesta correcta y la fuente). El texto y el comportamiento son los del prototipo.
- [ ] **Step 3:** Al comprobar, la retroalimentación se muestra **antes** de guardar. Después se llama a `recordAttempt` con un `id` generado una sola vez por ejercicio, y el botón queda deshabilitado mientras tanto. Si falla, aparece una nota discreta: "No se pudo guardar tu respuesta". Al terminar el último ejercicio se llama a `completeLesson` y se vuelve al camino.
- [ ] **Step 4:** Verificar en `npm run dev`:
  - completar la lección acertando y fallando;
  - en Supabase, cada intento aparece una sola vez aunque se haga doble clic en "Comprobar";
  - de regreso en el camino, el nodo queda en `done` y la racha en 1.
- [ ] **Step 5:** Verificar con un viewport de 375×812 (preset móvil):
  - los cables se arrastran sin mover la página;
  - soltar sobre el texto de la tarjeta cuenta;
  - el diseño no se desborda.
  
  Correr el detector de diseño sobre `src/components/lesson`.
- [ ] **Step 6:** Commit `feat: reproductor de lección`.

### Task 9: Ejercicio de cálculo paso a paso (subneteo) en la lección

**Files:**
- Create: `src/components/lesson/CalculoSubneteo.tsx`
- Modify: `src/components/lesson/LessonPlayer.tsx` (renderizar `kind:'calculo'`)

**Interfaces:**
- Consumes: `generateSubnetting`, `gradeSubnetting` y `explainSubnetting` (tarea 2); `onResult` (tarea 8).

- [ ] **Step 1:** Portar `subneteo.html`:
  - 4 campos más la tabla de 3×4;
  - al comprobar, cada campo se pinta de verde o rojo, y los rojos muestran "Era X";
  - "¿Por qué?" despliega `explainSubnetting`;
  - "Otro ejercicio" genera uno nuevo con `Math.random`.
  
  El `score` que se manda a `onResult` es el crédito parcial (`correct/16`), y `correct` solo es verdadero cuando están los 16 campos bien. Los campos usan `inputMode="decimal"` para el teclado del iPhone.
- [ ] **Step 2:** Verificar en `npm run dev` que el ejercicio aparece como cuarto paso, que califica bien una respuesta con 2 errores (14/16) y que el intento se guarda con `score` 0.875.
- [ ] **Step 3:** Commit `feat: subneteo dentro de la lección`.

### Task 10: PWA y despliegue

**Files:**
- Create: `src/app/manifest.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/apple-touch-icon.png`
- Modify: `src/app/layout.tsx` (metadata `appleWebApp: { capable:true, title:'Ovo', statusBarStyle:'default' }` y `themeColor '#F3F0FA'`)

- [ ] **Step 1:** `manifest.ts` con `name:'Ovo'`, `display:'standalone'`, `start_url:'/'`, `background_color` y `theme_color` `#F3F0FA`, y los íconos. Los íconos son el huevito sobre fondo lila, exportados a PNG desde un SVG simple. **Sin service worker**: el modo sin conexión no está en el alcance.
- [ ] **Step 2:** `npm run build && npm start`, y en el navegador revisar que `/manifest.webmanifest` responde 200 sin sesión.
- [ ] **Step 3 (acción del usuario):** subir el repositorio a GitHub (privado), importarlo en Vercel y cargar las 3 variables de entorno.
- [ ] **Step 4 (acción del usuario):** en el iPhone, abrir la URL en Safari → Compartir → "Agregar a pantalla de inicio". Esperado: se abre a pantalla completa, pide inicio de sesión y la lección funciona con el dedo.
- [ ] **Step 5:** Commit `feat: PWA instalable`.
