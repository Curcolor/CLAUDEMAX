# Evaluación del desempeño (ISO 9001:2015, cláusula 9)

## Idea central
Es el "Verificar" del ciclo PHVA: sin datos de desempeño, sin auditoría interna y sin revisión por la dirección, la cláusula 10 (mejora) no tiene ninguna base objetiva sobre la que actuar. Esta cláusula convierte el SGC de un sistema declarativo a un sistema que genera evidencia de su propia eficacia.

## Marcos que introduce
- **Seguimiento, medición, análisis y evaluación (cláusula 9.1)**: la organización determina qué necesita seguimiento y medición, los métodos necesarios para asegurar resultados válidos, cuándo se realizan y cuándo se analizan.
  - Cómo: 9.1.1 generalidades — evaluar el desempeño y la eficacia del SGC, conservando información documentada como evidencia; 9.1.2 satisfacción del cliente — hacer seguimiento de las percepciones del cliente sobre el grado en que se cumplen sus necesidades y expectativas (encuestas, retroalimentación, reuniones, análisis de cuota de mercado, felicitaciones, garantías reclamadas); 9.1.3 análisis y evaluación — usar los resultados para evaluar conformidad de productos/servicios, satisfacción del cliente, desempeño y eficacia del SGC, eficacia de la planificación, eficacia de las acciones de riesgo, desempeño de proveedores externos y necesidad de mejoras.
- **Auditoría interna (cláusula 9.2)**: a intervalos planificados, para proporcionar información sobre si el SGC es conforme con los requisitos propios de la organización y con la norma, y si se implementa y mantiene eficazmente.
  - Cómo: 9.2.1 planificar, establecer, implementar y mantener programas de auditoría con frecuencia, métodos, responsabilidades y elaboración de informes; 9.2.2 para cada auditoría: definir criterios y alcance, seleccionar auditores que aseguren objetividad e imparcialidad (nadie audita su propio trabajo), asegurar que los resultados se informan a la dirección pertinente, realizar correcciones y acciones correctivas sin demora injustificada, y conservar información documentada como evidencia de la implementación del programa y de los resultados.
- **Revisión por la dirección (cláusula 9.3)**: la alta dirección revisa el SGC a intervalos planificados para asegurar su conveniencia, adecuación, eficacia y alineación continuas con la dirección estratégica.
  - Cómo: 9.3.2 entradas — estado de acciones de revisiones previas; cambios en cuestiones externas/internas; información de desempeño y eficacia (satisfacción del cliente, grado de logro de objetivos, desempeño de procesos y conformidad de productos/servicios, no conformidades y acciones correctivas, resultados de seguimiento y medición, resultados de auditorías, desempeño de proveedores externos); adecuación de recursos; eficacia de las acciones para riesgos y oportunidades; oportunidades de mejora. 9.3.3 salidas — decisiones y acciones relacionadas con oportunidades de mejora, necesidades de cambio del SGC y necesidades de recursos, conservadas como información documentada.

## Conceptos clave
- **Auditoría interna (de primera parte)**: auditoría realizada por, o en nombre de, la propia organización, para revisión por la dirección y otros fines internos (ISO 9000:2015, 3.13.1).
- **Independencia del auditor**: en auditorías internas se demuestra al estar el auditor libre de responsabilidades sobre la actividad auditada — en organizaciones pequeñas puede no ser total, pero debe minimizarse el sesgo.
- **Indicador clave de desempeño (KPI)**: medida crítica seleccionada porque el factor que representa está bajo control de la organización y es determinante para su éxito (concepto central en ISO 9004, cláusula 10).
- **Revisión por la dirección como cierre de ciclo**: no es una reunión administrativa — sus salidas (9.3.3) son decisiones ejecutables, no un acta de asistencia.

## Modelos mentales
Piensa en 9.1-9.3 como tres niveles de zoom sobre el mismo sistema: 9.1 mide procesos y resultados día a día; 9.2 verifica periódicamente si el sistema cumple lo que dice cumplir; 9.3 eleva ambos flujos a decisiones estratégicas de la alta dirección. Saltarse un nivel deja ciego a los otros dos.

Usa la regla de independencia del auditor interno como filtro simple: si la persona que revisa un proceso es la misma que lo ejecuta o lo supervisa directamente, el resultado no es una auditoría interna válida según 9.2.2 — es autoevaluación, útil pero no equivalente.

## Antipatrones
- **Auditorías internas que se convierten en ritual anual sin consecuencias**: si los hallazgos no generan correcciones ni acciones correctivas rastreables, 9.2.2 d) no se cumple.
- **Revisión por la dirección reducida a "repasar el acta anterior"**: sin analizar las nueve entradas de 9.3.2 con datos reales, la revisión no cumple su propósito de decisión estratégica.
- **Medir satisfacción del cliente solo con quejas**: 9.1.2 exige seguimiento de percepciones, y las quejas son solo la señal más ruidosa y menos representativa.
- **KPI que nadie usa para decidir**: un indicador que se reporta pero nunca cambia una decisión no cumple la función que le da sentido en un SGC.

## Aplicado a una empresa de software
El seguimiento y medición (9.1) de una empresa de software se apoya en datos que ya existen si el equipo de ingeniería es medianamente maduro: tasa de éxito del pipeline de CI/CD, tiempo medio de resolución de incidentes, tasa de defectos escapados a producción, NPS o CSAT del producto, SLA de disponibilidad cumplido. El trabajo de 9.1 no es generar esos datos desde cero, sino conectarlos formalmente al SGC y analizarlos con periodicidad definida.

La auditoría interna (9.2) en una empresa pequeña puede recaer en el mismo líder técnico que también opera el proceso — la norma lo permite si se hacen "todos los esfuerzos" por eliminar sesgo (por ejemplo, rotando quién audita qué proceso, o usando a alguien de otro equipo para revisar el propio). Auditar contra la norma se traduce en preguntas concretas: ¿el proceso de despliegue documentado es realmente el que se sigue? ¿las revisiones de código realmente ocurren en el 100% de los merges a producción, como dice el procedimiento?

La revisión por la dirección (9.3) en una startup de software no necesita ser una reunión formal con acta extensa, pero sí necesita ocurrir con datos reales sobre la mesa: métricas de calidad del trimestre, resultado de la última auditoría interna, no conformidades abiertas (bugs críticos sin resolver), y decisiones concretas de recursos (por ejemplo, contratar a alguien de QA, o invertir un sprint en pagar deuda técnica).

## Puntos clave
1. 9.1 exige decidir de antemano qué medir, con qué método y cuándo analizar — no es recolectar datos sin propósito.
2. La independencia del auditor interno (9.2.2) es un requisito explícito, aunque flexible en organizaciones pequeñas.
3. Las salidas de la revisión por la dirección (9.3.3) deben ser decisiones y acciones documentadas, no un resumen de lo discutido.
4. Los tres subapartados de la cláusula 9 alimentan directamente las acciones de mejora de la cláusula 10.

## Conecta con
- **Cap02 (Liderazgo)**: la revisión por la dirección (9.3) es la instancia formal donde el liderazgo comprometido de la cláusula 5 se traduce en decisiones documentadas.
- **Cap07 (Mejora)**: las no conformidades detectadas en auditoría interna (9.2) y las oportunidades identificadas en 9.1 y 9.3 son la entrada directa de la cláusula 10.
- **Cap10 (Auditoría de sistemas)**: ISO 19011 desarrolla en detalle cómo planificar, ejecutar y reportar la auditoría interna exigida en 9.2.
