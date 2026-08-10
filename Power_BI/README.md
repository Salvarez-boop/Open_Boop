# Power_BI — Dashboard Financiero Empresarial

Sistema de registro y visualización de **Ingresos y Gastos** para las 9 empresas de Sebastian Alvarez.

## 📁 Estructura

```
Power_BI/
├── Excel/
│   └── Registro_Ingresos_Gastos.xlsx    ← Libro principal editable
├── Power_BI_Model/
│   └── Modelo_Ingresos_Gastos.dax       ← Modelo DAX completo
├── Dashboard_Web/
│   └── index.html                       ← Dashboard web interactivo
├── Scripts/
│   ├── importar_movimientos.py          ← Importador CSV/JSON
│   └── mover.ps1                        ← Script Power Query (M)
└── README.md                            ← Este archivo
```

## 🏢 Empresas

| # | Nombre | RUT | Tipo |
|---|--------|-----|------|
| 1 | RenoxPell SpA (YoSorteo.cl) | 76.837.558-5 | Plataforma de sorteos |
| 2 | TransTicket SpA (TransTicket.cl) | 76.837.566-6 | Plataforma de sorteos |
| 3 | Transportes Álvarez SpA | 78.271.764-2 | Transporte / logística |
| 4 | Servicios PubliTruck SpA | 78.271.876-2 | Publicidad móvil |
| 5 | Greengo Austral SpA | 78.321.137-8 | Ferretería |
| 6 | Inversiones Ibiza SpA | 78.325.207-4 | Real estate / inversiones |
| 7 | Gastos Personales | 15.884.605-5 | Personal |
| 8 | Propiedades Salvarez | 15.884.605-5 | Propiedades con arriendo |
| 9 | Best Free Wifi Chile SpA | 76.718.863-3 | Enlaces & CCTV |

## 📊 Cómo usar

### Opción 1: Excel (recomendado para empezar)
1. Abrir `Excel/Registro_Ingresos_Gastos.xlsx`
2. Ir a hoja **Movimientos** y empezar a registrar filas
3. Los dropdowns te guían (empresa, tipo, categoría, moneda, pagado)
4. Los KPIs y tabla dinámica se actualizan solos en **Dashboard**
5. Usar hoja **Filtro Empresa** para ver movimientos de una sola empresa

### Opción 2: Dashboard Web (sin Excel)
1. Abrir `Dashboard_Web/index.html` en cualquier navegador
2. Los datos se guardan automáticamente en tu navegador (localStorage)
3. Usar botón **Cargar datos de ejemplo** para probar
4. Exportar/Importar JSON para respaldo

### Opción 3: Power BI
1. Abrir Power BI Desktop
2. Crear nuevo modelo o copiar medidas DAX desde `Power_BI_Model/Modelo_Ingresos_Gastos.dax`
3. Conectar a los datos:
   - Desde el Excel (`Excel/Registro_Ingresos_Gastos.xlsx`)
   - Desde CSV (generado con los scripts)
   - O desde DATATABLE (inline en DAX)
4. Las medidas están listas: Total Ingresos, Total Gastos, Saldo Neto, etc.

## 🛠️ Scripts

### Importar movimientos desde CSV/JSON
```bash
python3 Scripts/importar_movimientos.py datos.csv
python3 Scripts/importar_movimientos.py datos.json
python3 Scripts/importar_movimientos.py datos.csv --formato powerbi
```

### Power Query (M)
El archivo `mover.ps1` contiene el script M para cargar datos desde el Excel directamente en Power BI.

## 📋 Categorías

**Ingresos:** Ventas / Servicios, Publicidad / Sponsors, Arriendos, Inversiones / Rentas, Otros Ingresos

**Gastos:** Hosting & Dominios, Servicios Cloud / APIs, Sueldos / Honorarios, Marketing & Publicidad, Transporte & Logística, Insumos Ferretería, Mantenimiento Equipos, Servicios Básicos, Arriendos (gasto), Seguros, Impuestos / Contribuciones, Comisiones Bancarias, Alimentación, Salud, Educación, Entretención, Varios / Otros Gastos

## 🧮 Medidas DAX (Power BI)

- `Total Monto` — Suma base
- `Total Ingresos` — Filtrado por Ingreso
- `Total Gastos` — Filtrado por Gasto
- `Saldo Neto` = Ingresos - Gastos
- `% Gastos s/ Ingresos` — Ratio
- `Promedio Ingresos Mensual`
- `Gastos Acumulados Año` — TOTALYTD
- `Ingresos Acumulados Año` — TOTALYTD
- `Ingresos Var % Mes Ant` — Variación mensual
- `% Gastos Pagados` — De los gastos, cuántos están pagados
- `Rank Empresa Ingresos` — Ranking de empresas por ingreso
- `Num Movimientos` — Conteo de registros
- `Ultima Fecha Movimiento` — Última transacción

---

*Generado por Boop 🦈 — 2026-08-10*