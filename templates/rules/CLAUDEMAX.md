<!--
    Este archivo lo instala CLAUDEMAX (componente `rules`, ver bin/components/rules.sh).
    Fuente de verdad: templates/rules/CLAUDEMAX.md del repo y el spec
    docs/superpowers/specs/2026-09-13-reglas-contexto-design.md. No lo edites a mano en
    `<RAG_ROOT>/.claude/CLAUDEMAX.md` — se pisa en cada reinstalación. El contexto de cada
    proyecto NO va aquí: va en `.claude/proyectos/<nombre>.md` (regla 6), que es tuyo.
-->

# Reglas operativas de CLAUDEMAX

Estas reglas aplican a cualquier sesión de Claude Code lanzada dentro de este workspace, en la
raíz o en cualquiera de sus repos. Son imperativas: cúmplelas salvo que el usuario te pida
explícitamente lo contrario en la conversación.

## 1. Idioma

Todo el contenido en español: documentación, comentarios de código, mensajes al usuario,
subject y body de los commits. Las skills se escriben en modo bilingüe (metadata y
triggers en inglés para que el matching funcione, cuerpo explicativo en español cuando
sea posible). Los identificadores de código (nombres de variables, funciones, clases) y
los tipos de Conventional Commits (`feat`, `fix`, `chore`...) van en inglés, porque son
convenciones del ecosistema, no prosa.

## 2. Política de modelos

Todo spawn del tool Agent para desarrollo dirigido por subagentes (implementación,
investigación, construcción) usa Sonnet 5 — pasa `model: "sonnet"` explícito, no confíes
en el default. Las revisiones de código **nunca** se delegan a un subagente: se hacen en
la sesión principal con el modelo activo. Por qué: una revisión necesita el mismo
contexto acumulado que ya tiene la sesión principal; delegarla a un subagente en frío
pierde ese contexto y produce revisiones más pobres.

## 3. Cortacircuitos de 3 intentos

Tras 3 intentos fallidos de arreglar el mismo error, PARA. No lo intentes una cuarta vez
con una variación menor. Resume al usuario qué probaste y por qué falló cada intento, y
espera su respuesta antes de seguir. Por qué: pasado el tercer intento el patrón suele
ser un problema de diagnóstico, no de ejecución — seguir iterando solo quema tokens sin
acercarse a la causa raíz. (El hook `loop-breaker.mjs` refuerza esta regla de forma
determinista contando firmas de fallo repetidas.)

## 4. Commits

Conventional Commits, con el subject en español (`feat(rag): añade backend kaggle`, no
en inglés). Nunca incluyas un footer de atribución de IA: ni
`Co-authored-by: Claude <noreply@anthropic.com>`, ni `Generated with Claude Code`, ni el
emoji 🤖, ni ninguna variante equivalente. (El hook `git-footer-guard.mjs` bloquea el
commit si detecta uno de estos patrones, así que si el commit falla por esto, reintenta
sin el footer en vez de forzar el bypass.)

## 5. Ahorro de tokens / búsqueda de skills

Cuando entra en la conversación un lenguaje, framework o táctica nuevos para los que no
hay Skill 2.0 instalada (C#, .NET, WinUI 3, XAML, Python, Rust, Go...), pregunta al
usuario si quiere crear o buscar una Skill 2.0 para esa tecnología antes de seguir
trabajando con ella a ciegas. Al preguntar, menciona explícitamente el compromiso:
instalar la skill cuesta contexto extra en cada sesión futura, pero mejora la calidad y
consistencia de las respuestas sobre esa tecnología. La decisión final es del usuario.
(El hook `skill-suggest.mjs` detecta estas menciones y lo recuerda una vez por sesión.)

## 6. Dónde vive el contexto (regla dura)

Todo el contexto de Claude vive **en el workspace**, nunca en un repo: las reglas en este archivo,
el contexto de cada proyecto en `.claude/proyectos/<nombre>.md` (se carga solo, al final de este
archivo), los recordatorios en `.claude/recordatorios/` y la narrativa en el vault. **Ningún repo
lleva `CLAUDE.md`, `CLAUDE.local.md` ni `.claude/`**: el 2026-07-24 un `CLAUDE.md` con contexto
interno acabó commiteado y publicado en GitHub. `init-proyecto` los deja ignorados en el
`.gitignore` de cada repo.

- Aprendes algo del proyecto que la próxima sesión necesita → edita su `proyectos/<nombre>.md`
  en la sección que toque (Estructura, Comandos, Estado, Trampas que ya costaron tiempo,
  Convenciones).
- Si ese archivo pasa de ~150 líneas, lo largo va al vault (`Codigo/` con `fuentes:`) y se enlaza
  desde el archivo: todos los `proyectos/*.md` se cargan en cada sesión y cuestan contexto.
- Repo sin archivo (el hook de arranque lo avisa) → `node R.A.G/ritual.mjs init-proyecto <ruta>`,
  y luego rellena Estructura y Comandos consultando el grafo; deja vacío lo que no sepas.
- Refuerzo: el recordatorio `contexto-fuera-del-repo` salta si vas a escribir un `CLAUDE.md` o
  un `.claude/` dentro de un repo.

## 7. Tres memorias con rol

Hay tres memorias y cada una guarda una cosa distinta; usar la equivocada es la forma más común
de perder contexto.

| Memoria | Qué guarda | Ejemplo |
|---|---|---|
| Nativa de Claude Code (`~/.claude/projects/<p>/memory/`) | gotchas cortos, correcciones y preferencias: "no hagas X porque Y", ≤ 3 líneas | "el hook de rtk rompe heredocs con comillas: usa Write" |
| Vault + RAG (`V.A.U.L.T/`, MCP `rag`) | narrativa: decisiones con alternativas descartadas, specs, sesiones, aprendizajes largos | por qué se eligió pgvector y no otra base vectorial |
| Grafo de código (MCP `graphify` y `codebase-memory`) | estructura: qué llama a qué, qué hereda de qué | quién llama al servicio que vas a cambiar |

**Lo generado se queda en su herramienta; lo narrado va al vault.** Nunca vuelques el grafo, un
listado de archivos ni un esquema de base de datos al vault: el setup de trabajo del autor metió
257 notas de nodos y aristas —más de la mitad del vault— y ahogaron las búsquedas. Context7 está
permitido para documentación de librerías externas: no es memoria del proyecto y no compite con
ninguna de las tres.

## 8. Orden de herramientas de contexto

Antes de asumir nada sobre el código o su historia: `rag_query` (qué se decidió y por qué) →
`graphify` (el mapa: qué existe y quién llama a quién) → `codebase-memory` (el detalle:
`search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`) → grep, **el último
recurso**.

- **Literal** (string exacto, valor mágico, mensaje de error, SQL) → grep es correcto.
- **Estructura**, "quién usa esto", "¿ya existe un helper así?" → el grafo. grep no ve despacho
  por interfaz, inyección de dependencias, `override` ni bindings declarativos. Si enumeras
  candidatos y cuentas cuál aparece, es una pregunta de estructura disfrazada de literal.
- **Deriva doc↔código**: el RAG trae el requerimiento exacto; el grafo confirma con
  `get_neighbors` que algo real lo usa. Que una clase exista no significa que esté en uso.
- **La prosa se pudre, el grafo no**: toda descripción de arquitectura escrita a mano —incluida
  la de `proyectos/<nombre>.md`— se verifica contra el grafo antes de confiar en ella.
- **`codebase-memory` no se refresca solo**: `ready` significa que hay índice, no que esté al
  día. Si `search_graph` no encuentra algo recién escrito, reindexa (`index_repository`) antes de
  concluir que no existe. Nunca con `--persistence`: escribe el grafo dentro del repo.
- Refuerzo: el recordatorio `orden-herramientas` salta en cada Grep y en cada buscador por Bash.

## 9. Taxonomía y vigencia del vault

Toda nota nueva en `V.A.U.L.T/` nace de `Plantillas/nota.md`. La **colección y la autoridad las da
la carpeta**, no el frontmatter — guarda la nota donde corresponda a su género (`Decisiones/`,
`Conocimiento/`, `Codigo/`, `Superpowers/Sesiones/`…; el hub de cada carpeta en `Hubs/` dice qué
va y qué no). El frontmatter lleva `proyecto` (eje transversal) y `tags` libres.

Tres obligaciones al escribir:

- **Enlázala desde su hub** en `Hubs/` — una nota sin enlace entrante es huérfana y `rag.mjs
  salud` la lista.
- **Si describe código o un documento, declara `fuentes:`** (rutas o globs relativos a la raíz
  del workspace): así el RAG la marca CADUCA cuando esas fuentes cambian y la prosa no. Toda nota
  de `Codigo/` lleva `fuentes:`.
- **Si sustituye a una decisión o spec, declara `reemplaza: [nombre-de-la-vieja]`**; la vieja
  no se borra, pero sale de la búsqueda por defecto. Si algo vence, `revisar: YYYY-MM-DD`.

Al leer un resultado del RAG con `⚠ CADUCA`, verifica contra el código o el grafo antes de
confiar; con `⚠ REEMPLAZADA`, lee la nota que la reemplaza. Regla de conflicto entre fuentes:
decisiones > docs_formales/specs > entrevistas > conocimiento/aprendizaje/codigo > planes >
bitacoras — gana la autoridad, no la fecha.

Specs y planes van a `V.A.U.L.T/Superpowers/{Specs,Planes}/` —son contexto de Claude (regla 6)—,
salvo que el proyecto declare `docs_en_repo: true` en su `proyectos/<n>.md`; entonces viven en
`docs/superpowers/` del repo y `fin-ciclo --cerrar` los copia al vault.

## 10. Recordatorios justo a tiempo

Las reglas que se olvidan a mitad de una tarea larga no se arreglan repitiéndolas aquí: se
convierten en un recordatorio en `<RAG_ROOT>/.claude/recordatorios/<nombre>.md` (frontmatter
`tools`/`patrones`/`rutas`/`excluir` + texto), que el hook `recordar.mjs` inyecta en el instante
en que vas a ejecutar el comando o editar el archivo que lo dispara. Criterio: una regla que se
olvidó dos veces se convierte en recordatorio, con la fecha y el fallo que lo parió en su
`nota:`. Copia `_plantilla.md` para crear uno; no toques `settings.json`. Cuando recibas
uno, aplícalo antes de seguir.

---

Contexto de los proyectos del workspace (regla 6), un archivo por proyecto:

@proyectos/_indice.md
