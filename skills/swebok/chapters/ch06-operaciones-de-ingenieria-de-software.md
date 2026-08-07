# Capítulo 6: Operaciones de ingeniería de software

## Idea central
Las operaciones de ingeniería de software son el conjunto de conocimiento, procesos y herramientas para implementar, operar y dar soporte a un producto de software preservando su integridad y estabilidad; la tendencia central del área es tratar la infraestructura y las operaciones mismas "como código" (IaC/PaC) para que dejen de ser trabajo manual artesanal y pasen a ser un servicio automatizado y autoservicio que los propios ingenieros de software pueden consumir.

## Marcos que introduce
- **Los tres procesos de operaciones (SWEBOK v4)**: Planificación de Operaciones, Entrega de Operaciones y Control de Operaciones, cada uno con actividades específicas antes y después de la entrega de un proyecto de software.
  - Cuándo usarlo: como esqueleto para auditar la madurez operativa de una organización — si falta claramente uno de los tres, hay un vacío de proceso.
  - Cómo: Planificación cubre plan de operaciones, gestión de proveedores, entornos, disponibilidad/continuidad, capacidad, backup/DR, seguridad; Entrega cubre pruebas operativas, ingeniería de implementación/lanzamiento, rollback/migración, gestión de cambios, gestión de problemas; Control cubre gestión de incidentes, monitoreo/medición, soporte, informes de servicio.
- **Todo "como código" (IaC/PaC)**: gestionar recursos de infraestructura y configuración de estado deseado mediante código, no procedimientos manuales.
  - Cuándo usarlo: para cualquier elemento que afecte directa o indirectamente al producto de software — la regla es "si afecta al producto, represéntalo como código".
  - Cómo: obtén sus siete beneficios explícitos: repetibilidad, consistencia/estandarización, políticas de seguridad conocidas, autodocumentación, fuente única de verdad, control de configuración y escalabilidad.
- **Despliegue vs. lanzamiento (deployment vs. release)**: el despliegue es instalar una versión específica de software en un entorno dado (p. ej. producción); el lanzamiento es poner una característica a disposición de todos los clientes o de un segmento — son decisiones distintas y desacopladas.
  - Cuándo usarlo: siempre que diseñes una estrategia de entrega — desacoplar ambos conceptos permite desplegar código en producción sin exponerlo aún a usuarios.
  - Cómo: usa interruptores de funciones (feature flags/switches) para controlar el lanzamiento independientemente del despliegue; usa canary releases (implementación parcial y temporal evaluada antes de un rollout completo) para decidir si proceder.
- **Ingeniería de Plataforma vs. SRE (Site Reliability Engineering)**: la ingeniería de plataforma construye y gestiona capacidades de autoservicio que los ingenieros de software consumen para desarrollar/implementar/operar; SRE supervisa, automatiza y mejora aspectos no funcionales (disponibilidad, rendimiento, latencia, seguridad) y gestiona cambios, respuesta a emergencias y capacidad.
  - Cuándo usarlo: al diseñar la estructura organizacional de operaciones, para no confundir "quién construye la plataforma" con "quién garantiza que funcione bien".
  - Cómo: separa responsabilidades — plataforma provee el self-service, SRE es dueño de los objetivos de fiabilidad sobre lo que corre en esa plataforma.
- **Gestión de incidentes vs. gestión de problemas**: gestión de incidentes registra, prioriza, evalúa impacto, resuelve y cierra incidentes individuales; gestión de problemas identifica y analiza la *causa raíz* de incidentes recurrentes para minimizar interrupciones futuras.
  - Cuándo usarlo: distingue "apagar este incendio" (incidente) de "por qué siguen ocurriendo estos incendios" (problema) — son dos procesos con objetivos distintos, no sinónimos.
  - Cómo: tras resolver un incidente, alimenta el análisis post-mortem al proceso de gestión de problemas si hay indicios de causa raíz sistémica compartida con otros incidentes.
- **Entrega continua vs. despliegue continuo vs. pruebas continuas**: tres prácticas relacionadas pero distintas que se confunden con frecuencia. Entrega continua ensambla continuamente código/configuración en candidatos de lanzamiento hacia entornos de prueba/staging; despliegue continuo automatiza el paso a producción verificando características y validaciones; pruebas continuas evalúa calidad en cada etapa del ciclo de vida, no solo al final.
  - Cuándo usarlo: al diseñar un pipeline, para saber exactamente qué automatización falta o sobra.
  - Cómo: entrega continua no implica necesariamente llegar a producción automáticamente (ese es despliegue continuo); pruebas continuas es una precondición para confiar en ambas.

## Conceptos clave
- **Ingeniero de operaciones**: rol responsable de desarrollar servicios de operaciones disponibles como servicio y accesibles vía API (aprovisionamiento, entornos on-demand, CI, monitoreo, seguridad, DBMS).
- **CONOPS (Concepto de Operaciones)**: documento que especifica cómo los usuarios solicitarán modificaciones y reportarán incidencias una vez el software esté operativo; se elabora durante el desarrollo, no después.
- **Acuerdo de Nivel de Servicio (SLA)**: documento que aclara obligaciones de los servicios operativos; se supervisa mediante el proceso de gestión de nivel de servicio (carga de trabajo, tendencias de rendimiento/disponibilidad, satisfacción del cliente).
- **Gestión de la capacidad**: proceso central para todo lo relacionado con rendimiento y capacidad; produce un plan de capacidad documentando rendimiento real y requisitos previstos, actualizado con la frecuencia que dicte la tasa de cambio del negocio.
- **DevSecOps**: extensión de DevOps que integra seguridad desde las primeras etapas y a lo largo de todo el proceso, automatizando la detección y corrección de problemas de seguridad lo antes posible.
- **Telemetría de producto**: recopilación y análisis de datos en todas las capas del sistema (aplicación, sistema operativo, infraestructura) para detectar problemas tempranamente y sentar la base para identificar el origen de un incidente.
- **Entidad muy pequeña (VSE)**: organización de hasta 25 personas para la que estándares de operaciones diseñados para grandes organizaciones resultan desproporcionados; la serie ISO/IEC 29110 ofrece perfiles adaptados.

## Modelos mentales
- Piensa en "la esperanza no es una estrategia" (mentalidad DevOps): sustituye la expectativa optimista de que nada falle por evidencia continua en tiempo real (monitoreo de producción, telemetría, resultados de V&V, actividad de usuario, dependencias, cambios de configuración no aprobados, resiliencia de seguridad).
- Trata cada elemento que afecta al producto como candidato a representarse como código — la pregunta por defecto no es "¿debería automatizarse esto?" sino "¿por qué no está ya como código?".
- Usa la separación planificación/entrega/control como los tres momentos temporales de la operación: antes de que exista el servicio, mientras se pone en marcha, y mientras ya está corriendo — no mezcles actividades de un momento en otro.
- Piensa en rollback y migración de datos como algo que se ensaya *antes* del despliegue de la nueva versión, no como un plan de contingencia que se improvisa cuando algo ya falló.

## Antipatrones
- **Confundir despliegue con lanzamiento**: tratar "el código ya está en producción" como equivalente a "los usuarios ya lo tienen" impide usar canary releases o feature flags para mitigar riesgo — son decisiones independientes que deben desacoplarse.
- **Entornos de desarrollo/QA/preproducción/producción construidos manualmente y por separado**: sin una única fuente de verdad (IaC), los entornos se desincronizan de producción y las pruebas dejan de predecir el comportamiento real.
- **Probar recuperación ante desastres solo en teoría**: un plan de backup/DR/failover que nunca se ensaya con el entorno de producción real (deteniendo el servicio, activando el failover) no da ninguna garantía real de tiempo de recuperación.
- **Tratar la gestión de incidentes como sustituto de la gestión de problemas**: cerrar incidentes uno a uno sin análisis de causa raíz garantiza que los mismos incidentes recurrentes sigan interrumpiendo el negocio.
- **Aplicar estándares de gran organización sin adaptar a una VSE**: imponer procesos de operaciones diseñados para organizaciones grandes a un equipo de 25 personas o menos suele sobrepasar su capacidad real; usa perfiles adaptados (ISO/IEC 29110) en vez de forzar el estándar completo.
- **Repetir pruebas manuales completas en cada release**: dado el costo en tiempo y dinero, no automatizar pruebas de regresión y estrategias de cobertura selectiva convierte cada lanzamiento en un cuello de botella evitable.

## Tablas de referencia
| Proceso de operaciones | Actividades clave |
|---|---|
| Planificación | Plan de operaciones y gestión de proveedores, entornos dev/ops, disponibilidad/continuidad/SLA, gestión de capacidad, backup/DR/failover, seguridad de software y datos |
| Entrega | Pruebas operativas/verificación/aceptación, ingeniería de implementación/lanzamiento, rollback/migración de datos, gestión de cambios, gestión de problemas |
| Control | Gestión de incidentes, monitoreo/medición/seguimiento/revisión, soporte de operaciones, informes de servicio |

| Rol | Responsabilidad principal |
|---|---|
| Ingeniero de operaciones | Construye y ofrece servicios de operaciones como API/self-service |
| Ingeniero de software (consumidor) | Usa IaaS/PaaS y servicios de operaciones directamente, sin intermediación de TI |
| Ingeniería de plataforma | Construye y gestiona las capacidades de autoservicio |
| SRE | Supervisa/automatiza/mejora disponibilidad, rendimiento, latencia, seguridad; gestión de cambios y capacidad |

| Estrategia de lanzamiento | Mecanismo |
|---|---|
| Basada en entorno | Implementación en entorno de pruebas paralelo antes de conmutar |
| Basada en aplicación | Interruptores de funciones (feature flags) que habilitan/deshabilitan código vía configuración |
| Canary release | Implementación parcial y temporal, evaluada antes de rollout completo |
| Dark launch | Despliegue sin exposición visible a usuarios, para observar comportamiento real |

## Puntos clave
- Antes de escalar cualquier proceso operativo, pregunta si ya está representado como código (IaC/PaC); si no, esa es la primera brecha a cerrar.
- Desacopla siempre despliegue de lanzamiento — te da la capacidad de mitigar riesgo (canary, feature flags) sin bloquear la entrega continua de código.
- Ensaya rollback y recuperación ante desastres con la misma disciplina que las pruebas funcionales, antes de necesitarlos de verdad.
- Separa gestión de incidentes (resolución puntual) de gestión de problemas (causa raíz) como dos procesos con objetivos y horizontes temporales distintos.
- Adapta el rigor del proceso operativo al tamaño real de la organización; usa perfiles VSE en vez de imponer estándares pensados para grandes empresas.

## Conecta con
- **Construcción de Software**: las operaciones consumen directamente los resultados de integración, compilación, empaquetado y pruebas producidos en construcción.
- **Mantenimiento de Software**: SLAs y gestión de cambios en operaciones se coordinan con el ciclo de mantenimiento del software ya en producción.
- **Pruebas de Software**: TDD y ATDD sustentan las pruebas operativas continuas; las estrategias de pruebas de regresión y cobertura se reutilizan directamente en el pipeline de entrega.
- **Gestión de la Configuración de Software**: los procesos de lanzamiento y control de versiones dependen de las prácticas de gestión de configuración para rastrear qué está desplegado dónde.
- **Gestión de Ingeniería de Software**: la planificación de recursos, dotación de personal y presupuestos de operaciones sigue los mismos principios de gestión de proyecto que el resto de la organización.
- **Seguridad del Software**: DevSecOps integra los controles de seguridad de este KA directamente en el pipeline operativo, no como una fase separada al final.
