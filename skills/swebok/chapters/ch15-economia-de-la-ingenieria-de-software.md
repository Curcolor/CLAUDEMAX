# Capítulo 15: Economía de la Ingeniería de Software

## Idea central
La ingeniería de software debe ser "basada en valor": cada decisión técnica (comprar vs. construir, refactorizar vs. vivir con deuda técnica, cuánta prueba basta) es en realidad una decisión económica que hay que evaluar con el mismo rigor que una inversión, considerando tanto criterios financieros como activos intangibles no cuantificables.

## Marcos que introduce
- **Proceso de toma de decisiones de ingeniería**: secuencia (iterativa en la práctica) para elegir entre alternativas.
  - Cuándo usarlo: en cualquier decisión de ingeniería, desde elegir un algoritmo hasta decidir un proyecto completo; a mayor consecuencia de una decisión errónea, más rigor se invierte en cada paso.
  - Cómo: 1) comprender el problema real (técnica de los "5 por qué"), 2) definir criterios de selección (expresarlos objetivamente, idealmente en dinero), 3) identificar todas las soluciones técnicamente factibles y razonables, 4) evaluar cada alternativa con la misma base de comparación y horizonte temporal, 5) seleccionar la alternativa preferida, 6) monitorear el desempeño real vs. lo estimado.
- **Proceso de decisión con fines de lucro (Figura 15.4)**: ordenar alternativas por inversión inicial creciente y comparar candidato a candidato contra el "mejor actual" usando la base de comparación adecuada (valor presente, valor futuro, TIR).
  - Cuándo usarlo: cuando el objetivo organizacional es obtener ganancias.
- **Análisis costo-beneficio / costo-efectividad**: para organizaciones sin fines de lucro o gubernamentales. Costo-beneficio divide beneficios financieros entre costos (relación <1.0 se descarta); costo-efectividad tiene versión de costo fijo (maximizar beneficio dado un tope de costo) y de eficacia fija (minimizar costo para un objetivo fijo).
- **Toma de decisiones de atributos múltiples**: cuando el dinero no es el único criterio.
  - Técnicas compensatorias (unidimensionales): agrupan todos los criterios en una sola cifra de mérito; una puntuación baja en un criterio se compensa con otra alta (escalamiento adimensional, ponderación aditiva, AHP/proceso analítico jerárquico).
  - Técnicas no compensatorias (totalmente dimensionadas): cada criterio es independiente, sin concesiones entre ellos (dominancia, satisfacción, lexicografía).
- **SIPAC (Caracterización Estratégica de Activos Intangibles de Proceso)**: método para hacer explícito el valor de los activos intangibles de una organización cliente.
  - Cuándo usarlo: en transformación digital o cualquier propuesta donde el software deba alinearse con activos de conocimiento ocultos (políticas, know-how, procedimientos).
  - Cómo: 1) identificar procesos y objetivos de negocio, 2) identificar activos intangibles vinculados a esos objetivos (usar los 11 Activos Intangibles Genéricos), 3) identificar productos de software que los soportan, 4) definir y medir indicadores de calidad e impacto, 5) caracterizar cada activo (calcular Qval, Ival y el valor lineal KAval), 6) vincular los activos al modelo de negocio, 7) tomar la decisión final (multiatributo).
- **Técnicas de estimación**: juicio de expertos, analogía, descomposición (bottom-up), paramétrica, estimaciones múltiples (buscar convergencia/divergencia entre técnicas).

## Conceptos clave
- **Propuesta**: unidad binaria de decisión (llevarla a cabo o no); cada algoritmo, diseño o proyecto candidato es una propuesta distinta.
- **Flujo de caja / diagrama de flujo de efectivo**: representación temporal de entradas y salidas de dinero generadas por ejecutar una propuesta; solo son comparables si están en el mismo período (equivalencia).
- **Valor temporal del dinero**: una cantidad de dinero hoy casi nunca vale lo mismo que la misma cantidad en otro momento.
- **MARR (Tasa Mínima Aceptable de Retorno)**: TIR más baja que la organización aceptaría como buena inversión; representa el costo de oportunidad de invertir en otra parte.
- **Alternativa de no hacer nada**: opción de "hacer algo distinto a lo evaluado"; debe considerarse en la mayoría de los casos.
- **Activo intangible / de conocimiento**: conocimiento no visible (tácito o explícito) que afecta el desempeño financiero — políticas, cultura, know-how — normalmente oculto "como un iceberg".
- **TCO (Costo Total de Propiedad)**: costo total de adquirir, activar y mantener en funcionamiento un producto de software, no solo su desarrollo inicial.
- **SPLC (Ciclo de Vida del Producto de Software)**: incluye operar, mantener y retirar, que consumen más esfuerzo total que el SDLC (desarrollo inicial).

## Modelos mentales
- Usa el horizonte de planificación (período de estudio) como marco temporal consistente antes de comparar propuestas con vidas útiles distintas; comparar sin igualar el horizonte sesga a favor del plazo más corto.
- Piensa en el costo hundido como irrecuperable e irrelevante para la decisión futura, aunque genere presión emocional para seguir invirtiendo.
- Trata los activos intangibles como un iceberg: la mayor parte del valor organizacional está bajo la superficie y solo se hace útil si se identifica y caracteriza explícitamente.
- Antes de aceptar una estimación, pregúntate qué decisión depende de ella — sin eso, invertir esfuerzo en precisión adicional no se justifica.

## Antipatrones
- **Comparar alternativas con distinta base de comparación u horizonte temporal**: hace parecer mejor a la que usa el plazo más corto, aunque no lo sea en igualdad de condiciones.
- **Ignorar los activos intangibles**: arriesga entregar una solución de software que no encaja con la organización cliente.
- **Considerar el costo hundido en la decisión**: desde la economía tradicional, el costo hundido no debe influir en decisiones futuras.
- **Usar una sola estimación de una sola técnica en decisiones de alto impacto**: sin múltiples estimaciones que converjan, no hay forma de detectar factores importantes pasados por alto.

## Tablas de referencia
| Técnica de estimación | Base | Ventaja principal | Riesgo principal |
|---|---|---|---|
| Juicio de expertos | Opinión profesional | Siempre disponible, rápida | Menos precisa |
| Analogía | Resultado real de algo similar | Más precisa que el juicio experto | Requiere una analogía adecuada |
| Descomposición (bottom-up) | Suma de partes más pequeñas | Los errores de las partes tienden a cancelarse | Mucho más trabajo; sesgo sistemático no se cancela |
| Paramétrica | Ecuación validada con datos históricos | Más precisa y defendible | Requiere base de datos histórica sólida |
| Estimaciones múltiples | Varias técnicas/estimadores | Detecta factores pasados por alto | Costo adicional de esfuerzo |

## Puntos clave
- Convierte cada decisión técnica relevante en una propuesta evaluable con criterios explícitos, no en una preferencia implícita.
- Usa la misma base de comparación, horizonte y tipo de costos/ingresos al evaluar alternativas entre sí.
- Haz explícitos los activos intangibles del cliente (vía SIPAC) antes de proponer una solución de transformación digital.
- Cierra el ciclo de estimación comparando lo estimado con lo real para mejorar futuras estimaciones.
- Recuerda que reducir el retrabajo suele ser la palanca más efectiva de productividad, más que acelerar el trabajo nuevo.

## Conecta con
- **Práctica Profesional**: el análisis de compensaciones de ese capítulo es una aplicación directa del proceso de decisión de ingeniería descrito aquí.
- **Fundamentos de Ingeniería**: comparte el mismo proceso de decisión de ingeniería (Figura 15.3 aquí y 18.2 allá) en versión generalizada a toda la ingeniería.
- **Gestión de Ingeniería de Software**: negociación y priorización de requisitos remiten a este KA para las técnicas de decisión con y sin fines de lucro.
- **Calidad del Software**: reducir retrabajo mediante mejora de calidad es, en términos de este KA, la palanca de productividad más importante.
