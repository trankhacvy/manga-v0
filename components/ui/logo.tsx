import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export type LogoSize = "sm" | "lg";

interface LogoProps {
  size?: LogoSize;
  href?: string;
  className?: string;
}

const sizeConfig: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 32, height: 32 },
  lg: { width: 48, height: 48 },
};

export function Logo({ size = "lg", href = "/", className = "" }: LogoProps) {
  const { width, height } = sizeConfig[size];

  const content = (
    <Image
      src="/logo.png"
      alt="Logo"
      width={width}
      height={height}
      priority
      className={cn("bg-white rounded-md", className)}
    />
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
