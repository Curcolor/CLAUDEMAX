---
name: book-to-skill
description: "Convierte un libro, manual o norma (PDF, EPUB, DOCX, HTML, Markdown, texto plano, RTF, MOBI/AZW) en una skill de Claude Code consultable por capítulo, en vez de recargar el documento completo en cada sesión. Palabras clave: convertir libro en skill, destilar PDF, generar skill desde documento, crear skill de un libro, book to skill, distill book, PDF to skill, generate skill from document, EPUB to skill. Documenta un bug real de extracción de PDF (mojibake silencioso que pasa como 'OK') hallado al procesar el SWEBOK v4 en español, con el fix recomendado usando pypdf. Úsala cuando el usuario quiera trocear un libro técnico o de texto en capítulos destilados más glosario, catálogo de patrones y cheatsheet de decisión, y luego adaptar esa salida al formato Skills 2.0 de este repo."
---

# Book-to-Skill — destilar un libro en una skill

## Qué hace y cuándo usarla

Convierte un libro, manual, norma o cualquier documento largo en una skill consultable por capítulo: en vez de recargar el PDF completo en el contexto cada vez que el usuario pregunta algo del libro, la skill generada carga solo el capítulo o archivo de referencia relevante. El resultado no es un resumen — es un toolkit con marcos nombrados, conceptos clave, antipatrones y reglas de decisión que un agente puede usar repetidamente sin volver a leer el documento fuente.

Úsala cuando el usuario pida "convierte este libro en una skill", "destila este PDF", "genera una skill de este manual", o traiga un documento técnico/de referencia que quiere poder consultar desde Claude Code sin pagar el costo de tokens de recargarlo cada sesión.

## Requisitos previos

```bash
git clone https://github.com/virgiliojr94/book-to-skill.git
cd book-to-skill
pip install .
pip install pypdf   # necesario para el Paso 1 — ver advertencia abajo
```

El proyecto original acepta: `.pdf`, `.epub`, `.docx`, `.txt`, `.md`, `.markdown`, `.rst`, `.adoc`, `.html`, `.htm`, `.rtf`, `.mobi`, `.azw`, `.azw3` (los dos últimos requieren Calibre instalado).

---

## Paso 1 — Extracción

### ⚠️ Advertencia: el bug de mojibake silencioso

La cadena de extracción de PDF del proyecto original elige `pdftotext` y **no valida la salida**. En `book_to_skill/utils.py:546` hace:

```python
text = extract_with_pdftotext(...)
if text:          # solo comprueba que no esté vacía, NO que sea válida
    ...            # nunca cae al fallback pypdf
```

Lo probamos con el SWEBOK v4 en español (413 páginas). `pdftotext` devolvió mojibake en las 413 páginas — todos los acentos rotos (`versi�n`, `p�gina`, `c�digo`) — y como el string no estaba vacío, el chequeo `if text:` pasó y el pipeline reportó "OK". `pypdf` nunca llegó a ejecutarse como fallback.

**Consecuencia añadida:** con el texto corrupto, la detección de capítulos también falló — encontró 3 capítulos de 18 reales y ningún índice, porque los patrones de encabezado (`CAPÍTULO N`) tampoco calzaban contra el texto roto.

Este bug no es exclusivo del español: cualquier documento con acentos, diéresis, eñes, u otros caracteres no-ASCII en el idioma fuente puede sufrir la misma corrupción silenciosa. Si tu documento está en inglés puro sin caracteres especiales, es menos probable que lo notes — pero igual conviene verificar.

### Solución recomendada: extraer con pypdf directamente

Para documentos en español (o cualquier idioma con acentos), no confíes en el reporte "OK" del pipeline por defecto. Extrae con `pypdf` directamente:

```python
"""Extrae texto de un PDF con pypdf — evita el mojibake silencioso de la
cadena por defecto de book-to-skill (ver advertencia arriba)."""
import json
import re
from pathlib import Path
from pypdf import PdfReader

PDF = Path("<ruta-al-documento.pdf>")
SALIDA = Path("<tempdir>/book_skill_work")
SALIDA.mkdir(parents=True, exist_ok=True)

lector = PdfReader(str(PDF))
paginas = []
for i, pagina in enumerate(lector.pages):
    try:
        paginas.append(pagina.extract_text() or "")
    except Exception as e:  # una página rota no debe tumbar la extracción entera
        print(f"  aviso: página {i + 1} falló ({e})")
        paginas.append("")
    if (i + 1) % 100 == 0:
        print(f"  {i + 1}/{len(lector.pages)} páginas")

texto = "\n\n".join(paginas)
(SALIDA / "full_text.txt").write_text(texto, encoding="utf-8")

# Ajusta el patrón al encabezado real del documento: "CAPÍTULO N", "Chapter N",
# "PARTE N", numeración propia de la norma, etc.
encabezados = re.findall(
    r"^\s*(?:CAP[IÍ]TULO|CHAPTER)\s+(\d+)\s*$", texto, re.MULTILINE | re.IGNORECASE
)
palabras = len(texto.split())

meta = {
    "source_file": str(PDF),
    "extraction_method": "pypdf (manual — la cadena por defecto puede producir mojibake sin avisar)",
    "pages": len(lector.pages),
    "words": palabras,
    "estimated_tokens": int(palabras * 1.33),
    "chapters_detected": len(set(encabezados)),
}
(SALIDA / "metadata.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"OK — {len(lector.pages)} páginas, {palabras:,} palabras, ~{int(palabras * 1.33 / 1000)}K tokens")
print(f"Capítulos detectados: {len(set(encabezados))} → {sorted(set(encabezados), key=int)}")
con_acentos = sum(1 for ln in texto.split("\n") if re.search(r"[áéíóúñÁÉÍÓÚÑ]", ln))
print(f"Líneas con acentos correctos: {con_acentos:,}")
```

Con el SWEBOK esto dio 18 capítulos detectados y 17.594 líneas con acentos correctos — contra los 3 capítulos y 0 líneas legibles que salieron con el pipeline por defecto.

### Verifica ANTES de continuar al Paso 2

No avances al troceo por capítulo sin confirmar que la extracción salió bien. Dos chequeos rápidos, en este orden:

1. **Cuenta líneas con acentos** (documentos en español/idiomas con tildes): `grep -c "[áéíóúñÁÉÍÓÚÑ]" full_text.txt`. Un resultado de `0` en un documento que debería tener acentos es la señal más clara de mojibake. Para documentos sin acentos, busca en su lugar el carácter de reemplazo Unicode: `grep -c "�" full_text.txt` — cualquier valor > 0 indica corrupción.
2. **Cuenta capítulos detectados** y compáralo contra el número real (mira el índice/tabla de contenidos del documento si existe). Si detectaste 3 de 18, el problema casi siempre está en el texto de origen, no en el patrón de regex.

Si cualquiera de los dos falla, no sigas con el resultado del pipeline por defecto — repite la extracción con el script pypdf de arriba.

---

## Paso 2 — Trocear por capítulo

Enfoque: **un archivo por capítulo o sección mayor**, nunca un solo archivo monolítico con todo el libro destilado.

```bash
mkdir -p chapters
```

Para documentos grandes (más de ~50K tokens estimados), no cargues `full_text.txt` completo en el contexto para ubicar cada capítulo. Usa grep para encontrar los offsets de línea de cada encabezado y `sed`/lectura con offset para extraer solo la porción que necesitas:

```bash
wc -w full_text.txt                                   # tamaño antes de decidir estrategia
grep -n -E "^\s*(CAP[IÍ]TULO|CHAPTER)\s+[0-9]+" full_text.txt   # offsets de cada capítulo
sed -n '<inicio>,<fin>p' full_text.txt                 # solo el capítulo N
```

Un libro de 200 páginas son ~75K tokens; releerlo completo una vez por capítulo (18–28 pasadas) cuesta millones de tokens de entrada. Extraer solo la porción relevante mantiene el costo proporcional a la salida, no a la fuente completa.

---

## Paso 3 — Destilar cada capítulo

Crea `chapters/ch<NN>-<slug>.md` para cada capítulo, con esta plantilla **exacta** de secciones:

```markdown
# Capítulo N: <Título completo>

## Idea central
<1–2 frases: lo único más importante que enseña este capítulo>

## Marcos que introduce
- **<Nombre del marco>**: <formulación exacta — conserva el nombre que usa el autor>
  - Cuándo usarlo: <situación específica>
  - Cómo: <pasos o criterios>

## Conceptos clave
- **<Término>**: <definición precisa en una frase>
(5–10 términos más importantes de este capítulo)

## Modelos mentales
<2–4 marcos o herramientas de pensamiento. Escribe como "Usa X cuando Y" o "Piensa en X como Y">

## Antipatrones
- **<Qué evitar>**: <por qué falla>

## Tablas de referencia
<!-- Reproduce en Markdown cualquier matriz comparativa, tabla de parámetros
     o tabla de decisión que traiga el capítulo. -->

## Puntos clave
1. <Idea accionable>
2. <Idea accionable>
3. <Idea accionable>
(3–7 puntos que un practicante debe recordar)

## Conecta con
- **Cap N**: <por qué se relaciona este capítulo>
- **<Concepto>**: <concepto externo o norma con la que conecta>
```

Reglas al llenar la plantilla:
- **Preserva la precisión del autor.** "Los 5 porqués" no es intercambiable con "preguntar por qué varias veces" — conserva el nombre exacto que usa la fuente.
- **Densidad, no relleno.** Un capítulo de 800–1.200 tokens bien destilado vale más que uno de 4.000 con paja.
- **Nunca copies texto crudo del documento** — todo debe pasar por síntesis, aunque el ejemplo original sea muy bueno; reconstrúyelo compacto en tus propias palabras.

Dos secciones adicionales son opcionales según el tipo de documento (no forman parte de la plantilla base de 8 secciones de arriba): `## Ejemplos de código` para documentos técnicos con snippets instructivos, y `## Ejemplo trabajado` cuando el usuario pidió profundidad de estudio y no solo referencia rápida — reservado para reconstruir un caso concreto que el autor desarrolla paso a paso.

---

## Paso 4 — Ensamblar

Cuatro archivos de nivel superior en la raíz de la skill (junto a `chapters/`):

### `SKILL.md` — el archivo crítico
Trae el **índice de temas navegable por pregunta**, no por nombre de capítulo. Esto es lo que hace o deshace la utilidad de la skill: el agente que la use no sabe en qué capítulo vive "cómo elijo entre TDD y BDD" — necesita una tabla `pregunta/tema → capítulo`. Mira `skills/swebok/SKILL.md` de este mismo repo como referencia real: su "Índice de temas" mapea decenas de preguntas concretas a `chNN`, no una tabla de contenidos genérica.

Además de ese índice: marcos transversales más importantes (2.000 tokens aprox.), tabla de capítulos, y enlaces a los tres archivos de soporte.

### `glossary.md`
Todos los términos significativos del documento, orden alfabético, formato `**Término** — definición (Cap N)`.

### `patterns.md`
Todas las técnicas, algoritmos o patrones concretos del documento, agrupados por tema, formato `## Nombre del patrón` + `**Cuándo usarlo**` + `**Cómo**` + `**Trade-offs**`.

### `cheatsheet.md` — reglas de decisión, NO glosario
Esta es la distinción que más se incumple al generar estos archivos: el cheatsheet **no es un glosario resumido**. El glosario ya cubre "qué significa X". El cheatsheet captura el *criterio* del autor — la lógica if/then que aplicaría, para que el lector actúe como el autor sin releer el libro. Prioriza, en este orden:

1. **Reglas de decisión** — "Si X, haz Y, porque Z."
2. **Árboles de decisión** para elecciones con más de dos ramas.
3. **Matrices de trade-off** — opciones en competencia puntuadas en las dimensiones que le importan al autor.
4. **Umbrales y valores por defecto** — los números concretos que el autor se compromete a dar.
5. **Señales de alerta ("tells")** — heurísticas rápidas para reconocer una situación.

Si una línea del cheatsheet es solo `**Término** — definición`, va en el glosario, no aquí.

---

## Paso 5 — Adaptar a Skills 2.0

El `SKILL.md` que genera el proyecto original **no trae `skill.yaml` ni `schema.json`** — nace para un ecosistema cross-agent (Copilot CLI, Amp, Claude Code) que solo exige frontmatter `name` + `description`. Para que la skill generada funcione como Skills 2.0 dentro de este repo, hay que añadir manualmente las dos piezas que faltan. Remite a `[[skill-mcp-builder]]` para el procedimiento completo; en resumen:

1. Copia/mueve la carpeta generada a `skills/<slug>/` dentro de CLAUDEMAX.
2. Crea `skill.yaml`: normalmente `kind: knowledge` (el libro destilado aporta criterio, no ejecuta nada), `version: 2.0.0`, `commands: []`, `scripts: []`, `dependencies:` si la skill se apoya en otra (p. ej. `skill-mcp-builder`), `schema: ./schema.json`.
3. Crea `schema.json` con `definitions.inputs`/`definitions.outputs` mínimos — normalmente una `consulta` de entrada y una `respuesta` + `fuente` (ruta del capítulo) de salida. Usa `skills/swebok/schema.json` como plantilla.
4. **Cura los triggers a mano.** El generador no produce `triggers:` — tienes que leer el `SKILL.md` resultante (título, marcos principales, temas del índice) y escribir tú los disparadores, en pares español/inglés, siguiendo el patrón de `skills/swebok/skill.yaml` (`"requisitos / requirements / elicitación"`).
5. Corre `node skills/validate-skills.mjs` y corrige lo que reporte.

---

## Reglas de calidad

1. **Extrae estructura, no resúmenes** — marcos con nombre, formulaciones exactas, antipatrones; no un recap de capítulo.
2. **Preserva la precisión del autor** — "Los 5 porqués" ≠ "preguntar por qué varias veces"; conserva el nombre exacto.
3. **Densidad sobre completitud** — un resumen de 1.000 tokens vale más que un extracto de 10.000.
4. **Voz de practicante** — escribe "Usa X cuando Y", no "El libro explica X".
5. **El contenido más importante va primero en `SKILL.md`** — si algo compacta o trunca el archivo, lo hace desde el final.
6. **Los archivos de capítulo son bajo demanda** — no cuentan contra el presupuesto de la skill hasta que se cargan.
7. **Nunca copies texto crudo del documento** — siempre sintetiza, resume, extrae la señal.
8. **El índice de temas es crítico** — es cómo el agente navega al archivo de capítulo correcto.

## Presupuestos de tokens

Presupuesto objetivo por archivo de capítulo, según tipo de documento y profundidad pedida (no son topes duros — un capítulo denso puede pasarse, uno delgado puede quedar corto; la densidad manda sobre el número):

| | `profundidad=reference` | `profundidad=study` |
|---|---|---|
| `tipo_libro=text` | 800–1.200 tokens | 1.000–1.800 tokens |
| `tipo_libro=technical` | 1.200–1.800 tokens | 2.000–3.000 tokens |

`reference` = solo lo listo-para-decidir, sin ejemplos trabajados. `study` se gana con contenido concreto (un ejemplo trabajado, el "cómo" expandido en pasos explícitos), no rellenando prosa.

## Nota legal

El procesamiento ocurre localmente (tu máquina, con las librerías que instalaste) — el documento fuente no se sube a ningún servicio de terceros como parte de esta skill. La salida de `book-to-skill` son **notas sintetizadas**: definiciones propias, marcos reformulados, estructura extraída — nunca una reproducción del texto original. No redistribuyas una skill generada a partir de una obra con copyright ajeno sin permiso del titular de los derechos; lo que es razonable conservar para uso personal (notas de estudio) no necesariamente es razonable publicar.

## Ejemplo real

Procesamos el SWEBOK v4 en español (413 páginas, ~278K tokens) con este flujo completo, incluyendo el fix de extracción documentado arriba. Resultado: 18 capítulos destilados en `chapters/` más los 4 archivos de nivel superior (`SKILL.md`, `glossary.md`, `patterns.md`, `cheatsheet.md`). Esa salida es la skill `[[swebok]]` de este mismo repo — revísala como referencia de lo que produce este proceso bien ejecutado, especialmente su índice de temas y la separación cheatsheet/glosario.

---

Adaptado de [`virgiliojr94/book-to-skill`](https://github.com/virgiliojr94/book-to-skill) (MIT).

Config: skill.yaml · Schema: schema.json
