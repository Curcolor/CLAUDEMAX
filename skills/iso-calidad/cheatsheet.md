# Cheatsheet — iso-calidad

Reglas de decisión para actuar como auditor, implementador o gerente de calidad sin releer las normas. No es glosario — para definiciones de términos, usa `glossary.md`.

## Qué evidencia pide un auditor, por cláusula

| Cláusula (9001) | Evidencia típica que se pide |
|---|---|
| 4.1-4.3 Contexto y alcance | Documento de análisis de contexto actualizado en la última revisión por la dirección; declaración de alcance con justificación de exclusiones, si las hay |
| 4.4 Procesos | Mapa de procesos con entradas/salidas/criterios de control por proceso |
| 5.1-5.3 Liderazgo | Actas de revisión por la dirección con decisiones reales; matriz de roles y autoridades comunicada |
| 5.2 Política | Política fechada, aprobada, comunicada — entrevistar a personal de nivel operativo para verificar que la conocen en sustancia, no de memoria |
| 6.1 Riesgos y oportunidades | Registro de riesgos identificados y acciones tomadas, con evaluación de eficacia |
| 6.2 Objetivos | Objetivos con indicador, meta, plazo, responsable y evidencia de seguimiento |
| 7.1.6 Conocimientos | Evidencia de cómo se captura y transfiere conocimiento crítico (documentación técnica, planes de sucesión) |
| 7.2 Competencia | Registros de formación con evaluación de eficacia, no solo lista de asistencia |
| 7.5 Información documentada | Control de versiones, historial de cambios, evidencia de revisión/aprobación |
| 8.2-8.5 Operación | Registros de revisión de pedidos, entradas/salidas de diseño, evaluación de proveedores, trazabilidad |
| 8.7 Salidas no conformes | Registro de no conformidades con disposición, autorización y verificación |
| 9.1 Seguimiento y medición | Datos de satisfacción del cliente y análisis con conclusiones accionables, no solo recolección |
| 9.2 Auditoría interna | Programa de auditoría, informes con hallazgos, evidencia de independencia del auditor, cierre de acciones |
| 9.3 Revisión por la dirección | Actas con las nueve entradas de 9.3.2 tratadas y salidas con decisiones concretas |
| 10.2 No conformidad y AC | Corrección + análisis de causa + acción correctiva + verificación de eficacia, para cada no conformidad relevante |

## No conformidad mayor vs. menor — regla de decisión

La norma (ISO 19011) permite clasificación cuantitativa o cualitativa, pero no fija el umbral — lo hace el esquema de certificación o la propia organización. Reglas prácticas:

- **Es mayor si**: (a) ausencia total de un requisito obligatorio de la norma ("debe") — por ejemplo, no existe revisión por la dirección; (b) un requisito existe pero es sistemáticamente incumplido en la práctica, no un caso aislado; (c) afecta directamente la capacidad de cumplir requisitos del cliente o legales; (d) es la repetición de una no conformidad menor no cerrada de una auditoría previa.
- **Es menor si**: es un incumplimiento puntual, aislado, que no compromete la capacidad global del SGC para lograr sus resultados previstos — por ejemplo, un registro individual mal fechado en un proceso que por lo demás funciona.
- **Tell (señal de alerta)**: si el hallazgo se repite en auditorías consecutivas sin acción correctiva eficaz, escala de menor a mayor aunque el hecho puntual parezca pequeño — la reincidencia es en sí misma evidencia de ineficacia sistémica (10.2.1).

## Qué documentar y qué no

- **Documenta (mantén) cuando**: el proceso es crítico para la conformidad del producto/servicio, tiene riesgo de error humano por variabilidad, o involucra a personas que rotan con frecuencia — la información documentada existe para dar consistencia, no para llenar cuota.
- **No necesitas documentar cuando**: el proceso es simple, estable, de bajo riesgo, y lo ejecuta consistentemente personal competente y con memoria organizacional corta (por ejemplo, un equipo de 3 personas que llevan años trabajando juntas puede necesitar menos procedimiento escrito que un equipo con alta rotación).
- **Conserva (como registro/evidencia) cuando**: necesitas demostrar que algo ocurrió como se planificó — resultados de revisión, verificación, validación, auditoría, no conformidad, acción correctiva, revisión por la dirección. Sin esta evidencia, la cláusula asociada no es auditable, aunque el proceso funcione bien en la práctica.
- **Umbral por defecto para una empresa pequeña (5-20 personas)**: procedimiento documentado solo para los procesos que tocan directamente la conformidad del producto (diseño y desarrollo, control de cambios, gestión de incidentes); todo lo demás puede vivir en herramientas ya existentes (control de versiones, sistema de tickets) si generan evidencia trazable.

## Cuándo ISO 9004 aporta sobre ISO 9001

- **Usa solo 9001 si**: el objetivo es certificación, cumplimiento contractual con cliente, o el SGC es reciente y aún no domina lo básico — dominar 9001 primero es la secuencia correcta, no un atajo.
- **Añade 9004 si**: 9001 ya funciona con solidez (auditorías internas sin hallazgos mayores recurrentes, objetivos de calidad alcanzados de forma consistente) y la organización quiere abordar identidad estratégica (misión/visión/cultura), gestión de conocimiento como activo, benchmarking sistemático o innovación — temas que 9001 no exige.
- **Tell de que falta 9004, no 9001**: el SGC está certificado, pasa auditorías externas sin problema, pero la organización sigue perdiendo conocimiento crítico por rotación, no tiene KPI que informen decisiones estratégicas, o no existe proceso de aprendizaje organizacional más allá de "arreglar lo que falla". Esos son síntomas de un 9001 saludable sin la capa de éxito sostenido de 9004.

## Cómo dimensionar el SGC en una empresa de 5-20 personas

- **Alta dirección** = fundador/CEO o CTO; no requiere delegar en un rol de "responsable de calidad" dedicado a tiempo completo — puede repartirse entre roles existentes.
- **Auditoría interna (9.2)**: independencia total del auditor no siempre es posible; usa rotación cruzada entre líderes de equipo o un consultor externo puntual para los procesos más críticos, documentando el esfuerzo por minimizar sesgo, como permite explícitamente ISO 19011 (principio de independencia, capítulo 4.e).
- **Revisión por la dirección (9.3)**: no necesita ser una reunión formal extensa; una revisión trimestral de 1-2 horas con datos reales (métricas, no conformidades abiertas, resultado de auditoría) cumple el requisito si genera decisiones documentadas.
- **Información documentada (7.5)**: aprovecha herramientas que el equipo ya usa (Git, sistema de tickets, wiki interno) en vez de crear un sistema documental paralelo — el control de versiones de código es, de hecho, un sistema de control de información documentada más riguroso que muchos manuales de calidad en PDF.
- **Objetivos de calidad (6.2)**: 3-5 objetivos con indicador y responsable son suficientes para una empresa pequeña; más de eso diluye el foco y aumenta el riesgo de que se conviertan en objetivos "de papel" sin seguimiento real.
- **Riesgos y oportunidades (6.1)**: no se necesita matriz de riesgo formal con escalas numéricas; una lista corta priorizada por impacto en la conformidad del producto, revisada en cada revisión por la dirección, cumple el requisito.

## Señales de alerta generales (tells) de un SGC de papel

- La política de calidad no puede explicarse en una frase por personal de nivel operativo.
- Los objetivos de calidad no cambian nunca de un año a otro, ni siquiera cuando se cumplen o se incumplen.
- Las auditorías internas siempre concluyen "sin hallazgos" — es más señal de auditoría poco rigurosa que de sistema perfecto.
- Las acciones correctivas se cierran sin verificar eficacia, o se reabren los mismos hallazgos en la siguiente auditoría.
- La revisión por la dirección es un trámite de aprobación de acta, no una discusión con datos que cambia decisiones.
- Existe documentación extensa que nadie del equipo operativo ha leído ni podría explicar.
