import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, UserCircle, ArrowRight } from "lucide-react";

export default function HomePage() {
  const sections = [
    {
      title: "Sports",
      description: "Manage different motorsport categories",
      icon: Trophy,
      href: "/sports",
      color: "text-blue-500",
    },
    {
      title: "Events",
      description: "Schedule and organize racing events",
      icon: Calendar,
      href: "/events",
      color: "text-green-500",
    },
    {
      title: "Teams",
      description: "Add and manage racing teams",
      icon: Users,
      href: "/teams",
      color: "text-purple-500",
    },
    {
      title: "Drivers",
      description: "Manage driver profiles",
      icon: UserCircle,
      href: "/drivers",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Circuit Nation Admin</h1>
          <p className="text-xl text-muted-foreground">
            Manage your motorsport content and data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${section.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription className="mt-1.5">
                            {section.description}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with managing your content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold">1. Add Sports Categories</h3>
              <p className="text-sm text-muted-foreground">
                Start by adding the different motorsport categories like Formula 1, MotoGP, etc.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold">2. Create Teams</h3>
              <p className="text-sm text-muted-foreground">
                Add teams that compete in each sport category.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold">3. Add Drivers</h3>
              <p className="text-sm text-muted-foreground">
                Create driver profiles for all competitors.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold">4. Schedule Events</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage racing events with full details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
