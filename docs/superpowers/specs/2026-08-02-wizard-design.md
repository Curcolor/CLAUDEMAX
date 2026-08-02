# Wizard Interactivo de Instalación — Especificación de Diseño

**Fecha:** 2026-08-02
**Padre:** [Diseño maestro CLAUDEMAX](2026-07-19-claudemax-master-design.md)
**Estado:** Diseño aprobado

## Objetivo

Convertir la instalación en una experiencia de aplicación: el usuario ejecuta un archivo y un asistente lo guía paso a paso, detectando qué falta, instalándolo, y preguntando lo que hoy hay que pasar como variables de entorno. Es la última pieza pendiente del diseño maestro.

Hoy la instalación completa exige saber esto de memoria:

```bash
RAG_ROOT=/c/Users/.../WORKSPACE VAULT_MODE=create RAG_MODE=create \
  KAGGLE_USERNAME=... KAGGLE_KEY=... bash install.sh --all
```

Tras el wizard: doble clic en `CLAUDEMAX-INSTALLER.cmd`.

## Principio rector

**El wizard no reimplementa la instalación: la orquesta.** Toda la lógica sigue viviendo en `install.sh` y en `bin/components/*.sh`. El wizard recoge decisiones y las traduce a flags y variables de entorno. Consecuencia: la ruta no interactiva sigue funcionando igual y no hay dos caminos que mantener sincronizados.

## Puntos de entrada

Dos archivos nuevos en la raíz del repo:

| Archivo | Qué hace |
|---|---|
| `CLAUDEMAX-INSTALLER.cmd` | Localiza Node y lanza `bin/wizard/wizard.mjs` |
| `CLAUDEMAX-UNINSTALLER.cmd` | Lanza `wizard.mjs --uninstall` |

Los `.cmd` son deliberadamente tontos: comprueban que `node` exista (si no, explican cómo instalarlo y esperan una tecla antes de cerrar, para que la ventana no desaparezca al hacer doble clic) y delegan. También se puede invocar directo: `node bin/wizard/wizard.mjs`.

## Tecnología

Node ≥18, **sin dependencias**, como el resto del repo. `node:readline/promises` para la entrada, secuencias ANSI para el renderizado. Nada de librerías de TUI: el menú es una lista numerada con selección por teclado, que funciona igual en Git Bash, cmd.exe y Windows Terminal.

Detección de color: si `NO_COLOR` o `CLAUDEMAX_NO_COLOR` están definidas, o si la salida no es TTY, renderiza en texto plano.

## Flujo

### 1. Bienvenida
Banner ASCII de CLAUDEMAX (el mismo de `install.sh`), versión, y una frase de qué va a pasar. Enter para continuar, `q` para salir.

### 2. Destino del workspace
Pregunta dónde crear la carpeta raíz. Ofrece por defecto `%USERPROFILE%\Desktop\WORKSPACE` (o el equivalente en el SO). Valida que la ruta sea escribible; si ya existe y no está vacía, avisa y pide confirmación explícita antes de continuar. Esta respuesta se convierte en `RAG_ROOT`.

### 3. Chequeo de dependencias
Tabla con estado en vivo de cada dependencia, detectada igual que lo hace `bin/lib/detect.sh` (el wizard **reutiliza esa detección ejecutándola**, no la reimplementa):

```
  Dependencia      Estado              Necesaria para
  ─────────────────────────────────────────────────────
  ✓ node v22       instalado           todo
  ✓ git            instalado           skills, clones
  ✓ claude         instalado           MCPs, plugins
  ✗ docker         no encontrado       RAG (base vectorial)
  ✗ ollama         no encontrado       RAG (embeddings)
  ✓ python 3.12    instalado           parsers
  ✗ java           no encontrado       parsers (PDF)
```

Para las que falten, ofrece instalarlas vía winget. **No las instala aquí**: marca la decisión y deja que lo hagan los componentes, que ya saben hacerlo (`ac_rag_ensure_deps`, `ac_parsers_ensure_python`). Si el usuario declina, avisa qué componentes quedarán degradados y sigue.

### 4. Selección de componentes
Lista con casilla marcada por defecto en todos. El usuario puede desmarcar con el número. La lista se lee de `ALL_COMPONENTS` en `install.sh` — **no se duplica en el wizard**, se extrae con una expresión regular al arrancar, para que añadir un componente al instalador lo haga aparecer aquí solo.

Cada componente muestra una descripción de una línea, tomada de un mapa `id → descripción` que sí vive en el wizard (los `.sh` no tienen un campo estructurado para eso).

### 5. Vault
Tres modos, como ya soporta `rag.sh`:

1. **Crear desde cero** — copia la plantilla con la taxonomía de seis categorías.
2. **Importar uno existente** — pide la ruta (`VAULT_SRC`), valida que exista.
3. **Conectar a uno remoto** — pide la URL de git (`VAULT_REMOTE`).

Se omite si el componente `rag` está desmarcado.

### 6. RAG
Los mismos tres modos (`RAG_MODE`, con `RAG_DUMP` / `RAG_REMOTE_URL` según el caso). Después, pregunta opcional por Kaggle: si el usuario dice que sí, pide usuario y clave (**la clave se lee sin eco en pantalla**) y advierte del paso manual de verificación telefónica. Si dice que no, ni se mencionan las variables.

### 7. Resumen y confirmación
Muestra exactamente lo que va a ejecutar — la línea de comando completa con sus variables de entorno, para que sea auditable — y pide confirmación. Ofrece también **modo simulación**: ejecuta con `--dry-run` para ver qué haría sin tocar nada.

### 8. Ejecución
Lanza `bash install.sh` con los flags y variables acordados, heredando stdout/stderr para que el usuario vea el progreso real del instalador (que ya imprime pasos con `ac_step`). El wizard no reformatea esa salida: sería una capa de traducción frágil.

Localización de bash en Windows, en orden: `bash` en el PATH → `%ProgramFiles%\Git\bin\bash.exe` → `%LOCALAPPDATA%\Programs\Git\bin\bash.exe`. Si no aparece ninguno, explica que hace falta Git for Windows y sale con código 1.

### 9. Resumen final
Código de salida del instalador, recordatorio de reiniciar Claude Code, y los comandos para empezar (`/understand`, `ritual.mjs fin-sesion`, etc.). En Windows espera una tecla antes de cerrar.

## Modo desinstalación

`wizard.mjs --uninstall`: muestra qué se va a eliminar y qué se conserva (dependencias de sistema, el vault, el volumen de datos, las reglas editadas), pide confirmación escribiendo la palabra `desinstalar` — no un simple sí, porque es destructivo — y delega en `bash uninstall.sh`.

## Flags del propio wizard

| Flag | Efecto |
|---|---|
| `--uninstall` | Modo desinstalación |
| `--dry-run` | Fuerza simulación sin preguntarlo en el paso 7 |
| `--defaults` | Acepta todos los valores por defecto sin preguntar nada (útil para reinstalar rápido) |
| `--no-color` | Desactiva ANSI |

## Estructura de archivos

```
CLAUDEMAX/
├── CLAUDEMAX-INSTALLER.cmd     # lanzador (doble clic)
├── CLAUDEMAX-UNINSTALLER.cmd   # lanzador de desinstalación
└── bin/wizard/
    ├── wizard.mjs              # flujo principal
    ├── ui.mjs                  # primitivas: banner, menú, prompt, tabla, colores
    └── detect.mjs              # envoltura sobre bin/lib/detect.sh + comprobaciones extra
```

Tres archivos con una responsabilidad clara cada uno, en vez de un único archivo largo.

## Verificación

1. `node --check` de los tres `.mjs`.
2. `node bin/wizard/wizard.mjs --defaults --dry-run` → recorre el flujo sin preguntar y termina en 0, mostrando la línea de comando que habría ejecutado.
3. Cada paso del flujo probado con entrada simulada por stdin: destino inválido → vuelve a preguntar; carpeta existente no vacía → exige confirmación; desmarcar `rag` → se saltan los pasos 5 y 6; declinar Kaggle → no aparecen sus variables en el resumen.
4. `--uninstall` sin escribir la palabra exacta → aborta sin tocar nada.
5. Sin `node` en el PATH, el `.cmd` explica el problema y no cierra la ventana de golpe.
6. La lista de componentes extraída de `install.sh` coincide con `ALL_COMPONENTS` — prueba automatizada, para que no se desincronice.

## Fuera de alcance

- Interfaz gráfica real (Electron o similar): el TUI cubre el caso sin añadir 100 MB de dependencias.
- Reimplementar la lógica de instalación en Node.
- Instalar dependencias de sistema desde el wizard: eso ya lo hacen los componentes.
