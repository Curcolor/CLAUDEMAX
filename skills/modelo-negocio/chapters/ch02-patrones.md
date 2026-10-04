# Capítulo 2: Patrones de modelo de negocio

## Idea central
Cinco configuraciones recurrentes del lienzo — desagregación, larga cola, plataformas multilaterales, gratis y modelos abiertos — capturan conceptos de negocio ya probados y los traducen al vocabulario de los nueve módulos, para que sirvan como punto de partida de diseño en vez de tener que inventar desde cero; un solo modelo real puede combinar varios patrones a la vez.

## Marcos que introduce
- **Desagregación (unbundling)**: una empresa combina tres negocios de naturaleza distinta — relación con clientes, innovación de producto e infraestructura — cada uno con economía, competencia y cultura propias, que suelen entrar en conflicto si conviven en una sola organización.
  - Cuándo usarlo: cuando una empresa integrada arrastra trade-offs entre negocios con lógicas incompatibles (velocidad de innovación vs. escala de infraestructura vs. intimidad de relación).
  - Cómo: separa los tres negocios en unidades o entidades distintas, cada una optimizada para su propia lógica competitiva, y coordínalas con acuerdos explícitos en vez de forzarlas bajo una sola cultura.
- **Larga cola (long tail)**: vender poco de mucho — un catálogo enorme de nichos que juntos generan tanto o más ingreso que unos pocos éxitos masivos.
  - Cuándo usarlo: cuando la tecnología (distribución digital, motores de búsqueda/recomendación, herramientas de producción baratas) permite ofrecer y encontrar contenido de nicho a bajo costo de inventario.
  - Cómo: construye una plataforma con bajo costo marginal por ítem adicional, invierte en motores de búsqueda/recomendación para que la demanda encuentre la oferta, y agrega ingresos pequeños de muchos ítems en vez de depender de pocos éxitos.
- **Plataformas multilaterales**: conectan dos o más grupos de clientes interdependientes que se necesitan mutuamente; el valor para un lado crece con el número de usuarios del otro lado (efecto de red), lo que crea un dilema del huevo y la gallina al arrancar.
  - Cuándo usarlo: cuando el valor de tu oferta depende de conectar oferta y demanda (desarrolladores y usuarios, anunciantes y audiencia, compradores y vendedores).
  - Cómo: decide qué lado subsidiar (el más sensible al precio o el que atrae al otro lado) y de qué lado cobrar; el reto central es fijar el precio correcto en cada lado, no solo sumar usuarios.
- **Gratis como modelo de negocio**: al menos un segmento se beneficia de una oferta permanentemente gratuita, financiada por otra parte del modelo o por otro segmento; tres variantes: publicidad (plataforma multilateral), freemium (base gratuita grande + minoría que paga por lo premium) y cebo y anzuelo (bait & hook: oferta inicial barata o gratis que ata a compras recurrentes de alto margen).
  - Cuándo usarlo: publicidad cuando puedes agregar suficiente tráfico o atención para venderla; freemium cuando el costo marginal de servir a un usuario gratuito es muy bajo; cebo y anzuelo cuando puedes controlar el "lock-in" técnico o de patente entre el producto inicial y el consumible recurrente.
  - Cómo (freemium): vigila dos métricas — el costo de servir a un usuario gratuito y la tasa de conversión a premium; la base gratuita solo tiene sentido si el costo marginal por usuario adicional es bajo.
- **Modelos de negocio abiertos**: crean y capturan valor colaborando sistemáticamente con socios externos, ya sea "de afuera hacia adentro" (explotar ideas externas dentro de la empresa) o "de adentro hacia afuera" (licenciar o ceder activos internos ociosos a terceros).
  - Cuándo usarlo: de afuera hacia adentro cuando la I+D interna es costosa o lenta frente al conocimiento disponible fuera; de adentro hacia afuera cuando hay propiedad intelectual o resultados de investigación sin explotar internamente.
  - Cómo: construye "puentes" explícitos con el exterior (alianzas, plataformas de conexión tipo InnoCentive, programas con exempleados o expertos) en vez de depender de que la innovación externa llegue sola.

## Conceptos clave
- **Efecto de red**: el valor de una plataforma para un usuario crece con el número de usuarios en los otros lados.
- **Dilema del huevo y la gallina**: en una plataforma nueva, ningún lado quiere entrar hasta que el otro lado ya esté presente.
- **Costo marginal**: lo que cuesta atender a un usuario o ítem adicional; cuanto más bajo, más viable es el freemium o la larga cola.
- **Lock-in**: el vínculo técnico, contractual o de patente que ata la compra inicial (barata) a las compras recurrentes (rentables) en cebo y anzuelo.
- **Innovación de afuera hacia adentro / de adentro hacia afuera**: los dos sentidos de un modelo abierto (Chesbrough).
- **Subsidio cruzado**: un segmento o módulo financia a otro dentro del mismo modelo — la lógica común a plataformas multilaterales, publicidad y freemium.

## Modelos mentales
- Antes de copiar un patrón, identifica cuál de sus condiciones habilitantes tienes: costo marginal bajo (larga cola/freemium), efectos de red reales (plataformas), un consumible recurrente y patentable (cebo y anzuelo), o I+D ociosa (abierto). Sin la condición habilitante, el patrón no funciona, solo se ve atractivo en el papel.
- En una plataforma multilateral, la primera decisión no es "cómo monetizo" sino "qué lado subsidio" — la respuesta correcta casi nunca es simétrica entre los lados.
- Un modelo real rara vez usa un solo patrón puro: Lulu.com es larga cola *y* plataforma multilateral (autores y lectores); Google es plataforma multilateral *y* gratis-por-publicidad al mismo tiempo.

## Antipatrones
- **Freemium sin vigilar el costo marginal**: regalar un servicio con costo marginal alto por usuario (no solo bajo) quema caja aunque la tasa de conversión sea razonable — es el error más caro y más común al copiar el patrón sin entender su condición habilitante.
- **Plataforma que cobra a ambos lados por igual desde el día uno**: sin subsidiar al lado que atrae al otro, el efecto de red nunca arranca y el dilema del huevo y la gallina se vuelve permanente.
- **Cebo y anzuelo sin lock-in real**: si el consumible recurrente se puede sustituir fácilmente por uno de un tercero (sin patente, sin estándar propietario), el margen que se supone financia el subsidio inicial simplemente no llega.
- **Modelo abierto sin "puentes" dedicados**: esperar que la innovación externa llegue por sí sola, sin un canal explícito (programa, plataforma, rol dedicado) que conecte con el exterior, deja el modelo abierto solo en la intención.

## Tablas de referencia
| Patrón | Contexto (antes) | Reto | Solución (después) | Ejemplos del libro |
|---|---|---|---|---|
| Desagregación | Un modelo integra relación, innovación e infraestructura bajo un mismo techo | Culturas y economías en conflicto generan trade-offs indeseados | Separar en tres negocios complementarios coordinados | Banca privada suiza, telco móvil |
| Larga cola | La propuesta de valor apunta solo a los clientes más rentables | Atender segmentos nicho uno por uno es demasiado costoso | Agregar ingresos pequeños de muchos nichos que en conjunto son rentables | Lulu.com, LEGO Factory |
| Plataformas multilaterales | Una propuesta de valor para un solo segmento | La empresa no logra captar clientes que quieren acceso a otro segmento ya cautivo | Añadir una propuesta de valor que da acceso a un segmento existente | Google, consolas Wii/PS3/Xbox |
| Gratis | Propuesta de alto valor y alto costo solo para clientes que pagan | El precio ahuyenta a clientes potenciales | Ofrecer una propuesta gratuita financiada por otro segmento o módulo | Metro, Flickr, Skype, Gillette |
| Abierto | I+D concentrada y explotada puramente adentro | Costos de I+D altos o productividad decreciente | Aprovechar I+D externa o licenciar la I+D interna ociosa | P&G Connect & Develop, GSK, InnoCentive |

## Aplicado a una empresa de software
Los cinco patrones mapean casi uno a uno con decisiones que toda empresa de software enfrenta. **Desagregación** es la pregunta de si separar fábrica de software (relación + proyecto a medida), producto propio (innovación) e infraestructura cloud propia (si la operas tú en vez de un proveedor) — muchas consultoras de desarrollo maduras terminan escindiendo su línea de producto en una empresa aparte por esta misma razón. **Larga cola** es el argumento a favor de un marketplace de plugins, templates o integraciones de bajo costo marginal en vez de vender solo el producto núcleo. **Plataformas multilaterales** es el patrón detrás de todo negocio de API pública, marketplace de apps o ecosistema de desarrolladores: el reto de negocio no es técnico, es decidir si subsidias al desarrollador (acceso gratis a la API) para atraer al usuario final, o al revés. **Gratis** en software casi siempre es freemium — la variante crítica para SaaS: antes de lanzar un tier gratuito, calcula el costo marginal real por usuario gratuito (cómputo, soporte, almacenamiento) porque en software ese costo no siempre es tan bajo como parece (un usuario gratuito que consume mucho cómputo destruye la economía del patrón); cebo y anzuelo aparece en el hardware+SaaS (dispositivo barato, suscripción cara) o en el open-core (núcleo gratis, funciones enterprise de pago). **Modelos abiertos** es exactamente la lógica del open source comercial (Red Hat: soporte y garantía sobre un núcleo desarrollado por la comunidad) y de las empresas que exponen APIs internas como producto (el mismo camino que siguió Amazon con AWS, nacido de infraestructura interna ociosa).

## Puntos clave
1. Identifica la condición habilitante del patrón (costo marginal, efecto de red, lock-in, I+D ociosa) antes de adoptarlo — sin ella, el patrón no rinde.
2. En plataformas y en gratis, la decisión central es *a quién subsidiar*, no cuánto cobrar.
3. Los patrones se combinan: diseña pensando en cuáles conviven en tu modelo, no en cuál "es" tu modelo.
4. En freemium, vigila el costo marginal por usuario gratuito como la métrica que decide si el patrón es viable, no solo la tasa de conversión.
5. Un modelo abierto exige un puente dedicado con el exterior; no ocurre por default.

## Conecta con
- **Capítulo 1 (Lienzo)**: cada patrón es una reconfiguración de los mismos nueve módulos, especialmente Segmentos, Fuentes de Ingresos y Estructura de Costos.
- **Capítulo 4 (Estrategia)**: el marco de las Cuatro Acciones de Océano Azul se usa para diseñar variantes propias de estos patrones (ver Cirque du Soleil).
- **`patterns.md`**: versión ampliada y más consultable de estos cinco patrones, con más ejemplos y trade-offs.
- **`cheatsheet.md`**: trae la regla de decisión de cuándo un freemium tiene sentido y cuándo quema caja.
