export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark">
      {children}
    </div>
  );
}
