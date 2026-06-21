import { Alert, Platform } from "react-native";
import { GOOGLE_WEB_CLIENT_ID } from "./config";

let GoogleSignin: any = null;
let isGoogleSigninSupported = false;

try {
  // Dynamically require the native module to prevent crashes on Expo Go
  if (Platform.OS !== "web") {
    GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
    isGoogleSigninSupported = !!GoogleSignin;
  }
} catch (error) {
  console.log("Google Sign-In native module not available (expected in Expo Go)");
}

export const isGoogleSupported = () => {
  return isGoogleSigninSupported;
};

export const configureGoogle = () => {
  if (isGoogleSigninSupported && GoogleSignin && GOOGLE_WEB_CLIENT_ID) {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
      });
    } catch (e) {
      console.error("Failed to configure Google Sign-In:", e);
    }
  }
};

const signInWithGoogleNative = async (): Promise<string | null> => {
  if (!isGoogleSigninSupported || !GoogleSignin) {
    throw new Error("Native Google Sign-In is not supported in this environment");
  }

  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken || response.idToken;

  if (!idToken) {
    throw new Error("No ID token returned from Google");
  }
  return idToken;
};

export const signInWithGoogle = async (
  onMockSuccess: (mockToken: string) => Promise<void>
): Promise<string | null> => {
  if (isGoogleSigninSupported && GoogleSignin) {
    configureGoogle();
    return await signInWithGoogleNative();
  } else {
    // Fallback for Expo Go / Development testing
    return new Promise((resolve, reject) => {
      Alert.alert(
        "Expo Go Environment Detected",
        "Google Sign-In native SDK is not supported in Expo Go.\n\nWould you like to sign in with a Mock Google Account for testing?",
        [
          {
            text: "Cancel",
            onPress: () => reject(new Error("Sign in cancelled")),
            style: "cancel",
          },
          {
            text: "Yes, Use Mock Profile",
            onPress: async () => {
              try {
                await onMockSuccess("mock_google_id_token");
                resolve(null); // Managed via mock success callback
              } catch (e) {
                reject(e);
              }
            },
          },
        ]
      );
    });
  }
};
