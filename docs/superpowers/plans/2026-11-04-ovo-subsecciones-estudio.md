# Ovo: subsecciones de estudio — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (o subagent-driven-development). Steps con checkbox.

**Goal:** Cada unidad se divide en subsecciones. Cada subsección tiene un nodo 📖 **Estudiar**, con tarjetas una por una y un modo apunte, y un nodo 🎯 **Practicar**. La práctica se desbloquea al terminar o saltar el estudio. Además, el importador avisa qué páginas del PDF quedaron sin cubrir.

**Architecture:** reutilizar `lessons` y `exercises`:
- Una lección de estudio es una fila de `lessons` con `kind='estudio'`.
- Sus tarjetas son filas de `exercises` con tipos de estudio, que no se califican.
- `sections` agrupa el estudio y la práctica de un mismo tema.

Así el importador, las citas, el botón "Esto está mal" y `reportados` funcionan sin cambios de fondo.

**Spec:** `docs/superpowers/specs/2026-11-03-ovo-design.md` §3.6 (nuevo), §5, §6.

## Global Constraints
- Todo en español. Las reglas de diseño y movimiento son las de siempre: `transform`/`opacity`, menos de 300 ms, respetar reduced motion, foco visible, sin desbordes a 375 px.
- Cada tarjeta de estudio lleva `source`, con `quote` obligatoria en los PDF, igual que los ejercicios.
- A las lecciones de estudio **no** se les aplica `pickVariants`: se muestran todas sus tarjetas en orden.
- Cambios de esquema con `db:generate` y `db:migrate` (`0002`), todo con `.enableRLS()`. Nunca `db:seed` ni `push`.

## Review Focus
1. Saltar un estudio desbloquea la práctica y **no** cuenta para la racha.
2. Volver a abrir un estudio o una práctica empieza de cero (bfcacheId; ya corregido en `LessonPlayer`).
3. Una lección de estudio con varias tarjetas del mismo concepto no pierde tarjetas, porque no se le aplican variantes.
4. Las unidades viejas, sin secciones, se siguen viendo y jugando igual.

---

### Task 1: Esquema y tipos
- `schema.ts`:
  - tabla `sections(id, unitId → units, position int, title text; unique(unitId, position))`;
  - en `lessons`: `sectionId` (nullable, FK) y `kind text not null default 'practica'` (`'estudio'|'practica'`);
  - en `lessonCompletions`: `skipped boolean not null default false`.

  Luego `db:generate` → `0002` → `db:migrate`.
- `types.ts`: nuevos esquemas Zod, todos con `kind` literal:
  - `Concepto {title, body: string (párrafos separados por \n\n), bullets?: string[]}`;
  - `Flashcard {front, back}`;
  - `Comparacion {title, columns: string[2..4], rows: {label, cells: string[]}[1..12]}`, donde `cells.length === columns.length`;
  - `Diagrama {title, layout: 'proceso'|'linea_tiempo'|'ciclo'|'jerarquia', nodes: Nodo[2..12]}`, con `Nodo = {label, detail?, children?: Nodo[]}`; `children` solo en `jerarquia` y con profundidad máxima de 3;
  - `Lista {title, intro?, items: string[2..15]}`.
  
  Exportar `STUDY_KINDS` y agregar los nuevos tipos a `ExercisePayloadSchema`. Pruebas de cada esquema, incluida una tabla con celdas mal contadas.

### Task 2: Paquete e importador
- `pack.ts`: cada lección acepta `kind?: 'estudio'|'practica'` (por omisión `practica`) y `section?: string` (título de la subsección).
  - Reglas: una lección de estudio solo tiene tipos de estudio (1 a 40 tarjetas, sin límite de grupos); una práctica no tiene tipos de estudio.
  - Si alguna lección de la unidad trae `section`, todas las lecciones con `title` la traen.
- `planImport` y `importar.ts`:
  - crea o reutiliza `sections` por título dentro de la unidad, con posición máx+1;
  - guarda `lessons.kind` y `sectionId`;
  - las tarjetas de estudio llevan `variantGroup` nulo, para que no se agrupen.
- **Cobertura:** por cada PDF del paquete, lista las páginas con texto, es decir, las que no quedan vacías tras normalizar, que ninguna tarjeta de estudio cita. Imprime "AVISO cobertura: <archivo> páginas sin estudiar: 3, 11, 20". El resumen agrega "N tarjetas de estudio" y, por lección, "(estudio) X tarjetas".
- Pruebas para el esquema, `planImport` y el cálculo de cobertura (función pura `uncoveredPages(pages, cited)`).

### Task 3: Camino, desbloqueo y racha
- `getSubjectPath`: devuelve `kind` y `section` de cada lección. Las lecciones de estudio cuentan aunque no tengan "ejercicios": basta con ≥1 tarjeta activa. Mismo orden y mismo `computeNodeStates`.
- UI del camino:
  - el título de la subsección aparece como etiqueta antes de su par de nodos;
  - el nodo de estudio muestra 📖 y el de práctica 🎯;
  - si el estudio es el nodo actual, ofrece "Estudiar" y "Saltar estudio", con confirmación en línea "¿Ya dominas este tema? Sí · No";
  - los estudios ya hechos ofrecen "Ver apunte".
- Acción `skipStudy(lessonId)`: `requireUser`; valida que la lección sea de estudio; inserta una completion con `skipped=true` solo si no hay ninguna.
- `getStreak` ignora `skipped=true`. Prueba de la regla con una función pura si se extrae.

### Task 4: Reproductor de estudio y modo apunte
- `getLessonForPlay` devuelve `kind`. Si es `estudio`, no aplica `pickVariants`.
- `LessonPlayer`, cuando la lección es de estudio:
  - muestra una tarjeta a la vez y la barra inferior solo dice "Siguiente";
  - no registra intentos;
  - al terminar, `completeLesson`;
  - mantiene el botón "Esto está mal".
- Componentes en `src/components/estudio/`: `Concepto`, `Flashcard`, `Comparacion`, `Diagrama` y `Lista`.
  - **Flashcard:** se voltea con `rotateY` (en reduced motion, cambio instantáneo); es un `button` con `aria-pressed`.
  - **Comparación:** `table` con `th` y scroll horizontal dentro de su contenedor.
  - **Diagrama:** HTML/CSS sin librerías.
    - `proceso`: pasos numerados con flechas;
    - `linea_tiempo`: vertical;
    - `ciclo`: pasos con una flecha que regresa al primero;
    - `jerarquia`: árbol con `ul` anidadas.
- Ruta `/leccion/[id]/apunte`: página única con todas las tarjetas en orden. Las flashcards se ven abiertas, con frente y reverso. Lleva un enlace "Volver al camino" y su propio `requireUser`.
- Verificación visual a 1280 y 375 px con un paquete de fixture de estudio; limpiar después.

### Task 5: Skill `generar-unidad`
- Nueva estructura: subsecciones por tema, cada una con una lección de **estudio** (todas las ideas del tema, sin resumir de más) y una de **práctica** (6 a 10 grupos).
- **Cobertura obligatoria:** toda página con texto debe quedar citada en el estudio; el `--dry-run` no debe mostrar avisos de cobertura, salvo portadas o páginas de pura bibliografía, que se justifican al usuario.
- Un ejemplo JSON por cada tipo de tarjeta, validado en `skill-examples.test.ts`.
- Cómo leer las diapositivas cuyas columnas se mezclan al extraer el texto: no inventar relaciones y preguntar al usuario.

### Task 6: Contenido (con el usuario)
- Rehacer AFI U1 con subsecciones. Antes, borrar las 2 lecciones viejas de AFI U1 con el permiso del usuario (se pierden sus intentos en esas lecciones).
- Generar Derecho informático U1. Mostrar los `--dry-run` y pedir aprobación antes de importar.
