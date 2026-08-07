# Capítulo 1: Requisitos de software

## Idea central
Un requisito de software es una propiedad demostrable que resuelve un problema real de una parte interesada; los dos fallos que arruinan proyectos reales son la incompletitud (necesidades no reveladas) y la ambigüedad (interpretaciones múltiples), y casi todo el KA existe para combatir esos dos fallos.

## Marcos que introduce
- **Filtro de tecnología perfecta**: un requisito es funcional si seguiría siendo necesario aun con una computadora de velocidad infinita, memoria ilimitada, costo cero y sin fallas; todo lo demás es una restricción no funcional sobre la tecnología de automatización.
  - Cuándo usarlo: al clasificar un requisito ambiguo entre funcional y no funcional.
  - Cómo: pregúntate "¿esto seguiría existiendo con hardware perfecto?". Si sí → funcional (política o proceso de negocio). Si no → restricción tecnológica o de calidad de servicio.
- **Curva de valor de las restricciones de calidad de servicio**: el valor para la parte interesada en función del nivel de desempeño tiene un punto de perfección (más allá del cual no hay beneficio adicional) y un punto de fallo (por debajo del cual no hay pérdida adicional de beneficio); el costo de entrega es una función escalonada.
  - Cuándo usarlo: al negociar niveles cuantitativos de rendimiento, fiabilidad, capacidad, etc.
  - Cómo: identifica ambos puntos con la parte interesada, superpón la curva de costo escalonado, y busca el nivel de desempeño con la máxima diferencia positiva valor-costo (el "nivel más rentable").
- **Desarrollo de familias de productos para resolver conflictos**: separa los requisitos en invariantes (todas las partes interesadas están de acuerdo) y variantes (hay conflicto), y diseña puntos de personalización para las variantes en vez de forzar una única solución.
  - Cuándo usarlo: cuando hay muchas partes interesadas diversas y el conflicto es estructural, no puntual.
  - Cómo: clasifica cada requisito en conflicto como invariante o variante; diseña "para invariantes" (diseño estable) y "para el cambio" (puntos de configuración) en las variantes.
- **Técnica de los 5 porqués**: ante una afirmación obtenida que en realidad es una solución propuesta, pregunta repetidamente "¿por qué es este el requisito?" hasta llegar al problema real.
  - Cuándo usarlo: cuando sospechas que lo que te dieron es una solución, no una necesidad.
  - Cómo: repite hasta que la respuesta sea "si no se hace eso, el problema de la parte interesada no se resuelve"; normalmente converge en 2-3 ciclos, pero empuja hasta el fondo.
- **Modelo de Kano aplicado a priorización**: priorizar solo por valor/satisfacción produce prioridades erróneas; hay que sopesar también la insatisfacción que provoca la ausencia del requisito.
  - Cuándo usarlo: al priorizar backlog con requisitos de naturaleza distinta (deleite vs. básico/obligatorio).
  - Cómo: para cada requisito candidato evalúa tanto la satisfacción si se implementa como la insatisfacción si no se implementa; un requisito "básico" (alta insatisfacción si falta, baja satisfacción si está) puede superar en prioridad a uno de "deleite" con alta satisfacción pero baja insatisfacción.
- **Fórmula de priorización por función objetivo**: `prioridad = (Valor × (1 − Riesgo)) / Costo` es un ejemplo de función objetivo, no la única válida.
  - Cuándo usarlo: cuando necesitas una escala cuantitativa reproducible en vez de juicio ad hoc.
  - Cómo: define escalas de medición para valor, riesgo y costo antes de aplicar la fórmula; la elección de escala restringe qué función objetivo es válida.

## Conceptos clave
- **Requisito derivado**: requisito no impuesto por una parte interesada externa al proyecto, sino generado dentro del equipo (p. ej. una decisión de arquitectura vista como requisito por el subequipo que debe cumplirla).
- **Requisitos de producto vs. requisitos de proyecto**: los de producto especifican forma/ajuste/función del software; los de proyecto (o "de proceso"/"de negocio") restringen costo, plazo, dotación de personal u otros aspectos del proyecto que lo construye.
- **Depuración de requisitos (requirements debugging)**: encontrar el conjunto más pequeño de requisitos que satisface las necesidades reales, eliminando lo que está fuera de alcance, no rinde ROI adecuado o no es tan importante.
- **Coincidencia de alcance (scope matching)**: asegurar que el alcance de requisitos no exceda las restricciones de costo/cronograma/personal del proyecto; el ajuste debe ser cuantitativo (unidades de tamaño funcional), no cualitativo.
- **Seguimiento de requisitos (traceability)**: enlaza requisitos con elementos de diseño, código y casos de prueba con dos propósitos — auditoría de coherencia entre entregables y análisis de impacto de cambios.
- **Especificación incremental vs. completa**: incremental documenta solo las diferencias respecto a la versión anterior (menos volumen); completa reescribe todos los requisitos vigentes en cada versión (lectura más simple, sin acumular históricos).
- **Estabilidad y volatilidad de requisitos**: algunos requisitos casi nunca cambian (reflejan funciones fundamentales del negocio); otros son inestables y pueden cambiar varias veces; identificarlos guía un diseño más tolerante al cambio.
- **Medición del tamaño funcional (MSF)**: técnica para cuantificar el volumen de un conjunto de requisitos funcionales, útil para estimar costo/esfuerzo y como denominador de otras métricas; los puntos de historia son una alternativa.

## Modelos mentales
- Piensa en el desarrollo de requisitos como "llegar a un acuerdo sobre qué se construirá" y en la gestión de requisitos como "mantener ese acuerdo a lo largo del tiempo" — son dos actividades distintas, no una sola.
- Usa la categorización funcional/no-funcional (con no-funcional dividido en restricciones tecnológicas y de calidad de servicio) como aplicación de "divide y vencerás": separa quién es experto en qué (negocio vs. tecnología) y evita que un revisor de negocio se pierda en detalle técnico irrelevante.
- Piensa en "qué y cómo" del trabajo de requisitos como independiente de "cuándo" ese trabajo se hace: el ciclo de vida (cascada, iterativo, ágil) determina el cuándo, nunca debería determinar la forma final de la documentación de requisitos.
- Un caso de prueba de aceptación ("cuando entra X, esperamos que el software produzca Y") es, con un simple cambio de verbo ("debe producir"), un requisito preciso — ATDD/BDD son a la vez técnica de prueba y técnica de especificación.

## Antipatrones
- **Mezclar requisitos funcionales y no funcionales sin separar**: un experto de negocio revisando ambos intercalados se pierde o se desentiende de los problemas tecnológicos que no domina, y el requisito funcional queda sin validar bien.
- **Priorizar solo por satisfacción/valor**: ignora la insatisfacción que provoca la ausencia (efecto Kano), lo que produce fugas de prioridad hacia funciones "bonitas" en vez de básicas.
- **Dejar que el ciclo de vida dicte la forma de los requisitos**: si un mantenedor futuro puede inferir "esto se hizo en cascada" solo mirando la forma de la documentación, se perdió la función comunicativa de esa documentación a largo plazo.
- **Confundir un requisito con una decisión de diseño impuesta por una sola parte**: la decisión de un arquitecto (p. ej. usar tuberías y filtros) no es un requisito desde la perspectiva del proyecto completo, solo lo es para el subequipo al que se le impone como restricción derivada.
- **Prototipos que distraen por estética**: un prototipo de baja calidad visual puede hacer que los revisores se centren en detalles cosméticos en vez de validar la funcionalidad subyacente que el prototipo pretendía exponer.
- **Notación formal como carga innecesaria**: exigir formalismo máximo a lectores humanos sin necesidad reduce la eficacia comunicativa; el compromiso recomendado es fundamentos formales con sintaxis de superficie legible (el "trade-off de Wing").

## Tablas de referencia
| Categoría de requisito | Qué especifica | Ejemplo |
|---|---|---|
| Funcional | Comportamiento observable: políticas y procesos | "El saldo de una cuenta nunca debe ser negativo" |
| No funcional – restricción tecnológica | Tecnología/infraestructura obligatoria o prohibida | "Debe ejecutarse en Android" |
| No funcional – calidad de servicio | Nivel de desempeño aceptable | Tiempo de respuesta, fiabilidad, escalabilidad |

| Técnica de especificación | Nivel de formalidad | Ventaja principal |
|---|---|---|
| Lenguaje natural no estructurado | Mínimo | Accesible a cualquier lector |
| Lenguaje natural estructurado (actor-acción, casos de uso, historias) | Bajo-medio | Más preciso y conciso que prosa libre |
| Basada en criterios de aceptación (ATDD/BDD) | Medio | Ataca directamente la ambigüedad usando lenguaje de casos de prueba |
| Basada en modelos (ágil, semiformal, formal) | Medio-alto | Menos ambigüedad; formal permite razonar y demostrar propiedades |

| Técnica de validación | Cuándo brilla |
|---|---|
| Revisión de requisitos | Siempre; combinar perspectivas de cliente, ingenieros de requisitos y de construcción |
| Simulación/ejecución | Especificaciones formales/basadas en modelos ejecutables |
| Prototipado | Comportamiento dinámico (p. ej. UI) difícil de describir en texto |

## Puntos clave
- Clasifica siempre un requisito nuevo con el filtro de tecnología perfecta antes de especificarlo: determina qué técnica de elicitación, análisis y validación aplicar.
- Antes de aceptar una petición como requisito, aplica los 5 porqués para descartar que sea en realidad una solución prematura.
- Al priorizar, mide tanto satisfacción como insatisfacción (Kano); no confíes en una sola escala de "valor".
- Establece control de cambios explícito en ciclos basados en plan (solicitud → análisis de impacto opcional → decisión → notificación → rastreo); en ágil, el backlog cumple esa función implícitamente.
- Usa trazabilidad no solo como auditoría sino como motor del análisis de impacto: requisito → diseño → código → prueba.

## Conecta con
- **Arquitectura de Software, Diseño de Software, Construcción de Software, Pruebas de Software**: los requisitos son el contrato que estas disciplinas deben satisfacer y contra el que se valida el software construido.
- **Gestión de la Configuración de Software**: los requisitos documentados están sujetos a las mismas prácticas de control de versiones y cambios que otros entregables.
- **Calidad del Software**: examina la precisión de los requisitos; las revisiones de requisitos son un tipo de revisión de calidad.
- **Gestión de Ingeniería de Software**: usa el estado de los requisitos para evaluar el avance/finalización del proyecto.
- **Modelos y Métodos de Ingeniería de Software**: la especificación basada en modelos y los métodos formales comparten el tema de modelado con este KA.
- **Seguridad**: los requisitos de seguridad son un caso particular de requisito no funcional que se pasa por alto con frecuencia.
