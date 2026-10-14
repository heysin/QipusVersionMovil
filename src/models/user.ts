export interface UsuarioResponse {
    idUsuario: number;
    dni: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    activo: boolean;
    anuncioVisible: boolean;
}

export interface EditarUsuario {
    IdUsuario: number;
    Nombre: string;
    Apellidos: string;
    Telefono: string;
    Activo: boolean;
    Email: string;
    Dni: string;
    password: string;
    passwordConfirm: string
    
}
export interface ActualizarContraseña {
    Dni: string;
    password: string;
    passwordConfirm: string
}