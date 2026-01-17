import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import {
  changeItemQty,
  getReminderTimes,
  initDb,
  loadItems,
  loadLocations,
  subscribeInventoryChanges,
  type Item,
  type Location,
} from "../services/inventoryService";
import { parseSqliteDatetime } from "../utils/format";
import { configureNotifications, scheduleDailyReminders } from "../services/notificationsService";

export default function HomeScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const lowItems = useMemo(
    () => items.filter((it) => it.min_qty > 0 && it.qty < it.min_qty),
    [items]
  );
  const recentItems = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime());
    weekAgo.setDate(now.getDate() - 7);
    return items
      .map((item) => ({ item, date: parseSqliteDatetime(item.created_at) }))
      .filter(
        (entry): entry is { item: Item; date: Date } =>
          Boolean(entry.date) && entry.date >= weekAgo
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((entry) => entry.item);
  }, [items]);

  const refresh = useCallback(async () => {
    setItems(await loadItems());
    setLocations(await loadLocations());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        await configureNotifications();
        const reminderTimes = await getReminderTimes();
        await scheduleDailyReminders(reminderTimes, "記得檢查「⚠️快沒了」清單");
        await refresh();
        setReady(true);
      } catch (e) {
        console.error(e);
        Alert.alert("DB 初始化失敗", String((e as Error)?.message ?? e));
      }
    })();
  }, []);

  useEffect(() => {
    return subscribeInventoryChanges(() => {
      refresh();
    });
  }, [refresh]);

  async function handleChangeQty(id: number, delta: number) {
    try {
      await changeItemQty(id, delta);
      await refresh();
    } catch (e) {
      Alert.alert("更新失敗", String((e as Error)?.message ?? e));
    }
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>庫存</Text>
          <Text style={styles.subTitle}>初始化中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>首頁</Text>
          <Text style={styles.subTitle}>快速檢視與提醒</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>總覽</Text>
          <View style={styles.statRow}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/(tabs)/items")}
            >
              <Text style={styles.statNumber}>{items.length}</Text>
              <Text style={styles.statLabel}>目前品項</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/(tabs)/low-stock")}
            >
              <Text style={styles.statNumber}>{lowItems.length}</Text>
              <Text style={styles.statLabel}>需要購買</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>區域</Text>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => router.push("/(tabs)/locations")}
            >
              <Text style={styles.linkText}>全部</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipRow}>
            {locations.length === 0 ? (
              <Text style={styles.emptyText}>尚未建立位置</Text>
            ) : (
              locations.slice(0, 3).map((loc) => (
                <View key={String(loc.id)} style={styles.chip}>
                  <Text style={styles.chipText}>{loc.name}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近一週新增</Text>
          {recentItems.length === 0 ? (
            <Text style={styles.emptyText}>最近一週沒有新增品項</Text>
          ) : (
            <View style={styles.list}>
              {recentItems.map((item) => (
                <View key={String(item.id)} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.location_name ?? "未指定"}
                    </Text>
                  </View>
                  <View style={styles.qtyBox}>
                    <TouchableOpacity
                      style={[styles.circleBtn, styles.minus]}
                      onPress={() => handleChangeQty(item.id, -1)}
                    >
                      <Text style={styles.circleText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity
                      style={[styles.circleBtn, styles.plus]}
                      onPress={() => handleChangeQty(item.id, 1)}
                    >
                      <Text style={styles.circleText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  content: { flex: 1, paddingHorizontal: 20 },
  header: {},
  title: { fontSize: 22, fontWeight: "700", color: "#f2f4f8", marginTop: 8 },
  subTitle: { marginTop: 6, color: "#a1a8b3" },
  section: { marginTop: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#f2f4f8" },
  statRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#171a20",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f232b",
  },
  statNumber: { fontSize: 26, fontWeight: "700", color: "#f2f4f8" },
  statLabel: { marginTop: 6, color: "#a1a8b3" },
  linkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2a2f38",
  },
  linkText: { color: "#a1a8b3", fontSize: 12 },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2a2f38",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: "#d7dbe2", fontSize: 12 },
  emptyText: { color: "#717989", fontSize: 12, marginTop: 8 },
  list: { marginTop: 10, gap: 10 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171a20",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f232b",
    padding: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { color: "#f2f4f8", fontWeight: "700" },
  itemMeta: { color: "#a1a8b3", fontSize: 12, marginTop: 4 },
  qtyBox: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyText: { color: "#f2f4f8", minWidth: 24, textAlign: "center" },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  plus: { borderColor: "#3a3f4a" },
  minus: { borderColor: "#2a2f38" },
  circleText: { color: "#f2f4f8", fontWeight: "700" },
});
