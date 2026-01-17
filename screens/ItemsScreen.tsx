import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";

import AddItemBar from "../components/AddItemBar";
import ItemEditor from "../components/ItemEditor";
import ItemList from "../components/ItemList";
import ItemSuggestions from "../components/ItemSuggestions";
import LocationPicker from "../components/LocationPicker";
import {
  addItem,
  changeItemQty,
  deleteItem,
  initDb,
  loadItems,
  loadLocations,
  subscribeInventoryChanges,
  updateItem,
  type Item,
  type Location,
} from "../services/inventoryService";

export default function ItemsScreen() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [minQtyText, setMinQtyText] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMinQtyText, setEditMinQtyText] = useState("");
  const [editLocationId, setEditLocationId] = useState<number | null>(null);

  const totalCount = useMemo(
    () => items.reduce((sum, it) => sum + (it.qty ?? 0), 0),
    [items]
  );
  const suggestions = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return [];
    const lower = trimmed.toLowerCase();
    return items
      .filter((it) => it.name.toLowerCase().includes(lower))
      .slice(0, 6);
  }, [items, name]);

  const refreshItems = useCallback(async () => {
    setItems(await loadItems());
  }, []);

  const refreshLocations = useCallback(async () => {
    setLocations(await loadLocations());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        await refreshItems();
        await refreshLocations();
        setReady(true);
      } catch (e) {
        console.error(e);
        Alert.alert("DB 初始化失敗", String((e as Error)?.message ?? e));
      }
    })();
  }, [refreshItems, refreshLocations]);

  useEffect(() => {
    return subscribeInventoryChanges(() => {
      refreshItems();
      refreshLocations();
    });
  }, [refreshItems, refreshLocations]);

  async function handleAddItem() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsedMinQty = Number(minQtyText);
    const minQty = Number.isFinite(parsedMinQty) && parsedMinQty >= 0 ? parsedMinQty : 0;
    try {
      await addItem(trimmed, selectedLocationId, minQty);
      setName("");
      setMinQtyText("");
      Keyboard.dismiss();
      await refreshItems();
    } catch (e) {
      Alert.alert("新增失敗", String((e as Error)?.message ?? e));
    }
  }

  async function handleChangeQty(id: number, delta: number) {
    try {
      await changeItemQty(id, delta);
      await refreshItems();
    } catch (e) {
      Alert.alert("更新失敗", String((e as Error)?.message ?? e));
    }
  }

  async function handleDeleteItem(id: number) {
    if (Platform.OS === "web") {
      const ok = globalThis.confirm?.("確定要刪除嗎？") ?? true;
      if (!ok) return;
      try {
        await deleteItem(id);
        await refreshItems();
      } catch (e) {
        Alert.alert("刪除失敗", String((e as Error)?.message ?? e));
      }
      return;
    }

    Alert.alert("刪除品項", "確定要刪除嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem(id);
            await refreshItems();
          } catch (e) {
            Alert.alert("刪除失敗", String((e as Error)?.message ?? e));
          }
        },
      },
    ]);
  }

  function handleSelectSuggestion(item: Item) {
    setName(item.name);
    setMinQtyText(String(item.min_qty));
    setSelectedLocationId(item.location_id ?? null);
  }

  function handleEditItem(item: Item) {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditMinQtyText(String(item.min_qty));
    setEditLocationId(item.location_id ?? null);
  }

  async function handleSaveEdit() {
    const trimmed = editName.trim();
    if (!trimmed || editingItemId == null) return;
    const parsedMinQty = Number(editMinQtyText);
    const minQty = Number.isFinite(parsedMinQty) && parsedMinQty >= 0 ? parsedMinQty : 0;
    try {
      await updateItem(editingItemId, trimmed, minQty, editLocationId);
      setEditingItemId(null);
      setEditName("");
      setEditMinQtyText("");
      setEditLocationId(null);
      await refreshItems();
    } catch (e) {
      Alert.alert("更新失敗", String((e as Error)?.message ?? e));
    }
  }

  function handleCancelEdit() {
    setEditingItemId(null);
    setEditName("");
    setEditMinQtyText("");
    setEditLocationId(null);
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>家用庫存</Text>
          <Text style={styles.subTitle}>初始化中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>品項</Text>
        <Text style={styles.subTitle}>
          品項：{items.length}　總數量：{totalCount}
        </Text>

        <AddItemBar
          name={name}
          minQtyText={minQtyText}
          onChangeName={setName}
          onChangeMinQtyText={setMinQtyText}
          onSubmit={handleAddItem}
        />

        <ItemSuggestions items={suggestions} onSelect={handleSelectSuggestion} />

        <LocationPicker
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelect={setSelectedLocationId}
        />

        {editingItemId != null && (
          <ItemEditor
            name={editName}
            minQtyText={editMinQtyText}
            locations={locations}
            selectedLocationId={editLocationId}
            onChangeName={setEditName}
            onChangeMinQtyText={setEditMinQtyText}
            onSelectLocation={setEditLocationId}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        )}

        <ItemList
          items={items}
          onChangeQty={handleChangeQty}
          onDeleteItem={handleDeleteItem}
          onEditItem={handleEditItem}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  content: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 8, color: "#f2f4f8" },
  subTitle: { marginTop: 6, color: "#a1a8b3" },
});
