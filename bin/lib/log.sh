#!/usr/bin/env bash
# Helpers de logging. Basado en install-RTK.sh:11-28.
# Solo para source; no ejecutar.

if [ "${NO_COLOR:-0}" = "1" ] || [ -n "${ABSOLUTE_NO_COLOR:-}" ]; then
    AC_RED=""
    AC_GREEN=""
    AC_YELLOW=""
    AC_BLUE=""
    AC_DIM=""
    AC_NC=""
else
    AC_RED='\033[0;31m'
    AC_GREEN='\033[0;32m'
    AC_YELLOW='\033[1;33m'
    AC_BLUE='\033[0;34m'
    AC_DIM='\033[2m'
    AC_NC='\033[0m'
fi

ac_info()  { printf "${AC_GREEN}[INFO]${AC_NC}  %s\n" "$*"; }
ac_warn()  { printf "${AC_YELLOW}[WARN]${AC_NC}  %s\n" "$*" >&2; }
ac_error() { printf "${AC_RED}[ERR]${AC_NC}   %s\n" "$*" >&2; }
ac_step()  { printf "\n${AC_BLUE}==>${AC_NC} %s\n" "$*"; }
ac_dim()   { printf "${AC_DIM}%s${AC_NC}\n" "$*"; }

ac_die() {
    ac_error "$*"
    exit 1
}

# Ejecuta un comando, o solo lo imprime si DRY_RUN=1.
ac_run() {
    if [ "${DRY_RUN:-0}" = "1" ]; then
        printf "${AC_DIM}\$ %s${AC_NC}\n" "$*"
        return 0
    fi
    "$@"
}
