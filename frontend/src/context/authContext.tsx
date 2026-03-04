import { createContext, useContext, useState, useEffect } from "react";
export type Role = "patient" | "clinician" | "admin";

type AuthContextType = {
  session: any;
  isAuthenticated: boolean;
  //   login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSession: (session: any) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("authSession");
    if (stored) {
      const parsed = JSON.parse(stored);
      setSession(parsed);
      setIsAuthenticated(true);
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
    localStorage.removeItem("authSession");
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated,
        // login,
        logout,
        setSession,
        setIsAuthenticated,
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
