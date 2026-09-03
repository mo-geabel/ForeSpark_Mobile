import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function NotFoundScreen() {
  useEffect(() => {
    // Instantly forward into the main application tabs
    router.replace("/(tabs)");
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#059669" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});