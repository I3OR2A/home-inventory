import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { Location } from "../services/inventoryService";

type ItemEditorProps = {
  name: string;
  minQtyText: string;
  locations: Location[];
  selectedLocationId: number | null;
  onChangeName: (value: string) => void;
  onChangeMinQtyText: (value: string) => void;
  onSelectLocation: (id: number | null) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function ItemEditor({
  name,
  minQtyText,
  locations,
  selectedLocationId,
  onChangeName,
  onChangeMinQtyText,
  onSelectLocation,
  onSave,
  onCancel,
}: ItemEditorProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>編輯品項</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="品項名稱"
          value={name}
          onChangeText={onChangeName}
          returnKeyType="done"
          placeholderTextColor="#6b7280"
        />
        <TextInput
          style={styles.minInput}
          placeholder="低水位"
          value={minQtyText}
          onChangeText={onChangeMinQtyText}
          keyboardType="number-pad"
          returnKeyType="done"
          placeholderTextColor="#6b7280"
        />
      </View>

      <View style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, selectedLocationId == null && styles.chipActive]}
          onPress={() => onSelectLocation(null)}
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
            onPress={() => onSelectLocation(loc.id)}
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

      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1f232b",
    borderRadius: 14,
    backgroundColor: "#171a20",
  },
  title: { fontWeight: "700", color: "#f2f4f8", marginBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2a2f38",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#f2f4f8",
    backgroundColor: "#12151b",
  },
  minInput: {
    width: 80,
    borderWidth: 1,
    borderColor: "#2a2f38",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#f2f4f8",
    backgroundColor: "#12151b",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
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
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: "#1f3d2b",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveText: { color: "#cfe9d4", fontWeight: "700" },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#2a2f38",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: { color: "#d0d6df", fontWeight: "700" },
});
