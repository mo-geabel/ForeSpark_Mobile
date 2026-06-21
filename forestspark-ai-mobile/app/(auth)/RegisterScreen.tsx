import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import Input from "../../components/input";
import api from "../../src/api/axios";
import { useAuth } from "../../src/context/AuthContext";
import GoogleButton from "../../components/GoogleButton";
import { signInWithGoogle } from "../../src/utils/googleAuth";

export default function RegisterScreen() {
  const { loginWithGoogle } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/register", { fullName: name, email: email, password: password });
      router.replace("/LoginScreen");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      const token = await signInWithGoogle(async (mockToken) => {
        await loginWithGoogle(mockToken);
      });

      if (token) {
        await loginWithGoogle(token);
      }
    } catch (err: any) {
      if (err?.code !== "12501" && err?.message !== "Sign in cancelled") {
        setError(err?.response?.data?.message || err?.message || "Google registration failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Input placeholder="Name" value={name} onChangeText={setName} />
      <Input
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleRegister} disabled={loading || googleLoading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </Pressable>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleButton onPress={handleGoogleSignIn} loading={googleLoading} text="Register with Google" />

      <Pressable onPress={() => router.back()} disabled={loading || googleLoading}>
        <Text style={styles.link}>Back to Login</Text>
      </Pressable>
    </View>
  );
  
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    color: "#059669",
  },
  subtitle: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E4E4E7",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#71717A",
    fontSize: 14,
  },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#059669",
  },
});

