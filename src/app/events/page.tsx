"use client";

import Link from "next/link";
import { EventsManager } from "@/components/admin/events-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EventsPage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
            <p className="text-muted-foreground">
              Schedule and manage racing events
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>
              Create and manage racing events with full details including location, dates, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventsManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
