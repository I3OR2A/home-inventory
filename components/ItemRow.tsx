import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Item } from "../services/inventoryService";
import { formatTaipeiTime } from "../utils/format";

type ItemRowProps = {
  item: Item;
  onChangeQty: (id: number, delta: number) => void;
  onDelete: (id: number) => void;
  onEdit: (item: Item) => void;
};

export default function ItemRow({
  item,
  onChangeQty,
  onDelete,
  onEdit,
}: ItemRowProps) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.meta}>
          更新：{formatTaipeiTime(item.updated_at)}
        </Text>
        <Text style={styles.meta}>位置：{item.location_name ?? "未指定"}</Text>
        <Text style={styles.meta}>低水位：{item.min_qty}</Text>
      </View>

      <View style={styles.qtyBox}>
        <TouchableOpacity
          style={[styles.circleBtn, styles.minus]}
          onPress={() => onChangeQty(item.id, -1)}
        >
          <Text style={styles.circleText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.qtyText}>{item.qty}</Text>

        <TouchableOpacity
          style={[styles.circleBtn, styles.plus]}
          onPress={() => onChangeQty(item.id, 1)}
        >
          <Text style={styles.circleText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
          <Text style={styles.editText}>編</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.delBtn} onPress={() => onDelete(item.id)}>
          <Text style={styles.delText}>刪</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f232b",
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    gap: 10,
    backgroundColor: "#171a20",
  },
  info: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: "700", color: "#f2f4f8" },
  meta: { marginTop: 4, fontSize: 12, color: "#8b93a1" },
  qtyBox: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyText: { fontSize: 18, minWidth: 28, textAlign: "center", color: "#f2f4f8" },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  plus: { borderColor: "#3a3f4a" },
  minus: { borderColor: "#2a2f38" },
  circleText: { fontSize: 18, fontWeight: "800", color: "#f2f4f8" },
  actions: { gap: 6 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2f38",
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { fontSize: 14, color: "#d0d6df" },
  delBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  delText: { fontSize: 14, color: "#e07a7a" },
});
