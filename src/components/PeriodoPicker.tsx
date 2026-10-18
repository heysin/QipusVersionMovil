import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sept", "oct", "nov", "dic",
];

type PeriodoPickerProps = {
  value: string;
  onChange: (period: string) => void;
  onOpen?: () => void;
  style?: StyleProp<ViewStyle>;
};

const parsePeriod = (value: string) => {
  const match = /^(\d{4})(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year, month } : null;
};

export default function PeriodoPicker({
  value,
  onChange,
  onOpen,
  style,
}: PeriodoPickerProps) {
  const selectedPeriod = parsePeriod(value);
  const [visible, setVisible] = useState(false);
  const [year, setYear] = useState(
    () => selectedPeriod?.year ?? new Date().getFullYear(),
  );

  const openPicker = () => {
    onOpen?.();
    setYear(selectedPeriod?.year ?? new Date().getFullYear());
    setVisible(true);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.inputButton}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel="Seleccionar periodo"
      >
        <TextInput
          style={styles.input}
          value={
            selectedPeriod
              ? `${MONTHS[selectedPeriod.month - 1]}-${selectedPeriod.year}`
              : ""
          }
          editable={false}
          pointerEvents="none"
          placeholder="mes-AAAA"
        />
        <Icon name="calendar-month-outline" size={22} color="#743484" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona un periodo</Text>
            <View style={styles.yearSelector}>
              <TouchableOpacity
                onPress={() => setYear((currentYear) => currentYear - 1)}
                accessibilityRole="button"
                accessibilityLabel="Año anterior"
                style={styles.yearButton}
              >
                <Icon name="chevron-left" size={24} color="#743484" />
              </TouchableOpacity>
              <Text style={styles.yearText}>{year}</Text>
              <TouchableOpacity
                onPress={() => setYear((currentYear) => currentYear + 1)}
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
                    onChange(`${year}${String(index + 1).padStart(2, "0")}`);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.monthButtonText}>{month}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    borderColor: "#CBD5E0",
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: "#F7FAFC",
  },
  inputButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    padding: 0,
    color: "#2D3748",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
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
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#718096",
    fontWeight: "600",
  },
});
