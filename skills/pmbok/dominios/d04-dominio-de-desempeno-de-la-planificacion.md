# Dominio de desempeño: Planificación

## Qué cubre
Agrupa el trabajo de organizar, elaborar y coordinar de forma proactiva el camino hacia los
entregables del proyecto: alcance, estimaciones, cronograma, presupuesto, equipo, comunicación,
recursos físicos y adquisiciones. No es una etapa única al inicio, sino una actividad continua que
se reelabora progresivamente durante todo el proyecto.

## Resultados esperados
- El proyecto avanza de forma organizada, coordinada y deliberada.
- Los enfoques de planificación evolutiva se usan para el desarrollo del entregable.
- Los artefactos de planificación reflejan un alcance/lista de trabajo pendiente priorizado.
- Una gestión de la variabilidad, apoyada en datos históricos y experto en la materia, mejora las
  estimaciones a lo largo del tiempo.
- El enfoque de desarrollo del producto, servicio o resultado es adecuado para los entregables.
- Los planes vinculados al valor real y previsto se usan para gestionar el desempeño del proyecto.

## Cómo verificar que va bien
| Resultado | Cómo se comprueba |
|---|---|
| Avance organizado y coordinado | Los artefactos de planificación confirman expectativas de los interesados y guían decisiones |
| Planificación evolutiva del entregable | Los planes se elaboran con más detalle a medida que hay más información disponible |
| Alcance/lista priorizada | El trabajo de mayor riesgo o novedad se aborda antes que el trabajo de rutina |
| Estimaciones que mejoran con el tiempo | El rango de las estimaciones se estrecha a medida que avanza el proyecto |
| Enfoque adecuado a los entregables | Los métodos de estimación y cronograma calzan con predictivo/adaptativo según el entregable |
| Planes vinculados al valor | Presupuesto y cronograma están distribuidos de forma que reflejan cuándo se genera valor, no solo cuándo se gasta |

## Marcos y técnicas que aplica
- **Estimación determinista, probabilística, absoluta y relativa**: distintas formas de expresar
  el valor esperado de costo, esfuerzo o duración.
  - Cuándo usarlo: determinista para comunicar un número único cuando basta esa precisión;
    probabilística cuando se necesita comunicar el rango y la confianza asociada; relativa
    (puntos de historia) cuando se compara trabajo nuevo contra trabajo previamente conocido.
  - Cómo: en probabilística, combinar estimación puntual con rango, nivel de confianza y
    distribución de probabilidad para tener una métrica completa.
- **Compresión del cronograma — intensificación y ejecución rápida**: técnicas para acortar la
  duración cuando el modelo no cumple la fecha deseada.
  - Cuándo usarlo: intensificación cuando se puede añadir recursos con el menor incremento de
    costo; ejecución rápida cuando actividades secuenciales pueden solaparse parcialmente.
  - Cómo: en ejecución rápida, aplicar adelantos (iniciar una sucesora antes de que termine la
    predecesora) o retrasos (demorar el inicio/fin de la sucesora), evaluando antes qué
    dependencias (obligatoria, discrecional, externa, interna) lo permiten.
- **Planificación adaptativa por iteraciones y liberaciones**: plan de liberación de alto nivel con
  iteraciones de período de tiempo preestablecido dentro de cada liberación.
  - Cuándo usarlo: en enfoques adaptativos, para no planificar en detalle trabajo futuro que
    puede cambiar por retroalimentación de liberaciones anteriores.
  - Cómo: priorizar la lista de trabajo pendiente, estimar solo lo que entra en la iteración actual
    y volver a priorizar al cierre de cada período.
- **Reservas para contingencias y de gestión**: fondos o tiempo apartados para incertidumbre.
  - Cuándo usarlo: contingencia para riesgos ya identificados; gestión para trabajo no
    planificado dentro del alcance (eventos desconocidos).
  - Cómo: dimensionarlas a partir del análisis de riesgo y las políticas de reserva de la
    organización, no como un margen arbitrario.

## Conceptos clave
- **Estimación**: evaluación cuantitativa del valor o resultado probable de una variable (costo,
  recurso, esfuerzo, duración).
- **Exactitud**: evaluación de la corrección de una estimación (qué tan cerca del valor real).
- **Precisión**: evaluación del grado de detalle de una estimación (qué tan específica es).
- **Línea base de costos**: agregación de estimaciones de costos distribuida en el tiempo según
  el cronograma.
- **Último momento responsable**: aplazar decisiones de planificación de trabajo rutinario hasta
  que posponerlas más cueste más que el beneficio de esperar.
- **Dependencia obligatoria/discrecional/externa/interna**: cuatro tipos de relación entre
  actividades que determinan si se pueden reordenar o comprimir.
- **Análisis de hacer o comprar**: decisión sobre qué entregables se desarrollan internamente y
  cuáles se adquieren externamente.

## Decisiones típicas de este dominio
Si el proyecto está en etapas tempranas y hay poca información → aceptar un rango amplio de
estimación en vez de forzar precisión artificial. Si el trabajo es de rutina y de bajo riesgo →
aplazarlo al último momento responsable en vez de planificarlo en detalle por adelantado. Si hay
limitaciones de financiamiento en un período presupuestal → reprogramar el trabajo para
encajar en esas limitaciones, no ignorar el límite. Si una actividad está impulsada por esfuerzo
(no por duración fija) → considerar intensificación añadiendo personas, sabiendo que hay un
punto donde eso alarga en vez de acortar. Si el enfoque es adaptativo → mantener la
planificación de liberaciones futuras a alto nivel para no invertir en detalle que cambiará con la
retroalimentación de las liberaciones anteriores.

## Antipatrones
- **Planificar más de lo necesario**: es ineficiente; la información de planificación debe ser
  suficiente para avanzar, no exhaustiva por sistema.
- **Confundir exactitud con precisión**: una estimación puede ser muy precisa (2 días) y muy
  inexacta a la vez; tratar la precisión como sustituto de la exactitud engaña a los interesados.
- **Ignorar el tipo de dependencia al comprimir el cronograma**: intentar ejecución rápida sobre
  una dependencia obligatoria o externa que no se puede modificar.
- **Planificar equipo y recursos sin considerar la ubicación y modalidad de trabajo**: subestimar
  el tiempo adicional que exige conectar tecnológicamente a un equipo disperso.

## Interacciones
- Con **Interesados**: la planificación de la comunicación se apoya directamente en el análisis
  de interesados de ese dominio.
- Con **Enfoque de desarrollo**: el ciclo de vida elegido determina cuánta planificación se hace
  por adelantado y cuánta se difiere.
- Con **Medición**: las métricas, líneas base y umbrales establecidos aquí son la base contra la
  que se evalúa el desempeño real.
- Con **Incertidumbre**: la planificación de reservas y de respuestas a riesgos requiere que
  ambos dominios trabajen coordinados, revisando los planes cuando cambian las condiciones.
