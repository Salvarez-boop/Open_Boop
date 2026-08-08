# Conexión Boop 🔗 GitHub

> **Fecha:** 2026-08-08
> **Repo:** [Salvarez-boop/Open_Boop](https://github.com/Salvarez-boop/Open_Boop)
> **Autenticación:** SSH (clave ed25519)

---

## Paso a paso: Conectar workspace a GitHub

### 1. Generar par de claves SSH (en el servidor)

```bash
ssh-keygen -t ed25519 -C "sebastian.alvarez.obando@gmail.com" -f ~/.ssh/OpenClaw_GIT
```

Esto crea:
- `~/.ssh/OpenClaw_GIT` → clave privada (no compartir)
- `~/.ssh/OpenClaw_GIT.pub` → clave pública (va a GitHub)

### 2. Copiar la clave pública a GitHub

```bash
cat ~/.ssh/OpenClaw_GIT.pub
```

Ir a **GitHub → Settings → SSH and GPG keys → New SSH Key**, pegar el contenido de `OpenClaw_GIT.pub` y guardar.

### 3. Configurar SSH para GitHub

```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/OpenClaw_GIT
    IdentitiesOnly yes
EOF
```

### 4. Verificar la conexión

```bash
ssh -T git@github.com
```

Respuesta esperada:
```
Hi Salvarez-boop! You've successfully authenticated, but GitHub does not provide shell access.
```

### 5. Crear el repositorio en GitHub

- Ir a https://github.com/new
- Nombre: `Open_Boop`
- Visibilidad: pública (o privada, según prefieras)
- **No** inicializar con README
- Crear repo

### 6. Configurar identidad git en el workspace

```bash
cd ~/.openclaw/workspace
git config user.email "sebastian.alvarez.obando@gmail.com"
git config user.name "Salvarez-boop"
```

### 7. Agregar el remote

```bash
git remote add origin git@github.com:Salvarez-boop/Open_Boop.git
```

### 8. Hacer el commit inicial y pushear

```bash
git add -A
git commit -m "🎉 Initial commit - Boop workspace"
git push -u origin master
```

---

## Comandos útiles para el día a día

| Acción | Comando |
|--------|---------|
| Ver estado | `git status` |
| Ver cambios | `git diff` |
| Agregar todo | `git add -A` |
| Commit | `git commit -m "mensaje"` |
| Subir cambios | `git push` |
| Bajar cambios | `git pull` |

---

## Notas

- La clave SSH se generó sin passphrase para permitir pushes automáticos desde el servidor.
- El workspace es la carpeta `~/.openclaw/workspace` de Boop.
- Cualquier archivo nuevo que se cree en el workspace se puede versionar con `git add` + `git commit` + `git push`.

---

*Documentado por Boop 🦈 — para que Sebastian sepa exactamente cómo quedó todo conectado.*