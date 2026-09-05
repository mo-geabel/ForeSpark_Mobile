import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Flame,
  Satellite,
  ShieldCheck,
  Layers,
  ArrowRight,
  LogIn,
  FileText,
} from "lucide-react-native";

export default function WelcomeScreen() {
  const handleProceed = async (targetRoute: "/LoginScreen" | "/RegisterScreen") => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
    } catch {
      // ignore storage error
    }
    router.push(targetRoute as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.badgeContainer}>
            <Flame size={14} color="#059669" strokeWidth={2.5} />
            <Text style={styles.badgeText}>AI-Powered Wildfire Defense</Text>
          </View>
          <Text style={styles.title}>ForeSpark AI</Text>
          <Text style={styles.tagline}>
            Real-time satellite surveillance, deep learning hazard analysis, and wildfire risk prediction.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }]}>
              <Satellite size={22} color="#059669" strokeWidth={2.2} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Satellite Telemetry</Text>
              <Text style={styles.featureDescription}>
                Multi-spectral terrain analysis assessing vegetation dryness, temperature, and wind conditions.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: "#fff7ed", borderColor: "#fed7aa" }]}>
              <Flame size={22} color="#ea580c" strokeWidth={2.2} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>3x3 Grid Risk Prediction</Text>
              <Text style={styles.featureDescription}>
                Instant spatial risk breakdown of immediate and adjacent coordinates with directional hazard propagation.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
              <ShieldCheck size={22} color="#2563eb" strokeWidth={2.2} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Explainable Intelligence</Text>
              <Text style={styles.featureDescription}>
                Transparent ML confidence metrics, satellite layer inspections, and verifiable prediction history.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => handleProceed("/RegisterScreen")}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <ArrowRight size={20} color="#ffffff" strokeWidth={2.4} />
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => handleProceed("/LoginScreen")}
          >
            <LogIn size={18} color="#059669" strokeWidth={2.2} />
            <Text style={styles.secondaryButtonText}>Sign In to Existing Account</Text>
          </Pressable>

          <Pressable
            style={styles.docsLinkRow}
            onPress={() => router.push("/DocumentationScreen" as any)}
          >
            <FileText size={15} color="#64748b" strokeWidth={2} />
            <Text style={styles.docsLinkText}>View Model Documentation & Science</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoContainer: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  logoImage: {
    width: 84,
    height: 84,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    fontWeight: "400",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  featuresContainer: {
    gap: 14,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748b",
    lineHeight: 17,
  },
  actionsContainer: {
    gap: 12,
    alignItems: "stretch",
  },
  primaryButton: {
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "600",
  },
  docsLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
  },
  docsLinkText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
});
