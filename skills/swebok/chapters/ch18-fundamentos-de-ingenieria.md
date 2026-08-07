# Capítulo 18: Fundamentos de ingeniería

## Idea central
Todas las disciplinas de ingeniería —incluida la de software— comparten un mismo proceso de resolución de problemas y un mismo conjunto de herramientas de pensamiento (abstracción, métodos empíricos, modelado/simulación, teoría de la medición, análisis de causa raíz); dominarlas como disciplina transversal evita reinventar mal lo que la ingeniería ya resolvió bien.

## Marcos que introduce
- **El proceso de ingeniería**: iterativo pese a presentarse como lineal; el conocimiento adquirido en cualquier paso puede obligar a repetir pasos anteriores.
  - Cuándo usarlo: para cualquier decisión de ingeniería, desde elegir un algoritmo hasta definir la arquitectura de un sistema completo.
  - Cómo: 1) comprender el problema real (usar análisis de causa raíz para hallar el problema subyacente, no el síntoma pedido), 2) definir criterios de selección, 3) identificar todas las soluciones técnica y razonablemente factibles, 4) evaluar cada solución contra los criterios, 5) seleccionar la alternativa preferida, 6) monitorear el rendimiento de la solución elegida (las estimaciones pueden fallar).
- **Niveles de medición**: determinan qué manipulaciones aritméticas/estadísticas son válidas sobre un dato.
  - Cuándo usarlo: antes de aplicar cualquier operación (promedio, resta, ratio) a una métrica, para no violar su escala.
  - Cómo: **nominal** (solo igual/distinto y conteo — p. ej. estilos de automóvil); **ordinal** (añade orden estricto y transitivo — p. ej. niveles CMMI); **intervalo** (añade suma/resta con distancia constante entre valores adyacentes — p. ej. grados Celsius); **razón** (añade multiplicación/división porque el cero representa ausencia del atributo — p. ej. dinero, líneas de código); **absoluta** (razón sin transformación posible — p. ej. número de personas).
- **Técnicas de análisis de causa raíz (RCA)**: identifican por qué ocurrió un resultado indeseable, no solo su síntoma.
  - Cuándo usarlo: ante defectos recurrentes, evaluación de riesgos de proyecto, o antes de iniciar cualquier esfuerzo de mejora de proceso.
  - Cómo (encadenamiento hacia atrás, del efecto a la causa): análisis de cambios, técnica de los 5 por qué, diagramas de causa-efecto/Ishikawa (espina de pescado, agrupa causas en personas/proceso/herramientas/materiales/medición/entorno), análisis del árbol de fallas (FTA, sí distingue relaciones "y"/"o"), mapa de causas (exige evidencia de causalidad), árbol de la realidad actual, evaluación del desempeño humano (detección → comprensión → selección → ejecución de la acción). El **FMEA** es la excepción: encadena hacia adelante, de elementos que pueden fallar a sus efectos.
- **Proceso sistemático de mejora basado en causa raíz**: 1) seleccionar el problema (Pareto, priorización frecuencia-severidad, control estadístico de procesos), 2) recopilar evidencia, 3) identificar la causa raíz con una técnica de RCA, 4) seleccionar acciones correctivas (que eviten recurrencia, sean controlables, cumplan objetivos organizacionales y no generen otros problemas), 5) implementarlas, 6) observar su eficacia.
- **Paradigma Objetivo-Pregunta-Métrica (GQM)**: toda medición debe existir para respaldar una decisión concreta, dentro o fuera del código.

## Conceptos clave
- **Abstracción**: proceso y resultado de reducir información sobre un problema para centrarse en el panorama general, permitiendo mayor precisión conceptual, no menos ("el propósito de la abstracción no es ser vago, sino crear un nuevo nivel semántico en el que se pueda ser absolutamente preciso" — Dijkstra).
- **Encapsulación**: mecanismo que implementa la abstracción ocultando detalles de niveles inferiores/superiores tras una interfaz.
- **Problema perverso (wicked problem)**: término de Rittel para problemas de diseño que solo pueden definirse resolviéndolos (parcialmente), y esa solución no es definitiva — hay que resolverlo de nuevo para obtener una solución que funcione.
- **Definición operativa**: especifica el método o procedimiento exacto para tomar una medición; sin ella, una medición aparentemente simple (como la altura de una persona) produce resultados inconsistentes.
- **Confiabilidad vs. validez de una medición**: confiabilidad es la consistencia de resultados al repetir la medición (evaluable con test-retest, formas alternativas, división por mitades, consistencia interna); validez es si el método mide realmente lo que pretende medir (de constructo, de criterio, de contenido).
- **Medida directa vs. derivada**: directa es un conteo simple (defectos detectados); derivada combina medidas directas (promedio de horas por defecto reparado) respetando el tipo de escala de cada componente.
- **Estudio observacional/de caso vs. experimento diseñado vs. estudio retrospectivo**: el experimento manipula variables independientes bajo hipótesis clara; el observacional estudia el fenómeno en su contexto real sin manipularlo; el retrospectivo analiza datos históricos archivados.
- **Norma/estándar**: objeto de comparación, tolerancia permitida o grado de excelencia requerido, construido por consenso para promover entendimiento y reconocer comportamientos deseados.

## Modelos mentales
- Trata el diseño como resolución de un problema perverso: no esperes definirlo por completo antes de empezar a resolverlo; espera iterar.
- Antes de aplicar una operación aritmética a un dato, pregúntate a qué escala de medición pertenece: promediar niveles CMMI (ordinal) como si fueran números de razón produce afirmaciones sin sentido, aunque el lenguaje de programación no te lo impida.
- Antes de medir algo, pregúntate qué decisión depende de esa medición (GQM); si ninguna, es "medición para los meramente curiosos" y debe evitarse.
- Piensa en modelado/simulación/prototipado como tres formas de abstracción con distinto propósito: el modelo icónico se parece al artefacto, el analógico se comporta como él, el simbólico lo representa con símbolos (ecuaciones) — elige según qué necesitas estudiar.

## Antipatrones
- **Aplicar aritmética a datos ordinales**: promediar, sumar o comparar por multiplicación niveles de una escala ordinal (p. ej. "el nivel CMMI promedio es 1.76") produce conclusiones erróneas aunque el cálculo sea "correcto".
- **Medir sin propósito de decisión**: recopilar métricas solo porque son fáciles de obtener o interesantes de graficar, sin que ninguna decisión dependa de ellas — desperdicio de tiempo y energía.
- **Tratar solo síntomas y no causas raíz**: sin un RCA formal, los defectos recurrentes seguirán reapareciendo bajo otra forma.
- **Omitir la definición operativa de una métrica**: sin especificar el método exacto de medición, resultados aparentemente comparables no lo son (ej. "altura" sin especificar hora del día, calzado, precisión esperada).
- **Ignorar el tipo de escala al programar**: los lenguajes comunes no impiden sumar/multiplicar variables de escala ordinal o nominal; hasta que existan lenguajes conscientes de la teoría de la medición, hay que vigilarlo en revisión de código.

## Tablas de referencia
| Escala | Operación válida añadida | Ejemplo |
|---|---|---|
| Nominal | Igual/distinto, conteo | Estilo de automóvil, título de puesto |
| Ordinal | Orden estricto y transitivo (>, <) | Nivel de madurez CMMI, severidad |
| Intervalo | Suma y resta (diferencia constante) | Grados Celsius/Fahrenheit, fechas de calendario |
| Razón | Multiplicación y división (cero = ausencia) | Dinero, líneas de código, conteo de construcciones |
| Absoluta | Razón sin transformación posible | Número de personas en un proyecto |

| Técnica RCA | Dirección de encadenamiento | Rasgo distintivo |
|---|---|---|
| 5 por qué | Hacia atrás (efecto→causa) | Preguntas repetidas hasta aislar la causa |
| Diagrama de Ishikawa | Hacia atrás | Agrupa causas en categorías (personas, proceso, herramientas...) |
| Árbol de fallas (FTA) | Hacia atrás | Distingue relaciones "y" / "o" entre causas |
| FMEA | Hacia adelante (causa→efecto) | Parte de elementos que pueden fallar |
| Mapa de causas | Ambas direcciones | Exige evidencia de causalidad, más riguroso |

## Puntos clave
- Usa el mismo proceso de ingeniería de 6 pasos para decisiones grandes y pequeñas; ajusta el rigor a la gravedad de una decisión errónea, no el proceso en sí.
- Verifica la escala de medición de cada métrica antes de promediarla, sumarla o compararla proporcionalmente.
- Exige una definición operativa explícita para cualquier métrica que vaya a compararse entre equipos, momentos o proyectos.
- Aplica RCA antes de proponer una acción correctiva; sin causa raíz identificada, la corrección solo trata el síntoma.
- No midas sin una pregunta y una decisión detrás (GQM); elimina métricas que no informen ninguna acción.

## Conecta con
- **Economía de la Ingeniería de Software**: comparte el mismo proceso de decisión de ingeniería (aquí Figura 18.2, allá Figura 15.3) — esa KA lo desarrolla en profundidad para el caso financiero.
- **Calidad del Software**: el análisis de causa raíz es la base técnica del análisis causal de defectos y la mejora de procesos descritos en esa KA.
- **Fundamentos Matemáticos**: el análisis estadístico, la probabilidad y las distribuciones (binomial, Poisson, normal) usadas aquí se definen formalmente en esa KA.
- **Gestión de Ingeniería de Software**: la medición vía GQM y los estándares de proceso conectan directamente con la planificación y el control de proyectos.
