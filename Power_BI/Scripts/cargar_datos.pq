// Power Query (M) Script — Cargar datos desde Excel
// Usar en Power BI Desktop: Obtener datos > Consulta en blanco > Editor avanzado > pegar esto

let
    // Ruta del Excel (ajustar según donde esté el archivo)
    RutaExcel = "C:\Power_BI\Excel\Registro_Ingresos_Gastos.xlsx",

    // Cargar movimientos
    Movimientos = Excel.Workbook(File.Contents(RutaExcel), null, true),
    tblMovimientos = Movimientos{[Item="tblMovimientos",Kind="Table"]}[Data],
    #"Tipo cambiado" = Table.TransformColumnTypes(tblMovimientos, {
        {"Fecha", type date},
        {"Empresa", type text},
        {"EmpresaId", Int64.Type},
        {"Tipo", type text},
        {"Categoría", type text},
        {"CategoriaId", Int64.Type},
        {"Monto", Currency.Type},
        {"Moneda", type text},
        {"Glosa", type text},
        {"Pagado", type text}
    }),

    // Cargar empresas (dimensión)
    EmpresasRaw = Movimientos{[Item="tblEmpresas",Kind="Table"]}[Data],
    DimEmpresa = Table.TransformColumnTypes(EmpresasRaw, {
        {"EmpresaId", Int64.Type},
        {"Nombre", type text},
        {"RUT", type text},
        {"Tipo", type text}
    }),

    // Cargar categorías (dimensión)
    CategoriasRaw = Movimientos{[Item="tblCategorias",Kind="Table"]}[Data],
    DimCategoria = Table.TransformColumnTypes(CategoriasRaw, {
        {"CategoriaId", Int64.Type},
        {"Nombre", type text},
        {"TipoMovimiento", type text}
    })
in
    #"Tipo cambiado"