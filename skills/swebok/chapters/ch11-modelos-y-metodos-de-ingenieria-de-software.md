# Capítulo 11: Modelos y Métodos de Ingeniería de Software

## Idea central
Un modelo es una abstracción deliberada que representa solo lo necesario para responder preguntas concretas sobre el software y comunicar decisiones a las partes interesadas; el método es el procedimiento sistemático que usa esos modelos para llegar de la especificación al software construido.

## Marcos que introduce

- **Tres principios de modelado**: modelar lo esencial, proporcionar perspectiva (vistas), permitir comunicación efectiva.
  - Cuándo usarlo: al decidir qué incluir/excluir de cualquier modelo (diagrama, especificación) antes de construirlo.
  - Cómo: abstraer solo lo necesario para responder la pregunta que motivó el modelo; organizar la información en vistas (estructural, de comportamiento, temporal, organizacional) con la notación adecuada a cada una.

- **Cinco técnicas de análisis de modelos**: completitud, consistencia, corrección, trazabilidad, interacción.
  - Cuándo usarlo: tras construir cualquier modelo formal o semiformal, antes de basar decisiones de diseño/código en él.
  - Cómo: verificar completitud (todos los requisitos implementados/verificados) y consistencia (sin conflictos) con herramienta automatizada o inspección manual; verificar corrección sintáctica y semántica; mapear trazabilidad hacia requisitos/código/pruebas; simular interacciones dinámicas entre componentes.

- **Precondiciones, poscondiciones e invariantes** para especificar funciones/métodos.
  - Cuándo usarlo: al diseñar o documentar el contrato de una función o método, especialmente donde la corrección es crítica.
  - Cómo: declarar explícitamente qué debe cumplirse antes de ejecutar (precondición), qué se garantiza tras ejecutar correctamente (poscondición), y qué del entorno permanece invariable durante la ejecución.

- **Taxonomía de métodos de ingeniería de software**: heurísticos, formales, de prototipado, ágiles.
  - Cuándo usarlo: al elegir el método de desarrollo apropiado para una tarea concreta, no necesariamente para un proyecto entero.
  - Cómo: usar heurísticos (estructurados, de datos, orientado a objetos, orientado a aspectos, dirigido por modelos) para la mayoría del desarrollo; reservar formales para componentes críticos de seguridad; usar prototipado cuando los requisitos o la interfaz son las partes menos comprendidas; usar ágiles cuando se necesitan ciclos cortos con retroalimentación frecuente del cliente.

## Conceptos clave
- **Modelo**: abstracción/simplificación de un sistema compuesta por un conjunto de submodelos, cada uno describiendo un aspecto o vista seleccionada.
- **Sintaxis / semántica / pragmática**: reglas de construcción válida del lenguaje de modelado / significado asignado a entidades y relaciones / cómo ese significado se comunica eficazmente en contexto.
- **Modelo estructural vs. modelo de comportamiento**: el primero ilustra composición física/lógica (clases, componentes); el segundo define funciones mediante máquinas de estado, flujo de control o flujo de datos.
- **Métodos formales**: notación y lenguaje riguroso basado en matemáticas para especificar, desarrollar y verificar software con corrección demostrable.
- **Métodos formales ligeros**: equilibran rigor con usabilidad práctica reemplazando la demostración de teoremas por análisis automático no exhaustivo (p. ej., Alloy).
- **Prototipado**: construcción de versiones incompletas o mínimamente funcionales para explorar requisitos, diseño o interfaz antes de comprometerse con la versión final.
- **Desarrollo dirigido/basado en modelos (MDD/MBD)**: enfoque donde los modelos son artefactos principales del desarrollo, y la implementación se transforma (semi)automáticamente a partir de ellos.

## Modelos mentales
Piensa en cada modelo como una respuesta a una pregunta específica, no como una descripción completa del sistema: ningún modelo individual describe todo, por eso el "modelo completo" es una unión de submodelos.

Usa las vistas (estructural, de comportamiento) como lentes intercambiables sobre el mismo sistema, cada una con su propia notación y propósito — mezclar vistas sin declarar cuál se está usando genera ambigüedad.

Trata la semántica importada (de otra librería o modelo) con sospecha: la misma sintaxis puede significar algo distinto en un nuevo contexto de modelado.

Elige el método de ingeniería según cuál es la parte más incierta del problema: si son los requisitos, prototipa; si es la corrección crítica, usa métodos formales; si es la adaptación a cambio constante, usa ágil.

## Antipatrones
- **Confundir un modelo completo con una abstracción total del sistema**: da la falsa ilusión de comprensión plena tras estudiar un solo diagrama.
- **Reutilizar un submodelo o componente de otra librería sin examinar sus suposiciones semánticas**: el conflicto de contexto puede no ser evidente y produce errores sutiles.
- **Tratar Agile como un método único con prácticas fijas**: en realidad es un conjunto de valores/principios que admite múltiples métodos concretos (XP, Scrum, FDD, Lean) con prácticas distintas.
- **Dejar que el prototipo se convierta en el producto final sin refactorización ni revisión**: el prototipo se construye deliberadamente descartable o exploratorio, no para producción directa.

## Tablas de referencia

| Tipo de modelo | Ejemplos de diagrama UML | Propósito |
|---|---|---|
| Estructural | Clases, componentes, objetos, implementación, empaquetado | Composición física/lógica |
| Comportamiento | Casos de uso, actividad, máquina de estados, interacción | Funciones y dinámica |

| Método heurístico | Perspectiva principal |
|---|---|
| Análisis/diseño estructurado | Funcional/comportamiento, refinamiento top-down |
| Modelado de datos | Datos/información, tablas y relaciones |
| Orientado a objetos | Objetos que encapsulan datos y método |
| Orientado a aspectos | Separación de preocupaciones transversales |
| Dirigido por modelos (MDD/MBD) | Modelos como artefacto principal, transformación (semi)automática |

| Método ágil | Rasgo distintivo |
|---|---|
| XP | Pruebas primero, programación en parejas, refactorización continua |
| Scrum | Sprints ≤30 días, backlog priorizado, Scrum Master |
| FDD | 5 fases, propiedad de código individual, enfoque arquitectónico |
| Lean | MVP, optimización del flujo de valor completo |
| RAD | Herramientas de BD para desarrollo empresarial rápido |

## Puntos clave
- Antes de construir un modelo, decide explícitamente qué pregunta debe responder — eso determina qué abstraer y qué vista usar.
- Verifica completitud, consistencia, corrección y trazabilidad de todo modelo formal antes de basar código o decisiones de diseño en él.
- Documenta precondiciones/poscondiciones/invariantes de funciones críticas para permitir razonar sobre corrección sin ejecutar el código.
- Elige el método (heurístico/formal/prototipado/ágil) según cuál es la mayor fuente de incertidumbre del problema, no por costumbre organizacional.
- Al importar un modelo o componente de otra fuente, revisa sus suposiciones semánticas antes de confiar en su comportamiento en el nuevo contexto.

## Conecta con
- **Diseño de Software**: los modelos estructurales y de comportamiento son el vocabulario compartido entre modelado y diseño detallado.
- **Requisitos de Software**: prototipado y requisitos dirigidos por modelos alimentan directamente la obtención y validación de requisitos.
- **Proceso de Ingeniería de Software**: los métodos ágiles/heurísticos/formales se seleccionan dentro del ciclo de vida definido en esa área.
- **Pruebas de Software**: el análisis de modelos (trazabilidad, interacción) y los casos de prueba generados desde modelos conectan directamente con las técnicas de esa área.
