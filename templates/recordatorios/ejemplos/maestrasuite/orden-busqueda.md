---
tools: [Grep, Bash, PowerShell]
siempre: [Grep]
patrones:
  - '\bgrep\b'
  - '\brg '
  - 'ripgrep'
  - '\bfind '
  - 'Select-String'
  - 'findstr'
activo: false
nota: >
  Original: recordar-orden-busqueda.py del workspace de Grupo Maestra. Por que existe: la regla
  ya estaba escrita en .claude/CLAUDE.md y en la memoria, y aun asi derive a grep dos veces el
  mismo dia (2026-08-19). La causa es de tiempos, no de conocimiento: Grep/Bash estan en
  contexto desde el primer token y los MCP llegan como deferred tools que piden un ToolSearch
  antes. Un recordatorio en el arranque llega demasiado pronto para servir; este llega en el
  instante de la decision. NO bloquea. Dispara CADA vez a proposito. Para usarlo: copialo al
  nivel superior de .claude/recordatorios/ y pon activo: true.
---
ORDEN DE HERRAMIENTAS DE CONTEXTO (regla de .claude/CLAUDE.md):
cerebro -> graphify -> codebase-memory -> grep, que es el ULTIMO recurso.

Antes de correr esta busqueda, responde:
1. Es un LITERAL? (string exacto, valor magico como 'devuelto', mensaje de error, SQL)
   -> grep es la herramienta correcta. Sigue.
1b. TRAMPA: sabes EXACTAMENTE que cadena buscas, o estas PROBANDO CANDIDATOS?
   Si estas enumerando nombres posibles ('RequireAuthorization', 'ExigirRol', 'Permiso'...)
   y contando cual aparece, NO es una busqueda literal: es la pregunta '?que mecanismo se
   usa aqui?', que es ESTRUCTURA disfrazada. Va al grafo: trace_path sobre el simbolo
   sospechoso te dice sus llamantes reales y de paso si hay varios mecanismos conviviendo.
   Paso el 2026-09-04: grep 'confirmo' un helper Permiso() que en realidad tenia 2 llamantes
   de 97 rutas, y el grafo destapo que habia TRES mecanismos distintos (clave de API, JWT
   y rol). El campo derivado de esa suposicion habria salido vacio en las 97.
2. Es ESTRUCTURA, o 'quien usa esto', o vas a escribir un helper/mapeo/rotulo nuevo?
   -> te equivocaste de herramienta. Usa search_graph / trace_path / get_code_snippet
      de codebase-memory, o query_graph / get_neighbors de graphify.
      El peldano que mas se salta: preguntar al grafo si el helper YA EXISTE antes de
      escribirlo. Asi se reescribio a mano CuadroGuardadoApi.EstadoTexto (2026-08-19).
3. Si usas grep igual: NUNCA con `head` sin excluir antes Designer.cs, obj/ y bin/.
   El codigo generado llena el corte y tapa la respuesta -- ya paso.

Y recuerda que grep NO ve x:Bind, despacho por interfaz, DI ni override, que es
justo todo lo que usa este stack.
