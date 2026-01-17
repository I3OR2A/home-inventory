import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#f2f4f8",
        tabBarInactiveTintColor: "#6b7280",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#0f1115",
          borderTopColor: "#1f232b",
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "首頁",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: "品項",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="low-stock"
        options={{
          title: "待補貨",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="exclamationmark.circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "位置",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="mappin.and.ellipse" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
