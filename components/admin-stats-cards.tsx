"use client";

import { useEffect, useState } from "react";
import { TrendingUpIcon, TrendingDownIcon, Users, Ticket, DollarSign, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useWebSocketContext } from "@/lib/contexts/websocket-context";

const initialStats = [
  {
    title: "Today's Bookings",
    value: "24",
    change: "+12%",
    trending: "up" as const,
    icon: Ticket,
    description: "Trending up this week",
    footer: "12 more than yesterday",
  },
  {
    title: "Revenue (Today)",
    value: formatCurrency(15680),
    change: "+8%",
    trending: "up" as const,
    icon: DollarSign,
    description: "Strong performance",
    footer: "Above daily target",
  },
  {
    title: "Total Visitors",
    value: "1,234",
    change: "+5%",
    trending: "up" as const,
    icon: Users,
    description: "Steady growth",
    footer: "234 visitors today",
  },
  {
    title: "Active Shows",
    value: "8",
    change: "-2%",
    trending: "down" as const,
    icon: Calendar,
    description: "Slightly down",
    footer: "2 shows in maintenance",
  },
];

export function AdminStatsCards() {
  const { lastMessage } = useWebSocketContext();
  const [stats, setStats] = useState(initialStats);

  // Update stats based on real-time messages
  useEffect(() => {
    if (lastMessage?.type === "booking") {
      setStats((prev) =>
        prev.map((stat) =>
          stat.title === "Today's Bookings"
            ? { ...stat, value: String(parseInt(stat.value) + 1) }
            : stat
        )
      );
    }
  }, [lastMessage]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="@container/card hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-card to-card/50 flex flex-col"
        >
          <CardHeader className="relative pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <CardDescription className="text-xs font-medium">
                {stat.title}
              </CardDescription>
            </div>
            <CardTitle className="text-3xl font-extrabold tabular-nums @[250px]/card:text-4xl">
              {stat.value}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className={stat.trending === "up" 
                  ? "flex gap-1 rounded-lg text-xs border-success/30 bg-success/10 text-success" 
                  : "flex gap-1 rounded-lg text-xs border-error/30 bg-error/10 text-error"
                }
              >
                {stat.trending === "up" ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {stat.change}
              </Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm pt-0">
            <div className="line-clamp-1 flex gap-2 font-semibold text-xs">
              {stat.description}
            </div>
            <div className="text-muted-foreground text-xs">{stat.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}


