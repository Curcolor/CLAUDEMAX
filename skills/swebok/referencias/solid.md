> Material curado a mano (no extraído del SWEBOK) — absorbido desde la antigua skill `architecture-principles`. Su valor son las pruebas de olfato por principio y el coste de sobreaplicar, que el SWEBOK no detalla.

# Principios SOLID

Cinco principios de diseño orientado a objetos. Úsalos como una *lente*, no como un checklist — cada principio tiene un costo (más archivos, más indirección) y el trade-off solo vale la pena cuando el eje de cambio relevante realmente existe en este codebase.

## Cuándo aplicar esta referencia

- El usuario menciona SOLID, SRP, OCP, LSP, ISP o DIP por nombre.
- El usuario pide una revisión de código enfocada en el diseño, no solo en bugs.
- El usuario pide refactorizar una clase que "hace demasiado" o "es difícil de testear".
- Estás a punto de diseñar una nueva jerarquía de clases o un límite de módulo.

## Los cinco principios, con una prueba de olfato para cada uno

### S — Single Responsibility Principle (Principio de Responsabilidad Única)

> Una clase debe tener una sola razón para cambiar.

**Prueba de olfato:** ¿Puedes describir lo que hace la clase sin decir "y"? ¿Hay dos stakeholders distintos que pedirían cambios a métodos diferentes?

**Señales de alerta:** una clase con `Order.calculateTotal()` *y* `Order.sendConfirmationEmail()`. La lógica de cálculo cambia por razones financieras; la lógica de email cambia por razones de marketing. Dos razones → hay que separar.

**Costo de sobreaplicarlo:** 47 microclases para un solo flujo de trabajo. SRP trata sobre *razones para cambiar*, no sobre *número de métodos*.

### O — Open/Closed Principle (Principio Abierto/Cerrado)

> Abierto para extensión, cerrado para modificación.

**Prueba de olfato:** cuando agregas una nueva variante (nuevo proveedor de pago, nuevo formato de exportación), ¿editas una cadena `switch`/`if` existente, o agregas un archivo nuevo que el código existente descubre vía un registro/strategy?

**Aplícalo cuando:** llegan nuevas variantes con frecuencia y las variantes existentes deben seguir funcionando sin tocarlas.
**Sáltatelo cuando:** has agregado una sola variante en dos años. YAGNI le gana a OCP en ejes estables.

### L — Liskov Substitution Principle (Principio de Sustitución de Liskov)

> Los subtipos deben poder usarse en cualquier lugar donde se espera el tipo base, sin sorprender al que llama.

**Prueba de olfato:** ¿la subclase lanza `NotSupportedException` en algún método heredado? ¿Endurece las precondiciones (por ejemplo, la base acepta `int`, la subclase exige un entero positivo)? ¿Debilita las postcondiciones? Esas son violaciones de LSP.

**Violación clásica:** `Square extends Rectangle`. Establecer `width` de forma independiente de `height` rompe el invariante de la subclase.

**Patrón de solución:** preferir composición (`Rectangle` *contiene* un value object `Sides`) sobre `extends` cuando la relación "es-un" no sobrevive a todos los métodos.

### I — Interface Segregation Principle (Principio de Segregación de Interfaces)

> Los clientes no deberían depender de métodos que no usan.

**Prueba de olfato:** ¿un consumidor recibe una interfaz gorda pero solo llama a 2 de sus 14 métodos? Divide la interfaz para que el consumidor dependa solo de lo que usa — eso minimiza las recompilaciones y hace que los test doubles sean pequeños.

**Trade-off:** más interfaces. Vale la pena cuando la interfaz gorda obliga a consumidores no relacionados a compartir un mismo destino.

### D — Dependency Inversion Principle (Principio de Inversión de Dependencias)

> Depende de abstracciones, no de concreciones. La política de alto nivel no debería importar el mecanismo de bajo nivel.

**Prueba de olfato:** ¿tu capa de dominio hace `import psycopg2`? Tu lógica de negocio no debería saber con qué base de datos habla. Inyecta una interfaz `UserRepository`; el `PostgresUserRepository` concreto vive en el borde del sistema.

**Aplícalo cuando:** necesitas intercambiar implementaciones (test doubles, backends alternativos) o estás trazando un límite hexagonal/clean-architecture.
**Sáltatelo cuando:** es un script. DIP para un CLI de 100 líneas es puro teatro.

## Cómo aplicar esto en una revisión

1. Lee el cambio. Identifica cada clase/módulo que fue tocado.
2. Para cada uno, pregunta: *¿qué principio es más relevante aquí?* — normalmente exactamente uno.
3. Enuncia la violación de forma concreta: nombra el principio, nombra el síntoma, nombra el costo.
4. Propón el refactor mínimo que la resuelve. No mezcles los cinco principios en una sola sugerencia.
5. Si aplicar un principio crearía más indirección de la que ahorra, dilo en voz alta y sáltatelo.

## Anti-patrones a señalar

- **"SRP" usado para justificar dividir cada método en su propia clase.** SRP trata sobre *ejes de cambio*, no sobre cantidad de métodos.
- **"DIP" usado para envolver cada clase concreta en una interfaz "por si acaso".** No agregues abstracciones hasta que exista o sea inminente una segunda implementación.
- **"OCP" usado para exigir una arquitectura de plugins para una feature puntual.** El OCP prematuro cuesta complejidad real por flexibilidad futura hipotética.

## Formato de salida

Cuando encuentres un problema de SOLID, escríbelo así:

> **[Principio]** — *síntoma en una línea*
> Costo: *qué se rompe hoy o se romperá pronto*
> Fix: *el cambio más pequeño que lo resuelve*

Ejemplo:

> **SRP** — `UserService` maneja hashing de contraseñas, envío de emails y logging de auditoría.
> Costo: cambiar el formato del log de auditoría obliga a reconstruir cada consumidor de `UserService`.
> Fix: extraer `AuditLogger`; inyectarlo.

## Ver también

- [patrones-gof.md](patrones-gof.md) — muchos patrones de diseño son aplicaciones concretas de SOLID.
- [arquitecturas.md](arquitecturas.md) — hexagonal, clean y onion formalizan DIP a nivel de límite/boundary.
- [chapters/ch03-diseno-de-software.md](../chapters/ch03-diseno-de-software.md) — SOLID en el contexto más amplio de los principios de diseño del SWEBOK (SOFA, acoplamiento, cohesión).
