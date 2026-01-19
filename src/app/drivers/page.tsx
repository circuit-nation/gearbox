"use client";

import Link from "next/link";
import { DriversManager } from "@/components/admin/drivers-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DriversPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Drivers Management</h1>
            <p className="text-muted-foreground">
              Manage driver profiles
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Drivers</CardTitle>
            <CardDescription>
              Create and manage driver profiles for all competitors across different motorsport categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DriversManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
