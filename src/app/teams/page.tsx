"use client";

import Link from "next/link";
import { TeamsManager } from "@/components/admin/teams-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TeamsPage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Teams Management</h1>
            <p className="text-muted-foreground">
              Add and manage racing teams
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              Create and manage teams that compete in various motorsport categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamsManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
