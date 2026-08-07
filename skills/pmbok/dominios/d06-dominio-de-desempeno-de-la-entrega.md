# Dominio de desempeño: Entrega

## Qué cubre
Agrupa el trabajo de cumplir requisitos, alcance y expectativas de calidad para producir los
entregables que impulsan el valor de negocio previsto. Cubre desde la recolección y gestión de
requisitos hasta la definición de "terminado" y el manejo del costo de la calidad, tanto en
entornos donde el alcance está fijo como en aquellos donde evoluciona.

## Resultados esperados
- Los proyectos contribuyen al valor de negocio y a los resultados previstos de la organización.
- Los interesados aceptan y quedan satisfechos con los entregables del proyecto.
- Se cumplen los objetivos del proyecto.

## Cómo verificar que va bien
| Resultado | Cómo se comprueba |
|---|---|
| Contribución al valor de negocio | El entregable se compara contra el caso de negocio y sigue alineado con los beneficios proyectados |
| Aceptación y satisfacción de interesados | Se cumplen los criterios de aceptación o la definición de terminado sin retrabajo mayor posterior |
| Cumplimiento de objetivos | Alcance, calidad y requisitos entregados corresponden a lo comprometido, con desviaciones gestionadas conscientemente |

## Marcos y técnicas que aplica
- **Recolección y gestión de requisitos**: extraer, documentar y mantener acuerdo sobre lo que
  el producto debe hacer.
  - Cuándo usarlo: siempre, pero con técnica distinta según el contexto —entrevistas y análisis
    de datos cuando el alcance es estable; prototipos y demostraciones cuando los requisitos
    van a evolucionar ("lo sabré cuando lo vea").
  - Cómo: documentar requisitos claros, concisos, verificables, consistentes, completos y
    trazables; asignar a alguien (analista, dueño de producto) la responsabilidad de gestionarlos.
- **Descomposición del alcance — EDT vs. temas/épicas/historias**: dos formas jerárquicas de
  desglosar el trabajo.
  - Cuándo usarlo: EDT en enfoques predictivos con alcance estable; temas → épicas →
    características → historias de usuario en enfoques adaptativos.
  - Cómo: descomponer hasta el nivel de detalle necesario para estimar y ejecutar, sin
    sobre-planificar historias que pueden cambiar (definir el detalle en el último momento
    responsable).
- **Costo de la calidad (COQ)**: modelo de cuatro categorías —prevención, evaluación, falla
  interna, falla externa— para equilibrar inversión en calidad contra costo del incumplimiento.
  - Cuándo usarlo: al decidir cuánto invertir en prevenir y detectar defectos temprano frente al
    riesgo de descubrirlos tarde.
  - Cómo: invertir en prevención y evaluación (más barato) reduce la exposición a fallas internas
    y externas (mucho más caras, incluida la reputación).
- **Curva de costo del cambio**: principio de que corregir un defecto es más caro cuanto más
  tarde se detecta.
  - Cuándo usarlo: para justificar inspección y revisión tempranas frente a "probar la calidad al
    final".
  - Cómo: incorporar analistas de calidad desde el diseño, no solo al final del desarrollo.

## Conceptos clave
- **Requisito**: condición o capacidad que debe estar presente en un producto, servicio o
  resultado para satisfacer una necesidad de negocio.
- **Estructura de Desglose del Trabajo (EDT/WBS)**: descomposición jerárquica del alcance total
  del trabajo del proyecto.
- **Definición de Terminado (DoD)**: lista de verificación con todos los criterios para que un
  entregable se considere listo para el cliente, típica de enfoques adaptativos.
- **Calidad**: grado en que un conjunto de características inherentes satisface los requisitos.
- **Costo de la Calidad (COQ)**: suma de costos de prevención, evaluación, falla interna y falla
  externa a lo largo de la vida del producto.
- **Deriva de lo terminado (done drift)**: fenómeno en que el objetivo de "terminado" se mueve
  porque el entorno competitivo cambia mientras el proyecto avanza.
- **Corrupción o deslizamiento del alcance**: aceptar alcance adicional sin ajustar cronograma,
  presupuesto o recursos.

## Decisiones típicas de este dominio
Si el alcance es estable y bien entendido → documentar requisitos por adelantado y usar una
EDT. Si el alcance va a evolucionar → usar temas/épicas/historias y descubrir requisitos de forma
progresiva con prototipos. Si un defecto se detecta temprano en el diseño → corregirlo de
inmediato, porque el costo crece exponencialmente cuanto más tarde se descubre. Si el mercado
mueve el objetivo de "terminado" (competidores lanzan más funciones) → decidir
conscientemente si se libera el producto tal como está o se sigue actualizando, en vez de dejar
que el lanzamiento se posponga indefinidamente. Si se propone alcance adicional sin ajustar
recursos → pasarlo por control de cambios formal en vez de aceptarlo silenciosamente
("corrupción de alcance"). Si el resultado del proyecto es incierto por naturaleza (I+D,
innovación) → aceptar que puede haber resultados subóptimos como parte inherente de la
incertidumbre, no como fallo de ejecución.

## Antipatrones
- **Intentar "probar la calidad" al final del desarrollo**: descubrir defectos tarde es
  prohibitivamente caro por retrabajo y por el efecto dominó sobre otros entregables e
  interesados.
- **Aceptar alcance adicional sin ajustar cronograma, presupuesto o recursos**: la corrupción del
  alcance es la vía más silenciosa hacia el fracaso del proyecto.
- **Tratar los requisitos como estáticos cuando el contexto es incierto**: fuerza documentación
  prematura que se volverá obsoleta y genera falsa sensación de control.
- **Medir solo la producción de entregables sin verificar aceptación real**: entregar volumen no
  es lo mismo que entregar valor aceptado por el interesado.

## Interacciones
- Con **Planificación**: la entrega es la culminación de lo que ese dominio organiza; el alcance,
  las estimaciones y el cronograma planificados se materializan aquí.
- Con **Enfoque de desarrollo**: la cadencia de entrega se basa directamente en cómo se
  estructuró el trabajo en ese dominio.
- Con **Trabajo del Proyecto**: ese dominio habilita las entregas mediante procesos, recursos
  físicos y adquisiciones gestionados operativamente.
- Con **Incertidumbre**: la naturaleza del trabajo para crear los entregables influye en cómo el
  equipo navega la incertidumbre asociada al proyecto.
