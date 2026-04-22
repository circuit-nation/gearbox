"use client";

import Link from "next/link";
import { format, startOfToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDrivers } from "@/hooks/use-drivers";
import { useEvents } from "@/hooks/use-events";
import { useSports } from "@/hooks/use-sports";
import {
  Calendar,
  Trophy,
  UserCircle,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const { data: sports } = useSports(1, 1);
  const { data: events } = useEvents(1, 25, "event_start_at", "asc");
  const { data: drivers } = useDrivers(1, 1);
  const upcomingEvents = (events?.documents || [])
    .filter((event) => new Date(event.event_start_at) >= startOfToday())
    .slice(0, 3);

  const statCards = [
    {
      title: "Sports",
      value: sports?.total ?? "-",
      description: "Active motorsport categories",
      icon: Trophy,
      href: "/sports",
    },
    {
      title: "Events",
      value: events?.total ?? "-",
      description: "Scheduled events",
      icon: Calendar,
      href: "/events",
    },
    {
      title: "Drivers",
      value: drivers?.total ?? "-",
      description: "Active driver profiles",
      icon: UserCircle,
      href: "/drivers",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Circuit Nation Admin</h1>
        <p className="text-lg text-muted-foreground">
          Live overview of your motorsport catalog and scheduling.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-semibold">{card.value}</div>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={card.href}>
                  <Button variant="ghost" size="sm" className="px-0">
                    View {card.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next race-weekend milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length ? (
              upcomingEvents.map((event) => (
                <div key={event._id} className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(event.event_start_at), "PPp")}
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {event.type}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No upcoming events yet.</div>
            )}
            <Link href="/events">
              <Button variant="outline" size="sm">
                Manage events
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump back into common workflows</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/sports">
            <Button variant="secondary">Add Sports</Button>
          </Link>
          <Link href="/drivers">
            <Button variant="secondary">Add Drivers</Button>
          </Link>
          <Link href="/events">
            <Button variant="secondary">Schedule Events</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
