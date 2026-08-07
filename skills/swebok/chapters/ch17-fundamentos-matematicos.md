# Capítulo 17: Fundamentos matemáticos

## Idea central
El código solo puede escribirse para algo con lógica clara y bien entendida: este KA no trata aritmética, sino los sistemas formales (lógica, conjuntos, gramáticas, autómatas) que permiten a un ingeniero de software razonar y demostrar con precisión absoluta, y verificar que la lógica del código sea coherente con las abstracciones que representa.

## Marcos que introduce
- **Técnicas de demostración**: formas exactas de establecer con rigor la verdad de una afirmación.
  - Cuándo usarlo: para verificar que una propiedad del sistema/algoritmo se cumple siempre, no solo en los casos probados.
  - Cómo: **prueba directa** — asumir p verdadera y derivar que q debe serlo; **prueba por contradicción** — asumir ¬p→q donde q es una contradicción; **prueba por contraposición** — demostrar ¬q→¬p en vez de p→q; **prueba por inducción** — paso base (P(1) verdadero) + paso inductivo (asumir P(k) y demostrar P(k+1)); **prueba con ejemplo** — solo válida cuando el enunciado es existencial ("existe"), nunca para universales.
- **Jerarquía de Chomsky**: clasifica gramáticas formales por la forma de sus reglas de producción, de más a menos general: Tipo 0 (gramática de estructura de frase, PSG, sin restricciones) ⊃ Tipo 1 (sensible al contexto, CSG: el lado derecho nunca es más corto que el izquierdo) ⊃ Tipo 2 (libre de contexto, CFG: el lado izquierdo tiene longitud 1) ⊃ Tipo 3 (regular: fragmentos son terminales simples o un par terminal+no terminal).
  - Cuándo usarlo: al diseñar o elegir el reconocedor de un lenguaje (parser, compilador, validador de sintaxis); los lenguajes libres de contexto son la base teórica de la sintaxis de la mayoría de los lenguajes de programación.
- **Máquina de Estados Finitos (FSM)**: abstracción formal M = (S, I, O, F, g, s) — conjunto de estados S, símbolos de entrada I, símbolos de salida O, función de transición F, función de salida g, estado inicial s.
  - Cuándo usarlo: para modelar cualquier sistema cuyo comportamiento dependa de un número finito de estados y transiciones dirigidas por entradas (protocolos, parsers léxicos, controladores).
  - Cómo: definir S, I, O explícitamente; la capacidad de información es c = log|S|, por lo que una máquina de c bits tiene 2^c estados.
- **Reglas de conteo**: regla de la suma (tareas mutuamente excluyentes: n₁+n₂ formas), regla del producto (tareas secuenciales: n₁·n₂ formas), principio de inclusión-exclusión (para tareas no disjuntas, restar la intersección para no contar dos veces).

## Conceptos clave
- **Proposición**: afirmación verdadera o falsa, pero no ambas ni ninguna; la base de la lógica proposicional (tautología, contradicción, contingencia, equivalencia lógica ≡).
- **Predicado y cuantificador**: un predicado describe una propiedad o relación con variables libres; el cuantificador universal (∀x) afirma algo para todo valor, el existencial (∃x) para al menos uno — la lógica de predicados existe porque la proposicional no puede representar enunciados como "todo x mayor que 1" ni capturar la equivalencia entre "no todos... " y "algunos no...".
- **Función vs. relación**: toda función es una relación, pero no toda relación es función; una relación R(X,Y) es función solo si cada elemento de X corresponde a exactamente un elemento de Y (verificable con la prueba de la línea vertical sobre su gráfica).
- **Árbol binario de búsqueda (BST)**: árbol binario donde cada nodo es mayor que todo su subárbol izquierdo y menor que todo su subárbol derecho.
- **Lenguaje formal**: conjunto de cadenas finitas sobre un alfabeto, definido por una gramática G=(V,T,S,P) con vocabulario V, terminales T, símbolo de inicio S y reglas de producción P.
- **Exactitud vs. precisión**: exactitud es la cercanía de un valor medido/calculado al valor real; precisión es la concordancia entre dos o más valores medidos del mismo valor — no son lo mismo.
- **Grupo, monoide, anillo**: estructuras algebraicas por número de propiedades que cumplen — un monoide es un conjunto cerrado y asociativo con identidad (no requiere inversos); un grupo añade inverso a cada elemento; un anillo añade una segunda operación distributiva sobre la primera.

## Modelos mentales
- Usa prueba por inducción cuando necesites demostrar que una propiedad vale para una secuencia infinita indexada por enteros: basta el caso base + la implicación P(k)→P(k+1), no asumas P(k) verdadero para todo k de antemano.
- Cuando una prueba directa es incómoda, prueba por contradicción o por contraposición: asume lo contrario de lo que quieres probar y busca el absurdo, o demuestra la implicación inversa de la negación.
- Piensa en el alcance de una variable ligada por un cuantificador como el alcance de una variable en un lenguaje estructurado por bloques: se une al cuantificador que la envuelve más de cerca.
- Antes de aceptar una "demostración con ejemplos", pregúntate si el enunciado es existencial (basta un caso) o universal (un ejemplo nunca basta y es una generalización inapropiada).

## Antipatrones
- **Usar demostración con ejemplos para afirmaciones universales**: mostrar que p→q se cumple en uno o varios casos no demuestra que se cumple siempre; es una generalización inapropiada frecuente.
- **Tratar proposiciones lógicamente equivalentes como fenómenos separados**: "no todos... " y "algunos no..." son equivalentes, pero la lógica proposicional no tiene mecanismo para verlo — señal de que hace falta lógica de predicados, no una regla ad hoc por caso.
- **Confundir precisión con exactitud al reportar mediciones o resultados numéricos**: alta precisión (concordancia entre mediciones repetidas) no implica alta exactitud (cercanía al valor real), y viceversa.

## Tablas de referencia
| Tipo de gramática (Chomsky) | Restricción en las reglas | Reconoce |
|---|---|---|
| Tipo 0 – PSG (estructura de frase) | Sin restricción | Cualquier lenguaje computable |
| Tipo 1 – CSG (sensible al contexto) | \|lado derecho\| ≥ \|lado izquierdo\| | Lenguajes sensibles al contexto |
| Tipo 2 – CFG (libre de contexto) | Lado izquierdo de longitud 1 | Sintaxis de la mayoría de lenguajes de programación |
| Tipo 3 – Regular | Lado derecho = terminal, o terminal+no terminal | Expresiones regulares |

## Puntos clave
- Elige la técnica de demostración según la forma del enunciado: existencial → ejemplo basta; universal sobre enteros → inducción; implicación difícil de probar directo → contradicción o contraposición.
- Usa la jerarquía de Chomsky para decidir qué tipo de parser/reconocedor necesitas: la mayoría de los lenguajes de programación solo requieren gramáticas libres de contexto (Tipo 2).
- Modela cualquier componente con comportamiento dirigido por eventos como una FSM explícita antes de codificarlo: fuerza a enumerar estados y transiciones.
- No reportes precisión donde se espera exactitud (o viceversa): son propiedades distintas de una medición o cálculo.

## Conecta con
- **Fundamentos de la Informática**: las notaciones asintónicas, los grafos, árboles y estructuras de datos se usan allí de forma aplicada; aquí se definen formalmente.
- **Fundamentos de Ingeniería**: el análisis estadístico y la teoría de la medición de esa KA se apoyan en los conceptos de probabilidad discreta y precisión/exactitud definidos aquí.
- **Seguridad del Software**: la aritmética modular y los números primos de la teoría de números son la base de los esquemas de criptografía de clave pública mencionados en Seguridad.
