import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { router } from "expo-router";
import GoogleButton from "../../components/GoogleButton";
import { signInWithGoogle } from "../../src/utils/googleAuth";
import PolicyModal from "../../components/PolicyModal";
import api from "../../src/api/axios";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import {
  Flame,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  FileText,
  UserPlus,
  Sparkles,
} from "lucide-react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { user, login, loginWithGoogle } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Automatically navigate into the app as soon as a user session is active
  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user]);

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
          router.replace("/(tabs)");
          return;
        }
      } catch (clerkErr: any) {
        const clerkMsg = clerkErr?.errors?.[0]?.message;
        const clerkCode = clerkErr?.errors?.[0]?.code;
        if (clerkMsg) {
          console.log("Clerk auth notice:", clerkMsg);
        }
        if (clerkCode === "strategy_for_user_invalid" || clerkMsg?.toLowerCase().includes("verification strategy")) {
          setError("This account is linked to Google. Please tap 'Continue with Google' below, or use 'Forgot password?' to create a password.");
          setLoading(false);
          return;
        }
        if (clerkCode === "session_exists" || clerkCode === "identifier_already_signed_in") {
          setLoading(false);
          router.replace("/(tabs)");
          return;
        }
      }
    }

    // 2. Fallback to MongoDB Backend Login
    try {
      await login(email, password);
      router.replace("/(tabs)");
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
      const redirectUrl = Linking.createURL("/oauth-native-callback", { scheme: "forestsparkaimobile" });
      const { createdSessionId, setActive: setOAuthActive, signIn: oAuthSignIn } = await startOAuthFlow({ redirectUrl });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace("/(tabs)");
        return;
      }

      if (oAuthSignIn?.createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: oAuthSignIn.createdSessionId });
        router.replace("/(tabs)");
        return;
      }

      // If session is already created / signed in
      if (isLoaded && signIn?.status === "complete") {
        router.replace("/(tabs)");
        return;
      }

      // 2. Fallback to legacy Google Sign-In
      const token = await signInWithGoogle(async (mockToken) => {
        await loginWithGoogle(mockToken);
        router.replace("/(tabs)");
      });

      if (token) {
        await loginWithGoogle(token);
        router.replace("/(tabs)");
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
      <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Brand Logo */}
            <View style={styles.brandIconContainer}>
              <View style={styles.logoCard}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={styles.title}>ForeSpark AI</Text>
            <Text style={styles.subtitle}>Welcome back, sign in to continue</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input with Mail Icon */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Mail size={20} color="#059669" strokeWidth={2} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input with Lock Icon & Eye Toggle */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Lock size={20} color="#059669" strokeWidth={2} />
              </View>
              <TextInput
                style={[styles.textInput, { paddingRight: 48 }]}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#94a3b8" strokeWidth={2} />
                ) : (
                  <Eye size={20} color="#94a3b8" strokeWidth={2} />
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/ForgotPasswordScreen" as any)}
              style={styles.forgotPassBtn}
              disabled={loading || googleLoading}
            >
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </Pressable>

            {/* Login Button with LogIn Icon */}
            <Pressable
              style={[styles.button, (loading || googleLoading) && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <LogIn size={20} color="#ffffff" strokeWidth={2.4} />
                  <Text style={styles.buttonText}>Login</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
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

            {/* Register Link with UserPlus Icon */}
            <Pressable
              onPress={() => router.push("/RegisterScreen")}
              disabled={loading || googleLoading}
              style={styles.linkRow}
            >
              <UserPlus size={16} color="#059669" strokeWidth={2} />
              <Text style={styles.link}>Don't have an account? Register</Text>
            </Pressable>

            {/* Policy Link with ShieldCheck Icon */}
            <Pressable
              onPress={() => setShowPolicyModal(true)}
              disabled={loading || googleLoading}
              style={styles.footerLinkRow}
            >
              <ShieldCheck size={15} color="#059669" strokeWidth={2} />
              <Text style={styles.policyFooterLink}>Terms of Service & Privacy Policy</Text>
            </Pressable>

            {/* Documentation Link with FileText Icon */}
            <Pressable
              onPress={() => router.push("/DocumentationScreen")}
              disabled={loading || googleLoading}
              style={styles.footerLinkRow}
            >
              <FileText size={15} color="#64748b" strokeWidth={2} />
              <Text style={styles.docsLink}>View Model Documentation</Text>
            </Pressable>

            {/* Overview / Launching Welcome Link */}
            <Pressable
              onPress={() => router.push("/WelcomeScreen")}
              disabled={loading || googleLoading}
              style={styles.footerLinkRow}
            >
              <Sparkles size={15} color="#059669" strokeWidth={2} />
              <Text style={styles.policyFooterLink}>ForeSpark AI Features & Overview</Text>
            </Pressable>
          </View>
        </ScrollView>

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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  brandIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoCard: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  logoImage: {
    width: 74,
    height: 74,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 26,
    color: "#64748b",
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    height: 52,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingLeft: 46,
    paddingRight: 16,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  forgotPassBtn: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginBottom: 12,
    paddingVertical: 4,
  },
  forgotPassText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  button: {
    backgroundColor: "#059669",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  googleDisclaimer: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  policyLink: {
    color: "#059669",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  link: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "600",
  },
  footerLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  policyFooterLink: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
  },
  docsLink: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },
});
