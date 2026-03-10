import { createContext, useContext, useState, useEffect } from "react";
export type Role = "patient" | "clinician" | "admin";

type AuthContextType = {
  session: any;
  isAuthenticated: boolean;
  logout: () => void;
  setSession: (session: any) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("authSession");
    const storedToken = localStorage.getItem("accessToken");

    if (stored) {
      const parsed = JSON.parse(stored);
      setSession(parsed);
      setIsAuthenticated(true);
    }
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  //   const login = async (email: string, password: string) => {
  //     const response = await loginAPI(email, password);
  //     setSession(response);
  //     setIsAuthenticated(true);
  //     // Persist to localStorage
  //     localStorage.setItem("authSession", JSON.stringify(response));
  //   };

  const logout = () => {
    setSession(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    localStorage.removeItem("authSession");
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated,
        accessToken,
        logout,
        setSession,
        setIsAuthenticated,
        setAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
