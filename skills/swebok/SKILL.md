---
name: swebok
description: Guía de bolsillo del SWEBOK v4 (IEEE Computer Society) sobre las 18 áreas de conocimiento de la ingeniería de software — requisitos, arquitectura, diseño, construcción, pruebas, calidad, mantenimiento, gestión, proceso, seguridad y economía (requirements, architecture, testing, quality, maintenance, estimation) — más una capa de referencia curada a mano sobre principios SOLID (SRP, OCP, LSP, ISP, DIP), los 23 patrones de diseño GoF (design patterns: factory, strategy, observer, decorator...) y arquitecturas de sistema (clean architecture, hexagonal, microservicios / microservices, monolito, event-driven, CQRS). Úsala para estimar esfuerzo, elegir técnica de prueba, fijar el nivel de formalidad de requisitos, documentar arquitectura, evaluar deuda técnica, refactorizar con criterio, elegir un patrón GoF, o resolver cualquier pregunta de software engineering / ingeniería de software con vocabulario y marcos estándar de la industria.
---

# SWEBOK v4 — Guía de bolsillo de ingeniería de software

## Qué es
El SWEBOK (Software Engineering Body of Knowledge) v4 es el compendio de referencia de la IEEE Computer Society que organiza el conocimiento consensuado de la ingeniería de software en 18 áreas de conocimiento (KA), desde requisitos hasta fundamentos matemáticos y de ingeniería. No es una metodología ni un proceso: es el vocabulario preciso y los marcos de decisión que cualquier ingeniero de software profesional debería reconocer, sea cual sea el ciclo de vida, el dominio o la industria en la que trabaje.

Esta skill absorbe además la antigua `architecture-principles`: SOLID, los 23 patrones GoF y las arquitecturas de sistema viven aquí como material curado a mano (carpeta `referencias/`), con más profundidad práctica que la que da el SWEBOK en esos puntos concretos.

## Modelos mentales transversales
Los ocho que más se repiten o tienen más alcance en las 18 áreas — sirven aunque no abras ningún capítulo.

1. **El proceso de decisión de ingeniería (6 pasos)**: comprender el problema real (a menudo con los 5 porqués) → definir criterios de selección → identificar todas las alternativas factibles → evaluar cada una con la misma base de comparación → elegir → monitorear el resultado real frente a lo estimado. Es el mismo esqueleto tanto para elegir un algoritmo como para evaluar un proyecto completo (ch15, ch18).
2. **No midas sin una decisión detrás (GQM)**: toda métrica debe existir para responder una pregunta que sostiene una decisión concreta; si nadie decidiría distinto según el resultado, es medición para curiosos y hay que eliminarla (ch09, ch10, ch18).
3. **Verificación ≠ validación ≠ certificación**: verificación pregunta "¿se construyó correctamente?" (cumple la especificación de la fase previa); validación pregunta "¿se construyó lo correcto?" (cumple la necesidad real); certificación pregunta "¿un tercero lo atestigua?". Confundirlas es la fuente más común de falsa confianza en calidad (ch03, ch05, ch12).
4. **Los 5 porqués como filtro universal**: ante cualquier petición, solicitud de cambio o síntoma, pregunta repetidamente "¿por qué?" hasta llegar al problema real, no a la primera solución propuesta (ch01, ch15, ch18).
5. **Continuo predictivo-adaptativo, nunca binario**: cascada y ágil son los dos extremos de un mismo espectro; el punto correcto depende de cuánto se conocen ya requisitos y arquitectura, no de moda ni de preferencia del equipo (ch09, ch10).
6. **Separación de preocupaciones / divide y vencerás**: aísla una preocupación a la vez —funcional/no funcional, negocio/tecnología, una vista arquitectónica a la vez— porque es la única técnica eficaz para razonar sobre sistemas complejos (ch01, ch02, ch03).
7. **La trazabilidad es motor del análisis de impacto, no solo auditoría**: enlazar requisito → diseño → código → prueba permite responder "¿qué se rompe si cambio esto?" antes de tocar nada (ch01, ch07, ch08).
8. **Todo lo que afecta al producto debería ser código, y toda deuda es una decisión financiera**: infraestructura, configuración y operaciones "como código" (IaC/PaC) por defecto; la deuda técnica —de código o de arquitectura— se cuantifica en costo/ahorro/urgencia, no se juzga solo estéticamente (ch02, ch06, ch07).

## Índice de temas
Encuentra el capítulo o la referencia correcta por la pregunta que tienes, no por el nombre del área.

| Pregunta / tema | Capítulo / referencia |
|---|---|
| Clasificar un requisito como funcional o no funcional | [ch01](chapters/ch01-requisitos-de-software.md) |
| Priorizar requisitos en conflicto (modelo de Kano) | [ch01](chapters/ch01-requisitos-de-software.md) |
| Elegir técnica de especificación de requisitos (lenguaje natural, casos de uso, ATDD/BDD, formal) | [ch01](chapters/ch01-requisitos-de-software.md) |
| Negociar restricciones de calidad de servicio (rendimiento, fiabilidad, capacidad) | [ch01](chapters/ch01-requisitos-de-software.md) |
| Trazabilidad de requisitos | [ch01](chapters/ch01-requisitos-de-software.md) |
| Qué es la arquitectura de software y cómo documentarla (vistas, viewpoints) | [ch02](chapters/ch02-arquitectura-de-software.md) |
| Elegir un modelo de vistas (4+1 de Kruchten, módulo, componente-conector) | [ch02](chapters/ch02-arquitectura-de-software.md) |
| Evaluar una arquitectura (ATAM, SAAM, QAW) | [ch02](chapters/ch02-arquitectura-de-software.md) |
| Identificar un requisito arquitectónicamente significativo (ASR) | [ch02](chapters/ch02-arquitectura-de-software.md) |
| Elegir estilo o patrón arquitectónico (capas, microservicios, MVC, pub-sub, P2P) | [ch02](chapters/ch02-arquitectura-de-software.md) |
| **Elegir arquitectura de sistema por fuerza (equipo, cadencia, escala) y sus trade-offs** | [referencias/arquitecturas.md](referencias/arquitecturas.md) |
| **Elegir entre hexagonal, clean, onion, microservicios, monolito modular, event-driven, CQRS, serverless** | [referencias/arquitecturas.md](referencias/arquitecturas.md) |
| Diagnosticar una arquitectura fragmentada o rara (Ley de Conway) | [ch02](chapters/ch02-arquitectura-de-software.md) |
| Documentar la justificación de una decisión de diseño (rationale) | [ch02](chapters/ch02-arquitectura-de-software.md), [ch03](chapters/ch03-diseno-de-software.md) |
| Ubicar una decisión en la etapa de diseño correcta (arquitectónico / alto nivel / detallado) | [ch03](chapters/ch03-diseno-de-software.md) |
| Aplicar principios de diseño (SOLID, SOFA, acoplamiento, cohesión) | [ch03](chapters/ch03-diseno-de-software.md) |
| **Aplicar SOLID con prueba de olfato por principio y coste de sobreaplicar (SRP, OCP, LSP, ISP, DIP)** | [referencias/solid.md](referencias/solid.md) |
| Elegir un patrón de diseño GoF (creacional, estructural, de comportamiento) | [ch03](chapters/ch03-diseno-de-software.md) |
| **Elegir entre los 23 patrones GoF por disparador de una línea (factory, strategy, observer, decorator...)** | [referencias/patrones-gof.md](referencias/patrones-gof.md) |
| Elegir notación de diseño (estructural vs. comportamiento, UML) | [ch03](chapters/ch03-diseno-de-software.md) |
| Aplicar los cinco fundamentos de la construcción de software | [ch04](chapters/ch04-construccion-de-software.md) |
| Usar diseño por contrato (precondiciones/poscondiciones) | [ch04](chapters/ch04-construccion-de-software.md), [ch11](chapters/ch11-modelos-y-metodos-de-ingenieria-de-software.md) |
| Elegir integración incremental vs. "big bang" / integración continua | [ch04](chapters/ch04-construccion-de-software.md) |
| Decidir cuándo aplicar TDD | [ch04](chapters/ch04-construccion-de-software.md) |
| Elegir técnica de prueba (caja negra, caja blanca, mutación, exploratoria) | [ch05](chapters/ch05-pruebas-de-software.md) |
| Elegir nivel de prueba (unidad, integración, sistema, aceptación) | [ch05](chapters/ch05-pruebas-de-software.md) |
| Decidir cuándo detener las pruebas (test completion) | [ch05](chapters/ch05-pruebas-de-software.md) |
| Resolver el problema del oráculo al automatizar pruebas | [ch05](chapters/ch05-pruebas-de-software.md) |
| Medir la efectividad real de una suite de pruebas (mutación) | [ch05](chapters/ch05-pruebas-de-software.md) |
| Desacoplar despliegue de lanzamiento (feature flags, canary, dark launch) | [ch06](chapters/ch06-operaciones-de-ingenieria-de-software.md) |
| Implementar infraestructura como código (IaC/PaC) | [ch06](chapters/ch06-operaciones-de-ingenieria-de-software.md) |
| Diferenciar SRE de ingeniería de plataforma | [ch06](chapters/ch06-operaciones-de-ingenieria-de-software.md) |
| Diferenciar gestión de incidentes de gestión de problemas | [ch06](chapters/ch06-operaciones-de-ingenieria-de-software.md) |
| Diferenciar entrega continua, despliegue continuo y pruebas continuas | [ch06](chapters/ch06-operaciones-de-ingenieria-de-software.md) |
| Clasificar una solicitud de mantenimiento (correctivo, adaptativo, perfectivo...) | [ch07](chapters/ch07-mantenimiento-de-software.md) |
| Aplicar las leyes de evolución de Lehman | [ch07](chapters/ch07-mantenimiento-de-software.md) |
| Hacer análisis de impacto de un cambio | [ch07](chapters/ch07-mantenimiento-de-software.md), [ch08](chapters/ch08-gestion-de-configuracion-del-software.md) |
| Elegir entre refactorizar, reingeniería o ingeniería inversa | [ch07](chapters/ch07-mantenimiento-de-software.md) |
| Definir un elemento de configuración (CI) y una línea base | [ch08](chapters/ch08-gestion-de-configuracion-del-software.md) |
| Diseñar el flujo de control de cambios (SCR, CCB) | [ch08](chapters/ch08-gestion-de-configuracion-del-software.md) |
| Generar y mantener un SBOM | [ch08](chapters/ch08-gestion-de-configuracion-del-software.md) |
| Estructurar el ciclo de gestión de un proyecto (7 actividades) | [ch09](chapters/ch09-gestion-de-ingenieria-de-software.md) |
| Decidir SDLC predictivo o adaptativo | [ch09](chapters/ch09-gestion-de-ingenieria-de-software.md), [ch10](chapters/ch10-proceso-de-ingenieria-de-software.md) |
| Montar un programa de medición (ISO/IEC/IEEE 15939) | [ch09](chapters/ch09-gestion-de-ingenieria-de-software.md) |
| Asignar responsabilidades con RACI | [ch09](chapters/ch09-gestion-de-ingenieria-de-software.md) |
| Elegir modelo de ciclo de vida (cascada, V, incremental, espiral, ágil) | [ch10](chapters/ch10-proceso-de-ingenieria-de-software.md) |
| Aplicar los procesos de ISO/IEC/IEEE 12207 | [ch10](chapters/ch10-proceso-de-ingenieria-de-software.md) |
| Mejorar un proceso con evidencia (PDCA, CMMI, SPICE) | [ch10](chapters/ch10-proceso-de-ingenieria-de-software.md) |
| Elegir método de desarrollo (heurístico, formal, prototipado, ágil) | [ch11](chapters/ch11-modelos-y-metodos-de-ingenieria-de-software.md) |
| Verificar completitud y consistencia de un modelo | [ch11](chapters/ch11-modelos-y-metodos-de-ingenieria-de-software.md) |
| Elegir método ágil (XP, Scrum, FDD, Lean) | [ch11](chapters/ch11-modelos-y-metodos-de-ingenieria-de-software.md) |
| Justificar inversión en calidad (costo de la calidad, CoSQ) | [ch12](chapters/ch12-calidad-del-software.md) |
| Calibrar el nivel de integridad y el rigor de V&V | [ch12](chapters/ch12-calidad-del-software.md) |
| Elegir V&V estática, dinámica o formal | [ch12](chapters/ch12-calidad-del-software.md) |
| Integrar seguridad en el ciclo de vida (SDLC seguro, DevSecOps) | [ch13](chapters/ch13-seguridad-del-software.md) |
| Modelar amenazas | [ch13](chapters/ch13-seguridad-del-software.md) |
| Aplicar prácticas de codificación segura (CERT) | [ch13](chapters/ch13-seguridad-del-software.md) |
| Usar catálogos CVE/CWE/CAPEC/CVSS | [ch13](chapters/ch13-seguridad-del-software.md) |
| Elegir entre certificación, cualificación o licencia | [ch14](chapters/ch14-practica-profesional-de-ingenieria-de-software.md) |
| Hacer un análisis de compensaciones (trade-off) defendible | [ch14](chapters/ch14-practica-profesional-de-ingenieria-de-software.md) |
| Aplicar un código de ética profesional | [ch14](chapters/ch14-practica-profesional-de-ingenieria-de-software.md) |
| Estimar esfuerzo o costo (analogía, paramétrica, descomposición) | [ch15](chapters/ch15-economia-de-la-ingenieria-de-software.md) |
| Comparar alternativas de inversión (valor presente, TIR, MARR) | [ch15](chapters/ch15-economia-de-la-ingenieria-de-software.md) |
| Decidir con criterios múltiples, no solo dinero | [ch15](chapters/ch15-economia-de-la-ingenieria-de-software.md) |
| Calcular TCO frente al costo de desarrollo inicial | [ch15](chapters/ch15-economia-de-la-ingenieria-de-software.md) |
| Elegir arquitectura de cómputo o ISA (RISC/CISC, taxonomía de Flynn) | [ch16](chapters/ch16-fundamentos-de-la-informatica.md) |
| Comparar la eficiencia de dos algoritmos (notación asintótica) | [ch16](chapters/ch16-fundamentos-de-la-informatica.md) |
| Elegir ACID o BASE para una base de datos | [ch16](chapters/ch16-fundamentos-de-la-informatica.md) |
| Elegir técnica de demostración matemática | [ch17](chapters/ch17-fundamentos-matematicos.md) |
| Elegir tipo de gramática o parser (jerarquía de Chomsky) | [ch17](chapters/ch17-fundamentos-matematicos.md) |
| Modelar un componente con estados (máquina de estados finitos) | [ch17](chapters/ch17-fundamentos-matematicos.md) |
| Identificar la escala de medición de una métrica (nominal/ordinal/intervalo/razón) | [ch18](chapters/ch18-fundamentos-de-ingenieria.md) |
| Encontrar la causa raíz de un defecto recurrente (RCA, Ishikawa, FTA, FMEA) | [ch18](chapters/ch18-fundamentos-de-ingenieria.md) |
| Diseñar un experimento u observación válida (GQM, confiabilidad vs. validez) | [ch18](chapters/ch18-fundamentos-de-ingenieria.md) |

## Las 18 áreas de conocimiento

| # | Área de conocimiento | Qué resuelve |
|---|---|---|
| 1 | Requisitos de Software | Convierte necesidades ambiguas de las partes interesadas en especificaciones verificables y sin ambigüedad |
| 2 | Arquitectura de Software | Fija las estructuras y decisiones fundamentales para razonar sobre el sistema en su entorno |
| 3 | Diseño de Software | Transforma requisitos en una solución estructurada e implementable, con su justificación registrada |
| 4 | Construcción de Software | Codifica, integra y depura minimizando complejidad y construyendo para la verificación |
| 5 | Pruebas de Software | Valida dinámicamente que el software se comporta como se espera en un conjunto finito y bien elegido de casos |
| 6 | Operaciones de Ingeniería de Software | Implementa, opera y da soporte al software en producción tratando infraestructura como código |
| 7 | Mantenimiento de Software | Sostiene y evoluciona el software durante toda su vida operativa, mucho más allá de corregir errores |
| 8 | Gestión de la Configuración del Software | Da identidad y control verificable a cada versión de cada artefacto del ciclo de vida |
| 9 | Gestión de Ingeniería de Software | Combina gestión de proyectos y medición para planificar, ejecutar y cerrar proyectos de software |
| 10 | Proceso de Ingeniería de Software | Selecciona y adapta el ciclo de vida (predictivo, adaptativo o híbrido) según el proyecto |
| 11 | Modelos y Métodos de Ingeniería de Software | Elige la abstracción y el método de desarrollo según cuál es la mayor incertidumbre del problema |
| 12 | Calidad del Software | Gestiona conformidad con requisitos reales mediante V&V, SQA y costo de la calidad |
| 13 | Seguridad del Software | Integra controles de seguridad en cada etapa del ciclo de vida, no como capa final |
| 14 | Práctica Profesional de Ingeniería de Software | Ética, credenciales, dinámica de equipo y responsabilidad legal del ejercicio profesional |
| 15 | Economía de la Ingeniería de Software | Evalúa cada decisión técnica como una decisión de inversión, con criterios financieros e intangibles |
| 16 | Fundamentos de la Informática | Provee la base amplia (arquitectura, datos, redes, SO, IA) para decisiones de diseño informadas |
| 17 | Fundamentos Matemáticos | Da las herramientas formales (lógica, gramáticas, autómatas, demostración) para razonar con precisión |
| 18 | Fundamentos de Ingeniería | Aporta el proceso de resolución de problemas, medición y análisis de causa raíz común a toda ingeniería |

## Cómo usar esta skill

- **`chapters/` vs. `referencias/`** — `chapters/` es destilación directa del SWEBOK v4 (18 áreas, marcos con cita de origen). `referencias/` es contenido curado a mano, con más profundidad práctica que el SWEBOK en tres puntos concretos: SOLID (pruebas de olfato), los 23 patrones GoF (disparador de una línea) y arquitecturas de sistema (guía de elección por fuerza y trade-offs que muerden). Cada archivo de `referencias/` lo indica en su primera línea.
- **¿"Qué significa X"?** → consulta primero `glossary.md`; tiene todos los términos de las 18 áreas en una sola pasada.
- **¿"Qué marco o técnica aplico para Y"?** → consulta `patterns.md`, agrupado por tema (requisitos, diseño y arquitectura, pruebas, gestión y proceso, calidad y seguridad, economía y práctica profesional, fundamentos).
- **¿"Debo elegir A o B"?, umbrales, checklists de antipatrones o señales de alerta** → consulta `cheatsheet.md` primero: es la vía más rápida para una decisión en caliente, con reglas del tipo "si X, haz Y, porque Z".
- **Necesitas el detalle completo de un área** (marcos con su "cuándo/cómo", tablas de referencia, ejemplos, conexiones con otras áreas) → abre el capítulo correspondiente en `chapters/` usando el índice de temas de arriba.
- **Necesitas SOLID, un patrón GoF o elegir una arquitectura de sistema con trade-offs** → abre el archivo correspondiente en `referencias/` (`solid.md`, `patrones-gof.md`, `arquitecturas.md`) usando el índice de temas de arriba.
- Si una pregunta no aparece literal en el índice, búscala por palabra clave en `glossary.md` o `patterns.md` — ambos referencian el capítulo de origen para profundizar.

---

Config: skill.yaml · Schema: schema.json
