"use client";

import { useEffect, useState } from "react";
import { TrendingUpIcon, TrendingDownIcon, Users, Ticket, DollarSign, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatData {
  title: string;
  value: string;
  change: string;
  trending: "up" | "down";
  icon: any;
  description: string;
  footer: string;
}

export function AdminStatsCards() {
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      
      const statsData: StatData[] = [
        {
          title: "Today's Bookings",
          value: String(data.stats.todayBookings.value),
          change: `${data.stats.todayBookings.change >= 0 ? '+' : ''}${data.stats.todayBookings.change}%`,
          trending: data.stats.todayBookings.trending,
          icon: Ticket,
          description: data.stats.todayBookings.trending === 'up' ? 'Trending up today' : 'Trending down today',
          footer: data.stats.todayBookings.footer,
        },
        {
          title: "Revenue (Today)",
          value: formatCurrency(data.stats.todayRevenue.value),
          change: `${data.stats.todayRevenue.change >= 0 ? '+' : ''}${data.stats.todayRevenue.change}%`,
          trending: data.stats.todayRevenue.trending,
          icon: DollarSign,
          description: data.stats.todayRevenue.trending === 'up' ? 'Strong performance' : 'Below target',
          footer: data.stats.todayRevenue.footer,
        },
        {
          title: "Total Visitors",
          value: String(data.stats.totalVisitors.value),
          change: `${data.stats.totalVisitors.change >= 0 ? '+' : ''}${data.stats.totalVisitors.change}%`,
          trending: data.stats.totalVisitors.trending,
          icon: Users,
          description: data.stats.totalVisitors.trending === 'up' ? 'Steady growth' : 'Slight decline',
          footer: data.stats.totalVisitors.footer,
        },
        {
          title: "Active Exhibitions",
          value: String(data.stats.activeExhibitions.value),
          change: `${data.stats.activeExhibitions.change >= 0 ? '+' : ''}${data.stats.activeExhibitions.change}%`,
          trending: data.stats.activeExhibitions.trending,
          icon: Calendar,
          description: 'Currently active',
          footer: data.stats.activeExhibitions.footer,
        },
      ];
      
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

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


