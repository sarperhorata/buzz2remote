import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, clearToken, type User } from "./api";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await getToken();
      if (token) {
        const storedUser = await SecureStore.getItemAsync("user_data");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch {
      // Token invalid or expired
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    await clearToken();
    await SecureStore.deleteItemAsync("user_data");
    setUser(null);
  }

  function handleSetUser(u: User | null) {
    setUser(u);
    if (u) {
      SecureStore.setItemAsync("user_data", JSON.stringify(u));
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser: handleSetUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
