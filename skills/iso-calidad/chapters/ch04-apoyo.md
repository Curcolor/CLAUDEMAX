# Apoyo (ISO 9001:2015, cláusula 7)

## Idea central
"Apoyo" agrupa todo lo que un proceso necesita para funcionar sin depender de la improvisación: recursos, personas competentes, conocimiento institucional, conciencia del personal, comunicación y control de la información documentada. Es la cláusula más operativa de las de planificación (5-7) y la que más volumen de evidencia genera en una auditoría.

## Marcos que introduce
- **Recursos (cláusula 7.1)**: siete subapartados que cubren generalidades, personas, infraestructura, ambiente para la operación de los procesos, recursos de seguimiento y medición, trazabilidad de las mediciones, y conocimientos de la organización.
  - Cuándo usarlo: al determinar qué necesita cada proceso para operar y lograr conformidad de productos y servicios.
  - Cómo: se determinan las capacidades y limitaciones de recursos internos existentes y qué se necesita obtener externamente (7.1.1); se proveen las personas necesarias (7.1.2); la infraestructura — edificios, hardware y software, transporte, TIC (7.1.3); un ambiente de operación adecuado, combinando factores sociales, psicológicos y físicos (7.1.4); recursos de seguimiento y medición válidos y fiables, con trazabilidad a patrones de medición cuando sea un requisito (7.1.5); y los conocimientos organizacionales necesarios para operar los procesos, mantenidos y disponibles, con un proceso para adquirir conocimiento adicional cuando cambian las necesidades (7.1.6).
- **Competencia (cláusula 7.2)**: asegurar que las personas que afectan el desempeño y la eficacia del SGC son competentes con base en educación, formación o experiencia.
  - Cuándo usarlo: al asignar personal a procesos que impactan la conformidad de productos y servicios.
  - Cómo: determinar la competencia necesaria, asegurarse de que las personas son competentes, y cuando aplique, tomar acciones para adquirir la competencia necesaria y evaluar su eficacia; conservar información documentada como evidencia.
- **Toma de conciencia (cláusula 7.3)**: las personas que trabajan bajo el control de la organización deben ser conscientes de la política, los objetivos pertinentes, su contribución a la eficacia del SGC (incluyendo los beneficios de mejorar el desempeño) y las implicaciones de no ser conforme con los requisitos.
  - Cuándo usarlo: como diferencia entre "saber que existe una política" y "entender qué significa para mi trabajo diario".
- **Comunicación (cláusula 7.4)**: determinar las comunicaciones internas y externas pertinentes al SGC.
  - Cuándo usarlo: al diseñar quién necesita saber qué, cuándo y cómo.
  - Cómo: se determina qué comunicar, cuándo, a quién, cómo y quién comunica.
- **Información documentada (cláusula 7.5)**: reemplaza los términos dispersos "documento", "procedimiento documentado", "manual de calidad" y "registro" de la versión 2008.
  - Cuándo usarlo: para decidir qué mantener (procedimientos, políticas) y qué conservar (evidencia de resultados, registros).
  - Cómo: al crear y actualizar información documentada, asegurar identificación y descripción apropiadas, formato y medio de soporte adecuados, y revisión/aprobación de conveniencia y adecuación (7.5.2). El control debe garantizar que esté disponible, idónea para su uso y protegida (por ejemplo, contra pérdida de confidencialidad o de integridad), abordando distribución, acceso, recuperación, uso, almacenamiento, preservación, control de cambios (control de versión) y disposición (7.5.3).

## Conceptos clave
- **Competencia**: capacidad para aplicar conocimientos y habilidades con el fin de lograr los resultados previstos (ISO 9000:2015, 3.10.4).
- **Conocimientos de la organización**: conocimiento específico que la organización adquiere generalmente con la experiencia; se comparte para lograr objetivos y puede basarse en fuentes internas (propiedad intelectual, lecciones aprendidas) o externas (normas, academia, clientes).
- **Trazabilidad de las mediciones**: relación de un resultado de medición con patrones de medición nacionales o internacionales, mediante una cadena documentada de calibraciones.
- **Información documentada**: información que una organización necesita controlar y mantener, y el medio que la contiene (ISO 9000:2015, 3.8.6); sustituye completamente "documento" y "registro" como categorías separadas.

## Modelos mentales
Piensa en 7.1.6 (conocimientos de la organización) como el requisito que existe explícitamente para evitar la pérdida de conocimiento por rotación de personal — es la norma reconociendo que el conocimiento tácito es un riesgo operativo, no solo un activo.

Usa la secuencia competencia (7.2) → toma de conciencia (7.3) → comunicación (7.4) como capas: competencia es "puede hacerlo", conciencia es "entiende por qué importa", comunicación es "sabe lo que está pasando". Faltar una sola capa deja el sistema incompleto aunque las otras dos estén bien resueltas.

## Antipatrones
- **Confundir "documentar mucho" con "cumplir 7.5"**: la norma no fija un volumen mínimo de documentos; exige que lo que se documenta esté controlado y sea idóneo, no que exista en cantidad.
- **Formación como evento único sin evaluación de eficacia**: capacitar sin verificar después que la competencia se adquirió no cierra el ciclo de 7.2.
- **Conocimiento crítico solo en la cabeza de una persona**: es exactamente el riesgo que 7.1.6 pide gestionar activamente.
- **Comunicación interna que solo fluye hacia abajo**: 7.4 no distingue dirección; canales para que el personal reporte hacia arriba (no conformidades, ideas de mejora) también son parte del requisito.

## Aplicado a una empresa de software
Los "recursos de seguimiento y medición" (7.1.5) de una empresa de software no son instrumentos físicos calibrados sino herramientas de medición del proceso: el pipeline de CI/CD, las herramientas de análisis estático, los dashboards de monitoreo de producción. La "trazabilidad" equivalente es la reproducibilidad: poder confirmar que una métrica de cobertura de pruebas o un resultado de un escaneo de seguridad viene de una herramienta configurada y versionada de forma controlada, no de una ejecución manual ad hoc.

Los "conocimientos de la organización" (7.1.6) son el punto más frágil típico: arquitectura documentada solo en la memoria del arquitecto original, decisiones de diseño sin registro (ADRs), runbooks de incidentes que existen solo como conversaciones de Slack. La forma barata de cumplir 7.1.6 en un equipo pequeño es exigir documentación mínima de decisiones arquitectónicas y post-mortems escritos de incidentes.

La "información documentada" de 7.5 en software se traduce en control de versiones: el repositorio Git con historial de cambios, revisiones de pull request y tags de versión es, de hecho, un sistema de control de información documentada más riguroso que muchos SGC en papel — conecta directamente con la trazabilidad exigida en 8.5.2.

La competencia (7.2) de un equipo de desarrollo se evidencia con planes de formación técnica, certificaciones, y sobre todo con el propio proceso de revisión de código, que funciona como evaluación continua e informal de competencia.

## Puntos clave
1. Los siete recursos de 7.1 cubren desde personas hasta conocimiento organizacional — el conocimiento tácito perdido por rotación es un riesgo que la norma nombra explícitamente.
2. La competencia (7.2) exige evidencia y, cuando aplica, evaluación de la eficacia de la formación, no solo el registro de que ocurrió.
3. La toma de conciencia (7.3) va más allá de conocer la política: exige entender la contribución individual y las consecuencias de la no conformidad.
4. La información documentada (7.5) sustituye "documento", "procedimiento" y "registro"; lo que importa es el control (disponibilidad, protección, versión), no el volumen.

## Conecta con
- **Cap01 (Contexto de la organización)**: los recursos y competencias necesarios se determinan en función de los procesos definidos en 4.4.
- **Cap05 (Operación)**: los recursos de seguimiento y medición de 7.1.5 se usan operativamente en el control de procesos, productos y servicios de la cláusula 8.
- **`[[swebok]]`**: la gestión de configuración del software y el control de versiones dan contenido técnico concreto al requisito de información documentada (7.5) en una empresa de desarrollo.
