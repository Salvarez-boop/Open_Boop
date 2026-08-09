# Análisis del Framework — OpenClaw 🦈

> Documentación interna de Boop. Para leer el domingo.
> Versión: 2026-08-09 | Fuente: docs oficiales de OpenClaw

---

## 1. Visión General — ¿Qué es OpenClaw?

OpenClaw es un **framework de agentes IA** que conecta modelos de lenguaje (LLMs) con canales de mensajería, herramientas del sistema y automatizaciones. No es un LLM — es el **sistema operativo del agente**.

```
Usuario → [Canal: Telegram/Discord/Slack/WhatsApp]
              ↓
        [Gateway: WebSocket Server]
              ↓
        [Agent Loop: Contexto + Modelo + Tools]
              ↓
        [Ejecución: Herramientas, APIs, Sistema]
              ↓
        [Respuesta: al usuario]
```

---

## 2. Arquitectura del Gateway

El **Gateway** es el núcleo. Es un servidor WebSocket que:

- Escucha en `127.0.0.1:18789` (por defecto)
- Maneja todas las conexiones (mensajería, CLI, web, nodes)
- Un solo Gateway por host
- Sirve también el **canvas host** (HTML/CSS/JS) y el dashboard web

### Componentes

| Componente | Rol |
|------------|-----|
| **Gateway** | Daemon que mantiene conexiones con providers, valida mensajes, emite eventos |
| **Clientes** | App macOS, CLI, web admin — se conectan por WS |
| **Nodes** | Dispositivos (macOS/iOS/Android) con `role: node`, comandos de cámara, canvas, pantalla |
| **Canales** | Telegram, WhatsApp, Discord, Signal, iMessage, Slack, etc. |
| **WebChat** | UI estática que usa la misma API WS |

### Protocolo

- Transporte: WebSocket, frames JSON
- Primera conexión **debe** ser `connect`
- Handshake + auth token
- Idempotency keys para métodos con side effects (`send`, `agent`)
- Pairing basado en device identity

---

## 3. Agent Loop — El Ciclo de Vida

El **agent loop** es el proceso serializado que convierte un mensaje en acciones y respuesta.

### Secuencia

```
1. RPC agent → valida params, resuelve sesión, devuelve runId
2. agentCommand → resuelve modelo, carga skills, ejecuta runEmbeddedAgent
3. runEmbeddedAgent → serializa runs (cola por sesión), construye sesión, emite eventos
4. subscribeEmbeddedAgentSession → puentea eventos al stream
5. agent.wait → espera lifecycle end/error
```

### Streaming

Los eventos se transmiten en 3 streams:

| Stream | Contenido |
|--------|-----------|
| `lifecycle` | start / end / error del run |
| `assistant` | Deltas de respuesta del modelo |
| `tool` | Eventos de herramientas (start, update, end) |

### Timeouts

| Timeout | Default | 
|---------|---------|
| Agent runtime | 48h |
| Model idle | 120s (ajustable) |
| Provider HTTP | configurable |

---

## 4. Agent Runtimes — ¿Dónde se ejecuta el modelo?

OpenClaw separa **provider** (Anthropic, OpenAI) de **runtime** (cómo se ejecuta).

| Layer | Ejemplos | Significado |
|-------|----------|-------------|
| Provider | `anthropic`, `openai`, `github-copilot` | Cómo autentica y descubre modelos |
| Model | `claude-opus-4-6`, `gpt-5.5` | El modelo seleccionado |
| Agent runtime | `openclaw`, `codex`, `copilot` | El loop que ejecuta el turno |
| Channel | Telegram, Slack, Discord | Donde entran/salen mensajes |

### Runtimes disponibles

| Runtime | Dueño del loop | Tools nativas | Compaction |
|---------|----------------|---------------|------------|
| **openclaw** (embedded) | OpenClaw | Sí | OpenClaw |
| **codex** (app-server) | Codex server | Puenteadas | Codex nativa |
| **copilot** (plugin) | GitHub Copilot | Puenteadas | Según plugin |

Boop corre bajo el runtime **`openclaw`** (embedded) — el más completo para herramientas del sistema.

---

## 5. Context Engine — Cómo se construye el contexto

El **context engine** controla qué ve el modelo en cada turno.

### Ciclo de vida

1. **Ingest** → cuando se agrega un mensaje nuevo
2. **Assemble** → antes de cada run, devuelve mensajes + `systemPromptAddition`
3. **Compact** → cuando el contexto está lleno, resume historial
4. **After turn** → después del run, persiste estado

### Engine por defecto: `legacy`

- Ingest: no-op (session manager maneja persistencia)
- Assemble: pass-through
- Compact: summarization nativa
- No registra tools adicionales

Se pueden instalar engines plugin para estrategias avanzadas (DAG, vector retrieval, etc.)

---

## 6. Session Management — Sesiones

OpenClaw enruta cada mensaje a una **sesión** según origen.

| Origen | Comportamiento |
|--------|----------------|
| DM | Sesión compartida (default) |
| Grupos | Aislada por grupo |
| Canales | Aislada por canal |
| Cron jobs | Sesión fresca por run |
| Webhooks | Aislada por hook |

### DM isolation

Para múltiples usuarios, se puede aislar por `session.dmScope`:

- `main` (default) — todos comparten sesión
- `per-peer` — por sender, cruzando canales
- `per-channel-peer` — por canal + sender (recomendado)

---

## 7. Tools — Herramientas del Agente

Las tools son las capacidades ejecutables de Boop. Se dividen en:

### Herramientas Runtime (nativas de OpenClaw)

| Tool | Función |
|------|---------|
| `read` | Leer archivos |
| `write` | Escribir archivos |
| `edit` | Editar archivos con precisión |
| `exec` | Ejecutar comandos shell |
| `process` | Gestionar procesos en background |
| `web_search` | Buscar en web |
| `web_fetch` | Extraer contenido de URLs |
| `sessions_send/spawn` | Enviar mensajes, crear subagentes |
| `cron` | Programar tareas periódicas |
| `memory_search/get` | Buscar en memoria |
| `image` | Analizar imágenes |
| `image_generate` | Generar imágenes |
| `gateway` | Configurar OpenClaw |
| `session_status` | Ver estado de sesión |

### Mecanismo de aprobación

- `exec_approvals` — comandos elevados necesitan `/approve`
- Políticas de tools configurables por canal/usuario

---

## 8. Skills System — Sistema de Habilidades

Las **skills** son módulos de instrucciones especializadas. Se cargan al inicio de cada sesión desde `SKILL.md`.

### Estructura de una skill

```
skill-name/
  SKILL.md         → instrucciones + frontmatter YAML
  scripts/         → helpers determinísticos
  references/       → docs cargados solo cuando se necesitan
  assets/          → recursos/templates
```

### Frontmatter

```yaml
---
name: skill-name
description: "Descripción corta"
metadata:
  openclaw:
    emoji: "🔧"
    requires: { bins: ["tool-name"] }
---
```

### Skills preinstaladas (ready)

Son 16 skills que vienen con OpenClaw: browser-automation, canvas, clawhub, diagram-maker, healthcheck, meme-maker, node-connect, node-inspect-debugger, notion, python-debugpy, skill-creator, spike, taskflow, taskflow-inbox-triage, tmux, weather.

### ClawHub

Registro público de skills: `openclaw skills search "query"` → `openclaw skills install skill-name`

---

## 9. Hooks — Eventos del Ciclo de Vida

Dos sistemas de hooks:

### Gateway Hooks (internos)

Scripts event-driven para comandos (`/new`, `/reset`, `/stop`) y eventos de ciclo.

### Plugin Hooks (extensión)

| Hook | Cuándo corre |
|------|--------------|
| `before_model_resolve` | Antes de resolver provider/model |
| `before_prompt_build` | Antes de construir el prompt |
| `before_agent_reply` | Antes de la llamada al LLM |
| `agent_end` | Después de completar |
| `before_tool_call` | Antes de ejecutar una tool |
| `after_tool_call` | Después de ejecutar una tool |
| `message_received/sending/sent` | Ciclo de mensajes |
| `session_start/end` | Ciclo de sesión |
| `gateway_start/stop` | Ciclo del gateway |

---

## 10. Seguridad

### Capas

1. **Auth**: token compartido en conexión WS (o Tailscale, trusted-proxy)
2. **Pairing**: dispositivos nuevos requieren aprobación
3. **Exec approvals**: comandos shell requieren `/approve` según política
4. **Sandbox**: ejecuciones en entorno aislado (opcional)
5. **Git hooks**: pre-commit + git-secrets para prevenir fugas
6. **Tool policy**: permisos granulares por tool

### Git hooks (como los que configuramos)

- `.githooks/pre-commit` — escanea cada commit
- `git-secrets` — 15 patrones de credenciales
- `core.hooksPath` — apunta a `.githooks/` versionado

---

## 11. Model Providers — Proveedores de Modelo

OpenClaw soporta **decenas de providers**:

### Principales

| Provider | Modelos |
|----------|---------|
| Anthropic | Claude Opus, Sonnet, Haiku |
| OpenAI | GPT-4o, GPT-5, o-series |
| Google | Gemini |
| Meta | Llama (via providers) |
| DeepSeek | DeepSeek V3/R1 |
| Mistral | Mistral Large/Small |
| Ollama | Modelos locales |
| OpenRouter | Multi-provider unified |
| Groq, Fireworks, Together | Hosting rápido |

### Boop corre actualmente con:

```
model=litellm/online/openrouter/deepseek/deepseek-v4-flash
```

---

## 12. Compaction — Compresión de Contexto

Cuando la conversación supera el límite de tokens del modelo, OpenClaw **compacta**:

- Resume el historial antiguo en un resumen
- Mantiene mensajes recientes intactos
- Gatillo: `/compact` manual o auto al alcanzar el límite
- El engine `legacy` usa summarization nativa

---

## 13. SubAgents — Agentes Hijos

OpenClaw permite **sesiones hijas** que ejecutan trabajo en paralelo o delegado:

- `sessions_spawn` → crear subagente aislado
- `sessions_yield` → esperar resultados
- `subagents list` → ver estado
- `sessions_send` → comunicarse entre sesiones

Usos típicos: investigación paralela, procesamiento batch, tareas de larga duración.

---

## 14. Memoria — Persistencia

Tres sistemas de memoria:

| Sistema | Propósito |
|---------|-----------|
| **Archivos workspace** | AGENTS.md, MEMORY.md, SOUL.md, USER.md — persistencia entre sesiones |
| **Memory search** | Búsqueda semántica sobre archivos + sesiones previas |
| **Memoria built-in** | Memoria interna de OpenClaw (configurable con plugins) |

---

## Resumen — Stack Completo de Boop

```
Canal: Telegram (inbound)
Provider: OpenRouter / DeepSeek V4 Flash
Runtime: OpenClaw (embedded) 
Context Engine: legacy
Gateway: WS en VPS Linux
Tools: exec, read, write, edit, web, git, cron, sessions, memory
Skills: 16 ready + skills workshop
Seguridad: SSH + git-secrets + pre-commit hooks + exec approvals
Workspace: ~/.openclaw/workspace → GitHub (repo sanitizado)
```

---

*Documentado por Boop 🦈 — 2026-08-09 | Basado en docs oficiales de OpenClaw*