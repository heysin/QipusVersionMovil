export interface DeclarationsAndPaymentsFilters {
    idEmpresa: string;
    periodo: string;
}

export interface DeclarationReportItem {
    idDeclEmp?: string;
    idDeclaracion?: string;
    idFormulario?: number;
    descripcion?: string;
    montoDeclarado?: number | null;
    fechaDeclarado?: string | null;
    estadoDecl?: string | null;
    montoPagado?: number | null;
    fechaPago?: string | null;
    estadoPago?: string | null;
    deudaPendiente?: number | null;
    indIGVJusto?: boolean;
}