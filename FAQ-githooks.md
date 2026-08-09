# FAQ — .githooks 🪝

> Preguntas frecuentes sobre los hooks de Git versionables.

---

## ¿Qué es `.githooks/`?

Es una carpeta que contiene **scripts que Git ejecuta automáticamente** cuando ocurren ciertos eventos (commit, push, merge, etc.).

Git tradicionalmente guarda estos hooks en `.git/hooks/`, pero esa carpeta **no se versiona** — no viaja con el repositorio. La carpeta `.githooks/` es una **alternativa versionable**: se crea en la raíz del proyecto, se sube al repo y cualquiera que lo clone se lleva los hooks consigo.

---

## ¿Para qué sirve?

Para **automatizar controles en cada operación de Git** sin depender de configuraciones manuales.

Ejemplo de usos comunes:

| Uso | Descripción |
|-----|-------------|
| **Seguridad** | Escanear commits en busca de credenciales, tokens o claves privadas |
| **Calidad** | Ejecutar linters, formateadores o tests antes de cada commit |
| **Consistencia** | Validar mensajes de commit, formato de código o estructura de archivos |
| **Automatización** | Generar versionado, notificaciones o despliegues automáticos |

---

## ¿Cómo se crea y configura?

### 1. Crear la carpeta y el hook

```bash
mkdir .githooks
nano .githooks/pre-commit
# Escribir el script deseado
chmod +x .githooks/pre-commit
```

### 2. Configurar Git para que use esa carpeta

```bash
git config core.hooksPath .githooks
```

Esto se guarda en la configuración local del repositorio.

### 3. Versionarlo

```bash
git add .githooks/
git commit -m "Add pre-commit hooks"
git push
```

### 4. Para quien clone el repo después

Solo necesita ejecutar:

```bash
git config core.hooksPath .githooks
```

Y los hooks funcionan automáticamente.

---

## ¿Qué hooks existen?

| Hook | Cuándo se ejecuta | Uso típico |
|------|-------------------|------------|
| `pre-commit` | Antes de crear el commit | Escaneo de seguridad, linters, tests |
| `commit-msg` | Antes de guardar el mensaje | Validar formato del mensaje |
| `pre-push` | Antes de enviar a remoto | Tests finales, validaciones pesadas |
| `post-merge` | Después de un merge | Instalar dependencias, migraciones |
| `post-checkout` | Después de cambiar de rama | Recargar configuración |

---

## ¿Qué diferencia hay entre `.git/hooks/` y `.githooks/`?

| Característica | `.git/hooks/` | `.githooks/` |
|----------------|---------------|--------------|
| Se versiona | ❌ No | ✅ Sí |
| Viaja al clonar | ❌ No | ✅ Sí |
| Se configura con | `git init` | `git config core.hooksPath .githooks` |
| Visible en el repo | ❌ No | ✅ Sí |

---

## ¿Se puede evitar que un hook se ejecute?

Sí. Para saltar temporalmente un hook:

```bash
git commit --no-verify
```

> ⚠️ Solo debe usarse en casos justificados. Saltar hooks de seguridad expone el repo a riesgos.

---

## ¿Qué hace específicamente el hook de este repo?

El `pre-commit` en este repositorio **escanea cada archivo staged** antes de permitir el commit. Si detecta patrones sensibles (tokens, claves privadas, archivos de configuración interna), **cancela el commit** y muestra qué archivo y línea activaron la alerta.

---

## ¿Puedo tener múltiples hooks en un mismo evento?

No directamente. Por cada evento solo se ejecuta **un script**. Si necesitas múltiples validaciones, ese script debe invocar cada una internamente o delegar a otros scripts.

---

*Documentado por Boop 🦈 — 2026-08-09*