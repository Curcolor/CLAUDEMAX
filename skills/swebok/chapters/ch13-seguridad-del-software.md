# Capítulo 13: Seguridad del software

## Idea central
La seguridad se integra en el software mucho más barato de lo que se repara después: hay que incorporarla en cada etapa del ciclo de vida (requisitos, diseño, construcción, pruebas y mantenimiento), no tratarla como una capa añadida al final.

## Marcos que introduce
- **SDLC de seguridad (Ciclo de vida de desarrollo seguro)**: aplica un modelo espiral clásico que considera la seguridad de forma integral en cada fase del ciclo de vida, en vez de como una revisión posterior a la producción.
  - Cuándo usarlo: en cualquier proyecto donde la seguridad sea un requisito de negocio, no solo técnico.
  - Cómo: derivar requisitos de seguridad desde el inicio (casos de uso indebido/abuso, modelado de amenazas), diseñar controles de acceso y criptografía, construir siguiendo reglas de codificación segura, probar con análisis estático y dinámico, y gestionar vulnerabilidades durante el mantenimiento.
- **SSE-CMM (Modelo de Madurez de Capacidades de Ingeniería de Seguridad de Sistemas, ISO/IEC 21827)**: mide la capacidad de los procesos de seguridad de una organización que realiza evaluaciones de riesgo.
  - Cuándo usarlo: para diagnosticar y mejorar la madurez del proceso de seguridad organizacional, no solo del producto.
- **SGSI (Sistema de Gestión de Seguridad de la Información, ISO/IEC 27001:2022)**: plan documentado para establecer, implementar, mantener y mejorar continuamente la gestión de seguridad tecnológica de una organización.
  - Cómo: evaluación de riesgos continua, equipo de TI que monitorea, generación o modificación de requisitos de seguridad del software a partir de hallazgos.
- **Criterios Comunes / CC (ISO/IEC 15408:2022)**: guía para desarrollar, evaluar y adquirir productos de TI con funcionalidad de seguridad, protegiendo contra divulgación, modificación o pérdida de uso no autorizadas (confidencialidad, integridad, disponibilidad).
- **DevSecOps**: integra desarrollo, seguridad y operaciones más allá del SDLC; cultura, automatización y diseño de plataforma para un ciclo de vida tan ágil como CI/CD.
- **10 prácticas de seguridad de software del CERT**: 1) validar la entrada, 2) atender advertencias del compilador, 3) diseñar arquitectura y políticas de seguridad, 4) mantenerlo simple, 5) denegación por defecto, 6) mínimo privilegio, 7) desinfectar datos hacia otro software, 8) defensa en profundidad, 9) usar QA efectivo, 10) adoptar un estándar de codificación segura.
  - Cuándo usarlo: como checklist mínimo en construcción de software (Sección 4.4, Construcción para la seguridad).

## Conceptos clave
- **Seguridad (del producto)**: grado en que un producto protege información y datos según niveles de autorización de quien accede (ISO/IEC 25010).
- **Seguridad de la información**: preserva confidencialidad, integridad y disponibilidad (más autenticidad, no repudio, rendición de cuentas) (ISO/IEC 27000).
- **Ciberseguridad**: mantener el riesgo cibernético (ingeniería social, malware, spyware) a un nivel tolerable (ISO/IEC 27032).
- **Vulnerabilidad**: fallo o debilidad que un atacante puede explotar; se cataloga en bases de datos (CVE, CWE, CAPEC) y se puntúa con CVSS.
- **Patrón de seguridad**: solución genérica bien probada a un problema de seguridad recurrente en un contexto específico.
- **Análisis estático vs. dinámico**: el estático examina código fuente o binarios compilados sin ejecutarlos (detecta patrones/lógica insegura); el dinámico prueba el comportamiento en ejecución (pruebas de penetración, fuzzing).
- **Modelo de amenazas**: técnica de diseño que ilustra cómo se ataca un sistema, para especificar mitigaciones concretas.

## Modelos mentales
- Distingue las dos lecturas de "seguridad en la construcción": (a) que el código en sí sea seguro en su forma de codificarse, vs. (b) que el código implemente funciones de seguridad. La ambigüedad entre ambas es la causa habitual de prácticas débiles; en la práctica el KA se centra en (b).
- Piensa en la seguridad como un problema de negocio, no un problema técnico aislado: la gobernanza de seguridad funciona mejor integrada en la cultura y estructura organizacional que como control externo.
- Usa defensa en profundidad como postura por defecto: ningún control único (ni el análisis estático, ni el pentesting) encuentra todas las vulnerabilidades, especialmente las que solo se manifiestan en estados difíciles de producir.

## Antipatrones
- **Tratar la seguridad como preocupación técnica aislada**: sin patrocinio de negocio, los requisitos de seguridad no sobreviven a las presiones de plazo/costo.
- **Confiar solo en automatización**: las herramientas de análisis estático/binario ayudan pero requieren experiencia humana para configurarlas y verificar resultados; no sustituyen al especialista.
- **Ignorar componentes de terceros**: bibliotecas, COTS y sistemas operativos introducen vulnerabilidades tanto como el código propio.

## Tablas de referencia
| Base de datos | Qué cataloga |
|---|---|
| CVE | Vulnerabilidades y exposiciones comunes identificadas |
| CWE | Enumeración de debilidades (patrones de defecto) comunes |
| CAPEC | Patrones de ataque comunes, clasificados |
| CVSS | Puntuación de severidad/características de una vulnerabilidad |

## Puntos clave
- Deriva requisitos de seguridad desde el inicio del proyecto, no los añadas tras el diseño.
- Usa modelado de amenazas para traducir requisitos de seguridad en decisiones de diseño concretas.
- Combina análisis estático y dinámico/pentesting; ninguno por sí solo es suficiente.
- Convierte la gestión de vulnerabilidades (CVE/CWE/CAPEC/CVSS) en un proceso continuo de mantenimiento, no en un evento único.
- En dominios específicos (nube/contenedores, IoT, sistemas de aprendizaje automático) añade controles propios: activos en la nube "olvidados", endpoints IoT débiles, envenenamiento/evasión de modelos ML.

## Conecta con
- **Calidad del Software**: la seguridad es un atributo de calidad del producto (ISO/IEC 25010).
- **Requisitos de Software**: los requisitos de seguridad se obtienen, priorizan y trazan igual que otros requisitos no funcionales.
- **Pruebas de Software**: las pruebas de seguridad son un tipo específico de prueba, no cubierto por las pruebas funcionales generales.
- **Fundamentos de la Informática**: seguridad de redes, criptografía y sistemas operativos son la base técnica de muchos controles de seguridad.
