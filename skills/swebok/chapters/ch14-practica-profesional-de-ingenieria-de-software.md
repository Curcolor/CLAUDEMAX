# Capítulo 14: Práctica Profesional de Ingeniería de Software

## Idea central
Ejercer la ingeniería de software de forma profesional significa cumplir estándares técnicos y no técnicos reconocidos por una comunidad profesional (código de ética, acreditación, certificación, licencia) y dominar la dinámica de grupo y la comunicación, porque el trabajo de ingeniería casi nunca se hace en solitario.

## Marcos que introduce
- **Acreditación / Certificación / Cualificación / Licencia (ISO/IEC 24773-1 y -4)**: cuatro mecanismos distintos de garantía profesional que no deben confundirse.
  - Cuándo usarlo: para saber qué credencial resuelve qué necesidad (institucional vs. individual, legal vs. voluntaria).
  - Cómo: la **acreditación** certifica instituciones/programas educativos; la **certificación** confirma que una persona cumple un nivel de competencia y requiere recertificación periódica; la **cualificación** es similar pero sin recalificación; la **licencia** es una autorización legal, emitida por autoridad gubernamental, para ejercer y asumir responsabilidad por el producto de ingeniería.
- **Código de Ética y Conducta Profesional (ACM 2018, IEEE 2020, IFIP 2021)**: define valores y comportamientos exigibles; las infracciones pueden ser por comisión (ocultar trabajo inadecuado, falsear capacidades) o por omisión (no divulgar riesgos, no reconocer referencias).
  - Cuándo usarlo: como marco de resolución ante imperativos en conflicto (cliente vs. público vs. empleador).
- **Análisis de compensaciones (Trade-off analysis)**: evaluación profesional de riesgos, costos y beneficios de alternativas, hecha en colaboración con las partes interesadas, para decidir qué requisitos priorizar, flexibilizar o eliminar.
  - Cuándo usarlo: cuando un proyecto se retrasa o excede presupuesto y hay que decidir qué requisitos ceden.
  - Cómo: 1) fijar objetivos de diseño y su importancia relativa, 2) mantenerse objetivo e imparcial al ponderar criterios, 3) declarar cualquier conflicto de interés por adelantado.
- **Marco de cuestiones legales**: normas, marcas, patentes, derechos de autor, secretos comerciales, responsabilidad profesional, requisitos legales, cumplimiento comercial, delitos cibernéticos, privacidad de datos (RGPD/CCPA).
  - Cuándo usarlo: al firmar contratos, decidir qué proteger como IP, o evaluar exposición a negligencia/responsabilidad estricta.

## Conceptos clave
- **Práctica profesional**: forma de prestar servicios que cumple estándares técnicos y no técnicos reconocidos por una sociedad profesional, con código de ética, acreditación/certificación/licencia y sanciones por infracción.
- **NDA / acuerdo de propiedad intelectual**: protege información que el ingeniero solo pudo conocer por su vínculo con el cliente; puede extenderse tras finalizar la relación.
- **Negligencia**: no seguir de forma completa y concienzuda las prácticas recomendadas; base típica de demandas por responsabilidad profesional.
- **Responsabilidad estricta / garantía implícita**: obligación de que el producto sea apto y seguro para su uso, independiente de si se ofrecieron garantías explícitas.
- **Secreto comercial**: activo intelectual no público que da ventaja económica; protegido legalmente sin límite de tiempo, pero pierde protección si otra parte lo descubre lícitamente.
- **Patrón oscuro (dark pattern)**: interacción de UI/UX diseñada para engañar al usuario, priorizando explotabilidad sobre usabilidad.
- **Complejidad de problemas**: la cognición individual se ve limitada por falta de conocimiento, suposiciones subconscientes, volumen de datos, miedo al fracaso, cultura y estado emocional.

## Modelos mentales
- Piensa en la admisión a una sociedad profesional como la base de la acreditación y el licenciamiento: certifica competencia y puede determinar negligencia si se incumple.
- Usa la "alternativa de no hacer nada" como opción implícita en cualquier análisis de compensaciones — a veces la mejor decisión es no ejecutar ninguna de las propuestas evaluadas.
- Las vías de comunicación en un equipo crecen cuadráticamente con cada miembro añadido, y las personas rara vez se comunican bien con quien perciben a más de dos grados de distancia social — diseña la estructura de comunicación del equipo, no la dejes emerger sola.
- Trata la incertidumbre como algo a investigar primero (fuentes formales, entrevistas, colegas) y, si persiste, a convertir en riesgo de proyecto con su propio ajuste de estimación/precio.

## Antipatrones
- **Patrones oscuros en la interfaz**: manipulan al usuario en vez de ser transparentes con él; no es una práctica éticamente aceptable.
- **Confundir certificación con obligatoriedad**: la certificación/cualificación en ingeniería de software es voluntaria; la mayoría de los ingenieros no están certificados, y eso no los excluye de ejercer.
- **Ignorar la documentación como responsabilidad individual**: no documentar especificaciones, riesgos, advertencias de uso indebido o abastecimiento expone al ingeniero y a la organización.
- **Tratar el análisis de compensaciones como mecánico**: sin objetividad ni declaración de conflictos de interés, el resultado deja de ser defendible profesionalmente.

## Tablas de referencia
| Mecanismo | Objeto que certifica | ¿Requiere renovación? | ¿Obligatorio legalmente? |
|---|---|---|---|
| Acreditación | Institución / programa educativo | Sí (periódica) | No |
| Certificación | Persona | Sí (recertificación) | No |
| Cualificación | Persona | No | No |
| Licencia | Persona (autorización legal) | Según jurisdicción | Sí, en jurisdicciones que la exigen |

## Puntos clave
- Adhiérete a un código de ética explícito (ACM/IEEE/IFIP) y documenta desviaciones o dilemas antes de que se conviertan en incidentes.
- Distingue certificación/cualificación (voluntarias) de licencia (legal) al asesorar sobre credenciales.
- Usa el análisis de compensaciones como proceso formal y documentado, no como negociación ad hoc, sobre todo bajo presión de plazo/presupuesto.
- Protege propiedad intelectual y secretos comerciales con acuerdos explícitos desde el inicio del contrato, no después.
- Diseña la comunicación de equipo pensando en el crecimiento cuadrático de canales, no solo en el tamaño del equipo.

## Conecta con
- **Economía de la Ingeniería de Software**: el análisis de compensaciones y el impacto económico del software son la misma disciplina de decisión aplicada a distinto nivel.
- **Calidad del Software**: las revisiones entre pares y auditorías mencionadas en dinámica de equipo se detallan en esa KA.
- **Requisitos de Software**: la negociación de requisitos remite directamente al análisis de compensaciones de este capítulo.
- **Seguridad del Software**: los patrones oscuros y la privacidad de datos conectan ética profesional con diseño seguro.
