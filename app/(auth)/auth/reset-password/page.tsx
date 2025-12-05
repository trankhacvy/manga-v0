"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="flex items-center justify-center whitespace-nowrap mb-8">
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

        {/* Page Heading */}
        <div className="flex flex-col gap-2 mb-8 text-center">
          <p className="text-gray-900 dark:text-white text-4xl font-bold leading-tight tracking-[-0.033em]">
            Set new password
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
            Enter your new password below.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Password reset successful! Redirecting...</span>
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
          {/* Password */}
          <div className="flex flex-col w-full gap-2">
            <Label htmlFor="password">New Password</Label>
            <div className="flex w-full flex-1 items-stretch rounded-lg">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                disabled={success}
                placeholder="Enter new password"
                className="rounded-r-none border-r-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={success}
                className="text-gray-400 dark:text-gray-500 flex border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 items-center justify-center pr-[15px] rounded-r-lg border-l-0 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col w-full gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={success}
              placeholder="Confirm new password"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || success}
            className="w-full"
          >
            {loading
              ? "Resetting..."
              : success
              ? "Password Reset!"
              : "Reset Password"}
          </Button>

          {/* Back to login */}
          <p className="text-center text-gray-500 dark:text-gray-400 text-base">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-[#1337ec] hover:underline"
            >
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
