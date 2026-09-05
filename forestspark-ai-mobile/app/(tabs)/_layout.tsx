import { Tabs, Redirect } from "expo-router";
import { Pressable, Alert } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { Map, History, FileText, LogOut, ShieldCheck, Settings } from "lucide-react-native";

export default function TabsLayout() {
  const { logout, user, loading } = useAuth();
  const isAdmin = user?.role === "admin";

  if (!loading && !user) {
    return <Redirect href="/(auth)" />;
  }

  const confirmLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => logout() }
      ]
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#059669" },
        headerTintColor: "#fff",
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Map size={size || 22} color={color} strokeWidth={2} />
          ),
          headerRight: () => (
            <Pressable
              onPress={confirmLogout}
              style={({ pressed }) => [{ marginRight: 16 }, pressed && { opacity: 0.7 }]}
            >
              <LogOut size={22} color="#fff" strokeWidth={2} />
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="HistoryScreen"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <History size={size || 22} color={color} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="DocumentationScreen"
        options={{
          title: "Docs",
          tabBarIcon: ({ color, size }) => (
            <FileText size={size || 22} color={color} strokeWidth={2} />
          ),
          headerTitle: "Model Documentation",
        }}
      />

      <Tabs.Screen
        name="AdminScreen"
        options={{
          title: "Admin",
          href: isAdmin ? "/(tabs)/AdminScreen" : null,
          tabBarIcon: ({ color, size }) => (
            <ShieldCheck size={size || 22} color={color} strokeWidth={2} />
          ),
          headerTitle: "Admin Console",
        }}
      />

      <Tabs.Screen
        name="SettingsScreen"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings size={size || 22} color={color} strokeWidth={2} />
          ),
          headerTitle: "Settings & Support",
        }}
      />
    </Tabs>
  );
}
