import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {  StyleSheet,  View,  Text,  TouchableOpacity,  ActivityIndicator,  SafeAreaView,  ScrollView, Alert, } from "react-native";
import comprobanteComprasService from "../../servicios/comprobantesCompras/comprobanteCompras";
import { comprobantesComprasFilters } from "../../models/comprobantesCompras";
import { getCurrentPeriod } from "../../utils/periodo";
import { LoginContext } from "../../context/loginContext";
import { useEmpresas } from "../../context/empresaContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Modal } from "react-native";
import Pdf from "react-native-pdf";
import { INDICATOR_CONSTANTS_ARCHIVOS } from "../../constant/indicadorConstantArchivos";
import Indicator from "../../components/indicadorArchivos";
import EmpresaDropdown from "../../components/EmpresaDropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PeriodoPicker from "../../components/PeriodoPicker";

export default function ComprobantesCompras() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, hasEnterprise } = useContext(LoginContext);
  const { enterprises, isLoadingEnterprises, hasLoadedEnterprises, enterpriseError } = useEmpresas();
  const [idEmpresa, setIdEmpresa] = useState("");
  const selectedEnterprise = enterprises.find((enterprise) => enterprise.idEmpresa === idEmpresa);
  const [periodo, setPeriodo] = useState(getCurrentPeriod);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
// Estados para el visor PDF
  const [modalPDFVisible, setModalPDFVisible] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [showModalDescargaComprobantes, setShowModalDescargaComprobantes] = useState(false);
  // Empresas (selector)
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const hasInitializedCompanyFilter = useRef(false);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPageStart = (page - 1) * pageSize;
  const paginatedData = useMemo(() => {
    const startIndex = currentPageStart;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPageStart, pageSize]);

  const fetchData = useCallback(async (companyId = idEmpresa) => {
    setLoading(true);
    setError(null);

    try {
      const filters: comprobantesComprasFilters = {
        idEmpresa: companyId.trim(),
        periodo: periodo.trim(),
      };

      const response = await comprobanteComprasService.getComprobantesComprasReport({ filters });
      const responseData = response?.data ?? response;
      const tableData = responseData && Array.isArray(responseData.dataTable)
        ? responseData.dataTable
        : Array.isArray(responseData)
          ? responseData
          : [];

      setData(tableData);
      setPage(1);
    } catch (err: any) {
      console.error("Detalle del fallo:", err);
      setError("Error al obtener los comprobantes");
      setData([]);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [idEmpresa, periodo]);

  useEffect(() => {
    if ( !isLoggedIn || !hasEnterprise || isLoadingEnterprises ||  !hasLoadedEnterprises ||   hasInitializedCompanyFilter.current ) 
    {
      return;
    }

    hasInitializedCompanyFilter.current = true;
    const initialCompany = enterprises[0];
    if (!initialCompany) {
      setData([]);
      setError(enterpriseError ?? null);
      return;
    }

    const initialCompanyId = initialCompany.idEmpresa;
    setIdEmpresa(initialCompanyId);
    void fetchData(initialCompanyId);
  }, [
    enterprises,
    enterpriseError,
    fetchData,
    hasEnterprise,
    hasLoadedEnterprises,
    isLoggedIn,
    isLoadingEnterprises,
  ]);

  const handleViewPDF = async (item: any) => {
    setShowModalDescargaComprobantes(true);
    try {
      const filters = {
        ruc: item.ruc || "",
        periodo: item.periodo || "",
        carSunat: item.carSunat || "",
        tipoArchivo: "PDF",
        idCompCompras: item.idCompCompras || "",
        idEmpresa: idEmpresa ? idEmpresa.trim() : "",
      };

      const response = await comprobanteComprasService.getArchivoComprobante({ filters });
      if (response.success && response.data.fileData) {
        setPdfBase64(response.data.fileData);
        setModalPDFVisible(true);
      } else {
        Alert.alert(
          "PDF no disponible",
          response.message || "No se pudo obtener el comprobante.",
        );
      }
    } catch (err) {
      console.error("Error al visualizar PDF:", err);
      Alert.alert("Error", "No se pudo cargar la vista previa del comprobante.");
    } finally {
      setShowModalDescargaComprobantes(false);
    }
  };

  const closePDFModal = () => {
    setModalPDFVisible(false);
    setShowModalDescargaComprobantes(false);
  };

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  // Función auxiliar para obtener el color según el código de estado
const getIconColor = (estado: unknown) => {
  const normalizedEstado =
    typeof estado === "string" ? estado.trim().toUpperCase() : "";

  return (
    INDICATOR_CONSTANTS_ARCHIVOS.find(
      (indicator) => indicator.codEstado === normalizedEstado,
    )?.color ?? "#A9A9A9"
  );
};

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { width: 50 }]}>N°</Text>
      <Text style={[styles.headerCell, { width: 100 }]}>Fecha Emisión</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Tipo Doc.</Text>
      <Text style={[styles.headerCell, { width: 70 }]}>Serie</Text>
      <Text style={[styles.headerCell, { width: 110 }]}>Número</Text>
      <Text style={[styles.headerCell, { width: 110 }]}>RUC</Text>
      <Text style={[styles.headerCell, { width: 200 }]}>Proveedor</Text>
      <Text style={[styles.headerCell, { width: 100 }]}>Importe</Text>
      <Text style={[styles.headerCell, { width: 70 }]}>Moneda</Text>
      <Text style={[styles.headerCell, { width: 150 }]}>Glosa</Text>
      <Text style={[styles.headerCell, { width: 50 }]}>OBS</Text>
      <Text style={[styles.headerCell, { width: 50 }]}>PDF</Text>
      <Text style={[styles.headerCell, { width: 50 }]}>XML</Text>
    </View>
  );

  const renderItem = (item: any, index: number) => {
    const pdfColor = getIconColor(item.estadoPDF);
    const xmlColor = getIconColor(item.estadoXML);
    return (
    <View
      key={`${item.idCompCompras ?? "comprobante"}-${currentPageStart + index}`}
      style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
    >
      <Text style={[styles.cellText, { width: 50 }]}>{currentPageStart + index + 1}</Text>
      <Text style={[styles.cellText, { width: 100 }]}>{item.fechaEmision || "-"}</Text>
      <Text style={[styles.cellText, { width: 120 }]}>{item.descripcionComprobante || "-"}</Text>
      <Text style={[styles.cellText, { width: 70 }]}>{item.serieComprobante || "-"}</Text>
      <Text style={[styles.cellText, { width: 110 }]}>{item.numeroComprobanteInicio || "-"}</Text>
      <Text style={[styles.cellText, { width: 110 }]}>{item.rucProvedor || "-"}</Text>
      <Text style={[styles.cellText, { width: 200 }]} numberOfLines={2}>{item.razonSocialProveedor || "-"}</Text>
      <Text style={[styles.cellText, { width: 100 }]}>{item.totalComprobante !== undefined ? `S/. ${item.totalComprobante}` : "-"}</Text>
      <Text style={[styles.cellText, { width: 70 }]}>{item.moneda || "-"}</Text>
      <Text style={[styles.cellText, { width: 150 }]} numberOfLines={2}>{item.glosa || "-"}</Text>
      <View style={[styles.Acciones, { width: 50, elevation: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }]}> 
        <TouchableOpacity onPress={() => handleViewPDF(item)} >
          <Icon name="eye" size={25} color="#555" />
        </TouchableOpacity>
      </View>
      <View style={[styles.Acciones, { width: 50, elevation: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }]}>     
          <Icon name="download" size={25} color={pdfColor} />
      </View>
      <View style={[styles.Acciones, { width: 50, elevation: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }]}> 
          <Icon name="download" size={25} color={xmlColor} />
      </View>

    </View>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={[
          styles.mainScrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {/* Título de la pantalla */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Comprobantes de Compras</Text>
          <Text style={styles.subtitleText}>
              Todos los comprobantes de compra mostrados corresponden al periodo consultado y provienen directamente de SUNAT.
          </Text>
        </View>
        {/* Controles de Filtros */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <View style={[styles.inputGroup, styles.companyInputGroup]}>
              {/* <Text style={styles.label}>Empresa:</Text> */}
              <EmpresaDropdown
                enterprises={enterprises}
                selectedEnterpriseId={idEmpresa}
                isLoading={isLoadingEnterprises}
                error={enterpriseError}
                isOpen={companyModalVisible}
                onToggle={() => setCompanyModalVisible((visible) => !visible)}
                onSelect={(enterprise) => {
                  setIdEmpresa(enterprise.idEmpresa);
                  setCompanyModalVisible(false);
                  void fetchData(enterprise.idEmpresa);
                }}
              />
            </View>
          </View>
          <View style={[styles.filterRow, styles.filterActionsRow]}>
            <TouchableOpacity
              style={styles.creditsButton}
              onPress={() => {
                // setCompanyModalVisible(false);
                // void fetchData();
              }}
              disabled={loading}
            >
              <Icon name="database" size={18} color="#665000" />
              <Text style={styles.creditsButtonText}>
                {selectedEnterprise?.creditoDisponible ?? 0} créditos
              </Text>
            </TouchableOpacity>
            <View style={[styles.inputGroup, styles.periodInputGroup]}>
              <PeriodoPicker
                value={periodo}
                onChange={setPeriodo}
                onOpen={() => setCompanyModalVisible(false)}
              />
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setCompanyModalVisible(false);
                void fetchData();
              }}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>
               
        {/* Tabla con scroll horizontal */}
        <View style={styles.tableContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#743484" />
            <Text style={styles.loadingText}>Cargando comprobantes...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => void fetchData()}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {renderHeader()}
              {paginatedData.length > 0 ? (
                paginatedData.map(renderItem)
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No se encontraron comprobantes para el periodo y empresa seleccionados.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
        </View>
         {/* PAGINACION */}
        <View style={styles.paginationBar}>
        <TouchableOpacity
          style={[styles.paginationButton, !canGoPrevious && styles.paginationButtonDisabled]}
          onPress={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          disabled={!canGoPrevious}
        >
          <Text style={[styles.paginationButtonText, !canGoPrevious && styles.paginationButtonTextDisabled]}>Anterior</Text>
        </TouchableOpacity>

        <Text style={styles.paginationText}>Página {page} de {totalPages}</Text>

        <TouchableOpacity
          style={[styles.paginationButton, !canGoNext && styles.paginationButtonDisabled]}
          onPress={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
          disabled={!canGoNext}
        >
          <Text style={[styles.paginationButtonText, !canGoNext && styles.paginationButtonTextDisabled]}>Siguiente</Text>
        </TouchableOpacity>
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.subtitle}>Estado de Disponibilidad de Archivos</Text>
          <View style={styles.indicatorsContainer}>
            {INDICATOR_CONSTANTS_ARCHIVOS.map((item) => (
              <Indicator 
                key={item.codEstado}
                textIndicator={item.text}
                colorIndicator={item.color}
              />
            ))}
          </View>
        </View>
      </ScrollView>
        {/* Modal para visualizar PDF */}
        <Modal
          visible={modalPDFVisible || showModalDescargaComprobantes}
          transparent
          animationType="fade"
          onRequestClose={closePDFModal}
        >
          <View style={styles.pdfModalOverlay}>
            <SafeAreaView style={styles.pdfModalCard}>
              <View style={styles.pdfModalHeader}>
                <Text style={styles.pdfModalTitle}>
                  Vista Previa del Comprobante
                </Text>
                <TouchableOpacity onPress={closePDFModal} accessibilityRole="button" accessibilityLabel="Cerrar vista previa del comprobante"
                  hitSlop={12}
                  style={styles.pdfModalCloseButton}
                >
                  <Icon name="close" size={20} color="#2D3748" />
                </TouchableOpacity>
              </View>

              {showModalDescargaComprobantes ? (
                <View style={styles.pdfLoadingOverlay}>
                  <View style={styles.pdfLoadingCard}>
                    <ActivityIndicator size="large" color="#743484" />
                    <Text style={styles.pdfLoadingText}>Cargando comprobante...</Text>
                  </View>
                </View>
              ) : pdfBase64 ? (
                <Pdf
                  source={{ uri: `data:application/pdf;base64,${pdfBase64}`, cache: true }}
                  style={styles.pdfViewer}
                  onError={(pdfError) => {
                    console.error("Error en visor PDF:", pdfError);
                    Alert.alert("Error", "No se pudo mostrar el archivo PDF.");
                  }}
                />
              ) : (
                <View style={styles.pdfEmptyState}>
                  <Text style={{ color: "#718096" }}>No se pudo cargar la vista previa del documento.</Text>
                </View>
              )}
            </SafeAreaView>
          </View>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pdfModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  pdfModalCard: {
    width: "92%",
    height: "80%",
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 8,
  },
  pdfModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  pdfModalTitle: {
    flex: 1,
    marginRight: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
  },
  pdfModalCloseButton: {
    padding: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
  },
  pdfViewer: {
    flex: 1,
    width: "100%",
  },
  pdfEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pdfLoadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  pdfLoadingCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  pdfLoadingText: {
    marginTop: 12,
    color: "#2D3748",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
  },
  titleContainer: {
    padding: 20,
    backgroundColor: "#743484",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#602470",
  },
  titleText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitleText: {
    fontSize: 12,
    color: '#FFFFFF', 
  },
  filterContainer: {
    flexDirection: "column",
    position: "relative",
    zIndex: 20,
    backgroundColor: "#FFFFFF",
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  filterActionsRow: {
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  inputGroup: {
    flex: 1,
    marginRight: 10,
  },
  periodInputGroup: {
    flex: 0,
    width: 130,
    marginRight: 0,
  },
  companyInputGroup: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  label: {
    fontSize: 12,
    color: "#4A5568",
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    height: 40,
    borderColor: "#CBD5E0",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F7FAFC",
    color: "#2D3748",
  },
  button: {
    backgroundColor: "#743484",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  creditsButton: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#F2C94C",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  creditsButtonText: {
    color: "#665000",
    fontWeight: "bold",
    fontSize: 12,
  },
  paginationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    //backgroundColor: "#FFFFFF",
    marginHorizontal: 10,
    marginTop: 10,
    //borderRadius: 8,
    //borderWidth: 1,
    //borderColor: "#E2E8F0",
  },
  paginationButton: {
    backgroundColor: "#743484",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 90,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  paginationButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  paginationButtonTextDisabled: {
    color: "#A0AEC0",
  },
  paginationText: {
    color: "#4A5568",
    fontSize: 12,
    fontWeight: "600",
  },
  tableContainer: {
    flex: 1,
    zIndex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E0",
    paddingVertical: 10,
  },
  headerCell: {
    fontWeight: "bold",
    color: "#2D3748",
    textAlign: "center",
    fontSize: 13,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    paddingVertical: 12,
    alignItems: "center",
  },
  rowEven: {
    backgroundColor: "#FFFFFF",
  },
  rowOdd: {
    backgroundColor: "#F7FAFC",
  },
  cellText: {
    color: "#4A5568",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#4A5568",
    fontSize: 14,
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#743484",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    width: 1030,
  },
  emptyText: {
    color: "#718096",
    fontSize: 14,
    textAlign: "center",
  },
   Acciones: {
    alignItems: "center",
    justifyContent: "center",
  },

  //color de archivos según el indicador
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginHorizontal: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 10,
  },
  indicatorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
