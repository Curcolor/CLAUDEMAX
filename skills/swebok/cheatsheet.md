# Cheatsheet — SWEBOK v4

Reglas de decisión, no definiciones. Para "¿qué significa X?" usa `glossary.md`; esto es para "¿qué hago en esta situación?".

## Reglas de decisión rápidas

- Si un requisito sobreviviría a hardware infinito, gratuito y sin fallas → es funcional; si no → es una restricción no funcional (tecnológica o de calidad de servicio). (ch01)
- Si te dieron una solución en vez de una necesidad → aplica los 5 porqués antes de aceptarla como requisito; normalmente converge en 2-3 ciclos. (ch01)
- Si priorizas backlog → mide satisfacción **y** insatisfacción (Kano); una sola escala de "valor" produce prioridades erróneas (fugas hacia funciones "bonitas" en vez de básicas). (ch01)
- Si una decisión es necesaria para razonar sobre el sistema *en su entorno* → es arquitectónica; si es interna a un módulo → es diseño detallado, no la eleves innecesariamente. (ch02, ch03)
- Si una arquitectura se ve extrañamente fragmentada o acoplada → sospecha primero de la estructura de comunicación de la organización (Ley de Conway), no de un error puramente técnico. (ch02)
- Si hay atributos de calidad en competencia (seguridad vs. costo, rendimiento vs. mantenibilidad) → usa ATAM antes de comprometerte con una arquitectura; no evalúes una calidad aislada de las demás. (ch02)
- Si vas a elegir un algoritmo crítico → decídelo en etapas tempranas si es arquitectónicamente significativo; dejarlo "a discreción del programador" en construcción puede hacer inviable cumplir los requisitos. (ch03)
- Si vas a integrar partes del sistema → prefiere integración incremental/CI sobre "big bang" salvo restricción explícita; localiza errores antes y da mejor visibilidad de avance. (ch04)
- Si el objetivo es exponer temprano problemas de requisitos/diseño → usa TDD; si no, no lo apliques como dogma universal. (ch04)
- Si necesitas validar contra requisitos → usa caja negra; si necesitas cobertura de código medible → usa caja blanca; combínalas, son complementarias porque detectan clases de fallos distintas. (ch05)
- Si automatizas generación de casos de prueba → verifica primero que existe un oráculo viable; sin oráculo, no es una prueba significativa, solo generación de entradas. (ch05)
- Si tu suite de pruebas está en verde → eso demuestra ausencia de fallos en esos casos, nunca ausencia de fallos en general (límite de Dijkstra); comunica cobertura/criterio alcanzado, jamás "cero defectos". (ch05)
- Si vas a poner código nuevo en producción → despliega primero (sin exponer) y decide el lanzamiento por separado con feature flags o canary release. (ch06)
- Si algo afecta al producto (entorno, configuración, infraestructura) → represéntalo como código; la pregunta por defecto es "¿por qué no está ya como código?", no "¿debería automatizarse?". (ch06)
- Si cierras un incidente → pregúntate si es recurrente; si sí, pásalo a gestión de problemas para causa raíz — cerrar incidentes uno a uno sin RCA garantiza que vuelvan a interrumpir el negocio. (ch06)
- Si vas a probar el plan de recuperación ante desastres → ensáyalo contra el entorno real (deteniendo el servicio, activando failover); un plan que solo existe en teoría no da ninguna garantía de tiempo de recuperación. (ch06)
- Si vas a clasificar una solicitud de mantenimiento → usa las 6 categorías ISO/IEC/IEEE 14764 desde el ingreso; agrupar mejora y corrección en el mismo indicador infla artificialmente el costo de "corregir errores". (ch07)
- Si vas a aceptar un cambio (MR/PR/SCR) → exige análisis de impacto (componentes, costo, riesgo) antes de aprobarlo, salvo la ruta de emergencia documentada aparte. (ch07, ch08)
- Si decides cuántos elementos de configuración (CI) rastrear → más CIs = más sobrecarga de gestión; menos CIs = puntos ciegos donde ocurren los incidentes. Ajusta al costo de seguimiento vs. valor de decisión. (ch08)
- Si un proyecto tiene requisitos y arquitectura ya conocidos y estables → sesga hacia predictivo; si se espera evolución continua de requisitos → sesga hacia adaptativo. Es un continuo, nunca una elección binaria ni ideológica. (ch09, ch10)
- Si vas a medir algo → pregúntate primero qué decisión depende de esa medición (GQM); si ninguna decisión cambiaría según el resultado, no la midas — es medición para curiosos. (ch09, ch10, ch18)
- Si adoptas un ciclo de vida "porque es el estándar de la industria" → adáptalo siempre a las características reales del producto y las partes interesadas; la adaptación es obligatoria, no opcional. (ch10)
- Si la mayor incertidumbre de un proyecto son los requisitos → prototipa; si es la corrección crítica → usa métodos formales; si es el cambio constante → usa un método ágil. Elige por la fuente de incertidumbre, no por costumbre del equipo. (ch11)
- Si importas un modelo o componente de otra librería → revisa sus suposiciones semánticas antes de confiar en su comportamiento; la misma sintaxis puede significar algo distinto en el nuevo contexto. (ch11)
- Si el software es crítico para la seguridad → asigna un nivel de integridad y calibra el rigor de V&V (estática/dinámica/formal) según ese nivel, no de forma uniforme para todo el sistema. (ch12)
- Si vas a argumentar inversión en calidad ante dirección → cuantifica el CoSQ completo (conformidad + no conformidad); el costo real ya existe, solo que oculto en retrabajo y fallas externas. (ch12)
- Si diseñas requisitos de seguridad → derívalos desde el inicio del proyecto con modelado de amenazas; añadirlos tras el diseño ya es tarde y mucho más caro. (ch13)
- Si confías solo en análisis estático o solo en pentesting → ninguno por sí solo encuentra todas las vulnerabilidades, sobre todo las que solo se manifiestan en estados difíciles de producir; usa defensa en profundidad. (ch13)
- Si evalúas una credencial → distingue certificación/cualificación (voluntarias) de licencia (legal, exigible según jurisdicción); no las trates como intercambiables al asesorar. (ch14)
- Si haces un análisis de compensaciones bajo presión de plazo/presupuesto → declara conflictos de interés por adelantado y considera explícitamente la alternativa de "no hacer nada"; sin eso, el resultado no es defendible profesionalmente. (ch14, ch15)
- Si comparas alternativas de inversión → usa la misma base de comparación y el mismo horizonte temporal para todas; comparar sin igualar el horizonte sesga a favor del plazo más corto. (ch15)
- Si sientes la tentación de seguir invirtiendo "porque ya gastamos mucho" → el costo hundido es irrecuperable e irrelevante para la decisión futura; ignóralo aunque genere presión emocional. (ch15)
- Si vas a estimar algo de alto impacto → usa varias técnicas y busca convergencia/divergencia entre ellas; una sola estimación de una sola técnica no revela factores importantes pasados por alto. (ch15)
- Si eliges estructura de datos o algoritmo → evalúa siempre contra el perfil real de los datos de entrada (tamaño, orden, tipo) y el recurso limitante (tiempo vs. memoria); la notación asintótica sola no basta. (ch16)
- Si necesitas demostrar una propiedad → elige la técnica según la forma del enunciado: existencial → un ejemplo basta; universal sobre enteros → inducción; implicación difícil de probar directo → contradicción o contraposición. Nunca demuestres un enunciado universal con un ejemplo. (ch17)
- Si vas a promediar, sumar o comparar proporcionalmente una métrica → verifica su escala de medición (nominal/ordinal/intervalo/razón) primero; los niveles CMMI no se promedian aunque el lenguaje te lo permita calcular. (ch18)
- Si un defecto es recurrente → aplica un RCA formal (5 porqués, Ishikawa, FTA) antes de proponer una corrección; sin causa raíz identificada, la corrección solo trata el síntoma. (ch18)

## ¿Qué técnica de prueba uso, según el objetivo?

| Objetivo | Técnica | Fuente de información |
|---|---|---|
| Validar contra requisitos/especificación | Caja negra (partición de equivalencia, valores límite, tablas de decisión) | Comportamiento entrada/salida |
| Medir cobertura de código real | Caja blanca (sentencias, ramas, MC/DC, flujo de datos) | Estructura del código |
| Encontrar fallos no anticipados por ningún caso formal | Basada en experiencia (exploratoria, ad hoc, monkey testing) | Intuición y conocimiento del tester |
| Evaluar si la suite detecta fallos reales, no solo cubre líneas | Mutación / clasificación ortogonal de defectos | Modelo de fallas predefinido |
| Estimar fiabilidad representativa del uso real | Basada en perfil operativo, pruebas estadísticas | Modelo estadístico de uso |
| Detectar defectos de requisitos/diseño antes de codificar | TDD / ATDD / BDD | Casos de prueba como especificación |

*Regla general*: nunca uses una sola fila — funcional y estructural son complementarias porque parten de fuentes de información distintas y detectan clases de fallos distintas.

## ¿Qué técnica de estimación uso, según la información disponible?

| Información disponible | Técnica | Precisión | Riesgo si la usas sin lo anterior |
|---|---|---|---|
| Ninguna base histórica, se necesita algo rápido | Juicio de expertos | Baja | Sesgo individual no detectado |
| Un proyecto comparable real conocido | Analogía | Media | La analogía no calza tan bien como parece |
| Tiempo para descomponer todo el trabajo | Descomposición (bottom-up) | Media-alta | Mucho esfuerzo; el sesgo sistemático no se cancela aunque los errores aleatorios sí |
| Base de datos histórica sólida y validada | Paramétrica | Alta | Ecuación no validada para este tipo de proyecto = falsa precisión |
| Decisión de alto impacto, presupuesto para varias pasadas | Estimaciones múltiples (buscar convergencia/divergencia) | La más alta | Costo adicional de esfuerzo de estimación |

## ¿Qué nivel de formalidad de requisitos según el riesgo?

| Riesgo / criticidad | Técnica de especificación | Por qué |
|---|---|---|
| Bajo, equipo pequeño, dominio conocido | Lenguaje natural estructurado (historias, casos de uso) | Más preciso que prosa libre sin el costo de formalismo |
| Ambigüedad ya es un problema recurrente | Basada en criterios de aceptación (ATDD/BDD) | Ataca la ambigüedad directamente con lenguaje de casos de prueba |
| Interacción dinámica difícil de describir en texto (UI) | Prototipado | El comportamiento dinámico se valida mejor mostrado que descrito |
| Alto riesgo / seguridad crítica, se necesita demostrar propiedades | Basada en modelos formal | Permite razonar y demostrar corrección, no solo describir |

*Antipatrón a evitar*: exigir formalismo máximo a lectores humanos sin necesidad real — el compromiso recomendado es fundamentos formales con sintaxis de superficie legible (trade-off de Wing), no formalismo por prestigio.

## ¿Refactorizar, reingeniería o vivir con la deuda?

| Situación | Acción | Nota |
|---|---|---|
| El comportamiento externo debe mantenerse igual y el código interno molesta | Refactorizar | No cambia comportamiento, sí estructura interna |
| El sistema heredado ya no admite la forma actual y hay que reconstituirlo | Reingeniería | Puede incluir ingeniería inversa + reconstrucción |
| Solo necesitas entender qué hace el sistema, sin tocarlo | Ingeniería inversa | Análisis pasivo, no modifica ni genera software nuevo |
| La deuda es alta pero no bloquea el negocio hoy | Cuantifícala (costo actual, ahorro potencial, urgencia) y decide como inversión, no por sensación de "código sucio" | Trata la deuda técnica como decisión financiera, no estética |
| La deuda técnica se ignoró sistemáticamente varias versiones | Verifica las leyes de Lehman: si la complejidad crece sin control o se pierde la "conservación de la familiaridad", ya se está sembrando incidentes futuros | Termómetro, no receta directa |

## Umbrales y valores de referencia citados en el libro

| Valor | Contexto |
|---|---|
| ~80% del esfuerzo de mantenimiento | Se destina a mejora/adaptación, no a corrección de errores (ch07) |
| ≤ 25 personas | Umbral de "entidad muy pequeña" (VSE); usa perfiles ISO/IEC 29110 en vez del estándar completo (ch06) |
| ≤ 30 días | Duración máxima recomendada de un sprint en Scrum (ch11) |
| 82% de vulnerabilidades | Atribuidas a conflictos entre estilos de codificación del equipo, según cifra citada (ch16) |
| Niveles 0–5 | Escala de madurez de un Sistema de Gestión de Calidad (ISO/IEC TS 33061) (ch12) |
| c = log₂\|S\| | Capacidad de información de una FSM de c bits, con 2^c estados posibles (ch17) |
| Relación beneficio/costo < 1.0 | Criterio de descarte automático en análisis costo-beneficio (ch15) |

## Trade-off matrices

**SDLC predictivo vs. adaptativo**

| Dimensión | Predictivo | Adaptativo |
|---|---|---|
| Requisitos | Cerrados temprano | Especificación progresiva |
| Planificación | Detallada al inicio | Evoluciona por ciclo |
| Riesgo/costo | Reducido por planificación anticipada | Reducido por evolución iterativa |
| Interesados | Participación en hitos planificados | Participación continua |

**V&V — estática vs. dinámica vs. formal**

| Técnica | ¿Ejecuta el software? | Costo relativo | Úsala cuando |
|---|---|---|---|
| Estática | No | Bajo | Siempre — es la más barata; detecta antes de que el defecto se vuelva ejecutable |
| Dinámica | Sí | Medio | Necesitas observar comportamiento real (pruebas, simulación) |
| Formal | Depende | Alto | El requisito es crítico para la seguridad y necesitas corrección demostrable |

**Despliegue vs. lanzamiento — mecanismos**

| Estrategia | Mecanismo | Cuándo preferirla |
|---|---|---|
| Basada en entorno | Entorno de pruebas paralelo antes de conmutar | Cambios de infraestructura grandes |
| Basada en aplicación (feature flags) | Interruptores de funciones vía configuración | Necesitas activar/desactivar sin redeploy |
| Canary release | Implementación parcial y temporal, evaluada antes del rollout completo | Riesgo alto, quieres medir antes de comprometerte |
| Dark launch | Sin exposición visible a usuarios | Quieres observar comportamiento real sin impacto |

## Tells & smells (señales de alerta)

- Un revisor marca "cumple" en una checklist sin haber ejecutado ninguna tarea concreta → revisión pasiva e ineficaz; exige revisión activa (Parnas y Weiss). (ch02)
- Los indicadores de "costo de corrección de errores" parecen desproporcionadamente altos → probablemente se está contabilizando mejora/adaptación como si fuera corrección. (ch07)
- Nadie puede decir con certeza qué versión está en producción → falta una única fuente de verdad de SCM/IaC. (ch06, ch08)
- El mismo incidente vuelve a ocurrir bajo otra forma → se está gestionando el incidente pero no el problema (falta RCA). (ch06, ch18)
- Un prototipo empieza a recibir código de producción real sin refactorizar ni revisión → se perdió su propósito exploratorio/descartable. (ch11)
- Se reporta "cero defectos" tras una suite de pruebas en verde → contradice el límite de Dijkstra; comunica cobertura y criterio de adecuación, nunca ausencia de errores. (ch05)
- Una estimación de alto impacto se apoya en una sola técnica y un solo estimador → sin convergencia/divergencia entre métodos no se detectan factores pasados por alto. (ch15)
- Se promedia una escala ordinal (p. ej. "el nivel CMMI promedio es 1.76") → violación de teoría de la medición; la conclusión no tiene sentido aunque el cálculo sea aritméticamente correcto. (ch18)
- Un bloque catch vacío o manejo de excepciones sin contexto → tolerancia a fallos ilusoria. (ch04)
- Seguridad tratada como checklist al final del proyecto, sin patrocinio de negocio → los requisitos de seguridad no sobrevivirán a la presión de plazo/costo. (ch13)
- Un experto de negocio revisa requisitos funcionales y no funcionales mezclados → se pierde o se desentiende de los problemas tecnológicos que no domina; el requisito funcional queda sin validar bien. (ch01)
- La documentación de referencia ya no coincide con lo realmente construido → falta auditoría física (PCA); rompe la mantenibilidad futura. (ch08)
