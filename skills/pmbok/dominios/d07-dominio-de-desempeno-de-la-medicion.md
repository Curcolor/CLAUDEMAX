# Dominio de desempeño: Medición

## Qué cubre
Agrupa la evaluación del desempeño del proyecto y la implementación de respuestas apropiadas
para mantenerlo óptimo: qué medir, cómo establecer métricas efectivas, cómo presentar la
información y cómo evitar los peligros comunes de medir mal. El valor no está en recolectar
datos sino en las conversaciones que esos datos habilitan.

## Resultados esperados
- Una comprensión fiable del estado del proyecto.
- Decisiones basadas en datos para mantener el buen desempeño del proyecto.
- Acciones oportunas y apropiadas para mantener el desempeño del proyecto dentro de los
  umbrales de tolerancia.
- Lograr los objetivos y generar valor de negocio mediante la evaluación de las mediciones
  relevantes.

## Cómo verificar que va bien
| Resultado | Cómo se comprueba |
|---|---|
| Comprensión fiable del estado | Los indicadores adelantados y rezagados coinciden con la percepción cualitativa del equipo e interesados |
| Decisiones basadas en datos | Las conversaciones de estado citan métricas concretas, no solo impresiones |
| Acciones oportunas ante desviaciones | Existe un plan de excepciones activado antes de o al cruzar un umbral, no después de una crisis |
| Logro de objetivos y valor | Las métricas de negocio (ROI, relación costo-beneficio) siguen respaldando la continuidad del proyecto |

## Marcos y técnicas que aplica
- **Indicadores clave de desempeño (KPI) — adelantados y rezagados**: dos tipos de medidas
  con distinto propósito temporal.
  - Cuándo usarlo: adelantados para anticipar y corregir tendencias desfavorables antes de que
    crucen el umbral; rezagados para confirmar qué ocurrió y detectar correlaciones.
  - Cómo: vigilar indicadores adelantados aunque sean difíciles de cuantificar (interesados poco
    comprometidos, criterios de éxito mal definidos) porque son señales de alerta temprana.
- **Criterios SMART para métricas efectivas**: específica, significativa (o medible), alcanzable
  (o acordada), relevante (o realista) y oportuna (o limitada en el tiempo).
  - Cuándo usarlo: al definir cualquier métrica nueva, para evitar medir por medir.
  - Cómo: vincular cada métrica al caso de negocio o a una línea base; descartar las que no
    generan información procesable.
- **Gestión del valor ganado (EVM)**: familia de métricas —SV, CV, SPI, CPI, ETC, EAC, VAC,
  TCPI— que comparan valor planificado, valor ganado y costo real.
  - Cuándo usarlo: predominantemente en entornos predictivos y proyectos grandes con línea
    base de costo y cronograma bien definida.
  - Cómo: calcular variación e índices de desempeño para pronosticar el costo y la fecha de
    finalización, no solo para reportar el pasado.
- **Radiadores de información y controles visuales**: tableros de tareas, gráficas de trabajo
  pendiente/realizado, diagramas de semáforo.
  - Cuándo usarlo: cuando se necesita que cualquiera vea el estado de un vistazo, especialmente
    en enfoques adaptativos y flujos tipo Kanban.
  - Cómo: mantenerlos visibles, fáciles de actualizar y actualizados con frecuencia; preferir
    "baja tecnología, alto contacto" cuando eso facilita el uso real del equipo.

## Conceptos clave
- **Métrica**: descripción de un atributo del proyecto o producto y cómo medirlo.
- **Línea base**: versión aprobada de un producto de trabajo usada como base de comparación
  con los resultados reales.
- **Indicador adelantado**: mide una condición que predice un cambio o tendencia futura.
- **Indicador rezagado**: mide un entregable o evento ya ocurrido.
- **Efecto Hawthorne**: el acto mismo de medir algo influye en el comportamiento de quien es
  medido.
- **Métrica de vanidad**: medida que muestra datos pero no aporta información útil para decidir.
- **Plan de excepciones**: conjunto acordado de acciones a tomar cuando se cruza, o se
  pronostica que se cruzará, un umbral establecido.

## Decisiones típicas de este dominio
Si una métrica no está vinculada al caso de negocio, la línea base o los requisitos → eliminarla,
aunque sea fácil de recolectar, porque no es significativa. Si se detecta que un umbral va a
cruzarse (por tendencia, no solo cuando ya se cruzó) → activar el plan de excepciones de forma
proactiva, no esperar al incumplimiento formal. Si el proyecto usa un enfoque adaptativo → dar
prioridad a métricas de flujo (tiempo de entrega, tiempo de ciclo, trabajo en curso) sobre EVM
clásico, que es más propio de entornos predictivos. Si dos variables muestran correlación (por
ejemplo, atraso y sobrecosto) → investigar causas raíz comunes (habilidad de estimación,
gestión del cambio) en vez de asumir causalidad directa entre ellas. Si el equipo empieza a
optimizar la métrica en vez del resultado que la métrica representa → revisar la métrica misma,
porque el efecto Hawthorne está distorsionando el comportamiento.

## Antipatrones
- **Medir solo lo fácil de medir**: las métricas de vanidad (vistas de página) desplazan a las que
  realmente informan decisiones (nuevos visitantes).
- **Confundir correlación con causalidad**: lleva a "arreglar" la variable equivocada y a repetir el
  problema real sin resolverlo.
- **Establecer objetivos inalcanzables**: desmoraliza al equipo cuando incumple sistemáticamente
  metas poco realistas, aunque la intención de ser ambicioso fuera legítima.
- **Reportar información desactualizada como si fuera vigente**: la información vieja no permite
  tomar acción oportuna, que es el propósito central de medir.
- **Sesgo de confirmación al interpretar datos**: buscar y ver solo la información que respalda la
  hipótesis previa distorsiona la lectura del desempeño real.

## Interacciones
- Con **Planificación**: las líneas base, métricas y umbrales que se miden aquí fueron definidos
  en ese dominio; la medición retroalimenta ajustes a los planes.
- Con **Trabajo del Proyecto y Entrega**: los planes forman la base de comparación contra la
  cual se evalúan las entregas reales.
- Con **Equipo e Interesados**: ambos grupos participan tanto en generar los datos (crear los
  entregables medidos) como en usar la información para decidir.
- Con **Incertidumbre**: las mediciones pueden disparar la identificación de nuevos riesgos u
  oportunidades cuando revelan que el nivel de riesgo está cambiando.
