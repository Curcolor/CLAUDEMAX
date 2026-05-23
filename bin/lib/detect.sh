#!/usr/bin/env bash
# Tool detection. Source-only.
# Exports: AC_HAS_CLAUDE, AC_HAS_OPENCODE, AC_HAS_NODE, AC_HAS_NPM, AC_HAS_GIT, AC_HAS_CURL,
#          AC_NODE_MAJOR, AC_OS, AC_ARCH.

ac_have() { command -v "$1" >/dev/null 2>&1; }

ac_detect_os() {
    case "$(uname -s 2>/dev/null)" in
        MINGW*|MSYS*|CYGWIN*) AC_OS=windows ;;
        Darwin)               AC_OS=macos ;;
        Linux)                AC_OS=linux ;;
        *)                    AC_OS=unknown ;;
    esac
    case "$(uname -m 2>/dev/null)" in
        x86_64|amd64)         AC_ARCH=x86_64 ;;
        arm64|aarch64)        AC_ARCH=aarch64 ;;
        *)                    AC_ARCH=unknown ;;
    esac
    export AC_OS AC_ARCH
}

ac_detect_all() {
    ac_detect_os
    AC_HAS_CURL=0; ac_have curl     && AC_HAS_CURL=1
    AC_HAS_GIT=0;  ac_have git      && AC_HAS_GIT=1
    AC_HAS_NODE=0; ac_have node     && AC_HAS_NODE=1
    AC_HAS_NPM=0;  ac_have npm      && AC_HAS_NPM=1
    AC_HAS_CLAUDE=0;   ac_have claude   && AC_HAS_CLAUDE=1
    AC_HAS_OPENCODE=0; ac_have opencode && AC_HAS_OPENCODE=1

    AC_NODE_MAJOR=0
    if [ "$AC_HAS_NODE" = "1" ]; then
        AC_NODE_MAJOR=$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))' 2>/dev/null || echo 0)
    fi

    export AC_HAS_CURL AC_HAS_GIT AC_HAS_NODE AC_HAS_NPM AC_HAS_CLAUDE AC_HAS_OPENCODE AC_NODE_MAJOR
}

# Verify required tools. Collects all failures before exiting so the user sees them at once.
ac_require_tools() {
    local missing=()
    [ "$AC_HAS_CURL" = "1" ] || missing+=("curl")
    [ "$AC_HAS_GIT"  = "1" ] || missing+=("git")
    [ "$AC_HAS_NODE" = "1" ] || missing+=("node (>=18)")
    [ "$AC_HAS_NPM"  = "1" ] || missing+=("npm")

    if [ "$AC_HAS_NODE" = "1" ] && [ "$AC_NODE_MAJOR" -lt 18 ] 2>/dev/null; then
        missing+=("node>=18 (have $AC_NODE_MAJOR)")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        ac_error "Missing required tools: ${missing[*]}"
        ac_error "Install them and re-run."
        exit 1
    fi

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "Claude Code CLI ('claude') not on PATH — MCP registration steps will be skipped."
        ac_warn "Install from https://claude.com/claude-code then re-run with --force."
    fi
}

ac_summary() {
    ac_dim "  os=$AC_OS/$AC_ARCH curl=$AC_HAS_CURL git=$AC_HAS_GIT node=$AC_HAS_NODE(v$AC_NODE_MAJOR) npm=$AC_HAS_NPM claude=$AC_HAS_CLAUDE opencode=$AC_HAS_OPENCODE"
}
