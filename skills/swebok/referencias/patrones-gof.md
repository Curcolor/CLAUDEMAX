> Material curado a mano (no extraído del SWEBOK) — absorbido desde la antigua skill `architecture-principles`. Reúne los 23 patrones GoF con su disparador de una línea, más los patrones modernos que el catálogo original no cubre.

# Design patterns (patrones de diseño)

Un vocabulario para soluciones a problemas de diseño recurrentes. Usa el nombre solo cuando el patrón realmente aplica — ponerle "Factory" a una función que llama a `new` es jerga, no ingeniería.

## Cuándo aplicar esta referencia

- El usuario pregunta "¿qué patrón encaja aquí?" o nombra un patrón.
- Estás proponiendo un refactor y quieres una etiqueta concisa que ambas partes entiendan.
- Estás revisando código que *podría* limpiarse con un patrón conocido.

## Los 23 patrones GoF, agrupados, con un disparador de una línea

### Creacionales — cómo llegan a existir los objetos

| Patrón | Úsalo cuando |
|---|---|
| **Factory Method** | Una clase necesita crear objetos de una familia relacionada, pero la clase concreta exacta depende de la subclase / de la entrada en tiempo de ejecución. |
| **Abstract Factory** | Necesitas crear *familias* de productos relacionados (p. ej. widgets de UI para macOS vs. Windows) y quieres garantizar consistencia. |
| **Builder** | Un objeto tiene muchos parámetros de construcción opcionales; los constructores se están volviendo telescópicos. Una API fluida ayuda a la legibilidad. |
| **Prototype** | Clonar un objeto ya configurado es más barato o más claro que construir uno nuevo desde cero. |
| **Singleton** | Se necesita genuinamente una sola instancia a nivel de sistema (logger, config). **Advertencia:** los singletons suelen ser globals disfrazados — prefiere inyectar una única instancia vía el contenedor de DI. |

### Estructurales — cómo se componen los objetos

| Patrón | Úsalo cuando |
|---|---|
| **Adapter** | Dos interfaces no coinciden; no puedes cambiar ninguna de las dos. Envuelve una con la forma de la otra. |
| **Bridge** | Dos ejes ortogonales de variación se están multiplicando en una explosión de clases. Sepáralos en jerarquías separadas unidas por composición. |
| **Composite** | Quieres que el código cliente trate hojas individuales y árboles completos de manera uniforme (filesystem, nodos de UI, nodos de AST). |
| **Decorator** | Quieres agregar comportamiento a instancias específicas en tiempo de ejecución sin subclasificar cada combinación (`BufferedInputStream(FileInputStream(...))`). |
| **Facade** | Un subsistema tiene muchas clases pequeñas; los clientes necesitan un punto de entrada simple que oculte el detalle interno. |
| **Flyweight** | Muchos objetos de grano fino comparten la mayor parte de su estado; extrae la parte compartida para ahorrar memoria. |
| **Proxy** | Necesitas un objeto que *actúe como* el real pero agregue control de acceso, carga perezosa, remoting o caché. |

### De comportamiento — cómo colaboran los objetos

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

## Patrones modernos / no-GoF que vale la pena conocer

- **Repository** — abstrae la persistencia detrás de una interfaz tipo colección. Se combina con DIP ([solid.md](solid.md)).
- **Unit of Work** — coordina una transacción lógica a través de múltiples repositories.
- **CQRS** — separa los modelos de lectura y escritura en sistemas donde sus preocupaciones divergen lo suficiente como para justificar el costo.
- **Result / Either** — el valor de retorno lleva éxito o fallo; alternativa a las excepciones para rutas de error esperadas.
- **Pipeline / Middleware** — composición de handlers que llaman a `next` (middleware HTTP, cadenas de validación).
- **Specification** — encapsula reglas de negocio como predicados componibles (`new InGoodStanding().and(new HasOpenOrders())`).

## Cómo recomendar un patrón

1. Enuncia el *problema* en una oración.
2. Nombra el patrón.
3. Esboza la estructura mínima viable — usualmente 2-4 tipos y sus relaciones.
4. Menciona qué cuesta el patrón (indirección extra, navegación más difícil, curva de aprendizaje para el equipo).
5. Si existe una alternativa más simple (una función, un closure, un mapa de config), dilo y deja que el usuario elija.

## Anti-patrones a evitar

- **Pattern-itis** — aplicar patrones porque son "buena práctica" en vez de porque el problema los pide.
- **Singleton everywhere** — la mayoría de los "singletons" son estado global disfrazado; prefiere una única instancia gestionada por tu contenedor de DI.
- **Clases Manager / Helper / Util** — son clases bolsa-de-funciones sin una responsabilidad única; usualmente una señal de que te saltaste nombrar la abstracción real.
- **Patrón por nombre** — "conviértelo en un Strategy" no es una discusión de diseño hasta que hayas dicho *qué está variando*.

## Ver también

- [solid.md](solid.md) — la mayoría de los patrones GoF son aplicaciones concretas de SRP, OCP o DIP.
- [arquitecturas.md](arquitecturas.md) — patrones estructurales a gran escala (hexagonal, layered, microservices).
- [chapters/ch03-diseno-de-software.md](../chapters/ch03-diseno-de-software.md) — cómo elegir un patrón GoF dentro del proceso general de diseño del SWEBOK.
