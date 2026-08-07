# Fuentes de conocimiento — Empresa de software en Colombia

Inventario de **todo** lo necesario para constituir y operar una empresa de desarrollo de
software en Colombia, y qué parte cubren ya las skills `swebok` y `pmbok` de este repo.

**Fecha de investigación:** 2026-08-07. Las fuentes normativas colombianas cambian; la
columna *Volatilidad* indica cuáles envejecen mal como skill destilada.

> **Aviso de método.** Cada ley, decreto, resolución y norma de esta tabla se verificó
> contra su fuente (`.gov.co`, `iso.org`, `owasp.org`, `scrumguides.org`, `omg.org`). Lo
> que no se pudo confirmar está marcado como **no verificado** — no se rellenó con
> suposiciones. Esto no es asesoría legal ni contable: para constituir la empresa,
> tributar y contratar, la fuente manda y un profesional colombiano decide.

---

## Tabla maestra

| # | Área | ¿SWEBOK / PMBOK? | Fuente exacta | Tipo | Acceso | Volatilidad | ¿Destilar? |
|---|---|---|---|---|---|---|---|
| 1 | Constitución de SAS | ❌ Ninguno toca derecho societario | **Ley 1258 de 2008** | Ley | Gratis | Baja | ✅ Sí |
| 2 | Guía práctica de constitución | ❌ | **"100 preguntas y respuestas sobre la SAS"**, Superintendencia de Sociedades | Cartilla oficial | Gratis (PDF) | Baja | ✅ Sí |
| 3 | RUT · NIT · RUES · matrícula mercantil | ❌ | DIAN (RUT/NIT) · RUES (Confecámaras / Cámaras de Comercio) | Guía de trámite | Gratis | Media | ✅ Sí |
| 4 | Régimen Simple de Tributación | ❌ | **Ley 2010 de 2019** + **Estatuto Tributario, arts. 903-905** | Ley + Estatuto | Gratis | **Alta** (topes UVT anuales) | ⚠️ Con fecha de corte |
| 5 | Renta — régimen ordinario | ❌ | **Estatuto Tributario art. 240**, modificado por **Ley 2277 de 2022** (35% personas jurídicas) | Ley + Estatuto | Gratis | **Alta** | ⚠️ Solo el marco conceptual |
| 6 | IVA en exportación de servicios de software | ❌ | **Estatuto Tributario art. 481 lit. c)** — exención para servicios usados exclusivamente en el exterior, menciona expresamente desarrollo de software | Estatuto | Gratis | Media | ✅ Sí, verificando vigencia |
| 7 | ICA / ReteICA | ❌ | Normativa **municipal** (cada municipio fija tarifas) | Norma municipal | Gratis, fragmentada | Alta | ❌ Demasiado variable |
| 8 | Facturación electrónica | ❌ | **Resolución DIAN 000165 de 2023**, modificada por 000008/2024, 000119/2024, 000189/2024, 000202/2025, 010061/2025 | Resolución | Gratis | **Muy alta** — 4 cambios en un año | ❌ No destilar |
| 9 | Obligaciones laborales | 🟡 PMBOK toca gestión de equipo, sin contenido legal | **Código Sustantivo del Trabajo** (Decreto 2663 de 1950 y compilaciones) | Decreto-ley | Gratis | Baja | ✅ Sí |
| 10 | Seguridad y salud en el trabajo (SG-SST) | ❌ | **Decreto 1072 de 2015** + **Resolución 0312 de 2019** | Decreto + Resolución | Gratis | Media | ✅ Sí |
| 11 | Beneficios "economía naranja" | ❌ | **Ley 1834 de 2017** — ⚠️ **derogada para el sector tecnológico** por la **Ley 2277 de 2022 art. 96**; solo transición para quienes accedieron antes de 2023 | Ley | Gratis | — | ❌ Ya no aplica a empresas nuevas |
| 12 | Protección de datos personales | 🟡 SWEBOK toca privacidad como concepto, no la ley colombiana | **Ley Estatutaria 1581 de 2012** + **Decreto 1377 de 2013** · vigila la **SIC** | Ley + Decreto | Gratis | Baja | ✅ **Imprescindible** |
| 13 | Propiedad intelectual del software | 🟡 SWEBOK lo roza en práctica profesional | **Ley 23 de 1982** + **Decisión Andina 351 de 1993** · registro ante la **DNDA** | Ley + norma andina | Gratis | Baja | ✅ **Imprescindible** |
| 14 | Contratación de software (desarrollo, licencias, SLA, cesión) | 🟡 SWEBOK economía · PMBOK "acuerdos" en su catálogo | Sin ley única: Código Civil / Comercio + Ley 23/1982 para cesión de derechos patrimoniales | Práctica jurídica | Marco gratis; plantillas de pago | Baja | ⚠️ Parcial |
| 15 | Sistema de gestión de calidad | 🟡 SWEBOK la nombra 10 veces, **solo vocabulario** | **ISO 9001:2015** + **ISO/IEC/IEEE 90003:2018** (guía de aplicación a software) | Norma | **Pago** (ISO / ICONTEC) | Baja | ✅ Sí |
| 16 | Calidad de producto software | 🟡 SWEBOK cita 25010 catorce veces, **solo vocabulario** | **ISO/IEC 25010** (modelo de calidad) · 25012 (datos) · 25040 (evaluación) — familia SQuaRE 2500n-2504n | Norma | **Pago** (resumen no oficial gratis en iso25000.com) | Baja | ✅ **El hueco más claro de SWEBOK** |
| 17 | Seguridad de la información | 🟡 SWEBOK cubre conceptos, no el marco de gestión | **ISO/IEC 27001:2022** (requisitos SGSI) + **ISO/IEC 27002:2022** (93 controles) | Norma | **Pago** | Baja | ✅ Sí |
| 18 | Seguridad de aplicaciones | 🟡 SWEBOK alude a vulnerabilidades sin nombrar OWASP | **OWASP Top 10:2025** (finalizado ene-2026, primera revisión mayor desde 2021) · **ASVS** · **SAMM** | Guía de industria | **Gratis** (CC BY 3.0) | Media | ✅ **Mejor relación valor/coste** |
| 19 | Procesos del ciclo de vida | 🟡 SWEBOK lo usa como marco de referencia | **ISO/IEC/IEEE 12207:2017** | Norma | **Pago** | Baja | ⚠️ Se solapa mucho con SWEBOK |
| 20 | Scrum | 🟡 Ambos lo mencionan sin desarrollarlo | **Scrum Guide 2020** (Schwaber & Sutherland) — versión oficial en español | Guía oficial | **Gratis** | Baja | ✅ Trivial de destilar (13 págs.) |
| 21 | UML | 🟡 SWEBOK lo usa como notación | **UML 2.5.1**, especificación OMG | Especificación | **Gratis** | Baja | ✅ Sí |
| 22 | Documentación de producto (PRD / TRD) | 🟡 SWEBOK cubre la SRS formal, no plantillas de industria | *Inspired* (Marty Cagan, Wiley) — **es práctica de industria, no norma** | Libro | Pago | Baja | ⚠️ Marcar como convención |
| 23 | Contabilidad — NIIF para pymes | ❌ | **Decreto 2420 de 2015**, Anexo 2 (Grupo 2) · texto técnico del IASB | Decreto + norma técnica | Decreto gratis; texto IASB con restricciones (no verificado) | Media | ⚠️ Parcial |
| 24 | Modelo de negocio y estrategia | ❌ | *Business Model Generation* (Osterwalder & Pigneur, Wiley 2010) · *Crossing the Chasm* (Geoffrey Moore) | Libro | Pago (~USD 15-25) | Baja | ✅ Sí |
| 25 | Métricas SaaS y pricing | ❌ | **SaaS Metrics 2.0** (David Skok, forentrepreneurs.com) | Guía web | **Gratis** | Baja | ✅ Sí |

Leyenda: ✅ cubierto o recomendado · 🟡 parcial / solo lo menciona · ❌ nada o no aplica

---

## Qué cubren de verdad SWEBOK y PMBOK

**Ninguno de los dos sirve para crear una empresa.** Cubren cómo se construye software y cómo
se dirige un proyecto — no derecho societario, ni tributación, ni contabilidad.

Su aporte a esta lista es el **vocabulario**: el SWEBOK te dice que la fiabilidad y la
seguridad son atributos de calidad "según la ISO/IEC 25010" y que un SGC se define "según
ISO 9001/90003", pero no trae el modelo de calidad ni los requisitos de esas normas. Da los
nombres; el contenido está detrás de un muro de pago.

| Bloque | Cobertura real |
|---|---|
| Ingeniería de software | ✅ SWEBOK, completo |
| Dirección de proyectos | ✅ PMBOK, completo |
| Normas ISO citadas | 🟡 Solo el nombre y una definición suelta |
| Legal, tributario, laboral, societario colombiano | ❌ Cero |
| Contabilidad y finanzas | ❌ Cero |
| Constitución y organización de empresa | ❌ Cero |

---

## Orden recomendado

**1. Gratis y estable — empezar aquí.** Máximo valor, cero coste, no envejecen:
Ley 1258/2008 (SAS), cartilla de Supersociedades, Ley 1581/2012 (datos personales),
Ley 23/1982 + Decisión Andina 351 (propiedad intelectual), Código Sustantivo del Trabajo,
OWASP Top 10:2025, Scrum Guide 2020, UML 2.5.1.

**2. Gratis pero volátil — destilar con fecha de corte visible.** Régimen Simple, renta,
IVA en exportación de servicios, SG-SST. Toda skill de aquí debe abrir advirtiendo de
verificar vigencia antes de usarse.

**3. De pago — comprar según necesidad real.** ISO/IEC 25010 primero (es el hueco más claro
que deja el SWEBOK), luego 27001/27002 si vas a certificarte o a vender a clientes que lo
exijan, y 9001 + 90003 si el objetivo es certificar la organización.

**4. Nunca destilar.** Facturación electrónica (cambió cuatro veces en un año) e ICA
(depende del municipio). Consultar la fuente viva cada vez.

---

## Balance

**≈ 15 fuentes gratuitas** y descargables, candidatas inmediatas a `book-to-skill`.
**≈ 9 de pago**, casi todas normas ISO — que es, no por casualidad, justo donde SWEBOK y
PMBOK dejan el hueco: dan el vocabulario, no el contenido normativo protegido por ISO.

Un matiz sobre la "economía naranja": ese beneficio tributario para software **ya no aplica**
a empresas nuevas desde la Ley 2277 de 2022. Aparece en mucho contenido desactualizado y es
el error más caro que podrías heredar de una fuente vieja.

## Pendiente de verificar

No se confirmó con fuente primaria: precios exactos de las normas ISO; si ICONTEC ya publicó
la adopción colombiana de la ISO/IEC 27001:**2022** (solo se hallaron ediciones 2006 y 2013 en
español); las condiciones de licenciamiento del texto completo de NIIF para pymes del IASB.
