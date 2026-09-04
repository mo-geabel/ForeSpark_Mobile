import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../utils/config";

let tokenGetter: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (getter: (() => Promise<string | null>) | null) => {
  tokenGetter = getter;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes — AI prediction across 9 tiles
});

api.interceptors.request.use(
  async (config) => {
    let token: string | null = null;

    // 1. Dynamic token refresh if Clerk session is active
    if (tokenGetter) {
      try {
        token = await tokenGetter();
        if (token) {
          await AsyncStorage.setItem("token", token);
        }
      } catch (err) {
        // fallback to AsyncStorage
      }
    }

    // 2. Fallback to stored token
    if (!token) {
      token = await AsyncStorage.getItem("token");
    }

    // 3. User email for account linking / sync
    let userEmail = "";
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        userEmail = user.email || "";
      }
    } catch {}

    if (token) {
      config.headers["x-auth-token"] = token;
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (userEmail) {
      config.headers["x-user-email"] = userEmail;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
