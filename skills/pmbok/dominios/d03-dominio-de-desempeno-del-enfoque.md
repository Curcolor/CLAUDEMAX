# Dominio de desempeño: Enfoque de Desarrollo y Ciclo de Vida

## Qué cubre
Agrupa las decisiones sobre cómo se va a desarrollar el producto del proyecto (predictivo,
híbrido o adaptativo), con qué cadencia se entregará valor, y qué fases y ciclo de vida resultan
de esas dos decisiones. No es una fase previa: condiciona la forma de trabajar durante todo el
proyecto.

## Resultados esperados
- Enfoque de desarrollo coherente con los entregables del proyecto.
- Ciclo de vida del proyecto que vincula las necesidades de los interesados con el enfoque de
  desarrollo.
- Cadencia de entrega que proporciona entregables que aportan valor a los interesados.

## Cómo verificar que va bien
| Resultado | Cómo se comprueba |
|---|---|
| Enfoque coherente con los entregables | La variabilidad de requisitos y el riesgo del entregable coinciden con lo predictivo/adaptativo elegido |
| Ciclo de vida vinculado a interesados | Las fases y sus criterios de salida reflejan lo que los interesados necesitan validar en cada punto |
| Cadencia entrega valor real | Cada entrega (única, múltiple o periódica) es usable o evaluable por el interesado, no solo un hito interno |

## Marcos y técnicas que aplica
- **Espectro predictivo-híbrido-adaptativo**: clasificación de enfoques de desarrollo según cuán
  definidos estén los requisitos por adelantado.
  - Cuándo usarlo: predictivo cuando alcance y requisitos pueden fijarse temprano y son
    estables; adaptativo cuando hay alta incertidumbre y se espera evolución constante; híbrido
    cuando conviven ambas condiciones en distintos entregables.
  - Cómo: evaluar innovación, certidumbre de requisitos, estabilidad del alcance, riesgo,
    regulación y facilidad de cambio del entregable para ubicarlo en el espectro.
- **Desarrollo iterativo vs. incremental**: dos formas de construir progresivamente dentro de un
  enfoque híbrido o adaptativo.
  - Cuándo usarlo: iterativo para aclarar requisitos mediante ciclos sucesivos que refinan el
    mismo alcance; incremental para producir el entregable por partes que se suman hasta
    completarlo.
  - Cómo: iterativo evalúa versiones aproximadas y las mejora; incremental entrega
    funcionalidad completa por bloques, cada uno definitivo en sí mismo.
- **Ciclo de vida por fases (viabilidad, diseño, construcción, prueba, despliegue, cierre)**:
  estructura genérica que se adapta según el enfoque elegido.
  - Cuándo usarlo: como plantilla de referencia para diseñar el ciclo de vida propio del proyecto,
    ajustando qué fases se solapan y cuáles son secuenciales.
  - Cómo: en predictivo las fases suelen ser secuenciales con revisión de fase entre ellas; en
    adaptativo, desarrollo-prueba-despliegue tienden a solaparse por entregable.
- **Programación basada en flujo (Kanban)**: alternativa que prescinde de fases o ciclo de vida
  fijo.
  - Cuándo usarlo: entrega continua o cuando el objetivo es optimizar el flujo según capacidad
    de recursos, no cumplir una secuencia de fases.
  - Cómo: limitar el trabajo en curso y medir tiempo de ciclo y rendimiento en vez de hitos.

## Conceptos clave
- **Enfoque de desarrollo**: método usado para crear el producto —predictivo, iterativo,
  incremental, adaptativo o híbrido.
- **Cadencia de entrega**: ritmo y frecuencia de los entregables —única, múltiple, periódica o
  continua.
- **Fase del proyecto**: conjunto de actividades relacionadas lógicamente que culmina en uno o
  más entregables.
- **Ciclo de vida del proyecto**: serie de fases que el proyecto atraviesa de inicio a fin.
- **Revisión de fase**: punto de transición donde se verifica que se cumplieron los criterios de
  salida antes de continuar.
- **Entrega continua**: práctica de entregar incrementos de funcionalidad de forma inmediata,
  típica de productos digitales y enfoques DevOps.
- **Último momento responsable**: aplazar una decisión de planificación hasta que el costo de
  seguir esperando supere el beneficio, para evitar planificar trabajo que puede cambiar.

## Decisiones típicas de este dominio
Si los requisitos están bien entendidos y el equipo ya trabajó en algo similar → predictivo. Si
hay alta incertidumbre sobre requisitos o el entregable puede modularizarse → adaptativo o
híbrido. Si el entregable tiene requisitos regulatorios o de seguridad rigurosos → predictivo,
aunque el resto del proyecto sea adaptativo. Si hay urgencia de mostrar algo al mercado con
inversión mínima → cadencia adaptativa con producto mínimo viable, en vez de esperar al
entregable completo. Si el equipo es grande o está muy disperso geográficamente → inclinarse
hacia el extremo predictivo del espectro, porque los métodos ágiles rinden mejor con equipos de
7±2 personas colocalizadas. Si distintos entregables del mismo proyecto tienen perfiles de
riesgo distintos → aplicar un enfoque híbrido, prediciendo unos y adaptando otros, no forzar un
único enfoque para todo el proyecto.

## Antipatrones
- **Confundir "enfoque de desarrollo" con "ciclo de vida"**: llamar "ágil" a un ciclo de vida
  cuando en realidad se está hablando del enfoque de desarrollo genera malentendidos entre
  equipos y organizaciones.
- **Adoptar métodos adaptativos sin cambiar la mentalidad organizacional**: declarar que la
  organización "ahora es ágil" sin ajustar políticas, estructura de reporte y cultura no produce
  los beneficios esperados.
- **Planificar todo por adelantado en un entorno de alta incertidumbre**: desperdicia esfuerzo
  en planes que cambiarán y retrasa el aprendizaje que un enfoque adaptativo habría dado antes.
- **Permitir la corrupción o deriva de "terminado" sin decidirlo conscientemente**: dejar que el
  objetivo de finalización se mueva indefinidamente sin una decisión explícita de cuándo liberar.

## Interacciones
- Con **Interesados**: los enfoques adaptativos exigen participación significativa y continua de
  interesados clave como el dueño del producto.
- Con **Planificación**: el ciclo de vida seleccionado determina cuánta planificación se hace por
  adelantado y cuánta se elabora progresivamente.
- Con **Entrega**: hay solapamiento fuerte —la cadencia de entrega es uno de los principales
  impulsores de cómo se materializa el valor definido en el caso de negocio.
- Con **Equipo**: la forma de trabajar y el estilo de liderazgo cambian sustancialmente según el
  enfoque, de más control en predictivo a más liderazgo servicial en adaptativo.
- Con **Incertidumbre**: el enfoque y la cadencia son en sí mismos mecanismos para reducir
  incertidumbre —por ejemplo, liberando un MVP para validar aceptación antes de invertir más.
