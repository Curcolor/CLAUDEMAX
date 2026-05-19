#!/usr/bin/env bash
# Install RTK (rust token killer) and wire its Claude Code hook.
# Upstream installer: https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh

ac_component_rtk() {
    ac_step "RTK — token-saving proxy for shell commands"

    if ac_have rtk && [ "${FORCE:-0}" != "1" ]; then
        ac_info "rtk already installed ($(rtk --version 2>/dev/null | head -n1)); skipping. Use --force to reinstall."
    else
        ac_info "Installing rtk from https://github.com/rtk-ai/rtk ..."
        if [ "${DRY_RUN:-0}" = "1" ]; then
            ac_dim "\$ curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh"
        else
            curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh \
                || { ac_warn "rtk install script failed — continuing without rtk."; return 0; }
        fi
    fi

    # Re-check PATH: install.sh puts rtk in $HOME/.local/bin which may not be on PATH yet.
    if ! ac_have rtk && [ -x "$HOME/.local/bin/rtk" ]; then
        export PATH="$HOME/.local/bin:$PATH"
    fi

    if ac_have rtk; then
        ac_info "Wiring rtk's Claude Code hook: rtk init --global"
        ac_run rtk init --global || ac_warn "rtk init --global returned non-zero — hook may not be wired."
        ac_info "Verify: $(rtk --version 2>/dev/null | head -n1)"
    else
        ac_warn "rtk binary still not on PATH. Add 'export PATH=\"\$HOME/.local/bin:\$PATH\"' to your shell profile."
    fi
}
