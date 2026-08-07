# Capítulo 5: Pruebas de software

## Idea central
Las pruebas de software son la validación dinámica de que un sistema bajo prueba (SUT) exhibe los comportamientos esperados en un conjunto finito y adecuadamente seleccionado de casos de prueba tomados de un dominio de ejecución habitualmente infinito — cada palabra de esa definición (dinámica, finito, seleccionado, esperado) delimita un problema de ingeniería distinto que el resto del capítulo desarrolla.

## Marcos que introduce
- **Definición formal de pruebas de software**: validación *dinámica* (requiere ejecución real, distinta de las técnicas estáticas) de que el SUT produce comportamientos *esperados* en un conjunto *finito* de casos *seleccionados* de un dominio de entrada habitualmente infinito.
  - Cuándo usarlo: como ancla conceptual para separar pruebas de actividades vecinas (depuración, análisis estático, verificación formal).
  - Cómo: cada vez que diseñes una estrategia de prueba, resuelve explícitamente las cuatro preguntas: ¿qué comportamiento se espera?, ¿qué oráculo lo determina?, ¿qué subconjunto finito se seleccionará?, ¿con qué criterio de selección?
- **Falla vs. fallo vs. error**: la *falla* (fault) es la causa; el *fallo* (failure) es el efecto observado no deseado en el servicio entregado. Un software puede tener fallas que nunca se manifiestan como fallos.
  - Cuándo usarlo: al diagnosticar un mal funcionamiento, para no confundir "lo que se observó mal" con "lo que hay que corregir en el código".
  - Cómo: usa "entradas que provocan fallos" en vez de "la falla", porque no siempre existe un criterio teórico para identificar unívocamente qué falla causó un fallo observado.
- **Caja negra (basada en especificación) vs. caja blanca (basada en estructura)**: las técnicas de caja negra generan casos de prueba solo a partir del comportamiento entrada/salida del SUT; las de caja blanca usan información de cómo se diseñó o codificó.
  - Cuándo usarlo: elige caja negra cuando validas contra requisitos/especificación; caja blanca cuando necesitas cobertura de código medible.
  - Cómo: combínalas — funcional y estructural son complementarias, detectan problemas distintos porque usan fuentes de información distintas.
- **Criterios de adecuación vs. criterios de selección**: adecuación responde "¿cuántas pruebas son suficientes?"; selección responde "¿qué casos de prueba elegir?".
  - Cuándo usarlo: al diseñar cualquier suite de pruebas, resuelve ambas preguntas por separado — son ortogonales, no la misma decisión.
  - Cómo: define primero el criterio de cobertura/adecuación objetivo (p. ej. 100% de ramas), luego selecciona los casos concretos que lo alcanzan con el menor conjunto posible.
- **El problema del oráculo**: una prueba solo es significativa si es posible determinar su resultado observado; el oráculo (humano o mecánico) decide "aprobado/reprobado", y a veces el resultado es directamente inconcluyente.
  - Cuándo usarlo: antes de automatizar cualquier generación de pruebas, verifica que existe un oráculo viable (no solo generación de entradas).
  - Cómo: usa especificaciones inequívocas, modelos de comportamiento o anotaciones de código como fuente de oráculo; si no hay oráculo automatizable, considera pruebas metamórficas (relación entrada-salida transformada) como alternativa.
- **Límite teórico de Dijkstra**: "las pruebas de programas pueden usarse para mostrar la presencia de errores, pero nunca para demostrar su ausencia".
  - Cuándo usarlo: para calibrar expectativas de stakeholders sobre lo que "todas las pruebas pasaron" realmente garantiza.
  - Cómo: nunca comuniques "cero defectos" como conclusión de una suite exitosa; comunica el criterio de adecuación alcanzado y su cobertura específica.
- **Puntuación de mutación y efecto de acoplamiento**: un mutante es una versión del SUT con un cambio sintáctico pequeño respecto al "oro"; si un caso de prueba distingue el mutante del original, el mutante queda "eliminado". El supuesto (efecto de acoplamiento) es que detectar fallos sintácticos simples correlaciona con detectar fallos complejos reales.
  - Cuándo usarlo: para evaluar la efectividad real de una suite de pruebas existente, no solo su cobertura de código.
  - Cómo: genera automáticamente muchos mutantes, ejecuta la suite contra cada uno, calcula la proporción eliminada; diseña pruebas adicionales específicamente para los mutantes sobrevivientes.

## Conceptos clave
- **Sistema bajo prueba (SUT)**: el objeto probado — puede ser un programa, aplicación, servicio, middleware, sistema de sistemas o ecosistema.
- **Caso de prueba**: especificación completa de entradas, condiciones de ejecución, procedimiento y resultados esperados; los valores de entrada solos no siempre bastan porque el SUT puede reaccionar distinto según su estado.
- **Capacidad de prueba (testability)**: doble sentido — facilidad de satisfacer un criterio de cobertura dado, y probabilidad (medible estadísticamente) de que un conjunto de pruebas exponga un fallo si el software es defectuoso.
- **Caminos inviables**: rutas de flujo de control que ningún dato de entrada puede ejercitar; identificarlos reduce tiempo/recursos malgastados en pruebas basadas en rutas.
- **Perfil operativo**: modelo estadístico del uso real del software por distintos usuarios, usado para generar casos de prueba que permitan estimar fiabilidad.
- **Shift-left**: movimiento que adopta pruebas en etapas tempranas del desarrollo (Agile, DevOps, TDD) para detectar y eliminar fallas antes, reduciendo costo y riesgo.
- **Finalización de la prueba (test completion)**: subproceso que decide cuándo detener las pruebas, combinando medidas de exhaustividad (cobertura) con análisis de costo/riesgo de fallos remanentes vs. costo de seguir probando.
- **Crowdtesting**: mano de obra dispersa y temporal de múltiples testers con diversidad tecnológica; no sustituye la validación interna, la complementa.

## Modelos mentales
- Piensa en las pruebas como un experimento científico controlado: todo lo hecho debe documentarse con suficiente claridad para que otra persona replique los resultados exactos usando la misma versión del SUT.
- Distingue verificación ("¿coincide con la especificación?"), validación ("¿coincide con las necesidades del usuario?") y comportamiento esperado implícito como tres bases de comparación distintas para el mismo resultado observado — elige cuál aplica antes de declarar una prueba pasada o fallida.
- Usa la tríada niveles de prueba (unidad/integración/sistema/aceptación) × objetivos de prueba (funcional, rendimiento, seguridad, usabilidad...) como una matriz: cada celda es una decisión de diseño de pruebas distinta, no asumas que "probar" es una sola actividad homogénea.
- Trata la generación de pruebas basada en IA/ML como una herramienta que reduce esfuerzo en tareas ya formuladas como problemas de aprendizaje (priorización, oráculo, mutación), no como un sustituto del juicio sobre qué propiedad se está validando.

## Antipatrones
- **Confiar en pruebas exitosas como prueba de ausencia de errores**: contradice directamente el límite teórico de Dijkstra; una suite verde solo demuestra que ese conjunto finito de casos no encontró fallos, nunca que no existan.
- **Inyección de fallas sin cuidado**: insertar fallos artificiales para medir efectividad conlleva el riesgo real de dejarlos en el sistema; además los estadísticos cuestionan la representatividad de fallos inyectados frente a los genuinos.
- **Ignorar el problema del oráculo al automatizar**: generar entradas de prueba automáticamente sin verificar que existe una forma confiable de determinar el resultado esperado deja "pruebas" que no pueden fallar de forma significativa.
- **Tratar pruebas alfa/beta como sustituto de un plan de pruebas**: suelen estar descontroladas y no siempre se documentan en un plan de pruebas formal; son complemento, no reemplazo, de niveles de prueba sistemáticos.
- **Combinar automatización de pruebas con ausencia de infraestructura de oráculo**: un generador de casos de prueba sin función de oráculo asociada solo automatiza la mitad del problema.

## Tablas de referencia
| Nivel de prueba | Qué verifica |
|---|---|
| Unitaria | Elementos aislados (subprogramas, componentes individuales) |
| Integración | Interacciones entre elementos del SUT (estrategias: descendente, ascendente, mixta, big bang) |
| Sistema | Comportamiento del SUT completo, incluye no funcionales (seguridad, velocidad, fiabilidad) |
| Aceptación | Satisfacción de requisitos y expectativas del usuario final |

| Categoría de técnica | Base de generación | Ejemplos |
|---|---|---|
| Basada en especificación (caja negra) | Comportamiento entrada/salida | Partición de equivalencia, análisis de valores límite, tablas de decisión, pruebas basadas en escenarios |
| Basada en estructura (caja blanca) | Código y su estructura | Cobertura de sentencias/ramas/condiciones (MC/DC), flujo de datos (todas-definiciones, todas-usos) |
| Basada en experiencia | Intuición y conocimiento del tester | Adivinación de errores, pruebas exploratorias, ad hoc, monkey testing |
| Basada en fallos/mutación | Modelo de fallas predefinido | Clasificación ortogonal de defectos (ODC), pruebas de mutación |
| Basada en uso | Perfil operativo estadístico | Pruebas basadas en perfil operativo, pruebas aleatorias/estadísticas |

| Tipo de prueba no funcional | Qué valida |
|---|---|
| Rendimiento / carga / estrés / volumen | Tiempo de respuesta, comportamiento bajo carga, límites de capacidad |
| Confiabilidad | Fiabilidad mediante identificación y corrección de fallos, modelos de crecimiento |
| Compatibilidad / escalabilidad / elasticidad | Interoperabilidad entre entornos; capacidad de ampliar/reducir recursos |
| Seguridad / privacidad | Confidencialidad, integridad, disponibilidad; protección de datos personales |
| Usabilidad | Facilidad de aprendizaje y uso por el usuario final |

## Puntos clave
- Antes de generar un solo caso de prueba, resuelve explícitamente objetivo (qué nivel y qué propiedad), criterio de adecuación y criterio de selección — en ese orden.
- Combina siempre técnicas funcionales y estructurales; son complementarias porque parten de información distinta y detectan clases de fallos distintas.
- Usa mutación (o inyección de fallas controlada) para medir la efectividad real de una suite existente, no solo su cobertura de código.
- En contextos shift-left (Agile/DevOps/TDD), integra pruebas de regresión automatizadas y pruebas de humo en el pipeline de CI para dar retroalimentación temprana sin sacrificar seguridad de cambios.
- Documenta siempre la finalización de la prueba con criterios explícitos de exhaustividad y de costo/riesgo — "se acabó el tiempo" no es un criterio de finalización válido.

## Conecta con
- **Construcción de Software**: pruebas unitarias e integración ocurren durante la construcción; TDD invierte el orden habitual escribiendo la prueba antes que el código.
- **Requisitos de Software**: la especificación de requisitos basada en criterios de aceptación (ATDD/BDD) provee directamente los oráculos y casos de prueba de aceptación.
- **Calidad del Software**: las técnicas estáticas (revisión, análisis estático) complementan las pruebas dinámicas; ambas alimentan la caracterización de defectos.
- **Modelos y Métodos de Ingeniería de Software**: las pruebas basadas en modelos y las técnicas de sintaxis dependen directamente de especificaciones formales y modelos de comportamiento.
- **Gestión de la Configuración de Software**: la documentación de pruebas debe estar bajo control de configuración igual que cualquier otro entregable.
- **Seguridad del Software**: las pruebas de seguridad y privacidad son un objetivo de prueba especializado que se apoya en ese KA para taxonomías de vulnerabilidades.
