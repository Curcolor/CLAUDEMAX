---
name: architecture-principles
description: "Skill unificada de arquitectura de software: principios SOLID (SRP, OCP, LSP, ISP, DIP), patrones de diseño GoF (creacionales/estructurales/de comportamiento) y arquitecturas de sistema (por capas, hexagonal, clean, onion, MVC/MVVM, microservicios, monolito, event-driven, CQRS, serverless). Trigger con \"SOLID\", \"design pattern\", \"patrón de diseño\", \"factory\", \"strategy\", \"observer\", \"architecture\", \"arquitectura\", \"structure the project\", \"estructurar el proyecto\", \"hexagonal\", \"microservices\", \"microservicios\", \"refactor for cleaner design\", \"refactorizar para un diseño más limpio\", o al diseñar/revisar/refactorizar componentes y sistemas."
---

# Architecture Principles (Principios de Arquitectura)

Fusión de las antiguas skills `solid`, `design-patterns` y `architecture-patterns`. Tres niveles de altitud de una misma disciplina: principios (SOLID) → patrones de componente (GoF) → arquitecturas de sistema.

## Parte 1 — Principios SOLID

Cinco principios de diseño orientado a objetos. Úsalos como una *lente*, no como un checklist — cada principio tiene un costo (más archivos, más indirección) y el trade-off solo vale la pena cuando el eje de cambio relevante realmente existe en este codebase.

### Cuándo invocar esta skill

- El usuario menciona SOLID, SRP, OCP, LSP, ISP o DIP por nombre.
- El usuario pide una revisión de código enfocada en el diseño, no solo en bugs.
- El usuario pide refactorizar una clase que "hace demasiado" o "es difícil de testear".
- Estás a punto de diseñar una nueva jerarquía de clases o un límite de módulo.

### Los cinco principios, con una prueba de olfato para cada uno

#### S — Single Responsibility Principle (Principio de Responsabilidad Única)

> Una clase debe tener una sola razón para cambiar.

**Prueba de olfato:** ¿Puedes describir lo que hace la clase sin decir "y"? ¿Hay dos stakeholders distintos que pedirían cambios a métodos diferentes?

**Señales de alerta:** una clase con `Order.calculateTotal()` *y* `Order.sendConfirmationEmail()`. La lógica de cálculo cambia por razones financieras; la lógica de email cambia por razones de marketing. Dos razones → hay que separar.

**Costo de sobreaplicarlo:** 47 microclases para un solo flujo de trabajo. SRP trata sobre *razones para cambiar*, no sobre *número de métodos*.

#### O — Open/Closed Principle (Principio Abierto/Cerrado)

> Abierto para extensión, cerrado para modificación.

**Prueba de olfato:** cuando agregas una nueva variante (nuevo proveedor de pago, nuevo formato de exportación), ¿editas una cadena `switch`/`if` existente, o agregas un archivo nuevo que el código existente descubre vía un registro/strategy?

**Aplícalo cuando:** llegan nuevas variantes con frecuencia y las variantes existentes deben seguir funcionando sin tocarlas.
**Sáltatelo cuando:** has agregado una sola variante en dos años. YAGNI le gana a OCP en ejes estables.

#### L — Liskov Substitution Principle (Principio de Sustitución de Liskov)

> Los subtipos deben poder usarse en cualquier lugar donde se espera el tipo base, sin sorprender al que llama.

**Prueba de olfato:** ¿la subclase lanza `NotSupportedException` en algún método heredado? ¿Endurece las precondiciones (por ejemplo, la base acepta `int`, la subclase exige un entero positivo)? ¿Debilita las postcondiciones? Esas son violaciones de LSP.

**Violación clásica:** `Square extends Rectangle`. Establecer `width` de forma independiente de `height` rompe el invariante de la subclase.

**Patrón de solución:** preferir composición (`Rectangle` *contiene* un value object `Sides`) sobre `extends` cuando la relación "es-un" no sobrevive a todos los métodos.

#### I — Interface Segregation Principle (Principio de Segregación de Interfaces)

> Los clientes no deberían depender de métodos que no usan.

**Prueba de olfato:** ¿un consumidor recibe una interfaz gorda pero solo llama a 2 de sus 14 métodos? Divide la interfaz para que el consumidor dependa solo de lo que usa — eso minimiza las recompilaciones y hace que los test doubles sean pequeños.

**Trade-off:** más interfaces. Vale la pena cuando la interfaz gorda obliga a consumidores no relacionados a compartir un mismo destino.

#### D — Dependency Inversion Principle (Principio de Inversión de Dependencias)

> Depende de abstracciones, no de concreciones. La política de alto nivel no debería importar el mecanismo de bajo nivel.

**Prueba de olfato:** ¿tu capa de dominio hace `import psycopg2`? Tu lógica de negocio no debería saber con qué base de datos habla. Inyecta una interfaz `UserRepository`; el `PostgresUserRepository` concreto vive en el borde del sistema.

**Aplícalo cuando:** necesitas intercambiar implementaciones (test doubles, backends alternativos) o estás trazando un límite hexagonal/clean-architecture.
**Sáltatelo cuando:** es un script. DIP para un CLI de 100 líneas es puro teatro.

### Cómo aplicar esto en una revisión

1. Lee el cambio. Identifica cada clase/módulo que fue tocado.
2. Para cada uno, pregunta: *¿qué principio es más relevante aquí?* — normalmente exactamente uno.
3. Enuncia la violación de forma concreta: nombra el principio, nombra el síntoma, nombra el costo.
4. Propón el refactor mínimo que la resuelve. No mezcles los cinco principios en una sola sugerencia.
5. Si aplicar un principio crearía más indirección de la que ahorra, dilo en voz alta y sáltatelo.

### Anti-patrones a señalar

- **"SRP" usado para justificar dividir cada método en su propia clase.** SRP trata sobre *ejes de cambio*, no sobre cantidad de métodos.
- **"DIP" usado para envolver cada clase concreta en una interfaz "por si acaso".** No agregues abstracciones hasta que exista o sea inminente una segunda implementación.
- **"OCP" usado para exigir una arquitectura de plugins para una feature puntual.** El OCP prematuro cuesta complejidad real por flexibilidad futura hipotética.

### Formato de salida

Cuando encuentres un problema de SOLID, escríbelo así:

> **[Principio]** — *síntoma en una línea*
> Costo: *qué se rompe hoy o se romperá pronto*
> Fix: *el cambio más pequeño que lo resuelve*

Ejemplo:

> **SRP** — `UserService` maneja hashing de contraseñas, envío de emails y logging de auditoría.
> Costo: cambiar el formato del log de auditoría obliga a reconstruir cada consumidor de `UserService`.
> Fix: extraer `AuditLogger`; inyectarlo.

### Ver también

- Design patterns (Parte 2, arriba) — muchos patrones de diseño son aplicaciones concretas de SOLID.
- System architectures (Parte 3, abajo) — hexagonal, clean y onion formalizan DIP a nivel de límite/boundary.

## Parte 2 — Design patterns (patrones de diseño)

Un vocabulario para soluciones a problemas de diseño recurrentes. Usa el nombre solo cuando el patrón realmente aplica — ponerle "Factory" a una función que llama a `new` es jerga, no ingeniería.

### Cuándo invocar esta skill

- El usuario pregunta "¿qué patrón encaja aquí?" o nombra un patrón.
- Estás proponiendo un refactor y quieres una etiqueta concisa que ambas partes entiendan.
- Estás revisando código que *podría* limpiarse con un patrón conocido.

### Los 23 patrones GoF, agrupados, con un disparador de una línea

#### Creacionales — cómo llegan a existir los objetos

| Patrón | Úsalo cuando |
|---|---|
| **Factory Method** | Una clase necesita crear objetos de una familia relacionada, pero la clase concreta exacta depende de la subclase / de la entrada en tiempo de ejecución. |
| **Abstract Factory** | Necesitas crear *familias* de productos relacionados (p. ej. widgets de UI para macOS vs. Windows) y quieres garantizar consistencia. |
| **Builder** | Un objeto tiene muchos parámetros de construcción opcionales; los constructores se están volviendo telescópicos. Una API fluida ayuda a la legibilidad. |
| **Prototype** | Clonar un objeto ya configurado es más barato o más claro que construir uno nuevo desde cero. |
| **Singleton** | Se necesita genuinamente una sola instancia a nivel de sistema (logger, config). **Advertencia:** los singletons suelen ser globals disfrazados — prefiere inyectar una única instancia vía el contenedor de DI. |

#### Estructurales — cómo se componen los objetos

| Patrón | Úsalo cuando |
|---|---|
| **Adapter** | Dos interfaces no coinciden; no puedes cambiar ninguna de las dos. Envuelve una con la forma de la otra. |
| **Bridge** | Dos ejes ortogonales de variación se están multiplicando en una explosión de clases. Sepáralos en jerarquías separadas unidas por composición. |
| **Composite** | Quieres que el código cliente trate hojas individuales y árboles completos de manera uniforme (filesystem, nodos de UI, nodos de AST). |
| **Decorator** | Quieres agregar comportamiento a instancias específicas en tiempo de ejecución sin subclasificar cada combinación (`BufferedInputStream(FileInputStream(...))`). |
| **Facade** | Un subsistema tiene muchas clases pequeñas; los clientes necesitan un punto de entrada simple que oculte el detalle interno. |
| **Flyweight** | Muchos objetos de grano fino comparten la mayor parte de su estado; extrae la parte compartida para ahorrar memoria. |
| **Proxy** | Necesitas un objeto que *actúe como* el real pero agregue control de acceso, carga perezosa, remoting o caché. |

#### De comportamiento — cómo colaboran los objetos

| Patrón | Úsalo cuando |
|---|---|
| **Chain of Responsibility** | Una solicitud debería ser intentada por una secuencia de handlers, cada uno decidiendo manejarla o pasarla (pipelines de middleware). |
| **Command** | Necesitas parametrizar, encolar, registrar o deshacer operaciones — envuelve cada acción como un objeto. |
| **Iterator** | Provee acceso secuencial sin exponer la colección subyacente. (La mayoría de los lenguajes ya lo traen incorporado.) |
| **Mediator** | Muchos objetos se están comunicando entre sí de forma enredada; introduce un hub que sea dueño del protocolo. |
| **Memento** | Necesitas undo/restore sin exponer los internals del objeto (value object de snapshot). |
| **Observer** | Un sujeto; muchos dependientes necesitan reaccionar cuando cambia. Advertencia: ciclos y tormentas de actualización — considera event buses o streams reactivos en su lugar. |
| **State** | El comportamiento de un objeto depende de su modo, y la lógica de cambio de modo es un `switch` gigante. Cada estado se vuelve una clase. |
| **Strategy** | Una familia de algoritmos es intercambiable; quien llama elige uno en tiempo de ejecución (orden de sort, método de pago, política de retry). |
| **Template Method** | Esboza un algoritmo en una clase base; las subclases completan pasos específicos. Riesgo: herencia rígida — prefiere Strategy si las subclases no comparten mucho. |
| **Visitor** | Se necesitan agregar operaciones a través de una jerarquía de tipos estable sin modificar los tipos. Doble despacho. |
| **Interpreter** | Estás construyendo un DSL pequeño o un evaluador de expresiones; cada regla de gramática se vuelve una clase. |

### Patrones modernos / no-GoF que vale la pena conocer

- **Repository** — abstrae la persistencia detrás de una interfaz tipo colección. Se combina con DIP (Parte 1, arriba).
- **Unit of Work** — coordina una transacción lógica a través de múltiples repositories.
- **CQRS** — separa los modelos de lectura y escritura en sistemas donde sus preocupaciones divergen lo suficiente como para justificar el costo.
- **Result / Either** — el valor de retorno lleva éxito o fallo; alternativa a las excepciones para rutas de error esperadas.
- **Pipeline / Middleware** — composición de handlers que llaman a `next` (middleware HTTP, cadenas de validación).
- **Specification** — encapsula reglas de negocio como predicados componibles (`new InGoodStanding().and(new HasOpenOrders())`).

### Cómo recomendar un patrón

1. Enuncia el *problema* en una oración.
2. Nombra el patrón.
3. Esboza la estructura mínima viable — usualmente 2-4 tipos y sus relaciones.
4. Menciona qué cuesta el patrón (indirección extra, navegación más difícil, curva de aprendizaje para el equipo).
5. Si existe una alternativa más simple (una función, un closure, un mapa de config), dilo y deja que el usuario elija.

### Anti-patrones a evitar

- **Pattern-itis** — aplicar patrones porque son "buena práctica" en vez de porque el problema los pide.
- **Singleton everywhere** — la mayoría de los "singletons" son estado global disfrazado; prefiere una única instancia gestionada por tu contenedor de DI.
- **Clases Manager / Helper / Util** — son clases bolsa-de-funciones sin una responsabilidad única; usualmente una señal de que te saltaste nombrar la abstracción real.
- **Patrón por nombre** — "conviértelo en un Strategy" no es una discusión de diseño hasta que hayas dicho *qué está variando*.

### Ver también

- SOLID principles (Parte 1, arriba) — la mayoría de los patrones GoF son aplicaciones concretas de SRP, OCP o DIP.
- System architectures (Parte 3, abajo) — patrones estructurales a gran escala (hexagonal, layered, microservices).

## Parte 3 — Arquitecturas de sistema

Patrones por encima del nivel de clase — cómo se organiza un sistema completo. Elige uno según las *fuerzas* del proyecto (tamaño del equipo, cadencia de despliegue, aislamiento de fallos, frecuencia de cambio). No elijas por moda. La mayoría de los fallos aquí son elegir distribuido cuando un monolito bastaría, u hexagonal cuando un script de 200 líneas bastaría.

### Cuándo invocar esta skill

- El usuario pide organizar un proyecto nuevo o reestructurar uno existente.
- El usuario menciona el nombre de una arquitectura y quiere una comparación o recomendación.
- Estás proponiendo un refactor no trivial que cruza límites de módulos.

### Guía rápida de elección por fuerza

| Fuerza en el proyecto | Buen fit |
|---|---|
| Equipo pequeño, un solo deploy, una sola DB | **Monolito modular** |
| La lógica de dominio domina; múltiples canales de entrega (web + CLI + queue) | **Hexagonal / Clean / Onion** |
| Cadencia de despliegue independiente por área, equipos separados, necesidades de escala separadas | **Microservicios** |
| Carga de lectura ≫ carga de escritura y el modelo de lectura difiere del de escritura | **CQRS** (a menudo con event sourcing) |
| El estado *es* la historia (auditoría, finanzas, regulatorio) | **Event sourcing** |
| Acoplamiento laxo entre bounded contexts; async está bien | **Event-driven** |
| Carga muy variable, con picos; pago por request | **Serverless** |
| App de UI con separación clara de vista/estado/lógica | **MVC / MVP / MVVM** |

### Los patrones, con el trade-off que muerde

#### Layered (por capas / n-tier)

Presentación → aplicación → dominio → infraestructura. Cada capa depende solo de la que está debajo.

**A favor:** familiar para todos; fácil de aprender.
**En contra:** la capa de "dominio" casi siempre termina dependiendo del ORM, anulando la separación por capas. Layered sin inversión de dependencias es solo carpetas.

#### Hexagonal (a.k.a. Ports and Adapters / Puertos y Adaptadores)

El dominio en el centro expone **puertos** (interfaces). La tecnología externa (DB, HTTP, queue, CLI) implementa **adaptadores** detrás de esos puertos. El código de dominio no tiene ningún `import` de frameworks.

**A favor:** puedes intercambiar canales de entrega y almacenamiento sin tocar la lógica de negocio. Los tests unitarios corren con adaptadores en memoria.
**En contra:** más archivos, más ceremonia. Incorrecto para un script o una app CRUD pequeña. Correcto para sistemas donde las reglas de dominio viven durante años y la tecnología no.

#### Clean / Onion

La misma idea que hexagonal, con una disciplina de anillos más estricta (entities → use cases → interface adapters → frameworks). Es el enfoque de Robert C. Martin; la sustancia es hexagonal.

**A favor:** regla de dependencia clara (las dependencias apuntan hacia adentro, nunca hacia afuera).
**En contra:** si se sigue religiosamente, terminas escribiendo cuatro clases para hacer una sola cosa. Úsalo cuando la complejidad justifique la estructura.

#### MVC / MVP / MVVM

Patrones de UI. La View renderiza; el Model guarda el estado; el Controller / Presenter / ViewModel media.

- **MVC** — el controller toma la entrada, actualiza el model, elige la view. Frameworks web del lado del servidor.
- **MVP** — el presenter guarda el estado de presentación, la view es tonta. Más fácil de testear que MVC porque el estado de la view vive en el presenter.
- **MVVM** — el viewmodel expone estado observable; la view se enlaza (bind) a él. Patrón nativo para UIs con data-binding (WPF, SwiftUI, Vue, Knockout).

En contra: los tres se pudren hacia "fat controller" / "fat viewmodel" si no empujas la lógica real hacia abajo, al dominio.

#### Monolito modular

Un solo deployable, con módulos internos con límites explícitos (un módulo = una carpeta + una interfaz pública + internals privados). Los módulos pueden convertirse en servicios más adelante si se ven forzados a ello.

**A favor:** operación simple; llamadas in-process; los refactors se quedan locales; solo pagas el impuesto de sistema distribuido cuando lo necesitas.
**En contra:** los "módulos" se pudren hacia spaghetti sin límites forzados. Usa una herramienta en build-time (architecture tests, reglas de eslint por capas, jdepend) para mantener los imports honestos.

#### Microservicios

Muchos servicios desplegables de forma independiente, cada uno dueño de sus datos. Se comunican vía HTTP o eventos. Cada servicio es lo bastante pequeño como para que un equipo lo tenga completo en la cabeza.

**A favor:** deploys independientes, aislamiento de fallos, stacks poliglota, escala por servicio.
**En contra:** las transacciones distribuidas son *difíciles*. La red no es confiable. La factura de observability es real. Depurar abarca 12 servicios. No empieces aquí a menos que el tamaño del equipo y la complejidad del producto lo exijan; **empieza con un monolito modular y extrae servicios cuando aparezcan las costuras (seams).**

#### Event-driven architecture (arquitectura orientada a eventos)

Los componentes publican eventos; otros se suscriben. Acoplamiento laxo; consistencia eventual.

**A favor:** escalado, aislamiento, rastro de auditoría, suscriptores nuevos que se enlazan tarde (late-binding).
**En contra:** ordenamiento, entrega exactly-once, evolución de esquemas, depurar "¿a dónde fue ese evento?". Necesitas un event bus y tooling de observability. No le esparzas eventos a una app CRUD por diversión.

#### CQRS (Command Query Responsibility Segregation)

El modelo de escritura maneja los comandos; modelo(s) de lectura separados sirven las queries. A menudo combinado con event sourcing.

**A favor:** el modelo de lectura está moldeado para las queries (desnormalizado, proyectado); el modelo de escritura hace cumplir los invariantes.
**En contra:** dos modelos que mantener sincronizados; la consistencia eventual se les nota a los usuarios; sobrecarga cognitiva. Vale la pena cuando las cargas o formas de lectura/escritura divergen dramáticamente.

#### Event sourcing

Persiste una secuencia de eventos inmutables. El estado actual es un fold sobre los eventos.

**A favor:** auditoría perfecta, viaje en el tiempo (time-travel), reconstrucción de proyecciones.
**En contra:** evolución del esquema de los eventos (los eventos son inmutables pero su forma cambia); rendimiento del replay; cambio de modelo mental. Esfuerzo pesado; solo vale la pena cuando la historia *es* el producto (banca, salud, regulatorio).

#### Serverless

Funciones disparadas por eventos (HTTP, queue, schedule). Sin servidores de larga duración; el proveedor maneja la escala.

**A favor:** pago por request; auto-escalado; operación mínima.
**En contra:** cold starts, vendor lock-in, límites de tamaño de función, depurar a través de funciones, problemas de sistema distribuido a una granularidad más fina. Excelente para cargas con picos y código de "pegamento" (glue code); riesgoso para presupuestos de latencia ajustados.

### La decisión "aburrida" suele ser la correcta

Ante la duda:

- Empieza con un **monolito modular** usando límites **hexagonales**.
- Una base de datos. Un deploy. Un servicio.
- Empuja los efectos secundarios (DB, HTTP, queue) detrás de puertos.
- Aplica los principios SOLID (Parte 1, arriba) dentro de los módulos; aplica patrones de diseño (Parte 2, arriba) dentro de las clases.
- Extrae un servicio solo cuando una fuerza real (deploy independiente, aislamiento, escala) lo exija, no porque los microservicios sean el tema de moda en la charla de la conferencia.

### Cómo recomendar una arquitectura

1. Enuncia las *fuerzas* (tamaño del equipo, cadencia de despliegue, aislamiento de fallos, eje de escala).
2. Nombra el patrón que encaja con *esas* fuerzas.
3. Enuncia qué cuesta (operacional, cognitivo, de infraestructura).
4. Si el costo supera la fuerza, recomienda la opción más simple y di qué te haría reconsiderar.

### Anti-patrones a evitar

- **Microservicios para un equipo de 3 personas** — monolito distribuido en modo difícil.
- **Hexagonal para un script de 200 líneas** — sobreingeniería.
- **MVC donde el model es una fila de base de datos** — eso es solo CRUD; llámalo así.
- **Event-driven porque "los eventos son geniales"** — elige async solo cuando realmente compra el desacoplamiento que necesitas.
- **CQRS sin divergencia real de lectura/escritura** — dos modelos mantenidos sin ningún beneficio.

### Ver también

- SOLID principles (Parte 1, arriba) — la mayoría de las arquitecturas formalizan SRP/DIP a nivel de límite de módulo.
- Design patterns (Parte 2, arriba) — estructura dentro del módulo.
- [[conventional-commits]] — `feat`, `refactor`, `chore` se mapean limpiamente a cambios arquitectónicos.

---

Config: skill.yaml · Schema: schema.json
