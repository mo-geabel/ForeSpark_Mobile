import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import Input from "../../components/input";
import { useSignIn } from "@clerk/clerk-expo";

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify_code" | "set_password">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Step 1: Send Reset Code to Email
  const handleRequestReset = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    if (!isLoaded || !signIn) return;

    try {
      setLoading(true);
      setError("");

      const signInAttempt = await signIn.create({
        identifier: email,
      });

      const resetFactor = signInAttempt.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === "reset_password_email_code"
      );

      if (resetFactor && "emailAddressId" in resetFactor) {
        await signIn.prepareFirstFactor({
          strategy: "reset_password_email_code",
          emailAddressId: (resetFactor as any).emailAddressId,
        });
        setStep("verify_code");
        setInfo(`Reset code sent to ${email}`);
      } else {
        const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
          (factor: any) => factor.strategy === "email_code"
        );
        if (emailCodeFactor && "emailAddressId" in emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: (emailCodeFactor as any).emailAddressId,
          });
          setStep("verify_code");
          setInfo(`Verification code sent to ${email}`);
        } else {
          setError("Password reset is not available for this account. Please try signing in with Google.");
        }
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Check Code is Entered
  const handleVerifyCode = () => {
    if (!code || code.trim().length < 4) {
      setError("Please enter the valid verification code");
      return;
    }
    setError("");
    setInfo("Code entered. Please set and confirm your new password.");
    setStep("set_password");
  };

  // Step 3: Set and Confirm New Password
  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill both password fields");
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

    if (!isLoaded || !signIn) return;

    try {
      setLoading(true);
      setError("");

      let result;
      try {
        result = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code,
          password,
        });
      } catch (firstErr: any) {
        result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code,
        });
      }

      if (result && result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError("Password reset incomplete");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Invalid reset code or expired session");
      if (err?.errors?.[0]?.code === "form_code_incorrect") {
        setStep("verify_code");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === "request" && "Enter your email to receive a reset code"}
          {step === "verify_code" && "Enter the 6-digit code received by email"}
          {step === "set_password" && "Enter and confirm your new password"}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        {step === "request" && (
          <>
            <Input
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Pressable
              style={styles.button}
              onPress={handleRequestReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </Pressable>
          </>
        )}

        {step === "verify_code" && (
          <>
            <Input
              placeholder="6-digit Reset Code"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />

            <Pressable
              style={styles.button}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Verify Code</Text>
            </Pressable>
          </>
        )}

        {step === "set_password" && (
          <>
            <Input
              placeholder="New Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Input
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Pressable
              style={styles.button}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset & Sign In</Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.back()} disabled={loading}>
          <Text style={styles.link}>← Back to Login</Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    color: "#059669",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  info: {
    color: "#059669",
    fontWeight: "600",
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
  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#059669",
    fontWeight: "600",
  },
});
