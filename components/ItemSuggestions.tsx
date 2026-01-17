import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Item } from "../services/inventoryService";

type ItemSuggestionsProps = {
  items: Item[];
  onSelect: (item: Item) => void;
};

export default function ItemSuggestions({ items, onSelect }: ItemSuggestionsProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>可能的品項</Text>
      <View style={styles.list}>
        {items.map((item) => (
          <TouchableOpacity
            key={String(item.id)}
            style={styles.row}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              低水位 {item.min_qty}・{item.location_name ?? "未指定"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1f232b",
    borderRadius: 12,
    backgroundColor: "#171a20",
  },
  title: { fontWeight: "700", marginBottom: 6, color: "#f2f4f8" },
  list: { gap: 8 },
  row: { paddingVertical: 6 },
  name: { fontSize: 14, fontWeight: "700", color: "#f2f4f8" },
  meta: { fontSize: 12, color: "#8b93a1", marginTop: 2 },
});
