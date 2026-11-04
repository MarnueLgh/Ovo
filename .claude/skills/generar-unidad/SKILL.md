---
name: generar-unidad
description: Genera el paquete JSON de lecciones de una unidad de Ovo a partir del material del usuario (PDFs e imágenes en material/<Materia>/<N>/), o reemplaza ejercicios reportados. Úsala cuando el usuario pida generar o crear lecciones/ejercicios de una unidad, o "reemplazar los reportados".
---

# Generar unidad (Ovo)

Produces un **paquete JSON** con lecciones y ejercicios, solo a partir del material del usuario, y lo dejas listo para `npm run importar`. No uses ninguna API de IA ni internet.

**Fuente de verdad del formato:** `src/lib/content/pack.ts` (con `src/lib/exercises/types.ts`). Léelos antes de escribir; si algo de abajo difiere, manda el código.

## 1. Entradas

- **Materia**: nombre exacto, tal como está en la base (`Telecomunicaciones I`, `Sistemas manejadores de BD relacionales`, `Implementación de sistemas`, `Cálculo diferencial e integral`, `Matemáticas financieras`, `Derecho informático`, `Administración de la función informática`; la lista viva está en `src/db/seed.ts`). Si el usuario la escribe distinto, resuélvela a ese nombre exacto; si hay duda, pregunta.
- **Número de unidad** (entero ≥ 1). Si la unidad no existe aún, el importador la crea con el `unit.title` del paquete.

Si falta alguna, pídela.

**Antes de generar para una unidad que ya tiene lecciones** (el importador avisa cuántas; también se ve en la pantalla Material), pregúntale al usuario si quiere **agregar lecciones nuevas** o **solo reemplazar los reportados** (§7). Si las quiere nuevas, usa títulos distintos a los existentes: el importador rechaza un título repetido en la unidad (salvo `--force`).

## 2. Leer TODO el material

Lista `material/<Materia>/<N>/` y lee **cada archivo**, sin saltarte ninguno:
- PDF: herramienta Read con `pages`. Si tiene más de 10 páginas, léelo en rangos (`1-10`, `11-20`, …) hasta terminar.
- Imagen: Read directamente (las citas de imágenes no se pueden verificar).
Anota para cada dato el archivo y la página. **La página es el índice físico del PDF** (1 = primera hoja, el mismo número que usas en `pages` de Read), **no** el número impreso en la diapositiva o el pie de página.

## 3. Reglas de contenido (spec §6)

1. **Todo sale solo del material.** Nada de conocimiento externo, ni "lo normal en el tema".
2. Todo ejercicio que no sea `calculo` lleva `source`: `file` (nombre exacto del archivo, listado en `files`), `page` (índice físico, 1-based) y `quote`. En **PDF la `quote` es obligatoria**; en imágenes se puede omitir (no se verifican).
   - La `quote` es **la frase o fragmento de esa página que respalda la respuesta correcta / el punto clave / el par** del ejercicio, no cualquier frase del tema. Corta pero con sentido (≈ 5 a 25 palabras), copiada **exactamente** (misma ortografía y acentos).
   - El importador la busca en el texto del PDF; si no aparece queda "sin verificar" y la app lo muestra al estudiar ("cita sin verificar"). Una página sin texto seleccionable (escaneo, manuscrito) no se puede verificar: léela bien y cita con cuidado. Avisa si la cita tiene menos de 3 palabras.
   - No escribas `verified` en el paquete: lo decide solo el importador (se ignora).
3. **Si el material no alcanza para un ejercicio, no lo crees.** Es preferible una lección más corta.
4. Lo único inventable son **frases para recordar** (reglas mnemotécnicas en la `rule` de un dato clave); el contenido que respaldan sí debe estar en el material.
5. Redacta en español, claro y breve.

## 4. Qué tipos usar por materia (spec §4)

| Tipo (`kind`) | Cuándo |
|---|---|
| `dato_clave` | Todas las materias: contrasta dos conceptos que se confunden y cierra con una regla. |
| `relacionar` | Todas: 3 a 6 pares término/definición. |
| `caso_practico` | Solo **Telecomunicaciones I** y **Administración de la función informática**. |
| `abierta` | Sobre todo **Derecho informático**: 2 a 6 `keyPoints` + `modelAnswer`. |
| `calculo` | Solo si la unidad **trata subneteo** (Telecom). Es `{ "kind": "calculo", "generator": "subneteo", "concept": "..." }`: sin `source`, pero **`concept` es obligatorio** como en todos. No hay otros generadores. |

Reglas de calidad por tipo:
- **caso_practico**: una situación realista (`scene`), una `question`, **exactamente una** opción `correct: true`, y **cada opción incorrecta con `whyWrong`** que explique por qué *esa* opción es errónea (no una frase genérica). `explanation` explica la correcta.
- **relacionar**: pares sin ambigüedad (cada definición encaja con un solo término).
- **abierta**: `keyPoints` son elementos que la respuesta debe incluir (2 a 6); `modelAnswer` los cubre todos.
- **dato_clave**: `left` y `right` son los dos conceptos confundibles (título + viñetas) y `rule` la regla corta para distinguirlos.

## 5. Tamaño y estructura

- Define `concepts` (`key` único + `name`): uno por idea evaluada; cada ejercicio apunta a uno con `concept`. Sirven para las estadísticas de "lo que te cuesta".
- Una partida muestra **un solo ejercicio por grupo de variantes** (`group`; por omisión `concepto:tipo`). Lo que cuenta para el tamaño de la lección son los **grupos distintos**, no las filas.
- **Lecciones de 6 a 10 grupos distintos** (~5 min; el esquema acepta 1 a 12 grupos y hasta 36 filas). El importador imprime por lección "X ejercicios por partida (Y en total)" y avisa si X < 6. Agrupa por tema y **mezcla tipos**.
- **2 a 3 variantes por grupo**: ejercicios distintos que evalúan la misma idea comparten `group` y van **en la misma lección** (no repartas las variantes entre lecciones).
- `files`: **todos** los archivos de la carpeta de la unidad, se citen o no, con `kind` `pdf` o `imagen` y nombres idénticos a los del disco.

## 6. Escribir, validar, importar

1. Escribe el paquete en `contenido/<materia-slug>-u<N>-<AAAA-MM-DD>.json` (slug en minúsculas, sin acentos, con guiones; p. ej. `contenido/telecomunicaciones-i-u2-2026-11-04.json`). `contenido/` no se sube a GitHub.
2. **Siempre primero** `npm run importar -- contenido/<archivo>.json --dry-run`. No escribe nada; imprime avisos (`AVISO ...`) y un resumen (`Unidad N · X lecciones nuevas · Y ejercicios · Z citas sin verificar`).
3. Corrige el JSON y repite hasta que no haya errores. Atiende todo aviso que indique una cita mal puesta ("la cita no aparece...", "página corregida", "sin cita textual"): arregla `quote` y `page` leyendo de nuevo la página. Deja en cero las "citas sin verificar" de PDFs.
   El resumen tiene la forma `Unidad N · X lecciones nuevas · Y ejercicios · Z citas sin verificar` (más "citas no verificables (sin texto)" si hay páginas escaneadas) y, por lección, `<título>: X ejercicios por partida (Y en total)`.
4. **Muéstrale al usuario el resumen y los avisos y pregunta antes de importar de verdad.** Solo con su sí, ejecuta `npm run importar -- contenido/<archivo>.json`. Un mismo archivo no se importa dos veces (se detecta por hash). Si la unidad ya tiene lecciones, las nuevas se agregan al final (el importador avisa con el conteo y se niega si un título ya existe, salvo `--force`). Si falta un archivo, una `page` excede las páginas del PDF o hay otro error, no se escribe nada.

Nunca ejecutes `npm run db:seed`.

## 7. Modo reemplazo (ejercicios reportados)

Cuando el usuario pida reemplazar los reportados:
1. Corre `npm run reportados`. Lista, por materia y unidad, los ejercicios reportados pendientes: id, **id de lección**, concepto, fuente (archivo y página), **`group` exacto** y texto.
2. Lee esa fuente (y alrededor) en `material/<Materia>/<N>/` y entiende qué estaba mal.
3. Genera un paquete de la misma unidad cuyas lecciones sean `{ "lessonId": "<uuid>", "exercises": [...] }` (en vez de `title`; exactamente uno de los dos). Cada reemplazo lleva **el `group` exacto que imprimió `reportados`** (ponlo como `group` explícito), el nombre exacto del concepto y el mismo `kind`; así el importador limpia ese reportado (uno por ejercicio nuevo, de la misma lección y grupo). Cumple todas las reglas anteriores. Los `lessonId` deben pertenecer a esa unidad. El paquete debe seguir llenando `unit` (el título tal como está en la unidad) y `files` con archivos que existan en disco.
4. Mismo flujo: `contenido/<materia-slug>-u<N>-<fecha>-reemplazo.json`, `--dry-run`, mostrar resumen y avisos, preguntar, importar. Después, `npm run reportados` ya no debe listarlos (y si algún ejercicio nuevo no reemplaza a ninguno, el importador avisa: revisa el `group`).

## Ejemplos por tipo

Cada bloque es un ejercicio (va dentro de `exercises`). Se validan contra el esquema en `src/lib/content/skill-examples.test.ts`.

`dato_clave`:

```json ejercicio
{
  "kind": "dato_clave",
  "concept": "contrato",
  "title": "Contrato vs. convenio",
  "lead": "Se confunden porque ambos son acuerdos de voluntades.",
  "left": { "title": "Contrato", "bullets": ["Crea o transfiere derechos y obligaciones"] },
  "right": { "title": "Convenio", "bullets": ["Modifica o extingue derechos y obligaciones"] },
  "rule": { "headline": "Crea = contrato. ", "text": "Si solo modifica o extingue, es convenio." },
  "source": { "file": "tema1.pdf", "page": 3, "quote": "el contrato crea o transfiere derechos y obligaciones; el convenio los modifica o extingue" }
}
```

`relacionar` (3 a 6 pares):

```json ejercicio
{
  "kind": "relacionar",
  "concept": "contrato",
  "prompt": "Relaciona cada término con su definición",
  "pairs": [
    { "term": "Oferta", "definition": "Propuesta que una parte hace a otra" },
    { "term": "Aceptación", "definition": "Conformidad con los términos de la oferta" },
    { "term": "Objeto", "definition": "Cosa o hecho sobre el que recae el contrato" }
  ],
  "source": { "file": "tema1.pdf", "page": 4, "quote": "la oferta es la propuesta y la aceptación la conformidad con ella" }
}
```

`caso_practico` (una opción correcta; cada incorrecta con `whyWrong`):

```json ejercicio
{
  "kind": "caso_practico",
  "concept": "contrato",
  "scene": "Una empresa envía por correo una propuesta de servicio y el cliente responde que sí.",
  "question": "¿Qué elemento del contrato representa la respuesta del cliente?",
  "options": [
    { "text": "La aceptación", "correct": true },
    { "text": "La oferta", "correct": false, "whyWrong": "La oferta es la propuesta de la empresa, no la respuesta del cliente." },
    { "text": "El objeto", "correct": false, "whyWrong": "El objeto es el servicio contratado, no la conformidad con él." }
  ],
  "explanation": "La conformidad con los términos de la propuesta es la aceptación.",
  "source": { "file": "tema1.pdf", "page": 4, "quote": "la aceptación es la conformidad con los términos de la oferta" }
}
```

`abierta` (2 a 6 `keyPoints`):

```json ejercicio
{
  "kind": "abierta",
  "concept": "contrato",
  "question": "¿Qué es un contrato?",
  "modelAnswer": "Un acuerdo de voluntades que crea o transfiere derechos y obligaciones.",
  "keyPoints": ["acuerdo de voluntades", "crea o transfiere derechos y obligaciones"],
  "source": { "file": "tema1.pdf", "page": 3, "quote": "el contrato es un acuerdo de voluntades para crear o transferir derechos y obligaciones" }
}
```

`calculo` (solo si la unidad trata subneteo; sin `source`, con `concept`):

```json ejercicio
{ "kind": "calculo", "generator": "subneteo", "concept": "contrato" }
```

## Ejemplo mínimo válido

```json
{
  "subject": "Derecho informático",
  "unit": { "number": 1, "title": "Introducción" },
  "files": [{ "name": "tema1.pdf", "kind": "pdf" }],
  "concepts": [{ "key": "contrato", "name": "Contrato" }],
  "lessons": [
    {
      "title": "Contratos",
      "exercises": [
        {
          "kind": "abierta",
          "concept": "contrato",
          "group": "contrato-def",
          "question": "¿Qué es un contrato?",
          "modelAnswer": "Un acuerdo de voluntades que crea o transfiere derechos y obligaciones.",
          "keyPoints": ["acuerdo de voluntades", "crea o transfiere derechos y obligaciones"],
          "source": { "file": "tema1.pdf", "page": 3, "quote": "el contrato es un acuerdo de voluntades para crear o transferir derechos y obligaciones" }
        }
      ]
    }
  ]
}
```
