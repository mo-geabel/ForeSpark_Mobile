import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThumbsUp, ThumbsDown, Layers, Satellite, ChevronLeft, MapPin, Flame, Wind } from "lucide-react-native";
import { useAuth } from "../src/context/AuthContext";
import api from "@/src/api/axios";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

const GRID_MARGIN = 16;
const GRID_GAP = 8;
const GRID_CONTAINER_WIDTH = width - GRID_MARGIN * 2;
const CELL_SIZE = (GRID_CONTAINER_WIDTH - GRID_GAP * 2) / 3;

const DIRECTION_LABELS: Record<string, string> = {
  NW: "NW", N: "N", NE: "NE",
  W: "W", CENTER: "●", E: "E",
  SW: "SW", S: "S", SE: "SE",
};

interface GridPoint {
  label: string;
  lat: number;
  lng: number;
  individual_prob: number;
  weighted_contribution?: number;
  original_img?: string;
  explanation_img?: string;
  mapbox_url?: string;
  error?: string;
}

interface ScanData {
  _id: string;
  result: string;
  total_probability: number;
  grid_data: GridPoint[];
  center_coords?: { lat: number; lng: number };
  timestamp?: string;
}

export default function AnalysisScreen() {
  const { scan } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();

  const data: ScanData | null = scan ? JSON.parse(scan as string) : null;

  const centerPoint =
    data?.grid_data?.find((p) => p.label === "CENTER") ||
    data?.grid_data?.[0];

  const [placeName, setPlaceName] = useState<string>("Locating...");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCell, setSelectedCell] = useState<GridPoint | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const isHighRisk = data?.result?.includes("High") || data?.result?.includes("Critical");
  const riskColor = isHighRisk ? "#ef4444" : "#10b981";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!centerPoint?.lat || !centerPoint?.lng) return;
    (async () => {
      try {
        const res = await Location.reverseGeocodeAsync({
          latitude: centerPoint.lat,
          longitude: centerPoint.lng,
        });
        if (res.length > 0) {
          const place = res[0];
          const name = place.name || place.street || place.city || place.region || "Unknown location";
          setPlaceName(
            `${name}${place.city ? ", " + place.city : ""}${place.country ? ", " + place.country : ""}`
          );
        } else {
          setPlaceName("Unknown location");
        }
      } catch {
        setPlaceName("Unknown location");
      }
    })();
  }, [centerPoint]);

  const handleSave = async () => {
    if (!data) return;
    if (feedback === null) {
      Alert.alert("Rate the Prediction", "Please tap 👍 or 👎 before saving.");
      return;
    }
    setIsSaving(true);
    try {
      await api.patch(
        `scans/feedback/${data._id}`,
        { isCorrect: feedback, notes },
        { headers: { "Content-Type": "application/json", "x-auth-token": token || "" } }
      );
      router.push("/HistoryScreen");
    } catch (error) {
      console.error("Save feedback error:", error);
      Alert.alert("Error", "Failed to save feedback. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getImageUri = (point: GridPoint): string | null => {
    if (showHeatmap && point.explanation_img) return `data:image/jpeg;base64,${point.explanation_img}`;
    if (!showHeatmap && point.original_img) return `data:image/jpeg;base64,${point.original_img}`;
    if (point.mapbox_url) return point.mapbox_url;
    return null;
  };

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Flame size={52} color="#ef4444" />
        <Text style={styles.errorTitle}>No Analysis Data</Text>
        <Text style={styles.errorSub}>Return to the map and run a new scan.</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>← Back to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />


      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >

          {/* ══════════════════════════════════
              HERO HEADER
          ══════════════════════════════════ */}
          <View style={[styles.hero, { backgroundColor: isHighRisk ? "#fff5f5" : "#f0fdf4", borderBottomColor: isHighRisk ? "#fecaca" : "#bbf7d0", borderBottomWidth: 1 }]}>

            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <ChevronLeft size={20} color="rgba(0,0,0,0.7)" />
              <Text style={styles.backBtnText}>BACK</Text>
            </TouchableOpacity>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* AI VERDICT tag */}
              <View style={styles.verdictTag}>
                <Wind size={10} color={riskColor} />
                <Text style={[styles.verdictTagText, { color: riskColor }]}>AI VERDICT</Text>
              </View>

              {/* Risk Result */}
              <Text style={[styles.riskResult, { color: isHighRisk ? "#dc2626" : "#059669" }]}>
                {data.result}
              </Text>

              {/* Probability row */}
              <View style={styles.probRow}>
                <Text style={styles.probNumber}>
                  {(data.total_probability * 100).toFixed(1)}
                </Text>
                <View style={styles.probSuffix}>
                  <Text style={styles.probPct}>%</Text>
                  <Text style={styles.probLabel}>risk{"\n"}score</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.heroProgressTrack}>
                <View
                  style={[
                    styles.heroProgressFill,
                    {
                      width: `${data.total_probability * 100}%`,
                      backgroundColor: riskColor,
                    },
                  ]}
                />
              </View>

              {/* Location row */}
              <View style={styles.locationRow}>
                <MapPin size={11} color="rgba(255,255,255,0.5)" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {placeName}
                </Text>
              </View>
              <Text style={styles.coordText}>
                {centerPoint?.lat.toFixed(5)} , {centerPoint?.lng.toFixed(5)}
              </Text>
            </Animated.View>
          </View>

          {/* ══════════════════════════════════
              GRID SECTION — edge-to-edge
          ══════════════════════════════════ */}
          <View style={styles.gridSection}>

            {/* Floating grid controls bar */}
            <View style={styles.gridControlBar}>
              <View>
                <Text style={styles.gridLabel}>SPATIAL GRID</Text>
                <Text style={styles.gridSublabel}>9-point deep learning scan</Text>
              </View>
              <TouchableOpacity
                style={[styles.togglePill, showHeatmap && styles.togglePillActive]}
                onPress={() => setShowHeatmap(!showHeatmap)}
                activeOpacity={0.85}
              >
                {showHeatmap
                  ? <Satellite size={12} color="#fff" />
                  : <Layers size={12} color="#f97316" />
                }
                <Text style={[styles.togglePillText, showHeatmap && styles.togglePillTextActive]}>
                  {showHeatmap ? "Satellite" : "Heatmap XAI"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3×3 Rounded Card Grid */}
            <View style={styles.imageGrid}>
              {data.grid_data.map((point, i) => {
                const pct = point.individual_prob * 100;
                const isHigh = pct > 40;
                const imageUri = getImageUri(point);
                const isSelected = selectedCell?.label === point.label;

                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.cell,
                      isSelected && styles.cellSelected,
                      isHigh ? styles.cellHighRiskBorder : styles.cellLowRiskBorder,
                    ]}
                    onPress={() => setSelectedCell(isSelected ? null : point)}
                    activeOpacity={0.85}
                  >
                    {/* Image */}
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[StyleSheet.absoluteFillObject, styles.cellPlaceholder,
                        isHigh ? { backgroundColor: "#fee2e2" } : { backgroundColor: "#dcfce7" }]}>
                        <ActivityIndicator color={isHigh ? "#ef4444" : "#10b981"} size="small" />
                      </View>
                    )}

                    {/* Direction badge top-left */}
                    <View style={[styles.dirBadge, isSelected && styles.dirBadgeSelected]}>
                      <Text style={[styles.dirText, isSelected && { color: "#fff" }]}>
                        {DIRECTION_LABELS[point.label] || point.label}
                      </Text>
                    </View>

                    {/* Center point marker badge */}
                    {point.label === "CENTER" && (
                      <View style={styles.centerBadge}>
                        <View style={styles.centerDot} />
                      </View>
                    )}

                    {/* Risk % bottom badge */}
                    <View style={[styles.cellPctBadge, isHigh ? styles.cellPctBadgeHigh : styles.cellPctBadgeLow]}>
                      <Text style={[styles.cellPct, isHigh ? styles.cellPctTextHigh : styles.cellPctTextLow]}>
                        {pct.toFixed(0)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Mode hint */}
            <View style={styles.modeHint}>
              <Text style={styles.modeHintText}>
                {showHeatmap
                  ? "🔴 GradCAM++ — red = highest model attention"
                  : "🛰️ Satellite — Mapbox imagery, zoom 15"}
              </Text>
            </View>
          </View>

          {/* ══════════════════════════════════
              EXPANDED SECTOR DETAIL (tap a cell)
          ══════════════════════════════════ */}
          {selectedCell && (
            <View style={[styles.detailCard,
              selectedCell.individual_prob > 0.4
                ? { borderColor: "#f97316", backgroundColor: "#fff7ed" }
                : { borderColor: "#10b981", backgroundColor: "#f0fdf4" }
            ]}>
              <View style={styles.detailRow}>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailMeta}>SECTOR</Text>
                  <Text style={styles.detailVal}>{selectedCell.label}</Text>
                </View>
                <View style={[styles.detailBlock, { alignItems: "flex-end" }]}>
                  <Text style={styles.detailMeta}>FIRE RISK</Text>
                  <Text style={[styles.detailVal, {
                    color: selectedCell.individual_prob > 0.4 ? "#ef4444" : "#10b981"
                  }]}>
                    {(selectedCell.individual_prob * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailMeta}>CONTRIBUTION</Text>
                  <Text style={styles.detailVal}>
                    {((selectedCell.weighted_contribution ?? 0) * 100).toFixed(2)}%
                  </Text>
                </View>
                <View style={[styles.detailBlock, { alignItems: "flex-end" }]}>
                  <Text style={styles.detailMeta}>COORDINATES</Text>
                  <Text style={[styles.detailVal, { fontSize: 11, fontFamily: "monospace" }]}>
                    {selectedCell.lat?.toFixed(4)},{"\n"}{selectedCell.lng?.toFixed(4)}
                  </Text>
                </View>
              </View>

              {selectedCell.error && (
                <Text style={styles.detailError}>⚠ {selectedCell.error}</Text>
              )}
            </View>
          )}

          {/* ══════════════════════════════════
              FEEDBACK CARD
          ══════════════════════════════════ */}
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <View>
                <Text style={styles.feedbackTitle}>WAS THIS ACCURATE?</Text>
                <Text style={styles.feedbackSub}>Your rating trains the AI model</Text>
              </View>
              <View style={styles.thumbsRow}>
                <TouchableOpacity
                  style={[styles.thumbBtn, feedback === true && styles.thumbBtnYes]}
                  onPress={() => setFeedback(true)}
                  activeOpacity={0.7}
                >
                  <ThumbsUp size={20} color={feedback === true ? "#fff" : "#64748b"} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.thumbBtn, feedback === false && styles.thumbBtnNo]}
                  onPress={() => setFeedback(false)}
                  activeOpacity={0.7}
                >
                  <ThumbsDown size={20} color={feedback === false ? "#fff" : "#64748b"} />
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Optional note about this location..."
              placeholderTextColor="#94a3b8"
              value={notes}
              onChangeText={setNotes}
              multiline
              blurOnSubmit
              textAlignVertical="top"
            />
          </View>

          {/* ══════════════════════════════════
              MODEL NOTE
          ══════════════════════════════════ */}
          <View style={styles.modelNote}>
            <Text style={styles.modelNoteText}>
              "Spatial data from 9 surrounding tiles processed with MobileNetV2. The weighted algorithm
              prioritises central terrain while monitoring perimeter threats."
            </Text>
          </View>

          {/* ══════════════════════════════════
              ACTION BUTTONS
          ══════════════════════════════════ */}
          <View style={styles.actions}>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>CONFIRM & SAVE TO HISTORY</Text>
              }
            </TouchableOpacity>

            {/* Discard */}
            <TouchableOpacity
              style={styles.discardBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.discardBtnText}>DISCARD SCAN</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingBottom: 40 },

  // ─── Error ───
  errorContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "#f8fafc", padding: 40, gap: 14,
  },
  errorTitle: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  errorSub: { fontSize: 13, color: "#64748b", textAlign: "center" },
  errorBtn: {
    marginTop: 12, paddingHorizontal: 28, paddingVertical: 14,
    backgroundColor: "#059669", borderRadius: 14,
  },
  errorBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ─── Hero ───
  hero: {
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 20,
    alignSelf: "flex-start",
  },
  backBtnText: {
    fontSize: 10, fontWeight: "900", color: "#64748b", letterSpacing: 2,
  },
  verdictTag: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", marginBottom: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  verdictTagText: { fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  riskResult: { fontSize: 42, fontWeight: "900", lineHeight: 50, letterSpacing: -0.5 },
  probRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 4, marginBottom: 12 },
  probNumber: { fontSize: 72, fontWeight: "200", color: "#0f172a", lineHeight: 80 },
  probSuffix: { marginBottom: 12 },
  probPct: { fontSize: 24, fontWeight: "300", color: "#94a3b8" },
  probLabel: { fontSize: 9, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", lineHeight: 13 },
  heroProgressTrack: {
    height: 4, backgroundColor: "#e2e8f0",
    borderRadius: 10, overflow: "hidden", marginBottom: 14,
  },
  heroProgressFill: { height: "100%", borderRadius: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  locationText: { fontSize: 12, fontWeight: "500", color: "#64748b", flex: 1 },
  coordText: { fontSize: 10, color: "#94a3b8", fontFamily: "monospace" },

  // ─── Grid Section ───
  gridSection: { backgroundColor: "#fff" },
  gridControlBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: "#f1f5f9",
  },
  gridLabel: { fontSize: 10, fontWeight: "900", color: "#0f172a", letterSpacing: 2 },
  gridSublabel: { fontSize: 9, color: "#94a3b8", marginTop: 2 },
  togglePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#f97316", backgroundColor: "rgba(249,115,22,0.1)",
  },
  togglePillActive: { backgroundColor: "#f97316", borderColor: "#f97316" },
  togglePillText: { fontSize: 10, fontWeight: "800", color: "#f97316" },
  togglePillTextActive: { color: "#fff" },

  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingHorizontal: GRID_MARGIN,
    paddingTop: 8,
    paddingBottom: 14,
    justifyContent: "center",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
  },
  cellLowRiskBorder: {
    borderColor: "#e2e8f0",
  },
  cellHighRiskBorder: {
    borderColor: "#fca5a5",
  },
  cellSelected: {
    borderColor: "#059669",
    borderWidth: 2.5,
    zIndex: 10,
  },
  cellPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  dirBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dirBadgeSelected: {
    backgroundColor: "#059669",
  },
  dirText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#1e293b",
  },
  centerBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  cellPctBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  cellPctBadgeLow: {
    backgroundColor: "rgba(240, 253, 244, 0.95)",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  cellPctBadgeHigh: {
    backgroundColor: "rgba(254, 242, 242, 0.95)",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cellPct: {
    fontSize: 10,
    fontWeight: "800",
  },
  cellPctTextLow: {
    color: "#15803d",
  },
  cellPctTextHigh: {
    color: "#b91c1c",
  },
  modeHint: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modeHintText: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 16,
    textAlign: "center",
  },

  // ─── Detail Card ───
  detailCard: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 20, padding: 18, borderWidth: 1, gap: 14,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailBlock: { gap: 3 },
  detailMeta: {
    fontSize: 8, fontWeight: "900", color: "#94a3b8",
    letterSpacing: 1.5, textTransform: "uppercase",
  },
  detailVal: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  detailError: { fontSize: 11, color: "#ef4444" },

  // ─── Feedback Card ───
  feedbackCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: "#fff", borderRadius: 24,
    padding: 20, gap: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  feedbackHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feedbackTitle: { fontSize: 11, fontWeight: "900", color: "#1e293b", letterSpacing: 1 },
  feedbackSub: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  thumbsRow: { flexDirection: "row", gap: 8 },
  thumbBtn: {
    padding: 12, borderRadius: 14,
    backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0",
  },
  thumbBtnYes: { backgroundColor: "#059669", borderColor: "#059669" },
  thumbBtnNo:  { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  notesInput: {
    backgroundColor: "#f8fafc", borderRadius: 14,
    padding: 14, fontSize: 13, color: "#1e293b",
    borderWidth: 1, borderColor: "#e2e8f0",
    minHeight: 72,
  },

  // ─── Model Note ───
  modelNote: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: "rgba(5,150,105,0.08)",
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: "rgba(5,150,105,0.2)",
  },
  modelNoteText: {
    fontSize: 10, color: "#065f46", fontStyle: "italic", lineHeight: 17,
  },

  // ─── Actions ───
  actions: { marginHorizontal: 16, marginTop: 16, gap: 10 },
  xaiBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 18,
    borderWidth: 1.5, borderColor: "#f97316",
    backgroundColor: "rgba(249,115,22,0.05)",
  },
  xaiBtnActive: { backgroundColor: "#f97316", borderColor: "#f97316" },
  xaiBtnText: { fontSize: 11, fontWeight: "900", color: "#f97316", letterSpacing: 1 },
  saveBtn: {
    backgroundColor: "#059669", paddingVertical: 18,
    borderRadius: 18, alignItems: "center", justifyContent: "center",
    shadowColor: "#059669", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 6,
  },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1.5 },
  discardBtn: {
    paddingVertical: 18, borderRadius: 18, alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  discardBtnText: { color: "#94a3b8", fontWeight: "900", fontSize: 12, letterSpacing: 1.5 },
});