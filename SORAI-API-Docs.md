# SORAI — API Documentation

> Documentation of the request/response contract that **SORAI** (web app + `SORAI.sh` CLI)
> uses to talk to its backend. SORAI is a client — it does not expose its own API.
> It speaks to **any OpenAI-compatible Chat Completions endpoint**
> (default: Alibaba Cloud DashScope).

---

## 1. Configuration

| Setting   | Web app (`SettingsModal`)                          | CLI (`SORAI.sh`)                                  |
|-----------|----------------------------------------------------|---------------------------------------------------|
| API Key   | Settings → "API Key"                               | `/key <api_key>` or `/config` wizard              |
| Base URL  | Settings → "API Base URL"                          | `/url <base_url>` or `/config` wizard             |
| Model     | Settings → "Model" dropdown                        | `/model <name>` (session only) or `/config`       |
| Storage   | `localStorage["sorai-api-config"]` (JSON)          | `$HOME/.sorai-cli/config` (shell-sourced file)    |

**Defaults**

```json
{
  "apiKey": "",
  "model": "qwen-plus",
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1"
}
```

**Supported models (web app dropdown):** `qwen-plus`, `qwen-turbo`, `qwen-max`, `qwen-long`,
`qwen2.5-72b-instruct`, `qwen2.5-32b-instruct`, `qwen2.5-14b-instruct`, `qwen2.5-7b-instruct`.
Any model string is accepted by the CLI (`/model <anything>`).

---

## 2. Endpoint

```
POST {baseUrl}/chat/completions
```

The full URL is built by concatenating the configured `baseUrl` with `/chat/completions`
(`useChat.ts`: ``fetch(`${apiConfig.baseUrl}/chat/completions`)``; `SORAI.sh`: `"$BASE_URL/chat/completions"`).

### Headers

| Header           | Value                    |
|------------------|--------------------------|
| `Content-Type`   | `application/json`       |
| `Authorization`  | `Bearer <API_KEY>`       |

### Request body

| Parameter          | Type    | Required | Description |
|--------------------|---------|----------|-------------|
| `model`            | string  | yes      | Model name, e.g. `qwen-plus` |
| `messages`         | array   | yes      | Conversation history. Items: `{ "role": "user"\|"assistant", "content": "..." }`. The full history of the active conversation is resent on every call (no server-side memory). |
| `stream`           | boolean | yes      | Always `true` in SORAI — both clients are streaming-only. |
| `enable_thinking`  | boolean | CLI only | Sent by `SORAI.sh` when `/think on` (default `on`). Passed through to backends that support Qwen-style reasoning (e.g. `qwen3` series). The web app does **not** send this field. |

**Example body (as sent by `SORAI.sh`):**

```json
{
  "model": "qwen-plus",
  "messages": [
    { "role": "user", "content": "hello" }
  ],
  "stream": true,
  "enable_thinking": true
}
```

### cURL example (identical to what the CLI sends)

```bash
curl -sN -X POST "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"model":"qwen-plus","messages":[{"role":"user","content":"hello"}],"stream":true,"enable_thinking":false}'
```

---

## 3. Response

### Success — SSE stream (`200 OK`, `Content-Type: text/event-stream`)

The body is a stream of lines. Each event line starts with `data: `; the stream ends
with `data: [DONE]`. Lines not starting with `data:` are ignored by the client.

**Event payload (chunk):**

```json
{
  "choices": [
    {
      "delta": {
        "role": "assistant",
        "content": " chunk of the answer ",
        "reasoning_content": " chunk of thinking (if enable_thinking supported) "
      },
      "index": 0
    }
  ]
}
```

| Field | Client behavior |
|-------|-----------------|
| `choices[0].delta.content` | Appended to the answer and rendered live. |
| `choices[0].delta.reasoning_content` | CLI-only: rendered dimmed/italicized under a `💭 thinking` header before the answer. Falls back to `choices[0].message.reasoning_content` (non-streaming shape). |
| `data: [DONE]` | Terminator. Client stops reading (it does not parse it as JSON). |

The final answer is the concatenation of all `delta.content` chunks; SORAI then appends
`{role:"assistant", content:<full answer>}` to its local history so the next request
includes it.

### Non-streaming shape (if `stream: false` were used)

```json
{
  "choices": [
    {
      "message": { "role": "assistant", "content": "full answer" },
      "index": 0
    }
  ]
}
```
(The CLI's jq fallback reads `choices[0].message.content` for this shape.)

### Errors

Non-2xx responses are handled as follows:

- Web app: reads the body, parses JSON, and shows `error.message` (or `message`),
  falling back to `API Error (<status>)`.
- CLI: empty reply → prints curl's stderr details and rolls the last user message back
  out of history.

Typical error payload (OpenAI-compatible):

```json
{ "error": { "message": "Invalid API key", "type": "invalid_request_error", "code": "401" } }
```

| Status | Common cause |
|--------|--------------|
| `401` | Missing/invalid API key |
| `429` | Rate limit / quota exhausted |
| `4xx` | Bad model name or malformed body |
| Network failure | CLI prints the curl error; web app shows `⚠️ <message>` |

---

## 4. Client-specific behaviors worth knowing

- **History is client-side only.** Each call sends the full message array; there is no
  session ID, no cookies.
- **Abort:** the web app uses `AbortController` on the fetch (stop button); the CLI
  relies on killing the curl read loop.
- **Retry on failure:** none — a failed turn removes the user message from local history
  (CLI) or renders the error in place of the answer (web app).
- **Thinking mode caveat:** if the model returns only `reasoning_content` and no final
  `content`, the CLI warns: *"Model only returned thinking text, no final answer"* and
  suggests `/think off`.

---

## 5. Environment setup for the provided services (per `need.txt`)

| Service | Purpose |
|---------|---------|
| `https://qwencloud.com/` | Obtain a free API key (DashScope-compatible) |
| `https://qrypty.com/` | Disposable/temporary email for sign-up |
