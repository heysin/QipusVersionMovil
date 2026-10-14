import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import type { EnterprisePicker } from "../models/enterprise";
import enterpriseService from "../servicios/empresas/empresa";
import { LoginContext } from "./loginContext";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getEnterpriseList = (responseData: unknown): EnterprisePicker[] | null => {
  if (Array.isArray(responseData)) return responseData;
  if (!isRecord(responseData)) return null;

  const nestedData = isRecord(responseData.data) ? responseData.data : null;
  const possibleLists = [
    responseData.data,
    responseData.empresas,
    responseData.enterprises,
    responseData.listEnterprise,
    nestedData?.empresas,
    nestedData?.enterprises,
    nestedData?.listEnterprise,
  ];

  return possibleLists.find(
    (value): value is EnterprisePicker[] => Array.isArray(value),
  ) ?? null;
};

interface EmpresaContextValue {
  enterprises: EnterprisePicker[];
  isLoadingEnterprises: boolean;
  hasLoadedEnterprises: boolean;
  enterpriseError: string | null;
  refreshEnterprises: () => Promise<void>;
}

export const EmpresaContext = createContext<EmpresaContextValue>({
  enterprises: [],
  isLoadingEnterprises: false,
  hasLoadedEnterprises: false,
  enterpriseError: null,
  refreshEnterprises: async () => {},
});

export const EmpresaProvider = ({ children }: React.PropsWithChildren) => {
  const { isLoggedIn, hasEnterprise } = useContext(LoginContext);
  const [enterprises, setEnterprises] = useState<EnterprisePicker[]>([]);
  const [isLoadingEnterprises, setIsLoadingEnterprises] = useState(false);
  const [hasLoadedEnterprises, setHasLoadedEnterprises] = useState(false);
  const [enterpriseError, setEnterpriseError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refreshEnterprises = useCallback(async () => {
    const currentRequestId = ++requestId.current;

    if (!isLoggedIn || !hasEnterprise) {
      setEnterprises([]);
      setEnterpriseError(null);
      setIsLoadingEnterprises(false);
      setHasLoadedEnterprises(false);
      return;
    }

    setIsLoadingEnterprises(true);
    setHasLoadedEnterprises(false);
    setEnterpriseError(null);

    try {
      const { data: responseData } = await enterpriseService.getEnterprisesForUserPicker();
      const listEnterprise = getEnterpriseList(responseData);

      if (!listEnterprise) {
        const responseKeys = isRecord(responseData) ? Object.keys(responseData) : [];
        throw new Error(
          `La respuesta del servicio de empresas no contiene una lista. Claves recibidas: ${responseKeys.join(", ") || "ninguna"}.`,
        );
      }

      if (requestId.current === currentRequestId) {
        setEnterprises(listEnterprise);
      }
    } catch (error) {
      if (requestId.current === currentRequestId) {
        const requestError = axios.isAxiosError(error) ? error : null;
        const requestUrl = requestError?.config?.baseURL
          ? `${requestError.config.baseURL}${requestError.config.url ?? ""}`
          : requestError?.config?.url;
        const status = requestError?.response?.status;

        console.error(
          "Error al cargar las empresas del usuario:",
          {
            message: error instanceof Error ? error.message : "Error desconocido",
            status,
            method: requestError?.config?.method,
            url: requestUrl,
            responseKeys:
              requestError?.response?.data &&
              typeof requestError.response.data === "object"
                ? Object.keys(requestError.response.data)
                : undefined,
          },
        );
        setEnterprises([]);
        setEnterpriseError(
          status === 404
            ? "El servidor no encontró el endpoint para listar las empresas (404)."
            : "No se pudieron cargar las empresas del usuario.",
        );
      }
    } finally {
      if (requestId.current === currentRequestId) {
        setIsLoadingEnterprises(false);
        setHasLoadedEnterprises(true);
      }
    }
  }, [hasEnterprise, isLoggedIn]);

  useEffect(() => {
    void refreshEnterprises();
  }, [refreshEnterprises]);

  return (
    <EmpresaContext.Provider
      value={{
        enterprises,
        isLoadingEnterprises,
        hasLoadedEnterprises,
        enterpriseError,
        refreshEnterprises,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresas = () => useContext(EmpresaContext);
