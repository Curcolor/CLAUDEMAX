# Capítulo 16: Fundamentos de la Informática

## Idea central
A diferencia del programador (que convierte un algoritmo dado en código funcionando), el ingeniero de software debe estudiar requisitos, diseñar los bloques del sistema y elegir con criterio algoritmos, arquitecturas, lenguajes, sistemas operativos y mecanismos de comunicación — para eso necesita una base amplia (no necesariamente profunda) de arquitectura de computadoras, estructuras de datos, lenguajes, sistemas operativos, bases de datos, redes, factores humanos e IA/ML.

## Marcos que introduce
- **Taxonomía de Flynn**: clasifica arquitecturas concurrentes según flujos de instrucciones y datos: SISD (único-único), SIMD (único-múltiple), MISD (múltiple-único), MIMD (múltiple-múltiple).
  - Cuándo usarlo: al elegir o describir arquitecturas de cómputo paralelo/concurrente.
- **RISC vs. CISC**: dos filosofías de arquitectura de conjunto de instrucciones (ISA).
  - RISC: instrucciones simples y uniformes, más instrucciones por tarea pero menos ciclos por instrucción, compilador más simple, típico en procesadores de propósito general.
  - CISC: instrucciones potentes que combinan varias operaciones, menos instrucciones por tarea pero más ciclos cada una, típico en DSP y gráficos.
- **Arquitectura von Neumann vs. Harvard**: von Neumann comparte un único espacio de memoria para programa y datos; Harvard usa bloques separados de memoria de código y datos (la variante modificada divide un mismo bloque en secciones de solo lectura para código y lectura/escritura para datos).
- **Notaciones asintóticas de complejidad**: Big O (peor caso/cota superior), o (cota superior no estricta), Ω (cota inferior/mejor caso), ω (cota inferior no estricta), Θ (cota ajustada, caso promedio).
  - Cuándo usarlo: al comparar algoritmos o estructuras de datos candidatas para una tarea, siempre en función del tamaño y el orden de los datos de entrada.
- **Modelo OSI de 7 capas**: física, enlace de datos, red, transporte, sesión, presentación, aplicación; cada capa ofrece un servicio a la capa superior mediante un protocolo, comunicándose con su capa par en el otro extremo (encapsulación/desencapsulación).
- **Normalización de bases de datos (1FN–6FN/DKNF)**: elimina redundancia e inconsistencia progresivamente; la mayoría de las bases de datos se normalizan hasta 3FN o BCNF; normalizar más aumenta el número de tablas y el tiempo de consulta (por eso a veces se desnormaliza a propósito).
- **ACID vs. BASE**: ACID (atomicidad, consistencia, aislamiento, durabilidad) da alta consistencia, ideal para dominios financieros; BASE (básicamente disponible, estado suave, consistencia eventual) da flexibilidad, propio de NoSQL.
- **Tipos de aprendizaje en IA/ML**: supervisado (datos etiquetados), no supervisado (sin etiquetas, busca patrones), semisupervisado (mezcla), por refuerzo (aprende de recompensas/errores por interacción con el entorno).

## Conceptos clave
- **Modularidad, cohesión, acoplamiento**: criterios de diseño de subsistemas — módulos de tamaño uniforme, alta cohesión interna, bajo acoplamiento entre módulos.
- **ISA (Arquitectura del Conjunto de Instrucciones)**: modelo abstracto de cómo una CPU ejecuta instrucciones — define registros, tipos de datos, direccionamiento de memoria y gestión de E/S.
- **TAD (Tipo de Dato Abstracto)**: tipo definido por su comportamiento (semántica) desde la perspectiva del usuario — valores posibles y operaciones —, no por su implementación.
- **Función hash**: convierte datos de tamaño arbitrario en un valor de tamaño fijo para indexar y localizar rápido en una tabla hash.
- **Programación distribuida vs. paralela**: distribuida ejecuta una tarea compartida entre varias computadoras en red (falla de una no detiene la tarea, se reasigna); paralela ejecuta partes de una tarea en varios procesadores/núcleos de una misma máquina para acelerar el cómputo.
- **Sistema operativo (4 gestiones)**: gestión del procesador (procesos, hilos, planificación, interbloqueos), de memoria (paginación, segmentación, reemplazo de páginas), de dispositivos (E/S por sondeo, interrupción o DMA) y de la información (sistema de archivos, control de acceso).
- **Patrón oscuro**: interacción de UI/UX diseñada para explotar en vez de servir al usuario (ver también Práctica Profesional).
- **Razonamiento en IA**: deductivo (premisas verdaderas → conclusión cierta), inductivo (generaliza desde casos → conclusión probable), abductivo (desde datos incompletos → conclusión más probable), de sentido común (desde experiencias pasadas similares), monótono (conclusión permanente) vs. no monótono (cambia con nueva información).

## Modelos mentales
- Distingue rol de programador (traduce algoritmo a código) de rol de ingeniero de software (diseña el sistema completo: requisitos, arquitectura, algoritmos, criterios de rendimiento, mantenibilidad); este KA existe para dar al segundo el vocabulario técnico del primero.
- Al elegir estructura de datos o algoritmo, evalúa siempre contra el perfil real de los datos de entrada (tamaño, orden, tipo) y el recurso limitante (tiempo vs. memoria) — la notación asintótica solo tiene sentido junto a ese contexto.
- Usa programación distribuida cuando el objetivo es tolerancia a fallos y escalabilidad geográfica; usa programación paralela cuando el objetivo es acelerar un cómputo dentro de una misma máquina.
- Trata la seguridad de red como parte del diseño desde el inicio (firewalls, VLAN, DMZ, cifrado), no como parche posterior — las amenazas evolucionan constantemente.

## Antipatrones
- **Elegir algoritmo de ordenamiento/búsqueda sin mirar las características del conjunto de datos**: el algoritmo óptimo depende del tamaño, tipo y grado de orden previo de los datos.
- **Estilos de codificación inconsistentes en el equipo**: se estima que el 82% de las vulnerabilidades provienen de conflictos entre estilos de programación; un estándar de codificación acordado y revisado reduce defectos y hace el cronograma más predecible.
- **Tratar sistemas de IA/ML como software tradicional**: su comportamiento se infiere de datos de entrenamiento, no se escribe como código; ignorar la naturaleza estocástica y la necesidad de datos etiquetados/estructurados suficientes lleva a expectativas equivocadas.
- **Usar tipado dinámico o estático sin conocer sus implicaciones**: mezclar convenciones sin entender cuándo se verifica el tipo (compilación vs. ejecución) genera errores de ejecución evitables.

## Tablas de referencia
| Complejidad | Notación | Ejemplo típico |
|---|---|---|
| Constante | O(1) | Acceso a un elemento de arreglo por índice |
| Logarítmica | O(log n) | Búsqueda binaria |
| Lineal | O(n) | Recorrido de una lista |
| Linearítmica | O(n·log n) | Mergesort, Quicksort (promedio) |
| Cuadrática | O(n²) | Bubble sort, comparación de todos los pares |
| Cúbica | O(n³) | Multiplicación de matrices (ingenua) |
| Exponencial | O(2ⁿ) / O(n!) | Fuerza bruta sobre subconjuntos/permutaciones |

| Parámetro | Programación distribuida | Programación paralela |
|---|---|---|
| Unidad de ejecución | Varias computadoras en red | Varios procesadores/núcleos en una máquina |
| Memoria | Cada nodo tiene la propia | Compartida o distribuida |
| Comunicación | Red | Bus / IPC |
| Beneficio clave | Tolerancia a fallos, escalabilidad | Mayor rendimiento/throughput |
| Ejemplos | Internet, DBMS distribuido, cómputo en la nube | Renderizado 2D/3D, cómputo científico (CUDA, OpenMP) |

## Puntos clave
- No confundas "conocer de todo" con "profundizar en todo": este KA es un mapa amplio para tomar decisiones de diseño informadas, no una especialización.
- Al comparar arquitecturas o algoritmos, ancla siempre la comparación a notación asintótica + perfil de datos reales.
- Antes de escoger DBMS, define el modelo de consistencia que necesitas (ACID para dominios transaccionales críticos, BASE para escalabilidad y disponibilidad).
- Adopta y haz cumplir un estándar de codificación de equipo como control de calidad, no como formalismo.
- Al diseñar con IA/ML, planifica para comportamiento estocástico y gobernanza de datos, no solo para lógica determinista.

## Conecta con
- **Fundamentos Matemáticos**: la notación asintótica, los grafos/árboles y las máquinas de estados finitos usadas aquí se definen formalmente en esa KA.
- **Seguridad del Software**: seguridad de redes, criptografía y vulnerabilidades inalámbricas de este capítulo son la base técnica de las prácticas descritas en Seguridad.
- **Arquitectura y Diseño de Software**: las arquitecturas de sistema (integrada, distribuida, agrupada, convergente) aquí descritas se aplican con más detalle en esas KA.
- **Fundamentos de Ingeniería**: la medición y el análisis estadístico usados para evaluar rendimiento de algoritmos remiten a esa KA.
