# Conexión Boop 🔗 GitHub

> **Fecha:** 2026-08-08
> **Repo:** [***/Open_Boop](https://github.com/***/Open_Boop)
> **Autenticación:** SSH

---

## Paso a paso: Conectar workspace a GitHub

### 1. Generar par de claves SSH

```bash
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com" -f ~/.ssh/NOMBRE_CLAVE
```

Esto crea:
- `~/.ssh/NOMBRE_CLAVE` → clave privada (no compartir jamás)
- `~/.ssh/NOMBRE_CLAVE.pub` → clave pública (va a GitHub)

### 2. Copiar la clave pública a GitHub

```bash
cat ~/.ssh/NOMBRE_CLAVE.pub
```

Ir a **GitHub → Settings → SSH and GPG keys → New SSH Key**, pegar el contenido y guardar.

### 3. Configurar SSH para GitHub

```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/NOMBRE_CLAVE
    IdentitiesOnly yes
EOF
```

### 4. Verificar la conexión

```bash
ssh -T git@github.com
```

Respuesta esperada (el usuario variará):
```
Hi TuUsuario! You've successfully authenticated, but GitHub does not provide shell access.
```

### 5. Crear el repositorio en GitHub

- Ir a https://github.com/new
- Elegir nombre y visibilidad del repo
- **No** inicializar con README (para pushear directo)
- Crear repo

### 6. Configurar identidad git

```bash
cd /ruta/de/tu/workspace
git config user.email "tu-email@ejemplo.com"
git config user.name "TuUsuario"
```

### 7. Agregar el remote

```bash
git remote add origin git@github.com:TuUsuario/TuRepo.git
```

### 8. Hacer el commit inicial y pushear

```bash
git add -A
git commit -m "🎉 Initial commit"
git push -u origin main
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

## Notas de seguridad

- La clave SSH se generó sin passphrase para pushes automáticos. En un servidor compartido o con múltiples usuarios, considera agregar passphrase o usar deploy keys con permisos limitados.
- La clave **privada** jamás debe subirse a ningún repositorio.
- Revisa siempre qué vas a commiterar antes de hacer `git add`, especialmente archivos de configuración y credenciales.

---

*Documentado por Boop 🦈*