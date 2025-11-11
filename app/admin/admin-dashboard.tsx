"use client";

import { AdminStatsCards } from "@/components/admin-stats-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Eye, Plus, Calendar, Sparkle } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Booking {
  id: string;
  reference: string;
  customer: string;
  exhibition: string;
  date: string;
  amount: number;
  status: "confirmed" | "pending" | "cancelled";
}

interface Show {
  name: string;
  time: string;
  capacity: number;
  booked: number;
}

export function AdminDashboard() {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [todayShows, setTodayShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setRecentBookings(data.recentBookings || []);
      setTodayShows(data.todayShows || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="before:bg-muted border-e-foreground relative overflow-hidden before:absolute before:inset-1 before:h-[calc(100%-8rem)] before:rounded-2xl sm:before:inset-2 md:before:rounded-[2rem] lg:before:h-[calc(100%-14rem)]">
        <div className="py-20 md:py-36">
          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
            <div>
              <Link
                href="#"
                className="hover:bg-foreground/5 mx-auto flex w-fit items-center justify-center gap-2 rounded-md py-0.5 pl-1 pr-3 transition-colors duration-150">
                <div
                  aria-hidden
                  className="border-background bg-linear-to-b dark:inset-shadow-2xs to-foreground from-primary relative flex size-5 items-center justify-center rounded border shadow-md shadow-black/20 ring-1 ring-black/10">
                  <div className="absolute inset-x-0 inset-y-1.5 border-y border-dotted border-white/25"></div>
                  <div className="absolute inset-x-1.5 inset-y-0 border-x border-dotted border-white/25"></div>
                  <Sparkle className="size-3 fill-white stroke-white drop-shadow" />
                </div>
                <span className="font-medium">MGM Museum Admin Panel</span>
              </Link>
              <h1 className="mx-auto mt-8 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">Manage Your Museum Experience</h1>
              <p className="text-muted-foreground mx-auto my-6 max-w-xl text-balance text-xl">Monitor bookings, manage exhibitions, and track visitor analytics in real-time.</p>

              <div className="flex items-center justify-center gap-3">
                <Button
                  asChild
                  size="lg">
                  <Link href="/admin/bookings">
                    <span className="text-nowrap">View Bookings</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline">
                  <Link href="/admin/analytics">
                    <span className="text-nowrap">View Analytics</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Header */}
      <div className="mt-6">
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Dashboard
        </h1>
        <p className="text-muted-foreground font-medium">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards />

      {/* Charts */}
      <ChartAreaInteractive />

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="xl:col-span-2 border-2 hover:shadow-xl transition-all duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xl font-bold">Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link href="/admin/bookings">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No recent bookings
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-300 border border-transparent hover:border-primary/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{booking.customer}</p>
                      <Badge
                        variant={
                          booking.status === "confirmed" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {booking.exhibition} • {booking.date}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.reference}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="font-bold text-primary text-sm">
                        {formatCurrency(booking.amount)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Upcoming Shows */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg" asChild>
                <Link href="/admin/exhibitions/new">
                  <Plus className="w-4 h-4" />
                  New Exhibition
                </Link>
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" asChild>
                <Link href="/admin/shows/new">
                  <Plus className="w-4 h-4" />
                  New Show
                </Link>
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" asChild>
                <Link href="/admin/events/new">
                  <Plus className="w-4 h-4" />
                  New Event
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Today's Shows */}
          <Card className="border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Today's Shows</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : todayShows.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  No shows scheduled today
                </div>
              ) : (
                <div className="space-y-4">
                  {todayShows.map((show, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{show.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {show.time}
                        </p>
                      </div>
                      <p className="text-sm font-bold tabular-nums">
                        {show.booked}/{show.capacity}
                      </p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full h-2.5 transition-all duration-500 shadow-lg"
                        style={{
                          width: `${(show.booked / show.capacity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
