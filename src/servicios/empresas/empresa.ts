import api from "../api";
import type { EnterprisePicker, EnterpriseSuscripcion, SaveEnterpriseRequest, SunatConnectionRequest, UpdateEnterpriseRequest } from "../../models/enterprise";

const BASE_ENDPOINT = "api/Enterprise";

const getAll = async () => {
  try {
    const response = await api.get(BASE_ENDPOINT);
    return response.data;
  } catch (error: any) {
    console.error("[EMPRESAS] error al obtener empresas:", {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
    });
    throw error;
  }
};

const getEnterprisesForUserPicker = async () => {
  return api.get<EnterprisePicker[]>(`${BASE_ENDPOINT}/GetEnterprisesForUserPicker`);
};

const GetEmpresaSuscripcionById = async ({ filters }: { filters: EnterpriseSuscripcion }) => {
  const response = await api.post(`${BASE_ENDPOINT}/suscripcion`, filters);
  return response.data;
};

const saveEnterprise = async ({ enterprise }: { enterprise: SaveEnterpriseRequest }) => {
  const response = await api.post(BASE_ENDPOINT, enterprise);
  return response.data;
};

const updateEnterprise = async ({ idEmpresa, enterprise }: { idEmpresa: string; enterprise: UpdateEnterpriseRequest }) => {
  const response = await api.put(`${BASE_ENDPOINT}/${idEmpresa}`, enterprise, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const deleteEnterprise = async (idEmpresa: string) => {
  const response = await api.delete(`${BASE_ENDPOINT}/${idEmpresa}`);
  return response.data;
};

const validateSunatAccess = async({access} : {access:SunatConnectionRequest}) => {
    const request = await api.post(`${BASE_ENDPOINT}/validateSunatAccess`, access);
    
    return request.data;       
}
const getEmpresaById = async ({idEmpresa}: {idEmpresa:string}) => {
    const request =await api.get(`${BASE_ENDPOINT}/${idEmpresa}`);
   return request.data; 
}
export default {
  getAll,
  getEnterprisesForUserPicker,
  GetEmpresaSuscripcionById,
  saveEnterprise,
  updateEnterprise,
  deleteEnterprise,
  validateSunatAccess,
  getEmpresaById,  
};