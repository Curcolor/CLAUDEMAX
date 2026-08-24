# Liderazgo (ISO 9001:2015, cláusula 5)

## Idea central
La versión 2015 eliminó la figura obligatoria del "representante de la dirección" y trasladó la responsabilidad del SGC directamente a la alta dirección: liderazgo no es aprobar un manual de calidad, es integrar el SGC en la estrategia del negocio y rendir cuentas personalmente de su eficacia.

## Marcos que introduce
- **Liderazgo y compromiso — generalidades (cláusula 5.1.1)**: diez compromisos explícitos que la alta dirección debe demostrar, no delegar.
  - Cuándo usarlo: como checklist de auditoría para verificar que la dirección no se ha limitado a "firmar la política".
  - Cómo: asumir responsabilidad y rendición de cuentas por la eficacia del SGC; asegurar que política y objetivos son compatibles con el contexto y la dirección estratégica; integrar los requisitos del SGC en los procesos de negocio (no como sistema paralelo); promover el enfoque a procesos y el pensamiento basado en riesgos; asegurar disponibilidad de recursos; comunicar la importancia de una gestión de la calidad eficaz; asegurar que el SGC logra los resultados previstos; comprometer, dirigir y apoyar a las personas; promover la mejora; y apoyar a otros roles de dirección para que demuestren liderazgo en sus áreas.
  - Nota de copyright: la norma detalla estos diez literales en 5.1.1 a)-j); aquí se sintetizan sin reproducirlos.
- **Enfoque al cliente (cláusula 5.1.2)**: liderazgo aplicado específicamente a la relación con el cliente.
  - Cuándo usarlo: para auditar si la dirección realmente prioriza la satisfacción del cliente por encima de otros objetivos en conflicto.
  - Cómo: la alta dirección debe asegurar que se determinan, comprenden y cumplen regularmente los requisitos del cliente y los legales/reglamentarios; que se identifican y consideran los riesgos y oportunidades que afectan la conformidad y la satisfacción del cliente; y que el enfoque al cliente se mantiene en el tiempo, no solo en el arranque del SGC.
- **Política de la calidad (cláusula 5.2)**: declaración de intenciones que la alta dirección establece, revisa y comunica.
  - Cuándo usarlo: al fundar el SGC y cada vez que cambie sustancialmente el contexto o la estrategia.
  - Cómo: la política debe ser apropiada al propósito y contexto de la organización, proporcionar un marco para establecer objetivos de la calidad, incluir compromiso de cumplir requisitos aplicables y de mejora continua; debe estar disponible como información documentada, comunicarse y entenderse dentro de la organización, y estar disponible para las partes interesadas pertinentes cuando sea apropiado.
- **Roles, responsabilidades y autoridades en la organización (cláusula 5.3)**: la alta dirección asigna y comunica responsabilidades para que el SGC funcione sin depender de una sola persona.
  - Cuándo usarlo: para evitar el patrón "todo pasa por el gerente general" que colapsa en cuanto la organización crece.
  - Cómo: se asignan responsabilidades y autoridades para asegurar que el SGC es conforme con los requisitos de la norma, que los procesos generan las salidas previstas, para informar sobre el desempeño del SGC y oportunidades de mejora (especialmente a la alta dirección), y para asegurar que se promueve el enfoque al cliente en toda la organización al hacer cambios.

## Conceptos clave
- **Alta dirección**: persona o grupo de personas que dirige y controla una organización al más alto nivel (ISO 9000:2015, 3.1.1); si el alcance del SGC cubre solo una parte de la organización, se refiere a quienes dirigen esa parte.
- **Política de la calidad**: intenciones y dirección de una organización relacionadas con la calidad, expresadas formalmente por la alta dirección (ISO 9000:2015, 3.5.9).
- **Liderazgo vs. gestión**: gestión (3.3.3) son actividades coordinadas para dirigir y controlar; liderazgo en 9001 va más allá — exige integración estratégica y compromiso personal visible, no solo control operativo.

## Modelos mentales
Piensa en el liderazgo de la cláusula 5 como el reemplazo funcional de la vieja "acción preventiva": la norma ya no pide un procedimiento de prevención separado porque espera que la alta dirección, mediante liderazgo activo, incorpore el pensamiento basado en riesgos en cada decisión.

Usa la política de la calidad como una prueba de coherencia, no como un cartel de pared: si un empleado no puede explicar en una frase qué significa la política para su trabajo diario, la política no está comunicada de verdad, aunque esté firmada y publicada.

## Antipatrones
- **Delegar todo el SGC a un "responsable de calidad" sin involucramiento real de la dirección**: la norma 2015 elimina explícitamente la figura obligatoria del representante único precisamente para evitar esta desconexión.
- **Política de la calidad genérica descargada de internet**: si no menciona el contexto real ni sirve de marco para objetivos concretos, no cumple 5.2.1.
- **Responsabilidades no comunicadas**: asignar roles en un documento que nadie lee produce el mismo resultado que no asignarlos.
- **Enfoque al cliente que se diluye bajo presión de plazos**: si los compromisos de fecha sistemáticamente ganan sobre los requisitos de calidad sin que la dirección lo revise, 5.1.2 no se está cumpliendo en la práctica.

## Aplicado a una empresa de software
En una empresa de desarrollo pequeña, "alta dirección" suele ser el fundador o el CTO, y el riesgo típico es que el liderazgo del SGC se quede en discurso: se aprueba una política de calidad pero las decisiones reales de priorización (qué se prueba, qué deuda técnica se paga, qué bug se arregla antes de una entrega) se toman sin conexión con ella. La cláusula 5 exige lo contrario: que esas decisiones de priorización sean trazables a la política.

La política de la calidad de una empresa de software eficaz no dice "nos comprometemos con la excelencia" — dice algo verificable, por ejemplo: "todo release a producción pasa por revisión de código y suite de pruebas automatizadas; los defectos críticos se corrigen antes de nueva funcionalidad". Eso da un marco real para fijar objetivos de calidad (cobertura de pruebas, tiempo de resolución de incidentes, tasa de reapertura de bugs).

Repartir roles y autoridades (5.3) en un equipo pequeño no exige un organigrama de calidad separado: puede ser tan simple como que el líder técnico sea responsable de que el proceso de revisión de código se cumpla, y que cualquier persona del equipo tenga autoridad explícita para bloquear un despliegue si detecta una no conformidad — eso es 5.3 aplicado sin burocracia.

## Puntos clave
1. Desde 2015 no existe un "representante de la dirección" obligatorio: la responsabilidad es de la alta dirección, sin poder delegarla por completo.
2. El enfoque al cliente (5.1.2) exige revisión continua, no solo un compromiso inicial.
3. La política de la calidad (5.2) debe funcionar como marco real para fijar objetivos verificables, no como declaración decorativa.
4. Las responsabilidades y autoridades (5.3) deben estar asignadas y comunicadas para que el SGC no dependa de una sola persona.

## Conecta con
- **Cap03 (Planificación)**: la política de la calidad (5.2) es la base directa para establecer los objetivos de la calidad de 6.2.
- **Cap06 (Evaluación del desempeño)**: la revisión por la dirección (9.3) es donde la alta dirección demuestra en la práctica el liderazgo comprometido en 5.1.
- **`[[pmbok]]`**: el rol del patrocinador/sponsor en gestión de proyectos es un paralelo directo del liderazgo comprometido que exige esta cláusula.
