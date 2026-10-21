import React from "react";
import { Tabs } from "expo-router";
import { Icon, palette } from "@/components/play-ui";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.blue,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: "#FFF",
          borderTopWidth: 2,
          borderTopColor: palette.ink,
        },
        tabBarLabelStyle: { fontWeight: "800", fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Create & play",
          tabBarIcon: ({ color }) => (
            <Icon name="flash-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "My decks",
          tabBarIcon: ({ color }) => (
            <Icon name="albums-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
