"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "lucide-react";
import { ShowDialog } from "@/components/admin/show-dialog";

const shows = [
  { name: "Cosmos Journey", type: "Planetarium", status: "active", capacity: 100, bookings: 87 },
  { name: "Ocean Depths 3D", type: "3D Theatre", status: "active", capacity: 80, bookings: 65 },
  { name: "Holographic Wonders", type: "Holography", status: "active", capacity: 60, bookings: 42 },
];

export default function ShowsManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">Shows Management</h1>
          <p className="text-muted-foreground">Manage planetarium shows and schedules</p>
        </div>
        <ShowDialog mode="create" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shows.map((show, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">{show.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">{show.type}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="default" className="bg-success text-success-foreground">{show.status}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-semibold">{show.capacity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bookings:</span>
                  <span className="font-semibold">{show.bookings}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div className="bg-primary rounded-full h-2" style={{width: `${(show.bookings/show.capacity)*100}%`}} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}



