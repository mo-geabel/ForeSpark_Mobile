import { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  TextInput,
  Keyboard,
  Pressable,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, MapPressEvent, Region, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import api from "../../src/api/axios";
import { Search, X, Crosshair, Globe, Satellite, Compass, Sparkles, MapPin } from "lucide-react-native";

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const markerRef = useRef<any>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 39.9334,
    longitude: 32.8597,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">("standard");
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
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
    const query = search.trim();
    if (!query) return;

    Keyboard.dismiss();
    setIsSearching(true);

    try {
      let targetLat: number | null = null;
      let targetLng: number | null = null;
      let resolvedName = query;

      // 1. Direct coordinate check: "lat, lng" (e.g., "39.93, 32.85" or "39.93 32.85")
      const coordRegex = /^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/;
      const coordMatch = query.match(coordRegex);

      if (coordMatch) {
        targetLat = parseFloat(coordMatch[1]);
        targetLng = parseFloat(coordMatch[3]);
        resolvedName = `Coords: ${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}`;
      } else {
        // 2. Try Expo native geocoder
        try {
          const expoResults = await Location.geocodeAsync(query);
          if (expoResults && expoResults.length > 0) {
            targetLat = expoResults[0].latitude;
            targetLng = expoResults[0].longitude;
          }
        } catch (e) {
          console.log("Expo geocode error, attempting OSM fallback...", e);
        }

        // 3. Fallback to OpenStreetMap Nominatim geocoder (worldwide coverage)
        if (targetLat === null || targetLng === null) {
          try {
            const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              query
            )}&format=json&limit=1`;
            const res = await fetch(osmUrl, {
              headers: { "User-Agent": "ForeSpark-Mobile-App" },
            });
            const data = await res.json();
            if (data && data.length > 0) {
              targetLat = parseFloat(data[0].lat);
              targetLng = parseFloat(data[0].lon);
              resolvedName = data[0].name || data[0].display_name?.split(",")?.[0] || query;
            }
          } catch (osmErr) {
            console.warn("OSM geocode error:", osmErr);
          }
        }
      }

      if (targetLat !== null && targetLng !== null) {
        const newRegion = {
          latitude: targetLat,
          longitude: targetLng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };

        setRegion(newRegion);
        setMarker({ latitude: targetLat, longitude: targetLng });
        setPlaceName(resolvedName);

        // Smoothly animate map camera to the found place
        mapRef.current?.animateToRegion(newRegion, 1000);

        // Auto-show marker callout balloon
        setTimeout(() => {
          markerRef.current?.showCallout();
        }, 500);
      } else {
        alert(`Could not find "${query}". Please check the spelling or enter coordinates (lat, lng).`);
      }
    } catch (err) {
      console.error("Search execution failed:", err);
      alert("Error searching for location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // 📌 Map press
  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    setMarker({ latitude, longitude });

    // Automatically trigger callout balloon like web InfoWindow
    setTimeout(() => {
      markerRef.current?.showCallout();
    }, 100);

    try {
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
    } catch {
      setPlaceName("Dropped location");
    }

    // Refresh callout with resolved place name
    setTimeout(() => {
      markerRef.current?.showCallout();
    }, 400);

    Keyboard.dismiss();
  };


  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* 🔍 Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            onPress={handleSearch}
            disabled={isSearching}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.searchIconBtn}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Search size={18} color="#059669" strokeWidth={2.2} />
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Search place or paste coords..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setMarker(null);
                Keyboard.dismiss();
              }}
              style={styles.clearBtn}
            >
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 🗺 Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          mapType={mapType}
          onPress={handleMapPress}
        >
          {marker && (
            <Marker
              ref={markerRef}
              coordinate={marker}
            >
              <Callout tooltip={false}>
                <View style={styles.webInfoWindowCard}>
                  <Text style={styles.webInfoBadge}>LOCATION FOUND</Text>
                  <Text style={styles.webInfoPlace} numberOfLines={2}>
                    {placeName || "Identifying terrain..."}
                  </Text>
                  <View style={styles.webInfoCoords}>
                    <Text style={styles.webInfoCoordText}>LAT: {marker.latitude.toFixed(5)}</Text>
                    <Text style={styles.webInfoCoordText}>LNG: {marker.longitude.toFixed(5)}</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          )}
        </MapView>

        {/* 📍 GPS Button */}
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={getCurrentLocation}
        >
          <Crosshair size={20} color="#334155" strokeWidth={2} />
        </TouchableOpacity>

        {/* 🗺 Map Type (LEFT) */}
        <View style={styles.mapTypeContainer}>
          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === "standard" && styles.activeMapType]}
            onPress={() => setMapType("standard")}
          >
            <Globe
              size={18}
              color={mapType === "standard" ? "#fff" : "#475569"}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === "satellite" && styles.activeMapType]}
            onPress={() => setMapType("satellite")}
          >
            <Satellite
              size={18}
              color={mapType === "satellite" ? "#fff" : "#475569"}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapTypeButton, mapType === "hybrid" && styles.activeMapType]}
            onPress={() => setMapType("hybrid")}
          >
            <Compass
              size={18}
              color={mapType === "hybrid" ? "#fff" : "#475569"}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* 🔥 Web-Style InfoWindow & Analyze Fire Risk Container */}
        {marker && (
          <View style={styles.webBottomContainer}>
            {/* InfoWindow Card matching Web MapSelector.tsx */}
            <View style={styles.webInfoWindowCard}>
              <View style={styles.webInfoHeader}>
                <Text style={styles.webInfoBadge}>LOCATION FOUND</Text>
                <TouchableOpacity
                  onPress={() => setMarker(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.webInfoPlace} numberOfLines={2}>
                {placeName || "Identifying terrain..."}
              </Text>

              <View style={styles.webInfoCoords}>
                <Text style={styles.webInfoCoordText}>LAT: {marker.latitude.toFixed(5)}</Text>
                <Text style={styles.webInfoCoordText}>LNG: {marker.longitude.toFixed(5)}</Text>
              </View>
            </View>

            {/* Analyze Fire Risk Button matching Web MapSelector.tsx */}
            <TouchableOpacity
              style={[
                styles.webAnalyzeButton,
                isAnalyzing && { backgroundColor: "#cbd5e1" },
              ]}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
              activeOpacity={0.85}
            >
              <Text style={[styles.webAnalyzeText, isAnalyzing && { color: "#94a3b8" }]}>
                {isAnalyzing ? "ANALYZING..." : "ANALYZE FIRE RISK"}
              </Text>
            </TouchableOpacity>
          </View>
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
    top: 54,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 8,
    zIndex: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  searchIconBtn: {
    padding: 6,
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    paddingVertical: 0,
  },

  clearBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  clearText: {
    fontSize: 14,
    paddingHorizontal: 6,
    color: "#64748b",
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

  // --- Exact Web InfoWindow & Bottom Container Styles ---
  webBottomContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 40,
    gap: 12,
  },
  webInfoWindowCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  webInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  webInfoBadge: {
    fontSize: 10,
    fontWeight: "900",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  webInfoPlace: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    lineHeight: 18,
  },
  webInfoCoords: {
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 3,
  },
  webInfoCoordText: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#475569",
  },

  // --- Exact Web Analyze Fire Risk Button Styles ---
  webAnalyzeButton: {
    backgroundColor: "#059669",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  webAnalyzeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});



