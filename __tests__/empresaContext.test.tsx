import React, { useContext } from "react";
import { Text } from "react-native";
import { act, create } from "react-test-renderer";
import { LoginContext } from "../src/context/loginContext";
import { EmpresaContext, EmpresaProvider } from "../src/context/empresaContext";
import type { EnterprisePicker } from "../src/models/enterprise";

const mockGetEnterprisesForUserPicker = jest.fn();

jest.mock("../src/servicios/empresas/empresa", () => ({
  __esModule: true,
  default: {
    getEnterprisesForUserPicker: (...args: unknown[]) => mockGetEnterprisesForUserPicker(...args),
  },
}));

const Consumer = () => {
  const { enterprises, isLoadingEnterprises, enterpriseError } = useContext(EmpresaContext);
  return (
    <>
      <Text>{isLoadingEnterprises ? "loading" : "loaded"}</Text>
      <Text>{enterpriseError ?? ""}</Text>
      <Text>{enterprises.map((enterprise) => enterprise.razonSocial).join(",")}</Text>
    </>
  );
};

describe("EmpresaContext", () => {
  beforeEach(() => {
    mockGetEnterprisesForUserPicker.mockReset();
  });

  it("loads and shares the user's enterprises after login when hasEnterprise is true", async () => {
    const enterprise: EnterprisePicker = {
      idEmpresa: "empresa-1",
      razonSocial: "Empresa Demo",
      ruc: "20605353372",
      emp_nuevo: false,
      unlimitedDownload: false,
      indOc: true,
      fechaRegistro: "2025-04-26T01:54:38.764141",
      fechaExecScrapper: null,
      fechaExecServCompCompras: null,
      pro: true,
      diasPorVencer: 155,
      renovacion: false,
      creditoTotal: 0,
      creditoDisponible: 0,
      creditoConsumido: 0,
      empresaProVersionAnterior: true,
    };
    mockGetEnterprisesForUserPicker.mockResolvedValue({
      data: { data: [enterprise] },
    });

    const loginContextValue = {
      isLoggedIn: true,
      setIsLoggedIn: jest.fn(),
      hasEnterprise: true,
      setHasEnterprise: jest.fn(),
      user: null,
      setUser: jest.fn(),
      registerActivity: jest.fn(),
      logout: jest.fn(),
    };
    let component: ReturnType<typeof create>;

    await act(async () => {
      component = create(
        <LoginContext.Provider value={loginContextValue}>
          <EmpresaProvider>
            <Consumer />
          </EmpresaProvider>
        </LoginContext.Provider>,
      );
    });

    expect(mockGetEnterprisesForUserPicker).toHaveBeenCalledTimes(1);
    expect(
      component!.root.findAllByType(Text).map((text) => text.props.children),
    ).toContain("Empresa Demo");
  });
});
