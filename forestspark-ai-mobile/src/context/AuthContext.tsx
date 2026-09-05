import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/clerk-expo";
import api, { setTokenGetter } from "../api/axios";
import { AuthContextType, User } from "../types/auth";

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, getToken, signOut, isLoaded: isClerkLoaded } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep axios dynamic token getter synchronized with Clerk session
  useEffect(() => {
    if (isSignedIn && isClerkLoaded) {
      setTokenGetter(async () => {
        try {
          const fresh = await getToken();
          if (fresh) {
            setToken(fresh);
          }
          return fresh;
        } catch {
          return null;
        }
      });
    } else {
      setTokenGetter(null);
    }
  }, [isSignedIn, isClerkLoaded, getToken]);

  const refreshUser = async () => {
    try {
      const activeToken = token || (await AsyncStorage.getItem("token"));
      if (!activeToken) return;

      const res = await api.get("/auth/user", {
        headers: { "x-auth-token": activeToken },
      });

      if (res.data) {
        if (res.data.isPaused) {
          await logout();
          return;
        }

        const updatedUser: User = {
          id: res.data._id || res.data.id || user?.id || "",
          fullName: res.data.fullName || user?.fullName || "User",
          email: res.data.email || user?.email || "",
          role: res.data.role || "user",
          isPaused: !!res.data.isPaused,
        };

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err) {
      console.log("Could not refresh user profile:", err);
    }
  };

  // Sync Clerk authentication state
  useEffect(() => {
    const syncAuthState = async () => {
      if (!isClerkLoaded) return;

      if (isSignedIn && clerkUser) {
        try {
          const sessionToken = await getToken();
          const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress || "";
          const fullName =
            [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
            clerkUser.username ||
            "User";

          let appUser: User = {
            id: clerkUser.id,
            fullName,
            email: primaryEmail,
            role: "user",
            isPaused: false,
          };

          if (sessionToken) {
            await AsyncStorage.setItem("token", sessionToken);
            setToken(sessionToken);

            // Fetch true role and pause status from backend
            try {
              const res = await api.get("/auth/user", {
                headers: { 
                  "x-auth-token": sessionToken,
                  "Authorization": `Bearer ${sessionToken}`,
                  "x-user-email": primaryEmail
                },
              });
              if (res.data) {
                if (res.data.isPaused) {
                  await signOut();
                  await AsyncStorage.multiRemove(["token", "user"]).catch(() => {});
                  setUser(null);
                  setToken(null);
                  setLoading(false);
                  return;
                }

                appUser = {
                  id: res.data._id || clerkUser.id,
                  fullName: res.data.fullName || fullName,
                  email: res.data.email || primaryEmail,
                  role: res.data.role || "user",
                  isPaused: !!res.data.isPaused,
                };
              }
            } catch (profileErr: any) {
              console.log("Could not fetch backend profile on Clerk sync:", profileErr?.message || profileErr);
            }
          }
          await AsyncStorage.setItem("user", JSON.stringify(appUser));
          setUser(appUser);
        } catch (err) {
          console.error("Error syncing Clerk auth session:", err);
        }
      } else {
        // Check for local legacy token if not signed in through Clerk
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(parsedUser);

            // Background sync latest role and pause status
            api.get("/auth/user", { headers: { "x-auth-token": storedToken } })
              .then(async (res) => {
                if (res.data) {
                  if (res.data.isPaused) {
                    await logout();
                    return;
                  }
                  const refreshed: User = {
                    id: res.data._id || parsedUser.id,
                    fullName: res.data.fullName || parsedUser.fullName,
                    email: res.data.email || parsedUser.email,
                    role: res.data.role || "user",
                    isPaused: !!res.data.isPaused,
                  };
                  await AsyncStorage.setItem("user", JSON.stringify(refreshed));
                  setUser(refreshed);
                }
              })
              .catch(() => {});
          } catch {
            await logout();
          }
        } else {
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    syncAuthState();
  }, [isSignedIn, clerkUser, isClerkLoaded]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    await AsyncStorage.setItem("token", res.data.token);
    await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { fullName, email, password });
    await AsyncStorage.setItem("token", res.data.token);
    await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await api.post("/auth/google", { idToken });
    await AsyncStorage.setItem("token", res.data.token);
    await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const updateProfile = async (fullName: string, phoneNumber: string) => {
    const res = await api.put("/auth/profile", { fullName, phoneNumber });
    if (res.data && res.data.user) {
      const updatedUser = res.data.user;
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const logout = async () => {
    try {
      if (isSignedIn) {
        await signOut();
      }
    } catch (err) {
      console.error("SignOut error:", err);
    }
    setTokenGetter(null);
    await AsyncStorage.multiRemove(["token", "user"]).catch(() => {});
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, loginWithGoogle, updateProfile, logout, refreshUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
