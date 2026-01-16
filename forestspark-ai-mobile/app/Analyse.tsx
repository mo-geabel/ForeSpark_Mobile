import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity, 
  Alert, 
  TextInput // Standard TextInput is more stable for this layout
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThumbsUp, ThumbsDown } from "lucide-react-native";
import { useAuth } from "../src/context/AuthContext";
import api from "@/src/api/axios";
import * as Location from "expo-location";
import { useEffect } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";


const { width } = Dimensions.get("window");

export default function AnalysisScreen() {
  const { scan } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  
  // Parse data and handle null case
  const data = scan ? JSON.parse(scan as string) : null;

  const centerPoint =
    data?.grid_data?.find((p: any) => p.label === "CENTER") ||
    data?.grid_data?.[0];
  const [placeName, setPlaceName] = useState<string>("Resolving location...");
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

        const name =
          place.name ||
          place.street ||
          place.city ||
          place.region ||
          "Unknown location";

        setPlaceName(
          `${name}${place.city ? ", " + place.city : ""}${
            place.country ? ", " + place.country : ""
          }`
        );
      } else {
        setPlaceName("Unknown location");
      }
    } catch (e) {
      console.warn("Reverse geocoding failed", e);
      setPlaceName("Unknown location");
    }
  })();
}, [centerPoint]);

  // Feedback State
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<string>(""); // Initialize as empty string
  const [isSaving, setIsSaving] = useState(false);

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No analysis data found</Text>
      </View>
    );
  }



const handleSave = async () => {
  if (!data) return;

  setIsSaving(true);

  try {
    await api.patch(
      `scans/feedback/${data._id}`,
      {
        isCorrect: feedback,
        notes,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token || "",
        },
      }
    );

    // Same as navigate("/history")
    router.push("/HistoryScreen");

  } catch (error) {
    console.error("Save feedback error:", error);
    Alert.alert("Error", "Failed to save feedback.");
  } finally {
    setIsSaving(false);
  }
};


  return (
    <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
>

    <ScrollView 
      contentContainerStyle={styles.scrollContainer} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" // Ensures buttons work even if keyboard is open
      >
      {/* AI Verdict Card */}
      <View style={styles.card}>
        <Text style={styles.label}>AI VERDICT</Text>
        <Text
          style={[
            styles.result,
            data.result.includes("High")||data.result.includes("Critical") ? { color: "#ef4444" } : { color: "#10b981" },
          ]}
        >
          {data.result.toUpperCase()}
        </Text>
        <View style={styles.coordBadge}>
          <Text style={styles.coordText}>
            {Number(centerPoint?.lat).toFixed(5)} , {Number(centerPoint?.lng).toFixed(5)}
          </Text>
        </View>
      </View>

      {/* Probability Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Model Certainty</Text>
          <Text style={styles.probability}>
            {(data.total_probability * 100).toFixed(1)}%
          </Text>
          <Text style={styles.progressBarBg}>
             <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${data.total_probability * 100}%`, 
                    backgroundColor: data.total_probability > 0.7 ? '#ef4444' : '#10b981' 
                  }
                ]} 
             />
          </Text>
        </View>
      </View>

     {/* Spatial Intelligence Grid */}
<Text style={styles.sectionTitle}>Spatial Intelligence</Text>
<View style={styles.coordBadge}>
  <Text style={styles.placeText}>{placeName}</Text>
  <Text style={styles.coordText}>
    {centerPoint.lat.toFixed(5)} , {centerPoint.lng.toFixed(5)}
  </Text>
</View>
<View style={styles.grid}>
  {data.grid_data.map((point: any, i: number) => {
    const pct = point.individual_prob * 100;
    const isHigh = pct > 40;
    
    return (
      <View
      key={i}
      style={[
        styles.cell,
        isHigh ? styles.cellHigh : styles.cellLow
      ]}
      >
        <Text style={styles.cellLabel}>{point.label}</Text>
        
        <View>
          <Text style={styles.cellValue}>{pct.toFixed(1)}%</Text>
          
          {/* Progress Bar Container (Track) */}
          <View style={styles.miniProgressTrack}>
            {/* Progress Bar Fill */}
            <View 
              style={[
                styles.miniProgressFill, 
                { 
                  width: `${pct}%`, 
                  // White fill works best on the colored backgrounds
                  backgroundColor: '#ffffff',
                  opacity: 0.9
                }
              ]} 
              />
          </View>
        </View>
      </View>
    );
  })}
</View>

      {/* Feedback Section */}
      <View style={styles.feedbackContainer}>
        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackTitle}>WAS THIS ACCURATE?</Text>
          <View style={styles.thumbsContainer}>
            <TouchableOpacity 
              onPress={() => setFeedback(true)}
              activeOpacity={0.7}
              style={[styles.thumbBtn, feedback === true && { backgroundColor: '#10b981', borderColor: '#10b981' }]}
            >
              <ThumbsUp size={20} color={feedback === true ? "#fff" : "#94a3b8"} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setFeedback(false)}
              activeOpacity={0.7}
              style={[styles.thumbBtn, feedback === false && { backgroundColor: '#ef4444', borderColor: '#ef4444' }]}
            >
              <ThumbsDown size={20} color={feedback === false ? "#fff" : "#94a3b8"} />
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Add a small note (optional)..."
          placeholderTextColor="#94a3b8"
          value={notes}
          onChangeText={setNotes}
          multiline={true}
          blurOnSubmit={true}
          />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={[styles.saveBtn, (isSaving || feedback === null) && { opacity: 0.6 }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveBtnText}>
            {isSaving ? "SAVING..." : "CONFIRM & SAVE HISTORY"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.discardBtn} onPress={() => router.back()}>
          <Text style={styles.discardBtnText}>DISCARD SCAN</Text>
        </TouchableOpacity>
      </View>
      
    </ScrollView> 
</KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    backgroundColor: "#f8fafc",
    paddingTop: 60,
    paddingBottom: 40, // Added padding so buttons aren't cut off
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 8,
  },
  result: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 16,
  },
  coordBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  coordText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#64748b",
  },
  statsContainer: {
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  probability: {
    fontSize: 56,
    fontWeight: "800",
    color: "#1e293b",
    marginVertical: 4,
  },
  progressBarBg: {
    height: 6,
    width: '60%',
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cell: {
    width: (width - 68) / 3, 
    aspectRatio: 1,
    borderRadius: 20,
    padding: 12,
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cellHigh: {
    backgroundColor: "#fb923c",
  },
  cellLow: {
    backgroundColor: "#34d399",
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
  },
  cellValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  miniIndicator: {
    height: 3,
    width: 12,
    marginTop: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    opacity: 0.5,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  feedbackContainer: {
    backgroundColor: "rgba(241, 245, 249, 0.5)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  feedbackHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  feedbackTitle: { 
    fontSize: 10, 
    fontWeight: "800", 
    color: "#64748b" 
  },
  thumbsContainer: { 
    flexDirection: 'row', 
    gap: 10 
  },
  thumbBtn: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: { 
    gap: 12,
    marginBottom: 20
  },
  saveBtn: {
    backgroundColor: "#059669",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: "#059669",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: { 
    color: "#fff", 
    fontWeight: "900", 
    fontSize: 12, 
    letterSpacing: 1 
  },
  discardBtn: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  discardBtnText: { 
    color: "#94a3b8", 
    fontWeight: "900", 
    fontSize: 12, 
    letterSpacing: 1 
  },
  miniProgressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Translucent white track
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  placeText: {
  fontSize: 13,
  fontWeight: "700",
  color: "#1e293b",
  marginBottom: 2,
  textAlign: "center",
},

});