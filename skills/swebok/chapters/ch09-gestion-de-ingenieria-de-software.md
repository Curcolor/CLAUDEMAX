# Capítulo 9: Gestión de Ingeniería de Software

## Idea central
La gestión de ingeniería de software combina gestión de proyectos y medición en una sola disciplina porque decidir sin medir es indisciplina y medir sin gestionar carece de propósito; el software lo exige por ser intangible, maleable y de desarrollo iterativo por naturaleza.

## Marcos que introduce

- **Siete actividades del ciclo de gestión**: Iniciación y definición de alcance, Planificación de proyecto, Implementación (ejecución), Revisión y evaluación, Cierre, Medición de ingeniería de software, Herramientas.
  - Cuándo usarlo: como columna vertebral para estructurar la gestión de cualquier proyecto de software, sea cual sea el SDLC elegido.
  - Cómo: recorrer las actividades (no fases estrictas) en el orden que dicte el continuo predictivo-adaptativo del proyecto, repitiendo planificación/ejecución/revisión en cada iteración si el ciclo de vida es adaptativo.

- **Continuo predictivo-adaptativo de ciclos de vida de proyecto (SWX/PMBOK)**.
  - Cuándo usarlo: al decidir cuánto planificar por adelantado frente a cuánto dejar para revisión iterativa.
  - Cómo: evaluar cómo el proyecto gestiona requisitos, riesgos, costos y participación de interesados; los altamente predictivos fijan arquitectura/requisitos y planifican por hitos; los altamente adaptativos especifican progresivamente con ciclos cortos y participación continua de interesados.

- **Programa de medición en cuatro pasos (ISO/IEC/IEEE 15939)**: establecer y mantener el compromiso de medición, planificar el proceso de medición, realizar el proceso de medición, evaluar la medición.
  - Cuándo usarlo: al montar o madurar un programa de medición de ingeniería de software.
  - Cómo: (1) establecer alcance y compromiso de recursos; (2) caracterizar la unidad organizativa, identificar necesidades de información, seleccionar medidas y definir procedimientos de recolección/análisis; (3) integrar la recolección en los procesos reales y comunicar resultados; (4) evaluar los productos de información contra criterios y buscar mejoras.

- **Matriz RACI** (responsable, aprobador, consultado, informado) para asignación de recursos y roles.
  - Cuándo usarlo: al asignar tareas o entregables a personas/equipos, especialmente ante ambigüedad de responsabilidad.
  - Cómo: para cada tarea, marcar quién produce el entregable (R), quién rinde cuentas final (A), a quién se consulta antes de decidir y a quién se informa después.

## Conceptos clave
- **Gestión de ingeniería de software (SEM)**: planificación, estimación, medición, control, coordinación, liderazgo y gestión de riesgo de un proyecto de software para entregar productos/servicios de forma eficiente y eficaz.
- **SDLC predictivo vs. adaptativo**: el predictivo fija arquitectura/requisitos y planifica linealmente; el adaptativo especifica progresivamente con ciclos iterativos cortos.
- **Registro de riesgos**: documento repositorio de todos los riesgos identificados y su información asociada; herramienta central de gestión de riesgos.
- **EDT (estructura de desglose del trabajo)**: descomposición jerárquica del trabajo en tareas manejables; no incluye por sí misma líneas base de costo/cronograma.
- **Análisis de varianza**: comparación de resultados/valores reales contra los esperados (costo, cronograma, calidad) para detectar desviaciones y disparar acciones correctivas.
- **Dev/Sec/Ops**: cultura ágil que integra desarrollo, seguridad y operaciones en un equipo único, moviendo pruebas y seguridad "a la izquierda" mediante automatización continua.
- **Adquisición de software**: obtención de componentes vía COTS, desarrollo a medida por terceros, código abierto, software prestado por el cliente, o SaaS; cada vía exige un enfoque de gestión distinto.

## Modelos mentales
Piensa en gestión y medición como una sola disciplina, no dos: cada decisión de gestión debe apoyarse en datos, y cada medida debe existir para habilitar una decisión concreta.

Usa el continuo predictivo-adaptativo como espectro, no como binario: la mayoría de proyectos reales se ubica en un punto intermedio según cuánto se conocen requisitos y arquitectura de antemano.

Piensa en las "fases" como entregables que marcan control, no como compartimentos rígidos: lo que importa es qué se completó y aceptó, no el nombre de la etapa.

Usa el riesgo como la diferencia entre incertidumbre (falta de información) y su efecto sobre objetivos (positivo o negativo): no todo lo desconocido es una amenaza.

## Antipatrones
- **Gestionar sin medir**: decisiones basadas en percepción en vez de datos históricos y de proyecto, el síntoma clásico detrás de que "los proyectos de software siempre llegan tarde y sobre presupuesto".
- **Tratar el alcance y los requisitos como inamovibles**: ignora la inevitabilidad del cambio; lo correcto es acordar de antemano cómo y cuándo se revisan, no si se revisan.
- **Sobre-invertir en planificación detallada en proyectos altamente adaptativos**: dedicar el mismo esfuerzo a planes de alcance/costo/cronograma que en un proyecto predictivo, cuando debería ir a monitoreo y trazabilidad.
- **Adquirir librerías/dependencias de terceros sin control de riesgo**: la facilidad de los IDE y gestores de paquetes para importar bibliotecas externas amplía la superficie de ataque sin que nadie lo evalúe.

## Tablas de referencia

| Característica | SDLC predictivo | SDLC adaptativo |
|---|---|---|
| Requisitos | Especificados y cerrados temprano | Especificación progresiva |
| Planificación | Detallada al inicio | Evoluciona por ciclo |
| Riesgo/costo | Reducidos por planificación anticipada | Reducidos por evolución iterativa |
| Interesados | Participación en hitos planificados | Participación continua |

| Tema | Qué cubre |
|---|---|
| Iniciación y definición de alcance | Requisitos, viabilidad, EDT inicial |
| Planificación de proyecto | Proceso, entregables, estimación, riesgo, calidad, planes |
| Implementación | Ejecución de planes, adquisición, medición, control, informes |
| Revisión y evaluación | Cumplimiento de requisitos, desempeño |
| Cierre | Confirmación de cierre, archivo, retrospectiva |
| Medición | Compromiso, planificación, ejecución, evaluación |
| Herramientas | Planificación/seguimiento, riesgo, comunicación, medición |

## Puntos clave
- Ubica cada proyecto en el continuo predictivo-adaptativo antes de decidir cuánto planificar por adelantado.
- Instaura un registro de riesgos vivo desde el inicio del proyecto y revísalo periódicamente, no solo al arranque.
- Construye el programa de medición en los 4 pasos de ISO/IEC/IEEE 15939 y liga cada medida a una necesidad de información real.
- Usa RACI para eliminar ambigüedad de responsabilidad, especialmente con adquisición externa o equipos distribuidos.
- Al cerrar un proyecto, fase o iteración, ejecuta retrospectiva y actualiza la base de datos de medición organizacional.

## Conecta con
- **Proceso de Ingeniería de Software**: SEM opera sobre el SDLC elegido; la gestión de procesos es uno de los tres niveles de gestión organizacional.
- **Gestión de Configuración del Software**: SCM cubre identificación, control de cambios y entrega de versiones que SEM debe planificar y supervisar.
- **Calidad del Software**: la gestión de calidad del proyecto y los requisitos de calidad de software son parte explícita de la planificación SEM.
- **Economía de la Ingeniería de Software**: la estimación de esfuerzo/costo/cronograma se apoya en las técnicas de esa área de conocimiento.
