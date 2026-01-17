import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import type { Item } from "../services/inventoryService";
import ItemRow from "./ItemRow";

type ItemListProps = {
  items: Item[];
  onChangeQty: (id: number, delta: number) => void;
  onDeleteItem: (id: number) => void;
  onEditItem: (item: Item) => void;
};

export default function ItemList({
  items,
  onChangeQty,
  onDeleteItem,
  onEditItem,
}: ItemListProps) {
  return (
    <FlatList
      data={items}
      keyExtractor={(it) => String(it.id)}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            先新增一個品項吧（例如：衛生紙、洗髮精、冷凍水餃）
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <ItemRow
          item={item}
          onChangeQty={onChangeQty}
          onDelete={onDeleteItem}
          onEdit={onEditItem}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 16 },
  empty: { paddingTop: 40 },
  emptyText: { textAlign: "center", color: "#6b7280" },
});
