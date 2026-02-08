import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

// shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function roleHome(role: "patient" | "clinician" | "admin") {
  if (role === "patient") return "/patient/dashboard";
  if (role === "clinician") return "/clinician";
  return "/admin";
}

export function LoginPage() {
  const { login, session, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from as string | undefined;

  const [email, setEmail] = useState("patient@demo.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoHints = useMemo(
    () => [
      { label: "Patient", email: "patient@demo.com" },
      { label: "Clinician", email: "clinician@demo.com" },
      { label: "Admin", email: "admin@demo.com" },
    ],
    [],
  );

  // If someone is already logged in and reaches /login, push them out to their portal.
  React.useEffect(() => {
    if (isAuthenticated && session) {
      navigate(roleHome(session.user.role), { replace: true });
    }
  }, [isAuthenticated, session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });

      // After login, go where they intended (if it matches their role) or to role home.
      // For now, keep it simple: always go to role home (prevents confusing cross-role deep links).
      // We can enhance later to validate the "from" path belongs to their role.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = from;

      // session state updates async; easiest is navigate in a microtask
      queueMicrotask(() => {
        // We rely on updated auth state
        // If it hasn't updated yet, a second navigation will happen via RequireAuth/IndexRedirect anyway.
        navigate("/", { replace: true });
      });
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen text-zinc-50 flex items-center justify-center p-6">
      <div className="mx-auto container">
        <div className="flex flex-col-reverse md:flex-row justify-between items-center w-full gap-y-4">
          <div className="flex flex-col justify-center items-center flex-1">
            <Card className="border-zinc-800 md:w-4/6 w-full">
              <CardHeader>
                <CardTitle className="text-3xl">
                  Welcome back to Graphene Trace
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Using demo accounts for now. Backend auth comes later.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-900 bg-red-950/40">
                    <AlertTitle>Login failed</AlertTitle>
                    <AlertDescription className="text-red-100/90">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="bg-zinc-950 border-zinc-800 text-zinc-50"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-200">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      className="bg-zinc-950 border-zinc-800 text-zinc-50"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>

                <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="text-xs text-zinc-400 mb-2">
                    Demo accounts
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {demoHints.map((d) => (
                      <Button
                        key={d.email}
                        type="button"
                        variant="secondary"
                        className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
                        onClick={() => {
                          setEmail(d.email);
                          setPassword("password");
                          setError(null);
                        }}
                      >
                        {d.label}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Password for all demo accounts:{" "}
                    <span className="text-zinc-300">password</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="text-xs text-zinc-500">
                Tip: Once you sign in, you’ll land in the portal based on your
                role.
              </CardFooter>
            </Card>
          </div>

          <div className="md:flex-1 bg-yellow-300 md:h-190 h-100 flex w-full">
            {/* <img
              src="https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aGVhbHRoY2FyZXxlbnwwfDF8MHx8fDA%3D"
              alt=""
              className="w-full h-full object-cover"
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
