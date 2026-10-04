# Mejora (ISO 9001:2015, cláusula 10)

## Idea central
Es el "Actuar" del ciclo PHVA y el cierre lógico de la norma: determinar y seleccionar oportunidades de mejora, reaccionar ante no conformidades con causa raíz y no solo con parches, y sostener la mejora continua de la idoneidad, adecuación y eficacia del SGC. La versión 2015 ya no exige un apartado separado de "acción preventiva" porque esa función se cubre desde la cláusula 6.1 con el pensamiento basado en riesgos — la cláusula 10 se concentra en reaccionar a lo que ya ocurrió y en mejorar lo que ya funciona.

## Marcos que introduce
- **Generalidades (cláusula 10.1)**: la organización determina y selecciona las oportunidades de mejora e implementa las acciones necesarias para cumplir los requisitos del cliente y aumentar su satisfacción.
  - Cómo: las mejoras pueden incluir corrección, acción correctiva, mejora continua, cambio abrupto, innovación y reorganización — la norma reconoce explícitamente que no toda mejora es incremental.
- **No conformidad y acción correctiva (cláusula 10.2)**: cuando ocurre una no conformidad, incluida cualquiera originada por quejas, la organización debe reaccionar, evaluar la necesidad de eliminar las causas, e implementar acciones que eviten su repetición.
  - Cuándo usarlo: ante cualquier incumplimiento de requisito, no solo defectos de producto — también aplica a hallazgos de auditoría interna (9.2) y desviaciones de proceso.
  - Cómo: 10.2.1 reaccionar (controlar y corregir; hacer frente a las consecuencias); evaluar la necesidad de acción para eliminar las causas y que no vuelva a ocurrir ni ocurra en otra parte, mediante revisión y análisis de la no conformidad, determinación de sus causas y determinación de si existen o podrían ocurrir no conformidades similares; implementar cualquier acción necesaria; revisar la eficacia de la acción correctiva tomada; actualizar riesgos y oportunidades determinados en la planificación (6.1) si es necesario; y hacer cambios al SGC si es necesario. Las acciones correctivas deben ser apropiadas a los efectos de las no conformidades encontradas — no todo problema exige la misma inversión de esfuerzo en investigación. 10.2.2 exige conservar información documentada como evidencia de la naturaleza de las no conformidades, las acciones tomadas y los resultados de cualquier acción correctiva.
- **Mejora continua (cláusula 10.3)**: la organización mejora continuamente la idoneidad, adecuación y eficacia del SGC.
  - Cómo: considerar los resultados del análisis y evaluación (9.1.3) y las salidas de la revisión por la dirección (9.3), para determinar si hay necesidades u oportunidades que deban considerarse como parte de la mejora continua.

## Conceptos clave
- **Corrección**: acción para eliminar una no conformidad detectada (ISO 9000:2015, 3.12.3); puede ser, por ejemplo, un reproceso o una reclasificación. Se distingue de la acción correctiva en que la corrección trata el síntoma inmediato.
- **Acción correctiva**: acción para eliminar la causa de una no conformidad y evitar que vuelva a ocurrir (ISO 9000:2015, 3.12.2); puede haber más de una causa para una misma no conformidad.
- **Acción preventiva (concepto heredado)**: acción tomada para eliminar la causa de una no conformidad potencial antes de que ocurra; en la versión 2015 esta función se absorbe en el pensamiento basado en riesgos de las cláusulas 4 y 6, y ya no existe como apartado separado.
- **Mejora continua**: actividad recurrente para aumentar el desempeño (ISO 9000:2015, 3.3.2); distinta de la mejora abrupta o la innovación, que son saltos discontinuos.

## Modelos mentales
Piensa en corrección y acción correctiva como dos capas obligatorias, no alternativas: primero se corrige el síntoma (el bug se arregla, el pedido mal enviado se reenvía), después se investiga la causa para que no se repita. Corregir sin investigar causa deja el sistema exactamente igual de vulnerable que antes.

Usa "apropiado a los efectos" como filtro de proporcionalidad: la norma no exige un análisis de causa raíz formal (Ishikawa, 5 porqués, FTA) para cada no conformidad trivial — exige que el rigor de la investigación sea proporcional al impacto de lo que falló.

## Antipatrones
- **Cerrar una no conformidad con solo la corrección**: reparar el defecto puntual sin registrar ni investigar la causa dejará que se repita, y 10.2.1 exige explícitamente evaluar esa necesidad.
- **Acción correctiva que no se verifica**: implementar un cambio y no revisar después si realmente eliminó la causa (10.2.1 f) dentro de la norma) es un ciclo incompleto.
- **Mejora continua reducida a "seguir haciendo lo mismo, mejor"**: la norma reconoce explícitamente el cambio abrupto y la innovación como formas legítimas de mejora, no solo el ajuste incremental.
- **No conectar 10.2 con 6.1**: si una no conformidad revela un riesgo no identificado antes, la norma exige actualizar el análisis de riesgos y oportunidades — omitir ese paso deja el sistema desactualizado frente al riesgo real.

## Aplicado a una empresa de software
La distinción corrección/acción correctiva es literalmente el ciclo de gestión de incidentes de cualquier equipo de ingeniería maduro: la corrección es el hotfix o rollback que restaura el servicio; la acción correctiva es el post-mortem sin culpa (blameless postmortem) que identifica la causa raíz — un test que faltaba, una alerta de monitoreo mal configurada, una validación de entrada ausente — y genera una tarea concreta para que no vuelva a pasar.

En una empresa de software pequeña, el registro exigido por 10.2.2 ya existe casi siempre en el sistema de tickets: cada bug crítico documentado con su causa, su corrección y el enlace a la tarea de prevención cumple el requisito sin proceso adicional, siempre que se use de forma disciplinada.

La mejora continua (10.3) se traduce en retrospectivas de sprint (si el equipo usa Scrum) o en revisiones trimestrales de arquitectura: el requisito no es que cada retrospectiva genere una mejora relacionada con la calidad del SGC, sino que exista un mecanismo sistemático — no ad hoc — para capturar y priorizar esas oportunidades. Migrar de un despliegue manual a uno automatizado, o de pruebas manuales a una suite automatizada, son ejemplos típicos de "cambio abrupto" o "innovación" según el propio vocabulario de la norma, no simple ajuste incremental.

## Puntos clave
1. Corrección y acción correctiva son pasos distintos y ambos obligatorios ante una no conformidad: arreglar el síntoma no sustituye investigar la causa.
2. El rigor de la investigación de causa debe ser proporcional al impacto — no toda no conformidad exige el mismo análisis.
3. Toda acción correctiva debe verificarse en su eficacia y, si revela un riesgo nuevo, debe actualizar el análisis de 6.1.
4. La mejora continua (10.3) incluye explícitamente cambio abrupto e innovación, no solo ajuste incremental.

## Conecta con
- **Cap03 (Planificación)**: una no conformidad puede revelar un riesgo no anticipado en 6.1, obligando a actualizar el análisis de riesgos y oportunidades.
- **Cap06 (Evaluación del desempeño)**: las entradas de la cláusula 10 provienen directamente de 9.1 (análisis), 9.2 (hallazgos de auditoría) y 9.3 (revisión por la dirección).
- **Cap09 (Éxito sostenido)**: ISO 9004 desarrolla con mucho más detalle la mejora, el aprendizaje y la innovación (cláusula 11) como palanca de éxito sostenido, más allá del mínimo certificable de 10.3.
- **`[[swebok]]`**: el análisis de causa raíz (RCA, Ishikawa, FTA, FMEA) del área de fundamentos de ingeniería del SWEBOK da las herramientas técnicas para ejecutar 10.2 con rigor.
