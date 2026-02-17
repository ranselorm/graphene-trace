import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Role = "patient" | "clinician" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type Session = {
  user: SessionUser;
  token: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  session: Session | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "gtlb.session.v1";

//  mock users for now
//  swap `mockLogin` with a real API call to Django.

const MOCK_USERS: Array<{
  email: string;
  password: string;
  user: SessionUser;
}> = [
  {
    email: "patient@demo.com",
    password: "@Password123",
    user: {
      id: "u_pat_001",
      email: "patient@demo.com",
      name: "Demo Patient",
      role: "patient",
    },
  },
  {
    email: "clinician@demo.com",
    password: "@Password123",
    user: {
      id: "u_cli_001",
      email: "clinician@demo.com",
      name: "Demo Clinician",
      role: "clinician",
    },
  },
  {
    email: "admin@demo.com",
    password: "@Password123",
    user: {
      id: "u_adm_001",
      email: "admin@demo.com",
      name: "Demo Admin",
      role: "admin",
    },
  },
];

function safeParseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.user?.role || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function mockLogin(input: LoginInput): Promise<Session> {
  const match = MOCK_USERS.find(
    (u) =>
      u.email.toLowerCase() === input.email.toLowerCase() &&
      u.password === input.password,
  );

  // Small delay so loading states feel real in UI
  await new Promise((r) => setTimeout(r, 350));

  if (!match) {
    throw new Error("Invalid email or password.");
  }

  return {
    user: match.user,
    token: `mock-token-${match.user.id}-${Date.now()}`,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    safeParseSession(localStorage.getItem(STORAGE_KEY)),
  );

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const login = async (input: LoginInput) => {
    const newSession = await mockLogin(input);
    setSession(newSession);
  };

  const logout = () => setSession(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      login,
      logout,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
