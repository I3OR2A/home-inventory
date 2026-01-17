import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Location } from "../services/inventoryService";

type LocationPickerProps = {
  locations: Location[];
  selectedLocationId: number | null;
  onSelect: (id: number | null) => void;
};

export default function LocationPicker({
  locations,
  selectedLocationId,
  onSelect,
}: LocationPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>位置</Text>
      <View style={styles.chips}>
        <TouchableOpacity
          style={[
            styles.chip,
            selectedLocationId == null && styles.chipActive,
          ]}
          onPress={() => onSelect(null)}
        >
          <Text
            style={[
              styles.chipText,
              selectedLocationId == null && styles.chipTextActive,
            ]}
          >
            未指定
          </Text>
        </TouchableOpacity>
        {locations.map((loc) => (
          <TouchableOpacity
            key={String(loc.id)}
            style={[
              styles.chip,
              selectedLocationId === loc.id && styles.chipActive,
            ]}
            onPress={() => onSelect(loc.id)}
          >
            <Text
              style={[
                styles.chipText,
                selectedLocationId === loc.id && styles.chipTextActive,
              ]}
            >
              {loc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 6 },
  label: { marginTop: 8, fontWeight: "700", color: "#f2f4f8" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#2a2f38",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipActive: { borderColor: "#3a3f4a", backgroundColor: "#2a2f38" },
  chipText: { fontSize: 12, color: "#a1a8b3" },
  chipTextActive: { color: "#f2f4f8", fontWeight: "700" },
});
