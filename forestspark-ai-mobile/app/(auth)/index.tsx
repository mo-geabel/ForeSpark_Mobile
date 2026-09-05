import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function AuthIndex() {
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenWelcome");
        if (hasSeen === "true") {
          setTargetRoute("/LoginScreen");
        } else {
          setTargetRoute("/WelcomeScreen");
        }
      } catch {
        setTargetRoute("/WelcomeScreen");
      }
    };
    checkWelcome();
  }, []);

  if (!targetRoute) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#059669" />
      </View>
    );
  }

  return <Redirect href={targetRoute as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
});
