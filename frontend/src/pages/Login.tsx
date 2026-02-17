import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Icon } from "@iconify/react";

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

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Icon icon="mdi:check-circle" className="text-green-700" />
      ) : (
        <Icon icon="mdi:circle-outline" className="text-zinc-500" />
      )}
      <span className={met ? "text-green-700" : "text-zinc-500"}>{text}</span>
    </div>
  );
}

export function LoginPage() {
  const { login, session, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from as string | undefined;

  const [email, setEmail] = useState("patient@demo.com");
  const [password, setPassword] = useState("@Password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //password validation
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [password]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

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
    <div className="min-h-screen w-screen text-zinc-800 flex items-center justify-center p-6">
      <div className="mx-auto container">
        <div className="flex flex-col-reverse md:flex-row justify-between items-center w-full gap-y-4">
          <div className="flex-1 flex flex-col md:h-190 justify-between">
            {/* header */}
            <div className="flex items-end cursor-pointer w-max">
              <Icon icon="logos:active-campaign-icon" fontSize={45} />
              <span className="text-zinc-800 font-bold text-xs">Graphene</span>
            </div>
            <div className="flex flex-col justify-center items-center">
              <Card className="border-zinc-300 md:w-4/6 w-full shadow-none">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">
                    Welcome back to Graphene Trace
                  </CardTitle>
                  <CardDescription className="text-zinc-800">
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
                      <Label htmlFor="email" className="text-zinc-800">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className="border-zinc-300 text-zinc-800"
                        value={email}
                        onChange={(e: any) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-zinc-800">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="border-zinc-300  text-zinc-800 pr-10"
                          value={password}
                          onChange={(e: any) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-zinc-700 text-sm cursor-pointer"
                        >
                          {showPassword ? (
                            <Icon icon="mdi-light:eye-off" />
                          ) : (
                            <Icon icon="mdi-light:eye" />
                          )}
                        </button>
                      </div>

                      {/* Password Requirements */}
                      <div className="mt-2 space-y-1.5 text-xs">
                        <PasswordRequirement
                          met={passwordValidation.minLength}
                          text="At least 8 characters"
                        />
                        <PasswordRequirement
                          met={passwordValidation.hasUppercase}
                          text="One uppercase letter"
                        />
                        <PasswordRequirement
                          met={passwordValidation.hasLowercase}
                          text="One lowercase letter"
                        />
                        <PasswordRequirement
                          met={passwordValidation.hasNumber}
                          text="One number"
                        />
                        <PasswordRequirement
                          met={passwordValidation.hasSymbol}
                          text="One special character"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full cursor-pointer bg-zinc-800 hover:bg-zinc-900"
                      disabled={loading || !isPasswordValid}
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>

                  <div className="mt-5 rounded-lg border border-zinc-300 p-3">
                    <div className="text-xs text-zinc-800 mb-2">
                      Demo accounts
                    </div>
                    <div className="flex gap-2">
                      {demoHints.map((d) => (
                        <Button
                          key={d.email}
                          type="button"
                          variant="outline"
                          className="border border-zinc-300 cursor-pointer bg-transparent text-xs text-zinc-800 shadow-none"
                          onClick={() => {
                            setEmail(d.email);
                            setPassword("@Password123");
                            setError(null);
                          }}
                        >
                          {d.label}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      Password for all demo accounts:{" "}
                      <span className="text-zinc-600 font-bold">
                        @Password123
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="text-xs text-zinc-500">
                  Tip: Once you sign in, you’ll land in the portal based on your
                  role.
                </CardFooter>
              </Card>
            </div>
            {/* <div></div> */}
            {/* <p className="bg-red-900">hello</p> */}
            <div className="flex items-center gap-x-1">
              <Icon icon="solar:copyright-line-duotone" />
              <p className="text-xs">Graphen Trace 2026</p>
            </div>
          </div>

          {/* hero image */}
          <div className="md:flex-1 md:h-190 h-100 flex w-full">
            <img
              src="https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aGVhbHRoY2FyZXxlbnwwfDF8MHx8fDA%3D"
              alt=""
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
