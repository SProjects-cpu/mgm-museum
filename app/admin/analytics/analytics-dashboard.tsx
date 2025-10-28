"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  TrendingUp,
  Users,
  Ticket,
  DollarSign,
  Download,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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

const demographicsChartConfig = {
  value: {
    label: "Percentage",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// Mock analytics data
const metrics = {
  totalRevenue: 156800,
  revenueGrowth: 12.5,
  totalBookings: 1234,
  bookingsGrowth: 8.3,
  totalVisitors: 3456,
  visitorsGrowth: 15.2,
  avgBookingValue: 127,
  avgBookingGrowth: 4.1,
};

const revenueByExhibition = [
  { name: "Full Dome Planetarium", revenue: 45600, percentage: 29 },
  { name: "Astro Gallery", revenue: 38200, percentage: 24 },
  { name: "3D Theatre", revenue: 29400, percentage: 19 },
  { name: "Holography", revenue: 24800, percentage: 16 },
  { name: "Others", revenue: 18800, percentage: 12 },
];

const monthlyTrends = [
  { month: "Jan", bookings: 245, revenue: 24500, visitors: 890 },
  { month: "Feb", bookings: 312, revenue: 31200, visitors: 1120 },
  { month: "Mar", bookings: 398, revenue: 39800, visitors: 1450 },
  { month: "Apr", bookings: 445, revenue: 44500, visitors: 1580 },
  { month: "May", bookings: 389, revenue: 38900, visitors: 1340 },
  { month: "Jun", bookings: 456, revenue: 45600, visitors: 1620 },
];

const popularTimeSlots = [
  { time: "10:00 AM", bookings: 234 },
  { time: "1:00 PM", bookings: 289 },
  { time: "4:00 PM", bookings: 312 },
  { time: "7:00 PM", bookings: 198 },
];

const visitorDemographics = [
  { name: "Adults", value: 45, color: "rgb(var(--primary))" },
  { name: "Children", value: 30, color: "rgb(var(--accent))" },
  { name: "Students", value: 15, color: "rgb(var(--success))" },
  { name: "Seniors", value: 10, color: "rgb(var(--warning))" },
];

const COLORS = [
  "rgb(var(--primary))",
  "rgb(var(--accent))",
  "rgb(var(--success))",
  "rgb(var(--warning))",
  "rgb(var(--error))",
];

export function AnalyticsDashboard() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: string = 'bookings') => {
    try {
      setExporting(true);
      toast.info('Generating report...');

      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(
        `/api/admin/reports/export?type=${type}&format=csv&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Track performance and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button onClick={() => handleExport('bookings')} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Report'}
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
              <div className="flex items-center gap-1 text-sm font-medium text-success">
                <TrendingUp className="w-4 h-4" />
                +{metrics.revenueGrowth}%
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
              <div className="flex items-center gap-1 text-sm font-medium text-success">
                <TrendingUp className="w-4 h-4" />
                +{metrics.bookingsGrowth}%
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
              <div className="flex items-center gap-1 text-sm font-medium text-success">
                <TrendingUp className="w-4 h-4" />
                +{metrics.visitorsGrowth}%
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
              <div className="flex items-center gap-1 text-sm font-medium text-success">
                <TrendingUp className="w-4 h-4" />
                +{metrics.avgBookingGrowth}%
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">
              {formatCurrency(metrics.avgBookingValue)}
            </p>
            <p className="text-sm text-muted-foreground">Avg Booking Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends - Line & Area Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Trend - Area Chart */}
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
                      <stop
                        offset="5%"
                        stopColor="rgb(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="rgb(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                  />
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

        {/* Bookings & Visitors - Line Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Bookings & Visitors</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <ChartContainer config={trendsChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                  />
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
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
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
        {/* Revenue by Exhibition - Pie Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
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
          </CardContent>
        </Card>

        {/* Popular Time Slots - Bar Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Popular Time Slots</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <ChartContainer config={timeSlotsChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularTimeSlots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis
                    dataKey="time"
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="rgb(var(--muted-foreground))"
                    fontSize={12}
                  />
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
                  <Bar
                    dataKey="bookings"
                    fill="rgb(var(--primary))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Demographics - Donut Chart */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Visitor Demographics</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <ChartContainer config={demographicsChartConfig} className="h-[350px] w-full max-w-2xl mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitorDemographics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {visitorDemographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-card p-3 shadow-lg">
                          <p className="font-medium mb-1">{payload[0].name}</p>
                          <p className="text-sm text-muted-foreground">
                            Percentage: {payload[0].value}%
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
        </CardContent>
      </Card>
    </div>
  );
}
