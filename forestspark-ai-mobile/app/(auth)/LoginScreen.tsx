import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { router } from "expo-router";
import Input from "../../components/input";
import GoogleButton from "../../components/GoogleButton";
import { signInWithGoogle } from "../../src/utils/googleAuth";
import PolicyModal from "../../components/PolicyModal";
import api from "../../src/api/axios";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Policy state
  const [policy, setPolicy] = useState<{ title: string; content: string; requireAcceptance: boolean; lastUpdated?: string } | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await api.get("/policies");
        if (res.data) {
          setPolicy(res.data);
        }
      } catch (err) {
        console.log("Could not load policy in LoginScreen:", err);
      }
    };
    fetchPolicy();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    // 1. Try Clerk Sign-In
    if (isLoaded && signIn) {
      try {
        const completeSignIn = await signIn.create({
          identifier: email,
          password,
        });

        if (completeSignIn.status === "complete") {
          await setActive({ session: completeSignIn.createdSessionId });
          setLoading(false);
          return;
        }
      } catch (clerkErr: any) {
        const clerkMsg = clerkErr?.errors?.[0]?.message;
        if (clerkMsg) {
          console.log("Clerk auth notice:", clerkMsg);
        }
      }
    }

    // 2. Fallback to MongoDB Backend Login
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      // 1. First try Clerk OAuth flow (works on Expo Go via web browser session)
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow();
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        return;
      }

      // 2. Fallback to legacy Google Sign-In
      const token = await signInWithGoogle(async (mockToken) => {
        await loginWithGoogle(mockToken);
      });

      if (token) {
        await loginWithGoogle(token);
      }
    } catch (err: any) {
      if (err?.code !== "12501" && err?.message !== "Sign in cancelled") {
        setError(err?.errors?.[0]?.message || err?.message || "Google login failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>ForestSpark AI</Text>
          <Text style={styles.subtitle}>Login</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

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

          <Pressable
            onPress={() => router.push("/ForgotPasswordScreen" as any)}
            style={styles.forgotPassBtn}
            disabled={loading || googleLoading}
          >
            <Text style={styles.forgotPassText}>Forgot Password?</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={handleLogin} disabled={loading || googleLoading}>

            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleButton onPress={handleGoogleSignIn} loading={googleLoading} />

          {/* Google Policy Disclaimer */}
          <Text style={styles.googleDisclaimer}>
            By continuing with Google, you agree to our{" "}
            <Text
              style={styles.policyLink}
              onPress={() => setShowPolicyModal(true)}
            >
              {policy?.title || "Terms of Service & Privacy Policy"}
            </Text>
          </Text>

          <Pressable onPress={() => router.push("/RegisterScreen")} disabled={loading || googleLoading}>
            <Text style={styles.link}>Don't have an account? Register</Text>
          </Pressable>

          <Pressable onPress={() => setShowPolicyModal(true)} disabled={loading || googleLoading}>
            <Text style={styles.policyFooterLink}>📜 Terms of Service & Privacy Policy</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/DocumentationScreen")} disabled={loading || googleLoading}>
            <Text style={styles.docsLink}>📄 View Model Documentation</Text>
          </Pressable>
        </View>

        {/* Dynamic Policy Modal */}
        <PolicyModal
          visible={showPolicyModal}
          onClose={() => setShowPolicyModal(false)}
          policy={policy}
        />
      </View>
    </TouchableWithoutFeedback>
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
  forgotPassBtn: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 4,
  },
  forgotPassText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
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
  googleDisclaimer: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  policyLink: {
    color: "#059669",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  policyFooterLink: {
    marginTop: 14,
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#059669",
  },
  docsLink: {
    marginTop: 10,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});

