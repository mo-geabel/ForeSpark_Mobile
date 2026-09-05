import { Stack, Redirect } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "../src/utils/tokenCache";
import * as WebBrowser from "expo-web-browser";
import * as SplashScreen from "expo-splash-screen";

// Prevent the splash screen from auto-hiding before auth state and assets are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// Tells the web browser to immediately intercept and close the auth popup on return
WebBrowser.maybeCompleteAuthSession();

const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_live_Y2xlcmsuZm9yZXNwYXJrLm5ldCQ";

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="Analyse" options={{ headerShown: false }} />
          <Stack.Screen name="DocumentationScreen" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ClerkProvider>
  );
}

