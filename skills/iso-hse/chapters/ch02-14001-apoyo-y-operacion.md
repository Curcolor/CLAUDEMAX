# ISO 14001:2015 — Apoyo y operación (cláusulas 7-8)

## Idea central
Esta es la fase "Hacer" del ciclo PHVA: una vez planificados los aspectos ambientales, objetivos y riesgos (cláusula 6), la cláusula 7 exige dar los recursos, competencia, conciencia, comunicación e información documentada necesarios, y la cláusula 8 exige ejecutar el trabajo bajo control operacional, incluida la preparación ante emergencias.

## Marcos que introduce
- **Recursos (cláusula 7.1)**: determinar y proporcionar los recursos necesarios para establecer, implementar, mantener y mejorar continuamente el SGA. El Anexo A (A.7.1) lista ejemplos: recursos humanos, naturales, de infraestructura, tecnología y financieros.
- **Competencia (cláusula 7.2)**: determinar la competencia necesaria de quienes trabajan bajo el control de la organización que afecte al desempeño ambiental, asegurar que sean competentes por educación/formación/experiencia, determinar necesidades de formación, y conservar información documentada como evidencia.
- **Toma de conciencia (cláusula 7.3)**: asegurar que el personal tome conciencia de la política ambiental, los aspectos ambientales significativos y sus impactos asociados a su trabajo, su contribución a la eficacia del SGA, y las implicaciones de no cumplir los requisitos del sistema.
  - Cómo: el Anexo A (A.7.3) aclara que esto NO significa memorizar la política ni tener copia documentada — basta con conocer su existencia, propósito y cómo el propio trabajo afecta el cumplimiento.
- **Comunicación (cláusula 7.4)**: establecer procesos para comunicaciones internas y externas que determinen qué, cuándo, a quién y cómo comunicar, teniendo en cuenta los requisitos legales y asegurando coherencia y fiabilidad de la información. Se subdivide en 7.4.2 (comunicación interna) y 7.4.3 (comunicación externa).
- **Información documentada (cláusula 7.5)**: tres subapartados — 7.5.1 generalidades (qué información documentada incluir: la exigida por la norma más la que la organización determina necesaria), 7.5.2 creación y actualización (identificación, formato, revisión y aprobación), 7.5.3 control (disponibilidad, protección, distribución, almacenamiento, control de cambios, conservación y disposición).
- **Planificación y control operacional (cláusula 8.1)**: establecer criterios de operación para los procesos e implementar su control, controlar cambios planificados y examinar consecuencias de cambios no previstos, y asegurar que los procesos contratados externamente estén controlados o influidos. Incluye, desde la perspectiva de ciclo de vida: controles en el diseño y desarrollo de productos/servicios, requisitos ambientales para compras, comunicación de esos requisitos a proveedores externos, e información sobre impactos ambientales potenciales asociados al transporte, uso y fin de vida del producto o servicio.
  - Cómo: el Anexo A (A.8.1) enumera métodos de control operacional posibles — diseñar procesos que prevengan errores, usar tecnología (controles de ingeniería), usar personal competente, ejecutar de manera especificada, hacer seguimiento/medición, o determinar cuánta información documentada se necesita.
- **Preparación y respuesta ante emergencias (cláusula 8.2)**: establecer procesos para prepararse y responder a las situaciones de emergencia potenciales identificadas en 6.1.1, incluyendo planificar la respuesta, responder realmente, mitigar consecuencias, probar periódicamente las acciones planificadas, revisar los procesos tras emergencias o pruebas, y formar a las partes interesadas pertinentes.

## Conceptos clave
- **Control operacional**: mecanismo (criterios de operación + implementación del control) para asegurar que los procesos se ejecutan según lo planificado y logran los resultados ambientales previstos.
- **Proceso contratado externamente**: según el Anexo A (A.8.1), cumple simultáneamente cinco características — está dentro del alcance del SGA, es integral al funcionamiento de la organización, es necesario para el resultado previsto, la responsabilidad legal sigue siendo de la organización, y las partes interesadas perciben que la organización lo lleva a cabo.
- **Información documentada** (7.5.1, nota): su extensión varía según tamaño de la organización, tipo de actividad, necesidad de demostrar cumplimiento legal, complejidad de procesos y competencia del personal — no hay un volumen mínimo fijo.

## Modelos mentales
Piensa en 7 como "capacidad instalada" y en 8 como "ejecución bajo control": si 7 no provee recursos, competencia y comunicación suficientes, los controles operacionales de 8 fallan por causas ajenas al proceso mismo (formación insuficiente, recursos insuficientes), no por defectos del diseño del control.

Usa la jerarquía implícita del Anexo A (A.8.1) para decidir el tipo de control operacional: diseñar el proceso para prevenir errores > usar tecnología > usar personal competente > ejecutar de forma especificada > verificar por seguimiento — los controles más tempranos en esta lista son estructuralmente más fiables que los que dependen de que alguien siga un procedimiento correctamente cada vez.

## Antipatrones
- **Confundir "toma de conciencia" con "comunicación formal"**: son cláusulas distintas (7.3 vs. 7.4); el personal puede haber "recibido" un correo (comunicación) sin haber tomado conciencia real de cómo su trabajo afecta el desempeño ambiental.
- **Documentar todo por igual, sin diferenciar criticidad**: la nota de 7.5.1 habilita explícitamente ajustar el volumen de información documentada al tamaño y complejidad reales — sobre-documentar procesos simples y estables no es exigido por la norma.
- **Preparación ante emergencias que nunca se prueba**: 8.2 exige poner a prueba periódicamente las acciones de respuesta cuando sea factible — un plan de emergencia que solo existe en papel incumple ese literal.
- **No comunicar requisitos ambientales a proveedores externos**: 8.1 lo exige explícitamente cuando el proceso de compra tiene relevancia ambiental; omitirlo rompe el control de la cadena de suministro exigido por la norma.

## Aplicado a una empresa de software
La cláusula 7 aplica de forma directa y económica: los recursos (7.1) para un SGA de oficina son mínimos comparados con una planta industrial — típicamente tiempo de una persona con otras responsabilidades, no un departamento ambiental dedicado. La competencia (7.2) relevante es más de sensibilización que de certificación técnica: entender por qué apagar equipos, cómo separar residuos electrónicos, o qué implica elegir un proveedor cloud. La toma de conciencia (7.3) se cumple con onboarding y comunicación interna periódica, no con formación extensa. La información documentada (7.5) puede vivir perfectamente en las herramientas que el equipo ya usa (wiki interno, gestor de tickets) en vez de un sistema documental paralelo — el mismo argumento que aplica en `[[iso-calidad]]` para el control de versiones de código.

La cláusula 8 es donde la 14001 se vuelve menos relevante para software puro. El "control operacional" de 8.1 tiene sentido pleno para una fábrica con líneas de producción, pero en una oficina de desarrollo se reduce en la práctica a: políticas de compra de hardware con criterio ambiental (equipos eficientes, proveedores con programas de reciclaje), gestión del ciclo de vida de los equipos (mantenimiento, reparación antes que reemplazo, disposición certificada), y elección de proveedores cloud con compromisos de sostenibilidad — este último es, con diferencia, el aspecto ambiental de mayor impacto real de una empresa de software, porque la huella de cómputo en la nube escala con el uso del producto. La preparación ante emergencias (8.2) casi nunca aplica en su sentido literal (derrames, incendios industriales) salvo el caso genérico de continuidad ante un desastre en las instalaciones, que se solapa más con continuidad de negocio que con gestión ambiental propiamente dicha.

## Puntos clave
1. La cláusula 7 (apoyo) exige recursos, competencia, conciencia, comunicación e información documentada — todos ajustables al tamaño real de la organización.
2. "Toma de conciencia" (7.3) no exige memorización ni copia documentada de la política; exige entender su propósito y la relación con el propio trabajo.
3. El control operacional (8.1) incluye explícitamente comunicar requisitos ambientales a proveedores externos, relevante cuando el proveedor es de infraestructura cloud.
4. En software, el aspecto operacional de mayor impacto real es la elección de infraestructura cloud con compromisos de sostenibilidad, no el "control de procesos" en el sentido industrial de la norma.

## Conecta con
- **ch01 (Contexto y planificación)**: los aspectos ambientales significativos y objetivos definidos ahí son la entrada que la cláusula 8 debe controlar operacionalmente.
- **ch03 (Evaluación y mejora)**: la información documentada generada aquí (7.5, 8.1, 8.2) es la evidencia que se audita en 9.2 y se revisa en 9.3.
- **ch05 (45001, apoyo y operación)**: estructura de cláusulas prácticamente idéntica — competencia, comunicación e información documentada se gestionan igual para ambos sistemas si se integran.
