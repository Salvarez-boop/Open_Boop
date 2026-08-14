# 🦈 Auditoría #1: Código Fuente — Ferretería El Greengo

**Fecha:** 2026-08-14
**Versión auditada:** `41510ac` (commit "🐛 Fix 10 hallazgos de auditoría")
**Archivos:** `index.html` (460l / 24.1KB), `css/global.css` (385l / 27.9KB), `script/app.js` (1086l / 53.1KB)
**Total:** 1931 líneas / ~105KB
**Tipo:** Auditoría de Código Fuente (según guía `Boop-Auditoría.md` §1)

---

## 📊 RESUMEN EJECUTIVO

| Área | Resultado | Notas |
|---|---|---|
| Sintaxis JS | ✅ OK | `node -c` limpio, sin errores |
| XSS / Escape | ✅ Sólido | `esc()` aplicado consistentemente |
| Secrets / Hardcodeo | ⚠️ 1 hallazgo | Mail destino hardcodeado |
| Dead code | ✅ Ninguno real | "sin referencia" = llamados por onclick HTML |
| IDs duplicados HTML | ✅ Ninguno | |
| Dependencias externas | ✅ Vanilla puro | Sin jQuery/React/etc. |
| Índice de salud global | **B+** | Limpio, algunos puntos de mejora |

---

## ✅ ASPECTOS FUERTES

1. **Escapado HTML (XSS) bien aplicado** — 17 usos de `esc()` (`.replace(/&/g,'&amp;')...`) en todos los `innerHTML` que interpolan datos de usuario. No se encontró ningún caso de interpolar variable de usuario sin escapar. **Importante** porque el sistema usa `innerHTML` 20 veces (es la vía principal de render, y está bien blindada).

2. **Sin dependencias externas** — Vanilla JS puro. Solo Google Fonts (Inter). Cumple el requisito de "cero dependencias / offline".

3. **`node -c` sin errores** — Sintaxis válida en los 1086 líneas de JS.

4. **IDs de HTML únicos** — Ningún `id` duplicado (los 110+ IDs del DOM son únicos). Base sólida para `document.getElementById`.

5. **Commits atómicos y descriptivos** — 15 commits, todos con prefijo emoji + descripción clara (🐛 bugfix, 💾 export, 🔐 login, 💳 modal pago, etc.). Excelente higiene de git.

6. **Manejo de errores en importación** — `try/catch` al parsear JSON de import (`importarDatos`), con toast de error si el archivo es inválido.

7. **Validation de inputs** — Tanto en catalog como pedidos usan `trim()`, `parseFloat/parseInt` + validación de rango. 16 usos de parse/trim.

## 🔴 HALLAZGOS

### 🔴 Hallazgo A — Mail destinatario hardcodeado (Severidad: Media)
**Ubicación:** `script/app.js:780`
```js
const ASUNTO_PEDIDO = 'ferreteria.elgreengo@gmail.com'; // TODO: hacer configurable
```
**Problema:** El correo destino del envío de pedidos está fijado en el código. Si cambia el correo real, hay que editar el fuente. Quedó marcado como `// TODO` pero es un secreto de configuración operativa mezclado con el código.
**Recomendación:** Moverlo a una variable de configuración (¿`ferreteria_config` en localStorage con campo editable en sidebar → Datos?). Baja prioridad, pero es el único "secreto" hardcodeado.

### 🟡 Hallazgo B — Duplicación de lógica de filtrado/paginado (Severidad: Baja)
**Ubicación:** `script/app.js` líneas 103, 174, 184, 245, 270
**Problema:** El patrón `filter(...).sort((a,b)=>{let va=...; if(typeof va==='string'){va=va.toLowerCase();...}...})` se repite **4-5 veces** (pedidos, catálogo ×2, ventas ×2). La lógica de sort case-insensitive y de filtro por nombre/formato/código está copiada.
**Recomendación:** Extraer helpers `sortComparer(col, asc)` y `filtrarCatalogo(q, sortCol, sortAsc)`. Reduce duplicación ~40 líneas y centraliza el comportamiento.

### 🟡 Hallazgo C — Funciones demasiado grandes (Severidad: Baja)
**Ubicación:** `cajaRender` (61 líneas), `cajaCerrar` (46), `ventasRenderGrid` (41), `catalogoRender` (40)
**Problema:** Violan el principio de función única + tamaño sugerido (<30 líneas).
**Recomendación:** Refactor, no urgente. `cajaRender` mezcla: actualizar banner, calcular totales, y renderizar movimientos — podrían ser 3 funciones.

### 🟡 Hallazgo D — Variables globales contaminando window (Severidad: Baja)
**Ubicación:** Todo `app.js`
**Problema:** **58+ declaraciones `function`/`const`/`let` a nivel top** — todas globales en `window`. Riesgo de colisión de nombres si se integran librerías, y no usa ES modules.
**Recomendación:** Dado que es un sistema mono-página vanilla, es aceptable. Si se migra a backend/multi-archivo, considerar `type="module"` + encapsulación. No urgente.

### 🟡 Hallazgo E — 1 solo `aria-label` y 0 `title` en acciones destructivas (Severidad: Baja)
**Ubicación:** `index.html` (1 aria-label: el hamburger; 0 title en botones icono ✕✏️)
**Problema:** Accesibilidad básica faltante: botones icono puros (✕ eliminar, ✏️ editar) sin texto accesible ni tooltip.
**Recomendación:** Agregar `aria-label`/`title` a los ~6 botones icono de acción en tablas.

### 🟡 Hallazgo F — Números mágicos repetidos (Severidad: Baja)
**Ubicación:** `2800` (toast), `1300` (shake), `100` (descuento máx), `500` (audit trim), `50` (audit slice)
**Problema:** Constantes mágicas inline, repetidas.
**Recomendación:** Centralizar en constantes nombradas al tope (ej. `TOAST_MS=2800`, `DESCUENTO_MAX=100`, `AUDIT_MAX=500`).

### 🟢 Hallazgo G — 1 solo `!important` en CSS (Severidad: Informativa)
**Ubicación:** `css/global.css` (1 uso)
**Nota:** Es casi limpio — un solo `!important` es aceptable. Buena práctica general.
**Recomendación:** Eliminar el único caso si es triviable (no bloquea).

---

## 📊 MÉTRICAS DEL CÓDIGO

| Métrica | Valor | Evaluación |
|---|---|---|
| Líneas totales | 1931 | Compacto (para 3-capas + POS + Caja + Libreta + Auth) |
| Tamaño total | ~105KB | Excelente para un sistema completo; sin minificar |
| Funciones JS | ~58 | Bien modularizado por dominio (pedidos, catálogo, ventas, caja, login, audit) |
| `innerHTML` | 20 | Todos con `esc()` en datos de usuario ✅ |
| `onclick` inline | 53 | Alto (acopla HTML-JS), pero funcional en SPA vanilla |
| `confirm()` | 8 | Seguridad UX para acciones destructivas ✅ |
| `try/catch` | 1 bloque (import) | Suficiente para casos de parseo externo |
| Comentarios | 46 | Buenos separadores de módulos (`/* ═══ MODULO ═══ */`) |
| Reglas CSS | 255 | Estructurado por módulos con secciones comentadas |
| `@media` | 5 | Responsive básico (sidebar, grids, forms) |
| Dependencias | Solo Google Fonts | Vanilla puro ✅ |
| Dead code real | 0 | Todo función está referenciada (por onclick o por llamada) |
| Buena práctica: IDs únicos | ✅ | Sin duplicados |
| Buena práctica: git | ✅ | Commits atómicos + descriptivos |

---

## 🎯 RECOMENDACIONES PRIORIZADAS

| Prioridad | Acción | Esfuerzo | Impacto |
|---|---|---|---|
| 🔴 P1 | Hacer configurable el mail destino (move a config UI) | 30 min | Cierra el único "secreto" |
| 🟡 P2 | Extraer helpers de filtrado/sort duplicado | 45 min | Elimina ~40 líneas duplicadas |
| 🟡 P3 | Refactor `cajaRender`/`cajaCerrar` en sub-funciones | 30 min | Mejora legibilidad |
| 🟡 P4 | Agregar `aria-label`/`title` a botones icono | 15 min | Accesibilidad |
| 🟡 P5 | Centralizar constantes mágicas | 15 min | Mantenibilidad |
| 🟢 P6 | Encapsular en ES module (solo si hay backend) | — | Para migración multi-archivo |

**Veredicto:** Código **sólido y limpio**. Sin bugs de seguridad críticos (XSS bien blindado), sin dead code, sin dependencias, buena higiene git. Los hallazgos son de **mantenibilidad** (duplicación, tamaño de funciones, configurabilidad) — no de funcionalidad ni seguridad.

---

*Auditoría #1 ejecutada el 2026-08-14 por Boop 🦈 según guía `Boop-Auditoría.md`.*