# Fundamentos y vocabulario (ISO 9000:2015)

## Idea central
ISO 9000 no certifica nada — es el diccionario y el marco conceptual que hace que ISO 9001, ISO 9004 y ISO 19011 hablen el mismo idioma. Sin dominarla, es imposible interpretar correctamente un requisito de 9001: cada término técnico de la familia (calidad, requisito, riesgo, conformidad, proceso) tiene una definición precisa de la que depende cómo se audita y se documenta.

## Marcos que introduce
- **Siete principios de la gestión de la calidad (cláusula 2.3)**: la base racional detrás de todos los requisitos de ISO 9001, aunque los principios en sí mismos no son requisitos auditables.
  - Cuándo usarlo: para interpretar el "por qué" de un requisito cuando su aplicación literal no es obvia.
  - Cómo: 1) enfoque al cliente — cumplir y exceder expectativas; 2) liderazgo — unidad de propósito y dirección desde todos los niveles; 3) compromiso de las personas — personas competentes, empoderadas y comprometidas; 4) enfoque a procesos — resultados coherentes y previsibles gestionando actividades como procesos interrelacionados; 5) mejora — enfoque continuo hacia la mejora; 6) toma de decisiones basada en la evidencia — decisiones fundamentadas en análisis de datos e información, equilibrando experiencia e intuición; 7) gestión de las relaciones — gestionar activamente las relaciones con partes interesadas, en particular proveedores, para el éxito sostenido.
- **Modelo de desarrollo del SGC (cláusula 2.4)**: un SGC formal como marco de referencia dinámico, no un evento único.
  - Cómo: entender contexto interno/externo → desarrollar el sistema con procesos interconectados (salida de uno es entrada de otro) → planificar de forma continua, no puntual → implementar tras aprobación → hacer seguimiento y evaluar regularmente con indicadores → auditar para evaluar eficacia, identificar riesgos y determinar cumplimiento → corregir y mejorar basándose en el análisis de evidencia recopilada.
- **Trece grupos de términos y definiciones (capítulo 3)**: la estructura conceptual completa de vocabulario ISO/TC 176, organizada por relación genérica, partitiva y asociativa (Anexo A).
  - Grupos: 3.1 persona o personas (alta dirección, consultor SGC, compromiso); 3.2 organización (parte interesada, cliente, proveedor, proveedor externo); 3.3 actividad (mejora, mejora continua, gestión, gestión de la calidad, aseguramiento/control/mejora de la calidad); 3.4 proceso (proceso, proyecto, diseño y desarrollo, procedimiento); 3.5 sistema (sistema, infraestructura, sistema de gestión, política); 3.6 requisitos (objeto, calidad, requisito, no conformidad, defecto, conformidad, riesgo — nota: riesgo se ubica conceptualmente junto a resultado en 3.7); 3.7 resultado (objetivo, éxito, éxito sostenido, salida, producto, servicio, desempeño, riesgo, eficiencia, eficacia); 3.8 datos/información/documentación (dato, información, evidencia objetiva, documento, información documentada, especificación, registro, verificación, validación); 3.9 cliente (retroalimentación, satisfacción del cliente, queja); 3.10 características (característica, característica de la calidad, competencia, configuración); 3.11 determinación (determinación, revisión, seguimiento, medición, inspección, ensayo); 3.12 acciones (acción preventiva, acción correctiva, corrección, concesión, liberación, reproceso, reparación, desecho); 3.13 auditoría (auditoría, hallazgos, conclusiones, auditor, equipo auditor, experto técnico).

## Conceptos clave
- **Calidad**: "grado en el que un conjunto de características inherentes de un objeto cumple con los requisitos" (3.6.2) — no es "ausencia de defectos", es el ajuste entre características y requisitos, y puede acompañarse de adjetivos (pobre, buena, excelente).
- **Requisito**: "necesidad o expectativa establecida, generalmente implícita u obligatoria" (3.6.4) — incluye expectativas no declaradas si son prácticas habituales, y hasta expectativas del cliente no obligatorias cuando son necesarias para alta satisfacción.
- **Proceso**: "conjunto de actividades mutuamente relacionadas que utilizan las entradas para proporcionar un resultado previsto" (3.4.1); dos o más procesos interrelacionados en serie también pueden considerarse un proceso.
- **Riesgo**: "efecto de la incertidumbre" (3.7.9) — puede ser positivo o negativo; no es sinónimo de "amenaza".
- **No conformidad vs. defecto**: no conformidad es incumplimiento de un requisito (3.6.9); defecto es una no conformidad relativa a un uso previsto o especificado (3.6.10), con connotaciones legales distintas por responsabilidad de producto.
- **Producto vs. servicio**: producto es una salida que puede producirse sin transacción entre organización y cliente, con elemento dominante tangible; servicio es una salida con al menos una actividad necesariamente realizada entre la organización y el cliente, con elemento dominante generalmente intangible. El software se define explícitamente como información, independiente del medio de entrega.
- **Verificación vs. validación**: verificación confirma que se cumplen los requisitos especificados (3.8.12); validación confirma que se cumplen los requisitos para una aplicación o uso específico previstos (3.8.13).
- **Acción correctiva vs. corrección vs. acción preventiva**: corrección elimina la no conformidad detectada; acción correctiva elimina su causa para que no se repita; acción preventiva elimina la causa de una no conformidad potencial antes de que ocurra.

## Modelos mentales
Usa las relaciones de conceptos del Anexo A (genérica, partitiva, asociativa) como forma de navegar el vocabulario: muchos términos de 9001 solo tienen sentido leídos junto a su concepto padre — "objetivo de la calidad" (3.7.2) hereda todo lo que define "objetivo" (3.7.1), no es un término aislado.

Piensa en "requisito" como el concepto raíz de toda la familia de normas: calidad, conformidad, no conformidad y verificación se definen todos en función de si se cumple o no un requisito — dominar 3.6.4 desbloquea la lectura precisa de las otras cláusulas.

## Antipatrones
- **Usar "calidad" como sinónimo de "lujo" o "sin defectos"**: la definición normativa es neutra — es el grado de ajuste entre características y requisitos, y puede evaluarse con adjetivos negativos igual que positivos.
- **Confundir corrección con acción correctiva en un informe de auditoría**: son conceptos distintos con requisitos distintos en 10.2 de ISO 9001; tratarlos como sinónimos genera hallazgos de auditoría mal fundamentados.
- **Ignorar que "información documentada" ya no distingue documento de registro**: seguir usando terminología de la versión 2008 en información documentada moderna genera confusión de trazabilidad.
- **Tratar los principios de gestión de la calidad como requisitos auditables**: son la base racional de la norma, no cláusulas que se verifican punto por punto en una auditoría de certificación.

## Aplicado a una empresa de software
El vocabulario de ISO 9000 se traduce con precisión al lenguaje de ingeniería si se hace la correspondencia correcta: un "requisito" (3.6.4) es literalmente una historia de usuario o especificación funcional; una "no conformidad" (3.6.9) es un bug o una desviación de un proceso definido (por ejemplo, un despliegue sin revisión de código); un "defecto" (3.6.10) es específicamente un bug que afecta el uso previsto por el usuario, distinto de una desviación interna sin impacto visible.

"Verificación" y "validación" mapean exactamente a las pruebas técnicas: verificación es que el código cumple la especificación (pruebas unitarias, de integración); validación es que el sistema resuelve el problema real del usuario (pruebas de aceptación, UAT). Confundir estos dos conceptos es un error común incluso en equipos de ingeniería maduros, y ISO 9000 da el vocabulario preciso para separarlos.

El software encaja en la definición de "producto" de 3.7.6 (nota 3): la norma lo define explícitamente como información independiente del medio de entrega — un programa, una app móvil, un manual de instrucciones o el contenido de un diccionario son ejemplos que da la propia norma. Esto resuelve una duda frecuente: sí, el software cae bajo el alcance de "productos y servicios" de ISO 9001 sin necesidad de interpretación forzada.

## Puntos clave
1. Los siete principios de gestión de la calidad (2.3) son la justificación conceptual de los requisitos de 9001, no requisitos auditables en sí mismos.
2. "Requisito" (3.6.4) es el concepto raíz del que dependen calidad, conformidad y verificación — dominarlo aclara la mayoría de la terminología.
3. Corrección, acción correctiva y acción preventiva son tres conceptos distintos con roles distintos en el ciclo de mejora.
4. El software cumple la definición normativa de "producto" — información independiente del medio de entrega — sin ambigüedad.

## Conecta con
- **Cap01-Cap07**: cada cláusula de ISO 9001 usa terminología definida aquí; ante cualquier ambigüedad de interpretación, ISO 9000 es la referencia normativa.
- **Cap10 (Auditoría de sistemas)**: ISO 19011 reutiliza y referencia directamente el vocabulario de auditoría de 3.13 (auditoría, hallazgos, conclusiones, auditor).
- **`[[swebok]]`**: el vocabulario de verificación/validación y de calidad del SWEBOK (área de calidad del software) es coherente y complementario con las definiciones de ISO 9000.
