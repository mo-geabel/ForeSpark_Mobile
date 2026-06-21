import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/axios";
import { AuthContextType, User } from "../types/auth";

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  // ✅ UPDATED: validate token with backend
  const loadAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (!storedToken || !storedUser) {
        logout();
        return;
      }

      // 🔐 Validate token
      const res = await api.get("/auth/user", {
        headers: {
          "x-auth-token": storedToken,
        },
      });

      setToken(storedToken);
      setUser(res.data); // always trust backend, not local storage
    } catch (err) {
      console.log("Token invalid or expired");
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });

    await AsyncStorage.setItem("token", res.data.token);
    await AsyncStorage.setItem("user", JSON.stringify(res.data.user));

    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await api.post("/auth/register", {
      fullName,
      email,
      password,
    });

    await AsyncStorage.setItem("token", res.data.token);
    await AsyncStorage.setItem("user", JSON.stringify(res.data.user));

    setToken(res.data.token);
    setUser(res.data.user);
  };

  const loginWithGoogle = async (idToken: string) => {
    if (idToken === "mock_google_id_token") {
      const mockUser = {
        id: "google_mock_user_123",
        fullName: "Developer Google User",
        email: "dev.google@forestspark.ai",
        role: "user" as const,
      };
      const mockToken = "mock_jwt_token_for_expo_go_testing";

      await AsyncStorage.setItem("token", mockToken);
      await AsyncStorage.setItem("user", JSON.stringify(mockUser));

      setToken(mockToken);
      setUser(mockUser);
      return;
    }

    const res = await api.post("/auth/google", { idToken });

    await AsyncStorage.setItem("token", res.data.token);
    await AsyncStorage.setItem("user", JSON.stringify(res.data.user));

    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, loginWithGoogle, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
