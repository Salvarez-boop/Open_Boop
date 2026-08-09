# FAQ — Skills Ready 🧩

> Skills preinstaladas con OpenClaw — listas para usar sin configuración adicional.

---

## ¿Qué son las Skills en OpenClaw?

Son **módulos de instrucciones especializadas** que le dicen al agente cómo ejecutar tareas específicas. Cada skill tiene:
- **Trigger** — cuándo usarla
- **Workflow** — pasos a seguir
- **Reglas** — límites y buenas prácticas
- **Estructura** — archivos y organización

---

## Skills Ready (16 disponibles)

---

### 1. 🌐 browser-automation

**¿Para qué sirve?**
Controlar páginas web con el browser de OpenClaw: multi-step flows, login checks, tab management, recuperación de referencias stale.

**Estructura de la skill:**
- `SKILL.md` — instrucciones de uso
- Vive en extensiones de OpenClaw (no en skills/ estándar)

**Flujo de decisión:**
```
1. Check browser state → status / profiles / tabs
2. Prefer stable tab handles (label, suggestedTargetId)
3. Read before click → snapshot con refs="aria"
4. Act narrowly → act() con ref del snapshot más reciente
5. Report real blockers → login, captcha, 2FA, permisos
```

**Reglas clave:**
- Usar snapshot antes de cada click o acción
- No esperar a ciegas — esperar a que UI visible cambie
- Stale ref recovery: snapshot → buscar nuevo ref → retry
- Etiquetar tabs con `label` para reuso

---

### 2. 🖼️ canvas

**¿Para qué sirve?**
Presentar HTML en nodos conectados (macOS, iOS, Android) mediante canvases interactivos.

**Estructura:**
- `SKILL.md` — instrucciones
- Config en `openclaw.json`: `plugins.entries.canvas.config`
- Archivos HTML en `~/.openclaw/canvas/`

**Flujo de decisión:**
```
1. Asegurar Canvas host habilitado
2. Poner HTML/CSS/JS bajo canvas root
3. Determinar ruta reachable para el nodo destino
4. Presentar URL: http://<gateway>:<port>/__openclaw__/canvas/<file>.html
5. Usar snapshot cuando se necesita evidencia
```

**URL shape:**
```
http://<host>:<port>/__openclaw__/canvas/index.html
http://<host>:<port>/__openclaw__/canvas/games/snake.html
```

---

### 3. 🔍 clawhub

**¿Para qué sirve?**
Buscar, instalar, verificar, actualizar, publicar y sincronizar skills desde ClawHub (registro público de skills).

**Estructura:**
- `SKILL.md` — instrucciones
- Registro público: https://clawhub.ai

**Flujo de decisión:**
```
1. Buscar skill: openclaw skills search "<query>"
2. Verificar skill antes de instalar: openclaw skills verify <skill>
3. Obtener aprobación del usuario
4. Instalar: openclaw skills install <skill>
5. Ver estado: openclaw skills list
```

**Comandos principales:**
| Acción | Comando |
|--------|---------|
| Buscar | `openclaw skills search "postgres backups"` |
| Verificar | `openclaw skills verify my-skill` |
| Instalar | `openclaw skills install my-skill` |
| Listar | `openclaw skills list` |
| Actualizar | `openclaw skills update --all` |

---

### 4. 🧭 diagram-maker

**¿Para qué sirve?**
Crear diagramas SVG/HTML o Excalidraw para conceptos, arquitectura, flujos y whiteboards.

**Estructura:**
- `SKILL.md` — instrucciones
- `references/svg-template.md` — template SVG
- `references/excalidraw-patterns.md` — snippets Excalidraw

**Flujo de decisión:**
```
1. Elegir formato según el caso:
   - clean-svg → conceptos, procesos, physical systems
   - architecture-svg → software/cloud/infra topology
   - excalidraw → editable, colaborativo, whiteboard
2. Extraer nodos, grupos, labels, relaciones
3. Elegir layout (L→R, top→down, hub-spoke, swimlanes)
4. Generar archivo
5. Verificar sintaxis
```

**Reglas SVG/HTML:**
- Single standalone HTML con inline CSS y SVG
- Sin fuentes externas, JS, imágenes, o assets remotos
- Colores semánticos, no secuencias arcoíris
- Conectores antes que nodos

---

### 5. 🛡️ healthcheck

**¿Para qué sirve?**
Auditar y endurecer hosts de OpenClaw: SSH, firewall, updates, exposición, backups, disk encryption, gateway security.

**Estructura:**
- `SKILL.md` — instrucciones y comandos

**Flujo de decisión:**
```
1. Inferir contexto: OS, privilegios, acceso, exposición
2. Preguntar solo datos faltantes
3. Pedir permiso para checks read-only
4. Ejecutar comandos de diagnóstico
5. Determinar perfil de riesgo deseado:
   - Convenience (local/privado)
   - Balanced (defaults seguros)
   - Strict (remoto/público)
6. Generar reporte con hallazgos + plan de hardening
```

**Checks comunes:**
```bash
openclaw security audit --deep
openclaw gateway status --deep
# Linux: ss, ufw, systemctl status ssh
# macOS: lsof, pfctl, fdesetup, softwareupdate
```

---

### 6. 🖼️ meme-maker

**¿Para qué sirve?**
Generar memes a partir de un registro curado de templates, con render local SVG/PNG o Imgflip hosted.

**Estructura:**
- `SKILL.md` — instrucciones
- `scripts/meme.mjs` — script principal
- `references/templates.json` — 20 templates curados

**Flujo de decisión:**
```
1. Search: buscar template por nombre/tema
2. Suggest: si usuario no sabe formato, sugerir template
3. Render: generar meme en SVG (local) o PNG (Imgflip)
4. Output: archivo local o URL hosted
```

**Comandos:**
```bash
# Buscar template
meme.mjs search "bad choice"

# Sugerir formato para un tema
meme.mjs suggest "slow python"

# Render local SVG
meme.mjs render drake --text "texto1" --text "texto2" --out /tmp/meme.svg

# Render Imgflip (requiere credenciales)
meme.mjs render drake --service imgflip --text "a" --text "b"
```

---

### 7. 📱 node-connect

**¿Para qué sirve?**
Diagnosticar conexión de nodos OpenClaw (Android, iOS, macOS): pairing, QR/setup code, route, auth, y fallos de conexión.

**Estructura:**
- `SKILL.md` — instrucciones y mapas de causa raíz

**Flujo de decisión:**
```
1. Determinar topología:
   - mismo equipo / emulador / USB tunnel
   - misma LAN / Wi-Fi local
   - mismo Tailscale tailnet
   - URL pública / reverse proxy
2. Si ambigüo → preguntar antes de diagnosticar
3. Ejecutar checks canónicos: openclaw qr --json
4. Leer resultado, no adivinar
5. Mapa de causa raíz según error
```

**Checks canónicos:**
```bash
openclaw qr --json              # Ver ruta de conexión
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw devices list
```

---

### 8. 🪲 node-inspect-debugger

**¿Para qué sirve?**
Debuggear Node.js con inspector: hidden locals, async hangs, flaky tests, child processes, memory growth, CPU hot paths.

**Estructura:**
- `SKILL.md` — instrucciones y ejemplos

**Flujo de decisión:**
```
1. Elegir método según caso:
   - node inspect → debug interactivo rápido
   - node --inspect-brk → pausar al inicio
   - CDP → breakpoints scripteados, heap snapshots
2. Configurar breakpoints
3. Inspeccionar estado (call stack, variables)
4. Step/continue según necesidad
5. Generar profiles (CPU/heap) si es necesario
```

**Comandos rápidos:**
```bash
node inspect path/to/script.js
node --inspect-brk path/to/script.ts
kill -SIGUSR1 <pid> && node inspect -p <pid>
```

---

### 9. 📝 notion

**¿Para qué sirve?**
Integración con Notion: leer/escribir páginas, consultar databases, comments, search, y API raw.

**Estructura:**
- `SKILL.md` — instrucciones
- Requiere: `ntn` CLI o `curl`
- Requiere: `NOTION_API_TOKEN`

**Flujo de decisión:**
```
1. Setup: ntn login o export NOTION_API_TOKEN
2. Inspeccionar: ntn doctor, ntn api ls
3. Páginas: get / create / update / trash
4. Data sources: resolve / query con filtros
5. API raw para casos especiales
```

**Comandos:**
```bash
ntn pages get <page-id>
ntn pages create --parent page:<id> --content '# Title'
ntn datasources query <ds-id> --limit 50
```

---

### 10. 🐍 python-debugpy

**¿Para qué sirve?**
Debuggear Python con pdb, breakpoint(), post-mortem y debugpy remote attach.

**Estructura:**
- `SKILL.md` — instrucciones

**Flujo de decisión:**
```
1. Elegir método mínimo que llegue al bad frame:
   - breakpoint() → local, editable
   - python3 -m pdb → sin editar código
   - pdb -c continue → parar en excepción
   - debugpy → remoto, headless, PID attach
2. Reproducir con el comando más pequeño posible
3. Inspeccionar: p expr, pp, display
4. Arreglar
5. Cleanup: borrar breakpoints del código
```

**Comandos:**
```bash
python3 -m pdb script.py
python3 -m debugpy --listen 127.0.0.1:5678 --wait-for-client script.py
```

---

### 11. 🛠️ skill-creator

**¿Para qué sirve?**
Crear, editar, auditar, organizar, validar o reestructurar skills de OpenClaw.

**Estructura de una skill:**
```
skill-name/
  SKILL.md        → instrucciones + frontmatter
  scripts/        → helpers determinísticos (opcional)
  references/     → docs cargados solo cuando se necesitan (opcional)
  assets/         → recursos/templates de output (opcional)
```

**Flujo de decisión:**
```
1. Leer skill existente y recursos asociados
2. Draft del contenido SKILL.md propuesto
3. Usar skill_workshop para crear/revisar propuesta
4. Mantener SKILL.md lean (Codex ya es capaz)
5. Remover consejos genéricos que el modelo ya conoce
6. Validar frontmatter YAML
```

**Reglas:**
- Solo `name` + `description` son obligatorios en frontmatter
- `description` debe ir entre comillas
- Validar YAML después de cada edición
- Usar `skill_workshop`, no shell commands

---

### 12. 🧪 spike

**¿Para qué sirve?**
Prototipos descartables para validar factibilidad, comparar enfoques, y emitir un veredicto antes de construir en serio.

**Estructura:**
- `SKILL.md` — instrucciones
- Output default: `.tmp/openclaw-spikes/<slug>/`
- Output opcional: `spikes/<NNN-slug>/`

**Flujo de decisión:**
```
1. Question → formular pregunta de factibilidad concreta
2. Research → leer docs/source para elegir enfoque
3. Build → artefacto mínimo ejecutable
4. Stress → probar un edge case o modo de fallo
5. Verdict → VALIDATED | PARTIAL | INVALIDATED
```

**Formato de veredicto:**
```markdown
## Verdict: VALIDATED

Question: ¿Es posible X con Y?
Evidence: comando/output exacto
What worked: ...
What failed: ...
Recommendation: ship / adjust / avoid
```

---

### 13. 🪝 taskflow

**¿Para qué sirve?**
Coordinar tareas multi-paso que sobreviven a un solo prompt: flujos durables con estado, waits, y child tasks.

**Estructura:**
- `SKILL.md` — instrucciones y API reference

**Flujo de decisión:**
```
1. createManaged(controllerId, goal, stateJson)
2. runTask(flowId, runtime, childSessionKey, task)
3. setWaiting(flowId, step, waitJson) → si espera input externo
4. resume(flowId) → cuando el input llega
5. finish(flowId) o fail(flowId)
```

**Cuándo usarlo:**
- Trabajo multi-paso que excede un prompt
- Tareas que esperan respuestas humanas o externas
- Jobs que necesitan estado persistente entre pasos
- Trabajo que debe sobrevivir reinicios

---

### 14. 📥 taskflow-inbox-triage

**¿Para qué sirve?**
Patrón concreto de TaskFlow para triage de bandeja de entrada: clasificar items, routing, esperar replies, y resúmenes EOD.

**Estructura:**
- `SKILL.md` — ejemplo de implementación

**Flujo de decisión:**
```
1. Crear un flow para el batch de inbox
2. Clasificar items (detached task)
3. Business → post a Slack y esperar reply
4. Personal → notificar ahora
5. Otros → guardar para EOD summary
6. Finalizar cuando el batch esté procesado
```

**State shape sugerido:**
```json
{
  "businessThreads": [],
  "personalItems": [],
  "eodSummary": []
}
```

---

### 15. 🧵 tmux

**¿Para qué sirve?**
Controlar sesiones tmux interactivas: listar, capturar output, enviar teclas, pegar texto, monitorear prompts.

**Estructura:**
- `SKILL.md` — instrucciones
- `scripts/find-sessions.sh` — descubrir sesiones
- `scripts/wait-for-text.sh` — esperar texto en pane

**Flujo de decisión:**
```
1. Listar sesiones: tmux ls
2. Identificar target: session:window.pane
3. Capturar estado actual: capture-pane
4. Enviar input si es necesario: send-keys
5. Verificar resultado: capture-pane + grep
```

**Target format:**
```
shared:0.0    → sesión "shared", ventana 0, pane 0
```

**Comandos:**
```bash
tmux capture-pane -t shared:0.0 -p          # Capturar output
tmux send-keys -t shared:0.0 -l -- "texto"  # Enviar texto
tmux send-keys -t shared:0.0 Enter          # Enter
tmux send-keys -t shared:0.0 C-c            # Ctrl+C
```

---

### 16. ☔ weather

**¿Para qué sirve?**
Obtener clima actual y pronósticos: temperatura, lluvia, viento, humedad, planificación de viajes.

**Estructura:**
- `SKILL.md` — instrucciones
- Fuente: wttr.in API

**Flujo de decisión:**
```
1. Recibir ubicación (ciudad, región, código aeropuerto, coordenadas)
2. Usar web_fetch para consultar wttr.in en formato JSON
3. Extraer: current_condition, forecast
4. Resumir datos relevantes (temp, feels like, precip, wind)
5. Si web_fetch no disponible → fallback a curl
```

**Campos JSON útiles:**
```json
current_condition[0].temp_C
current_condition[0].FeelsLikeC
current_condition[0].precipMM
current_condition[0].humidity
current_condition[0].windspeedKmph
weather[].maxtempC / mintempC
```

---

## Resumen: Matriz de Skills Ready

| # | Skill | Tipo | Trigger principal |
|---|-------|------|-------------------|
| 1 | browser-automation | Extensión | Navegación web multi-step |
| 2 | canvas | Extensión | Mostrar HTML en nodos |
| 3 | clawhub | Core | Buscar/instalar skills |
| 4 | diagram-maker | Core | Crear diagramas |
| 5 | healthcheck | Core | Auditoría de seguridad |
| 6 | meme-maker | Core | Generar memes |
| 7 | node-connect | Core | Diagnóstico de nodos |
| 8 | node-inspect-debugger | Core | Debug Node.js |
| 9 | notion | Core | API de Notion |
| 10 | python-debugpy | Core | Debug Python |
| 11 | skill-creator | Core | Crear/editar skills |
| 12 | spike | Core | Prototipos rápidos |
| 13 | taskflow | Core | Flujos multi-paso durables |
| 14 | taskflow-inbox-triage | Core | Patrón de inbox |
| 15 | tmux | Core | Control de tmux |
| 16 | weather | Core | Clima y pronósticos |

---

*Documentado por Boop 🦈 — 2026-08-09*