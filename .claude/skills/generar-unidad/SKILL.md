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

## 2. Leer TODO el material

Lista `material/<Materia>/<N>/` y lee **cada archivo**, sin saltarte ninguno:
- PDF: herramienta Read con `pages`. Si tiene más de 10 páginas, léelo en rangos (`1-10`, `11-20`, …) hasta terminar.
- Imagen: Read directamente (las citas de imágenes no se pueden verificar).
Anota para cada dato el archivo y la página (1-based, tal como la numera el PDF).

## 3. Reglas de contenido (spec §6)

1. **Todo sale solo del material.** Nada de conocimiento externo, ni "lo normal en el tema".
2. Todo ejercicio que no sea `calculo` lleva `source`: `file` (nombre exacto del archivo, listado en `files`), `page` (1-based) y `quote`: fragmento **literal y corto** (una frase o menos) copiado **exactamente** de esa página (misma ortografía y acentos). El importador lo busca en el texto del PDF; si no aparece, queda "sin verificar".
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
| `calculo` | Solo si la unidad **trata subneteo** (Telecom). Es `{ "kind": "calculo", "generator": "subneteo" }`, sin `source`. No hay otros generadores. |

Reglas de calidad por tipo:
- **caso_practico**: una situación realista (`scene`), una `question`, **exactamente una** opción `correct: true`, y **cada opción incorrecta con `whyWrong`** que explique por qué *esa* opción es errónea (no una frase genérica). `explanation` explica la correcta.
- **relacionar**: pares sin ambigüedad (cada definición encaja con un solo término).
- **abierta**: `keyPoints` son elementos que la respuesta debe incluir (2 a 6); `modelAnswer` los cubre todos.
- **dato_clave**: `left` y `right` son los dos conceptos confundibles (título + viñetas) y `rule` la regla corta para distinguirlos.

## 5. Tamaño y estructura

- Define `concepts` (`key` único + `name`): uno por idea evaluada; cada ejercicio apunta a uno con `concept`. Sirven para las estadísticas de "lo que te cuesta".
- **Lecciones de 6 a 10 ejercicios** (~5 min; el esquema acepta 1 a 12). Agrupa por tema y **mezcla tipos** dentro de cada lección.
- **2 a 3 variantes por concepto**: ejercicios distintos que evalúan la misma idea comparten `group` (cadena). Una partida muestra una sola variante por grupo. Sin `group`, el importador usa `concepto:tipo` como grupo por defecto.
- `files`: todos los archivos citados, con `kind` `pdf` o `imagen`, con nombres idénticos a los del disco.

## 6. Escribir, validar, importar

1. Escribe el paquete en `contenido/<materia-slug>-u<N>-<AAAA-MM-DD>.json` (slug en minúsculas, sin acentos, con guiones; p. ej. `contenido/telecomunicaciones-i-u2-2026-11-04.json`). `contenido/` no se sube a GitHub.
2. **Siempre primero** `npm run importar -- contenido/<archivo>.json --dry-run`. No escribe nada; imprime avisos (`AVISO ...`) y un resumen (`Unidad N · X lecciones nuevas · Y ejercicios · Z citas sin verificar`).
3. Corrige el JSON y repite hasta que no haya errores. Atiende todo aviso que indique una cita mal puesta ("la cita no aparece...", "página corregida", "sin cita textual"): arregla `quote` y `page` leyendo de nuevo la página. Deja en cero las "citas sin verificar" de PDFs.
4. **Muéstrale al usuario el resumen y los avisos y pregunta antes de importar de verdad.** Solo con su sí, ejecuta `npm run importar -- contenido/<archivo>.json`. Un mismo archivo no se importa dos veces (se detecta por hash). Si la unidad ya tiene lecciones, las nuevas se agregan al final.

Nunca ejecutes `npm run db:seed`.

## 7. Modo reemplazo (ejercicios reportados)

Cuando el usuario pida reemplazar los reportados:
1. Corre `npm run reportados`. Lista, por materia y unidad, los ejercicios reportados sin reemplazo activo: id, **id de lección**, concepto, fuente (archivo y página) y texto.
2. Lee esa fuente (y alrededor) en `material/<Materia>/<N>/` y entiende qué estaba mal.
3. Genera un paquete de la misma unidad cuyas lecciones sean `{ "lessonId": "<uuid>", "exercises": [...] }` (en vez de `title`; exactamente uno de los dos). Cada reemplazo debe tener el **mismo `concept` y `kind`** (o el mismo `group`) que el reportado, para que cuente como su reemplazo, y cumplir todas las reglas anteriores. Los `lessonId` deben pertenecer a esa unidad.
4. Mismo flujo: `contenido/<materia-slug>-u<N>-<fecha>-reemplazo.json`, `--dry-run`, mostrar resumen y avisos, preguntar, importar. Después, `npm run reportados` ya no debe listarlos.

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
          "source": { "file": "tema1.pdf", "page": 3, "quote": "acuerdo de voluntades" }
        }
      ]
    }
  ]
}
```
