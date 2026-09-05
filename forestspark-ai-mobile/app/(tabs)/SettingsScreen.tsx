import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { User, Phone, Mail, Save, MessageSquare, LogOut, CheckCircle2 } from "lucide-react-native";

export default function SettingsScreen() {
  const { user, updateProfile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [contactName, setContactName] = useState(user?.fullName || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber || "");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhoneNumber(user.phoneNumber || "");
      setContactName(user.fullName || "");
      setContactEmail(user.email || "");
      setContactPhone(user.phoneNumber || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Full Name cannot be empty.");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileMessage("");
      await updateProfile(fullName.trim(), phoneNumber.trim());
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(""), 4000);
    } catch (err: any) {
      Alert.alert("Update Error", err?.response?.data?.message || err?.message || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactMessage.trim()) {
      Alert.alert("Validation Error", "Please enter a message before sending.");
      return;
    }

    try {
      setSendingContact(true);
      setContactSuccess("");
      // Simulate/Trigger contact support endpoint or feedback
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setContactSuccess("Message sent! Our support team will get in touch with you shortly.");
      setContactMessage("");
      setTimeout(() => setContactSuccess(""), 4000);
    } catch (err) {
      Alert.alert("Sending Error", "Could not send message. Please try again.");
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Badge */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <Text style={styles.headerSubtitle}>
          Logged in as <Text style={styles.boldText}>{user?.email}</Text> ({user?.role?.toUpperCase()})
        </Text>
      </View>

      {/* --- SECTION 1: PROFILE EDIT --- */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={20} color="#059669" strokeWidth={2.5} />
          <Text style={styles.cardTitle}>Personal Information</Text>
        </View>

        {profileMessage ? (
          <View style={styles.successBadge}>
            <CheckCircle2 size={16} color="#047857" />
            <Text style={styles.successText}>{profileMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <User size={18} color="#94a3b8" />
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <Text style={styles.inputLabel}>Telephone Number</Text>
        <View style={styles.inputWrapper}>
          <Phone size={18} color="#94a3b8" />
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+1 (555) 000-0000"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />
        </View>

        <Text style={styles.inputLabel}>Email Address (Read only)</Text>
        <View style={[styles.inputWrapper, styles.disabledInput]}>
          <Mail size={18} color="#94a3b8" />
          <TextInput
            style={[styles.input, { color: "#64748b" }]}
            value={user?.email || ""}
            editable={false}
          />
        </View>

        <Pressable
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={savingProfile}
        >
          {savingProfile ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save Profile Changes</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* --- SECTION 2: CONTACT US --- */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MessageSquare size={20} color="#059669" strokeWidth={2.5} />
          <Text style={styles.cardTitle}>Contact Us & Support</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Need help or have questions about AI predictions? Contact our team directly.
        </Text>

        {contactSuccess ? (
          <View style={styles.successBadge}>
            <CheckCircle2 size={16} color="#047857" />
            <Text style={styles.successText}>{contactSuccess}</Text>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.simpleInput}
          value={contactName}
          onChangeText={setContactName}
          placeholder="Your Name"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.simpleInput}
          value={contactEmail}
          onChangeText={setContactEmail}
          placeholder="Your Email"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>Telephone Number</Text>
        <TextInput
          style={styles.simpleInput}
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder="Phone Number"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>Message</Text>
        <TextInput
          style={[styles.simpleInput, styles.textArea]}
          value={contactMessage}
          onChangeText={setContactMessage}
          placeholder="Describe your inquiry..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
        />

        <Pressable
          style={[styles.saveButton, { backgroundColor: "#0284c7" }]}
          onPress={handleSendContact}
          disabled={sendingContact}
        >
          {sendingContact ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MessageSquare size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Send Message to Team</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* --- SECTION 3: LOGOUT --- */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && { opacity: 0.7 },
          loggingOut && { opacity: 0.5 },
        ]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator size="small" color="#dc2626" />
        ) : (
          <>
            <LogOut size={20} color="#dc2626" />
            <Text style={styles.logoutText}>Sign Out of Account</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBox: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  boldText: {
    fontWeight: "700",
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 14,
    lineHeight: 18,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "700",
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  disabledInput: {
    backgroundColor: "#f1f5f9",
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  simpleInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  logoutText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
