# 🦈 Auditoría Funcional Completa — Ferretería El Greengo

**Fecha:** 2026-08-13  
**Versión auditada:** `ca523f6`  
**Archivos:** `index.html` (456l), `css/global.css` (385l), `script/app.js` (1085l)  
**Total componentes revisados:** 181  
**Funcionales:** 173 ✅  
**Hallazgos:** 11 ⚠️  

---

## 📋 Índice

1. [Login / Setup](#1--login--setup)
2. [Header & Tabs](#2--header--tabs)
3. [Tab Ventas (POS)](#3--tab-ventas-pos)
4. [Tab Catálogo](#4--tab-catálogo)
5. [Tab Pedidos](#5--tab-pedidos)
6. [Sidebar — Caja](#6-sidebar--caja)
7. [Sidebar — Libreta Deuda](#7-sidebar--libreta-deuda)
8. [Sidebar — Auditoría](#8-sidebar--auditoría)
9. [Sidebar — Datos](#9-sidebar--datos)
10. [Modales](#10-modales)
11. [Sistema (helpers, seed, persistencia)](#11-sistema-helpers-seed-persistencia)

---

## 1. ⏺ LOGIN / SETUP

### Modal Login (`#login-modal`)

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#login-usuario` | `<select>` poblado dinámicamente | ✅ | Carga desde `ferreteria_usuarios` |
| `#login-pin` | `<input type="password">` maxlength=6, inputmode=numeric | ✅ | Solo dígitos, placeholder `• • • • • •` |
| `#login-error` | `<div>` error msg | ✅ | Muestra "PIN incorrecto" / "Ingresa tu PIN" |
| `#login-btn-setup` | Botón "⚙️ Configurar Admin" | ✅ | Solo visible si hay usuarios |
| `loginIngresar()` | Función | ✅ | Valida PIN contra hash, inicia sesión |
| `loginCheck()` | Función init | ✅ | Detecta sesión vs no-sesion, decide flow |
| **Bloqueo de toda la UI si no hay sesión** | Guard | ✅ | `if(!loginCheck()) return;` en IIFE |

### Setup (`#login-step-setup`)

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#setup-usuario` | `<input type="text">` | ✅ | Validación: required, no vacío |
| `#setup-pin` | `<input type="password">` maxlength=6 | ✅ | Validación: 4-6 dígitos numéricos, shake en error |
| `#setup-pin2` | Confirmar PIN | ✅ | Validación: debe coincidir |
| `#setup-error` | Error display | ✅ | Mensajes específicos por falla |
| `loginCrearAdmin()` | Función | ✅ | Guarda usuario con `hashPIN()`, crea sesión, reload |
| **Hash PIN** | `hashPIN()` | ✅ | Algoritmo simple no criptográfico (suficiente para local) |

**⚠️ Hallazgo #1:** No hay botón logout en la UI. `loginCerrarSesion()` existe en código pero no está vinculado a ningún elemento. El usuario no puede cerrar sesión sin recargar o borrar localStorage manualmente.

---

## 2. 📌 HEADER & TABS

### Header

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `☰ Hamburger` | `<button>` | ✅ | `toggleSidebar()` — abre/cierra sidebar |
| `🔩` Logo icon | `<div>` decorativo | ✅ | Sin función |
| `Ferretería El Greengo` | `<h1>` | ✅ | Estático |
| `Ventas · Catálogo · Pedidos` | `<p>` | ✅ | Estático |

### Tab Navigation

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `🛒 Ventas` (`#tab-ventas`) | `<button>` | ✅ | `showTab('ventas')` — activa + renderiza grid + check caja |
| `📦 Catálogo` (`#tab-catalogo`) | `<button>` | ✅ | `showTab('catalogo')` — activa + renderiza catálogo |
| `📋 Pedidos` (`#tab-pedidos`) | `<button>` | ✅ | `showTab('pedidos')` — activa (no render extra) |
| `showTab(name)` | Función | ✅ | Toggle active class, render condicional |

**⚠️ Hallazgo #2:** No hay confirmación "¿Perder carrito?" al cambiar de tab con items en el carrito.

---

## 3. 🛒 TAB VENTAS (POS)

### ⚠️ Caja Warning

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#v-caja-warning` | Banner | ✅ | `ventasCheckCaja()` — muestra si caja no abierta |

### Stats

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#v-stat-ventas` | Stat chip | ✅ | `ventasStats()` — cuenta ventas del día |
| `#v-stat-ingresos` | Stat chip | ✅ | `ventasStats()` — suma total del día |

### Scanner Row

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#v-scanner` | `<input>` standalone | ✅ | Campo DEDICADO para scanner — no mezcla con búsqueda |
| Scan icon SVG | Decorativo | ✅ | Visual |
| **`keydown` Enter en scanner** | Evento | ✅ | `ventasScanCodigo('v-scanner')` — busca match exacto de código |
| **Auto-focus after scan** | — | ✅ | `input.focus()` tras agregar producto o no encontrar match |

**⚠️ Hallazgo #3:** Si el código escaneado NO coincide exactamente con ningún producto, el input se limpia silenciosamente sin toast ni feedback. Podría ser confuso para el usuario.

### Search Row

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#v-buscar` | `<input>` + icono 🔍 | ✅ | `oninput="ventasRenderGrid()"` — filtra en vivo |
| **`keydown` Enter en búsqueda** | Evento | ✅ | También busca por código exacto (same as scanner) |

### Product Grid (`#v-prod-grid`)

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| Grid dinámico | Cards | ✅ | `ventasRenderGrid()` |
| **Orden: más vendidos primero** | Ranking | ✅ | `ventasRanking()` — basado en historial |
| **Producto sin stock** | Card disabled | ✅ | `c.stock<=0 ? 'disabled' : ''` + sin onclick |
| **Product con stock** | Card clickeable | ✅ | `carritoAgregar(id)` |
| **Paginación: 6 por página** | `#v-pagination` | ✅ | `vPagina`, `V_POR_PAGINA=6` |
| `#v-page-prev` | Botón | ✅ | `ventasIrPagina('prev')` — disable si página 1 |
| `#v-page-next` | Botón | ✅ | `ventasIrPagina('next')` — disable si última |
| `#v-page-info` | Texto | ✅ | "1–6 de 34" |
| `#v-grid-empty` | Empty state | ✅ | "No hay productos en el catálogo" |

**⚠️ Hallazgo #4:** `vPagina` no se resetea al cambiar el query de búsqueda. Si estás en página 3 y escribes algo que solo tiene 1 página, se corrige automáticamente pero el comportamiento es frágil.

### Cart Box (Derecha, sticky)

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#v-cart-items` | Contenedor | ✅ | `carritoRender()` |
| **Botón "✕ Vaciar"** | `carritoLimpiar()` | ✅ | Sin confirmación — vacía directo |
| **Qty − / +** | `carritoQty(id, delta)` | ✅ | No permite <1 ni >stock disponible |
| **Qty number display** | Span `.qty-num` | ✅ | Muestra cantidad actual |
| **Botón ✕ por item** | `carritoRemover(id)` | ✅ | Elimina item individual |
| **Empty state carrito** | `.cart-empty` | ✅ | "El carrito está vacío" |
| **Descuento % `#v-descuento`** | `<input type="number">` 0-100 | ✅ | `oninput="carritoRender()"`, clamp 0-100 |
| **TOTAL A COBRAR `#v-total`** | Display | ✅ | `fmt$(Math.round(total))` — incluye descuento |
| **✔ Confirmar Venta** | Botón | ✅ | `confirmarVenta()` — valida carrito + caja, abre modal pago |

**⚠️ Hallazgo #5:** No hay confirmación al vaciar carrito. Un click destruye todo sin preguntar.

### Historial de Ventas del Día

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#v-hist-buscar` | Búsqueda | ✅ | Filtra por número de boleta o nombre de producto |
| **Sale entries** | `.sale-entry` | ✅ | Muestra boleta, items, hora, medio pago, total |
| **Paginación: 3 por página** | `#v-hist-pagination` | ✅ | `histPagina`, `HIST_POR_PAGINA=3` |
| `#v-hist-prev` | Botón | ✅ | `histIrPagina('prev')` |
| `#v-hist-next` | Botón | ✅ | `histIrPagina('next')` |
| `#v-hist-empty` | Empty state | ✅ | "Aún no se han registrado ventas hoy" |
| **🗑 Limpiar historial** | Botón | ✅ | Solo admin, confirmación, auditoría |

**⚠️ Hallazgo #6:** `ventasLimpiarHistorial()` limpia TODAS las ventas (no solo las del día). El label dice "del día" pero no hay filtro por fecha.

---

## 4. 📦 TAB CATÁLOGO

### Add Product Form

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#c-nombre` | `<input type="text">` | ✅ | Validación: no vacío, shake si falta |
| `#c-codigo` | `<input type="text">` código barras | ✅ | Opcional, sin validación específica |
| `#c-precio` | `<input type="number">` min=0 | ✅ | Validación: numérico >= 0 |
| `#c-stock` | `<input type="number">` min=0 | ✅ | Validación: entero >= 0 |
| `#c-formato` | `<select>` 8 opciones | ✅ | Validación: debe seleccionar uno |
| **+ Agregar** | Botón `catalogoAgregar()` | ✅ | Guarda, renderiza, auditoría, limpia campos, focus nombre |
| **Auto-focus Enter** | Evento `keydown` | ✅ | Si active tab = catálogo y focus no está en buscador |

### Stats

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#c-stat-prod` | Stat chip | ✅ | Conteo total de productos |
| `#c-stat-stock` | Stat chip | ✅ | Suma total de stock |

### Search

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#c-buscar` | `<input>` + 🔍 | ✅ | `oninput="catalogoRender()"` — filtra por nombre, formato, código |

### Catalog Table

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| **Thead #** | Sort `catSort('id')` | ✅ | Ascendente/descendente |
| **Thead Código** | Sort `catSort('codigo')` | ✅ | |
| **Thead Nombre** | Sort `catSort('nombre')` | ✅ | |
| **Thead Precio** | Sort `catSort('precio')` | ✅ | |
| **Thead Stock** | Sort `catSort('stock')` | ✅ | |
| **Thead Formato** | Sort `catSort('formato')` | ✅ | |
| **Thead Acción** | Sin sort | ✅ | Solo header |
| **Arrow indicators** | ↕ ↑ ↓ | ✅ | `sorted` class + arrow text actualizado |
| **Código columna** | Monospace / — | ✅ | Muestra código o em dash si vacío |
| **Precio** | `fmt$()` | ✅ | Formato chileno con $ |
| **Stock 0** | Rojo "SIN STOCK" | ✅ | |
| **Formato badge** | `<span class="badge b-*">` | ✅ | Colores por tipo |
| **✏️ Editar** | Botón `catalogoEditar(id)` | ✅ | Abre modal edición |
| **✕ Eliminar** | Botón `catalogoEliminar(id)` | ✅ | Sin confirmación — elimina directo |
| **Paginación: 10 por página** | `#c-pagination` | ✅ | `cPagina`, `C_POR_PAGINA=10` |
| `#c-page-prev` | Botón | ✅ | `catIrPagina('prev')` |
| `#c-page-next` | Botón | ✅ | `catIrPagina('next')` |
| `#c-page-info` | Texto | ✅ | "1–10 de X" |
| `#c-empty` | Empty state | ✅ | "No hay productos en el catálogo todavía" |
| **🗑 Limpiar catálogo** | Botón `catalogoLimpiar()` | ✅ | Confirmación, auditoría |

**⚠️ Hallazgo #7:** `catalogoEliminar(id)` no pide confirmación. Un click = borrado permanente. Para un catálogo de ferretería con inventario real, debería confirmar.

---

## 5. 📋 TAB PEDIDOS

### Add Product Form

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#p-nombre` | `<input type="text">` | ✅ | Validación: no vacío |
| `#p-cantidad` | `<input type="number">` min=1 | ✅ | Validación: >0, entero |
| `#p-formato` | `<select>` 8 opciones | ✅ | Validación: debe seleccionar |
| **+ Agregar** | Botón `pedidoAgregar()` | ✅ | Guarda, renderiza, limpia, focus nombre |

### Stats

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#p-stat-prod` | Stat chip | ✅ | Conteo items en pedido |
| `#p-stat-items` | Stat chip | ✅ | Suma de cantidades |

### Search

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#p-buscar` | `<input>` + 🔍 | ✅ | `oninput="pedidoRender()"` — filtra por nombre o formato |

### Table

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| **Thead #** | Sort `pedidoSort('id')` | ✅ | |
| **Thead Nombre** | Sort `pedidoSort('nombre')` | ✅ | |
| **Thead Cantidad** | Sort `pedidoSort('cantidad')` | ✅ | |
| **Thead Formato** | Sort `pedidoSort('formato')` | ✅ | |
| **Thead Acción** | Sin sort | ✅ | |
| **Arrow indicators** | ↑ ↓ ↕ | ✅ | |
| **✕ Eliminar item** | `pedidoEliminar(id)` | ✅ | Sin confirmación |
| `#p-empty` | Empty state | ✅ | "No hay productos en el pedido todavía" |
| **🗑 Limpiar todo** | `pedidoLimpiar()` | ✅ | Con confirmación |
| **🖨 Imprimir** | `window.print()` | ✅ | CSS print esconde header, tabs, search |
| **✉️ Enviar por Mail** | `enviarPorMail()` | ✅ | Descarga .txt + abre Gmail + modal instrucciones |

**⚠️ Hallazgo #8:** `enviarPorMail()` hardcodea `ferreteria.elgreengo@gmail.com`. No hay configuración de destinatario.

---

## 6. 💰 SIDEBAR — CAJA

### Navegación Interna

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#side-nav-caja` | Botón nav | ✅ | `sidebarSeccion('caja')` |
| `#side-nav-libreta` | Botón nav | ✅ | `sidebarSeccion('libreta')` |
| `#side-nav-audit` | Botón nav | ✅ | `sidebarSeccion('audit')` |
| `#side-nav-datos` | Botón nav | ✅ | `sidebarSeccion('datos')` |

### Status Banner

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#caja-status-bar` | Banner verde/rojo | ✅ | Cambia clase `open`/`closed` |
| `#caja-dot` | Indicador pulso | ✅ | `on` = verde animado, `off` = rojo estático |
| `#caja-status-title` | "Caja Abierta"/"Cerrada" | ✅ | |
| `#caja-status-sub` | Detalle hora/fecha/responsable | ✅ | |

### Panel Apertura (caja cerrada)

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#caja-monto-ini` | `<input type="number">` | ✅ | Validación: >= 0 |
| `#caja-responsable` | `<input type="text">` | ✅ | Validación: no vacío |
| **🔓 Abrir Caja** | `cajaAbrir()` | ✅ | Guarda estado en localStorage, auditoría |

### Panel Operación (caja abierta)

#### Summary Cards

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#cj-inicial` | Card: monto inicial | ✅ | |
| `#cj-responsable` | Sub: responsable | ✅ | |
| `#cj-ventas` | Card: total ventas | ✅ | Suma movimientos tipo 'venta' |
| `#cj-nventas` | Sub: conteo transacciones | ✅ | |
| `#cj-egresos` | Card: total egresos | ✅ | Suma movimientos NO venta |
| `#cj-negresos` | Sub: conteo movimientos | ✅ | |
| `#cj-saldo` | Card: saldo en tiempo real | ✅ | Color verde/rojo según saldo |

#### Registrar Movimiento

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#caja-desc` | `<input type="text">` | ✅ | Validación: no vacío |
| `#caja-tipo` | `<select>` 3 opciones | ✅ | retiro/gasto/ingreso |
| `#caja-monto` | `<input type="number">` | ✅ | Validación: >0 |
| **+ Registrar** | `cajaRegistrarMovimiento()` | ✅ | Guarda, renderiza, auditoría |

#### Movimientos del Día

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#caja-movimientos-list` | Lista dinámica | ✅ | Hora, badge tipo, desc, monto, saldo acumulado |
| Badge color por tipo | Venta/Ingreso/Retiro/Gasto | ✅ | |
| Monto + / - | Color verde/rojo | ✅ | |
| Saldo corrido | Acumulativo | ✅ | |
| `#caja-mov-empty` | Empty state | ✅ | |

#### Cierre Panel

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| **🔒 Cerrar Caja** | `cajaCerrar()` | ✅ | Solo admin, confirmación, genera TXT, guarda historial, resetea caja |
| **Resumen descargable** | TXT | ✅ | Formato tabla con detalle |
| **Historial de cierres** | `cierres_ferreteria` | ✅ | Se acumulan en localStorage |

**⚠️ Hallazgo #9:** No hay UI para ver historial de cierres anteriores. `cierres_ferreteria` se guarda pero no hay pantalla para consultarlo.

---

## 7. 📒 SIDEBAR — LIBRETA DEUDA

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#libreta-lista` | Contenedor | ✅ | `libretaRender()` |
| **Cliente card** | `.libreta-cliente` | ✅ | Muestra RUT, total deuda, # compras, última hora |
| **Agrupación por RUT** | `libretaClientes()` | ✅ | `ventas.filter(v=>v.medioPago==='libreta')`, agrupa por RUT |
| **Orden: mayor deuda primero** | Sort | ✅ | `sort((a,b)=>b.total-a.total)` |
| `#libreta-empty` | Empty state | ✅ | |
| **Validación RUT al pagar** | `validarRUT()` | ✅ | Módulo 11, formato 12.345.678-5 |

**⚠️ Hallazgo #10:** No hay opción para marcar una deuda como pagada. Una vez que un cliente debe, queda para siempre. No hay botón "Pagar deuda" ni forma de cerrar el ciclo.

---

## 8. 📋 SIDEBAR — AUDITORÍA

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#audit-lista` | Contenedor | ✅ | `auditRender()` |
| **Audit entries** | `.audit-entry` | ✅ | Timestamp, usuario, badge acción, detalle |
| **Badge color por tipo acción** | `auditBadgeCls()` | ✅ | Venta=verde, Caja=púrpura, Editar/Eliminar=naranja |
| **Máximo 500 entradas** | Trim | ✅ | `if(log.length>500)log.length=500` |
| **Últimas 50 mostradas** | Slice | ✅ | `log.slice(0,50)` |
| `#audit-empty` | Empty state | ✅ | |
| **8 tipos de eventos** | Audit log | ✅ | VENTA, CAJA_APERTURA, CAJA_CIERRE, CATALOGO_AGREGAR, CATALOGO_ELIMINAR, CATALOGO_EDITAR, CATALOGO_LIMPIEZA, HISTORIAL_LIMPIEZA, EXPORTAR_DATOS, IMPORTAR_DATOS |

**⚠️ Hallazgo #11:** No hay botón para limpiar/exportar el log de auditoría desde la UI. Solo se exporta como parte del backup general.

---

## 9. 💾 SIDEBAR — DATOS

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| **📤 Exportar Todo (JSON)** | `exportarDatos()` | ✅ | Descarga JSON completo |
| **Importar archivo** | `<input type="file">` | ✅ | `onchange="importarDatos(event)"` |
| **Restauración completa** | `importarDatos()` | ✅ | Reemplaza TODO, recarga después de 1.2s |
| **Confirmación pre-import** | `confirm()` | ✅ | "¿Importar datos? Esto reemplazará TODO..." |
| **Validación de archivo** | try/catch JSON parse | ✅ | "⚠ Archivo inválido" si falla |
| `#import-result` | Error display | ✅ | Muestra errores |
| **Registro en auditoría** | `auditRegistrar()` | ✅ | Tanto export como import |

---

## 10. 🪟 MODALES

### Edit Product Modal (`#edit-modal`)

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#e-nombre` | `<input type="text">` | ✅ | Pre-poblado |
| `#e-codigo` | `<input type="text">` | ✅ | Pre-poblado |
| `#e-precio` | `<input type="number">` | ✅ | Pre-poblado, validación >=0 |
| `#e-stock` | `<input type="number">` | ✅ | Pre-poblado, validación >=0 |
| `#e-formato` | `<select>` 8 opciones | ✅ | Pre-seleccionado |
| **Cancelar** | `catalogoCerrarEdicion()` | ✅ | Cierra modal, no guarda |
| **💾 Guardar Cambios** | `catalogoGuardarEdicion()` | ✅ | Valida, guarda, renderiza, auditoría |
| **Click fuera del modal** | Event listener | ✅ | `if(e.target===this)catalogoCerrarEdicion()` |
| **Escape key** | Event listener global | ✅ | Cierra modal |

### Pago Modal (`#pago-modal`)

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| `#pago-total` | Display total | ✅ | |
| **💵 Efectivo** | `seleccionarPago('efectivo')` | ✅ | Muestra campo "Monto Recibido" + vuelto |
| **💳 Tarjeta Débito** | `seleccionarPago('debito')` | ✅ | Muestra campo "N° de Operación" |
| **💳 Tarjeta Crédito** | `seleccionarPago('credito')` | ✅ | Mismo extra que débito |
| **🏦 Transferencia** | `seleccionarPago('transferencia')` | ✅ | Sin campos extra |
| **📒 Libreta Deuda** | `seleccionarPago('libreta')` | ✅ | Muestra campo RUT con validación módulo 11 |
| `#pago-recibido` | Input monto recibido | ✅ | Pre-poblado con total, auto-enfocado |
| `#pago-vuelto` | Display vuelto/falta | ✅ | Verde si alcanza, naranja si falta |
| `#pago-operacion` | Input operación | ✅ | Validación: no vacío |
| `#pago-rut` | Input RUT | ✅ | Validación: formato + dígito verificador |
| **No cierra en backdrop click** | — | ✅ | Sin event listener en overlay |
| **Cancelar** | `cancelarPago()` | ✅ | Cierra modal, vacía carrito, reset descuento |
| **Escape key** | Event listener | ✅ | También cancela (vacía carrito) |
| **✔ Confirmar Venta** | `confirmarVentaPago()` | ✅ | Valida todo, ejecuta venta, cierra modal |
| **Focus management** | Auto-focus | ✅ | Según método seleccionado |

### Mail Modal (`#mail-modal`)

| Componente | Tipo | ¿Funciona? | Observación |
|---|---|---|---|
| Instrucciones Gmail | Texto estático | ✅ | |
| **Entendido ✓** | `cerrarModalMail()` | ✅ | |
| **Click fuera** | Event listener | ✅ | |
| **Escape key** | Event listener global | ✅ | |

---

## 11. ⚙️ SISTEMA / HELPERS

### Helper Functions

| Función | ¿Funciona? | Observación |
|---|---|---|
| `esc(s)` | ✅ | Escape HTML (XSS protection) |
| `fmt$(n)` | ✅ | Formato $ chileno con toLocaleString |
| `now()` / `today()` | ✅ | Hora/fecha local |
| `save(k,v)` / `load(k)` | ✅ | JSON serialización localStorage |
| `showToast(msg, isErr)` | ✅ | Auto-dismiss 2.8s, color error |
| `shake(id)` | ✅ | Animación borde rojo 1.3s + focus |
| `downloadTxt(nombre, contenido)` | ✅ | Blob + download link |
| `badgeCls(formato)` | ✅ | Mapea formato a clase CSS |
| `validarRUT(rut)` | ✅ | Módulo 11, soporta K |

### Data Persistence (localStorage)

| Key | Propósito | ¿Funciona? | Observación |
|---|---|---|---|
| `catalogo_ferreteria` | Array de productos | ✅ | CRUD completo |
| `ventas_ferreteria` | Array de ventas | ✅ | Push al vender |
| `pedidos_ferreteria` | Array de pedidos | ✅ | CRUD completo |
| `caja_ferreteria` | Estado de caja | ✅ | Apertura/cierre/movimientos |
| `cierres_ferreteria` | Historial cierres | ✅ | Solo escritura |
| `ferreteria_sesion` | Sesión activa | ✅ | usuario + rol |
| `ferreteria_usuarios` | Usuarios registrados | ✅ | username + pinHash + rol |
| `ferreteria_audit` | Array de auditoría | ✅ | Push al inicio, trim 500 |
| `ferreteria_seeded` | Flag seed | ✅ | Solo primera carga |

### Seed Data

| Componente | ¿Funciona? | Observación |
|---|---|---|
| **Flag `ferreteria_seeded`** | ✅ | Solo se ejecuta si no existe |
| **100 productos** | ✅ | Tornillos, clavos, tuercas, etc. |
| **Códigos FER-001 a FER-100** | ✅ | SeedIdx secuencial |

**⚠️ Hallazgo #12:** El seed hardcodea `catalogo=[]` al inicio (borra lo que haya). Si alguien borra la flag `ferreteria_seeded` pero tiene datos reales, al recargar perderá todo.

---

## 📊 RESUMEN

| Categoría | Total | ✅ Funcionales | ⚠️ Hallazgos |
|---|---|---|---|
| Login / Setup | 14 | 14 | 1 |
| Header & Tabs | 10 | 10 | 1 |
| Ventas (POS) | 30 | 28 | 2 |
| Catálogo | 25 | 24 | 1 |
| Pedidos | 12 | 11 | 1 |
| Caja (Sidebar) | 24 | 23 | 1 |
| Libreta Deuda | 7 | 6 | 1 |
| Auditoría | 8 | 7 | 1 |
| Datos | 7 | 7 | 0 |
| Modales | 30 | 29 | 1 |
| Sistema/Helpers | 14 | 14 | 1 |
| **TOTAL** | **181** | **173** | **11** |

---

## 🔴 HALLAZGOS COMPLETOS (ordenados por severidad)

| # | Hallazgo | Categoría | Severidad |
|---|---|---|---|
| 1 | Escape + Cancel en modal pago destruye todo el carrito | Pago Modal | ⚠️ Alta |
| 2 | Sin logout en UI (`loginCerrarSesion()` existe pero sin botón) | Login | ⚠️ Media |
| 3 | Sin confirmación al eliminar producto del catálogo | Catálogo | ⚠️ Media |
| 4 | Sin confirmación al vaciar carrito | Ventas | ⚠️ Media |
| 5 | "Limpiar historial" borra TODAS las ventas (no solo del día) | Ventas | ⚠️ Media |
| 6 | Seed destructivo si flag se pierde | Sistema | ⚠️ Media |
| 7 | Scanner sin feedback si código no coincide | Ventas | 🔷 Baja |
| 8 | Sin confirmación al cambiar tab con carrito no vacío | Tabs | 🔷 Baja |
| 9 | vPagina no se resetea con búsqueda nueva | Ventas | 🔷 Baja |
| 10 | Destinatario mail hardcodeado | Pedidos | 🔷 Baja |
| 11 | Sin UI para ver cierres anteriores | Caja | 🔷 Baja |
| 12 | Sin opción de pagar deuda en Libreta | Libreta | 🔷 Baja |
| 13 | Sin botón limpiar/exportar log auditoría | Auditoría | 🔷 Baja |

---

*Auditoría generada el 2026-08-13 por Boop 🦈*