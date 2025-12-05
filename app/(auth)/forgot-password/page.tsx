"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Left Column: Image */}
      <div
        className="hidden lg:flex w-full h-full bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?q=80&w=2070&auto=format&fit=crop')",
        }}
      />

      {/* Right Column: Form */}
      <div className="flex flex-col justify-center items-center w-full px-4 sm:px-6 lg:px-12 py-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <header className="flex items-center justify-start whitespace-nowrap mb-8">
            <div className="flex items-center gap-3 text-gray-800 dark:text-white">
              <div className="size-6 text-[#1337ec]">
                <svg
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold leading-tight tracking-[-0.015em]">
                MangaV0
              </h2>
            </div>
          </header>

          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#1337ec] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {/* Page Heading */}
          <div className="flex flex-col gap-2 mb-8">
            <p className="text-gray-900 dark:text-white text-4xl font-bold leading-tight tracking-[-0.033em]">
              Reset your password
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>
                Password reset email sent! Please check your inbox and follow
                the instructions.
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={success}
                placeholder="Enter your email"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || success}
              className="w-full"
            >
              {loading
                ? "Sending..."
                : success
                ? "Email Sent"
                : "Send Reset Link"}
            </Button>

            {/* Sign up link */}
            <p className="text-center text-gray-500 dark:text-gray-400 text-base">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-[#1337ec] hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
