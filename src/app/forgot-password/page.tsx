"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "https://4seasons-proposals.vercel.app/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-[#1B5E20]">Reset Password</h1>
          <p className="text-muted-foreground text-sm">
            {sent
              ? "Check your inbox"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </CardHeader>

        <CardContent>
          {sent ? (
            // Success state
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Email sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a password reset link to{" "}
                  <span className="font-medium text-gray-900">{email}</span>.
                  Check your inbox and click the link to set a new password.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-[#1B5E20] underline underline-offset-2"
                >
                  try again
                </button>
                .
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#1B5E20] hover:bg-[#0D3311] text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full text-muted-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
