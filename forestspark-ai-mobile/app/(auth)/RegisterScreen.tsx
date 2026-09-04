import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import Input from "../../components/input";
import api from "../../src/api/axios";
import { useAuth } from "../../src/context/AuthContext";
import GoogleButton from "../../components/GoogleButton";
import { signInWithGoogle } from "../../src/utils/googleAuth";
import PolicyModal from "../../components/PolicyModal";

import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const { loginWithGoogle } = useAuth();
  const { signUp, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Policy state
  const [policy, setPolicy] = useState<{ title: string; content: string; requireAcceptance: boolean; lastUpdated?: string } | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await api.get("/policies");
        if (res.data) {
          setPolicy(res.data);
        }
      } catch (err) {
        console.log("Could not load policy in RegisterScreen:", err);
      }
    };
    fetchPolicy();
  }, []);


  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (policy?.requireAcceptance && !agreedToPolicy) {
      setError(`Please agree to the ${policy?.title || "Terms of Service & Privacy Policy"}`);
      return;
    }

    setLoading(true);
    setError("");

    // 1. Try Clerk Sign-Up
    if (isLoaded && signUp) {
      try {
        const [firstName, ...rest] = name.trim().split(" ");
        const lastName = rest.join(" ");

        await signUp.create({
          emailAddress: email,
          password,
          firstName: firstName || name,
          lastName: lastName || undefined,
        });

        // Send email verification code
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
        setInfo(`Verification code sent to ${email}`);
        setLoading(false);
        return;
      } catch (clerkErr: any) {
        setError(clerkErr?.errors?.[0]?.message || "Registration failed");
        setLoading(false);
        return;
      }
    }

    // 2. Fallback to MongoDB Backend registration
    try {
      await api.post("/auth/register", { fullName: name, email: email, password: password });
      setPendingVerification(false);
      setRegistrationSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyCode = async () => {
    if (!code) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");

    if (isLoaded && signUp) {
      try {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code,
        });

        if (completeSignUp.status === "complete") {
          setPendingVerification(false);
          setRegistrationSuccess(true);
          return;
        } else {
          setError("Verification could not be completed. Please try again.");
        }
      } catch (err: any) {
        setError(err?.errors?.[0]?.message || "Invalid verification code");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (policy?.requireAcceptance && !agreedToPolicy) {
      setError(`Please agree to the ${policy?.title || "Terms of Service & Privacy Policy"} before continuing with Google`);
      return;
    }

    try {
      setGoogleLoading(true);
      setError("");

      // 1. First try Clerk OAuth flow
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
        setError(err?.errors?.[0]?.message || err?.message || "Google registration failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {registrationSuccess ? "Registration Successful! 🎉" : pendingVerification ? "Verify Email" : "Create Account"}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info && !registrationSuccess ? <Text style={styles.info}>{info}</Text> : null}

      {registrationSuccess ? (
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <Text style={{ fontSize: 14, color: "#475569", textAlign: "center", marginBottom: 16, lineHeight: 22 }}>
            Your account for <Text style={{ fontWeight: "700", color: "#0f172a" }}>{email}</Text> has been created successfully.
          </Text>
          <Text style={{ fontSize: 13, color: "#059669", fontWeight: "600", textAlign: "center", marginBottom: 24 }}>
            Please click below to proceed to the login page and sign in with your email and password.
          </Text>
          <Pressable
            style={[styles.button, { width: "100%" }]}
            onPress={() => router.replace("/LoginScreen")}
          >
            <Text style={styles.buttonText}>Click to Login</Text>
          </Pressable>
        </View>
      ) : pendingVerification ? (
        <>
          <Input
            placeholder="6-digit Verification Code"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />

          <Pressable
            style={styles.button}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Complete</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
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
          <Input
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {/* Dynamic Policy Agreement Checkbox */}
          <Pressable
            style={styles.policyRow}
            onPress={() => setAgreedToPolicy(!agreedToPolicy)}
          >
            <View style={[styles.checkbox, agreedToPolicy && styles.checkboxChecked]}>
              {agreedToPolicy && <Check size={12} color="#fff" strokeWidth={3.5} />}
            </View>
            <Text style={styles.policyText}>
              I have read and agree to the{" "}
              <Text
                style={styles.policyLink}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowPolicyModal(true);
                }}
              >
                {policy?.title || "Terms of Service & Privacy Policy"}
              </Text>
            </Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={handleRegister}
            disabled={loading || googleLoading}
          >
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

          <GoogleButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            text="Register with Google"
          />

          {/* Google Sign-in / Sign-up Policy Disclaimer */}
          <Text style={styles.googleDisclaimer}>
            By continuing with Google, you agree to our{" "}
            <Text
              style={styles.policyLink}
              onPress={() => setShowPolicyModal(true)}
            >
              {policy?.title || "Terms of Service & Privacy Policy"}
            </Text>
          </Text>
        </>
      )}

      <Pressable onPress={() => router.back()} disabled={loading || googleLoading}>
        <Text style={styles.link}>Back to Login</Text>
      </Pressable>

      {/* Dynamic Policy Modal */}
      <PolicyModal
        visible={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        policy={policy}
      />
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
  info: {
    color: "#059669",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  policyLink: {
    color: "#059669",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  googleDisclaimer: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 12,
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

