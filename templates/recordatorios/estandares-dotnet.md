---
tools: [Edit, Write, MultiEdit]
rutas: ["**/*.cs", "**/*.xaml"]
nota: >
  Generalizado del setup de trabajo del autor (2026-08-19: reescribió a mano un helper que ya
  existía; 2026-07-26: parcheó el síntoma de SelectionChanged en una pantalla y media hora
  después salió el mismo bug en otra). Ajusta el punto 3 a los estándares de tu casa.
---
ESTÁNDARES .NET / WinUI — antes de este cambio:
1. Si vas a escribir un helper, mapeo o regla nuevos: pregunta al grafo de código si YA EXISTE (graphify / codebase-memory). Reescribir a mano algo que ya existía es el fallo más repetido. Si el grafo no encuentra algo recién escrito, reindexa antes de concluir que no existe.
2. Si es un arreglo: causa raíz, no síntoma. grep no ve `x:Bind`, despacho por interfaz, DI ni `override`. Lee las ASERCIONES del test que falla, no solo su nombre.
3. Estándares de la casa: dominio sin UI ni BD; ViewModels con CommunityToolkit.Mvvm y bindeo por `x:Bind` (no `DataContext`); parámetros de negocio versionados — nunca hardcodear una regla que el diseño marca parametrizable; dominio y UI en español, inglés solo en tipos de framework.
4. Trampas de WinUI: un `SelectedIndex` en XAML dispara `SelectionChanged` durante `InitializeComponent` (bandera `_listo` al final del constructor, no un guard por control); un `--` dentro de un comentario XAML o csproj tumba el compilador sin decir dónde; `IsEnabled` no existe en `Panel`.
5. Nombres de clientes o personas: nunca en código, tests ni mensajes de commit.
