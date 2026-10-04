---
tools: [Bash, PowerShell]
patrones:
  - '\bgcloud '
  - '\bgsutil '
  - 'publicar\.ps1'
  - 'sql export'
  - 'sql import'
  - 'authorized-networks'
  - 'run deploy'
activo: false
nota: >
  Original: recordar-despliegue.py del workspace de Grupo Maestra. Por que existe: el
  2026-09-02 desplegue la 1.4.0 sin leer ninguna de las cuatro fuentes que lo documentan.
  Consecuencias reales: (a) pg_dump fallo porque authorizedNetworks esta VACIO a proposito --y
  el procedimiento de la ventana temporal estaba escrito en admin-catalogos.md, que no abri--,
  asi que cree un bucket que nadie pidio; (b) estuve a punto de correr el comando de infra.md
  con --max-instances=1, que habria bajado produccion de 3 a 1. Jairo: "lo que hiciste fue
  improvisar sobre produccion". NO bloquea. Dispara CADA vez a proposito: un despliegue son
  muchos comandos seguidos y el que importa casi nunca es el primero. docker compose NO entra:
  ese es el contenedor local.
---
VAS A TOCAR PRODUCCION. Antes del primer comando, las cuatro fuentes, en orden:

1. cerebro -> Hubs/Despliegue-pendiente.md   <- LA nota: la secuencia, el bloque
   'Antes de ejecutar nada de esto' y 'Trampas del propio despliegue'.
2. CerebroVault/Hubs/Pendientes.md           <- 'Orden de despliegue - no negociable'.
3. MaestraSuite/db/gcp/infra.md              <- Cloud Run, Cloud SQL, secretos, Redeploy.
4. MaestraSuite/db/gcp/admin-catalogos.md    <- COMO se llega a la base y COMO se respalda.
   Es la que mas se salta y la que mas falta hace.

Las cuatro reglas que ya costaron caro:
- RESPALDO PRIMERO, y no cuenta hasta RESTAURARLO. Con esa base scratch se MIDE
  produccion: lo que hay alli no se lee de ninguna nota (leccion aprendida 3 veces).
- Si solo cambio el codigo, desplegar SOLO LA IMAGEN, sin banderas de configuracion.
  El comando completo de infra.md se pudre: llevaba --max-instances=1 con produccion
  en 3, y --set-secrets REEMPLAZA el conjunto entero.
- La base de produccion se alcanza por VENTANA DE RED TEMPORAL, que se abre y se CIERRA
  comprobando que quedo vacia (admin-catalogos.md). authorizedNetworks esta vacio a
  proposito: 'connection refused' NO es un fallo, es el diseno.
- El MSIX se verifica con gsutil, NO por el codigo de salida --el de una tuberia es el
  del ultimo comando-- y su numero tiene que ser MAYOR que todo lo que haya en el bucket.

Y lo que Jairo dejo dicho: NADA de local toca produccion (tiene mas datos), y la
INFRAESTRUCTURA NUEVA la decide el, no yo. Si el procedimiento no cubre el caso, se dice
y se pregunta -- no se inventa. Al terminar, inventariar lo creado y decirlo.
