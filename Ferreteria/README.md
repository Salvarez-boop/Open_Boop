# 🔩 Ferretería El Greengo — Sistema de Gestión

Sistema de **ventas (POS), catálogo, pedidos y control de caja** para Ferretería El Greengo.

**Modo:** Mono-usuario · 100% local · Sin backend · Cero dependencias
**Datos:** almacenados en el navegador (localStorage), exportables a JSON

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| 🛒 **Ventas (POS)** | Grid táctil de productos, búsqueda + escáner de código de barras, carrito con descuento %, historial del día con boleta interna |
| 📦 **Catálogo** | CRUD completo de productos (nombre, código barras, precio, stock, formato), búsqueda, ordenamiento, paginación |
| 📋 **Pedidos** | Armado de pedido del día, impresión, envío por Gmail |
| 💰 **Caja** | Apertura/cierre diario, movimientos (ventas, retiros, gastos, ingresos), saldo en tiempo real, resumen TXT |
| 📒 **Libreta Deuda** | Ventas a crédito por RUT (validación módulo 11), agrupadas por cliente |
| 📋 **Auditoría** | Registro de acciones sensibles con usuario, fecha y detalle |
| 💾 **Datos** | Exportar/importar backup completo (JSON), configuración de correo destino |
| 🔐 **Login** | PIN + roles (admin/cajero), límite de intentos, sesión con expiración (8h) |

---

## 💻 Requisitos

- **Navegador moderno:** Chrome, Edge, Firefox o Safari (actualizado). *No soporta IE11.*
- **Sin internet requerido** — el sistema es 100% offline, cero dependencias externas (usa fuentes del sistema).
- **Cualquier sistema operativo:** Windows, Linux, Mac.

---

## 🚀 Instalación (3 pasos)

1. **Copia** la carpeta `Ferreteria/` a la PC (o pendrive USB).
2. **Abre** el archivo `index.html` con doble clic (se abre en el navegador).
3. **Listo.** En la primera ejecución se crea un usuario admin (define tu PIN de 4-6 dígitos) y se cargan 100 productos de ejemplo.

> También puedes servir la carpeta con cualquier servidor estático (nginx, Apache, `python -m http.server`).

---

## 💾 Backup y Restauración

### Exportar (respaldo)
1. Click en el menú ☰ (arriba izquierda).
2. Ir a **💾 Datos**.
3. Click en **"📤 Exportar Todo (JSON)"** → descarga `Ferreteria_Backup_AAAA-MM-DD.json`.
4. Guarda ese archivo en un lugar seguro (pendrive, nube, otro PC).

### Importar (restaurar)
1. Menú ☰ → **💾 Datos**.
2. En **"Importar datos"**, selecciona el archivo `.json`.
3. Confirma → el sistema reemplaza todos los datos y recarga.

> ⚠️ Importar **reemplaza** todo el catálogo, ventas, caja, usuarios y auditoría actuales.

---

## 📁 Estructura de archivos

```
Ferreteria/
├── index.html          # Interfaz (ventas, catálogo, pedidos, sidebar)
├── css/
│   └── global.css      # Estilos (tema, layout, responsive)
└── script/
    └── app.js          # Lógica completa (datos, UI, login, auditoría)
```

No hay dependencias de terceros. Tipografía: fuentes nativas del sistema (system font stack) — 100% offline.

---

## 🔑 Usuarios y roles

- **admin** — acceso completo: catálogo, exportar/importar, cerrar caja, limpiar historial.
- **cajero** — vender, ver caja y pedidos; **no** puede borrar catálogo ni exportar/importar.

Seguridad: PIN con hash (no almacenado en claro), 3 intentos con bloqueo de 30s, sesión expira a las 8 horas.

---

## 🧾 Datos almacenados

| Clave (localStorage) | Contenido |
|---|---|
| `catalogo_ferreteria` | Productos |
| `ventas_ferreteria` | Historial de ventas |
| `pedidos_ferreteria` | Pedidos |
| `caja_ferreteria` | Estado de caja del día |
| `cierres_ferreteria` | Cierres anteriores |
| `ferreteria_usuarios` | Usuarios (hash de PIN) |
| `ferreteria_sesion` | Sesión activa |
| `ferreteria_audit` | Registro de auditoría (máx. 500) |
| `ferreteria_config` | Configuración (correo destino pedidos) |

---

*Documentación v1 — Ferretería El Greengo*