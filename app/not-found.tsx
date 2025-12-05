import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <p className="text-2xl font-semibold text-white mb-2">
            Page Not Found
          </p>
          <p className="text-slate-400 text-base">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-12 flex justify-center">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="text-6xl">🔍</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
          <Link href="/" className="flex-1">
            <Button size="lg">
              <Home className="size-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
