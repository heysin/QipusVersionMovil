import { getValidationError } from "./validacionErrores";


export const handleError = (exception: any) => {

    if (!exception.response) {
        return "Error de conexión. Inténtalo de nuevo más tarde.";
    }

    const { data, status } = exception?.response;
    
    if (data?.error) {
       // console.log("data.error---->",data.error)
        const { code, message } = data.error;
       // console.log("code Error",code)
        return getValidationError(code) || message
    }

    return "Ocurrio un error desconocido.";
};