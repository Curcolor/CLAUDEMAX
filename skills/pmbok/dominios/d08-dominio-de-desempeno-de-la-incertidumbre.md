# Dominio de desempeño: Incertidumbre

## Qué cubre
Agrupa la exploración, evaluación y respuesta a la falta de conocimiento, previsibilidad o control
que rodea al proyecto: incertidumbre general, ambigüedad, complejidad, volatilidad y riesgo
propiamente dicho (amenazas y oportunidades). Aborda tanto el entorno externo del proyecto
como las condiciones internas que dificultan predecir resultados.

## Resultados esperados
- Conciencia del entorno del proyecto, incluyendo pero no limitado a sus dimensiones técnicas,
  sociales, políticas, de mercado y económicas.
- Se responde proactivamente a la incertidumbre.
- Se reconoce la complejidad del proyecto y se identifican formas de reducirla o gestionarla.
- Se exploran y responden las amenazas y oportunidades.
- El valor del proyecto se preserva incluso cuando surgen eventos negativos.
- Uso proactivo de fuentes de información fiables y diversas para apoyar la toma de decisiones.
- Adaptabilidad frente a la incertidumbre cambiante.

## Cómo verificar que va bien
| Resultado | Cómo se comprueba |
|---|---|
| Conciencia del entorno | El equipo puede nombrar factores económicos, técnicos, legales, sociales y políticos que le afectan |
| Respuesta proactiva | Existen respuestas planificadas antes de que las amenazas se materialicen, no solo reacción posterior |
| Complejidad gestionada | Se aplican técnicas de desacople, iteración o involucramiento en vez de intentar predecir todo el sistema |
| Amenazas y oportunidades exploradas | Hay un registro de riesgos vivo con estrategias asignadas, revisado con cadencia regular |
| Valor preservado ante eventos negativos | Las reservas de contingencia y gestión absorben desviaciones sin comprometer el objetivo principal |
| Adaptabilidad | Los planes y reservas se ajustan cuando cambian las condiciones, no permanecen fijos por inercia |

## Marcos y técnicas que aplica
- **Cinco estrategias de respuesta a amenazas**: evitar, escalar, transferir, mitigar, aceptar.
  - Cuándo usarlo: evitar cuando se puede eliminar la causa; transferir cuando un tercero
    maneja mejor el riesgo; mitigar cuando se puede reducir probabilidad o impacto; escalar
    cuando excede la autoridad del equipo; aceptar cuando el costo de actuar supera el beneficio.
  - Cómo: pueden combinarse —mitigar hasta un nivel donde transferir o aceptar se vuelva
    viable.
- **Cinco estrategias de respuesta a oportunidades**: explotar, escalar, compartir, mejorar,
  aceptar (espejo de las de amenaza, orientadas a capturar beneficio en vez de evitar daño).
  - Cuándo usarlo: explotar cuando se puede garantizar activamente que ocurra; compartir
    cuando un tercero está mejor posicionado para capturar el beneficio; mejorar cuando se
    puede aumentar su probabilidad o impacto.
  - Cómo: revisar el conjunto de respuestas resultante para verificar que no introduce riesgos
    secundarios ni deja un riesgo residual incompatible con el apetito de la organización.
- **Técnicas para trabajar con complejidad — basadas en sistemas, replanteamiento y proceso**:
  desacople y simulación (sistemas); diversidad y equilibrio (replanteamiento); iterar, involucrar
  y falla segura (proceso).
  - Cuándo usarlo: cuando hay muchas influencias interconectadas y no es posible predecir con
    precisión el resultado de una acción.
  - Cómo: elegir la vía según qué reduzca antes la variable no manejable — desconectar partes
    del sistema, cambiar de perspectiva, o avanzar en pasos pequeños con retroalimentación.
- **Diseño basado en conjuntos**: investigar múltiples diseños o alternativas en paralelo al
  inicio para descartar los ineficaces mientras se aprende.
  - Cuándo usarlo: cuando hay alta incertidumbre sobre qué solución técnica es viable y el costo
    de explorar varias en paralelo es asumible.
  - Cómo: comparar compromisos (tiempo vs. costo, calidad vs. costo) entre alternativas y
    descartar progresivamente las subóptimas.

## Conceptos clave
- **Incertidumbre**: falta de comprensión y conciencia de problemas, eventos, caminos a seguir
  o soluciones a buscar.
- **Ambigüedad**: confusión con dificultad para identificar la causa de eventos, o múltiples
  opciones entre las que elegir; puede ser conceptual (términos usados de forma distinta) o
  situacional (más de un resultado posible).
- **Complejidad**: característica de un proyecto o su entorno difícil de gestionar por
  comportamiento humano, comportamiento del sistema o ambigüedad.
- **Volatilidad**: posibilidad de cambio rápido e impredecible, que suele afectar costo y
  cronograma.
- **Riesgo**: evento o condición incierta que, de ocurrir, tiene efecto positivo (oportunidad) o
  negativo (amenaza) sobre los objetivos del proyecto.
- **Umbral de riesgo**: variación aceptable en torno a un objetivo que refleja el apetito al riesgo
  de la organización e interesados.
- **Riesgo general del proyecto**: efecto acumulado de la incertidumbre sobre el proyecto como
  un todo, no solo la suma de riesgos individuales.

## Decisiones típicas de este dominio
Si el costo de recopilar más información supera el beneficio de reducir la incertidumbre → dejar
de investigar y decidir con lo que se tiene. Si una amenaza está fuera del alcance de autoridad
del equipo → escalarla con alternativas evaluadas, no solo reportarla. Si un riesgo puede
mitigarse pero no eliminarse → mitigar hasta un punto y luego transferir o aceptar el remanente,
combinando estrategias. Si el proyecto opera en un entorno predictivo con alcance estable → usar
reservas de cronograma y presupuesto como principal mecanismo de respuesta. Si opera en un
entorno adaptativo con requisitos evolutivos → ajustar los planes conforme evoluciona la
comprensión, en vez de depender solo de reservas fijas. Si aparece un componente crítico del
sistema → incorporar redundancia o degradación elegante (falla segura), no asumir que
funcionará siempre.

## Antipatrones
- **Tratar la aceptación pasiva como la respuesta por defecto**: no planificar nada ante una
  amenaza conocida, cuando mitigarla temprano habría sido más barato que reparar el daño
  después.
- **Ignorar el riesgo general del proyecto por enfocarse solo en riesgos individuales**: la suma
  de riesgos individuales gestionados no equivale a controlar el riesgo agregado del proyecto
  completo.
- **Intentar predecir con precisión sistemas complejos**: la complejidad, por definición, hace que
  no haya manera de predecir con exactitud todos los resultados posibles; insistir en
  predicciones precisas desperdicia esfuerzo.
- **No revisar las respuestas al riesgo tras implementarlas**: dejar de verificar si generaron
  riesgos secundarios o si el riesgo residual sigue siendo aceptable.

## Interacciones
- Con **Planificación**: las actividades para reducir incertidumbre y riesgo se incorporan
  directamente a los planes, incluidas las reservas.
- Con **Trabajo del Proyecto y Entrega**: las respuestas a la incertidumbre planificadas se
  ejecutan concretamente en estos dominios.
- Con **Medición**: las mediciones de desempeño pueden disparar la identificación de nuevos
  riesgos u oportunidades, y muestran si el nivel de riesgo cambia con el tiempo.
- Con **Enfoque de desarrollo**: el ciclo de vida elegido condiciona cómo se aborda la
  incertidumbre —reservas fijas en predictivo, ajuste continuo de planes en adaptativo.
- Con **Interesados**: el equipo y los interesados son la fuente principal de información,
  sugerencias y asistencia para navegar la incertidumbre.
