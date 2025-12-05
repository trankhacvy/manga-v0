"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("tester@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error in URL params
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
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

          {/* Page Heading */}
          <div className="flex flex-col gap-2 mb-8">
            <p className="text-gray-900 dark:text-white text-4xl font-bold leading-tight tracking-[-0.033em]">
              Log in to your account
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col w-full">
              <div className="flex flex-col w-full gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex w-full flex-1 items-stretch rounded-lg">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="rounded-r-none border-r-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 dark:text-gray-500 flex border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 items-center justify-center pr-[15px] rounded-r-lg border-l-0 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="w-full text-right mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-[#1337ec] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Logging in..." : "Log In"}
            </Button>

            {/* Divider */}
            <div className="flex items-center my-2">
              <hr className="flex-grow border-gray-300 dark:border-gray-700" />
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">
                or
              </span>
              <hr className="flex-grow border-gray-300 dark:border-gray-700" />
            </div>

            {/* Social Logins - Disabled for now */}
            <div className="flex flex-col sm:flex-row gap-4 opacity-50 pointer-events-none">
              <Button
                type="button"
                variant="outline"
                // disabled
                className="flex-1"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Login with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                // disabled
                className="flex-1"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#1877F2"
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
                Login with Facebook
              </Button>
            </div>

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
