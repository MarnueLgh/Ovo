# Ovo: diseño

**Fecha:** 3 de noviembre de 2026
**Estado:** borrador para aprobación
**Bocetos y prototipos de referencia:** `.superpowers/brainstorm/1054-1793762987/content/`
- `estructura-v2.html`: camino de la materia y panel de estadísticas (estilo aprobado)
- `leccion.html`: lección con dato clave, relacionar con cables y caso práctico con "¿Por qué?"
- `subneteo.html`: ejercicio de cálculo paso a paso

---

## 1. Qué es y por qué existe

Ovo es una app de estudio **personal y para un solo usuario**: un estudiante de informática. Convierte los PDFs de los profesores y los apuntes propios en lecciones cortas e interactivas al estilo Duolingo, con ejercicios variados y exámenes por unidad que hay que aprobar para avanzar.

**El problema que resuelve.** Las herramientas que usa ahora, como NotebookLM y sus flashcards, sí le dan el contenido, pero estudiar con ellas se vuelve aburrido y pasivo. Además, el usuario reconoce que **memoriza en lugar de comprender**, y por eso olvida.

**Lo que busca, en sus palabras:**
- Volver todos los días gracias a la **racha**, igual que en Duolingo.
- Reforzar cada concepto **en situaciones distintas**, no repetir la misma tarjeta.
- Ejercicios prácticos, no solo teoría.
- Saber que entendió un tema porque **aprobó el examen de la unidad**.

**El objetivo de fondo es comprender, no recordar.** Cada tipo de ejercicio debe obligar a aplicar, comparar o razonar. Un ejercicio que se resuelve solo con memoria de definiciones va en contra del producto, con una excepción: las respuestas abiertas de Derecho (sección 4.5), porque así son los exámenes reales de esa materia.

## 2. Metas, no-metas y anti-metas

**Metas de la primera versión**
- Materias, cada una dividida en unidades. Cada unidad tiene sus PDFs.
- Al subir los PDFs de una unidad, la IA genera las lecciones y el examen de esa unidad.
- Un camino por materia con lecciones de unos 5 minutos, más un examen al final de cada unidad que desbloquea la siguiente.
- Cinco tipos de ejercicio (sección 4).
- Racha diaria y un panel de estadísticas (sección 5).
- Uso en laptop y en iPhone como PWA instalada.

**No-metas (quedan fuera de la primera versión)**
- **Ejercicios de programación** (Java para Implementación de sistemas y SQL para BD). Se retoman después.
- Contar qué porcentaje del PDF ya se cubrió. **El usuario lo rechazó explícitamente; no se implementa.**
- Varios usuarios, registro de cuentas y funciones sociales.
- App nativa de iOS.
- Ejecutar modelos de IA en local.
- Énfasis en marca o branding. La mascota (un huevito con ojos) se queda por ahora, pero sin invertir más en ella.

**Anti-metas (si pasa esto, el producto falló aunque funcione)**
- Que se sienta como otra app de flashcards: pasiva y repetitiva.
- Que **califique como correcta una respuesta incorrecta** o enseñe algo falso. Por eso, todo lo que pueda calificarse con código se califica con código (sección 4).
- Que cueste más de lo que un estudiante puede pagar. El presupuesto es muy ajustado; la meta es unos $2 USD al mes.

## 3. Estructura y pantallas

El estilo visual aprobado es el de `estructura-v2.html`.

### 3.1 Jerarquía de contenido
**Materia → Unidad → Lección → Ejercicio.** Cada unidad cierra con un **examen de unidad**.

Materias del semestre actual: Telecomunicaciones I, Sistemas manejadores de BD relacionales, Implementación de sistemas, Cálculo diferencial e integral, Matemáticas financieras, Derecho informático y Administración de la función informática. La primera con la que se probará es **Telecomunicaciones I**.

### 3.2 Pantalla del camino de la materia
- Barra de navegación en forma de píldora oscura con: Camino, Panel, Material y Ajustes. La mascota va arriba.
- Fichas para cambiar de materia, más una ficha "+ Materia".
- Cabecera de la materia en un bloque de color con el nombre y **solo "Unidad N"**. El usuario pidió quitar todo lo demás.
- Por cada unidad:
  - un encabezado de color;
  - un camino en zigzag de nodos circulares con efecto de botón 3D (hecho, actual o bloqueado), con una burbuja "EMPEZAR" sobre el nodo actual;
  - al final, el bloque del examen de unidad (aprobado, bloqueado o disponible).
- Si una unidad no tiene material, se muestra el bloque "Sube los PDFs de esta unidad".
- Columna lateral con la racha, la siguiente lección (con los tipos de ejercicio que incluye y el botón "Empezar") y los PDFs de la unidad.

### 3.3 Pantalla del panel
Tal como aparece en el boceto:
- **Cuatro tarjetas de cifras grandes:** racha (con el récord), tiempo de la semana, porcentaje de aciertos y exámenes aprobados.
- **Constancia:** una cuadrícula de actividad del último año **al estilo de la gráfica de contribuciones de GitHub**. Esto lo pidió el usuario explícitamente.
- **Esta semana:** barras redondeadas con los minutos por día, con el día actual resaltado.
- **Conceptos que te cuestan:** los conceptos con más fallos, cada uno con su materia, el PDF y la página de donde salió, y un botón "Repasar".
- **Avance:** unidades aprobadas por materia, con el color de cada materia.
- **Exámenes:** historial con el porcentaje y el estado (aprobado, no aprobado o pendiente).

### 3.4 Pantalla de lección
La referencia es `leccion.html`.
- Barra de progreso arriba, botón para salir y la racha.
- Un ejercicio a la vez.
- Barra inferior para comprobar: se pinta de verde si aciertas y de rojo si fallas.
- Si fallas, aparece el botón **"¿Por qué?"**, que explica por qué tu opción específica está mal, cuál era la correcta y en qué página del PDF repasarlo.

### 3.5 Pantalla de Material
Aquí se suben y administran los PDFs de cada unidad. El boceto no la cubre; su diseño queda a criterio del constructor siguiendo el mismo estilo.

## 4. Tipos de ejercicio

Regla general: **si la respuesta se puede verificar con código, la califica el código, no la IA.** La IA genera el contenido y califica solo las respuestas abiertas.

| # | Tipo | Formato | Quién califica | Materias típicas |
|---|---|---|---|---|
| 4.1 | 💡 **Dato clave** | Compara dos conceptos que se confunden y deja una regla para recordarlos ("Iguales se cruzan") | No se califica | Todas |
| 4.2 | 🔌 **Relacionar** | Términos a la izquierda, definiciones a la derecha. Se unen arrastrando un "cable". Si es correcto se queda verde; si no, se suelta y la tarjeta se sacude | El código | Todas |
| 4.3 | 🛠️ **Caso práctico** | Una situación real con opción múltiple. Si fallas, "¿Por qué?" explica el error de la opción que elegiste | El código | Telecom, Administración de la FI |
| 4.4 | 🧮 **Cálculo paso a paso** | Varios campos, como prefijo, máscara, número mágico, hosts y una tabla de subredes. Se revisa campo por campo, se muestra "Era X" en los que fallaste y "¿Por qué?" da la solución con los números de ese ejercicio. "Otro ejercicio" genera uno nuevo para practicar sin límite | El código: **un generador y un resolvedor programados por tipo de problema** | Subneteo (Telecom). Después, Cálculo y Matemáticas financieras |
| 4.5 | ✍️ **Respuesta abierta** | "¿Qué es un contrato?" y la respondes con tus palabras | **Modo actual (sin API): autoevaluación.** Escribes tu respuesta, la app muestra la respuesta modelo y los **elementos clave** del PDF, y tú marcas cuáles incluiste. La puntuación es la proporción marcada. *Con API, más adelante: la IA (modelo barato) compara tu respuesta contra el fragmento del PDF.* | Derecho informático |

**Sobre el cálculo paso a paso.** Los generadores son código determinista, no IA. La primera versión incluye **solo subneteo**: IPv4 /24 dividido en 4, 8 o 16 subredes, como en el prototipo. Los generadores de Cálculo y Matemáticas financieras se agregan después, uno por tipo de problema.

**Una lección** dura unos 5 minutos (de 6 a 10 ejercicios) y mezcla varios tipos. Cada ejercicio generado por la IA guarda su **fuente**: el PDF y la página.

**El examen de unidad** usa los mismos tipos de ejercicio, salvo el dato clave. Es más largo (unas 25 preguntas) y cubre toda la unidad. **Se aprueba con 80%**, se puede repetir y cada intento queda en el historial.

## 5. Racha y estadísticas
- **Racha:** días seguidos en los que se completó al menos una lección o un examen.
- Se registra cada intento de cada ejercicio (si fue correcto, cuándo y cuánto tardó) para calcular las estadísticas de la sección 3.3.
- "**Conceptos que te cuestan**" sale de la tasa de error por concepto. Por eso, cada ejercicio generado se etiqueta con el concepto que evalúa.
- **"Repasar"** arma una lección corta con ejercicios nuevos o variados sobre esos conceptos.

## 6. De dónde sale el contenido (IA)

### 6.0 Modo actual: generación con Claude Code (decidido el 4 de noviembre de 2026)

Por ahora **no se usa ninguna API de IA**. El usuario genera el contenido con su membresía de Claude, a través de Claude Code. La API (sección 6.1) se agrega después sin rehacer nada, porque solo cambia **quién produce el JSON**.

**Flujo:**
1. El usuario guarda los PDFs y las fotos de una unidad en una carpeta local del proyecto: `material/<materia>/<unidad>/`.
2. Le pide a Claude Code que genere la unidad. Claude Code lee el material y escribe un **paquete JSON** de la unidad en `contenido/`. Se aplican las mismas reglas de esta sección: todo sale solo del material y cada ejercicio cita su página.
3. Un script (`npm run importar`) valida el paquete con los mismos esquemas de la app, verifica las citas contra el texto del PDF y lo guarda en Postgres. Si una unidad ya tiene lecciones, las nuevas **se agregan al final**.
4. El contenido aparece en la app, tanto en la laptop como en el iPhone.

**Diferencias con el modo API:**
- **Respuesta abierta:** se resuelve con autoevaluación (ver 4.5).
- **"Esto está mal":** el ejercicio sale de circulación y queda marcado como reportado. Claude Code genera el reemplazo la próxima vez que se le pida, leyendo la lista de reportados.
- **Subir material desde el iPhone:** no está incluido en este modo. El material vive en la laptop.
- **Privacidad:** `material/` y `contenido/` no se suben a GitHub.

### 6.1 Modo API (más adelante)

**Regla principal, pedida por el usuario: todo sale únicamente del material subido.** Esto incluye el texto, las imágenes, los diagramas y los apuntes a mano. La IA **no usa su propio conocimiento**:
- Cada pregunta, respuesta correcta, opción incorrecta, explicación de "¿Por qué?" y elemento clave de una respuesta abierta debe estar respaldado por una página del material.
- Si el material no basta para crear un ejercicio, ese ejercicio no se crea.
- Lo único que la IA puede inventar son **ayudas para recordar**, como la frase "Iguales se cruzan". Aun así, el dato que resumen debe venir del material.
- Esta regla va en todos los prompts y se refuerza con la verificación de citas que se describe más abajo.

**Qué tipo de material sube el usuario:** presentaciones con texto, diagramas importantes, imágenes y **fotos de apuntes a mano**. Por eso:
- La app acepta **PDF e imágenes** (JPG, PNG y HEIC desde el iPhone).
- El modelo recibe las páginas **también como imagen**, no solo el texto extraído, para que pueda leer diagramas y escritura a mano.

**Botón "Esto está mal":** cada ejercicio lo tiene. Al presionarlo, el ejercicio sale de circulación, sus intentos dejan de contar en las estadísticas y se genera un reemplazo a partir de la misma página. Las unidades se publican al instante, sin pasar por una revisión previa.

**Flujo:**
1. Subes los PDFs o las imágenes de una unidad.
2. Se guardan en la nube.
3. Se envían a la IA para generar las lecciones y el examen de la unidad, con salida estructurada (JSON validado).
4. Se guardan en Postgres.

Cada ejercicio queda listo antes de que lo abras; no se genera en vivo.

- **Sin RAG ni búsqueda vectorial en la primera versión.** Los PDFs de una unidad caben completos en lo que el modelo puede leer de una vez, así que se envían tal cual. Si algún día hay documentos enormes, se agrega `pgvector`.
- **Citas de página:** el modelo devuelve la página y el texto citado de cada ejercicio. Como los modelos de OpenAI no tienen citas nativas de PDF, la app **verifica con código que el texto citado aparezca en esa página** del texto extraído. Si no coincide, se busca en qué página está o se marca la cita como dudosa. En páginas sin texto seleccionable, como fotos, apuntes a mano o diagramas, la cita guarda la página o la imagen sin verificar el texto. Ahí el botón "Esto está mal" es la red de seguridad.
- **Modelos** (los eligió el usuario por costo):
  - **GPT-6.1 Terra** (`gpt-6.1-terra`, $1 / $5 por millón de tokens) para generar lecciones, exámenes y explicaciones.
  - **GPT-6 Luna** (`gpt-6-luna`, $0.10 / $0.50) para calificar las respuestas abiertas.
- **Sin amarrarse a un proveedor:** se usa una librería que soporta varios, como el AI SDK de Vercel, para poder cambiar a Gemini o Claude cambiando una línea. Los precios cambian seguido.
- **Presupuesto:** unos $2–3 USD al mes según la estimación. Enviar las páginas como imagen consume más tokens que el texto solo, pero con GPT-6.1 Terra a $1 por millón de tokens de entrada sigue siendo barato: unos centavos por unidad. Los cálculos no gastan IA.

**Materias sin ejercicios especiales en la primera versión** (Cálculo, Matemáticas financieras, BD e Implementación de sistemas): se pueden crear y generar **solo con los tipos de teoría**, es decir, dato clave, relacionar, caso práctico y respuesta abierta. Sus generadores de cálculo y sus ejercicios de código llegan después.

## 7. Cómo se construye (stack)

| Parte | Elección | Notas |
|---|---|---|
| App | **Next.js con TypeScript** | Un solo proyecto para la interfaz y el servidor |
| Base de datos | **PostgreSQL en Supabase** | El usuario quería PostgreSQL. Supabase también da almacenamiento de archivos (para los PDFs) y autenticación, así que son menos piezas |
| Hosting | **Vercel**, plan gratuito | Ver la decisión en la sección 9 |
| ORM | Drizzle | A criterio del constructor |
| Estilos y animación | CSS puro, sin kit de componentes ni librería de animación | Usa los tokens de los bocetos |
| Instalación | **PWA** (manifiesto e íconos) para instalarla en el iPhone desde Safari y en la laptop | Diseño adaptable: celular y escritorio |
| Acceso | **Inicio de sesión de un solo usuario** (Supabase Auth, sin registro abierto) | Obligatorio, porque la app está en internet y usa una clave de API que cuesta dinero |

## 8. Dirección visual

El estilo aprobado se ve en `estructura-v2.html`, inspirado en las referencias del usuario (apps de aprendizaje con bloques de color) y en Duolingo y Brilliant.

- **Tema claro** y fondo lila muy suave. Bloques grandes de color pastel con esquinas muy redondeadas.
- **Un color por materia:** lila para Telecom, cielo para BD, durazno para Java y menta para Cálculo. A las demás se les asigna uno de la misma familia.
- **Tipografía:** Rubik. Las cifras van grandes y en negritas.
- **Movimiento** (se pidió "más catchy y animado"):
  - entrada escalonada de las tarjetas;
  - nodos con efecto de botón 3D que se hunden al presionarlos;
  - burbuja "EMPEZAR" que flota;
  - flama de la racha en movimiento;
  - la cuadrícula de constancia se llena cuadro por cuadro y las barras crecen al entrar.
- **Reglas de movimiento:** solo se animan `transform` y `opacity`, con curvas ease-out fuertes, a menos de 300 ms en la interfaz, sin animar acciones de teclado, y respetando `prefers-reduced-motion`.
- **Accesibilidad básica:** buen contraste, foco visible, nombres accesibles en los botones de ícono y encabezados en orden.

## 9. Decisiones del asistente (no confirmadas por el usuario)
- **Vercel en lugar de Cloudflare Pages.** El usuario propuso Cloudflare y Supabase. Supabase se adoptó. Para el hosting elegí Vercel porque Next.js funciona ahí sin adaptadores. Cloudflare también es viable con el adaptador OpenNext, solo que con más configuración y límites de CPU por petición. Cualquiera de los dos sirve.
- Las lecciones duran unos 5 minutos y tienen de 6 a 10 ejercicios. El examen tiene unas 25 preguntas.
- El examen se aprueba con 80% y se puede repetir sin límite.
- El examen no incluye datos clave.
- La racha cuenta un día cuando se completa al menos una lección o un examen.
- La generación por unidad se hace en varias llamadas (una por lección y otra por el examen), para que ninguna petición tarde demasiado en el hosting.
- **Variedad al repetir:** al generar una unidad se crean de 2 a 3 variantes por concepto. Repetir una lección o usar "Repasar" toma variantes que todavía no has visto. El número de lecciones por unidad depende de cuánto material traen los PDFs y no es fijo. Los ejercicios de cálculo no necesitan esto, porque el código genera uno nuevo cada vez.
- **PDFs agregados después:** si subes más material a una unidad que ya tiene lecciones, se **agregan lecciones nuevas** al final y las existentes no se tocan. Así se conservan el progreso, el historial y las estadísticas. Los conceptos tienen un ID estable.
- **Crédito parcial:** en el cálculo paso a paso, la calificación es proporcional a los campos correctos. En la respuesta abierta, es proporcional a los elementos clave que incluiste. El 80% del examen y el porcentaje de aciertos del panel se calculan con ese crédito parcial.

## 10. Lo que queda a criterio del constructor
- El esquema exacto de la base de datos.
- Cómo se extrae el texto por página de los PDFs.
- El diseño de la pantalla de Material y de Ajustes, siguiendo el estilo aprobado.
- Los prompts de generación y calificación.
- Cómo se adapta cada pantalla a celular.
- El orden en que se construyen las cosas.
