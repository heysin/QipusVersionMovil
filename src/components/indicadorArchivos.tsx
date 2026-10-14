import React from "react";
import { StyleSheet, View, Text, ColorValue } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface IndicatorProps {
  textIndicator: string;
  colorIndicator?: ColorValue;
}

export default function Indicator({ textIndicator, colorIndicator = "#000000" }: IndicatorProps) {
  return (
    <View style={styles.container}>
      <Icon name="download" size={16} color={colorIndicator} />
      <Text style={[styles.textIndicator, { color: colorIndicator }]}>
        {textIndicator}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 12, // Separación horizontal entre leyendas
    marginBottom: 6,
  },
  textIndicator: {
    fontSize: 12,
    fontWeight: "500",
  },
});