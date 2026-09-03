import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function CatchAllRoute() {
  const params = useLocalSearchParams();

  useEffect(() => {
    // When Clerk oauth callback arrives, redirect seamlessly to the main app
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 100);

    return () => clearTimeout(timer);
  }, [params]);

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