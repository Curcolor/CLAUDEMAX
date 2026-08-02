<!--
    Este archivo lo instala CLAUDEMAX (componente `rules`, ver bin/components/rules.sh).
    La fuente de verdad es el repo: docs/superpowers/specs/2026-08-01-reglas-rituales-design.md
    (bloque E1). No lo edites a mano en `<RAG_ROOT>/.claude/CLAUDEMAX.md` — cualquier cambio
    se perderá en la próxima reinstalación. Si necesitas una regla distinta, cámbiala en
    `templates/rules/CLAUDEMAX.md` de este repo y reinstala.
-->

# Reglas operativas de CLAUDEMAX

Estas reglas aplican a cualquier sesión de Claude Code lanzada dentro de este workspace,
en la raíz o en cualquier proyecto que haya corrido el ritual de inicialización
(`ritual.mjs init-proyecto`). Son imperativas: cúmplelas salvo que el usuario te pida
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

## 6. Memoria

El cerebro RAG (`R.A.G/`) es la única fuente de retención de contexto entre sesiones. No
reinstales ni sugieras Context7 ni Claude-Mem: quedaron obsoletos frente al RAG propio de
CLAUDEMAX y reintroducirlos duplica funcionalidad sin aportar nada.

## 7. Taxonomía del vault

Toda nota nueva que escribas en `V.A.U.L.T/` lleva el frontmatter de categoría definido
en `V.A.U.L.T/_plantilla.md`: `categoria` (obligatoria, una de las seis oficiales) y
`proyecto` (opcional, clave transversal que relaciona notas de distintas categorías). Sin
ese frontmatter la nota queda mal clasificada en el grafo y en las búsquedas del RAG.
Clasifica según qué es la nota, no según dónde ocurrió la conversación:

- `00-Inbox/` (`personal`, tag `personal/sesion`): continuidad entre sesiones de Claude
  Code — qué se hizo, en qué punto se quedó, qué sigue. La escribe el ritual `fin-sesion`.
- `Journal/` (`personal`, tag `personal/bitacora`): bitácora cronológica del trabajo
  diario. La escribe el ritual `fin-dia`.
- `Aprendizaje/` (`aprendizaje`): errores cometidos y su lección — postmortems de qué
  falló, por qué, y cómo evitarlo. NO son apuntes de tecnologías ni tutoriales.
- `Investigacion/` (`investigacion`): lo que se pregunta e investiga para decidir algo —
  comparativas de herramientas, estilos de diseño, papers, PDFs parseados, transcripciones.
- `Organizacion/` (`organizacion`): parte legal y conceptual de la organización — miembros
  y roles, estatutos, contratos, marca, procesos internos, clientes.
- `Codigo/` (`codigo`): repos, arquitectura, snippets, grafos de Graphify.
- `Proyectos/` (`proyectos`): planes, decisiones, sprints, specs.
