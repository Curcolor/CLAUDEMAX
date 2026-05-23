#!/usr/bin/env bash
# Install RTK (token-saving shell-command proxy) and wire its Claude Code PreToolUse hook.
#
# - macOS/Linux: upstream curl-pipe installer (https://github.com/rtk-ai/rtk)
# - Windows (Git Bash / MSYS / Cygwin): download the official Windows zip and extract rtk.exe
#   to $HOME/.local/bin. The upstream installer rejects MINGW64 so we handle Windows ourselves.
#
# In all cases we patch ~/.claude/settings.json directly (matcher: "Bash" / cmd: "rtk hook claude")
# instead of relying on `rtk init -g`'s interactive y/N prompt.

RTK_WINDOWS_ZIP_URL="https://github.com/rtk-ai/rtk/releases/latest/download/rtk-x86_64-pc-windows-msvc.zip"

ac_component_rtk() {
    ac_step "RTK — token-saving proxy for shell commands"

    local rtk_already_installed=0
    if ac_have rtk && [ "${FORCE:-0}" != "1" ]; then
        ac_info "rtk already installed ($(rtk --version 2>/dev/null | head -n1)); skipping binary install. Use --force to reinstall."
        rtk_already_installed=1
    fi

    if [ "$rtk_already_installed" = "0" ]; then
        case "${AC_OS:-unknown}" in
            windows) ac_rtk_install_windows ;;
            macos|linux) ac_rtk_install_unix ;;
            *)
                ac_warn "Unknown OS '$AC_OS' — attempting unix-style install."
                ac_rtk_install_unix
                ;;
        esac
    fi

    # Make sure ~/.local/bin is on PATH for the rest of this script (post-install detection).
    if ! ac_have rtk; then
        if [ -x "$HOME/.local/bin/rtk" ] || [ -x "$HOME/.local/bin/rtk.exe" ]; then
            export PATH="$HOME/.local/bin:$PATH"
        fi
    fi

    if ! ac_have rtk; then
        ac_warn "rtk binary not on PATH after install. Hook will be wired but won't fire until PATH includes \$HOME/.local/bin."
    else
        ac_info "rtk version: $(rtk --version 2>/dev/null | head -n1)"
    fi

    # Run `rtk init -g` so it creates RTK.md / updates CLAUDE.md (those parts are non-interactive).
    # We ignore its settings.json prompt and patch the file ourselves below.
    if ac_have rtk; then
        if [ "${DRY_RUN:-0}" = "1" ]; then
            ac_dim "\$ rtk init -g  (creates RTK.md + updates CLAUDE.md; settings.json is patched separately)"
        else
            # `</dev/null` ensures non-interactive mode regardless of upstream prompt behavior.
            rtk init -g </dev/null >/dev/null 2>&1 \
                || ac_warn "rtk init -g returned non-zero — RTK.md / CLAUDE.md may not be wired."
        fi
    fi

    ac_rtk_wire_hook
}

ac_rtk_install_unix() {
    ac_info "Installing rtk via upstream curl|sh ..."
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh"
        return 0
    fi
    curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh \
        || ac_warn "rtk upstream install script failed — continuing without rtk."
}

ac_rtk_install_windows() {
    if [ "${AC_ARCH:-unknown}" != "x86_64" ]; then
        ac_warn "Windows arch '$AC_ARCH' has no published rtk binary (only x86_64). Skipping rtk."
        return 0
    fi

    local dst_dir="$HOME/.local/bin"
    local dst_bin="$dst_dir/rtk.exe"
    local tmp_zip
    tmp_zip="$(mktemp -t rtk-win.XXXXXX.zip 2>/dev/null || mktemp)"

    ac_info "Installing rtk (Windows x86_64) from $RTK_WINDOWS_ZIP_URL"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ curl -fsSL -o $tmp_zip $RTK_WINDOWS_ZIP_URL"
        ac_dim "\$ <unzip>  $tmp_zip -> $dst_dir/rtk.exe"
        return 0
    fi

    mkdir -p "$dst_dir"
    if ! curl -fsSL -o "$tmp_zip" "$RTK_WINDOWS_ZIP_URL"; then
        ac_warn "Failed to download rtk Windows zip. Skipping rtk."
        rm -f "$tmp_zip"
        return 0
    fi

    if ! ac_rtk_extract_zip "$tmp_zip" "$dst_dir"; then
        ac_warn "Failed to extract rtk zip. Skipping rtk."
        rm -f "$tmp_zip"
        return 0
    fi
    rm -f "$tmp_zip"

    if [ -x "$dst_bin" ] || [ -f "$dst_bin" ]; then
        chmod +x "$dst_bin" 2>/dev/null || true
        ac_info "Installed $dst_bin"
    else
        ac_warn "Expected $dst_bin after extraction but it's missing."
    fi
}

# Try unzip → PowerShell → python in that order. Whichever exists wins.
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

    ac_warn "Need one of: unzip, powershell.exe, python — none found."
    return 1
}

# Patch ~/.claude/settings.json with the PreToolUse/Bash hook. Idempotent.
ac_rtk_wire_hook() {
    local settings="$CLAUDE_CONFIG_DIR/settings.json"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ ac_merge_hook $settings PreToolUse 'rtk hook claude' Bash"
        return 0
    fi
    ac_merge_hook "$settings" "PreToolUse" "rtk hook claude" "Bash"
    ac_info "Registered PreToolUse/Bash hook → 'rtk hook claude' in $settings"
}