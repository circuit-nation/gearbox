"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Calendar,
  LayoutDashboard,
  Trophy,
  UserCircle,
} from "lucide-react";

const navGroups = [
  {
    label: "Circuit Nation",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard, external: false },
      { title: "Sports", href: "/sports", icon: Trophy, external: false },
      { title: "Events", href: "/events", icon: Calendar, external: false },
      { title: "Drivers", href: "/drivers", icon: UserCircle, external: false },
    ],
  },
  {
    label: "Tier Nation",
    items: [{ title: "Website", href: "https://tiernation.live", icon: ArrowUpRight, external: true }],
  },
];

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarContent>
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = !item.external && pathname === item.href;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link
                            href={item.href}
                            className={cn("flex items-center gap-2")}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
        <SidebarFooter className="border-t text-xs text-muted-foreground">
          <Link href="https://circuitnation.live" target="_blank" rel="noopener noreferrer" className="flex flex-row items-center gap-1 hover:underline hover:underline-offset-3">
            Circuit Nation Admin <ArrowUpRight className="size-4" />
          </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 border-b bg-background px-4 py-3">
          <SidebarTrigger />
          <div className="text-sm font-semibold tracking-tight">Circuit Nation Admin</div>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
