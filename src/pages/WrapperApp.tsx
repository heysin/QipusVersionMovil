import React from "react"
import App from "../../App";
import LoginProvider from "../context/loginContext";
import { EmpresaProvider } from "../context/empresaContext";
const WrapperApp=()=>{
    return(
        <>
         <LoginProvider>
             <EmpresaProvider>
                 <App/>
             </EmpresaProvider>
         </LoginProvider>
        </>
    )
}

export default WrapperApp