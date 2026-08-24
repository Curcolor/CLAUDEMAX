# Cheatsheet — iso-hse

Reglas de decisión para una empresa de software que se pregunta qué exigen realmente ISO 14001 y ISO 45001, cuándo certificarse tiene sentido comercial, y cómo se integran con la 9001 y con el SG-SST colombiano. No es glosario — para definiciones, usa `glossary.md`.

## Qué exige de verdad una empresa de oficina — por norma

| Elemento | ISO 14001 (ambiental) | ISO 45001 (SyST) |
|---|---|---|
| Diagnóstico obligatorio (cláusula 4) | Sí, aunque el contenido real es corto: energía, residuos electrónicos, proveedor cloud | Sí, con contenido sustancial: riesgo psicosocial, ergonomía, trabajo remoto |
| Política formal (cláusula 5) | Documento con 3 compromisos obligatorios (protección, cumplimiento legal, mejora continua) | Documento con compromisos adicionales: eliminar peligros, consulta y participación de trabajadores |
| Identificación central (cláusula 6.1.2) | Aspectos ambientales — mayoría no aplica sin planta física ni sustancias peligrosas | Identificación de peligros — aplica de lleno, incluye explícitamente factores psicosociales |
| Herramienta operativa central (cláusula 8) | Control operacional sobre procesos — poco contenido en oficina pura | Jerarquía de controles (8.1.2) — aplica con literalidad a carga de trabajo y aislamiento remoto |
| Volumen de hallazgos esperable en 9-10 | Bajo: pocas no conformidades ambientales reales | Medio-alto: incidentes psicosociales, ergonómicos, quejas |

**Regla de decisión**: si la empresa tiene que elegir cuál implementar primero por recursos limitados, la 45001 aporta más valor de gestión real a una oficina de desarrollo que la 14001 — hay más riesgo genuino que gestionar en seguridad y salud psicosocial/ergonómica que en impacto ambiental de una oficina sin planta industrial.

## Cuándo certificarse tiene sentido comercial y cuándo es gasto

- **Certifica 14001 si**: un cliente o licitación exige el certificado explícitamente (frecuente en contratos con sector público o multinacionales con política de proveedores responsables), o la empresa vende servicios de consultoría/auditoría ambiental donde el certificado es señal de credibilidad ante el propio mercado.
- **No certifiques 14001 si**: el objetivo es solo "hacer lo correcto" ambientalmente — eso se logra con buenas prácticas de consumo energético y disposición de electrónicos sin pagar el costo de auditoría externa y mantenimiento del certificado; el contenido normativo que no aplica a una oficina (vertidos, emisiones, sustancias peligrosas) sigue generando carga documental aunque se declare "no aplicable" con justificación.
- **Certifica 45001 si**: la empresa ya tiene o va a tener el SG-SST obligatorio del Decreto 1072 (ver abajo) y quiere ir más allá del mínimo legal — por ejemplo, para atraer talento senior con una cultura de bienestar verificable, o porque un cliente corporativo lo exige como requisito de proveedor.
- **No certifiques 45001 si**: el SG-SST legal (Decreto 1072) ya está implementado con solidez y no hay presión comercial ni de talento que justifique el costo adicional de una certificación externa — la 45001 es voluntaria y el Decreto 1072 no exige el certificado ISO, solo el sistema de gestión.
- **Tell de que falta madurez, no certificación**: si el SG-SST legal tiene hallazgos recurrentes en su auditoría anual obligatoria, certificar 45001 encima no resuelve el problema — hay que estabilizar el sistema legal antes de perseguir el estándar voluntario más exigente.

## Cómo se integran 14001 y 45001 con la 9001 (estructura de alto nivel)

Las tres normas (9001, 14001, 45001) comparten el **Anexo SL** — la misma estructura de diez cláusulas de alto nivel (contexto, liderazgo, planificación, apoyo, operación, evaluación del desempeño, mejora) y varios términos comunes (parte interesada, información documentada, no conformidad, acción correctiva, revisión por la dirección). Esto es lo que hace viable un **sistema de gestión integrado**:

- **Se puede fusionar sin duplicar**: el diagnóstico de contexto (cláusula 4), la política (cláusula 5, aunque cada norma exige compromisos propios), la revisión por la dirección (cláusula 9.3) y buena parte de la información documentada (cláusula 7.5) pueden vivir en un solo ciclo de gestión que cubra las tres normas a la vez, con secciones específicas por disciplina donde el contenido diverge.
- **No se puede fusionar sin más**: el contenido técnico de la cláusula 6.1.2 es distinto en cada norma — aspectos ambientales (14001) no es lo mismo que peligros y riesgos para SyST (45001) ni que riesgos y oportunidades para la calidad del producto/servicio (9001, cláusula 6.1). Cada disciplina necesita su propio proceso de identificación, aunque comparta el formato del registro.
- **Auditoría interna combinada**: ISO 19011 (ver `[[iso-calidad]]`) permite explícitamente auditorías combinadas de dos o más disciplinas en una sola visita — reduce el costo de mantener tres programas de auditoría separados.
- **Umbral práctico para una empresa de 5-20 personas**: si ya se implementó 9001 con solidez, añadir 14001 y/o 45001 sobre la misma estructura de revisión por la dirección y de información documentada tiene un costo incremental bajo — el costo alto está en el contenido técnico nuevo (identificación de peligros, aspectos ambientales), no en la estructura de gestión.

## Cómo se integra la 45001 con el SG-SST del Decreto 1072 (Colombia)

- **El SG-SST es obligatorio; la 45001 es voluntaria**: toda empresa colombiana con trabajadores, sin importar el tamaño, debe implementar el SG-SST del Decreto 1072 — no es opcional ni depende de certificarse. La 45001 nunca sustituye esa obligación legal; es un estándar adicional y más exigente que una empresa puede adoptar encima del SG-SST.
- **Comparten el mismo ciclo PHVA**: el Decreto 1072 define el SG-SST explícitamente como un proceso PHVA (política, evaluación inicial y plan de trabajo anual → ejecución e identificación de peligros → indicadores y auditoría → revisión por la alta dirección y mejora) — es el mismo armazón que las cláusulas 4-10 de la 45001, lo que facilita usar la 45001 como marco de referencia para robustecer un SG-SST que ya existe por obligación legal.
- **La 45001 exige más de lo que exige el Decreto 1072 en participación de trabajadores**: la 45001 formaliza consulta y participación (cláusula 5.4) con más detalle normativo que el decreto, que se limita a exigir la existencia y funcionamiento de COPASST o Vigía.
- **La jerarquía de controles es el mismo estándar en ambas fuentes**: el Decreto 1072 exige explícitamente entregar EPP sin costo cuando la jerarquía de controles lo requiera (eliminación → sustitución → controles de ingeniería → controles administrativos → EPP) — es literalmente la misma jerarquía de la cláusula 8.1.2 de la 45001, lo que confirma que ambos marcos son compatibles en su lógica de prevención.
- **Decisión práctica**: si la empresa ya tiene el SG-SST legal implementado y auditado sin hallazgos mayores recurrentes, adoptar la estructura de la 45001 (sin necesariamente certificarse) es una forma de madurar el sistema sin partir de cero — muchos de los procesos exigidos por el decreto (política, matriz de peligros, plan de trabajo anual, investigación de incidentes) ya satisfacen buena parte del contenido de las cláusulas 5-10 de la 45001.
- Para el detalle legal completo del SG-SST (documentos obligatorios, calendario de obligaciones, multas), consulta `[[legal-colombia]]`.

## Señales de alerta (tells) de un sistema HSE de papel

- La política ambiental o de SyST no puede explicarse en una frase por personal de nivel operativo.
- La identificación de peligros o aspectos ambientales se hizo una sola vez al implementar el sistema y nunca se actualizó pese a cambios organizacionales (nuevo modo de trabajo remoto, nueva oficina, nuevo proveedor cloud).
- Existen registros de "consulta a los trabajadores" que en realidad fueron comunicados informativos sin búsqueda real de opinión antes de decidir.
- Los incidentes psicosociales (burnout, conflicto, sobrecarga) no se investigan con el mismo rigor formal que un incidente físico, pese a que la 45001 los cubre igual.
- La revisión por la dirección es un trámite de aprobación de acta, sin decisiones documentadas sobre recursos o cambios al sistema.
- El sistema fue diseñado copiando la plantilla de una empresa industrial, sin adaptar el contenido de aspectos ambientales o peligros a lo que realmente aplica a una oficina.
