import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type AddItemBarProps = {
  name: string;
  minQtyText: string;
  onChangeName: (value: string) => void;
  onChangeMinQtyText: (value: string) => void;
  onSubmit: () => void;
};

export default function AddItemBar({
  name,
  minQtyText,
  onChangeName,
  onChangeMinQtyText,
  onSubmit,
}: AddItemBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="輸入品名（例：衛生紙）"
          value={name}
          onChangeText={onChangeName}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
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
        <TouchableOpacity style={styles.addBtn} onPress={onSubmit}>
          <Text style={styles.addBtnText}>新增 / +1</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>低水位為提醒值，數量小於此值會列入快沒了</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 14, marginBottom: 10 },
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
    backgroundColor: "#171a20",
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
    backgroundColor: "#171a20",
  },
  addBtn: {
    backgroundColor: "#2a2f38",
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  addBtnText: { color: "#f2f4f8", fontWeight: "700" },
  hint: { marginTop: 6, fontSize: 12, color: "#6b7280" },
});
