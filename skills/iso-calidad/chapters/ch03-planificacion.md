# Planificación (ISO 9001:2015, cláusula 6)

## Idea central
Planificar en 9001:2015 significa tres cosas concretas y encadenadas: decidir qué riesgos y oportunidades hay que abordar (6.1), traducir la política de la calidad en objetivos medibles con un plan de acción (6.2), y controlar los cambios al SGC para que no introduzcan riesgo no evaluado (6.3). Es la cláusula que conecta el diagnóstico de contexto (cláusula 4) con la operación real (cláusula 8).

## Marcos que introduce
- **Acciones para abordar riesgos y oportunidades (cláusula 6.1)**: al planificar el SGC, la organización determina qué riesgos y oportunidades — derivados del contexto (4.1) y las partes interesadas (4.2) — necesita abordar para asegurar que el SGC logra sus resultados previstos, aumentar efectos deseables, prevenir o reducir efectos no deseados, y lograr la mejora.
  - Cuándo usarlo: en la planificación inicial del SGC y cada vez que cambie el contexto.
  - Cómo: se planifican acciones proporcionales al impacto potencial en la conformidad de productos y servicios; se integran en los procesos del SGC (4.4); y se evalúa su eficacia. La norma da opciones para tratar el riesgo (evitarlo, asumirlo para perseguir una oportunidad, eliminar la fuente, cambiar probabilidad o consecuencias, compartirlo o mantenerlo por decisión informada), pero deliberadamente no exige un método formal de gestión de riesgo ni un proceso documentado — la organización decide el nivel de formalidad proporcional a su tamaño y complejidad.
- **Objetivos de la calidad y planificación para lograrlos (cláusula 6.2)**: los objetivos convierten la política (5.2) en metas verificables, con plazos y responsables.
  - Cuándo usarlo: al desplegar la política de la calidad en funciones, niveles y procesos pertinentes.
  - Cómo: los objetivos deben ser coherentes con la política, medibles, tener en cuenta los requisitos aplicables, ser pertinentes para la conformidad de productos/servicios y para aumentar la satisfacción del cliente, hacerse seguimiento, comunicarse y actualizarse según proceda. La planificación para lograrlos debe determinar qué se hará, qué recursos se requerirán, quién será responsable, cuándo se finalizará y cómo se evaluarán los resultados.
- **Planificación de los cambios (cláusula 6.3)**: cuando la organización determina la necesidad de cambiar el SGC, el cambio se lleva a cabo de manera planificada, no reactiva.
  - Cuándo usarlo: ante cualquier modificación relevante de procesos, estructura, alcance o recursos del SGC.
  - Cómo: se considera el propósito del cambio y sus consecuencias potenciales, la integridad del SGC, la disponibilidad de recursos, y la asignación o reasignación de responsabilidades y autoridades.

## Conceptos clave
- **Riesgo**: efecto de la incertidumbre sobre un resultado esperado; puede ser positivo o negativo (ISO 9000:2015, 3.7.9).
- **Oportunidad**: situación favorable derivada del pensamiento basado en riesgos que puede conducir a nuevas prácticas, productos, mercados o clientes.
- **Objetivo de la calidad**: objetivo relativo a la calidad, generalmente basado en la política de la calidad de la organización (ISO 9000:2015, 3.7.2).
- **Pensamiento basado en riesgos como sustituto de la acción preventiva**: la norma 2015 no tiene un apartado separado de "acción preventiva" porque su función se cubre mediante el pensamiento basado en riesgos aplicado en 4.1, 4.2 y 6.1.

## Modelos mentales
Piensa en 6.1 como el filtro que decide qué merece atención de las docenas de cuestiones identificadas en 4.1-4.2: no todo riesgo detectado exige una acción formal — la acción debe ser proporcional al impacto potencial sobre la conformidad de productos y servicios.

Usa la cadena política → objetivos → plan de acción (5.2 → 6.2) como prueba de despliegue real: si un objetivo de calidad no puede rastrearse hasta un compromiso concreto de la política, probablemente se inventó para llenar un formulario, no para dirigir el negocio.

## Antipatrones
- **Matriz de riesgos elaborada que nadie revisa después**: cumplir 6.1 con una plantilla de riesgo/probabilidad/impacto que se llena una vez y no vuelve a tocarse no cumple el requisito de evaluar la eficacia de las acciones.
- **Objetivos de calidad no medibles** ("mejorar la satisfacción del cliente"): sin indicador, plazo y responsable, el objetivo no cumple 6.2.1 y no es auditable.
- **Cambiar el SGC sin planificación** (por ejemplo, reorganizar procesos de un día para otro por presión comercial): 6.3 exige considerar consecuencias e integridad del sistema antes de ejecutar, no después.
- **Confundir gestión de riesgos con cumplimiento normativo genérico** (por ejemplo, ISO 31000) como requisito obligatorio: la norma es explícita en que no exige un método formal, aunque la organización puede adoptarlo si aporta valor.

## Aplicado a una empresa de software
El riesgo típico de una empresa de desarrollo (6.1) no es abstracto: dependencia de un único proveedor cloud, rotación de un desarrollador clave que concentra conocimiento no documentado, vulnerabilidades en librerías de terceros, o incumplimiento de un SLA de disponibilidad. Las oportunidades pueden ser tan concretas como automatizar un proceso manual de despliegue para reducir errores humanos. La acción proporcional al riesgo puede ser tan simple como exigir revisión de código de dos personas para módulos críticos, sin necesidad de un comité de riesgos formal.

Los objetivos de calidad (6.2) de una empresa de software se traducen naturalmente en métricas de ingeniería: porcentaje de cobertura de pruebas automatizadas, tiempo medio de resolución de incidentes (MTTR), tasa de defectos escapados a producción, tiempo de ciclo de una historia de usuario. Cada uno necesita dueño, plazo y forma de medición — eso es la "planificación para lograrlos" que pide 6.2.2.

La planificación de cambios (6.3) aplica directamente a migraciones de arquitectura, cambio de stack tecnológico o adopción de un nuevo proceso de despliegue: antes de migrar de monolito a microservicios, por ejemplo, hay que planificar el impacto en el equipo, en los recursos y en la continuidad del servicio — no improvisarlo en producción.

## Puntos clave
1. 6.1 exige proporcionalidad: el rigor de la acción debe corresponder al impacto potencial, no a un procedimiento único para todos los riesgos.
2. La norma no exige gestión de riesgos formal ni documentada — la organización decide el nivel de formalidad.
3. Los objetivos de calidad (6.2) deben ser medibles y trazables a la política; sin eso, no son auditables.
4. Todo cambio relevante al SGC (6.3) se planifica considerando consecuencias, integridad del sistema y recursos antes de ejecutarse.

## Conecta con
- **Cap01 (Contexto de la organización)**: 6.1 procesa directamente las cuestiones de 4.1 y los requisitos de partes interesadas de 4.2.
- **Cap02 (Liderazgo)**: los objetivos de 6.2 solo tienen sentido si se derivan de la política de 5.2.
- **Cap06 (Evaluación del desempeño)**: el cumplimiento de los objetivos de calidad se revisa en 9.1 (seguimiento y medición) y 9.3 (revisión por la dirección).
- **`[[swebok]]`**: la gestión de riesgos técnicos (deuda técnica, dependencias, arquitectura) descrita en las áreas de gestión de ingeniería de software alimenta directamente el análisis de 6.1.
