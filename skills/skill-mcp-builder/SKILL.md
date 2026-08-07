---
name: skill-mcp-builder
description: "Meta-skill para crear Skills 2.0 y servidores MCP en el ecosistema CLAUDEMAX. Trigger con \"crear skill\", \"nueva skill\", \"create skill\", \"skill 2.0\", \"crear mcp\", \"mcp server\", \"builder\", o al diseñar cualquier herramienta nueva para Claude Code."
---

# Constructor de Skills 2.0 y Servidores MCP

Meta-skill: no resuelve un dominio de negocio, resuelve "¿cómo empaqueto esta capacidad para Claude Code dentro de CLAUDEMAX?". Cubre los dos formatos que usa este repo — la skill declarativa (Skills 2.0) y el servidor MCP en proceso — y cuándo usar cada uno.

## Parte 1 — Crear una Skill 2.0

### Estructura de directorio

Cada skill vive en `skills/<name>/` con exactamente tres archivos:

```
skills/<name>/
├── SKILL.md      # frontmatter (name, description) + cuerpo en Markdown
├── skill.yaml    # metadatos declarativos: version, kind, triggers, deps
└── schema.json   # contrato de entradas/salidas (definitions.inputs/outputs)
```

`<name>` debe coincidir *exactamente* con el nombre del directorio en tres lugares: el `name:` del frontmatter de `SKILL.md`, el `name:` de `skill.yaml`, y la carpeta misma. El validador (`skills/validate-skills.mjs`) rechaza cualquier desalineación.

### Campos de `skill.yaml`

```yaml
name: <name>            # == nombre del directorio
version: 2.0.0           # semver de la skill, no del repo
kind: knowledge|tool      # knowledge = guía/criterio; tool = invoca scripts/commands
triggers:
  - "frase en español"    # cada trigger es bilingüe: una entrada en
  - "phrase in english"   # español y su equivalente en inglés (o "es / en" en una línea)
commands: []              # comandos de shell que la skill expone (kind: tool)
scripts: []                # rutas relativas a scripts que la skill declara y usa
dependencies: []            # nombres de otras skills de las que depende (opcional)
schema: ./schema.json
```

`kind: knowledge` es para skills que aportan criterio y patrones (como esta misma, o `swebok`) — no ejecutan nada, solo cargan contexto. `kind: tool` es para skills que envuelven `scripts`/`commands` reales; en ese caso cada ruta en `scripts` DEBE existir en disco o el validador falla.

### `schema.json`

Contrato mínimo: JSON Schema con `definitions.inputs` y `definitions.outputs`. No hace falta que sea exhaustivo — documenta la forma de lo que la skill espera recibir y producir, útil tanto para quien la invoca como para un futuro wrapper MCP sobre la misma lógica. Ver `skills/skill-mcp-builder/schema.json` como ejemplo mínimo, o `skills/swebok/schema.json` como ejemplo con `enum`.

### Flujo de creación

1. Crea el directorio y los tres archivos siguiendo las plantillas de arriba.
2. Escribe el cuerpo de `SKILL.md` en español; los triggers de `skill.yaml` van en pares español/inglés.
3. Corre `node skills/validate-skills.mjs` hasta que salga `OK (<n> skills)`. Corrige cualquier error que reporte (nombre desalineado, campo faltante, script inexistente, JSON inválido) antes de continuar.
4. Si es una skill first-party que debe instalarse en cada máquina, añade su nombre a `FIRST_PARTY_SKILLS` en `bin/components/dev-skills.sh` (el instalador la copia a `$CLAUDE_CONFIG_DIR/skills/`).
5. Añade su desinstalación al loop de skills de ingeniería en `bin/uninstall.sh` (el mismo `for s in ...` que ya limpia `swebok` y `conventional-commits`).

### Checklist de calidad antes de dar por terminada una skill

- [ ] Cuerpo de `SKILL.md` en español (regla de idioma del repo).
- [ ] Triggers de `skill.yaml` bilingües (español + inglés, no solo uno de los dos).
- [ ] Todo script declarado en `scripts:` existe en disco.
- [ ] `node skills/validate-skills.mjs` termina en `OK`.
- [ ] No duplica contenido ya cubierto por otra skill — si el solape es total, considera fusionar (así absorbió `swebok` a la antigua `architecture-principles`, que a su vez había nacido fusionando tres skills previas).
- [ ] Termina con la línea `Config: skill.yaml · Schema: schema.json` (convención de pie de página de todas las skills del repo).

## Parte 2 — Crear un servidor MCP

### Cuándo un MCP, no una skill

Un MCP registra *tools* invocables dentro de la sesión de Claude Code (aparecen en `claude mcp list`, se llaman con el protocolo MCP). Una skill inyecta *contexto* (instrucciones, criterio, opcionalmente scripts). Si lo que necesitas es que el modelo pueda llamar una función con parámetros tipados y recibir una respuesta estructurada — MCP. Si lo que necesitas es que el modelo sepa *cómo pensar* sobre un problema — skill.

### Patrón canónico: stdio con `@modelcontextprotocol/sdk`

La referencia del repo es `templates/rag/mcp-server.mjs`. Su forma, reducida a lo esencial:

```js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
    { name: "claudemax-rag", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "rag_query",
            description: "Búsqueda semántica sobre la base de conocimiento...",
            inputSchema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Pregunta en lenguaje natural" },
                    topk: { type: "number", description: "Máximo de resultados, por defecto 5" }
                },
                required: ["query"]
            }
        }
    ]
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
    const { name, arguments: a = {} } = req.params;
    // ... despachar a la lógica real y devolver { content: [{ type: "text", text }], isError }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

Las cuatro piezas fijas: `Server` con `name`/`version`, `ListToolsRequestSchema` que enumera tools con `inputSchema` en JSON Schema, `CallToolRequestSchema` que despacha por `name` y devuelve `content: [{ type: "text", ... }]`, y `StdioServerTransport` conectado al final del archivo.

### Regla de oro: el MCP es un wrapper delgado

La lógica de negocio **no** vive en el archivo del MCP. `mcp-server.mjs` no toca la base de datos ni el modelo de embeddings directamente — llama a `rag.mjs` (el CLI) vía `execFile` y traduce su stdout/stderr a la forma que espera el protocolo:

```js
function run(args) {
    return new Promise(resolve => {
        execFile(process.execPath, [RAG, ...args], { timeout: 60000 },
            (err, stdout, stderr) => resolve({ ok: !err, out: stdout || stderr || String(err) }));
    });
}
```

Esto mantiene la lógica testeable y usable fuera de una sesión de Claude Code (el mismo `rag.mjs` sirve desde terminal), y el MCP se reduce a enrutamiento. Si tu MCP nuevo necesita lógica no trivial, escribe primero el CLI y luego el wrapper — nunca al revés.

### Registro y verificación

```bash
claude mcp add -s user <id> -- node <ruta-absoluta-al-server.mjs>
claude mcp list                 # busca "<id>  ✓ Connected"
```

`-s user` lo registra a nivel de usuario (no por-repo). Si `claude mcp list` muestra el id sin el check de conectado, el proceso del servidor está fallando al arrancar — corre el archivo directamente con `node <ruta>` para ver el stack trace.

### Desregistro (para que `bin/uninstall.sh` sea simétrico)

Todo componente que registra un MCP debe des-registrarlo en `bin/uninstall.sh`:

```bash
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove <id> 2>/dev/null || true
fi
```

## Cuándo elegir qué

| Necesitas... | Elige | Por qué |
|---|---|---|
| Que el modelo aplique un criterio, checklist o cuerpo de conocimiento | **Skill** (`kind: knowledge`) | No hay estado ni ejecución — solo contexto cargado bajo demanda por trigger. |
| Que el modelo invoque un comando de shell puntual con argumentos | **CLI** (+ skill `kind: tool` que lo declara en `scripts`) | La lógica queda testeable e invocable fuera de Claude Code; la skill es solo el cableado. |
| Que el modelo tenga una *tool* nativa disponible durante toda la sesión, con `inputSchema` validado por el protocolo | **MCP** | Solo el MCP aparece en `claude mcp list` y se llama como tool de primera clase, sin pasar por texto libre. |

En la práctica, muchas capacidades combinan las tres capas: un CLI con la lógica (`rag.mjs`), un MCP delgado que lo expone como tool (`mcp-server.mjs`), y opcionalmente una skill que documenta cuándo y cómo usarlo.

---

Config: skill.yaml · Schema: schema.json
