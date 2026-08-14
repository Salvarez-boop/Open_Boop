# 🦈 Auditoría #2: Seguridad — Ferretería El Greengo

**Fecha:** 2026-08-14
**Versión auditada:** `6bffb8a` (commit "🔧 Fix A + B de Auditoría #1: código fuente")
**Archivos:** `index.html`, `script/app.js`
**Tipo:** Auditoría de Seguridad (según guía `Boop-Auditoría.md` §2)

---

## 📊 RESUMEN EJECUTIVO

| Área | Resultado | Notas |
|---|---|---|
| Autenticación (PIN) | ⚠️ Aceptable | Hash simple no criptográfico, suficiente para mono-usuario local |
| Autorización (roles) | ⚠️ Parcial | 2 acciones admin protegidas, 4 acciones destructivas sin check |
| XSS (Cross-Site Scripting) | ✅ Sólido | No hay `eval()`, todos los datos de usuario escapan con `esc()` |
| Funciones peligrosas | ✅ 0 | Sin `eval()`, `document.write()`, `Function()` |
| Funciones peligrosas | ✅ 0 | Sin `eval()`, `document.write()`, `Function()` |
| Secretos hardcodeados | ✅ 0 | El mail ahora es configurable (Fix A) |
| Sanitización de inputs | ✅ Media | RUT validado, email validado, inputs con trim/parse |
| Brute force | ❌ Sin protección | PIN sin límite de intentos ni lockout |
| Sesión expira | ❌ No expira | Sesión permanente hasta cerrar sesión o borrar localStorage |
| Auditoría | ✅ 11 eventos | Trazabilidad de acciones sensibles completa |
| localStorage expuesto | ⚠️ Riesgo inherente | Cualquiera con acceso a DevTools lee/edita datos |
| Índice de salud global | **B** | Seguro para mono-usuario local; insuficiente para multi-usuario multi-PC |

---

## ✅ ASPECTOS FUERTES

1. **Zero `eval()` / `document.write()` / `Function()`** — No hay funciones de ejecución dinámica de código. Riesgo de inyección remoto inexistente.

2. **XSS bien blindado** — Los 19 `innerHTML` usan `esc()` para los datos que vienen del usuario (nombre de producto, RUT, descripción de movimiento, etc.). Datos numéricos (`precio`, `stock`, `cantidad`, `id`) se interpolan directamente porque son números seguros (no pueden contener HTML).

3. **Auditoría completa** — 11 tipos de eventos registrados: `VENTA`, `CAJA_APERTURA`, `CAJA_CIERRE`, `CATALOGO_AGREGAR`, `CATALOGO_EDITAR`, `CATALOGO_ELIMINAR`, `CATALOGO_LIMPIEZA`, `HISTORIAL_LIMPIEZA`, `EXPORTAR_DATOS`, `IMPORTAR_DATOS`, `CONFIG_MAIL`. Cada evento guarda timestamp, usuario y detalle.

4. **Validación de RUT (módulo 11)** — `validarRUT()` implementa correctamente el algoritmo chileno, soporta dígito verificador K.

5. **Validación de email** — `configGuardarMail()` con regex `^[^@\s]+@[^@\s]+\.[^@\s]+$`.

6. **Confirmación en acciones destructivas** — 8 `confirm()` antes de operaciones que eliminan datos (limpiar catálogo, eliminar producto, limpiar historial, cerrar caja, importar datos, vaciar carrito, etc.).

---

## 🔴 HALLAZGOS

### 🔴 Hallazgo S1 — Sin límite de intentos de PIN (Severidad: Alta)
**Ubicación:** `script/app.js` función `loginIngresar()`
**Problema:** No hay contador de intentos fallidos, ni lockout temporal, ni retardo. Un atacante con acceso a la PC puede probar todos los PINs de 4-6 dígitos (10,000 a 1,000,000 combinaciones) en minutos.
**Riesgo:** Alto en contexto multi-usuario. Bajo en mono-usuario (el atacante ya tiene acceso físico a la PC).
**Recomendación:** Agregar contador de intentos en localStorage + lockout de 30s tras 3 fallos. Para la versión actual mono-usuario, prioridad media.

### 🔴 Hallazgo S2 — Sesión sin expiración (Severidad: Alta)
**Ubicación:** `script/app.js` función `loginSaveSession()`
**Problema:** La sesión (`ferreteria_sesion`) nunca expira. Si un usuario cierra el navegador sin cerrar sesión, cualquiera que abra la página queda automáticamente autenticado.
**Riesgo:** Alto en PC compartida. Bajo en PC personal.
**Recomendación:** Almacenar timestamp de inicio de sesión y verificar expiración (ej: 8h) en `loginCheck()`. O usar `sessionStorage` en vez de `localStorage` (la sesión se borra al cerrar el navegador).

### 🟡 Hallazgo S3 — Acciones destructivas sin protección de rol (Severidad: Media)
**Ubicación:** `script/app.js`
**Problema:** 4 acciones destructivas/clave no verifican rol de admin:
| Función | ¿Check admin? | Riesgo |
|---|---|---|
| `catalogoLimpiar()` | ❌ No | Un cajero puede borrar TODO el catálogo |
| `catalogoEliminar()` | ❌ No | Un cajero puede eliminar productos individuales |
| `exportarDatos()` | ❌ No | Un cajero descarga todos los datos del sistema |
| `importarDatos()` | ❌ No | Un cajero puede reemplazar TODO el sistema con un archivo |
Solo `cajaCerrar()` y `ventasLimpiarHistorial()` tienen `loginEsAdmin()`.
**Recomendación:** Agregar `if(!loginEsAdmin()){showToast('⚠ Solo admin',true);return;}` en las 4 funciones.

### 🟡 Hallazgo S4 — Hash de PIN no criptográfico (Severidad: Media)
**Ubicación:** `script/app.js:927`
```js
function hashPIN(pin){ let h=0; for(let i=0;i<pin.length;i++){h=((h<<5)-h)+pin.charCodeAt(i);h|=0;} return 'h'+Math.abs(h).toString(36); }
```
**Problema:** Es un hash artesanal (variante del algoritmo DJB2), no un hash criptográfico (bcrypt/scrypt/PBKDF2). Es susceptible a colisiones y pre-image attacks.
**Contexto:** Para un sistema mono-usuario local donde el PIN es de 4-6 dígitos, es suficiente para evitar ojeadas casuales. No es seguro para un sistema multi-usuario con backend.
**Recomendación:** Si se migra a backend, reemplazar por bcrypt o al menos PBKDF2. Para la versión actual, es aceptable.

### 🟡 Hallazgo S5 — localStorage no cifrado (Severidad: Informativa)
**Ubicación:** Todas las `save()`/`load()` en `app.js`
**Problema:** Todos los datos (catálogo, ventas, usuarios con hash, sesión) están en texto plano en localStorage. Accesible vía DevTools → Application → Local Storage.
**Contexto:** Es inherente a la arquitectura "sin backend, cero dependencias". Cualquier app con localStorage tiene esta limitación.
**Recomendación:** Si se requiere privacidad de datos, migrar a backend con SQLite cifrada. Para mono-usuario local, es aceptable documentarlo como limitación conocida.

### 🟢 Hallazgo S6 — CSRF (Severidad: Informativa)
**Problema:** No hay tokens CSRF porque no hay formularios que envíen datos a un servidor. Todo es localStorage + JS.
**Riesgo:** Inexistente en arquitectura actual. Si se migra a backend, hay que implementar CSRF tokens.
**Recomendación:** Monitorear cuando se implemente el backend.

---

## 🎯 RECOMENDACIONES PRIORIZADAS

| Prioridad | Acción | Esfuerzo | Impacto | Para qué |
|---|---|---|---|---|
| 🔴 P1 | **Límite de intentos de PIN** + lockout 30s tras 3 fallos | 30 min | Seguridad básica de login | Anti brute force |
| 🔴 P2 | **Expiración de sesión** (8h o sessionStorage) | 15 min | Evita sesión persistente indefinida | PC compartida |
| 🟡 P3 | **Check admin en catalogoLimpiar, catalogoEliminar, exportar, importar** | 15 min | Cajero no puede destruir datos | Roles |
| 🟡 P4 | **Considerar bcrypt si hay backend** | — | Hash PIN criptográfico | Migración backend |
| 🟢 P5 | **Documentar limitación de localStorage** | 5 min | Transparencia con el usuario | Documentación |

---

## 📊 MATRIZ DE SEGURIDAD

| Aspecto OWASP | Estado | Notas |
|---|---|---|
| A1: Broken Access Control | ⚠️ Parcial | 4 acciones sin check de rol |
| A2: Cryptographic Failures | ⚠️ Parcial | Hash artesanal (no criptográfico), localStorage plano |
| A3: Injection | ✅ Seguro | Sin eval(), sin SQL, sin comandos shell |
| A4: Insecure Design | ⚠️ Parcial | Sesión sin expiración, sin límite de intentos |
| A5: Security Misconfiguration | ✅ Aceptable | Mono-usuario; 0 puertos, 0 servicios |
| A6: Vulnerable Components | ✅ Seguro | 0 dependencias externas (vanilla puro) |
| A7: Auth Failure | ⚠️ Parcial | PIN sin brute force protection |
| A8: Data Integrity Failures | ⚠️ Parcial | localStorage editable desde DevTools |
| A9: Logging Failures | ✅ Bueno | 11 eventos de auditoría |
| A10: SSRF | ✅ N/A | Sin llamadas a servidores |

---

**Veredicto: B** — Seguro para el escenario actual (mono-usuario, local, PC personal). No apto para multi-usuario sin backend.

**Lo que salva al sistema:** 0 dependencias externas, 0 eval(), XSS blindado, auditoría completa, confirmaciones en acciones destructivas.

**Lo que hay que fixear antes de multi-usuario:** S1 (límite de intentos), S2 (expiración de sesión), S3 (checks de admin faltantes).

---

*Auditoría #2 ejecutada el 2026-08-14 por Boop 🦈 según guía `Boop-Auditoría.md` §2.*