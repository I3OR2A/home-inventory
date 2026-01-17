import React, { useCallback, useEffect, useState } from "react";
import { Alert, Keyboard, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";

import LocationManager from "../components/LocationManager";
import {
  addLocation,
  countItemsByLocation,
  deleteLocation,
  initDb,
  loadLocations,
  subscribeInventoryChanges,
  updateLocation,
  type Location,
} from "../services/inventoryService";

export default function LocationsScreen() {
  const [ready, setReady] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationName, setLocationName] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [editingLocationName, setEditingLocationName] = useState("");

  const refreshLocations = useCallback(async () => {
    setLocations(await loadLocations());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        await refreshLocations();
        setReady(true);
      } catch (e) {
        console.error(e);
        Alert.alert("DB 初始化失敗", String((e as Error)?.message ?? e));
      }
    })();
  }, [refreshLocations]);

  useEffect(() => {
    return subscribeInventoryChanges(() => {
      refreshLocations();
    });
  }, [refreshLocations]);

  async function handleAddLocation() {
    const trimmed = locationName.trim();
    if (!trimmed) return;
    try {
      await addLocation(trimmed);
      setLocationName("");
      Keyboard.dismiss();
      await refreshLocations();
    } catch (e) {
      Alert.alert("新增位置失敗", String((e as Error)?.message ?? e));
    }
  }

  function handleStartEditLocation(location: Location) {
    setEditingLocationId(location.id);
    setEditingLocationName(location.name);
  }

  async function handleSaveLocationEdit() {
    const trimmed = editingLocationName.trim();
    if (!trimmed || editingLocationId == null) return;
    try {
      await updateLocation(editingLocationId, trimmed);
      setEditingLocationId(null);
      setEditingLocationName("");
      await refreshLocations();
    } catch (e) {
      Alert.alert("更新位置失敗", String((e as Error)?.message ?? e));
    }
  }

  function handleCancelLocationEdit() {
    setEditingLocationId(null);
    setEditingLocationName("");
  }

  async function handleDeleteLocation(id: number) {
    const count = await countItemsByLocation(id);
    if (count > 0) {
      if (Platform.OS === "web") {
        globalThis.alert?.("仍有品項使用此位置");
      } else {
        Alert.alert("無法刪除", "仍有品項使用此位置");
      }
      return;
    }

    if (Platform.OS === "web") {
      const ok = globalThis.confirm?.("確定要刪除位置嗎？") ?? true;
      if (!ok) return;
      try {
        await deleteLocation(id);
        await refreshLocations();
      } catch (e) {
        Alert.alert("刪除位置失敗", String((e as Error)?.message ?? e));
      }
      return;
    }

    Alert.alert("刪除位置", "確定要刪除嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLocation(id);
            await refreshLocations();
          } catch (e) {
            Alert.alert("刪除位置失敗", String((e as Error)?.message ?? e));
          }
        },
      },
    ]);
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>位置</Text>
          <Text style={styles.subTitle}>初始化中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>位置</Text>
        <Text style={styles.subTitle}>管理與維護位置資訊</Text>

        <LocationManager
          locations={locations}
          locationName={locationName}
          onChangeLocationName={setLocationName}
          onAddLocation={handleAddLocation}
          editingLocationId={editingLocationId}
          editingLocationName={editingLocationName}
          onChangeEditingLocationName={setEditingLocationName}
          onSaveEdit={handleSaveLocationEdit}
          onCancelEdit={handleCancelLocationEdit}
          onStartEdit={handleStartEditLocation}
          onDeleteLocation={handleDeleteLocation}
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
