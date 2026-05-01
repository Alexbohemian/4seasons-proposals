"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Supabase puts the token in the URL fragment (#access_token=...).
  // We need to wait for the client to pick it up and establish a session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F5E9] via-white to-[#E8F5E9]">
      <Card className="w-full max-w-md mx-4 shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1B5E20] flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-xl">4S</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#1B5E20]">
            {done ? "Password Updated!" : "Set New Password"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {done
              ? "You'll be redirected to the dashboard shortly."
              : "Choose a strong password for your account."}
          </p>
        </CardHeader>

        <CardContent>
          {done ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your password has been updated. Redirecting to your dashboard...
              </p>
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-[#1B5E20]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!sessionReady && (
                <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                  Verifying your reset link... If this persists, please request
                  a new reset link.
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= level * 3
                            ? level <= 1
                              ? "bg-red-400"
                              : level <= 2
                                ? "bg-yellow-400"
                                : level <= 3
                                  ? "bg-blue-400"
                                  : "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {password.length < 6
                      ? "Too short"
                      : password.length < 9
                        ? "Weak — try adding numbers or symbols"
                        : password.length < 12
                          ? "Good"
                          : "Strong ✓"}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#1B5E20] hover:bg-[#0D3311] text-white"
                disabled={loading || !sessionReady}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
