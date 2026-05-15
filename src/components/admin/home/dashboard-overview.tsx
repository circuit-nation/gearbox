"use client";

import Link from "next/link";
import { format, startOfToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCircuits } from "@/hooks/use-circuits";
import { useDrivers } from "@/hooks/use-drivers";
import { useEvents } from "@/hooks/use-events";
import { useDriverLeaderboard, useTeamLeaderboard } from "@/hooks/use-leaderboard";
import { useSports } from "@/hooks/use-sports";
import { useTeams } from "@/hooks/use-teams";
import {
  ArrowRight,
  Calendar,
  Layers,
  ListOrdered,
  MapPin,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react";

const currentYear = new Date().getFullYear();

export function DashboardOverview() {
  const { data: sports } = useSports(1, 1);
  const { data: teams } = useTeams(1, 1);
  const { data: circuits } = useCircuits(1, 1);
  const { data: events } = useEvents(1, 25, "event_start_at", "asc");
  const { data: drivers } = useDrivers(1, 1);
  const { data: driverLeaderboard } = useDriverLeaderboard(1, 1, undefined, undefined, currentYear);
  const { data: teamLeaderboard } = useTeamLeaderboard(1, 1, undefined, undefined, currentYear);

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
      title: "Teams",
      value: teams?.total ?? "-",
      description: "Registered teams",
      icon: Users,
      href: "/teams",
    },
    {
      title: "Circuits",
      value: circuits?.total ?? "-",
      description: "Tracks and venues",
      icon: MapPin,
      href: "/circuits",
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
    {
      title: "Driver Leaderboard",
      value: driverLeaderboard?.total ?? "-",
      description: `${currentYear} driver standings`,
      icon: ListOrdered,
      href: "/leaderboard",
    },
    {
      title: "Team Leaderboard",
      value: teamLeaderboard?.total ?? "-",
      description: `${currentYear} team standings`,
      icon: ListOrdered,
      href: "/leaderboard",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Circuit Nation Admin</h1>
        <p className="text-muted-foreground text-lg">
          Live overview of your motorsport catalog and scheduling.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className="text-muted-foreground h-4 w-4" />
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
                    <div className="text-muted-foreground text-xs">
                      {format(new Date(event.event_start_at), "PPp")}
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {event.type}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-sm">No upcoming events yet.</div>
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
            <Button variant="secondary">Manage Sports</Button>
          </Link>
          <Link href="/teams">
            <Button variant="secondary">Manage Teams</Button>
          </Link>
          <Link href="/circuits">
            <Button variant="secondary">Manage Circuits</Button>
          </Link>
          <Link href="/events">
            <Button variant="secondary">Schedule Events</Button>
          </Link>
          <Link href="/drivers">
            <Button variant="secondary">Manage Drivers</Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="secondary">Update Leaderboard</Button>
          </Link>
          <Link href="/tier-nation/lists">
            <Button variant="secondary">
              <Layers className="mr-2 h-4 w-4" />
              Tier Nation lists
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
