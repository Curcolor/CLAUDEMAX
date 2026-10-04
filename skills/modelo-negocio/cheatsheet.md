# Cheatsheet — Modelo de negocio

Reglas de decisión, no definiciones. Para "¿qué significa X?" usa `glossary.md`; esto es para "¿qué hago en esta situación?".

## Reglas de decisión rápidas

- Si dos grupos de clientes necesitan Canales, Relaciones o Propuestas de Valor distintas → trátalos como dos Segmentos de Clientes separados, no como uno solo; forzarlos juntos oculta que ya tienes dos modelos de negocio conviviendo mal diseñados como uno. (ch01)
- Si vas a diseñar el lado derecho del lienzo (valor, cliente) → valida qué Recursos, Actividades y Costos del lado izquierdo exige sostenerlo antes de comprometerte; es la causa más común de modelos que se ven bien en el papel y queman caja en la ejecución. (ch01)
- Si estás definiendo tu Canal de venta → no asumas que también define la Relación con el Cliente; son dos preguntas distintas ("¿por dónde llega la oferta?" vs. "¿qué vínculo espera el cliente?"). (ch01)
- Si vas a fijar una Fuente de Ingresos → verifica primero que coincide con cómo el cliente prefiere pagar, no solo con lo que a la empresa le resulta más fácil de cobrar; una suscripción y una venta transaccional tienen dinámicas de caja y retención completamente distintas. (ch01)
- Si vas a adoptar un patrón de modelo de negocio (larga cola, plataforma, freemium, cebo y anzuelo, abierto) → identifica primero su condición habilitante (costo marginal bajo, efecto de red real, lock-in patentable, I+D ociosa); sin ella el patrón no rinde, solo se ve atractivo en el papel. (ch02)
- Si estás diseñando una plataforma multilateral → decide primero *a quién subsidias*, no cuánto cobras en general; cobrar a ambos lados por igual desde el día uno impide que el efecto de red arranque. (ch02)
- Si tu modelo abierto depende de innovación externa → construye un puente dedicado (alianza, programa, plataforma de conexión); esperar que la innovación externa llegue sola deja el modelo abierto solo en la intención. (ch02)
- Si vas a diseñar la Propuesta de Valor → empieza por el Mapa de Empatía del segmento, no por el catálogo de productos existente; preguntar "¿qué podemos vender?" en vez de "¿qué trabajo necesita resolver este cliente?" produce propuestas que resuelven problemas de la empresa, no del mercado. (ch03)
- Si estás en una sesión de ideación de modelo de negocio → separa siempre generar ideas (cantidad, sin juicio) de seleccionarlas (criterios); mezclarlas en la misma sesión mata las ideas más arriesgadas antes de que maduren. (ch03)
- Si tienes una idea de modelo de negocio recién nacida (boceto de servilleta) → no construyas un caso de negocio financiero completo todavía; invertir rigor financiero antes de pasar por inmersión y feedback informal es la forma más cara de fallar rápido, lento. (ch03)
- Si vas a usar escenarios de futuro → resérvalos para incertidumbre estructural de industria, no los trates como predicción ni como sustituto de validar con clientes reales hoy. (ch03)
- Si vas a hacer un FODA del modelo de negocio → ánclalo módulo por módulo del lienzo, nunca a "la empresa" en abstracto; un FODA genérico produce hallazgos vagos que nadie sabe cómo accionar. (ch04)
- Si estás por mejorar un atributo en el que ya compite toda la industria → pregúntate primero si Océano Azul sugiere eliminarlo del todo; la trampa más común es invertir en subir algo que ya todos los rivales tienen. (ch04)
- Si tu propuesta sube valor pero también sube costo → no es innovación de valor, es diferenciación cara; la innovación de valor exige subir valor y bajar costo a la vez. (ch04)
- Si vas a lanzar un modelo de negocio nuevo dentro de una organización establecida → decide integración vs. separación evaluando conflicto y similitud estratégica entre ambos modelos, no por conveniencia organizacional; integrar un modelo de alto conflicto casi garantiza que el establecido lo "tame" hasta volverlo irrelevante. (ch04)
- Si usas el análisis de entorno para justificar inacción ("el mercado no está listo") → estás invirtiendo el propósito de la herramienta; el entorno es un insumo de diseño, no una excusa. (ch04)
- Si estás ejecutando el proceso de diseño de modelo de negocio → no trates las cinco fases (Movilizar, Entender, Diseñar, Implementar, Gestionar) como secuencia rígida; Entender y Diseñar avanzan mejor en ciclo, prototipando temprano en vez de investigar indefinidamente. (ch05)
- Si tu equipo sigue "investigando por si acaso" sin prototipar → es parálisis por sobre-análisis, la forma más común de perder momentum antes de llegar a Diseñar. (ch05)
- Si acabas de aterrizar una idea inicial en la fase Movilizar → corre una sesión kill/thrill (20 min de razones por las que fallará, 20 min de razones por las que funcionará) antes de comprometerte; contrarresta el sesgo de sobrestimar la primera idea. (ch05)
- Si una organización establecida está "puliendo" una idea disruptiva hasta que deje de amenazar el statu quo → la estás domesticando; el resultado suele ser un modelo que ya no resuelve el problema original. (ch05)
- Si tu modelo de negocio funciona bien hoy → no declares la fase Gestionar innecesaria; asumir que un modelo exitoso no necesita reevaluación continua es la causa raíz detrás de industrias enteras que no vieron venir su disrupción a tiempo. (ch05)

## ¿Qué módulo del lienzo atacar primero, según la etapa?

| Etapa | Módulo prioritario | Por qué |
|---|---|---|
| Idea | Segmentos de Clientes + Propuesta de Valor | Son el corazón del modelo; sin nombrarlos con precisión, cualquier otro módulo se diseña sobre un supuesto no validado. (ch01) |
| Validación | Canales, Relación con Clientes, Fuentes de Ingresos | Una vez el Segmento y la Propuesta son creíbles, hay que probar cómo llegas al cliente, qué vínculo espera y por qué valor está dispuesto a pagar de verdad. (ch01, ch03) |
| Escalado | Recursos Clave, Actividades Clave, Asociaciones Clave, Estructura de Costos | El lado izquierdo (eficiencia e infraestructura) es el que determina si el modelo sostiene volumen sin que el costo crezca al mismo ritmo que los ingresos. (ch01, ch04) |

## ¿Freemium tiene sentido aquí, o quema caja?

| Señal | Diagnóstico |
|---|---|
| El costo marginal de servir a un usuario gratuito adicional es bajo (infraestructura ya construida, sin soporte humano por usuario) | Freemium es viable — la base gratuita se sostiene aunque la conversión a premium sea modesta. (ch02) |
| El costo marginal por usuario gratuito es alto (cómputo intensivo, soporte humano, almacenamiento caro) | Freemium quema caja aunque la tasa de conversión parezca razonable; es el error más caro y más común al copiar el patrón. (ch02) |
| Solo estás vigilando la tasa de conversión, no el costo marginal | Estás midiendo la métrica equivocada; el costo marginal por usuario gratuito es la que decide si el patrón es viable. (ch02) |
| El consumible recurrente (si es cebo y anzuelo en vez de freemium puro) no tiene lock-in real | El margen que debería financiar el subsidio inicial no llega porque un tercero ofrece el recambio más barato. (ch02) |

## Señales de que tu Propuesta de Valor es débil

- Nace del catálogo ("¿qué podemos vender?") y no del trabajo que el cliente necesita resolver. (ch03)
- No se diseñó a partir de un Mapa de Empatía real del segmento, sino de supuestos internos. (ch03)
- Es idéntica en los atributos sobre los que ya compite toda la industria — no eliminó, redujo, incrementó ni creó nada distinto (prueba de Océano Azul). (ch04)
- Sube valor pero también sube costo — diferenciación cara, no innovación de valor real. (ch04)
- Se diseñó sin mirar qué Recursos, Actividades y Costos exige sostenerla en el lado izquierdo del lienzo. (ch01)

## Señales de que el modelo no escala

- La Estructura de Costos tiene un componente variable disfrazado de fijo (por ejemplo, nómina que crece 1:1 con cada cliente nuevo) en vez de economías de escala o de alcance reales. (ch01)
- Las Fuentes de Ingresos dependen de venta puntual repetida (proyecto, licencia perpetua) en vez de algo recurrente y predecible. (ch01)
- Una plataforma multilateral no logra que ningún lado despegue porque cobra a ambos por igual — el dilema del huevo y la gallina se volvió permanente. (ch02)
- Un freemium tiene costo marginal alto por usuario gratuito: cada usuario nuevo agrega costo casi al ritmo de los ingresos que genera la minoría que paga. (ch02)
- El FODA por módulo muestra la misma debilidad concentrada en Fuentes de Ingresos o Recursos Clave repetida trimestre a trimestre, sin que nadie la ataque directamente. (ch04)

## ¿Cuándo pivotar?

- Cuando la fase Entender revela, con datos reales y no supuestos, que el Segmento de Clientes elegido no valida la Propuesta de Valor — no sigas "investigando por si acaso"; prototipa una alternativa. (ch05)
- Cuando el modelo depende de una condición habilitante que en la práctica no se cumple (costo marginal alto en un freemium, ningún lado dispuesto a pagar en una plataforma, consumible sin lock-in en cebo y anzuelo). (ch02)
- Cuando el entorno (fuerzas de mercado, industria, tendencias o macroeconómicas) cambió lo suficiente como para que el "espacio de diseño" ya no sea el mismo que cuando se diseñó el modelo — no lo trates como excusa para no actuar, trátalo como señal para rediseñar. (ch04)
- Cuando sostener el modelo actual exige domesticar cada vez más la idea original hasta que deje de resolver el problema que la originó — es mejor pivotar formalmente que seguir diluyendo. (ch05)
- Nunca pivotes solo por haber invertido mucho ya en la idea original (costo hundido); evalúa contra la evidencia de Entender, no contra cuánto cuesta admitir que hace falta un cambio.
