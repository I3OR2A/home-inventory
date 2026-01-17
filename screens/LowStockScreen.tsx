import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import {
  changeItemQty,
  getReminderTimes,
  initDb,
  loadItems,
  loadLocations,
  setReminderTimes,
  subscribeInventoryChanges,
  type Item,
  type Location,
} from "../services/inventoryService";
import {
  configureNotifications,
  scheduleDailyReminders,
  sendLowStockNow,
} from "../services/notificationsService";

type SortKey = "deficit" | "name" | "location";
type LocationFilter = "all" | "none" | number;
type StockFilter = "all" | "zero";

export default function LowStockScreen() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("deficit");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [reminderTimes, setReminderTimesState] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [iosPickerTime, setIosPickerTime] = useState(new Date());

  const lowItems = useMemo(
    () => items.filter((it) => it.min_qty > 0 && it.qty < it.min_qty),
    [items]
  );
  const filteredItems = useMemo(() => {
    let filtered = lowItems;
    if (stockFilter === "zero") {
      filtered = filtered.filter((item) => item.qty === 0);
    }
    if (locationFilter === "none") {
      filtered = filtered.filter((item) => item.location_id == null);
    } else if (typeof locationFilter === "number") {
      filtered = filtered.filter((item) => item.location_id === locationFilter);
    }
    const sorted = [...filtered];
    if (sortKey === "deficit") {
      sorted.sort((a, b) => {
        const da = a.min_qty - a.qty;
        const db = b.min_qty - b.qty;
        if (db !== da) return db - da;
        return a.name.localeCompare(b.name);
      });
    } else if (sortKey === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => {
        const la = a.location_name ?? "";
        const lb = b.location_name ?? "";
        if (la !== lb) return la.localeCompare(lb);
        return a.name.localeCompare(b.name);
      });
    }
    return sorted;
  }, [lowItems, locationFilter, stockFilter, sortKey]);


  const refresh = useCallback(async () => {
    setItems(await loadItems());
    setLocations(await loadLocations());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        await configureNotifications();
        const times = await getReminderTimes();
        setReminderTimesState(times);
        await refresh();
        setReady(true);
      } catch (e) {
        console.error(e);
        Alert.alert("DB 初始化失敗", String((e as Error)?.message ?? e));
      }
    })();
  }, []);

  async function persistReminderTimes(nextTimes: string[]) {
    const unique = Array.from(new Set(nextTimes)).sort();
    setReminderTimesState(unique);
    await setReminderTimes(unique);
    await scheduleDailyReminders(unique, "記得檢查「⚠️快沒了」清單");
  }

  function formatTime(date: Date) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  async function handleAddReminderTime(date: Date | undefined) {
    if (!date) return;
    const next = [...reminderTimes, formatTime(date)];
    await persistReminderTimes(next);
  }

  async function handleRemoveReminderTime(time: string) {
    const next = reminderTimes.filter((t) => t !== time);
    await persistReminderTimes(next);
  }

  function buildLowStockMessage(list: Item[]) {
    if (list.length === 0) {
      return "目前沒有需要補貨的品項";
    }
    const top = list.slice(0, 5);
    const lines = top.map((item) => `${item.name} ${item.qty}/${item.min_qty}`);
    if (list.length > top.length) {
      lines.push(`...等${list.length}項`);
    }
    return lines.join("、");
  }

  async function handleNotifyNow() {
    const message = buildLowStockMessage(lowItems);
    const ok = await sendLowStockNow(message);
    if (!ok) {
      Alert.alert("通知失敗", "請確認通知權限已開啟");
    }
  }

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
          <Text style={styles.title}>待補貨</Text>
          <Text style={styles.subTitle}>初始化中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>需要購買</Text>
        <Text style={styles.subTitle}>數量低於最低水位的品項</Text>

        <View style={styles.notifyCard}>
          <Text style={styles.notifyTitle}>通知</Text>
          <Text style={styles.notifyMeta}>每日提醒時間</Text>
          <View style={styles.chips}>
            {reminderTimes.length === 0 ? (
              <Text style={styles.emptyText}>尚未設定提醒</Text>
            ) : (
              reminderTimes.map((time) => (
                <View key={time} style={styles.timeChip}>
                  <Text style={styles.chipTextActive}>{time}</Text>
                  <TouchableOpacity
                    style={styles.timeChipRemove}
                    onPress={() => handleRemoveReminderTime(time)}
                  >
                    <Text style={styles.timeChipRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
          <TouchableOpacity
            style={styles.addTimeBtn}
            onPress={() => {
              setIosPickerTime(new Date());
              setShowTimePicker(true);
            }}
          >
            <Text style={styles.addTimeText}>新增提醒時間</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifyBtn} onPress={handleNotifyNow}>
            <Text style={styles.notifyBtnText}>一鍵立即提醒</Text>
          </TouchableOpacity>
        </View>

        {showTimePicker && Platform.OS === "ios" && (
          <View style={styles.iosPickerCard}>
            <DateTimePicker
              mode="time"
              value={iosPickerTime}
              display="spinner"
              onChange={(_, selectedDate) => {
                if (selectedDate) setIosPickerTime(selectedDate);
              }}
            />
            <View style={styles.iosPickerActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  setShowTimePicker(false);
                  handleAddReminderTime(iosPickerTime);
                }}
              >
                <Text style={styles.saveText}>加入</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {showTimePicker && Platform.OS !== "ios" && (
          <DateTimePicker
            mode="time"
            value={new Date()}
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (event.type === "set") {
                handleAddReminderTime(selectedDate ?? new Date());
              }
            }}
          />
        )}

        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>排序</Text>
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, sortKey === "deficit" && styles.chipActive]}
                onPress={() => setSortKey("deficit")}
              >
                <Text
                  style={[
                    styles.chipText,
                    sortKey === "deficit" && styles.chipTextActive,
                  ]}
                >
                  缺口
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, sortKey === "name" && styles.chipActive]}
                onPress={() => setSortKey("name")}
              >
                <Text
                  style={[
                    styles.chipText,
                    sortKey === "name" && styles.chipTextActive,
                  ]}
                >
                  品名
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, sortKey === "location" && styles.chipActive]}
                onPress={() => setSortKey("location")}
              >
                <Text
                  style={[
                    styles.chipText,
                    sortKey === "location" && styles.chipTextActive,
                  ]}
                >
                  區域
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>篩選</Text>
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, stockFilter === "all" && styles.chipActive]}
                onPress={() => setStockFilter("all")}
              >
                <Text
                  style={[
                    styles.chipText,
                    stockFilter === "all" && styles.chipTextActive,
                  ]}
                >
                  全部
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, stockFilter === "zero" && styles.chipActive]}
                onPress={() => setStockFilter("zero")}
              >
                <Text
                  style={[
                    styles.chipText,
                    stockFilter === "zero" && styles.chipTextActive,
                  ]}
                >
                  只看缺貨
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>位置</Text>
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, locationFilter === "all" && styles.chipActive]}
                onPress={() => setLocationFilter("all")}
              >
                <Text
                  style={[
                    styles.chipText,
                    locationFilter === "all" && styles.chipTextActive,
                  ]}
                >
                  全部
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, locationFilter === "none" && styles.chipActive]}
                onPress={() => setLocationFilter("none")}
              >
                <Text
                  style={[
                    styles.chipText,
                    locationFilter === "none" && styles.chipTextActive,
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
                    locationFilter === loc.id && styles.chipActive,
                  ]}
                  onPress={() => setLocationFilter(loc.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      locationFilter === loc.id && styles.chipTextActive,
                    ]}
                  >
                    {loc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {filteredItems.length === 0 ? (
          <Text style={styles.emptyText}>目前沒有需要補貨的品項</Text>
        ) : (
          <View style={styles.list}>
            {filteredItems.map((item) => (
              <View key={String(item.id)} style={styles.row}>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.location_name ?? "未指定"} ・ {item.qty}/{item.min_qty}
                  </Text>
                </View>
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    style={[styles.circleBtn, styles.minus]}
                    onPress={() => handleChangeQty(item.id, -1)}
                  >
                    <Text style={styles.circleText}>-</Text>
                  </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  content: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#f2f4f8", marginTop: 8 },
  subTitle: { marginTop: 6, color: "#a1a8b3" },
  notifyCard: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1f232b",
    borderRadius: 14,
    backgroundColor: "#171a20",
  },
  notifyTitle: { fontWeight: "700", color: "#f2f4f8" },
  notifyMeta: { marginTop: 8, fontSize: 12, color: "#8b93a1" },
  addTimeBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2a2f38",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  addTimeText: { color: "#d0d6df", fontWeight: "600" },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2f38",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  timeChipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3a2a2a",
  },
  timeChipRemoveText: { color: "#e07a7a", fontSize: 12 },
  notifyBtn: {
    marginTop: 10,
    backgroundColor: "#2a2f38",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  notifyBtnText: { color: "#f2f4f8", fontWeight: "700" },
  iosPickerCard: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1f232b",
    borderRadius: 12,
    backgroundColor: "#171a20",
  },
  iosPickerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#1f3d2b",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  saveText: { color: "#cfe9d4", fontWeight: "700" },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#2a2f38",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelText: { color: "#d0d6df", fontWeight: "700" },
  controls: { marginTop: 12, gap: 10 },
  controlRow: { gap: 8 },
  controlLabel: { color: "#a1a8b3", fontSize: 12 },
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
  emptyText: { color: "#717989", marginTop: 16 },
  list: { marginTop: 12, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171a20",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f232b",
    padding: 12,
  },
  info: { flex: 1 },
  name: { color: "#f2f4f8", fontWeight: "700" },
  meta: { color: "#a1a8b3", fontSize: 12, marginTop: 4 },
  qtyBox: { flexDirection: "row", gap: 8 },
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
