import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator,  Modal,  Pressable,  ScrollView,  StyleSheet,  Text,  TouchableOpacity,  View,  useWindowDimensions,} from "react-native";
import type { EnterprisePicker } from "../models/enterprise";

interface EmpresaDropdownProps {
  enterprises: EnterprisePicker[];
  selectedEnterpriseId: string;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (enterprise: EnterprisePicker) => void;
}

const getEnterpriseLabel = (enterprise: EnterprisePicker) =>
  enterprise.ruc
    ? `${enterprise.razonSocial} — ${enterprise.ruc}`
    : enterprise.razonSocial;

const EmpresaDropdown = ({
  enterprises,
  selectedEnterpriseId,
  isLoading,
  error,
  isOpen,
  onToggle,
  onSelect,
}: EmpresaDropdownProps) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const menuWidth = Math.min(320, screenWidth - 32);
  const triggerRef = useRef<View>(null);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0, height: 0 });
  const selectedEnterprise = enterprises.find(
    (enterprise) => enterprise.idEmpresa === selectedEnterpriseId,
  );

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current?.measureInWindow((x, y, _width, height) => {
      setTriggerPosition({ x, y, height });
    });
  }, [isOpen]);

  const menuLeft = Math.max(
    16,
    Math.min(triggerPosition.x, screenWidth - menuWidth - 16),
  );
  const availableHeightBelow =
    screenHeight - triggerPosition.y - triggerPosition.height - 24;
  const showMenuBelow = availableHeightBelow >= 160;
  const menuMaxHeight = Math.min(
    320,
    showMenuBelow
      ? availableHeightBelow
      : Math.max(120, triggerPosition.y - 24),
  );
  const menuTop = showMenuBelow
    ? triggerPosition.y + triggerPosition.height + 6
    : Math.max(16, triggerPosition.y - menuMaxHeight - 6);

  return (
    <View ref={triggerRef} style={styles.container}>
      <TouchableOpacity  style={styles.trigger}   onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel="Seleccionar empresa"
        accessibilityState={{ expanded: isOpen }}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedEnterprise && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedEnterprise ? getEnterpriseLabel(selectedEnterprise) : "Seleccionar empresa"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={onToggle}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityLabel="Cerrar selector de empresas"
          />
          <View
            style={[
              styles.menu,
              {
                width: menuWidth,
                maxHeight: menuMaxHeight,
                left: menuLeft,
                top: menuTop,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator style={styles.statusMessage} size="small" color="#743484" />
            ) : error ? (
              <Text style={styles.statusMessage}>{error}</Text>
            ) : enterprises.length === 0 ? (
              <Text style={styles.statusMessage}>No hay empresas disponibles.</Text>
            ) : (
              <ScrollView
                style={styles.optionsList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {enterprises.map((enterprise) => {
                  const isSelected = enterprise.idEmpresa === selectedEnterpriseId;

                  return (
                    <TouchableOpacity
                      key={enterprise.idEmpresa}
                      style={[
                        styles.option,
                        isSelected && styles.selectedOption,
                      ]}
                      onPress={() => onSelect(enterprise)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={styles.enterpriseName} numberOfLines={2}>
                        {enterprise.razonSocial || "Empresa"}
                      </Text>
                      <View style={styles.detailsRow}>
                        <Text style={styles.enterpriseRuc}>
                          {enterprise.ruc || "Sin RUC"}
                        </Text>
                        <Text
                          style={[
                            styles.planBadge,
                            enterprise.pro ? styles.proBadge : styles.freeBadge,
                          ]}
                        >
                          {enterprise.pro ? "PRO" : "FREE"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 100,
  },
  trigger: {
    height: 40,
    justifyContent: "center",
    //borderColor: "#CBD5E0",
    //borderWidth: 1,
    //borderRadius: 6,
    paddingHorizontal: 10,
    //backgroundColor: "#F7FAFC",
  },
  triggerText: {
    color: "#45135c",
    fontSize: 13,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  modalContainer: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    zIndex: 100,
    elevation: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    overflow: "hidden",
  },
  optionsList: {
    maxHeight: 320,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  selectedOption: {
    backgroundColor: "#E5E7EB",
  },
  enterpriseName: {
    color: "#3F0E40",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "left",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  enterpriseRuc: {
    flexShrink: 1,
    marginRight: 8,
    color: "#868686",
    fontSize: 12,
  },
  planBadge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  proBadge: {
    backgroundColor: "#7E22CE",
  },
  freeBadge: {
    backgroundColor: "#16A34A",
  },
  statusMessage: {
    padding: 14,
    color: "#4A5568",
    fontSize: 13,
  },
});

export default EmpresaDropdown;
