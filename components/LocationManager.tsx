import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { Location } from "../services/inventoryService";

type LocationManagerProps = {
  locations: Location[];
  locationName: string;
  onChangeLocationName: (value: string) => void;
  onAddLocation: () => void;
  editingLocationId: number | null;
  editingLocationName: string;
  onChangeEditingLocationName: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (location: Location) => void;
  onDeleteLocation: (id: number) => void;
};

export default function LocationManager({
  locations,
  locationName,
  onChangeLocationName,
  onAddLocation,
  editingLocationId,
  editingLocationName,
  onChangeEditingLocationName,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDeleteLocation,
}: LocationManagerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>位置管理</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="新增位置（例：客廳櫃）"
          value={locationName}
          onChangeText={onChangeLocationName}
          returnKeyType="done"
          onSubmitEditing={onAddLocation}
          placeholderTextColor="#6b7280"
        />
        <TouchableOpacity style={styles.addBtn} onPress={onAddLocation}>
          <Text style={styles.addBtnText}>新增位置</Text>
        </TouchableOpacity>
      </View>

      {editingLocationId != null && (
        <View style={styles.editRow}>
          <TextInput
            style={styles.input}
            placeholder="編輯位置名稱"
            value={editingLocationName}
            onChangeText={onChangeEditingLocationName}
            returnKeyType="done"
            onSubmitEditing={onSaveEdit}
            placeholderTextColor="#6b7280"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={onSaveEdit}>
            <Text style={styles.saveBtnText}>保存</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancelEdit}>
            <Text style={styles.cancelBtnText}>取消</Text>
          </TouchableOpacity>
        </View>
      )}

      {locations.length === 0 ? (
        <Text style={styles.emptyHint}>尚未建立位置</Text>
      ) : (
        <View style={styles.list}>
          {locations.map((loc) => (
            <View key={String(loc.id)} style={styles.listRow}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => onStartEdit(loc)}
                >
                  <Text style={styles.editBtnText}>編輯</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onDeleteLocation(loc.id)}
                >
                  <Text style={styles.deleteBtnText}>刪除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 14,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#1f232b",
  },
  label: { marginTop: 8, fontWeight: "700", color: "#f2f4f8" },
  row: { flexDirection: "row", gap: 10, marginTop: 14, marginBottom: 10 },
  editRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2a2f38",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#f2f4f8",
    backgroundColor: "#171a20",
  },
  addBtn: {
    backgroundColor: "#2a2f38",
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  addBtnText: { color: "#f2f4f8", fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#1f3d2b",
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  saveBtnText: { color: "#cfe9d4", fontWeight: "700" },
  cancelBtn: {
    backgroundColor: "#2a2f38",
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  cancelBtnText: { color: "#d0d6df", fontWeight: "700" },
  emptyHint: { color: "#6b7280", marginBottom: 8 },
  list: { gap: 8, marginBottom: 8 },
  listRow: {
    borderWidth: 1,
    borderColor: "#1f232b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#171a20",
  },
  locationName: { fontWeight: "700", color: "#f2f4f8" },
  actions: { flexDirection: "row", gap: 8 },
  editBtn: {
    borderWidth: 1,
    borderColor: "#2a2f38",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editBtnText: { fontSize: 12, fontWeight: "700", color: "#d0d6df" },
  deleteBtn: {
    borderWidth: 1,
    borderColor: "#5a2d2d",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  deleteBtnText: { fontSize: 12, fontWeight: "700", color: "#e07a7a" },
});
