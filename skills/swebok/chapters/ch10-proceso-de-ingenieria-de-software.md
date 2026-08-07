# Capítulo 10: Proceso de Ingeniería de Software

## Idea central
No existe un proceso o ciclo de vida ideal universal; los procesos de ingeniería de software deben seleccionarse, adaptarse y aplicarse según el proyecto y el contexto organizacional, y su gestión debe sustentarse en mediciones empíricas, no en preferencia ideológica entre paradigmas.

## Marcos que introduce

- **Cuatro categorías de procesos del ciclo de vida (ISO/IEC/IEEE 12207)**: técnicos, de gestión técnica, organizacionales facilitadores de proyecto, y de acuerdo.
  - Cuándo usarlo: al definir o adaptar un ciclo de vida de software completo para una organización o proyecto.
  - Cómo: especificar cada proceso de las 4 categorías con sus entradas/salidas y restricciones; los técnicos van desde análisis de negocio hasta disposición; los de gestión técnica cubren planificación, riesgo, configuración, medición y aseguramiento de calidad.

- **Continuo predictivo ↔ adaptativo de modelos de ciclo de vida**.
  - Cuándo usarlo: al elegir entre cascada, en V, incremental, espiral o ágil para un proyecto concreto.
  - Cómo: evaluar si el conjunto de requisitos es cerrado (predictivo: ejecuta los primeros 5 procesos técnicos linealmente) o si se espera evolución continua de requisitos (adaptativo: ciclos iterativos cortos con especificación progresiva).

- **Paradigma PDCA (Planificar-Hacer-Verificar-Actuar)** aplicado a evaluación y mejora de procesos.
  - Cuándo usarlo: como base de cualquier iniciativa de mejora continua de proceso, incluidas las retrospectivas ágiles.
  - Cómo: establecer un objetivo medible, ejecutar el cambio, verificar el efecto con evidencia empírica, y actuar institucionalizando la mejora si el resultado fue positivo.

- **Marcos de evaluación de procesos basados en modelo de referencia + modelo de evaluación** (CMM/CMMI, ISO/IEC 33000-SPICE).
  - Cuándo usarlo: cuando la organización necesita certificar o comparar externamente su madurez de proceso.
  - Cómo: aplicar el modelo de referencia de procesos (propósito y resultados esperados) junto con el modelo de evaluación de procesos (capacidad del proceso + madurez organizacional) del marco elegido.

## Conceptos clave
- **Proceso**: conjunto de actividades interrelacionadas que transforman entradas en salidas consumiendo recursos, con controles y mecanismos facilitadores asociados.
- **Ciclo de vida del software**: todos los procesos, actividades y tareas desde la concepción hasta el retiro, incluyendo producción, operación, evolución, adquisición y suministro.
- **Ciclo de vida abierto al cambio**: aquel que permite modificar especificaciones de requisitos incluso después de aceptadas por el cliente, previa negociación (rasgo distintivo de lo ágil).
- **Desarrollo incremental**: técnica donde requisitos, diseño, implementación y pruebas se solapan iterativamente en vez de secuencialmente, completando el producto por incrementos sucesivos.
- **Modelo de ciclo de vida del software (SLCM)**: plantilla (cascada, V, incremental, espiral, ágil) de la que se deriva un ciclo de vida específico de proyecto asignando actividades de un estándar.
- **GQM (Goal-Question-Metric)**: enfoque de Basili que parte de objetivos medibles, cambia algo y evalúa el efecto del cambio para determinar si hubo mejora.
- **Mentalidad ágil vs. prácticas ágiles**: los valores/principios (comunicación, apertura al cambio, excelencia técnica) son distintos de las prácticas concretas (pair programming, sprint planning); Agile no es un método único ni implica ausencia de documentación.

## Modelos mentales
Usa el ciclo de vida como especificación de comunicación entre personas, no como burocracia: debe ser fácil de entender y corregir porque es la base de la ingeniería técnica y de gestión.

Piensa en cascada vs. ágil no como una guerra ideológica sino como dos puntos de un mismo continuo predictivo-adaptativo, cada uno óptimo bajo distintas condiciones de certeza de requisitos.

Usa las mediciones empíricas —no la preferencia personal— para resolver debates sobre qué modelo de ciclo de vida conviene a un proyecto concreto.

Piensa en el proceso de ingeniería de software como interdisciplinario por definición: siempre involucra personas, procedimientos manuales, software y a menudo hardware, no solo código.

## Antipatrones
- **Adoptar un ciclo de vida "porque es el estándar de la industria"** sin adaptarlo a las características reales del producto y las partes interesadas: la adaptación del ciclo de vida es obligatoria, no opcional.
- **Ejecutar procesos extensos sin producir entregables intermedios**: aumenta la incertidumbre en vez de reducirla, la lección de décadas de cascada mal aplicada.
- **Confundir Agile con "más rápido porque no hay documentación"**: el Manifiesto Ágil no elimina los documentos, solo cambia su rol frente a la comunicación directa.
- **Evaluar o mejorar un proceso sin evidencia empírica**: repite el mismo error que alimentó la controversia histórica cascada-vs-ágil, decidir por moda en vez de por dato.

## Tablas de referencia

| Categoría de proceso (ISO/IEC/IEEE 12207) | Ejemplos |
|---|---|
| Técnicos | Requisitos, arquitectura, diseño, implementación, integración, verificación, validación, operación, mantenimiento, disposición |
| Gestión técnica | Planificación, evaluación/control, decisiones, riesgo, configuración, información, medición, aseguramiento de calidad |
| Organizacionales facilitadores | Modelo de ciclo de vida, infraestructura, portafolio, RRHH, calidad, conocimiento |
| De acuerdo | Adquisición, suministro |

| Modelo de ciclo de vida | Tipo | Rasgo distintivo |
|---|---|---|
| Cascada | Predictivo | Fases secuenciales, impulsado por documentos |
| Incremental | Predictivo o adaptativo | Fases solapadas, funcionalidad por incrementos |
| Espiral | Evolutivo, basado en riesgo | Iteración guiada por análisis de riesgo |
| Ágil | Adaptativo | Ciclos cortos, apertura al cambio, entrega frecuente |

## Puntos clave
- Elige el modelo de ciclo de vida según dónde se ubica el proyecto en el continuo predictivo-adaptativo, no por preferencia organizacional.
- Adapta siempre el ciclo de vida estándar a las características del producto (tamaño, criticidad, dominio) y documenta esa decisión.
- Basa cualquier evaluación o mejora de proceso en el ciclo PDCA con evidencia empírica, no en intuición o moda.
- Define estimaciones y mediciones realistas desde el diseño del proyecto: sin ellas es imposible saber si el ciclo de vida elegido está funcionando.
- Integra las herramientas del proceso (control de versiones, pruebas, gestión de configuración) en vez de tratarlas como silos independientes.

## Conecta con
- **Modelos y Métodos de Ingeniería de Software**: los métodos concretos (heurísticos, formales, ágiles) se ejecutan dentro del ciclo de vida elegido aquí.
- **Gestión de Ingeniería de Software**: la gestión de procesos técnicos, de gestión técnica y organizacional se detalla en esa área.
- **Calidad del Software**: la evaluación y mejora de procesos (CMMI, SPICE) persigue directamente mejorar la calidad del producto resultante.
- **Mantenimiento de Software**: el mantenimiento es uno de los procesos técnicos del ciclo de vida definido en ISO/IEC/IEEE 12207.
