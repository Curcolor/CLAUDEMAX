---
tools: [Bash, PowerShell]
patrones:
  - 'probar-api\.ps1'
  - 'Maestra\.Api\.Catalogos\.Tests'
activo: false
nota: >
  Original: recordar-rojos-de-la-suite-api.py del workspace de Grupo Maestra. Por que existe:
  el 2026-09-09 perdi media sesion --seis pasadas-- diagnosticando PuertaDeHorariosTest por
  su NOMBRE y por una nota del vault que lo mencionaba, en vez de por su mensaje. La nota decia
  que ese test se pone rojo por el rate limit, y encajaba. Era otra cosa: un 23505 de residuo de
  usuarios, que tumba la clase entera en InitializeAsync. Lo que de verdad fallo no fue la
  hipotesis, fue el metodo: filtre la salida con Select-String y el filtro se comio el mensaje.
  Una nota que nombra un sintoma es una hipotesis, no un diagnostico. NO bloquea.
---
VAS A CORRER LA SUITE DE LA API. Como se lee un rojo aqui:

1. EL MENSAJE, NO LA LINEA [FAIL]. Si filtras la salida con Select-String/grep, el filtro
   se come el 'Mensaje de error' y te quedas con el nombre del test -- que es justo lo que
   induce a diagnosticar de memoria. Volcar a archivo o correr sin filtro.
   UNA PASADA DE LA QUE NO SE LEE EL ERROR NO CUENTA COMO PASADA.

2. PuertaDeHorariosTest tiene DOS causas y se confunden:
   - falla en una ASERCION con 'Actual: TooManyRequests'  -> es el rate limit (ventana 1 min)
   - toda la clase cae en ~1 ms SIN mensaje visible       -> es 23505 en InitializeAsync,
     residuo de usuarios de prueba. NO es el limitador.
   Si los cuatro caen en 1 ms, ni lo mires: es residuo.

3. UN ROJO QUE SE REPITE: comprobar si es PREEXISTENTE antes de tocar nada.
   git stash && git checkout main && correr ese test && volver.
   Es barato y zanja la unica pregunta que importa: 'que es mio?'.

4. NO encadenar pasadas para confirmar: se contaminan entre si, agotan la ventana del
   limitador, y cada pasada abortada deja residuo que rompe la siguiente.

5. La suite BORRA los ensayos de la base de desarrollo (BorrarPruebas llama a la funcion
   real). Medir si hay algo que perder antes de preguntar si se puede correr.

Memorias: suite-api-429-se-disfraza-de-permisos · fixture-que-fija-un-valor-unico ·
leer-las-aserciones-no-los-nombres
