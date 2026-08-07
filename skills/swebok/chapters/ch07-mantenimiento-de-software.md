# Capítulo 7: Mantenimiento de Software

## Idea central
El mantenimiento no es solo corrección de fallos —de hecho, más del 80% del esfuerzo real se destina a mejorar y adaptar el software—; es el proceso continuo que sostiene y evoluciona el producto durante toda su vida operativa, y su planificación debe empezar antes de la entrega, no después.

## Marcos que introduce

- **Seis categorías de mantenimiento (ISO/IEC/IEEE 14764)**: correctivo, preventivo, adaptativo, aditivo, perfectivo y de emergencia, agrupadas en "corrección" o "mejora".
  - Cuándo usarlo: para clasificar cada solicitud de modificación (MR) o informe de problema (PR) al ingreso, y así medir dónde se va realmente el esfuerzo de mantenimiento.
  - Cómo: clasificar cada solicitud en una de las 6 categorías; agrupar en corrección (correctivo + preventivo + emergencia) o mejora (adaptativo + aditivo + perfectivo) para reportes de gestión y evitar que las mejoras se contabilicen como "corrección de errores cara".

- **Las ocho leyes de evolución del software (Lehman)**: cambio continuo, complejidad creciente, autorregulación, tasa de trabajo invariante, conservación de la familiaridad, crecimiento continuo, disminución de la calidad, sistema de retroalimentación.
  - Cuándo usarlo: al planificar versiones y justificar inversión continua en mantenimiento/refactorización frente a la presión de solo añadir funcionalidad.
  - Cómo: usar cada ley como chequeo de salud del sistema — ¿la complejidad crece sin control?, ¿el equipo conserva dominio del contenido pese al crecimiento?, ¿la calidad se mantiene solo porque se adapta rigurosamente al entorno?

- **Proceso de mantenimiento ISO/IEC/IEEE 14764**: preparar el mantenimiento, realizar el mantenimiento, realizar soporte logístico, gestionar resultados de mantenimiento y logística.
  - Cuándo usarlo: al diseñar el proceso de mantenimiento de una organización o incorporar un equipo nuevo.
  - Cómo: instanciar cada uno de los 4 macroprocesos con planificación empresarial (nivel organizacional), planificación de mantenimiento (nivel de transición), planificación de versión (nivel de software) y planificación de MR (nivel de solicitud individual).

- **Análisis de impacto como filtro de aceptación de cambios**.
  - Cuándo usarlo: antes de aceptar cualquier MR/PR.
  - Cómo: identificar componentes y sistemas afectados, estimar recursos necesarios, evaluar riesgos de rendimiento y seguridad, y solo entonces aceptar, modificar, aplazar o rechazar el cambio.

## Conceptos clave
- **Mantenedor de software**: rol u organización que realiza actividades de mantenimiento, distinto del rol de desarrollador.
- **Solicitud de modificación (MR) / Informe de problema (PR)**: entradas formales que disparan el proceso de cambio de mantenimiento.
- **Deuda técnica**: carga futura que se acumula cuando soluciones rápidas, poco consideradas y sin revisión por pares se aplican bajo presión de tiempo en mantenimiento correctivo, de emergencia o aditivo.
- **Mantenibilidad**: capacidad del producto de software para ser modificado; se mide en modularidad, reutilización, analizabilidad, modificabilidad, capacidad de prueba y capacidad de soporte.
- **Comprensión limitada**: la barrera inicial que enfrenta un ingeniero al intentar entender software desarrollado por otra persona; consume una parte significativa del esfuerzo total de mantenimiento.
- **Pruebas de regresión**: repetición selectiva de pruebas de software o componente para verificar que una modificación no causó efectos no deseados.
- **Reingeniería / refactorización**: la reingeniería reconstituye el software en una nueva forma (a menudo para reemplazar software heredado); la refactorización reorganiza el programa sin modificar su comportamiento externo.
- **Ingeniería inversa**: análisis pasivo del software para producir representaciones de más alto nivel (redocumentación, recuperación de diseño, ingeniería inversa de datos); no modifica ni genera software nuevo.

## Modelos mentales
Piensa en el mantenimiento como desarrollo continuo con restricciones adicionales, no como una fase menor posterior al "verdadero" desarrollo: los grandes sistemas nunca están completos.

Usa la deuda técnica como concepto financiero —costo actual, ahorro potencial de resolverla, impacto en el negocio— y no solo como juicio subjetivo sobre la calidad del código.

Piensa en el análisis de impacto como el filtro que traduce "quiero este cambio" en "esto cuesta X, afecta a Y componentes, arriesga Z" antes de comprometer recursos de desarrollo.

Usa las leyes de Lehman como termómetro del sistema, no como reglas prescriptivas: si la organización rompe sistemáticamente la "conservación de la familiaridad" (crece más rápido de lo que el equipo puede entender), está sembrando incidentes futuros.

## Antipatrones
- **Agrupar mejoras y correcciones en el mismo indicador de costo**: distorsiona la percepción de gestión haciendo parecer que "corregir errores" es carísimo, cuando el grueso real del gasto es mejora y adaptación.
- **Dejar la mantenibilidad fuera del foco durante el desarrollo**: el desarrollador prioriza "que funcione ya" sin documentar ni probar adecuadamente, generando comprensión limitada crónica para quien mantenga después.
- **Gestionar la deuda técnica de forma aislada**: ignora que buena parte del "exceso de trabajo no planificado" proviene de problemas de equipo o de proceso, no solo de código deficiente.
- **Fusionar desarrollador y mantenedor sin transición formal**: perder conocimiento crítico cuando el desarrollador original se va, sin documentación de calidad que lo compense.

## Tablas de referencia

| Categoría | Grupo | Disparador típico |
|---|---|---|
| Correctivo | Corrección | Defecto descubierto en producción |
| Preventivo | Corrección | Falla latente detectada antes de manifestarse |
| Emergencia | Corrección | Fix no programado y temporal, a la espera del correctivo |
| Adaptativo | Mejora | Cambio en entorno operativo (SO, hardware, interfaces) |
| Aditivo | Mejora | Nueva funcionalidad o característica |
| Perfectivo | Mejora | Mejora de atributos existentes (rendimiento, mantenibilidad, documentación) |

## Puntos clave
- Clasifica cada solicitud en las 6 categorías desde el ingreso: es la base de toda métrica de costo de mantenimiento creíble.
- Ejecuta análisis de impacto antes de comprometer un cambio: componentes afectados, coste, pruebas necesarias y riesgo.
- Trata la deuda técnica como decisión de negocio: cuantifica coste actual, ahorro potencial y urgencia real antes de priorizarla frente a nueva funcionalidad.
- Diseña la transición desarrollo→mantenimiento como proceso formal y documentado, no como abandono informal del proyecto.
- Automatiza con CI/CD y pruebas continuas para que la refactorización necesaria en mantenimiento no compita en fricción con la entrega de valor.

## Conecta con
- **Gestión de Configuración del Software**: todo cambio de mantenimiento fluye por el mismo proceso de control de cambios (SCR/SCM).
- **Calidad del Software**: la mantenibilidad es un atributo de calidad medible que se planifica desde el diseño, no se improvisa en mantenimiento.
- **Gestión de Ingeniería de Software**: la estimación de costos y esfuerzo de mantenimiento usa las mismas técnicas de estimación de proyectos.
- **Proceso de Ingeniería de Software**: el mantenimiento es uno de los procesos técnicos del ciclo de vida definidos en ISO/IEC/IEEE 12207.
