#!/usr/bin/env bash
# SORAI — terminal chat client with thinking animation + thinking mode.
# Install as a global command named SORAI (see earlier setup notes).

set -uo pipefail

CONFIG_DIR="$HOME/.sorai-cli"
CONFIG_FILE="$CONFIG_DIR/config"
DEFAULT_MODEL="qwen-plus"
DEFAULT_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

mkdir -p "$CONFIG_DIR"

# ---------- colors (ANSI-C quoting: $'...' guarantees real escape bytes) ----------
C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'; C_ITALIC=$'\033[3m'
C_CYAN=$'\033[36m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_RED=$'\033[31m'; C_MAGENTA=$'\033[35m'
C_ORANGE=$'\033[38;5;208m'

YOU_LABEL=$'\033[1;97;44m YOU \033[0m'
SORAI_LABEL=$'\033[1;97;45m SORAI \033[0m'
THINK_LABEL=$'\033[2;3;35m💭 thinking\033[0m'

command -v curl >/dev/null 2>&1 || { echo "curl is required. On Termux: pkg install curl"; exit 1; }
command -v jq   >/dev/null 2>&1 || { echo "jq is required. On Termux: pkg install jq | Debian/Ubuntu: sudo apt install jq"; exit 1; }

API_KEY=""; MODEL="$DEFAULT_MODEL"; BASE_URL="$DEFAULT_BASE_URL"; THINK_MODE="on"

load_config() { [ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"; }
save_config() {
  cat > "$CONFIG_FILE" <<EOF
API_KEY="$API_KEY"
MODEL="$MODEL"
BASE_URL="$BASE_URL"
THINK_MODE="$THINK_MODE"
EOF
}

config_wizard() {
  printf '\n%sSORAI setup%s\n' "$C_BOLD" "$C_RESET"
  read -rp "API key$( [ -n "$API_KEY" ] && echo ' (leave blank to keep current)' ): " k
  read -rp "Model [$MODEL]: " m
  read -rp "Base URL [$BASE_URL]: " u
  [ -n "$k" ] && API_KEY="$k"
  [ -n "$m" ] && MODEL="$m"
  [ -n "$u" ] && BASE_URL="$u"
  save_config
  printf '%sSaved to %s%s\n\n' "$C_GREEN" "$CONFIG_FILE" "$C_RESET"
}

load_config
if [ "${1:-}" = "--config" ] || [ -z "$API_KEY" ]; then
  config_wizard
fi

clear 2>/dev/null || true
printf '%s%s' "$C_MAGENTA" "$C_BOLD"
cat <<'BANNER'
   _____  ____  _____            _____
  / ____|/ __ \|  __ \    /\    |_   _|
 | (___ | |  | | |__) |  /  \     | |
  \___ \| |  | |  _  /  / /\ \    | |
  ____) | |__| | | \ \ / ____ \  _| |_
 |_____/ \____/|_|  \_/_/    \_\|_____|
BANNER
printf '%s%smodel: %s | thinking: %s | type /help for all commands%s\n' \
  "$C_RESET" "$C_DIM" "$MODEL" "$THINK_MODE" "$C_RESET"

HISTORY="[]"
SEP=$'\x1f'

print_help() {
  cat <<EOF

${C_BOLD}${C_MAGENTA}SORAI — terminal chat client${C_RESET}
${C_DIM}A local, terminal-based chat client that talks to any OpenAI-compatible
chat/completions API (e.g. Qwen via dashscope). Config is stored in:
  $CONFIG_FILE${C_RESET}

${C_BOLD}Chatting${C_RESET}
  Just type your message and press Enter. The conversation history is kept
  for the whole session (so the model remembers earlier turns) until you
  run /clear or restart SORAI.

${C_BOLD}General commands${C_RESET}
  /help                 show this help screen
  /clear                start a new conversation (wipes history, keeps config)
  /exit, /quit          leave SORAI

${C_BOLD}Configuration commands${C_RESET}
  /config               open the full setup wizard (API key + model + base URL)
  /key <api_key>        set/replace the API key only, saved immediately
  /url <base_url>       set/replace the base URL only, saved immediately
                         (e.g. /url https://dashscope.aliyuncs.com/compatible-mode/v1)
  /model <name>         switch the model for this session only
                         (e.g. /model qwen-max) — use /config to save it permanently
  /show                 print current config (key is masked)

${C_BOLD}Thinking mode${C_RESET}
  /think on             ask the model to stream its reasoning ("💭 thinking")
                         before the final answer (only works if the model/API
                         supports reasoning_content in the stream)
  /think off            skip reasoning, stream only the final answer (default
                         behavior for models that don't support thinking)

${C_BOLD}Current settings${C_RESET}
  model:      $MODEL
  base URL:   $BASE_URL
  thinking:   $THINK_MODE

EOF
}

print_show() {
  local masked="(not set)"
  if [ -n "$API_KEY" ]; then
    local len=${#API_KEY}
    if [ "$len" -gt 8 ]; then
      masked="${API_KEY:0:4}...${API_KEY: -4}"
    else
      masked="****"
    fi
  fi
  printf '\n%sCurrent config%s\n' "$C_BOLD" "$C_RESET"
  printf '  API key : %s\n' "$masked"
  printf '  model   : %s\n' "$MODEL"
  printf '  base URL: %s\n' "$BASE_URL"
  printf '  thinking: %s\n\n' "$THINK_MODE"
}

SPIN_PID=""
start_spinner() {
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  (
    i=0
    while true; do
      printf '\r%s%s thinking...%s' "$C_DIM" "${frames[i]}" "$C_RESET"
      i=$(( (i + 1) % ${#frames[@]} ))
      sleep 0.08
    done
  ) &
  SPIN_PID=$!
  disown
}
stop_spinner() {
  if [ -n "$SPIN_PID" ]; then
    kill "$SPIN_PID" 2>/dev/null
    wait "$SPIN_PID" 2>/dev/null
    SPIN_PID=""
    printf '\r\033[K'
  fi
}

send_message() {
  local user_content="$1"
  local user_json
  user_json=$(jq -cn --arg c "$user_content" '{role:"user", content:$c}')

  HISTORY="$(printf '%s' "$HISTORY" | jq -c --argjson m "$user_json" '. + [$m]')"

  local think_flag="false"
  [ "$THINK_MODE" = "on" ] && think_flag="true"

  local body
  body=$(jq -cn --arg model "$MODEL" --argjson msgs "$HISTORY" --argjson think "$think_flag" \
    '{model:$model, messages:$msgs, stream:true, enable_thinking:$think}')

  local tmp_err; tmp_err="$(mktemp)"
  local full_reply="" full_thoughts=""
  local shown_thinking_header=0
  local shown_answer_header=0
  local spinner_stopped=0   # <-- track globally so stop_spinner only fires ONCE

  start_spinner

  while IFS= read -r line; do
    [[ "$line" != data:* ]] && continue
    data="${line#data: }"
    [ "$data" = "[DONE]" ] && continue

    parsed=$(printf '%s' "$data" | jq -r --arg sep "$SEP" '
      (.choices[0].delta.reasoning_content // .choices[0].message.reasoning_content // "")
      + $sep +
      (.choices[0].delta.content // .choices[0].message.content // "")
    ' 2>/dev/null) || continue

    thought="${parsed%%"$SEP"*}"
    delta="${parsed#*"$SEP"}"

    # stop the spinner exactly once, on the very first byte of content we see
    if { [ -n "$thought" ] || [ -n "$delta" ]; } && [ "$spinner_stopped" -eq 0 ]; then
      stop_spinner
      spinner_stopped=1
    fi

    if [ -n "$thought" ]; then
      if [ "$shown_thinking_header" -eq 0 ]; then
        printf '%s\n' "$THINK_LABEL"
        shown_thinking_header=1
      fi
      printf '%s%s%s%s' "$C_DIM" "$C_ITALIC" "$thought" "$C_RESET"
      full_thoughts="${full_thoughts}${thought}"
    fi

    if [ -n "$delta" ]; then
      if [ "$shown_answer_header" -eq 0 ]; then
        [ "$shown_thinking_header" -eq 1 ] && printf '\n\n'
        printf '%s %s' "$SORAI_LABEL" "$C_ORANGE"
        shown_answer_header=1
      fi
      printf '%s' "$delta"
      full_reply="${full_reply}${delta}"
    fi
  done < <(curl -sN -X POST "$BASE_URL/chat/completions" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "$body" 2>"$tmp_err")

  [ "$shown_answer_header" -eq 1 ] && printf '%s' "$C_RESET"
  stop_spinner   # safe no-op if already stopped
  echo

  if [ -z "$full_reply" ]; then
    if [ -n "$full_thoughts" ]; then
      printf '%s⚠ Model only returned "thinking" text, no final answer.%s\n' "$C_RED" "$C_RESET"
      printf '%sTry /think off, or increase max tokens / check the model needs a bigger thinking budget.%s\n' "$C_DIM" "$C_RESET"
    else
      printf '%s⚠ No response (check API key / model / network). Details:%s\n' "$C_RED" "$C_RESET"
      cat "$tmp_err"
    fi
    HISTORY="$(printf '%s' "$HISTORY" | jq -c '.[:-1]')"
  else
    local assistant_json
    assistant_json=$(jq -cn --arg c "$full_reply" '{role:"assistant", content:$c}')
    HISTORY="$(printf '%s' "$HISTORY" | jq -c --argjson m "$assistant_json" '. + [$m]')"
  fi
  rm -f "$tmp_err"
}

while true; do
  printf '\n%s ' "$YOU_LABEL"
  IFS= read -r input || { printf '\n%sbye.%s\n' "$C_DIM" "$C_RESET"; break; }
  [ -z "$input" ] && continue

  case "$input" in
    /help) print_help ;;
    /show) print_show ;;
    /exit|/quit) printf '%sbye.%s\n' "$C_DIM" "$C_RESET"; break ;;
    /clear) HISTORY="[]"; printf '%sConversation cleared.%s\n' "$C_YELLOW" "$C_RESET" ;;
    /think\ on) THINK_MODE="on"; save_config; printf '%sThinking display: on%s\n' "$C_YELLOW" "$C_RESET" ;;
    /think\ off) THINK_MODE="off"; save_config; printf '%sThinking display: off%s\n' "$C_YELLOW" "$C_RESET" ;;
    /model\ *)
      MODEL="${input#/model }"
      printf '%sModel set to %s (session only; run /config to save permanently).%s\n' "$C_YELLOW" "$MODEL" "$C_RESET"
      ;;
    /key\ *)
      API_KEY="${input#/key }"
      save_config
      printf '%sAPI key updated and saved.%s\n' "$C_YELLOW" "$C_RESET"
      ;;
    /url\ *)
      BASE_URL="${input#/url }"
      save_config
      printf '%sBase URL updated and saved: %s%s\n' "$C_YELLOW" "$BASE_URL" "$C_RESET"
      ;;
    /config) config_wizard ;;
    /*) printf '%sUnknown command: %s%s (type /help for the full list)\n' "$C_RED" "$input" "$C_RESET" ;;
    *) send_message "$input" ;;
  esac
done