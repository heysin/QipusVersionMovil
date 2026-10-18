import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {  StyleSheet,  View,  Text,  TextInput,  TouchableOpacity,  ActivityIndicator,  SafeAreaView,  ScrollView,  Modal,} from "react-native";
import monitorDeclaracionesservice from "../../servicios/monitorDeclaraciones/monitorDeclaraciones";
import type { DeclarationReportItem } from "../../models/monitorDeclaraciones";
import EmpresaDropdown from "../../components/EmpresaDropdown";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoginContext } from "../../context/loginContext";
import { useEmpresas } from "../../context/empresaContext";

// Indicadores específicos para Monitor de Declaraciones
const INDICADORES_MONITOR = [
  { text: "Oportunamente", color: "#48BB78" },
  { text: "Fuera de plazo", color: "#ED8936" },
  { text: "No Realizado", color: "#F56565" },
  { text: "No Requiere", color: "#4299E1" },
  { text: "Pendiente por vencer", color: "#ECC94B" },
];

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sept", "oct", "nov", "dic",
];

const formatDeclarationPeriod = (month: number, year: number) =>
  `${MONTHS[month - 1]}-${year}`;

const parseDeclarationPeriod = (period: string) => {
  const match = /^([a-z]+)-(\d{4})$/i.exec(period.trim());
  const month = match ? MONTHS.indexOf(match[1].toLowerCase()) + 1 : -1;
  const year = match ? Number(match[2]) : NaN;
  return month > 0 && Number.isInteger(year) ? { month, year } : null;
};

const getPreviousDeclarationPeriod = () => {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  return formatDeclarationPeriod(previousMonth.getMonth() + 1, previousMonth.getFullYear());
};

const toApiPeriod = (period: string) => {
  const parsed = parseDeclarationPeriod(period);
  if (!parsed) {
    throw new Error("El periodo debe tener el formato mes-AAAA.");
  }

  return `${String(parsed.month).padStart(2, "0")}${String(parsed.year).slice(-2)}`;
};

const formatAmount = (amount: number | null | undefined) => {
  if (amount == null || amount === -1) {
    return "";
  }

  return `S/. ${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

const formatLastUpdate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const hour12 = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";
  return `${day}/${month}/${year} ${String(hour12).padStart(2, "0")}:${minutes} ${meridiem}`;
};

const parseReportResponse = (response: unknown) => {
  let current = response;
  let fechaUltimaActualizacion = "";

  while (current && typeof current === "object") {
    if (Array.isArray(current)) {
      return { data: current, fechaUltimaActualizacion };
    }

    const payload = current as Record<string, unknown>;
    const fecha =
      payload.fechaUltimaActualizacion ??
      payload.FechaUltimaActualizacion ??
      payload.fechaUltEjec;
    if (typeof fecha === "string") {
      fechaUltimaActualizacion = fecha;
    }

    const table = payload.dataTable ?? payload.DataTable;
    if (Array.isArray(table)) {
      return { data: table, fechaUltimaActualizacion };
    }

    if (Array.isArray(payload.data)) {
      return { data: payload.data, fechaUltimaActualizacion };
    }

    const nested = payload.data ?? payload.result ?? payload.Result;
    if (!nested || nested === current) {
      break;
    }
    current = nested;
  }

  return null;
};

export default function MonitorDeclaraciones() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useContext(LoginContext);
  const { enterprises, isLoadingEnterprises, hasLoadedEnterprises, enterpriseError } = useEmpresas();

  const [idEmpresa, setIdEmpresa] = useState("");
  const [periodo, setPeriodo] = useState(getPreviousDeclarationPeriod);
  const [periodPickerVisible, setPeriodPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => {
    const previousPeriod = parseDeclarationPeriod(getPreviousDeclarationPeriod());
    return previousPeriod?.year ?? new Date().getFullYear();
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DeclarationReportItem[]>([]);
  const [fechaUltimaActualizacion, setFechaUltimaActualizacion] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [companyMenuVisible, setCompanyMenuVisible] = useState(false);
  const hasInitializedCompanyFilter = useRef(false);

  const fetchData = useCallback(async (companyId = idEmpresa) => {
    setLoading(true);
    setError(null);

    try {
      const filters = {
        idEmpresa: companyId.trim(),
        periodo: toApiPeriod(periodo),
      };

      const response = await monitorDeclaracionesservice.getDeclarationsAndPaymentsReport({ filters });
      const report = parseReportResponse(response);
      if (!report) {
        throw new Error("La respuesta no contiene una lista de declaraciones.");
      }

      setData(report.data);
      setFechaUltimaActualizacion(report.fechaUltimaActualizacion);
    } catch (err) {
      console.error("Detalle del fallo:", err);
      setError("Error al obtener las declaraciones");
      setData([]);
      setFechaUltimaActualizacion("");
    } finally {
      setLoading(false);
    }
  }, [idEmpresa, periodo]);

  useEffect(() => {
    if (!isLoggedIn || !hasLoadedEnterprises || hasInitializedCompanyFilter.current) return;

    hasInitializedCompanyFilter.current = true;
    const initialCompany = enterprises[0];
    const initialCompanyId = initialCompany?.idEmpresa ?? "";

    setIdEmpresa(initialCompanyId);
    void fetchData(initialCompanyId);
  }, [enterprises, fetchData, hasLoadedEnterprises, isLoggedIn]);

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { width: 180 }]}>Obligación</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Declaración</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Pago</Text>
      <Text style={[styles.headerCell, { width: 130 }]}>Deuda Pendiente</Text>
    </View>
  );

  const renderItem = (item: any, index: number) => {
    return (
      <View
        key={`${item.idDeclaracion ?? "decl"}-${index}`}
        style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
      >
        <Text style={[styles.cellText, styles.cellTextBold, { width: 180 }]}>
          {item.descripcion || "-"}
        </Text>
        <Text style={[styles.cellText, { width: 120 }]}>
          {formatAmount(item.montoDeclarado)}
        </Text>
        <Text style={[styles.cellText, { width: 120 }]}>
          {formatAmount(item.montoPagado)}
        </Text>
        <Text style={[styles.cellText, { width: 130 }]}>
          {formatAmount(item.deudaPendiente)}
        </Text>
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
          <Text style={styles.titleText}>Monitor de Declaraciones</Text>
        </View>

        {/* Banner Informativo */}
        <View style={styles.infoBanner}>
          <Icon name="information" size={20} color="#3182CE" style={styles.infoIcon} />
          <Text style={styles.infoBannerText}>
            Este monitor muestra las declaraciones y pagos registrados desde enero del año en que se realizó el registro de la empresa, hasta el periodo contable más reciente disponible en SUNAT.
          </Text>
        </View>

        {/* Controles de Filtros */}
        <View style={styles.filterContainer}>
          <View style={[styles.inputGroup, styles.companyInputGroup]}>
            <Text style={styles.label}>Empresa:</Text>
            <EmpresaDropdown
              enterprises={enterprises}
              selectedEnterpriseId={idEmpresa}
              isLoading={isLoadingEnterprises}
              error={enterpriseError}
              isOpen={companyMenuVisible}
              onToggle={() => setCompanyMenuVisible((visible) => !visible)}
              onSelect={(enterprise) => {
                setIdEmpresa(enterprise.idEmpresa);
                setCompanyMenuVisible(false);
                void fetchData(enterprise.idEmpresa);
              }}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Periodo:</Text>
            <View style={styles.periodInputContainer}>
              <TouchableOpacity
                style={styles.periodInputButton}
                onPress={() => {
                  setCompanyMenuVisible(false);
                  const selectedPeriod = parseDeclarationPeriod(periodo);
                  if (selectedPeriod) setPickerYear(selectedPeriod.year);
                  setPeriodPickerVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar periodo"
              >
                <TextInput
                  style={styles.periodInput}
                  value={periodo}
                  editable={false}
                  pointerEvents="none"
                  placeholder="mes-AAAA"
                />
                <Icon name="calendar-month-outline" size={22} color="#743484" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setCompanyMenuVisible(false);
              void fetchData();
            }}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {/* Encabezado de la Sección de Tabla */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Declaraciones y Pagos</Text>
          {fechaUltimaActualizacion ? (
            <Text style={styles.lastUpdateText}>
              Fecha de última actualización: {formatLastUpdate(fechaUltimaActualizacion)}
            </Text>
          ) : null}
        </View>

        {/* Tabla con Scroll Horizontal */}
        <View style={styles.tableContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#743484" />
              <Text style={styles.loadingText}>Cargando declaraciones...</Text>
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
                {data.length > 0 ? (
                  data.map(renderItem)
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No se encontraron declaraciones para el periodo y empresa seleccionados.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Sección de Indicadores */}
        <View style={styles.sectionContainer}>
          <Text style={styles.subtitle}>Indicadores</Text>
          <View style={styles.indicatorsContainer}>
            {INDICADORES_MONITOR.map((item) => (
              <View key={item.text} style={styles.indicatorItem}>
                <View style={[styles.indicatorSquare, { backgroundColor: item.color }]} />
                <Text style={styles.indicatorText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={periodPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPeriodPickerVisible(false)}
      >
        <View style={styles.periodModalOverlay}>
          <View style={styles.periodModalCard}>
            <Text style={styles.periodModalTitle}>Selecciona un periodo</Text>
            <View style={styles.yearSelector}>
              <TouchableOpacity
                onPress={() => setPickerYear((year) => year - 1)}
                accessibilityRole="button"
                accessibilityLabel="Año anterior"
                style={styles.yearButton}
              >
                <Icon name="chevron-left" size={24} color="#743484" />
              </TouchableOpacity>
              <Text style={styles.yearText}>{pickerYear}</Text>
              <TouchableOpacity
                onPress={() => setPickerYear((year) => year + 1)}
                accessibilityRole="button"
                accessibilityLabel="Año siguiente"
                style={styles.yearButton}
              >
                <Icon name="chevron-right" size={24} color="#743484" />
              </TouchableOpacity>
            </View>
            <View style={styles.monthGrid}>
              {MONTHS.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={styles.monthButton}
                  onPress={() => {
                    setPeriodo(formatDeclarationPeriod(index + 1, pickerYear));
                    setPeriodPickerVisible(false);
                  }}
                >
                  <Text style={styles.monthButtonText}>{month}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.periodCancelButton}
              onPress={() => setPeriodPickerVisible(false)}
            >
              <Text style={styles.periodCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    padding: 18,
    backgroundColor: "#743484",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8FF",
    borderColor: "#3182CE",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 10,
    marginTop: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#2B6CB0",
    lineHeight: 16,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    position: "relative",
    zIndex: 20,
    backgroundColor: "#FFFFFF",
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  inputGroup: {
    flex: 1,
    marginRight: 10,
  },
  companyInputGroup: {
    position: "relative",
    zIndex: 10,
  },
  label: {
    fontSize: 12,
    color: "#4A5568",
    marginBottom: 4,
    fontWeight: "600",
  },
  periodInputContainer: {
    height: 40,
    borderColor: "#CBD5E0",
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: "#F7FAFC",
  },
  periodInputButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  periodInput: {
    flex: 1,
    padding: 0,
    color: "#2D3748",
  },
  button: {
    backgroundColor: "#743484",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
  },
  lastUpdateText: {
    fontSize: 11,
    color: "#718096",
    marginTop: 3,
  },
  tableContainer: {
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
  cellTextBold: {
    fontWeight: "600",
    textAlign: "left",
    paddingLeft: 10,
  },
  sectionContainer: {
    marginTop: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    gap: 12,
  },
  indicatorItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 12,
    color: "#4A5568",
  },
  centerContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
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
    width: 630,
  },
  emptyText: {
    color: "#718096",
    fontSize: 14,
    textAlign: "center",
  },
  periodModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  periodModalCard: {
    width: "100%",
    maxWidth: 360,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  periodModalTitle: {
    marginBottom: 16,
    color: "#2D3748",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  yearSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  yearButton: {
    padding: 8,
  },
  yearText: {
    minWidth: 90,
    color: "#2D3748",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  monthButton: {
    width: "30%",
    margin: "1.5%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F3EAF5",
    alignItems: "center",
  },
  monthButtonText: {
    color: "#743484",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  periodCancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  periodCancelText: {
    color: "#718096",
    fontWeight: "600",
  },
});