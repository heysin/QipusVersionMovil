import React from 'react';
import { act, create } from 'react-test-renderer';
import Empresas from '../src/pages/Empresas/empresas';

const mockGetAll = jest.fn();
const mockDeleteEnterprise = jest.fn();
const mockUpdateEnterprise = jest.fn();
const mockSaveEnterprise = jest.fn();
const mockGetEmpresaSuscripcionById = jest.fn();

jest.mock('../src/servicios/empresas/empresa', () => ({
  __esModule: true,
  default: {
    getAll: (...args: any[]) => mockGetAll(...args),
    GetEmpresaSuscripcionById: (...args: any[]) => mockGetEmpresaSuscripcionById(...args),
    saveEnterprise: (...args: any[]) => mockSaveEnterprise(...args),
    updateEnterprise: (...args: any[]) => mockUpdateEnterprise(...args),
    deleteEnterprise: (...args: any[]) => mockDeleteEnterprise(...args),
  },
}));

describe('Empresas screen', () => {
  beforeEach(() => {
    mockGetAll.mockResolvedValue({
      data: {
        empresas: [
          {
            idEmpresa: '1',
            ruc: '20456789012',
            razonSocial: 'Empresa Demo',
            usuarioSunat: 'demo',
            pro: true,
          },
        ],
      },
    });
    mockDeleteEnterprise.mockResolvedValue({ success: true });
    mockUpdateEnterprise.mockResolvedValue({ success: true });
    mockSaveEnterprise.mockResolvedValue({ success: true });
    mockGetEmpresaSuscripcionById.mockResolvedValue({ data: { idEmpresa: '1' } });
  });

  it('renderiza la acción para agregar una empresa', async () => {
    let component: ReturnType<typeof create>;

    await act(async () => {
      component = create(<Empresas />);
    });

    const addButton = component!.root.findAllByProps({
      accessibilityLabel: 'Agregar empresa',
    });

    expect(addButton.length).toBeGreaterThan(0);
  });
});
