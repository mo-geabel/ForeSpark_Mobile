import { Stack, Redirect } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "../src/utils/tokenCache";
import * as WebBrowser from "expo-web-browser";

// Tells the web browser to immediately intercept and close the auth popup on return
WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;


if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

function RootStack() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href="/(tabs)" />;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <RootStack />
      </AuthProvider>
    </ClerkProvider>
  );
}

