import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shareLocation } from "@/src/services/authServices";

export default function ShareLocationModal({ visible, onClose }: { 
  visible: boolean; 
  onClose: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await shareLocation();
      setMessage("Location shared successfully ✅");
      console.log("Response:", res);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setMessage("Failed to share location ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Ionicons name="navigate-circle-outline" size={56} color="#007aff" />
          <Text style={styles.title}>Share Your Location</Text>
          <Text style={styles.subtitle}>
            Allow the app to access your location so we can show nearby users or connections.
          </Text>

          {message && <Text style={styles.message}>{message}</Text>}

          {loading ? (
            <ActivityIndicator size="small" color="#007aff" />
          ) : (
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#007aff" }]}
                onPress={handleShare}
              >
                <Text style={styles.buttonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#ccc" }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: "#333" }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
    color: "#111",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  message: {
    marginBottom: 12,
    fontSize: 14,
    color: "#333",
  },
});
