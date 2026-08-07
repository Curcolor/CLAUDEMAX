> Material curado a mano (no extraído del SWEBOK) — absorbido desde la antigua skill `architecture-principles`. Aporta la guía de elección por fuerza y los trade-offs concretos que el SWEBOK deja a nivel de catálogo, sin la profundidad práctica de "qué te muerde después".

# Arquitecturas de sistema

Patrones por encima del nivel de clase — cómo se organiza un sistema completo. Elige uno según las *fuerzas* del proyecto (tamaño del equipo, cadencia de despliegue, aislamiento de fallos, frecuencia de cambio). No elijas por moda. La mayoría de los fallos aquí son elegir distribuido cuando un monolito bastaría, u hexagonal cuando un script de 200 líneas bastaría.

## Cuándo aplicar esta referencia

- El usuario pide organizar un proyecto nuevo o reestructurar uno existente.
- El usuario menciona el nombre de una arquitectura y quiere una comparación o recomendación.
- Estás proponiendo un refactor no trivial que cruza límites de módulos.

## Guía rápida de elección por fuerza

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

## Los patrones, con el trade-off que muerde

### Layered (por capas / n-tier)

Presentación → aplicación → dominio → infraestructura. Cada capa depende solo de la que está debajo.

**A favor:** familiar para todos; fácil de aprender.
**En contra:** la capa de "dominio" casi siempre termina dependiendo del ORM, anulando la separación por capas. Layered sin inversión de dependencias es solo carpetas.

### Hexagonal (a.k.a. Ports and Adapters / Puertos y Adaptadores)

El dominio en el centro expone **puertos** (interfaces). La tecnología externa (DB, HTTP, queue, CLI) implementa **adaptadores** detrás de esos puertos. El código de dominio no tiene ningún `import` de frameworks.

**A favor:** puedes intercambiar canales de entrega y almacenamiento sin tocar la lógica de negocio. Los tests unitarios corren con adaptadores en memoria.
**En contra:** más archivos, más ceremonia. Incorrecto para un script o una app CRUD pequeña. Correcto para sistemas donde las reglas de dominio viven durante años y la tecnología no.

### Clean / Onion

La misma idea que hexagonal, con una disciplina de anillos más estricta (entities → use cases → interface adapters → frameworks). Es el enfoque de Robert C. Martin; la sustancia es hexagonal.

**A favor:** regla de dependencia clara (las dependencias apuntan hacia adentro, nunca hacia afuera).
**En contra:** si se sigue religiosamente, terminas escribiendo cuatro clases para hacer una sola cosa. Úsalo cuando la complejidad justifique la estructura.

### MVC / MVP / MVVM

Patrones de UI. La View renderiza; el Model guarda el estado; el Controller / Presenter / ViewModel media.

- **MVC** — el controller toma la entrada, actualiza el model, elige la view. Frameworks web del lado del servidor.
- **MVP** — el presenter guarda el estado de presentación, la view es tonta. Más fácil de testear que MVC porque el estado de la view vive en el presenter.
- **MVVM** — el viewmodel expone estado observable; la view se enlaza (bind) a él. Patrón nativo para UIs con data-binding (WPF, SwiftUI, Vue, Knockout).

En contra: los tres se pudren hacia "fat controller" / "fat viewmodel" si no empujas la lógica real hacia abajo, al dominio.

### Monolito modular

Un solo deployable, con módulos internos con límites explícitos (un módulo = una carpeta + una interfaz pública + internals privados). Los módulos pueden convertirse en servicios más adelante si se ven forzados a ello.

**A favor:** operación simple; llamadas in-process; los refactors se quedan locales; solo pagas el impuesto de sistema distribuido cuando lo necesitas.
**En contra:** los "módulos" se pudren hacia spaghetti sin límites forzados. Usa una herramienta en build-time (architecture tests, reglas de eslint por capas, jdepend) para mantener los imports honestos.

### Microservicios

Muchos servicios desplegables de forma independiente, cada uno dueño de sus datos. Se comunican vía HTTP o eventos. Cada servicio es lo bastante pequeño como para que un equipo lo tenga completo en la cabeza.

**A favor:** deploys independientes, aislamiento de fallos, stacks poliglota, escala por servicio.
**En contra:** las transacciones distribuidas son *difíciles*. La red no es confiable. La factura de observability es real. Depurar abarca 12 servicios. No empieces aquí a menos que el tamaño del equipo y la complejidad del producto lo exijan; **empieza con un monolito modular y extrae servicios cuando aparezcan las costuras (seams).**

### Event-driven architecture (arquitectura orientada a eventos)

Los componentes publican eventos; otros se suscriben. Acoplamiento laxo; consistencia eventual.

**A favor:** escalado, aislamiento, rastro de auditoría, suscriptores nuevos que se enlazan tarde (late-binding).
**En contra:** ordenamiento, entrega exactly-once, evolución de esquemas, depurar "¿a dónde fue ese evento?". Necesitas un event bus y tooling de observability. No le esparzas eventos a una app CRUD por diversión.

### CQRS (Command Query Responsibility Segregation)

El modelo de escritura maneja los comandos; modelo(s) de lectura separados sirven las queries. A menudo combinado con event sourcing.

**A favor:** el modelo de lectura está moldeado para las queries (desnormalizado, proyectado); el modelo de escritura hace cumplir los invariantes.
**En contra:** dos modelos que mantener sincronizados; la consistencia eventual se les nota a los usuarios; sobrecarga cognitiva. Vale la pena cuando las cargas o formas de lectura/escritura divergen dramáticamente.

### Event sourcing

Persiste una secuencia de eventos inmutables. El estado actual es un fold sobre los eventos.

**A favor:** auditoría perfecta, viaje en el tiempo (time-travel), reconstrucción de proyecciones.
**En contra:** evolución del esquema de los eventos (los eventos son inmutables pero su forma cambia); rendimiento del replay; cambio de modelo mental. Esfuerzo pesado; solo vale la pena cuando la historia *es* el producto (banca, salud, regulatorio).

### Serverless

Funciones disparadas por eventos (HTTP, queue, schedule). Sin servidores de larga duración; el proveedor maneja la escala.

**A favor:** pago por request; auto-escalado; operación mínima.
**En contra:** cold starts, vendor lock-in, límites de tamaño de función, depurar a través de funciones, problemas de sistema distribuido a una granularidad más fina. Excelente para cargas con picos y código de "pegamento" (glue code); riesgoso para presupuestos de latencia ajustados.

## La decisión "aburrida" suele ser la correcta

Ante la duda:

- Empieza con un **monolito modular** usando límites **hexagonales**.
- Una base de datos. Un deploy. Un servicio.
- Empuja los efectos secundarios (DB, HTTP, queue) detrás de puertos.
- Aplica los principios SOLID ([solid.md](solid.md)) dentro de los módulos; aplica patrones de diseño ([patrones-gof.md](patrones-gof.md)) dentro de las clases.
- Extrae un servicio solo cuando una fuerza real (deploy independiente, aislamiento, escala) lo exija, no porque los microservicios sean el tema de moda en la charla de la conferencia.

## Cómo recomendar una arquitectura

1. Enuncia las *fuerzas* (tamaño del equipo, cadencia de despliegue, aislamiento de fallos, eje de escala).
2. Nombra el patrón que encaja con *esas* fuerzas.
3. Enuncia qué cuesta (operacional, cognitivo, de infraestructura).
4. Si el costo supera la fuerza, recomienda la opción más simple y di qué te haría reconsiderar.

## Anti-patrones a evitar

- **Microservicios para un equipo de 3 personas** — monolito distribuido en modo difícil.
- **Hexagonal para un script de 200 líneas** — sobreingeniería.
- **MVC donde el model es una fila de base de datos** — eso es solo CRUD; llámalo así.
- **Event-driven porque "los eventos son geniales"** — elige async solo cuando realmente compra el desacoplamiento que necesitas.
- **CQRS sin divergencia real de lectura/escritura** — dos modelos mantenidos sin ningún beneficio.

## Ver también

- [solid.md](solid.md) — la mayoría de las arquitecturas formalizan SRP/DIP a nivel de límite de módulo.
- [patrones-gof.md](patrones-gof.md) — estructura dentro del módulo.
- [chapters/ch02-arquitectura-de-software.md](../chapters/ch02-arquitectura-de-software.md) — vistas, ASR, ATAM/SAAM/QAW y el resto del marco de arquitectura del SWEBOK.
- [[conventional-commits]] — `feat`, `refactor`, `chore` se mapean limpiamente a cambios arquitectónicos.
