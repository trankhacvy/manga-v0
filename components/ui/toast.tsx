"use client";

import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

/**
 * Simple toast notification component
 */
export function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${bgColor} transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

/**
 * Toast container for managing multiple toasts
 */
export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Array<{
    id: string;
    message: string;
    type?: "success" | "error" | "info";
  }>;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
