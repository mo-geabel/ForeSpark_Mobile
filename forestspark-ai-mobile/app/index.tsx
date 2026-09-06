import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { View, Text, ActivityIndicator, StyleSheet, Image, StatusBar } from "react-native";
import * as SplashScreen from "expo-splash-screen";

export default function Index() {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Dismiss native splash screen promptly
    SplashScreen.hideAsync().catch(() => {});

    // Maximum 1.2 second loading display so the user never gets stuck
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (loading && !timedOut) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.content}>
          <View style={styles.logoCard}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>ForeSpark AI</Text>
          <Text style={styles.subtitle}>Wildfire Risk & Satellite Intelligence</Text>

          <View style={styles.spinnerWrapper}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.statusText}>Connecting to satellite telemetry...</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure Environmental Analysis</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 50,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoCard: {
    width: 140,
    height: 140,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  logo: {
    width: 110,
    height: 110,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    marginBottom: 36,
  },
  spinnerWrapper: {
    alignItems: "center",
    gap: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#059669",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94a3b8",
  },
});
