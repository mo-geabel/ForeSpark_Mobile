import { useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  TextInput,
  Keyboard,
  Pressable,
} from "react-native";
import MapView, { Marker, MapPressEvent, Region, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import api from "../../src/api/axios";

export default function MapScreen() {
  const [region, setRegion] = useState<Region>({
    latitude: 39.9334,
    longitude: 32.8597,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">("standard");
  const [search, setSearch] = useState("");
  const [placeName, setPlaceName] = useState<string>("Selected location");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();
  const handleAnalyze = async () => {
  if (!marker) return;

  try {
    setIsAnalyzing(true);
    console.log(placeName);

    const res = await api.post("/scans/analyze", {
      lat: marker.latitude,
      lng: marker.longitude,
      name: placeName,
    });

    const scanResult = res.data;

    // Navigate to result screen
    router.push({
      pathname: "/Analyse",
      params: {
        scan: JSON.stringify(scanResult),
      },
    });

  } catch (err: any) {
    console.error("Analyze error:", err);

    alert(
      err.response?.data?.message ||
      "Failed to analyze location. Please try again."
    );
  } finally {
    setIsAnalyzing(false);
  }
};


  // 📍 Current location
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;

    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

    setMarker({ latitude, longitude });
    setPlaceName("Current location");
    Keyboard.dismiss();

  };

  // 🔍 Search
  const handleSearch = async () => {
    if (!search) return;

    const result = await Location.geocodeAsync(search);
    if (!result.length) return;

    const { latitude, longitude } = result[0];

    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });

    setMarker({ latitude, longitude });
    Keyboard.dismiss();
    setPlaceName(search || "Current location");

  };

  // 📌 Map press
const handleMapPress = async (e: MapPressEvent) => {
  const { latitude, longitude } = e.nativeEvent.coordinate;

  setMarker({ latitude, longitude });

  // Try to get place name
  const result = await Location.reverseGeocodeAsync({
    latitude,
    longitude,
  });

  if (result.length > 0) {
    const place =
      result[0].name ||
      result[0].street ||
      result[0].city ||
      "Dropped location";

    setPlaceName(place);
  } else {
    setPlaceName("Dropped location");
  }

  Keyboard.dismiss();
};


  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* 🔍 Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search location..."
            placeholderTextColor="#000"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => {
                  setSearch("");
                  setMarker(null);
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={Keyboard.dismiss}>
                <Text style={styles.clearText}>⌨️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 🗺 Map */}
        <MapView
          style={styles.map}
          region={region}
          mapType={mapType}
          onPress={handleMapPress}
        >
          {marker && (
  <Marker coordinate={marker}>
    <Callout tooltip>
      <View style={styles.calloutContainer}>
        <Text style={styles.calloutLabel}>LOCATION FOUND</Text>

        <Text style={styles.placeName}>
          {placeName || "Identifying terrain..."}
        </Text>

        <View style={styles.coordsBox}>
          <Text style={styles.coordText}>
            LAT: {marker.latitude.toFixed(5)}
          </Text>
          <Text style={styles.coordText}>
            LNG: {marker.longitude.toFixed(5)}
          </Text>
        </View>
      </View>
    </Callout>
  </Marker>
)}


        </MapView>

        {/* 📍 GPS */}
        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>📍</Text>
        </TouchableOpacity>

        {/* 🗺 Map Type (LEFT) */}
        <View style={styles.mapTypeContainer}>
          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === "standard" && styles.activeMapType]}
            onPress={() => setMapType("standard")}
          >
            <Text style={styles.mapTypeText}>🌍</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === "satellite" && styles.activeMapType]}
            onPress={() => setMapType("satellite")}
          >
            <Text style={styles.mapTypeText}>🛰️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === "hybrid" && styles.activeMapType]}
            onPress={() => setMapType("hybrid")}
          >
            <Text style={styles.mapTypeText}>🧭</Text>
          </TouchableOpacity>
        </View>

        {/* 🔥 Analyze */}
   {marker && (
  <TouchableOpacity
    style={[
      styles.analyzeButton,
      isAnalyzing && { opacity: 0.6 },
    ]}
    onPress={handleAnalyze}
    disabled={isAnalyzing}
  >
    <Text style={styles.analyzeText}>
      {isAnalyzing ? "Analyzing..." : "Analyze"}
    </Text>
  </TouchableOpacity>
)}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },

  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },

  searchContainer: {
    position: "absolute",
    top: 50,
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    elevation: 5,
    zIndex: 10,
  },

  searchInput: {
    flex: 1,
    height: 40,
    color: "#000",
  },

  clearText: {
    fontSize: 18,
    paddingHorizontal: 8,
    color: "#000",
  },

  gpsButton: {
    position: "absolute",
    bottom: 160,
    right: 20,
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 50,
    elevation: 5,
  },

  buttonText: { color: "#fff", fontSize: 18 },

  mapTypeContainer: {
    position: "absolute",
    left: 10,
    top: "40%",
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
  },

  mapTypeButton: {
    padding: 12,
    alignItems: "center",
  },

  activeMapType: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
  },

  mapTypeText: {
    fontSize: 18,
  },

  analyzeButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#16a34a",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 5,
  },

  analyzeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
   calloutContainer: {
    width: 200,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  calloutLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#059669", // emerald
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  placeName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    lineHeight: 16,
  },

  coordsBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  coordText: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#475569",
  },
});
