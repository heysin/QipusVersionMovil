import { TypeWithKey } from "../models/type-with-key";

export const getValidationError = (errorCode: any) => {
    const codeMatcher: TypeWithKey<string> = {
        INVALID_CREDENTIALS : "DNI o contraseña incorrectos, revisar los datos de las credenciales para iniciar sesión",
        USER_INACTIVE: "El usuario no está activo",
        PASSWORD_MISMATCH : "Las contraseñas ingresadas no coinciden",
        PHONE_ALREADY_REGISTERED: "El número de teléfono ingresado ya está asociado a otra cuenta",
        DNI_ALREADY_REGISTERED: "El DNI ingresado ya está registrado en otra cuenta",
        ENTERPRISE_ALREADY_REGISTERED: "La empresa ya se encuentra registrada",
        INVALID_RUC_SERVICE_SUNAT: "Los datos de conexión a SUNAT de la Empresa no son correctos",
        INVALID_CREDENTIALS_SERVICE_SUNAT:"Los datos de conexión a SUNAT de la Empresa no son correctos",
        DNI_NOT_REGISTERED:"El DNI ingresado no se encuentra registrado, por favor de ingresar un DNI correcto",
        ERROR_CONECTION_SUNAT:"SUNAT no está respondiendo en este momento. Por favor, intentar en otro momento",
        ERROR_LIMIT_EMPRESA:"Ya no puedes registrar más empresas. Has llegado al límite permitido."
    };

    return codeMatcher[errorCode]
}