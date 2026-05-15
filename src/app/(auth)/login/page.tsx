import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants";
import { verifyAdminSessionToken } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

type LoginPageProps = {
  searchParams: Promise<{ from?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const from = typeof resolvedSearchParams.from === "string" ? resolvedSearchParams.from : "/";
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const session = await verifyAdminSessionToken(token);

  if (session) {
    redirect(from);
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
