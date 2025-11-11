"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Ticket,
  DollarSign,
  Download,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
} from "recharts";

// Chart configurations
const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const trendsChartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--primary))",
  },
  visitors: {
    label: "Visitors",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const distributionChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const timeSlotsChartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const COLORS = [
  "rgb(var(--primary))",
  "rgb(var(--accent))",
  "rgb(var(--success))",
  "rgb(var(--warning))",
  "rgb(var(--error))",
];

interface AnalyticsMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalBookings: number;
  bookingsGrowth: number;
  totalVisitors: number;
  visitorsGrowth: number;
  avgBookingValue: number;
  avgBookingGrowth: number;
}

interface RevenueData {
  name: string;
  revenue: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  bookings: number;
  revenue: number;
  visitors: number;
}

interface TimeSlotData {
  time: string;
  bookings: number;
}

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState(30); // days
  
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalBookings: 0,
    bookingsGrowth: 0,
    totalVisitors: 0,
    visitorsGrowth: 0,
    avgBookingValue: 0,
    avgBookingGrowth: 0,
  });
  
  const [revenueByExhibition, setRevenueByExhibition] = useState<RevenueData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [popularTimeSlots, setPopularTimeSlots] = useState<TimeSlotData[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
      
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      
      // Calculate metrics
      const totalRevenue = data.revenue.total || 0;
      const totalBookings = data.bookings.total || 0;
      const totalVisitors = data.visitors.total || 0;
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      
      // Calculate growth (comparing to previous period)
      const previousPeriodStart = new Date(startDate.getTime() - dateRange * 24 * 60 * 60 * 1000);
      const previousResponse = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: previousPeriodStart.toISOString(),
          endDate: startDate.toISOString(),
        }),
      });
      
      let revenueGrowth = 0;
      let bookingsGrowth = 0;
      let visitorsGrowth = 0;
      let avgBookingGrowth = 0;
      
      if (previousResponse.ok) {
        const previousData = await previousResponse.json();
        const prevRevenue = previousData.revenue.total || 0;
        const prevBookings = previousData.bookings.total || 0;
        const prevVisitors = previousData.visitors.total || 0;
        const prevAvgBooking = prevBookings > 0 ? prevRevenue / prevBookings : 0;
        
        revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        bookingsGrowth = prevBookings > 0 ? ((totalBookings - prevBookings) / prevBookings) * 100 : 0;
        visitorsGrowth = prevVisitors > 0 ? ((totalVisitors - prevVisitors) / prevVisitors) * 100 : 0;
        avgBookingGrowth = prevAvgBooking > 0 ? ((avgBookingValue - prevAvgBooking) / prevAvgBooking) * 100 : 0;
      }
      
      setMetrics({
        totalRevenue,
        revenueGrowth,
        totalBookings,
        bookingsGrowth,
        totalVisitors,
        visitorsGrowth,
        avgBookingValue,
        avgBookingGrowth,
      });
      
      // Process revenue by exhibition
      const exhibitionRevenue = data.topExhibitions.map((ex: any, index: number) => ({
        name: ex.name,
        revenue: ex.revenue,
        percentage: totalRevenue > 0 ? Math.round((ex.revenue / totalRevenue) * 100) : 0,
      })).slice(0, 5);
      
      setRevenueByExhibition(exhibitionRevenue);
      
      // Process monthly trends
      const trendsMap = new Map<string, { bookings: number; revenue: number; visitors: number }>();
      
      data.bookings.byDate.forEach((item: any) => {
        const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short' });
        const current = trendsMap.get(month) || { bookings: 0, revenue: 0, visitors: 0 };
        current.bookings += item.count;
        trendsMap.set(month, current);
      });
      
      data.revenue.byDate.forEach((item: any) => {
        const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short' });
        const current = trendsMap.get(month) || { bookings: 0, revenue: 0, visitors: 0 };
        current.revenue += item.amount;
        trendsMap.set(month, current);
      });
      
      // Estimate visitors per booking
      const avgVisitorsPerBooking = totalBookings > 0 ? totalVisitors / totalBookings : 2.5;
      trendsMap.forEach((value, key) => {
        value.visitors = Math.round(value.bookings * avgVisitorsPerBooking);
      });
      
      const trends = Array.from(trendsMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));
      
      setMonthlyTrends(trends);
      
      // Process time slots (extract from booking times)
      const timeSlotsMap = new Map<string, number>();
      
      // Fetch booking times
      const bookingsResponse = await fetch('/api/admin/bookings?limit=1000');
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        bookingsData.bookings?.forEach((booking: any) => {
          if (booking.time_slot) {
            const time = booking.time_slot.substring(0, 5); // Get HH:MM
            timeSlotsMap.set(time, (timeSlotsMap.get(time) || 0) + 1);
          }
        });
      }
      
      const timeSlots = Array.from(timeSlotsMap.entries())
        .map(([time, bookings]) => ({ time, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 6);
      
      setPopularTimeSlots(timeSlots);
      
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.info('Generating PDF report...');

      const endDate = new Date();
      const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

      const response = await fetch('/api/admin/export/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MGM_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('PDF report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground">
            Real-time performance insights and metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setDateRange(7)}
            className={dateRange === 7 ? "bg-accent" : ""}
          >
            7 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => setDateRange(30)}
            className={dateRange === 30 ? "bg-accent" : ""}
          >
            30 Days
          </Button>
          <Button
            variant="outline"
            onClick={() => setDateRange(90)}
            className={dateRange === 90 ? "bg-accent" : ""}
          >
            90 Days
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Generating...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="flex flex-col">
          <CardContent className="p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${metrics.revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {metrics.revenueGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metrics.revenueGrowth).toFixed(1)}%
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">
              {formatCurrency(metrics.totalRevenue)}
            </p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardContent className="p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${metrics.bookingsGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {metrics.bookingsGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metrics.bookingsGrowth).toFixed(1)}%
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{metrics.totalBookings}</p>
            <p className="text-sm text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardContent className="p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${metrics.visitorsGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {metrics.visitorsGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metrics.visitorsGrowth).toFixed(1)}%
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{metrics.totalVisitors}</p>
            <p className="text-sm text-muted-foreground">Total Visitors</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardContent className="p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${metrics.avgBookingGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {metrics.avgBookingGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metrics.avgBookingGrowth).toFixed(1)}%
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">
              {formatCurrency(metrics.avgBookingValue)}
            </p>
            <p className="text-sm text-muted-foreground">Avg Booking Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="month" stroke="rgb(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-card p-3 shadow-lg">
                            <p className="font-medium mb-1">{payload[0].payload.month}</p>
                            <p className="text-sm text-muted-foreground">
                              Revenue: {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="rgb(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bookings & Visitors */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Bookings & Visitors</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <ChartContainer config={trendsChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="month" stroke="rgb(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="rgb(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-card p-3 shadow-lg">
                            <p className="font-medium mb-2">{payload[0].payload.month}</p>
                            {payload.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1">
                                <span className="text-muted-foreground">{item.name}</span>
                                <span className="font-semibold">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    content={({ payload }) => (
                      <div className="flex items-center justify-center gap-4 mt-4">
                        {payload?.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-muted-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="rgb(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Bookings"
                  />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="rgb(var(--accent))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Visitors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Distribution & Time Slots */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue by Exhibition */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Revenue Distribution by Exhibition</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            {revenueByExhibition.length > 0 ? (
              <ChartContainer config={distributionChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByExhibition}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {revenueByExhibition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-card p-3 shadow-lg">
                              <p className="font-medium mb-1">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">
                                Revenue: {formatCurrency(payload[0].value as number)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Share: {payload[0].payload.percentage}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No exhibition data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Time Slots */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Popular Time Slots</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            {popularTimeSlots.length > 0 ? (
              <ChartContainer config={timeSlotsChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularTimeSlots}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                    <XAxis dataKey="time" stroke="rgb(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="rgb(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-card p-3 shadow-lg">
                              <p className="font-medium mb-1">{payload[0].payload.time}</p>
                              <p className="text-sm text-muted-foreground">
                                Bookings: {payload[0].value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="bookings" fill="rgb(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No time slot data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
