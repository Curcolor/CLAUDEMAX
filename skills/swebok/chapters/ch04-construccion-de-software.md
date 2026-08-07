# Capítulo 4: Construcción de software

## Idea central
La construcción de software es la creación y mantenimiento detallado del software mediante codificación, verificación, pruebas unitarias, pruebas de integración y depuración; cinco fundamentos —minimizar complejidad, anticipar el cambio, construir para verificación, reutilizar activos y aplicar estándares— gobiernan casi todas las decisiones técnicas de esta actividad, independientemente del lenguaje o la plataforma.

## Marcos que introduce
- **Los cinco fundamentos de la construcción**: minimizar complejidad, anticipar y aceptar el cambio, construir para verificación, reutilización de activos, aplicación de normas en la construcción.
  - Cuándo usarlo: como checklist de fondo antes de tomar cualquier decisión de codificación, no solo al final.
  - Cómo: para cada decisión pregúntate cuál de los cinco compromete y si el trade-off es aceptable; los cuatro primeros aplican tanto a diseño como a construcción.
- **Construcción para la verificación**: desarrollar software de forma que ingenieros, evaluadores y usuarios puedan detectar fallos fácilmente durante pruebas independientes y actividades operativas.
  - Cuándo usarlo: siempre, pero especialmente antes de escribir estructuras de lenguaje complejas o difíciles de comprender.
  - Cómo: cumple estándares de codificación que faciliten revisión y pruebas unitarias, organiza el código para pruebas automatizadas, restringe estructuras difíciles de comprender, registra comportamiento mediante logs.
- **Construcción para reutilización vs. construcción con reutilización**: dos facetas distintas de la reutilización — crear activos reutilizables (para) vs. usar activos existentes para construir algo nuevo (con).
  - Cuándo usarlo: al planificar cualquier componente que pueda trascender el proyecto actual.
  - Cómo: "para reutilización" exige análisis y diseño de variabilidad, encapsulación en bibliotecas/componentes bien estructurados (evitando clones de código); "con reutilización" exige seleccionar, evaluar, integrar y reportar el uso de activos reutilizables.
- **Diseño por contrato**: cada rutina o clase forma un contrato con el resto del programa mediante precondiciones y poscondiciones que especifican con precisión su semántica.
  - Cuándo usarlo: en software de alta confiabilidad donde el comportamiento de interfaz debe ser inequívoco.
  - Cómo: define explícitamente qué debe cumplirse antes de invocar la rutina (precondición) y qué garantiza al terminar (poscondición); combínalo con aserciones para verificación en tiempo de ejecución.
- **Integración gradual ("big bang") vs. incremental**: la integración gradual retrasa la integración hasta que todas las partes de una versión están completas; la incremental construye y prueba partes pequeñas y las combina una a una.
  - Cuándo usarlo: casi siempre incremental es preferible salvo restricciones específicas — ofrece localización de errores más sencilla, mejor supervisión del progreso, entrega más temprana y mejores relaciones con clientes.
  - Cómo: requiere infraestructura de prueba adicional (stubs, drivers, mocks); la integración continua (CI) automatiza este patrón con un pipeline que construye y prueba cada integración.
- **Programación basada en pruebas (TDD)**: escribir los casos de prueba antes que el código; el código nuevo se escribe solo para hacer pasar pruebas que inicialmente fallan, luego se refactoriza.
  - Cuándo usarlo: cuando se busca detectar defectos temprano y forzar razonamiento explícito sobre requisitos y diseño antes de codificar.
  - Cómo: (1) escribe un caso de prueba que falla contra el código base actual; (2) escribe el código mínimo que lo hace pasar; (3) refactoriza el código y las partes asociadas del proyecto.

## Conceptos clave
- **Complejidad ciclomática**: medida de análisis estático (McCabe, 1976) del número de rutas linealmente independientes en el código fuente; indica cuántos casos de prueba como mínimo deberían existir.
- **Lenguajes de construcción**: espectro desde lenguajes de configuración (opciones predefinidas limitadas) → lenguajes de kit de herramientas → lenguajes de scripting → lenguajes de programación (los más flexibles, menos específicos de dominio, requieren mayor habilidad).
- **Notaciones de construcción**: lingüísticas (cadenas de texto con connotación semántica intuitiva), formales (definiciones matemáticas precisas, base semántica de programación de sistemas) y visuales (interpretación visual directa, limitadas para declaraciones complejas).
- **Modelo ejecutable**: especificación en un lenguaje de modelado ejecutable (p. ej. xUML) que puede implementarse en diversos entornos sin modificación; base de la Arquitectura Dirigida por Modelos (MDA) de OMG, que distingue Modelo Independiente de Plataforma (PIM) de Modelo Específico de Plataforma (PSM).
- **Primitivas de concurrencia**: semáforo (variable protegida que controla acceso a un recurso compartido), monitor (tipo de dato abstracto con operaciones ejecutadas en exclusión mutua), mutex (acceso exclusivo a un recurso para un solo proceso/hilo a la vez).
- **Middleware**: software que provee servicios por encima del sistema operativo y por debajo de la capa de aplicación (paso de mensajes, persistencia, transparencia de ubicación); un bus de servicios empresariales (ESB) es un ejemplo moderno orientado a mensajes.
- **Internacionalización vs. localización**: preparar un programa para soportar múltiples configuraciones regionales (i18n) es distinto de adaptarlo a un idioma/región local específicos (l10n); ambas requieren decisiones de diseño y construcción sobre cadenas y conjuntos de caracteres.

## Modelos mentales
- Piensa en "qué cuenta como construcción" como dependiente del modelo de ciclo de vida: en cascada la construcción es sobre todo codificación tras diseño exhaustivo previo; en ágil/iterativo, diseño+codificación+pruebas se funden en una sola actividad continua; en CI/CD, incluso entrega y despliegue se funden con la construcción.
- Trata el diseño en construcción como analogía de obra física: así como un constructor ajusta pequeños detalles no cubiertos por los planos, el ingeniero de software resuelve detalles de diseño (algoritmos, estructuras de datos, interfaces a pequeña escala) que el diseño de alto nivel dejó abiertos.
- Usa la gestión de dependencias como gestión de riesgo de cadena de suministro: cada dependencia directa o indirecta es un vector de riesgo (defectos, vulnerabilidades, conflictos de licencia), no solo una conveniencia de productividad.
- Piensa en aserciones, diseño por contrato y programación defensiva como tres capas complementarias, no intercambiables: aserciones detectan violaciones de supuestos internos durante desarrollo (se suelen desactivar en producción); diseño por contrato formaliza la interfaz; programación defensiva protege contra entradas inválidas que sí pueden ocurrir en producción.

## Antipatrones
- **Confundir integración gradual con estrategia por defecto**: retrasar toda integración hasta el final ("big bang") dificulta localizar errores y retrasa la retroalimentación a desarrolladores y clientes frente a la integración incremental.
- **Dejar aserciones activas en producción de forma indiscriminada**: las aserciones suelen compilarse durante desarrollo y eliminarse después para no degradar el rendimiento; tratarlas como manejo de errores de producción es un uso incorrecto de la herramienta.
- **Bloques catch vacíos y manejo de excepciones sin información**: una política de excepciones mal diseñada (sin incluir toda la información que condujo a la excepción, sin conocer qué excepciones lanza el código de biblioteca) hace que la tolerancia a fallos sea ilusoria.
- **Introducir dependencias externas no confiables sin regulación**: sin mecanismos de supervisión, cada nueva dependencia de la cadena de suministro es una vía de propagación de defectos o vulnerabilidades hacia el producto final.
- **Tratar código clonado como reutilización**: copiar fragmentos en vez de encapsularlos en bibliotecas o componentes bien estructurados socava la "construcción para reutilización" y multiplica el costo de mantenimiento futuro.

## Tablas de referencia
| Lenguaje de construcción | Flexibilidad | Especificidad de dominio |
|---|---|---|
| Configuración | Mínima | Máxima (opciones predefinidas) |
| Kit de herramientas | Baja-media | Alta (componentes reutilizables de la app) |
| Scripting | Media | Media |
| Programación de propósito general | Máxima | Mínima |

| Notación | Base | Uso típico |
|---|---|---|
| Lingüística | Cadenas de texto con connotación semántica | Programación general (C/C++, Java) |
| Formal | Principios matemáticos precisos | Sistemas donde precisión y testabilidad priman (Event-B) |
| Visual | Interpretación visual directa | Interfaces, cuando la tarea es ajustar visualmente el comportamiento (MATLAB) |

| Primitiva de concurrencia | Función |
|---|---|
| Semáforo | Controla acceso a recurso compartido entre procesos/hilos |
| Monitor | Tipo abstracto con operaciones en exclusión mutua |
| Mutex | Acceso exclusivo a un recurso para un solo proceso/hilo |

| Técnica de manejo de errores | Cuándo se usa |
|---|---|
| Valor neutro / siguiente dato válido | Errores recuperables sin interrumpir el flujo |
| Código de error / mensaje de advertencia | Notificación al llamador sin abortar |
| Excepciones (throw/try/catch) | Errores o eventos excepcionales que rompen el flujo normal |
| Apagado del software | Errores irrecuperables de alta severidad |

## Puntos clave
- Antes de codificar una estructura compleja, pregunta si existe una alternativa más simple: la reducción de complejidad no es estética, es lo que hace testeable y mantenible el código.
- Prefiere integración incremental y CI sobre integración por fases salvo restricción explícita del proyecto.
- Documenta y automatiza la gestión de dependencias como control de riesgo de cadena de suministro, no solo como conveniencia.
- Usa TDD quirúrgicamente cuando el objetivo es exponer temprano problemas de requisitos/diseño, no como dogma universal.
- Elige la notación de construcción (lingüística/formal/visual) según qué propiedad importa más para ese componente: legibilidad, precisión demostrable, o ajuste visual directo.

## Conecta con
- **Diseño de Software**: gran parte del diseño detallado ocurre durante la construcción misma; los principios de diseño (modularidad, acoplamiento/cohesión) se aplican a escala de algoritmos e interfaces durante la codificación.
- **Pruebas de Software**: pruebas unitarias e integración ocurren dentro de la construcción; construir para verificación es la precondición para que las pruebas posteriores sean efectivas.
- **Gestión de la Configuración de Software**: la construcción genera la mayor cantidad de elementos de configuración de un proyecto (código fuente, documentación, casos de prueba).
- **Calidad del Software**: el código es el entregable final; inspecciones, revisiones técnicas y análisis estático durante la construcción son actividades de calidad centradas en el código.
- **Fundamentos de la Computación**: algoritmos, estructuras de datos y modelos de concurrencia que se usan en construcción provienen directamente de este KA.
