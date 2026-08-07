# Capítulo 8: Gestión de la Configuración del Software

## Idea central
La gestión de configuración de software (SCM) da control e identidad verificable a cada versión de cada artefacto a lo largo del ciclo de vida, de modo que siempre se sepa con certeza qué se construyó, con qué se construyó, quién lo cambió y por qué.

## Marcos que introduce

- **Cinco actividades nucleares de SCM**: gestión del proceso, identificación de la configuración, control de cambios, contabilidad del estado (SCSA), auditoría de configuración, y gestión/entrega de versiones.
  - Cuándo usarlo: al diseñar o auditar un plan de SCM (SCMP) para un proyecto.
  - Cómo: documentar procedimientos propios para cada actividad en el SCMP; cada una alimenta a la siguiente — identificar los elementos, controlar sus cambios, registrar su estado, auditar su conformidad, y finalmente liberar.

- **Flujo de control de cambios (SCR)**: necesidad de cambio → investigación preliminar → revisión de la CCB → aprobado/rechazado → asignado a ingeniero → implementado → evaluado → completo.
  - Cuándo usarlo: para cualquier modificación a un elemento de configuración (CI) bajo control.
  - Cómo: registrar la solicitud de cambio (SCR), realizar análisis de impacto técnico, someterla a la autoridad de cambio correspondiente al nivel de criticidad, e implementar solo tras aprobación —manteniendo una "ruta de emergencia" documentada aparte para lo urgente.

- **Junta de Control de Configuración (CCB) con niveles de autoridad escalonados** según criticidad del elemento, impacto en presupuesto/cronograma y etapa del ciclo de vida.
  - Cuándo usarlo: al definir quién puede aprobar qué tipo de cambio.
  - Cómo: establecer múltiples niveles de CCB (o SCCB si el alcance es solo software) con representación de las partes interesadas relevantes a cada nivel; siempre debe haber un representante de SCM presente.

- **Esquema de relaciones entre elementos de configuración**: dependencia, derivación, sucesión, variante.
  - Cuándo usarlo: al construir un SBOM o decidir qué relaciones vale la pena rastrear formalmente.
  - Cómo: documentar cada relación relevante con su tipo, los CIs implicados y la fecha; usar sucesión para versionado, dependencia para análisis de impacto cruzado, derivación para orden de construcción.

## Conceptos clave
- **Elemento de configuración (CI/SCI)**: entidad de software (o hardware) designada para gestionarse como una sola unidad bajo control de cambios.
- **Línea base (baseline)**: versión formalmente aprobada de un CI, fijada en un momento del ciclo de vida, modificable solo mediante procedimiento formal de control de cambios.
- **SBOM (Software Bill of Materials)**: registro formal de los CIs de la cadena de suministro de software y sus relaciones.
- **Auditoría de configuración funcional (FCA)**: verifica que el software cumple las especificaciones que lo rigen.
- **Auditoría de configuración física (PCA)**: verifica que el diseño y la documentación de referencia sean coherentes con el producto tal como fue construido.
- **Desviación vs. exención**: la desviación autoriza apartarse de un requisito antes de fabricar; la exención autoriza aceptar un CI que ya se desvió, detectado tras el hecho.
- **Biblioteca de medios definitiva**: contiene las líneas base de lanzamiento listas para desplegarse en entornos de prueba, staging o producción.

## Modelos mentales
Piensa en SCM como el sistema nervioso que conecta desarrollo, mantenimiento y operaciones: sin él, cada equipo tiene su propia versión de "qué versión es esta".

Usa la pregunta "¿esto necesita ser un CI?" como filtro de alcance: demasiados CIs generan sobrecarga de gestión; muy pocos dejan puntos ciegos sobre cambios reales.

Piensa en la CCB no como obstáculo burocrático sino como el mecanismo que traduce "quiero cambiar esto" en una decisión informada de coste/riesgo/impacto — su formalidad debe escalar con la criticidad, no ser uniforme para todos los cambios.

Trata la trazabilidad de relaciones (dependencia, derivación, sucesión) como inversión selectiva: rastrea solo aquellas cuyo costo de seguimiento es menor que el valor de decisión que aportan.

## Antipatrones
- **Rastrear solo MRs/PRs y no todos los cambios reales** al producto e infraestructura: deja huecos de control exactamente donde ocurren los incidentes.
- **Un banco de herramientas SCM "abierto" sin evaluar integración**: mezclar herramientas de distintos proveedores sin verificar que se integran entre sí y con el resto del entorno de ingeniería.
- **Confundir el plan de SCM con el plan de calidad**: el SCMP no debe entrar en conflicto ni duplicar el plan de aseguramiento de calidad; deben ser complementarios y coordinados.
- **Omitir la auditoría física (PCA)**: entregar software cuya documentación de referencia ya no coincide con lo realmente construido, lo que rompe la mantenibilidad futura.

## Tablas de referencia

| Actividad SCM | Pregunta que responde |
|---|---|
| Identificación de configuración | ¿Qué está bajo control y cómo se etiqueta? |
| Control de cambios | ¿Qué cambios se autorizan, quién decide? |
| Contabilidad del estado (SCSA) | ¿Cuál es el estado actual de cada CI y sus relaciones? |
| Auditoría de configuración | ¿El CI cumple lo que dice cumplir (funcional/físico)? |
| Gestión y entrega de versiones | ¿Qué se empaqueta, cuándo se libera, a quién? |

| Tipo de auditoría | Verifica |
|---|---|
| FCA (funcional) | Cumplimiento de especificaciones |
| PCA (física) | Coherencia diseño/documentación vs. producto construido |
| En proceso | Cumplimiento continuo durante desarrollo, antes de línea base |

## Puntos clave
- Define el SCMP antes de iniciar el proyecto y ajústalo por proyecto a partir de una plantilla organizacional.
- Toda solicitud de cambio pasa por análisis de impacto y aprobación de la CCB correspondiente antes de implementarse, salvo la ruta de emergencia documentada.
- Usa el SBOM para mantener trazabilidad de dependencias, derivación y sucesión entre CIs, especialmente en cadenas de suministro con componentes de terceros.
- En integración continua, automatiza SCM: cada commit dispara compilación, análisis estático, pruebas y generación de SBOM sin intervención manual.
- Reserva las auditorías formales (FCA/PCA) para contratos que las exigen o software crítico; para el resto, las revisiones en proceso suelen bastar.

## Conecta con
- **Mantenimiento de Software**: todo SCR de mantenimiento fluye por el mismo proceso de control de cambios de SCM.
- **Calidad del Software**: SQA y SCM comparten objetivos de conformidad; la auditoría de configuración es un tipo de revisión de calidad.
- **Gestión de Ingeniería de Software**: la planificación de recursos y cronograma de SCM se integra en el plan general del proyecto.
- **Proceso de Ingeniería de Software**: SCM es uno de los procesos de gestión técnica del ciclo de vida (ISO/IEC/IEEE 12207).
