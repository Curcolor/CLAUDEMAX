# ISO 14001:2015 — Evaluación del desempeño y mejora (cláusulas 9-10)

## Idea central
Cierre del ciclo PHVA: la cláusula 9 es "Verificar" (medir, auditar internamente, revisar por la dirección) y la cláusula 10 es "Actuar" (corregir no conformidades y mejorar continuamente). Sin estas dos cláusulas, el SGA de las cláusulas 4-8 no tiene forma de saber si funciona ni de corregirse cuando falla.

## Marcos que introduce
- **Seguimiento, medición, análisis y evaluación (cláusula 9.1.1)**: determinar qué necesita seguimiento y medición, los métodos para asegurar resultados válidos, los criterios e indicadores de evaluación, y cuándo hacer seguimiento y analizar. Exige usar y mantener equipos de medición calibrados o verificados cuando corresponda, y evaluar tanto el desempeño ambiental como la eficacia del SGA.
- **Evaluación del cumplimiento (cláusula 9.1.2)**: establecer, implementar y mantener procesos para evaluar el cumplimiento de los requisitos legales y otros requisitos, determinando la frecuencia de evaluación y conservando información documentada de los resultados.
  - Cómo: el Anexo A (A.9.1.2) aclara que un incumplimiento no necesariamente escala a no conformidad si se identifica y corrige dentro de los propios procesos del SGA — pero si genera una no conformidad, esta sí debe corregirse conforme a 10.2.
- **Auditoría interna (cláusula 9.2)**: 9.2.1 generalidades (auditorías a intervalos planificados para verificar conformidad con los requisitos propios y con la norma, y que el SGA se implementa y mantiene eficazmente) y 9.2.2 programa de auditoría interna (frecuencia, métodos, responsabilidades, planificación e informes, considerando la importancia ambiental de los procesos, cambios organizacionales y resultados de auditorías previas). Exige definir criterios y alcance por auditoría, seleccionar auditores que aseguren objetividad e imparcialidad, e informar los resultados a la dirección pertinente.
- **Revisión por la dirección (cláusula 9.3)**: la alta dirección revisa el SGA a intervalos planificados considerando ocho entradas obligatorias — estado de acciones de revisiones previas; cambios en cuestiones externas/internas, necesidades de partes interesadas, aspectos ambientales significativos y riesgos/oportunidades; grado de logro de objetivos ambientales; desempeño ambiental con tendencias (no conformidades, resultados de seguimiento, cumplimiento legal, resultados de auditoría); adecuación de recursos; comunicaciones de partes interesadas incluidas quejas; y oportunidades de mejora continua. Las salidas deben incluir conclusiones sobre conveniencia/adecuación/eficacia, decisiones sobre mejora continua y sobre cualquier cambio necesario al SGA.
  - Cómo: el Anexo A (A.9.3) precisa el significado de tres términos que se repiten en toda la norma — "conveniencia" es cómo el SGA se ajusta a la organización, "adecuación" es si cumple los requisitos de la norma y está implementado apropiadamente, "eficacia" es si logra los resultados deseados.
- **No conformidad y acción correctiva (cláusula 10.2)**: ante una no conformidad, la organización debe reaccionar (controlarla, corregirla, mitigar impactos ambientales adversos), evaluar la necesidad de eliminar sus causas (revisando la no conformidad, determinando causas, verificando si existen no conformidades similares o potenciales), implementar acciones, revisar su eficacia, y si es necesario cambiar el SGA. Las acciones correctivas deben ser apropiadas a la importancia de los efectos, incluidos los impactos ambientales.
- **Mejora continua (cláusula 10.3)**: mejorar continuamente la conveniencia, adecuación y eficacia del SGA para mejorar el desempeño ambiental — sin definir método ni ritmo específicos, que la organización determina (Anexo A, A.10.3).

## Conceptos clave
- **Conformidad / No conformidad**: cumplimiento / incumplimiento de un requisito (3.4.2 / 3.4.3).
- **Acción correctiva**: acción para eliminar la causa de una no conformidad y evitar que vuelva a ocurrir (3.4.4) — distinta de la simple corrección de la no conformidad detectada.
- **Eficacia**: grado en el que se realizan las actividades planificadas y se logran los resultados planificados (3.4.6).
- **Indicador**: representación medible de la condición o el estado de las operaciones, la gestión o las condiciones (3.4.7, fuente ISO 14031).
- **Desempeño ambiental**: desempeño relacionado con la gestión de aspectos ambientales (3.4.11).

## Modelos mentales
Piensa en 9.1-9.2 como los "sensores" del sistema (miden y verifican) y en 9.3 como el "cerebro" que decide con esos datos — una revisión por la dirección que no llega a decisiones documentadas sobre recursos, objetivos o cambios al sistema no cumple su propósito, aunque el acta exista.

Usa la cadena 10.1→10.2→10.3 como una jerarquía de alcance: 10.1 (generalidades) identifica oportunidades de mejora a partir de 9.1-9.3; 10.2 corrige lo puntual (una no conformidad específica); 10.3 es la mejora sistémica y sostenida del SGA como un todo, no ligada a un incidente concreto.

## Antipatrones
- **Auditorías internas que "nunca encuentran nada"**: es señal de auditoría poco rigurosa, no de sistema perfecto — máxime si la organización tiene aspectos ambientales significativos genuinos.
- **Revisión por la dirección como trámite de aprobación de acta**: si no aborda las ocho entradas de 9.3 con datos reales y no produce decisiones concretas (recursos, cambios, objetivos), es forma sin sustancia.
- **Cerrar una no conformidad sin verificar la eficacia de la acción correctiva**: 10.2 exige explícitamente revisar la eficacia de la acción tomada — cerrar sin verificar deja abierta la posibilidad de reincidencia.
- **Escalar todo incumplimiento a no conformidad formal**: el Anexo A aclara que un incumplimiento corregido dentro del propio proceso del SGA no necesariamente se convierte en no conformidad — sobre-formalizar cada desviación menor sobrecarga el sistema sin aportar valor.

## Aplicado a una empresa de software
La cláusula 9 se puede ejecutar con proporcionalidad real: el seguimiento y medición (9.1.1) de una empresa pequeña puede limitarse a un puñado de indicadores honestos — consumo eléctrico de oficina, kilos de equipos electrónicos dados de baja con disposición certificada, y si aplica, estimación de huella del uso de cómputo en la nube. No hay equipos de medición que calibrar en el sentido industrial de la norma, salvo quizá medidores de consumo eléctrico si se instalan. La auditoría interna (9.2) puede ejecutarse con rotación cruzada entre responsables de área, como se hace en `[[iso-calidad]]` para el SGC, sin necesidad de un auditor ambiental certificado dedicado. La revisión por la dirección (9.3) puede fusionarse en la práctica con la misma reunión trimestral que revisa el SGC, si la empresa mantiene ambos sistemas, porque comparten estructura de alto nivel.

En 10.2, la mayoría de "no conformidades ambientales" reales en una oficina de software son menores y administrativas — un lote de equipos desechado sin registro de disposición certificada, un indicador de consumo energético no actualizado — no incidentes con impacto ambiental adverso significativo. Esto no exime de aplicar el proceso formal (reacción, análisis de causa, acción correctiva, verificación de eficacia): la proporcionalidad está en el esfuerzo, no en saltarse pasos. La honestidad aquí importa para la valoración global de la norma: para una empresa de software de oficina, el ciclo evaluación-mejora de la 14001 tiene menos "materia prima" real que analizar que su equivalente en la 45001 (capítulo 6), simplemente porque hay menos riesgo ambiental genuino que gestionar.

## Puntos clave
1. La revisión por la dirección (9.3) tiene ocho entradas obligatorias y debe producir decisiones documentadas, no solo un acta de aprobación.
2. "Conveniencia", "adecuación" y "eficacia" son términos técnicos distintos que la norma usa consistentemente en 9.3 y en el enfoque a procesos.
3. Una acción correctiva sin verificación de eficacia (10.2) no cumple el requisito, aunque la no conformidad parezca cerrada.
4. En software, el ciclo evaluación-mejora de la 14001 maneja menos volumen de hallazgos reales que su equivalente en la 45001 — la proporcionalidad del esfuerzo debe reflejar eso sin saltarse el proceso formal.

## Conecta con
- **ch01 (Contexto y planificación)**: las tendencias de desempeño revisadas en 9.3 retroalimentan directamente los riesgos y objetivos definidos en la cláusula 6.
- **ch06 (45001, evaluación y mejora)**: estructura de cláusulas 9-10 casi idéntica, con la diferencia de que 45001 añade "incidentes" junto a no conformidades en 10.2.
- **`[[iso-calidad]]`**: el cheatsheet de esa skill sobre "no conformidad mayor vs. menor" y "qué evidencia pide un auditor" aplica con el mismo criterio a un SGA, ajustando el contenido técnico de ambiental a calidad.
