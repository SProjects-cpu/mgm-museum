"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const pricingMatrix = [
  { exhibition: "Full Dome Planetarium", adult: 100, child: 60, student: 75, senior: 80 },
  { exhibition: "Astro Gallery", adult: 80, child: 50, student: 65, senior: 70 },
  { exhibition: "3D Theatre", adult: 75, child: 45, student: 60, senior: 65 },
  { exhibition: "Holography", adult: 90, child: 55, student: 70, senior: 75 },
];

export default function PricingManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">Pricing Management</h1>
          <p className="text-muted-foreground">Update ticket prices for all categories</p>
        </div>
        <Button><Save className="w-4 h-4 mr-2" />Save Changes</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Prices (INR)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exhibition</TableHead>
                <TableHead>Adult</TableHead>
                <TableHead>Child (3-12)</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Senior (60+)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingMatrix.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.exhibition}</TableCell>
                  <TableCell>
                    <Input type="number" defaultValue={item.adult} className="w-24" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" defaultValue={item.child} className="w-24" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" defaultValue={item.student} className="w-24" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" defaultValue={item.senior} className="w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}



