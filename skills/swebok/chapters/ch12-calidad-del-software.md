# Capítulo 12: Calidad del Software

## Idea central
La calidad del software es la conformidad con requisitos que reflejan fielmente las necesidades reales de las partes interesadas —no ausencia de defectos por sí sola— y exige gestionar simultáneamente la calidad del proceso, del producto final y de los productos de trabajo intermedios.

## Marcos que introduce

- **Costo de la Calidad del Software (CoSQ)**: costo de conformidad (prevención + evaluación) + costo de no conformidad (fallas internas/pre-entrega + fallas externas/post-entrega).
  - Cuándo usarlo: al justificar ante la dirección la inversión en SQA frente a la percepción de que es "caro".
  - Cómo: sumar costos de prevención (mejora de proceso, herramientas, capacitación) + evaluación (revisiones, pruebas, auditorías) + no conformidad (retrabajo interno y externo, incluido el impacto en el cliente); buscar el CoSQ óptimo, no el mínimo de evaluación.

- **Niveles de integridad del software** como mecanismo de gestión de riesgo.
  - Cuándo usarlo: en sistemas críticos para la seguridad (aviónica, ferroviario, médico, nuclear) para calibrar cuánto rigor de V&V aplicar.
  - Cómo: asignar un nivel de integridad según complejidad, criticidad, riesgo, seguridad y confiabilidad requeridas; usar ese nivel para determinar las técnicas mínimas de V&V obligatorias (según estándares del sector, p. ej. DO-178C, EN 50128).

- **V&V clasificada en estática, dinámica y formal (IEEE 1012)**.
  - Cuándo usarlo: al planificar qué técnicas de verificación/validación aplicar a cada producto de trabajo según su nivel de integridad.
  - Cómo: aplicar técnicas estáticas (lectura de código, revisión por pares, análisis estático) sin ejecutar software; dinámicas (pruebas, simulación) ejecutando el software; formales (verificación de modelos, prueba matemática) para requisitos críticos de seguridad; combinarlas porque no hay límites nítidos entre ellas.

- **Sistema de Gestión de Calidad (SGC) según ISO 9001/90003**: procesos + responsables + requisitos de proceso + mediciones + canales de retroalimentación a lo largo del ciclo de vida.
  - Cuándo usarlo: al establecer o auditar la infraestructura organizacional de calidad de una empresa de software.
  - Cómo: documentar políticas, procesos y procedimientos con suficiente detalle para que roles y responsabilidades sean claros; asignar responsabilidad y autoridad para el SGC independiente de la gestión de proyecto; evaluar madurez con modelos como ISO/IEC TS 33061 (niveles 0-5).

## Conceptos clave
- **Error / defecto / falla**: el error es la acción humana que inserta el defecto en el producto de trabajo; el defecto (o fallo) es la imperfección latente; la falla es la manifestación externa visible cuando el software ejecuta el defecto.
- **Verificación vs. validación**: verificación confirma que "se construye el producto correctamente" (cumple especificaciones de la fase previa); validación confirma que "se construye el producto correcto" (cumple el propósito real).
- **Nivel de integridad del software**: valor que representa la importancia del sistema/software para el usuario según complejidad, criticidad y riesgo; determina qué técnicas mínimas de V&V son obligatorias.
- **IV&V (verificación y validación independiente)**: V&V ejecutada por una organización técnica, administrativa y financieramente independiente del equipo de desarrollo.
- **Caso de aseguramiento (assurance case)**: artefacto razonado y auditable que sustenta una afirmación de calidad/seguridad mediante evidencia, argumentos y supuestos explícitos.
- **Software crítico para la seguridad, directo e indirecto**: el directo está embebido en el sistema crítico; el indirecto son las herramientas usadas para desarrollarlo (entornos de ingeniería, de prueba).
- **Densidad de defectos / densidad de errores / tasa de fallos**: medidas cuantitativas estándar de calidad usadas para estimar fiabilidad y decidir cuándo detener pruebas.

## Modelos mentales
Piensa en la calidad como tres capas separables pero interdependientes: calidad de proceso, calidad de producto final, calidad de productos de trabajo intermedios — mejorar solo una no basta.

Usa el CoSQ para reencuadrar la conversación con la dirección: no es "¿cuánto cuesta la calidad?" sino "¿cuánto cuesta ya la falta de calidad, solo que oculto en retrabajo y fallas externas?".

Trata el nivel de integridad como un dial, no un interruptor: a más criticidad, más independencia y rigor de V&V exigidos — no todo el software necesita el mismo nivel de rigor.

Piensa en las revisiones y auditorías como técnicas de análisis estático (no ejecutan nada): son la forma más barata de detectar defectos, porque ocurren antes de que el defecto se codifique en comportamiento ejecutable.

## Antipatrones
- **Igualar SQA con "hacer pruebas"**: la SQA abarca todo el ciclo de vida (revisiones, auditorías, gestión de configuración, V&V) y su atributo clave en sistemas críticos es la independencia organizacional, no solo testear al final.
- **Medir defectos sin taxonomía de clasificación**: contar cifras sin clasificar tipos y causas impide identificar causas raíz y prevenir recurrencias.
- **Aplicar el mismo rigor de V&V a todo el software sin diferenciar nivel de integridad**: desperdicia esfuerzo en lo trivial y puede quedarse corto en lo crítico.
- **Dejar la calidad de producto de trabajo intermedio sin revisión**: evaluar solo el producto final ignora que los defectos son exponencialmente más baratos de corregir cuanto antes se detectan.

## Tablas de referencia

| Categoría CoSQ | Incluye |
|---|---|
| Prevención | Mejora de procesos, herramientas, plantillas, capacitación |
| Evaluación | Revisiones, auditorías, pruebas |
| Falla interna (pre-entrega) | Retrabajo de errores hallados antes de entregar |
| Falla externa (post-entrega) | Retrabajo tras entrega + impacto en cliente/reputación |

| Técnica de V&V | Ejecuta el software | Ejemplos |
|---|---|---|
| Estática | No | Revisión por pares, análisis estático de código, inspección |
| Dinámica | Sí | Pruebas, simulación, verificación de modelos |
| Formal | Depende | Prueba matemática, lenguajes de especificación formal |

| Tipo de revisión | Enfoque |
|---|---|
| Ad hoc | Sin estructura, buscar cualquier defecto |
| Basada en lista de verificación | Sistemática contra checklist |
| Basada en escenarios | Guía estructurada de lectura |
| Basada en perspectivas | Cada revisor adopta el punto de vista de un stakeholder |
| Basada en roles | Revisor evalúa desde distintos roles de interesados |

## Puntos clave
- Cuantifica el CoSQ (conformidad + no conformidad) para argumentar inversión en calidad con cifras, no con intuición.
- Asigna nivel de integridad a cada componente crítico y calibra el rigor de V&V (estático/dinámico/formal) en función de ese nivel.
- Establece una taxonomía de clasificación de defectos desde el principio: sin ella, el análisis de causa raíz no tiene con qué trabajar.
- Planifica V&V desde etapas tempranas del ciclo de vida: detectar un defecto en requisitos es órdenes de magnitud más barato que corregirlo en producción.
- Documenta el SQAP (plan de aseguramiento de calidad) coordinado con el plan de SCM, sin conflictos entre ambos.

## Conecta con
- **Gestión de Configuración del Software**: la auditoría de configuración y el control de cambios son mecanismos compartidos de aseguramiento de calidad.
- **Pruebas de Software**: las pruebas son la principal técnica dinámica de V&V y una actividad central de control de calidad del producto.
- **Mantenimiento de Software**: la mantenibilidad es un requisito de calidad medible que se planifica desde el diseño y se audita durante el mantenimiento.
- **Requisitos de Software**: los requisitos de calidad (restricciones de calidad de servicio) son requisitos no funcionales que definen los objetivos de calidad del producto.
