# Capítulo 2: Arquitectura de software

## Idea central
La arquitectura es el conjunto de estructuras necesarias para razonar sobre un sistema — sus elementos, las relaciones entre ellos y las propiedades de ambos — y existe porque distintas partes interesadas tienen distintas preocupaciones fundamentales que ninguna vista única puede satisfacer.

## Marcos que introduce
- **Los tres sentidos de "arquitectura"**: (1) disciplina — el arte y la ciencia de construir sistemas intensivos en software; (2) proceso — las etapas mediante las que se materializa (diseño arquitectónico); (3) resultado — el producto de aplicar ese proceso, expresado en descripciones de arquitectura.
  - Cuándo usarlo: para desambiguar de inmediato cuando alguien dice "la arquitectura" sin contexto.
  - Cómo: pregunta si se refiere al campo de estudio, a la actividad de diseñar, o al artefacto/decisión resultante.
- **Definición operativa de arquitectura (Bass et al.)**: "la arquitectura de software de un sistema es el conjunto de estructuras necesarias para razonar sobre el sistema — comprende los elementos de software, las relaciones entre ellos y las propiedades de ambos". Solo lo *fundamental* cuenta; no toda estructura de código es arquitectura.
  - Cuándo usarlo: para decidir si una decisión de diseño merece tratarse como arquitectónica.
  - Cómo: pregunta si esa estructura es necesaria para razonar sobre el sistema *en su entorno* (mirando hacia afuera, como en arquitectura de edificios), no solo sobre su código interno.
- **Separación de preocupaciones (Dijkstra) aplicada a arquitectura**: cada parte interesada tiene preocupaciones distintas (costo, funcionalidad, seguridad, rendimiento...); estudiar cada aspecto de forma aislada, sabiendo que solo se atiende uno a la vez, es la única técnica eficaz para ordenar el pensamiento sobre sistemas complejos.
  - Cuándo usarlo: al documentar o diseñar, para no mezclar preocupaciones incompatibles en un solo artefacto.
  - Cómo: identifica las partes interesadas y sus preocupaciones antes de elegir vistas; una vista = un conjunto coherente de preocupaciones.
- **Vistas y puntos de vista (viewpoints)**: una vista representa uno o más aspectos de la arquitectura para abordar una o más preocupaciones; un punto de vista documenta las convenciones, notaciones y modelos que rigen la construcción de esa vista. Vistas comunes: módulo, componente-conector, lógica, escenarios/casos de uso, información, implementación.
  - Cuándo usarlo: siempre que el sistema sea suficientemente grande o el equipo suficientemente numeroso para necesitar una representación tangible y compartida.
  - Cómo: construye vistas por **enfoque sintético** (vistas independientes integradas por reglas de correspondencia/trazabilidad) o **enfoque proyectivo** (todas las vistas derivadas mecánicamente de un único supermodelo); el sintético gana expresividad, el proyectivo gana consistencia garantizada.
- **Modelo de vistas 4+1 (Kruchten)**: vista lógica, vista de desarrollo, vista de proceso y vista física, integradas mediante una quinta vista de escenarios/casos de uso.
  - Cuándo usarlo: como plantilla de partida cuando no existe ya un framework de vistas específico del dominio.
  - Cómo: describe funcionalidad (lógica), organización del código (desarrollo), concurrencia en tiempo de ejecución (proceso) y despliegue físico (física); valida las cuatro con escenarios concretos.
- **Modelo general de diseño arquitectónico (Hofmeister et al.)**: tres actividades iterativas — análisis, síntesis y evaluación — que se realizan simultáneamente con distinta granularidad.
  - Cuándo usarlo: como marco genérico subyacente a cualquier método arquitectónico concreto que use el equipo.
  - Cómo: (1) *análisis* — recopila y formula ASR (requisitos arquitectónicamente significativos) a partir de preocupaciones y contexto; (2) *síntesis* — genera soluciones candidatas a esos ASR y resuelve sus interacciones; (3) *evaluación* — valida si las soluciones elegidas satisfacen los ASR y decide si se requiere revisión; retroalimenta al análisis.
- **ATAM (Architecture Tradeoff Analysis Method)**: evalúa arquitecturas basándose en atributos de calidad organizados en un árbol de utilidad y escenarios concretos que los ilustran.
  - Cuándo usarlo: cuando hay atributos de calidad en competencia (p. ej. seguridad vs. costo) y se necesita exponer explícitamente los trade-offs antes de comprometerse.
  - Cómo: construye un árbol de utilidad con escenarios priorizados por importancia y dificultad; analiza cada decisión arquitectónica frente a esos escenarios para identificar puntos de sensibilidad y trade-off.
- **Revisiones activas (Parnas y Weiss)**: en lugar de listas de verificación pasivas, cada punto de evaluación exige que el revisor realice una actividad concreta para obtener la información necesaria.
  - Cuándo usarlo: cuando las listas de verificación tradicionales producen revisiones superficiales ("sí, cumple") sin verificación real.
  - Cómo: por cada aspecto a revisar, define una tarea específica que el revisor debe ejecutar (no solo marcar una casilla) para confirmar la propiedad.

## Conceptos clave
- **Requisito arquitectónicamente significativo (ASR)**: cualquier requisito del sistema que influye en su arquitectura; producto central del análisis de arquitectura.
- **Estilo arquitectónico**: forma particular de construcción que produce las características distintivas de un sistema, generalmente expresando su organización a gran escala (p. ej. capas, cliente-servidor, microservicios, MVC).
- **Patrón arquitectónico**: solución común a un problema recurrente *dentro* del contexto de un sistema; no necesita aplicarse a todo el sistema completo (a diferencia del estilo).
- **Arquitectura de referencia (RA)**: arquitectura que restringe o guía otras arquitecturas, capturando puntos en común para dominios, líneas de producto o familias de sistemas.
- **Lenguaje de descripción de arquitectura (ADL)**: lenguaje específico de dominio para expresar arquitecturas, a menudo con capacidades de análisis o generación de código más allá de la mera descripción (p. ej. UML usado como ADL).
- **Marco de arquitectura**: captura convenciones, principios y prácticas establecidas para describir arquitecturas dentro de un dominio o comunidad específicos (p. ej. AUTOSAR, UAF).
- **Deuda técnica arquitectónica**: consecuencias futuras, generalmente pagadas por otros, de decisiones arquitectónicas aplazadas o de baja calidad tomadas bajo presión de tiempo (p. ej. omitir modularidad en la primera versión).
- **Justificación arquitectónica (rationale)**: registro explícito del *por qué* de una decisión — supuestos, alternativas consideradas, criterios de selección y rechazo — para evitar repetir errores o permitir revisarlos cuando cambien las condiciones.
- **Problema de vistas múltiples**: riesgo de inconsistencia entre las distintas vistas de una misma arquitectura cuando se construyen de forma independiente (enfoque sintético).

## Modelos mentales
- Piensa en la arquitectura como "las decisiones que no se pueden confiar a los diseñadores" — el diseño trabaja sobre un conjunto ya establecido de requisitos, la arquitectura a menudo tiene que moldear esos requisitos negociando con las partes interesadas.
- Usa la Ley de Conway como lente diagnóstica: si una arquitectura parece extrañamente fragmentada o acoplada de forma rara, sospecha que refleja la estructura de comunicación de la organización que la construyó, no una necesidad técnica.
- Piensa en estilos, patrones y puntos de vista como "modismos en el lenguaje" que cada punto de vista establece — codifican prácticas recomendadas reutilizables, no reglas rígidas; no hay línea divisoria estricta entre estilo y patrón, solo escala de aplicación (todo el sistema vs. una parte).
- Trata "análisis de arquitectura" y "evaluación de arquitectura" como actividades distintas en el tiempo: el análisis ocurre continuamente durante la creación y mantenimiento; la evaluación normalmente la hacen terceros en hitos determinados.

## Antipatrones
- **Confundir estructura organizacional del código con arquitectura**: la definición de 1990 del IEEE (arquitectura = estructura organizativa) no distingue el diseño detallado de un módulo de su Makefile; ambos son estructura, pero ninguno es necesariamente fundamental para razonar sobre el sistema.
- **Esperar que la arquitectura "emerja" sola en cualquier dominio**: en sistemas de información centrados en usuario, codificar historias de usuario en ciclos rápidos puede producir una arquitectura razonable; en sistemas embebidos o ciberfísicos, propiedades arquitectónicas críticas pueden no estar articuladas en ninguna historia de usuario, y "dejar que emerja" deja huecos sin cubrir.
- **Evaluar una arquitectura de calidad aislada**: optimizar seguridad sin mirar costo de verificación, o facilidad de construcción sin mirar sostenibilidad futura, ignora que las preocupaciones interactúan — una arquitectura fácil de construir pero incapaz de incorporar nuevas tecnologías no es sostenible.
- **Listas de verificación pasivas en revisión de arquitectura**: permiten que un revisor marque "cumple" sin verificar realmente nada; Parnas y Weiss lo señalan como ineficaz frente a revisiones activas basadas en tareas concretas.
- **Tratar la deuda técnica arquitectónica como invisible**: aplazar decisiones (p. ej. modularidad) sin registrarla como deuda hace que el costo recaiga, sin previo aviso, en desarrolladores futuros que no la causaron.

## Tablas de referencia
| Tipo de vista/viewpoint | Qué expresa |
|---|---|
| Módulo | Implementación en términos de módulos y su organización |
| Componente y conector | Organización e interacciones en tiempo de ejecución |
| Lógica | Conceptos fundamentales del dominio y capacidades del software |
| Escenarios/casos de uso | Cómo interactúan los usuarios con el sistema |
| Información | Elementos de información clave: acceso y almacenamiento |
| Implementación (despliegue) | Cómo se configura y despliega el sistema para operar |

| Categoría de estilo/patrón | Ejemplos |
|---|---|
| Estructuras generales | Capas, llamada-retorno, tuberías y filtros, pizarra, servicios/microservicios |
| Sistemas distribuidos | Cliente-servidor, n-niveles, intermediario, pub-sub, P2P, REST |
| Impulsado por método | Orientado a objetos, orientado a eventos, flujo de datos |
| Interacción usuario-computadora | MVC, presentación-abstracción-control |
| Sistemas adaptativos | Micronúcleo, reflexión/metanivel |
| Máquinas virtuales | Intérpretes, basadas en reglas, control de procesos |

| Método de evaluación | Enfoque |
|---|---|
| ATAM | Árbol de utilidad + escenarios; trade-offs entre atributos de calidad |
| SAAM | Análisis de escenarios sobre la arquitectura |
| QAW (Quality Attribute Workshop) | Taller con partes interesadas para elicitar atributos de calidad temprano |
| Revisiones activas (Parnas & Weiss) | Tarea concreta por revisor en vez de checklist pasiva |

## Puntos clave
- Antes de diseñar, identifica explícitamente partes interesadas y preocupaciones (Figura 2.2 del capítulo lista decenas: seguridad, escalabilidad, sostenibilidad, energía, etc.) — no asumas que "arquitectura" significa solo estructura de código.
- Documenta siempre la justificación (rationale), no solo la decisión: alternativas rechazadas y por qué, para prevenir repetir errores o permitir revisarlos cuando cambien las condiciones.
- Elige vistas en función de audiencia y propósito, no por hábito; cada punto de vista es un lenguaje compartido para una preocupación específica.
- Usa ASR como el filtro que separa "esto es una decisión arquitectónica" de "esto es un detalle de diseño postergable".
- En evaluación, prioriza descripciones de arquitectura existentes y explícitas; si la documentación está incompleta u obsoleta (caso común), la evaluación debe apoyarse en el conocimiento de los participantes como fuente principal.

## Conecta con
- **Diseño de Software** (Capítulo 3): la arquitectura surgió del diseño de software y comparte con él estilos, patrones y notaciones; la línea divisoria es "decisiones que no se confían a los diseñadores" vs. detalle interno de componentes.
- **Requisitos de Software**: los ASR son requisitos que impactan la arquitectura; el análisis de arquitectura a menudo negocia y moldea requisitos, no solo los consume.
- **Calidad del Software**: las preocupaciones arquitectónicas se manifiestan como atributos de calidad ("-ilities"); ATAM y QAW dependen directamente de este vocabulario.
- **Modelos y Métodos de Ingeniería de Software**: UML y otros lenguajes de modelado se usan como ADLs; los casos de uso verifican integridad y consistencia de la arquitectura.
- **Proceso de Ingeniería de Software**: el diseño arquitectónico se integra como etapa (o actividad continua en ágil) dentro del proceso general del ciclo de vida.
