import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl, } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import servicioReportes from "../../servicios/reportes/reportes";

// Interfaz TypeScript basada en la respuesta exacta de tu endpoint
interface ReporteConsolidadoData {
  totalEmpresas: number;
  cantidadEmpresasConComprobantes: number;
  totalComprobantesRecuperados: number;
  comprobantesDisponiblesTotales: {
    totalPdfDisponibles: number;
    totalXmlDisponibles: number;
    totalPdfDescargados: number;
    totalXmlDescargados: number;
  };
  promedioDisponibilidad: {
    promedioPorcentajePdf: string;
    promedioPorcentajeXml: string;
  };
  comprobantesMesCurso: {
    totalPdfDisponibles: number;
    totalXmlDisponibles: number;
    totalPdfDescargados: number;
    totalXmlDescargados: number;
  };
  comprobantesMesAnterior: {
    totalPdfDisponibles: number;
    totalXmlDisponibles: number;
    totalPdfDescargados: number;
    totalXmlDescargados: number;
  };
  totalLoginsDiaAnterior: number;
  totalDescargasMasivasPdfSinError: number;
  totalDescargasMasivasXmlSinError: number;
  empresasSinComprobantesMesCurso: number;
  totalClientesDescargasMesCurso: number;
  totalClientesDescargasMesAnterior: number;
  totalEmpresasDescargasMesCurso: number;
  totalEmpresasDescargasMesAnteriorDI: number;
  totalEmpresasEliminadas: number;
  totalClientesSinEmpresa: number;
  totalEmpresasRecreadas: number;
  totalEmpresasSinArchivos: number;
  totalComprobantesFaltantes: number;
  totalEmpresasRenovarToken: number;
  totalUsuariosLogueadosMasDeUnMes: number;
  totalUsuariosLogueadosAlgunMes: number;
  totalDescargasExcel: number;
  clientesConEmpresa: number;
  totalEmpresasSinSecretApiSire: number;
  totalUsuariosLogueadosTodosLosMeses: number;
  usuariosMesActual: number;
  totalClientesConversionPro: number;
  totalEmpresasConversionPro: number;
  totalEmpresasPro: number;
  totalEmpresasFreeCeroCreditos: number;
}

export default function ReporteConsolidado() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ReporteConsolidadoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await servicioReportes.getReportes();
      const responseData = response?.data ?? response;
      if (responseData) {
        setData(responseData);
      } else {
        setError("No se recibieron datos válidos.");
      }
    } catch (err: any) {
      console.error("Error al obtener reporte consolidado:", err);
      setError("Error al obtener los datos del reporte.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const parsePercentage = (pctStr?: string) => {
    if (!pctStr) return 0;
    return parseFloat(pctStr.replace("%", "")) || 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera Principal */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reporte Consolidado</Text>
        <Text style={styles.headerSubtitle}>
          Resumen general de métricas y rendimiento del sistema
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#743484" />
          <Text style={styles.loadingText}>Cargando consolidado...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : data ? (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[
            styles.scrollContentContainer,
            { paddingBottom: Math.max(insets.bottom, 30) },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#743484"]} />
          }
        >
          {/* 1. KPIs Principales (Empresas y Comprobantes) */}
          <Text style={styles.sectionTitle}>Métricas Principales</Text>
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { borderLeftColor: "#743484" }]}>
              <Text style={styles.kpiValue}>{data.totalEmpresas}</Text>
              <Text style={styles.kpiLabel}>Total Empresas</Text>
              <Text style={styles.kpiSubText}>
                {data.cantidadEmpresasConComprobantes} con comprobantes
              </Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: "#2B6CB0" }]}>
              <Text style={styles.kpiValue}>
                {data.totalComprobantesRecuperados?.toLocaleString()}
              </Text>
              <Text style={styles.kpiLabel}>Comprobantes Recuperados</Text>
              <Text style={styles.kpiSubText}>
                {data.totalComprobantesFaltantes?.toLocaleString()} faltantes
              </Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: "#38A169" }]}>
              <Text style={styles.kpiValue}>{data.totalEmpresasPro}</Text>
              <Text style={styles.kpiLabel}>Empresas PRO</Text>
              <Text style={styles.kpiSubText}>
                {data.clientesConEmpresa} clientes con empresa
              </Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: "#D69E2E" }]}>
              <Text style={styles.kpiValue}>{data.totalDescargasExcel}</Text>
              <Text style={styles.kpiLabel}>Descargas Excel</Text>
              <Text style={styles.kpiSubText}>Generadas globalmente</Text>
            </View>
          </View>

          {/* 2. Métricas de Disponibilidad de Archivos */}
          <Text style={styles.sectionTitle}>Disponibilidad de Archivos (Total)</Text>
          <View style={styles.card}>
            {/* Disponibilidad PDF */}
            <View style={styles.progressRow}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Disponibilidad PDF</Text>
                <Text style={styles.progressPercent}>
                  {data.promedioDisponibilidad?.promedioPorcentajePdf}
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${parsePercentage(data.promedioDisponibilidad?.promedioPorcentajePdf)}%`,
                      backgroundColor: "#743484",
                    },
                  ]}
                />
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  Disponibles: {data.comprobantesDisponiblesTotales?.totalPdfDisponibles?.toLocaleString()}
                </Text>
                <Text style={styles.detailText}>
                  Descargados: {data.comprobantesDisponiblesTotales?.totalPdfDescargados?.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Disponibilidad XML */}
            <View style={styles.progressRow}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Disponibilidad XML</Text>
                <Text style={styles.progressPercent}>
                  {data.promedioDisponibilidad?.promedioPorcentajeXml}
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${parsePercentage(data.promedioDisponibilidad?.promedioPorcentajeXml)}%`,
                      backgroundColor: "#3182CE",
                    },
                  ]}
                />
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  Disponibles: {data.comprobantesDisponiblesTotales?.totalXmlDisponibles?.toLocaleString()}
                </Text>
                <Text style={styles.detailText}>
                  Descargados: {data.comprobantesDisponiblesTotales?.totalXmlDescargados?.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Comparativa Mes Anterior vs. Mes en Curso */}
          <Text style={styles.sectionTitle}>Comprobantes por Periodo</Text>
          <View style={styles.kpiGrid}>
            {/* Mes Anterior */}
            <View style={styles.cardHalf}>
              <Text style={styles.cardSubtitle}>Mes Anterior</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PDF Disponibles:</Text>
                <Text style={styles.infoValue}>
                  {data.comprobantesMesAnterior?.totalPdfDisponibles}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>XML Disponibles:</Text>
                <Text style={styles.infoValue}>
                  {data.comprobantesMesAnterior?.totalXmlDisponibles}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PDF Descargados:</Text>
                <Text style={styles.infoValue}>
                  {data.comprobantesMesAnterior?.totalPdfDescargados}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>XML Descargados:</Text>
                <Text style={styles.infoValue}>
                  {data.comprobantesMesAnterior?.totalXmlDescargados}
                </Text>
              </View>
            </View>

            {/* Mes Curso */}
            <View style={styles.cardHalf}>
              <Text style={styles.cardSubtitle}>Mes en Curso</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PDF Disponibles:</Text>
                <Text style={styles.infoValue}>
                  {data.comprobantesMesCurso?.totalPdfDisponibles}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>XML Disponibles:</Text>
                <Text style={styles.infoValue}>
                  {data.comprobantesMesCurso?.totalXmlDisponibles}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PDF Descargados:</Text>
                <Text style={styles.infoValue}>
                  {data.comprobantesMesCurso?.totalPdfDescargados}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>XML Descargados:</Text>
                <Text style={styles.infoValue}>
                  {data.comprobantesMesCurso?.totalXmlDescargados}
                </Text>
              </View>
            </View>
          </View>

          {/* 4. Descargas y Operaciones por Clientes / Empresas */}
          <Text style={styles.sectionTitle}>Descargas y Operaciones por Periodo</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Clientes descargas (Mes curso):</Text>
              <Text style={styles.infoValue}>{data.totalClientesDescargasMesCurso}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Clientes descargas (Mes anterior):</Text>
              <Text style={styles.infoValue}>{data.totalClientesDescargasMesAnterior}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresas descargas (Mes curso):</Text>
              <Text style={styles.infoValue}>{data.totalEmpresasDescargasMesCurso}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresas descargas (Mes anterior):</Text>
              <Text style={styles.infoValue}>{data.totalEmpresasDescargasMesAnteriorDI}</Text>
            </View>
          </View>

          {/* 5. Conversión PRO */}
          <Text style={styles.sectionTitle}>Conversión PRO</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Clientes conversión PRO:</Text>
              <Text style={styles.infoValue}>{data.totalClientesConversionPro}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresas conversión PRO:</Text>
              <Text style={styles.infoValue}>{data.totalEmpresasConversionPro}</Text>
            </View>
          </View>

          {/* 6. Diagnóstico de Estado y Alertas */}
          <Text style={styles.sectionTitle}>Diagnóstico y Alerta de Empresas</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresas que deben renovar token:</Text>
              <Text style={[styles.infoValue, { color: "#DD6B20", fontWeight: "bold" }]}>
                {data.totalEmpresasRenovarToken}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresas sin comprobantes (Mes curso):</Text>
              <Text style={styles.infoValue}>{data.empresasSinComprobantesMesCurso}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresas sin archivos adjuntos:</Text>
              <Text style={styles.infoValue}>{data.totalEmpresasSinArchivos}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Clientes sin empresa asignada:</Text>
              <Text style={styles.infoValue}>{data.totalClientesSinEmpresa}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresas sin Secret API SIRE:</Text>
              <Text style={styles.infoValue}>{data.totalEmpresasSinSecretApiSire}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresas eliminadas / recreadas:</Text>
              <Text style={styles.infoValue}>
                {data.totalEmpresasEliminadas} / {data.totalEmpresasRecreadas}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Número de empresas FREE con 0 créditos:</Text>
              <Text style={styles.infoValue}>{data.totalEmpresasFreeCeroCreditos}</Text>
            </View>
          </View>

          {/* 7. Actividad de Usuarios y Procesos */}
          <Text style={styles.sectionTitle}>Actividad de Usuarios y Procesos</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usuarios distintos logueados día anterior:</Text>
              <Text style={styles.infoValue}>{data.totalLoginsDiaAnterior}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usuarios distintos logueados mes actual:</Text>
              <Text style={styles.infoValue}>{data.usuariosMesActual}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usuarios logeados &gt; 1 mes (excl. registros del mes):</Text>
              <Text style={styles.infoValue}>{data.totalUsuariosLogueadosMasDeUnMes}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usuarios recurrentes (algunos meses):</Text>
              <Text style={styles.infoValue}>{data.totalUsuariosLogueadosAlgunMes}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usuarios logueados todos los meses:</Text>
              <Text style={styles.infoValue}>{data.totalUsuariosLogueadosTodosLosMeses}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Descargas masivas exitosas (PDF / XML):</Text>
              <Text style={styles.infoValue}>
                {data.totalDescargasMasivasPdfSinError} / {data.totalDescargasMasivasXmlSinError}
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  header: {
    padding: 20,
    backgroundColor: "#743484",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#E9D8FD",
    marginTop: 4,
  },
  scrollContent: {
    padding: 15,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
    marginTop: 15,
    marginBottom: 10,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A202C",
  },
  kpiLabel: {
    fontSize: 12,
    color: "#4A5568",
    fontWeight: "600",
    marginTop: 2,
  },
  kpiSubText: {
    fontSize: 11,
    color: "#A0AEC0",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHalf: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#743484",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    paddingBottom: 4,
  },
  progressRow: {
    marginVertical: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3748",
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2D3748",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  detailText: {
    fontSize: 11,
    color: "#718096",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDF2F7",
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  infoLabel: {
    fontSize: 12,
    color: "#4A5568",
    flex: 1,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2D3748",
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
});