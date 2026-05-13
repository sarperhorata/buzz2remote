import { Tabs } from "expo-router";
import { colors } from "../../lib/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Jobs", tabBarIcon: ({ color }) => <TabIcon name="briefcase" color={color} /> }} />
      <Tabs.Screen name="applications" options={{ title: "Applications", tabBarIcon: ({ color }) => <TabIcon name="file-text" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <TabIcon name="user" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} /> }} />
    </Tabs>
  );
}

// Simple text-based tab icons (no icon library needed)
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    briefcase: "💼",
    "file-text": "📄",
    user: "👤",
    settings: "⚙️",
  };
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 20 }}>{icons[name] || "•"}</Text>;
}
