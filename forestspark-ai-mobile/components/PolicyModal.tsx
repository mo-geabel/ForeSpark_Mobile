import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ShieldCheck, X } from "lucide-react-native";
import api from "../src/api/axios";

interface PolicyData {
  title: string;
  content: string;
  requireAcceptance?: boolean;
  lastUpdated?: string;
}

interface PolicyModalProps {
  visible: boolean;
  onClose: () => void;
  policy?: PolicyData | null;
}

export default function PolicyModal({ visible, onClose, policy: initialPolicy }: PolicyModalProps) {
  const [policy, setPolicy] = useState<PolicyData | null>(initialPolicy || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchPolicy();
    }
  }, [visible]);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await api.get("/policies");
      if (res.data) {
        setPolicy(res.data);
      }
    } catch (err) {
      console.log("Error loading policy in modal:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBadge}>
                <ShieldCheck size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {policy?.title || "Platform Policies"}
                </Text>
                {policy?.lastUpdated && (
                  <Text style={styles.subtitle}>
                    Last updated: {new Date(policy.lastUpdated).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading && !policy ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Loading policies...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.contentText}>
                {policy?.content ||
                  "Please review the Terms of Service and Privacy Policy before proceeding."}
              </Text>
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.acceptBtn} onPress={onClose}>
              <Text style={styles.acceptBtnText}>I Understand & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    minHeight: "50%",
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748b",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  acceptBtn: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
