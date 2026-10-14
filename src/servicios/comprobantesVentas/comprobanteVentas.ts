import config from "../../utils/config";
import { archivoFilters, comprobantesVentasFilters ,} from "../../models/comprobanteVentas";
import { Alert } from "react-native";
import axios from "axios";

const getComprobantesVentasReport = async({filters}: {filters:comprobantesVentasFilters}) => {
    const request = axios.post(`${config.API_URL}api/ComprobantesVentas/getComprobantesVentasReport`,filters);
    return request.then(response => response.data);
}
const downloadFileVentas = async({filters}: {filters:archivoFilters}) => {
    const request = axios.post(`${config.API_URL}api/ComprobantesVentas/downloadFileVentas`,filters);
    return request.then(response => response.data);
}

export default {
   getComprobantesVentasReport,
   downloadFileVentas
};