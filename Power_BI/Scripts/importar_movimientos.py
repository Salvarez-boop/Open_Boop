import csv, json, sys, os
from datetime import datetime

"""
Importador de movimientos a formato compatible con:
  - Excel (CSV)
  - Dashboard Web (JSON)
  - Power BI (CSV)

Uso:
  python3 importar_movimientos.py entrada.csv
  python3 importar_movimientos.py entrada.json
  python3 importar_movimientos.py entrada.csv --formato powerbi
"""

EMPRESAS = {
    "RenoxPell SpA (YoSorteo.cl)": 1,
    "TransTicket SpA (TransTicket.cl)": 2,
    "Transportes Alvarez SpA": 3,
    "Servicios PubliTruck SpA": 4,
    "Greengo Austral SpA": 5,
    "Inversiones Ibiza SpA": 6,
    "Gastos Personales": 7,
    "Propiedades Salvarez": 8,
    "Best Free Wifi Chile SpA": 9,
}

CATEGORIAS = {
    "Ventas / Servicios": (1, "Ingreso"),
    "Publicidad / Sponsors": (2, "Ingreso"),
    "Arriendos": (3, "Ingreso"),
    "Inversiones / Rentas": (4, "Ingreso"),
    "Otros Ingresos": (5, "Ingreso"),
    "Hosting & Dominios": (10, "Gasto"),
    "Servicios Cloud / APIs": (11, "Gasto"),
    "Sueldos / Honorarios": (12, "Gasto"),
    "Marketing & Publicidad": (13, "Gasto"),
    "Transporte & Logistica": (14, "Gasto"),
    "Insumos Ferreteria": (15, "Gasto"),
    "Mantenimiento Equipos": (16, "Gasto"),
    "Servicios Basicos": (17, "Gasto"),
    "Arriendos (gasto)": (18, "Gasto"),
    "Seguros": (19, "Gasto"),
    "Impuestos / Contribuciones": (20, "Gasto"),
    "Comisiones Bancarias": (21, "Gasto"),
    "Alimentacion": (22, "Gasto"),
    "Salud": (23, "Gasto"),
    "Educacion": (24, "Gasto"),
    "Entretencion": (25, "Gasto"),
    "Varios / Otros Gastos": (26, "Gasto"),
}

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def detect_tipo(categoria):
    cat = CATEGORIAS.get(categoria)
    return cat[1] if cat else ""


def parse_fecha(raw):
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def csv_a_json(path):
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            fecha = parse_fecha(row.get("Fecha", ""))
            if not fecha:
                print(f"  [!] Fecha invalida: {row.get('Fecha')}", file=sys.stderr)
                continue
            empresa = row.get("Empresa", "").strip()
            categoria = row.get("Categoria", "").strip()
            cat_info = CATEGORIAS.get(categoria)
            monto = float(row.get("Monto", 0).replace(".", "").replace(",", "."))
            rows.append({
                "fecha": fecha.strftime("%Y-%m-%d"),
                "empresa": empresa,
                "empresaId": EMPRESAS.get(empresa, 0),
                "tipo": cat_info[1] if cat_info else detect_tipo(categoria),
                "categoria": categoria,
                "categoriaId": cat_info[0] if cat_info else 0,
                "monto": monto,
                "moneda": row.get("Moneda", "CLP").strip(),
                "glosa": row.get("Glosa", "").strip(),
                "pagado": row.get("Pagado", "No").strip(),
            })
    return rows


def exportar_json(rows, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
    print(f"  -> {path} ({len(rows)} registros)")


def exportar_csv(rows, path):
    if not rows:
        return
    fieldnames = [
        "Fecha", "Empresa", "EmpresaId", "Tipo", "Categoria",
        "CategoriaId", "Monto", "Moneda", "Glosa", "Pagado",
    ]
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow({
                "Fecha": r["fecha"],
                "Empresa": r["empresa"],
                "EmpresaId": r["empresaId"],
                "Tipo": r["tipo"],
                "Categoria": r["categoria"],
                "CategoriaId": r["categoriaId"],
                "Monto": r["monto"],
                "Moneda": r["moneda"],
                "Glosa": r["glosa"],
                "Pagado": r["pagado"],
            })
    print(f"  -> {path} ({len(rows)} registros)")


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 importar_movimientos.py <archivo.csv|json> [--formato powerbi]")
        sys.exit(1)

    input_path = sys.argv[1]
    formato = "web"
    if "--formato" in sys.argv:
        idx = sys.argv.index("--formato")
        if idx + 1 < len(sys.argv):
            formato = sys.argv[idx + 1]

    ext = os.path.splitext(input_path)[1].lower()

    if ext == ".csv":
        print(f"Leyendo CSV: {input_path}")
        rows = csv_a_json(input_path)
    elif ext == ".json":
        print(f"Leyendo JSON: {input_path}")
        with open(input_path, encoding="utf-8") as f:
            rows = json.load(f)
    else:
        print(f"Formato no soportado: {ext}")
        sys.exit(1)

    print(f"Total registros: {len(rows)}")

    if formato == "web":
        exportar_json(rows, os.path.join(OUTPUT_DIR, "movimientos_web.json"))
        exportar_csv(rows, os.path.join(OUTPUT_DIR, "movimientos_excel.csv"))
    elif formato == "powerbi":
        exportar_csv(rows, os.path.join(OUTPUT_DIR, "movimientos_powerbi.csv"))
    else:
        exportar_json(rows, os.path.join(OUTPUT_DIR, "movimientos_web.json"))
        exportar_csv(rows, os.path.join(OUTPUT_DIR, "movimientos_excel.csv"))

    print("Listo.")


if __name__ == "__main__":
    main()