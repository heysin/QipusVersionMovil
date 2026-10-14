import config from "../../utils/config";
import axios from "axios";

const getReportes = () => {
    const request = axios.get(`${config.API_URL}api/ReporteQipus/getReporteConsolidado`);
    return request.then(response => response.data);
}

export default {
   getReportes
};