---
tools: [Edit, Write, MultiEdit]
rutas: ["**/MaestraSuite/**/*.cs", "**/MaestraSuite/**/*.xaml"]
activo: false
nota: >
  Original: recordar-estandares-maestrasuite.py del workspace de Grupo Maestra. Recuerda los
  estandares de MaestraSuite justo cuando voy a tocar codigo, no al arranque de la sesion ni en
  CLAUDE.md donde se diluye con el contexto acumulado. Mismo problema de TIEMPOS que los otros:
  la regla se olvida a mitad de una tarea larga de rediseno o arreglo, justo cuando mas
  contexto se ha acumulado. Dispara CADA vez a proposito. Deliberadamente corto porque dispara
  en CADA edicion de codigo. NO cubre convenciones de commit (skill conventional-commits) ni
  trampas de XAML puntuales (validar-xaml.py).
---
ESTANDARES DE MAESTRASUITE (regla de .claude/CLAUDE.md) -- antes de este cambio:

1. Si vas a escribir un helper/mapeo/regla nuevo: pregunta al grafo si YA EXISTE antes
   de escribirlo (graphify query_graph/get_neighbors, o codebase-memory search_graph/
   get_code_snippet). Asi se reescribio a mano CuadroGuardadoApi.EstadoTexto (2026-08-19).
   Si search_graph no encuentra algo recien escrito, REINDEXAR antes de concluir que no
   existe -- codebase-memory no se refresca solo.
2. Si es un arreglo: causa raiz, no sintoma. grep no ve x:Bind, despacho por interfaz, DI
   ni override -- justo lo que usa este stack. Y leer las ASERCIONES de un test que falla,
   no solo su nombre.
3. Estandares de la casa: Nomina.Maestra.Dominio sin UI ni BD. ViewModels con
   CommunityToolkit.Mvvm, bindeo por x:Bind (nunca DataContext). Dominio y UI en espanol,
   ingles solo en tipos de framework. Parametros de negocio versionados -- nunca
   hardcodear una regla que el diseno marca parametrizable.
4. Nombres de clientes/empleados: nunca en codigo, tests ni mensajes de commit.
