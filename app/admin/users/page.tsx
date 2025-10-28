"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, User } from "lucide-react";

const users = [
  { name: "Rajesh Kumar", email: "rajesh@example.com", role: "customer", bookings: 5, spent: 1250 },
  { name: "Priya Sharma", email: "priya@example.com", role: "customer", bookings: 3, spent: 780 },
  { name: "Admin User", email: "admin@mgmmuseum.org", role: "admin", bookings: 0, spent: 0 },
  { name: "Amit Patel", email: "amit@example.com", role: "customer", bookings: 8, spent: 2100 },
];

export default function UsersManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">Users Management</h1>
        <p className="text-muted-foreground">Manage users and roles</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {users.map((user, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {user.role === "admin" ? (
                      <Shield className="w-6 h-6 text-primary" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{user.bookings}</p>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">₹{user.spent}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                  <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                    {user.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}



