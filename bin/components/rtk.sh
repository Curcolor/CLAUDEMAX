#!/usr/bin/env bash
# Instala RTK (proxy de comandos de shell que ahorra tokens) y conecta su hook PreToolUse de Claude Code.
#
# - macOS/Linux: instalador upstream vía curl-pipe (https://github.com/rtk-ai/rtk)
# - Windows (Git Bash / MSYS / Cygwin): descarga el zip oficial de Windows y extrae rtk.exe
#   a $HOME/.local/bin. El instalador upstream rechaza MINGW64, así que manejamos Windows nosotros mismos.
#
# En todos los casos parcheamos ~/.claude/settings.json directamente (matcher: "Bash" / cmd: "rtk hook claude")
# en lugar de depender del prompt interactivo y/N de `rtk init -g`.

RTK_WINDOWS_ZIP_URL="https://github.com/rtk-ai/rtk/releases/latest/download/rtk-x86_64-pc-windows-msvc.zip"

ac_component_rtk() {
    ac_step "RTK — proxy de ahorro de tokens para comandos de shell"

    local rtk_already_installed=0
    if ac_have rtk && [ "${FORCE:-0}" != "1" ]; then
        ac_info "rtk ya está instalado ($(rtk --version 2>/dev/null | head -n1)); se omite la instalación del binario. Usa --force para reinstalar."
        rtk_already_installed=1
    fi

    if [ "$rtk_already_installed" = "0" ]; then
        case "${AC_OS:-unknown}" in
            windows) ac_rtk_install_windows ;;
            macos|linux) ac_rtk_install_unix ;;
            *)
                ac_warn "SO desconocido '$AC_OS' — intentando instalación estilo unix."
                ac_rtk_install_unix
                ;;
        esac
    fi

    # Asegura que ~/.local/bin esté en el PATH para el resto de este script (detección post-instalación).
    if ! ac_have rtk; then
        if [ -x "$HOME/.local/bin/rtk" ] || [ -x "$HOME/.local/bin/rtk.exe" ]; then
            export PATH="$HOME/.local/bin:$PATH"
        fi
    fi

    if ! ac_have rtk; then
        ac_warn "El binario de rtk no está en el PATH tras la instalación. El hook quedará conectado pero no se disparará hasta que el PATH incluya \$HOME/.local/bin."
    else
        ac_info "Versión de rtk: $(rtk --version 2>/dev/null | head -n1)"
    fi

    # Ejecuta `rtk init -g` para que cree RTK.md / actualice CLAUDE.md (esas partes son no interactivas).
    # Ignoramos su prompt de settings.json y parcheamos el archivo nosotros mismos más abajo.
    if ac_have rtk; then
        if [ "${DRY_RUN:-0}" = "1" ]; then
            ac_dim "\$ rtk init -g  (crea RTK.md + actualiza CLAUDE.md; settings.json se parchea por separado)"
        else
            # `</dev/null` asegura modo no interactivo sin importar el comportamiento del prompt upstream.
            rtk init -g </dev/null >/dev/null 2>&1 \
                || ac_warn "rtk init -g devolvió un código distinto de cero — RTK.md / CLAUDE.md pueden no estar conectados."
        fi
    fi

    ac_rtk_wire_hook
}

ac_rtk_install_unix() {
    ac_info "Instalando rtk vía curl|sh upstream ..."
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh"
        return 0
    fi
    curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh \
        || ac_warn "El script de instalación upstream de rtk falló — continuando sin rtk."
}

ac_rtk_install_windows() {
    if [ "${AC_ARCH:-unknown}" != "x86_64" ]; then
        ac_warn "La arquitectura de Windows '$AC_ARCH' no tiene binario de rtk publicado (solo x86_64). Se omite rtk."
        return 0
    fi

    local dst_dir="$HOME/.local/bin"
    local dst_bin="$dst_dir/rtk.exe"
    local tmp_zip
    tmp_zip="$(mktemp -t rtk-win.XXXXXX.zip 2>/dev/null || mktemp)"

    ac_info "Instalando rtk (Windows x86_64) desde $RTK_WINDOWS_ZIP_URL"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ curl -fsSL -o $tmp_zip $RTK_WINDOWS_ZIP_URL"
        ac_dim "\$ <unzip>  $tmp_zip -> $dst_dir/rtk.exe"
        return 0
    fi

    mkdir -p "$dst_dir"
    if ! curl -fsSL -o "$tmp_zip" "$RTK_WINDOWS_ZIP_URL"; then
        ac_warn "Falló la descarga del zip de rtk para Windows. Se omite rtk."
        rm -f "$tmp_zip"
        return 0
    fi

    if ! ac_rtk_extract_zip "$tmp_zip" "$dst_dir"; then
        ac_warn "Falló la extracción del zip de rtk. Se omite rtk."
        rm -f "$tmp_zip"
        return 0
    fi
    rm -f "$tmp_zip"

    if [ -x "$dst_bin" ] || [ -f "$dst_bin" ]; then
        chmod +x "$dst_bin" 2>/dev/null || true
        ac_info "Instalado $dst_bin"
    else
        ac_warn "Se esperaba $dst_bin tras la extracción pero no está."
    fi
}

# Intenta unzip → PowerShell → python en ese orden. Gana el primero que exista.
ac_rtk_extract_zip() {
    local zip="$1" dst="$2"

    if ac_have unzip; then
        unzip -o -q "$zip" -d "$dst" && return 0
    fi

    if ac_have powershell.exe; then
        powershell.exe -NoProfile -Command \
            "Expand-Archive -Path '$(cygpath -w "$zip" 2>/dev/null || echo "$zip")' -DestinationPath '$(cygpath -w "$dst" 2>/dev/null || echo "$dst")' -Force" \
            && return 0
    fi

    if ac_have python; then
        python -m zipfile -e "$zip" "$dst" && return 0
    fi
    if ac_have python3; then
        python3 -m zipfile -e "$zip" "$dst" && return 0
    fi

    ac_warn "Se necesita uno de: unzip, powershell.exe, python — no se encontró ninguno."
    return 1
}

# Parchea ~/.claude/settings.json con el hook PreToolUse/Bash. Idempotente.
ac_rtk_wire_hook() {
    local settings="$CLAUDE_CONFIG_DIR/settings.json"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ ac_merge_hook $settings PreToolUse 'rtk hook claude' Bash"
        return 0
    fi
    ac_merge_hook "$settings" "PreToolUse" "rtk hook claude" "Bash"
    ac_info "Hook PreToolUse/Bash registrado → 'rtk hook claude' en $settings"
}