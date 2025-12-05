"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          setStatus("success");
          setMessage("Your email has been confirmed successfully!");

          // Redirect to home after 3 seconds
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 3000);
        } else {
          setStatus("error");
          setMessage(
            "Unable to confirm email. The link may be invalid or expired."
          );
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err.message || "An error occurred during email confirmation."
        );
      }
    };

    confirmEmail();
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
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

        {/* Status Messages */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[#1337ec] animate-spin" />
            <p className="text-gray-900 dark:text-white text-xl font-semibold">
              Confirming your email...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-gray-900 dark:text-white text-2xl font-bold">
                Email Confirmed!
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-base">
                {message}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Redirecting you to the app...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-gray-900 dark:text-white text-2xl font-bold">
                Confirmation Failed
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-base">
                {message}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link
                href="/signup"
                className="flex items-center justify-center font-bold text-base leading-normal px-6 h-12 rounded-lg bg-[#1337ec] text-white hover:bg-[#1337ec]/90 transition-colors duration-200"
              >
                Try Again
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center font-bold text-base leading-normal px-6 h-12 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
