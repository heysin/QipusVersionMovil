import { comprobantesComprasFilters,archivoFilters } from "../../models/comprobantesCompras";
import api from "../api";

const getComprobantesComprasReport = async({filters}: {filters:comprobantesComprasFilters}) => {
    const request = api.post("api/ComprobantesCompras/getComprobantesReport",filters);
    return request.then(response => response.data);
}
const getArchivoComprobante = async({filters}: {filters:archivoFilters}) => {
    const request = api.post("api/ComprobantesCompras/downloadFile",filters);
    return request.then(response => response.data);
} 
export default {
   getComprobantesComprasReport,
   getArchivoComprobante
};