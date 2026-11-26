import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { User } from "../models";
import { AuthActionResult, AuthService } from "../services";

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (newUser: User) => Promise<AuthActionResult>;
  changePassword: (oldPass: string, newPass: string) => Promise<AuthActionResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const result = await AuthService.login(email, password);
    if (result.ok && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const register = useCallback((newUser: User) => AuthService.register(newUser), []);

  const changePassword = useCallback(
    async (oldPass: string, newPass: string) => {
      if (!user) return { ok: false, error: "Sesión no iniciada." };
      const result = await AuthService.changePassword(user, oldPass, newPass);
      if (result.ok && result.user) {
        setUser(result.user);
      }
      return result;
    },
    [user],
  );

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, login, register, changePassword, logout }),
    [user, login, register, changePassword, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider no disponible");
  return value;
}
