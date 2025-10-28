"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Ticket,
  Calendar,
  User,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  X,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDate, formatCurrency } from "@/lib/utils";

// Mock user data
const userData = {
  name: "Rajesh Kumar",
  email: "rajesh.kumar@example.com",
  phone: "+91 98765 43210",
  memberSince: "2023-05-15",
};

// Mock bookings data
const bookings = [
  {
    id: "1",
    bookingReference: "MGM-20250115-ABC1",
    exhibitionName: "Full Dome Planetarium",
    date: new Date("2025-01-25"),
    timeSlot: "4:00 PM",
    tickets: [
      { type: "Adult", quantity: 2, price: 100 },
      { type: "Child", quantity: 1, price: 60 },
    ],
    totalAmount: 260,
    status: "confirmed" as const,
    paymentStatus: "paid" as const,
  },
  {
    id: "2",
    bookingReference: "MGM-20250112-XYZ2",
    exhibitionName: "Robotics & AI Exhibition",
    date: new Date("2025-02-10"),
    timeSlot: "11:00 AM",
    tickets: [
      { type: "Adult", quantity: 1, price: 80 },
    ],
    totalAmount: 80,
    status: "confirmed" as const,
    paymentStatus: "paid" as const,
  },
  {
    id: "3",
    bookingReference: "MGM-20241220-DEF3",
    exhibitionName: "Astro Gallery & ISRO",
    date: new Date("2024-12-28"),
    timeSlot: "2:00 PM",
    tickets: [
      { type: "Adult", quantity: 3, price: 80 },
    ],
    totalAmount: 240,
    status: "completed" as const,
    paymentStatus: "paid" as const,
  },
];

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<"bookings" | "profile">("bookings");
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const upcomingBookings = bookings.filter((b) => b.date >= new Date());
  const pastBookings = bookings.filter((b) => b.date < new Date());

  return (
    <div className="min-h-screen py-12 bg-muted/30">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your bookings and profile information
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Upcoming Visits
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {upcomingBookings.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Visits
                    </p>
                    <p className="text-3xl font-bold text-success">
                      {bookings.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Member Since
                    </p>
                    <p className="text-lg font-bold">
                      {new Date(userData.memberSince).getFullYear()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            onClick={() => setActiveTab("bookings")}
          >
            <Ticket className="w-4 h-4 mr-2" />
            My Bookings
          </Button>
          <Button
            variant={activeTab === "profile" ? "default" : "outline"}
            onClick={() => setActiveTab("profile")}
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "bookings" ? (
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-4">Upcoming Bookings</h2>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-lg mb-1">
                                  {booking.exhibitionName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Booking ID: {booking.bookingReference}
                                </p>
                              </div>
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                <Check className="w-3 h-3 mr-1" />
                                Confirmed
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4 text-primary" />
                                {formatDate(booking.date, "short")}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4 text-primary" />
                                {booking.timeSlot}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Ticket className="w-4 h-4 text-primary" />
                                {booking.tickets.reduce((sum, t) => sum + t.quantity, 0)} Tickets
                              </div>
                              <div className="flex items-center gap-2 font-semibold text-primary">
                                {formatCurrency(booking.totalAmount)}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row lg:flex-col gap-2">
                            <Button size="sm" variant="outline" className="flex-1 lg:flex-none">
                              <Download className="w-4 h-4 mr-2" />
                              E-Ticket
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1 lg:flex-none">
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      No upcoming bookings
                    </p>
                    <Button asChild>
                      <a href="/exhibitions">Browse Exhibitions</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-4">Past Visits</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <Card key={booking.id} className="opacity-75">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-lg mb-1">
                                  {booking.exhibitionName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {booking.bookingReference}
                                </p>
                              </div>
                              <Badge variant="secondary">Completed</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(booking.date, "short")}
                              </div>
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4" />
                                {booking.tickets.reduce((sum, t) => sum + t.quantity, 0)} Tickets
                              </div>
                            </div>
                          </div>

                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download Receipt
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* Profile Tab */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={userData.name}
                      className="max-w-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={userData.email}
                      className="max-w-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      defaultValue={userData.phone}
                      className="max-w-md"
                    />
                  </div>

                  <div className="pt-4">
                    <Button>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}


