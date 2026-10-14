export interface SunatConnectionRequest {
    usuarioSunat: string;
    claveSunat: string;
    ruc: string;

}

export interface SaveEnterpriseRequest {
    usuarioSunat: string;
    claveSunat: string;
    ruc: string;
    razonSocial: string;
    email: string;
    PrimeraNotificacionVencimiento: number;
    SegundaNotificacionVencimiento: number;
    DiaDespuesVencimiento: number;
    declaraciones: string[];
    ClientId: string;
    ClientSecret: string;
}



export interface EnterprisePicker{
    idEmpresa: string;
    razonSocial: string;
    ruc: string;
    emp_nuevo: boolean;
    unlimitedDownload: boolean;
    indOc: boolean;
    fechaRegistro: string;
    fechaExecScrapper: string | null;
    fechaExecServCompCompras: string | null;
    pro: boolean;
    diasPorVencer: number;
    renovacion: boolean;
    creditoTotal: number;
    creditoDisponible: number;
    creditoConsumido: number;
    empresaProVersionAnterior: boolean;
};

export interface DeclaracionDTO
{
    idDeclaracionEmp: string;
    idFormulario: number;
    activo: boolean;
}

export interface UpdateEnterpriseRequest extends Omit<SaveEnterpriseRequest, "declaraciones"> {
    idEmpresa?: string;
    declaraciones: DeclaracionDTO[];
}

export interface EmpresaPro
{
    idEmpresa: string;
    tipoPlan: string;
}
export interface EmpresaPiloto
{
    ruc: string;
}
export interface EnterpriseSuscripcion{
    idEmpresa: string;
};