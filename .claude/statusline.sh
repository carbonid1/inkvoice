#!/bin/bash
# InkVoice project statusline — extends global statusline with server indicators
# Appends project section to line 1: ┃ ● next  ● tts
set -f

input=$(cat)

GLOBAL_SCRIPT="$HOME/.claude/statusline.sh"

# ── Run global statusline ─────────────────────────────
if [ -x "$GLOBAL_SCRIPT" ]; then
    global_output=$("$GLOBAL_SCRIPT" <<< "$input")
else
    global_output="Claude"
fi

# ── Colors (Atom One Dark — matches global palette) ───
green='\033[38;2;152;195;121m'
magenta='\033[38;2;198;120;221m'
white='\033[38;2;171;178;191m'
dim='\033[2m'
reset='\033[0m'

# ── Server status (~5ms each) ─────────────────────────
next_up=false
tts_up=false
lsof -i :3000 -sTCP:LISTEN >/dev/null 2>&1 && next_up=true
lsof -i :8000 -sTCP:LISTEN >/dev/null 2>&1 && tts_up=true

if $next_up; then
    next_ind="${green}●${reset} ${white}next${reset}"
else
    next_ind="${dim}○ next${reset}"
fi

if $tts_up; then
    tts_ind="${green}●${reset} ${white}tts${reset}"
else
    tts_ind="${dim}○ tts${reset}"
fi

# ── Compose output ────────────────────────────────────
project=" ${magenta}┃${reset} ${next_ind}  ${tts_ind}"

# Split global output: append project section to first line only
first_line="${global_output%%$'\n'*}"
rest=""
if [[ "$global_output" == *$'\n'* ]]; then
    rest="${global_output#*$'\n'}"
fi

printf "%b%b" "$first_line" "$project"
[ -n "$rest" ] && printf "\n%b" "$rest"

exit 0
