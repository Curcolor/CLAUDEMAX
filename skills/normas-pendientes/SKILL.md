---
name: normas-pendientes
description: "Orientación sobre cuatro normas que este repositorio NO tiene destiladas de fuente real y que por tanto no se pueden consultar con el mismo rigor que swebok, pmbok, iso-calidad o iso-seguridad: ISO/IEC 25010 (modelo de calidad de producto software, product quality model, familia SQuaRE / ISO/IEC 25000, usabilidad, fiabilidad, mantenibilidad, seguridad del producto), ISO/IEC 27002:2022 (guía de implementación de los controles de seguridad del Anexo A de ISO 27001, security controls implementation guidance), ISO/IEC/IEEE 90003:2018 (guía para aplicar ISO 9001 al software) e ISO/IEC 12207:2017 (procesos del ciclo de vida del software, software life cycle processes — la tenemos en PDF pero escaneada sin capa de texto). Cubre qué norma comprar primero (qué norma comprar) según el objetivo del negocio, qué sustitutos gratuitos existen mientras tanto, y cómo incorporar la norma en cuanto se adquiera. Úsala cuando el usuario pregunte por calidad de producto software, controles de seguridad concretos más allá de lo que cubre iso-seguridad, cómo certificar un SGC de software con ISO 9001, o el ciclo de vida normativo del software — y la respuesta correcta es reconocer que la norma no está disponible como fuente en vez de inventar su contenido."
---

# Normas pendientes — orientación sin fuente destilada

## Aviso: el contenido de esta skill NO está verificado contra el texto normativo

Ninguna de las cuatro normas que cubre esta skill ha sido leída ni destilada de su texto oficial: no las tenemos. Todo lo que sigue proviene del conocimiento general del modelo, que puede estar incompleto o desactualizado. **El contenido no está verificado contra el texto normativo**, cualquier cláusula, control o numeración citada abajo puede ser imprecisa, y **para cualquier uso real — certificarse, auditar, cumplir un contrato o responder ante un cliente — hay que comprar la norma** (o, en el caso de 12207, resolver el problema de extracción del PDF que ya se tiene) y verificar cada afirmación contra el original. Esta skill sirve para decidir cuándo hace falta comprar cada norma y qué esperar de ella, no para sustituirla.

## Las cuatro normas

| Norma | Qué resuelve | Por qué la necesitarías | Hueco que deja | Acceso | Prioridad de compra |
|---|---|---|---|---|---|
| **ISO/IEC 25010** (SQuaRE / ISO/IEC 25000) | Modelo de calidad de un producto software, no del proceso que lo construye | Requisitos no funcionales con vocabulario estándar; evaluar calidad de un producto ya construido | `[[swebok]]` la cita 14 veces como vocabulario, sin reproducirla; `[[iso-calidad]]` gestiona el proceso, no el producto | De pago | Alta si vendes a clientes que piden criterios de calidad explícitos |
| **ISO/IEC 27002:2022** | Guía de implementación de los 93 controles del Anexo A de ISO 27001 | Saber *cómo* implementar un control, no solo que debe existir | `[[iso-seguridad]]` la declara laguna explícita: cubre el SGSI y el catálogo, no el "cómo" | De pago | Alta si estás implementando o auditando un SGSI 27001 |
| **ISO/IEC/IEEE 90003:2018** | Mapeo de las cláusulas de ISO 9001 a prácticas de ingeniería de software | Certificar un SGC 9001 en una empresa de software sin adivinar la interpretación | `[[iso-calidad]]` la menciona como no disponible | De pago | Media-alta solo si el objetivo es certificar 9001 para software |
| **ISO/IEC 12207:2017** | Procesos del ciclo de vida completo del software | Ciclo de vida formal con vocabulario y procesos estandarizados | `[[iso-calidad]]` la menciona pendiente; `[[swebok]]` (área 10) cubre terreno similar sin ser norma | **Caso aparte**: la tenemos en PDF, escaneada sin capa de texto (0 palabras extraíbles) | No aplica comprarla — el problema es de extracción, no de acceso |

## ISO/IEC 25010 — calidad de producto software

Da vocabulario común para la calidad de un producto ya construido o en diseño. Según su estructura conocida organiza la calidad en un conjunto de características y subcaracterísticas, más un modelo separado de calidad en uso — no se listan aquí con numeración porque no se pueden verificar contra el texto vigente; cualquier lista exacta debe salir de la norma comprada.

Resuelve lo que `[[iso-calidad]]` no resuelve: 9001 certifica que el *proceso* de gestión es sólido, no que el *producto* tenga propiedades técnicas concretas — una empresa con SGC impecable puede seguir entregando software lento o poco mantenible si nunca lo definió como requisito. `[[swebok]]` habla de calidad del software como cuerpo de conocimiento, no como norma con vocabulario certificable.

La necesitas de verdad cuando un contrato o RFP cita "ISO 25010" explícitamente, o cuando hace falta vocabulario que un auditor externo reconozca. No la necesitas si el objetivo es solo mejorar calidad interna del código: las prácticas de `[[swebok]]` ya bastan sin pagar por la norma. Complementa a `[[swebok]]` (técnicas) y `[[iso-calidad]]` (sistema de gestión alrededor del producto).

## ISO/IEC 27002:2022 — guía de implementación de controles

Es el manual de "cómo" que le falta al Anexo A de 27001. `[[iso-seguridad]]` ya cubre, con fuente real, que existen 93 controles en cuatro temas y qué exige cada uno a nivel de gestión — pero no el procedimiento técnico para implementarlo, y lo declara laguna propia.

Resuelve la diferencia entre saber que "debe existir" un control y saber cómo diseñarlo e implementarlo con ejemplos razonables para el tamaño de la organización. La necesitas de verdad cuando ya decidiste qué controles aplican (Declaración de Aplicabilidad) y toca implementarlos uno a uno, o cuando un auditor pide evidencia de que el control se implementó siguiendo una guía reconocida. No la necesitas si aún estás en fase de evaluación de riesgos o alcance del SGSI: eso ya lo cubre `[[iso-seguridad]]`. Para seguridad de aplicaciones concreta, OWASP suele ser más práctico (ver alternativas abajo). Complementa directamente a `[[iso-seguridad]]`.

## ISO/IEC/IEEE 90003:2018 — ISO 9001 aplicada al software

Traduce las cláusulas genéricas de 9001 (que hablan de "producto o servicio" en abstracto) a términos de desarrollo de software: qué significa diseño y desarrollo controlado, trazabilidad de salidas o control de proveedores externos cuando el producto es código. No es certificable por sí misma — la certificación sigue siendo contra 9001; 90003 es guía de interpretación.

Resuelve lo que `[[iso-calidad]]` señala como laguna propia: sin 90003, aplicar 9001 a software exige interpretar cada cláusula por analogía, con riesgo de que un auditor no comparta esa interpretación. La necesitas de verdad si el objetivo concreto es certificar (o preparar la certificación de) un SGC 9001 en una empresa cuyo producto principal es software. No la necesitas para mejora interna sin buscar certificación: `[[swebok]]` ya da estructura suficiente. Complementa a `[[iso-calidad]]`.

## ISO/IEC 12207:2017 — caso aparte: la tenemos, pero no se pudo extraer

A diferencia de las otras tres, el problema no es de acceso: el PDF está en el repositorio, pero es una copia escaneada sin capa de texto (0 palabras extraíbles con las herramientas normales), así que `[[book-to-skill]]` no tiene nada que procesar. Su contenido normativo — procesos de acuerdo, organización, proyecto y técnicos, de la adquisición a la disposición final del software — sigue tan desconocido para este repositorio como el de las otras tres.

La solución no es comprar de nuevo la norma sino resolver la extracción: pasar el PDF por OCR (por ejemplo combinando `pypdf` con una herramienta de OCR si el texto sigue sin aparecer) o conseguir una copia con capa de texto nativa. Resuelto eso, el flujo de incorporación es el mismo que para las otras tres. Mientras tanto, `[[swebok]]` (área 10, proceso de ingeniería de software) cubre terreno conceptual similar, pero como práctica, no como norma con procesos formalmente definidos.

## Orden de compra recomendado

No hay un orden único: depende del objetivo.

- **Vender a clientes que exigen certificación**: prioriza **27002** si la certificación en curso es de seguridad (27001) — convierte una Declaración de Aplicabilidad en controles realmente auditables. Prioriza **90003** si es de calidad (9001) y el producto es software.
- **Mejorar calidad interna** sin presión externa: prioriza **25010** — da vocabulario para requisitos no funcionales y evaluación de producto sin necesidad de certificarte en nada.
- **Certificarse formalmente**: el orden depende de qué certificación se persigue — 27002 si es 27001, 90003 si es 9001 para software. 25010 rara vez es exigida de forma aislada por un certificador; suele aparecer como referencia contractual, no como certificación en sí.
- **12207** no compite en esta cola: es un problema de extracción a resolver aparte, no de presupuesto.

## Cómo incorporarla cuando la consigas

En cuanto compres (o resuelvas la extracción de) cualquiera de estas cuatro normas, el camino es `[[book-to-skill]]`: su flujo de extracción, capítulos, glosario y cheatsheet, con el mismo rigor que `[[swebok]]` o `[[iso-calidad]]`. Como regla de tamaño: si el texto fuente supera aproximadamente **20.000 tokens**, usa el flujo completo con capítulos separados bajo demanda; por debajo de eso, una skill con todo el contenido en un único `SKILL.md` a mano suele bastar.

Una vez la nueva skill exista y pase `node skills/validate-skills.mjs`, **elimina la entrada correspondiente de esta skill** (fila de la tabla, sección propia, referencias cruzadas que ya no apliquen). Si se resuelven las cuatro, esta skill queda vacía y puede retirarse del catálogo.

## Alternativas gratuitas mientras tanto

Ninguna sustituye a la norma — son parches parciales para no quedarse sin nada mientras se decide comprar:

- **25010**: el resumen público de [iso25000.com](https://iso25000.com) describe el modelo de forma divulgativa y gratuita. Sirve para una idea general; no sirve para citar en contrato o auditoría ni para verificar numeración exacta de subcaracterísticas.
- **27002**: OWASP (Top 10, ASVS, Testing Guide) y los CIS Controls cubren buena parte del terreno técnico de seguridad de aplicaciones e infraestructura, gratis y con detalle. No sustituyen a 27002 porque no están organizados alrededor de los 93 controles del Anexo A ni cubren los controles no técnicos (organizacionales, de personas, físicos) — son complementarios, no equivalentes.
- **90003**: no hay sustituto gratuito directo. Lo más cercano es aplicar `[[swebok]]` a mano sobre las cláusulas de `[[iso-calidad]]`, sin la garantía de que un auditor externo acepte esa interpretación.
- **12207**: no es un problema de norma cerrada de pago sino de extracción; el sustituto de facto mientras se resuelve es `[[swebok]]` (área 10).

## Relación con otras skills

- **`[[iso-calidad]]`** y **`[[iso-seguridad]]`** declaran explícitamente las lagunas que esta skill documenta — de ahí que ambas sean `dependencies` en `skill.yaml`.
- **`[[swebok]]`** es el sustituto de conocimiento técnico general más cercano para las cuatro, sin ser nunca equivalente a la norma.
- **`[[book-to-skill]]`** es el camino de salida de esta skill: en cuanto una norma deje de estar pendiente, se destila con esa skill y desaparece de aquí.

---

Config: skill.yaml · Schema: schema.json
