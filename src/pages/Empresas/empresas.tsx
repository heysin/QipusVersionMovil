import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import enterpriseService from "../../servicios/empresas/empresa";
import { EnterpriseSuscripcion } from "../../models/enterprise";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { EmpresaForm } from "./empresaForm";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 10;
type CompanyFormMode = "add" | "edit" | "view";

const normalizeString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getFieldValue = (item: any, keys: string[]) => {
  for (const key of keys) {
    const value = item?.[key];
    if (normalizeString(value)) {
      return value;
    }
  }

  return "-";
};

const getVersionLabel = (item: any) => {
  return item?.pro === true ? "PRO" : "FREE";
};
// Formateador auxiliar para fechas DD/MM/YYYY
const formatDate = (dateValue: string | Date | undefined | null) => {
  if (!dateValue) return "-";
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return String(dateValue);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateValue);
  }
};

const columns = {
  ruc: "RUC",
  razonSocial: "Razón Social",
  usuarioSunat: "Usuario SUNAT",
  pro: "Versión",
  suscripcion: "Suscripción",
  acciones: "Acciones",
};

export default function Empresas() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [screenView, setScreenView] = useState<"list" | "form">("list");
  const [companyFormMode, setCompanyFormMode] = useState<CompanyFormMode>("add");
  const [companyFormId, setCompanyFormId] = useState<string | undefined>();

  const [modalSubscriptionVisible, setModalSubscriptionVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const currentPageStart = (page - 1) * PAGE_SIZE;

  const paginatedData = useMemo(() => {
    const startIndex = currentPageStart;
    return data.slice(startIndex, startIndex + PAGE_SIZE);
  }, [data, currentPageStart]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await enterpriseService.getAll();
      const normalizedData = Array.isArray(data?.empresas)
        ? data.empresas
        : Array.isArray(data)
          ? data
          : [];

      setData(normalizedData);
      setPage(1);
    } catch (err: any) {
      const errorDetails = {
        message: err?.message,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
      };

      Alert.alert("Error al cargar empresas", JSON.stringify(errorDetails, null, 2));
      setError("Error al obtener las empresas");
      setData([]);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const redirectToCompanyForm = (mode: CompanyFormMode, idEmpresa?: string) => {
    setCompanyFormMode(mode);
    setCompanyFormId(idEmpresa);
    setScreenView("form");
  };

  const handleAddCompany = () => {
    redirectToCompanyForm("add");
  };

  const handleEditCompany = (item: any) => {
    const idEmpresa = item?.idEmpresa ?? item?.id;
    if (!idEmpresa) {
      Alert.alert("Advertencia", "No se pudo identificar la empresa a editar.");
      return;
    }

    redirectToCompanyForm("edit", String(idEmpresa));
  };

  const handleViewCompany = (item: any) => {
    const idEmpresa = item?.idEmpresa ?? item?.id;
    if (!idEmpresa) {
      Alert.alert("Advertencia", "No se pudo identificar la empresa a consultar.");
      return;
    }

    redirectToCompanyForm("view", String(idEmpresa));
  };

  const handleDeleteCompany = (item: any) => {
    const idEmpresa = item?.idEmpresa ?? item?.id;
    if (!idEmpresa) {
      Alert.alert("Advertencia", "No se pudo identificar la empresa a eliminar.");
      return;
    }

    Alert.alert("Eliminar empresa", `¿Deseas eliminar a ${item?.razonSocial ?? "esta empresa"}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await enterpriseService.deleteEnterprise(String(idEmpresa));
            Alert.alert("Éxito", "Empresa eliminada correctamente.");
            await fetchData();
          } catch (err: any) {
            Alert.alert("Error", err?.message || "No se pudo eliminar la empresa.");
          }
        },
      },
    ]);
  };

  const handleCompanySaved = async () => {
    setScreenView("list");
    setCompanyFormId(undefined);
    await fetchData();
  };

  const handleViewPlan = async (item: any) => {
    try {
      setLoadingSubscription(true);

      const filters: EnterpriseSuscripcion = {
        idEmpresa: item?.idEmpresa ?? item?.id ?? null,
      };
      const { data } = await enterpriseService.GetEmpresaSuscripcionById({ filters });
      setSelectedSubscription(data);
      setModalSubscriptionVisible(true);
    } catch (err: any) {
      Alert.alert(
        "Advertencia",
        err?.message || "No se pudo obtener la información de la suscripción. Se muestran los datos básicos de la empresa."
      );
    } finally {
      setLoadingSubscription(false);
    }
  };

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { width: 50 }]}>N°</Text>
      <Text style={[styles.headerCell, { width: 150 }]}>{columns.ruc}</Text>
      <Text style={[styles.headerCell, { width: 320 }]}>{columns.razonSocial}</Text>
      <Text style={[styles.headerCell, { width: 200 }]}>{columns.usuarioSunat}</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>{columns.pro}</Text>
      <Text style={[styles.headerCell, { width: 150 }]}>{columns.suscripcion}</Text>
      <Text style={[styles.headerCell, { width: 200 }]}>{columns.acciones}</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
  const rowNumber = currentPageStart + index + 1;
  const isPro = item?.pro === true;
  
    return (
      <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
        <Text style={[styles.cellText, { width: 50 }]}>{rowNumber}</Text>
        <Text style={[styles.cellText, { width: 150 }]}>{getFieldValue(item, ["ruc", "RUC"])}</Text>
        <Text style={[styles.cellText, { width: 320 }]} numberOfLines={2}>
          {getFieldValue(item, ["razonSocial", "razonsocial", "RazonSocial", "razon_social"]) }
        </Text>
        <Text style={[styles.cellText, { width: 200 }]} numberOfLines={2}>
          {getFieldValue(item, ["usuarioSunat", "usuario_sunat", "usuario sunat", "UsuarioSunat"]) }
        </Text>
        <View style={[styles.versionCell, { width: 120 }]}>
          <View style={getVersionLabel(item) === "PRO" ? styles.proBadge : styles.freeBadge}>
            <Text style={getVersionLabel(item) === "PRO" ? styles.proBadgeText : styles.freeBadgeText}>
              {getVersionLabel(item)}
            </Text>
          </View>
        </View>
        {/* Corrección: Reemplazado <Text> envolvente por <View> */}
        <View style={[styles.suscripcionCell, { width: 150 ,elevation: 5 }]}> 
          {isPro ? (
            <TouchableOpacity style={styles.viewPlanButton} onPress={() => handleViewPlan(item)}>
              <Text style={styles.viewPlanButtonText}>Ver plan</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.cellText}>
              {getFieldValue(item, ["suscripcion", "suscripción", "subscription"])}
            </Text>
          )}
        </View>
        <View style={[styles.suscripcionCell, { width: 200, elevation: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }]}> 
          <TouchableOpacity onPress={() => handleEditCompany(item)} accessibilityLabel={`Editar empresa ${item?.razonSocial ?? item?.ruc ?? item?.ClaveSunat ?? ""}`}>
            <Icon name="pencil" size={25} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleViewCompany(item)} accessibilityLabel={`Ver detalle de ${item?.razonSocial ?? item?.ruc ?? item?.ClaveSunat ?? ""}`}>
            <Icon name="eye" size={25} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteCompany(item)} accessibilityLabel={`Eliminar empresa ${item?.razonSocial ?? item?.ruc ?? item?.ClaveSunat ?? ""}`}>
            <Icon name="delete" size={25} color="#534241" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (screenView === "form") {
    return (
      <SafeAreaView style={styles.formPageContainer}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setScreenView("list")}>
            <Text style={styles.formHeaderAction}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>
            {companyFormMode === "add" ? "Agregar empresa" : companyFormMode === "edit" ? "Editar empresa" : "Detalle de empresa"}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.formContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <EmpresaForm
            idEmpresa={companyFormId}
            mode={companyFormMode}
            onSaved={handleCompanySaved}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={[
          styles.mainScrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Empresas y Declaraciones</Text>
        </View>

        <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Lista de empresas</Text>
        <TouchableOpacity
          style={styles.addButton}
          accessibilityLabel="Agregar empresa"
          onPress={handleAddCompany}
        >
          <Text style={styles.addButtonText}>+ Agregar empresa</Text>
        </TouchableOpacity>
        </View>

        <View style={styles.paginationBar}>
        <TouchableOpacity
          style={[styles.paginationButton, !canGoPrevious && styles.paginationButtonDisabled]}
          onPress={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          disabled={!canGoPrevious}
        >
          <Text style={[styles.paginationButtonText, !canGoPrevious && styles.paginationButtonTextDisabled]}>
            Anterior
          </Text>
        </TouchableOpacity>

        <Text style={styles.paginationText}>Página {page} de {totalPages}</Text>

        <TouchableOpacity
          style={[styles.paginationButton, !canGoNext && styles.paginationButtonDisabled]}
          onPress={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
          disabled={!canGoNext}
        >
          <Text style={[styles.paginationButtonText, !canGoNext && styles.paginationButtonTextDisabled]}>
            Siguiente
          </Text>
        </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#743484" />
            <Text style={styles.loadingText}>Cargando empresas...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
            <View>
              <FlatList
                data={paginatedData}
                renderItem={renderItem}
                scrollEnabled={false}
                keyExtractor={(item, index) => `${item?.ruc ?? "empresa"}-${index}`}
                 ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No se encontraron empresas para mostrar.</Text>
                  </View>
                }
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </View>
          </ScrollView>
        )}
      </View>
      </ScrollView>

      {/* Modal de Carga de Suscripción */}
      <Modal visible={loadingSubscription} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingModalContainer}>
            <ActivityIndicator size="large" color="#743484" />
            <Text style={styles.loadingText}>Cargando suscripción...</Text>
          </View>
        </View>
      </Modal>
      {/* Modal de Plan de Suscripción */}
      <Modal
        visible={modalSubscriptionVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalSubscriptionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subscriptionModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ width: 28, backgroundColor: "transparent" }} />
              <View style={styles.modalHeaderContent}>
                <Icon name="ticket-confirmation-outline" size={28} color="#552162" style={{ marginRight: 8 }} />
                <Text style={styles.modalHeaderTitle}>Plan de Suscripción</Text>
              </View>
              <TouchableOpacity onPress={() => setModalSubscriptionVisible(false)}>
                <Icon name="close" size={28} color="#888" />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            {/* Cuerpo Central */}
            <View style={styles.modalBody}>
              <View style={styles.companyInfo}>
                <View style={styles.companyIconContainer}>
                  <Icon name="office-building-outline" size={32} color="#552162" />
                </View>
                <View style={styles.companyTextContainer}>
                  <Text style={styles.companyName}>{selectedSubscription?.razonSocial ?? "-"}</Text>
                  <Text style={styles.companyRuc}>RUC: {selectedSubscription?.ruc ?? "-"}</Text>
                </View>
              </View>

              {/* Banner del Plan */}
              <View style={styles.planBanner}>
                <View style={styles.planBannerContent}>
                  <Icon name="flash" size={24} color="#FFD700" style={{ marginRight: 12 }} />
                  <View style={styles.planBannerTextContainer}>
                    <Text style={styles.planType}>PLAN CONTRATADO</Text>
                    <Text style={styles.planName}>{selectedSubscription?.planDescipcion ?? "-"}</Text>
                  </View>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVO</Text>
                </View>
              </View>

              {/* Sección de Fechas */}
              <View style={styles.datesContainer}>
                <View style={styles.dateCard}>
                  <View style={styles.dateCardContent}>
                    <Icon name="calendar-month-outline" size={24} color="#555" />
                    <Text style={styles.dateCardTitle}>INICIO</Text>
                  </View>
                  <Text style={styles.dateCardDate}>
                    {formatDate(selectedSubscription?.fechaIniPro)}
                  </Text>
                </View>
                <View style={styles.dateCard}>
                  <View style={styles.dateCardContent}>
                    <Icon name="clock-alert-outline" size={24} color="#FFA500" />
                    <Text style={styles.dateCardTitle}>VENCE EL</Text>
                  </View>
                  <Text style={styles.dateCardDate}>
                    {formatDate(selectedSubscription?.fechaFinPro)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón de Acción */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#552162", width: "100%", padding: 12, marginVertical: 0 }]}
              onPress={() => setModalSubscriptionVisible(false)}
            >
              <Text style={styles.buttonText}>RENOVAR PLAN</Text>
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
    padding: 20,
    backgroundColor: "#743484",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#602470",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  toolbarTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
  },
  addButton: {
    backgroundColor: "#743484",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  paginationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  versionCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  proBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#743484",
  },
  proBadgeText: {
    color: "#743484",
    fontSize: 12,
    fontWeight: "700",
  },
  freeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#38A169",
  },
  freeBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
    width: 800,
  },
  emptyText: {
    color: "#718096",
    fontSize: 14,
    textAlign: "center",
  },

  //modal suscripcion
   viewPlanButton: {
    backgroundColor: "#743484",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewPlanButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  subscriptionModalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#552162",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 15,
  },
  modalBody: {
    marginBottom: 20,
  },
  companyInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  companyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3E8F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  companyTextContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
  },
  companyRuc: {
    fontSize: 13,
    color: "#718096",
    marginTop: 2,
  },
  planBanner: {
    backgroundColor: "#552162",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  planBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  planBannerTextContainer: {
    flex: 1,
  },
  planType: {
    fontSize: 10,
    color: "#FFD700",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: "#38A169",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dateCard: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
  },
  dateCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dateCardTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#718096",
    marginLeft: 6,
  },
  dateCardDate: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2D3748",
  },
  button: {
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  suscripcionCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  formPageContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#743484",
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  formHeaderAction: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  formHeaderActionDisabled: {
    opacity: 0.6,
  },
  formContent: {
    padding: 20,
    gap: 12,
  },
  loadingModalContainer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
