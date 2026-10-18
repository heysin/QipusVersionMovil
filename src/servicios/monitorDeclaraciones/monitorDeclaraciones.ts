import type { DeclarationsAndPaymentsFilters } from "../../models/monitorDeclaraciones";
import api from "../api";

const getDeclarationsAndPaymentsReport = async({filters}: {filters:DeclarationsAndPaymentsFilters}) => {
    const request = api.post("api/Monitor/getDeclarationsAndPaymentsReport", filters);
    return request.then(response => response.data);
}

export default {
    getDeclarationsAndPaymentsReport
}