"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();

  const handleEmailSignup = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        setSuccess(true);
        setNeedsConfirmation(true);
      } else if (data?.session) {
        // Auto-login if no confirmation needed
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      alert("Confirmation email resent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Column: Background Image */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center bg-background-dark lg:flex">
        <div className="absolute inset-0 z-0">
          <img
            alt="Manga creation background"
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=2070&auto=format&fit=crop"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6 p-10 text-center text-white">
          <div className="flex items-center gap-4">
            <div className="size-10 text-[#1337ec]">
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
            <h1 className="text-3xl font-bold">MangaV0</h1>
          </div>
          <p className="max-w-md text-lg text-gray-300">
            Unleash your creativity. Build your own manga universe with the
            power of AI.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background-dark lg:w-1/2">
        <div className="flex w-full max-w-md flex-col items-center justify-center p-6 sm:p-10">
          {/* Header */}
          <header className="flex w-full items-center justify-between whitespace-nowrap pb-8">
            <div className="flex items-center gap-2 text-white">
              <div className="size-6 text-[#1337ec] lg:hidden">
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
              <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] lg:hidden">
                MangaV0
              </h2>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
              <span className="text-sm text-gray-400">
                Already have an account?
              </span>
              <Link
                href="/login"
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#1337ec] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#1337ec]/90"
              >
                <span className="truncate">Sign In</span>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex w-full flex-col items-center">
            <div className="flex w-full flex-col items-center gap-6">
              {/* Page Title */}
              <div className="flex w-full flex-wrap justify-start gap-3 text-left">
                <div className="flex w-full flex-col gap-2">
                  <p className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                    Create Your Account
                  </p>
                  <p className="text-gray-400 text-base font-normal leading-normal">
                    Your AI Manga Studio
                  </p>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className="flex w-full items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>
                    Success! Please check your email to confirm your account.
                  </span>
                </div>
              )}

              {/* Email Not Confirmed Warning */}
              {needsConfirmation && !success && (
                <div className="flex w-full items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>
                    Your email is not confirmed. Please check your inbox or{" "}
                    <button
                      onClick={handleResendConfirmation}
                      disabled={loading}
                      className="font-semibold text-yellow-200 underline hover:text-yellow-100"
                    >
                      resend confirmation link
                    </button>
                    .
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex w-full items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Social Sign Up - Disabled */}
              <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row opacity-50 pointer-events-none">
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  size="sm"
                  className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.578 12.245c0-.813-.07-1.614-.207-2.396h-10.2v4.53h5.73c-.247 1.465-1.01 2.72-2.22 3.585v2.964h3.805c2.22-2.046 3.535-5.15 3.535-8.683z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12.17 23c3.243 0 5.968-1.07 7.957-2.895l-3.806-2.964c-1.077.72-2.457 1.147-4.15 1.147-3.197 0-5.91-2.15-6.88-5.023H1.422v2.964C3.39 20.312 7.43 23 12.17 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.29 13.268a7.28 7.28 0 0 1 0-4.53V5.773H1.42C.51 7.64 0 9.76 0 12c0 2.24.51 4.36 1.42 6.227l3.87-3.03v.07z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.17 4.71c1.75 0 3.344.6 4.606 1.83l3.37-3.37C18.136 1.192 15.412 0 12.17 0 7.43 0 3.39 2.688 1.42 6.227l3.87 3.03c.97-2.872 3.683-5.023 6.88-5.023z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign Up with Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  size="sm"
                  className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.5 12.067c0-5.822-4.707-10.556-10.5-10.556S1.5 6.245 1.5 12.067C1.5 17.295 5.16 21.503 9.843 22.37V14.56H7.13v-3.518h2.713v-2.67c0-2.69 1.597-4.183 4.06-4.183 1.18 0 2.45.21 2.45.21v3.013h-1.52c-1.33 0-1.743.82-1.743 1.684v2.016h3.38l-.533 3.518h-2.847v7.81C19.84 21.503 22.5 17.295 22.5 12.067Z"
                      fill="#1877F2"
                    />
                  </svg>
                  Sign Up with Facebook
                </Button>
              </div>

              {/* Divider */}
              <div className="relative w-full py-2">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center"
                >
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background-dark px-2 text-sm text-gray-400">
                    OR
                  </span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form
                onSubmit={handleEmailSignup}
                className="flex w-full flex-col gap-4"
              >
                {/* Email */}
                <div className="flex flex-col flex-1 gap-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={success}
                    placeholder="Enter your email"
                    className="border-white/20 bg-white/5 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col flex-1 gap-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={success}
                      placeholder="Create a password"
                      className="border-white/20 bg-white/5 text-white placeholder:text-gray-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={success}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white disabled:opacity-50"
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
                <div className="flex flex-col flex-1 gap-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={success}
                    placeholder="Confirm your password"
                    className="border-white/20 bg-white/5 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || success}
                  className="w-full mt-2"
                >
                  {loading
                    ? "Creating Account..."
                    : success
                    ? "Account Created"
                    : "Create Account"}
                </Button>

                {/* Terms */}
                <p className="text-gray-400 text-center text-xs mt-2">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-gray-300 underline hover:text-white"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-gray-300 underline hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
