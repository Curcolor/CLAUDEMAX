# Contexto de la organización (ISO 9001:2015, cláusula 4)

## Idea central
Antes de diseñar un solo proceso, la norma exige mirar hacia afuera y hacia adentro: qué fuerzas externas e internas condicionan el negocio, a quién hay que satisfacer además del cliente, y dónde exactamente empiezan y terminan las fronteras del sistema de gestión de la calidad (SGC). Sin este diagnóstico previo, cualquier proceso que se documente después queda desconectado de los riesgos reales de la organización.

## Marcos que introduce
- **Cuestiones externas e internas (cláusula 4.1)**: inventario de factores que pueden afectar la capacidad de la organización para lograr los resultados previstos del SGC.
  - Cuándo usarlo: al arrancar el SGC y en cada revisión por la dirección (cláusula 9.3).
  - Cómo: externas — marco legal, tecnológico, competitivo, de mercado, cultural, social, económico; internas — valores, cultura, conocimiento, desempeño de la organización. Se hace seguimiento y revisión periódica de esta información, no es un ejercicio de una sola vez.
- **Partes interesadas pertinentes (cláusula 4.2)**: identificación de quién, además del cliente, puede afectar o verse afectado por el SGC.
  - Cuándo usarlo: para no limitar el alcance del SGC solo a "cumplir contratos con clientes".
  - Cómo: se listan las partes interesadas cuyos requisitos son relevantes para el SGC, se determinan sus requisitos pertinentes, y se hace seguimiento de esa información. La organización decide qué requisitos de qué partes son pertinentes — no hay obligación de atender a todas.
- **Alcance del SGC (cláusula 4.3)**: declaración documentada de qué productos, servicios, procesos y ubicaciones cubre el sistema.
  - Cuándo usarlo: para acotar qué se certifica y qué requisitos de la norma no aplican.
  - Cómo: se determina considerando las cuestiones de 4.1, los requisitos de 4.2, y los productos/servicios de la organización. Un requisito solo puede declararse "no aplicable" si su exclusión no compromete la capacidad de lograr conformidad de productos y servicios ni la satisfacción del cliente — no existen "exclusiones" libres como en la versión 2008.
- **Enfoque a procesos con ciclo PHVA (cláusula 4.4)**: el SGC se gestiona como una red de procesos interrelacionados, no como un conjunto de departamentos aislados.
  - Cuándo usarlo: es el armazón que sostiene toda la norma — las cláusulas 4 a 10 están organizadas según el ciclo Planificar-Hacer-Verificar-Actuar.
  - Cómo: para cada proceso se determinan entradas y salidas esperadas, secuencia e interacción con otros procesos, criterios y métodos de control (incluidos indicadores), recursos necesarios, responsables y autoridades, riesgos y oportunidades a abordar (enlaza con 6.1), y el propio proceso de mejora continua del proceso.

## Conceptos clave
- **Contexto de la organización**: combinación de cuestiones internas y externas que pueden afectar el enfoque de la organización para el desarrollo y logro de sus objetivos (ISO 9000:2015, 3.2.2).
- **Parte interesada**: persona u organización que puede afectar, verse afectada o percibirse como afectada por una decisión o actividad (ISO 9000:2015, 3.2.3).
- **Pensamiento basado en riesgos**: sustituye a la antigua "acción preventiva" de la versión 2008; no exige un proceso formal de gestión del riesgo documentado, salvo que la organización decida adoptarlo.
- **Información documentada**: término unificado de la versión 2015 que reemplaza "documento", "procedimiento documentado", "manual de calidad" y "registro" — la organización decide cuánta y en qué forma según su tamaño, complejidad y competencia de su personal.

## Modelos mentales
Piensa en la cláusula 4 como el "diagnóstico" antes del "tratamiento": las cláusulas 5-10 diseñan el sistema, pero solo tienen sentido si 4.1-4.3 identificaron correctamente los riesgos, las partes interesadas y los límites reales del negocio.

Usa el enfoque a procesos como un mapa de interdependencias, no como un organigrama: dos procesos que interactúan (por ejemplo, ventas y diseño) generan riesgo en su interfaz aunque cada uno funcione bien por separado.

## Antipatrones
- **Copiar la lista genérica de PESTEL sin analizar el negocio real**: un inventario de "cuestiones externas" que no se revisa nunca y no conecta con los riesgos de 6.1 es papeleo sin función.
- **Definir el alcance del SGC calcado del certificado de un competidor**: el alcance debe reflejar los productos, servicios y ubicaciones reales de la organización, no una plantilla.
- **Tratar "partes interesadas" como sinónimo de "clientes"**: proveedores críticos, reguladores, personal y hasta la comunidad pueden ser pertinentes si su incumplimiento representa un riesgo para el SGC.
- **Mapear procesos como diagrama de flujo decorativo**: si el mapa no define entradas, salidas, criterios de control e indicadores por proceso, no cumple 4.4.1 — es una ilustración, no gestión de procesos.

## Aplicado a una empresa de software
En una empresa de desarrollo pequeña, "cuestiones externas" son cosas muy concretas: el ritmo de cambio de los frameworks y del proveedor de nube, la disponibilidad de talento senior en el mercado local, las exigencias regulatorias del sector del cliente (financiero, salud), y la competencia por precio con desarrolladores freelance. Las "cuestiones internas" incluyen la rotación del equipo, la deuda técnica acumulada y la madurez de las prácticas de ingeniería.

Las partes interesadas pertinentes típicas van más allá del cliente que paga: el equipo de desarrollo (cuya competencia condiciona la calidad), los proveedores de infraestructura cloud y de librerías open source (cuya disponibilidad es un riesgo operativo), y en muchos casos el regulador si el software maneja datos personales o financieros.

El alcance del SGC de una empresa de software normalmente se declara como "desarrollo, mantenimiento y soporte de software a medida" o "desarrollo del producto SaaS X" — y ahí conviene decidir explícitamente si el 8.3 (diseño y desarrollo) se declara aplicable en su forma completa, porque en ingeniería de software casi nunca es razonable excluirlo.

El "mapa de procesos" de una empresa de software típica encadena: captación de requisitos → diseño y arquitectura → desarrollo → pruebas → despliegue → soporte/mantenimiento, con procesos de apoyo (gestión de personas, infraestructura, seguridad) atravesándolos. Ese mapa es también el mejor punto de partida para conectar con `[[swebok]]`, que detalla el contenido técnico de cada uno de esos procesos.

## Puntos clave
1. El diagnóstico de contexto y partes interesadas (4.1-4.2) no es un formulario de una vez: se revisa en cada revisión por la dirección.
2. El alcance del SGC (4.3) solo permite excluir requisitos que no comprometan la conformidad del producto/servicio ni la satisfacción del cliente.
3. El enfoque a procesos (4.4) exige, por cada proceso, entradas, salidas, criterios de control, recursos, responsables y riesgos — no basta con nombrarlo.
4. En software, declarar el diseño y desarrollo (8.3) como aplicable de forma completa es casi siempre la decisión correcta.

## Conecta con
- **Cap03 (Planificación)**: las cuestiones y partes interesadas de 4.1-4.2 son la entrada directa para determinar riesgos y oportunidades en 6.1.
- **Cap08 (Fundamentos y vocabulario)**: ISO 9000 define con precisión "contexto de la organización" y "parte interesada" que aquí se aplican como requisito.
- **`[[swebok]]`**: el mapa de procesos de ingeniería de software (requisitos, arquitectura, construcción, pruebas) es el contenido técnico que llena el enfoque a procesos de 4.4 en una empresa de desarrollo.
