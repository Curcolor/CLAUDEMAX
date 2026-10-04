---
tools: [Bash, PowerShell]
patrones:
  - '\bdotnet\s+test\b'
  - '\.Tests\b'
  - '\bprobar-[\w-]+\.ps1\b'
nota: >
  Generalizado del setup de trabajo del autor (2026-09-09: media sesión y seis pasadas
  diagnosticando un test por su NOMBRE y por una nota del vault que lo mencionaba, porque
  Select-String se comió el mensaje de error real).
---
VAS A CORRER UNA SUITE .NET. Cómo se lee un rojo:
1. EL MENSAJE, NO LA LÍNEA [FAIL]. Si filtras la salida con Select-String / grep / head, el filtro se come el mensaje de error y te quedas con el nombre del test — que induce a diagnosticar de memoria. Vuelca a archivo o corre sin filtro. UNA PASADA DE LA QUE NO SE LEE EL ERROR NO CUENTA COMO PASADA.
2. Una nota o memoria que nombra un síntoma es una HIPÓTESIS, no un diagnóstico: compárala con el `Actual:` / `Expected:` reales.
3. UN ROJO QUE SE REPITE: comprueba si es PREEXISTENTE antes de tocar nada — `git stash && git checkout main && dotnet test --filter <test>; git checkout - && git stash pop`. Zanja la única pregunta que importa: "¿qué es mío?".
4. NO encadenes pasadas para confirmar: se contaminan entre sí (límites de peticiones, residuos en la BD de pruebas) y cada pasada abortada deja residuo que rompe la siguiente.
5. Si la suite toca una base de datos, averigua ANTES qué borra (limpiadores que llaman a la función real) y si hay algo que perder.
6. `Select-Object -First N` sobre la invocación de un `.ps1` mata el proceso hijo antes de que termine. Captura en variable y filtra después.
