export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
