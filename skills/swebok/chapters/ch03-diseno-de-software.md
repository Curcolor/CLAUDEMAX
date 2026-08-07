# Capítulo 3: Diseño de software

## Idea central
El diseño de software transforma el planteamiento de un problema (requisitos) en una solución implementable a través de tres etapas anidadas —arquitectónica, de alto nivel y detallada— cada una mirando más hacia adentro que la anterior, y el resultado solo es útil si se registra con su justificación (por qué se decidió, no solo qué se decidió).

## Marcos que introduce
- **Pensamiento de diseño en 5 pasos (Ross, Goodenough, Irvine)**: (1) cristalizar un propósito u objetivo; (2) formular un concepto de cómo lograrlo; (3) idear un mecanismo que implemente esa estructura conceptual; (4) introducir una notación para expresar las capacidades del mecanismo; (5) describir el uso de la notación en un contexto de problema específico.
  - Cuándo usarlo: como patrón recurrente en diseño de alto nivel, diseño detallado y arquitectura por igual — no es exclusivo de ninguna etapa.
  - Cómo: reconoce que gran parte del trabajo es crear vocabulario (para el problema y para la solución) antes de poder "invocar" el mecanismo que resuelve el problema.
- **Las tres etapas del diseño (mirada arquitectónica / hacia afuera / hacia adentro)**: diseño arquitectónico (fundamentos del sistema en su entorno), diseño de alto nivel (estructura y organización de componentes, mirando hacia afuera — cómo interactúan sistema y componentes con el entorno) y diseño detallado (estructura interna de cada módulo, mirando hacia adentro — algoritmos, acceso y representación de datos).
  - Cuándo usarlo: para ubicar en qué nivel de abstracción corresponde tomar una decisión concreta (p. ej., elegir un algoritmo de ordenamiento suele quedar en diseño detallado, salvo que sea arquitectónicamente significativo).
  - Cómo: cada etapa crea una obligación para la siguiente; el diseño de alto nivel debe ser suficientemente detallado para que un consumidor externo use el componente sin leer su código; el diseño detallado debe ser suficiente para codificar directamente.
- **Principios de diseño de software**: abstracción, separación de preocupaciones (SoC), modularización, encapsulación (ocultación de información), separación interfaz/implementación, acoplamiento (bajo), cohesión (alta), uniformidad, completitud (integridad), verificabilidad.
  - Cuándo usarlo: como criterios de evaluación aplicables a cualquiera de las tres etapas de diseño, no solo a la detallada.
  - Cómo: para cada decisión de diseño, verifica que reduce acoplamiento, aumenta cohesión, oculta lo no esencial detrás de una interfaz, y que la interfaz pública queda separada de los detalles de implementación.
- **Justificación del diseño (design rationale)**: captura *por qué* se tomó una decisión de diseño — supuestos previos, alternativas consideradas, criterios de selección y rechazo.
  - Cuándo usarlo: en toda decisión de diseño importante, especialmente en proyectos FOSS o con equipos grandes/distribuidos de alta rotación.
  - Cómo: documenta no solo la decisión final sino también las alternativas rechazadas y el motivo, para permitir revisarlas si cambian los supuestos, requisitos o restricciones.
- **Modelo estructura/comportamiento para notaciones de diseño**: toda notación de diseño se clasifica como orientada a describir aspectos estructurales (vista estática: componentes e interconexiones) o de comportamiento (dinámica: interacciones, flujo, estados).
  - Cuándo usarlo: al elegir qué diagrama usar para comunicar una decisión de diseño a una audiencia específica.
  - Cómo: estructural → diagramas de clases/objetos, componentes, CRC, despliegue; comportamiento → diagramas de actividad, de interacción (secuencia/comunicación), DFD, tablas de decisión, diagramas de estados, lenguajes formales, pseudocódigo/PDL.
- **Diseño basado en modelos (MBD)**: sustituye artefactos basados en documentos (ambiguos, con información dispersa) por modelos que herramientas pueden animar, simular, analizar y mantener trazables de forma interactiva.
  - Cuándo usarlo: cuando la ambigüedad e incompletitud del lenguaje natural en documentos ya es un problema recurrente del equipo.
  - Cómo: usa herramientas que permitan simulación/animación, análisis de escenarios hipotéticos, prototipado rápido y trazabilidad automatizada sobre el modelo, no sobre prosa.

## Conceptos clave
- **Descripción del diseño de software (SDD)**: representación del software (plano/modelo) creada para facilitar análisis, planificación, implementación y toma de decisiones; documenta el resultado del diseño.
- **Preocupación de diseño (design concern)**: área de interés respecto al diseño de software relevante para una o más partes interesadas; las cualidades de diseño son un subconjunto importante de las preocupaciones.
- **Aspecto (aspect)**: propiedad que afecta el rendimiento o la semántica de los componentes de forma sistémica, sin ser una unidad de descomposición funcional del dominio (base del diseño orientado a aspectos).
- **Variabilidad**: capacidad de crear variantes de un sistema para distintos segmentos de mercado o contextos de uso; central en líneas de producto y ecosistemas de software.
- **Componente de software**: unidad independiente con interfaces y dependencias bien definidas, componible e implementable de forma independiente (base del diseño basado en componentes, CBD).
- **Especificación de trabajo vs. producto de diseño final**: las especificaciones "de trabajo" las produce el equipo de diseño *para sí mismo*; los productos finales se producen para partes interesadas conocidas o para una audiencia futura desconocida — distinción que determina el nivel de formalidad necesario.
- **Lenguaje específico de dominio (DSL)**: lenguaje que codifica conceptos de un dominio de aplicación para que la representación del diseño sea directamente ejecutable o animable, difuminando la frontera entre modelado, diseño y programación.

## Modelos mentales
- Piensa en el diseño como una actividad esencialmente lingüística: buena parte del trabajo es crear el vocabulario adecuado para expresar el problema, expresar la solución, e implementarla — no solo "producir un diagrama".
- Usa la distinción "mirando hacia afuera" (alto nivel) vs. "mirando hacia adentro" (detallado) para saber si una preocupación pertenece a la interfaz de un componente o a su implementación interna.
- Trata SOLID (Responsabilidad Única, Abierto-Cerrado, Sustitución de Liskov, Segregación de Interfaces, Inversión de Dependencias) y SOFA (Short, One thing, Few arguments, Abstraction-level consistency) como mnemónicos operativos que instancian los principios generales de diseño (bajo acoplamiento, alta cohesión) a nivel de clases y métodos respectivamente.
- Distingue verificación ("¿el diseño satisface los requisitos?"), validación ("¿el diseño permitirá cumplir las expectativas de las partes interesadas?") y certificación ("¿un tercero atestigua la conformidad?") como tres preguntas distintas sobre la calidad del diseño, no sinónimos intercambiables.

## Antipatrones
- **Elegir un algoritmo crítico demasiado tarde**: si la existencia de un algoritmo adecuado es arquitectónicamente significativa, dejarlo "a discreción del programador" en construcción puede hacer inviable cumplir los requisitos — debe decidirse en etapas tempranas del ciclo de vida.
- **Documentos de diseño ambiguos por lenguaje natural informal**: incluso con formato bien definido, la información relevante dispersa en prosa dificulta la comprensión y el análisis — es la motivación central para migrar a MBD.
- **No registrar la justificación de decisiones rechazadas**: aunque el motivo de una decisión sea obvio para el equipo actual, se vuelve opaco para quien mantiene el sistema después de la implementación original; sin ese registro se corre el riesgo de repetir una decisión ya descartada por buenas razones olvidadas.
- **Confundir revisión de diseño con auditoría de diseño**: una revisión es un examen exhaustivo (estado, cobertura de requisitos, cuestiones pendientes); una auditoría se centra en una lista de características específica (p. ej. auditoría funcional) — usar la técnica equivocada deja huecos sin cubrir.
- **Tratar el diseño ágil implícito como suficiente para toda parte interesada**: que la evolución del diseño quede solo en la mente de los desarrolladores y se exprese únicamente como código favorece la agilidad, pero deja sin información explícita a quienes gestionan requisitos, certificación, pruebas o control de calidad.

## Tablas de referencia
| Etapa de diseño | Enfoque | Pregunta que responde |
|---|---|---|
| Arquitectónico | Fundamentos del sistema en su entorno | ¿Cuáles son los elementos computacionales principales y sus protocolos? |
| Alto nivel | Mirando hacia afuera | ¿Cómo interactúan componentes y sistema con el entorno (usuarios, dispositivos, otros sistemas)? |
| Detallado | Mirando hacia adentro | ¿Cuál es la estructura interna de cada módulo (algoritmos, datos)? |

| Categoría de patrón de diseño (GoF) | Ejemplos |
|---|---|
| Creacionales | Constructor, fábrica, prototipo, singleton |
| Estructurales | Adaptador, puente, compuesto, decorador, fachada, peso mosca, proxy |
| De comportamiento | Cadena de responsabilidad, iterador, mediador, memento, observador, estado, estrategia, plantilla, visitante |

| Estrategia/método de diseño | Idea organizadora |
|---|---|
| Orientado a funciones (estructurado) | Descomposición descendente de funciones principales |
| Centrado en datos | Estructuras de datos entrada/salida primero, luego las transformaciones |
| Orientado a objetos | Sustantivo→objeto, verbo→método, adjetivo→atributo; herencia/polimorfismo |
| Basado en componentes (CBD) | Unidades independientes con interfaces bien definidas y modelo de componentes común |
| Basado en eventos | Invocación indirecta; pub/sub desacopla productores y consumidores |
| Orientado a aspectos (AOD) | Aspectos para preocupaciones transversales |
| Basado en restricciones | Restricciones reducen el espacio de diseño explorable |
| Impulsado por el dominio | Lenguaje compartido con analistas para expresar objetos/roles/eventos del dominio |

## Puntos clave
- Aplica los principios de diseño (abstracción, SoC, modularización, encapsulación, bajo acoplamiento, alta cohesión) en las tres etapas por igual; no son exclusivos del diseño detallado.
- Registra siempre la justificación (rationale) de decisiones importantes, incluidas las alternativas rechazadas — es la inversión más barata en mantenibilidad a largo plazo.
- Elige la notación (estructural vs. comportamiento) en función de la audiencia y el propósito, no por costumbre del equipo.
- Distingue verificación, validación y certificación como tres actividades de evaluación distintas con preguntas distintas.
- Antes de comprometerte con un método de diseño (OO, basado en eventos, basado en componentes...), confirma que su "tema organizador" encaja con la naturaleza del problema, no solo con la familiaridad del equipo.

## Conecta con
- **Arquitectura de Software**: el diseño arquitectónico es una etapa compartida entre ambos KA; la arquitectura restringe el diseño de alto nivel al fijar componentes principales, interfaces y estilos.
- **Requisitos de Software**: los requisitos establecen el conjunto de problemas que el diseño debe resolver; la completitud del diseño se mide, en parte, contra ellos.
- **Construcción de Software**: el diseño detallado debe ser suficiente para que un programador codifique cada módulo sin ambigüedad.
- **Pruebas de Software y Calidad del Software**: el diseño provee la base para estrategias de prueba, casos de prueba y revisiones/auditorías de calidad.
- **Modelos y Métodos de Ingeniería de Software**: UML y los métodos formales son la base notacional compartida para MBD, DSLs y descripciones estructurales/de comportamiento.
