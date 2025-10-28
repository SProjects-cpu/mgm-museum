"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { TICKET_TYPE_LABELS } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PricingItem {
  id: string;
  name: string;
  type: "show" | "exhibition";
  pricing: Array<{
    id: string;
    ticketType: string;
    price: number;
    active: boolean;
  }>;
}

export default function PricingManagement() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const [showsRes, exhibitionsRes] = await Promise.all([
        fetch("/api/admin/shows"),
        fetch("/api/admin/exhibitions"),
      ]);

      if (!showsRes.ok || !exhibitionsRes.ok) {
        throw new Error("Failed to fetch pricing data");
      }

      const showsData = await showsRes.json();
      const exhibitionsData = await exhibitionsRes.json();

      const pricingItems: PricingItem[] = [
        ...(showsData.shows || []).map((show: any) => ({
          id: show.id,
          name: show.name,
          type: "show" as const,
          pricing: show.pricing || [],
        })),
        ...(exhibitionsData.exhibitions || []).map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          type: "exhibition" as const,
          pricing: ex.pricing || [],
        })),
      ];

      setItems(pricingItems);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching pricing data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">
            Pricing Management
          </h1>
          <p className="text-muted-foreground">
            View and manage pricing for all shows and exhibitions
          </p>
        </div>
        <Button onClick={fetchPricingData} variant="outline">
          <Loader2 className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Shows Pricing */}
      {items.filter((i) => i.type === "show").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Show Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Show Name</TableHead>
                  <TableHead>Ticket Types</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Active Tiers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items
                  .filter((i) => i.type === "show")
                  .map((item) => {
                    const activePricing = item.pricing.filter((p) => p.active);
                    const prices = item.pricing.map((p) => p.price).sort((a, b) => a - b);
                    const minPrice = prices[0] || 0;
                    const maxPrice = prices[prices.length - 1] || 0;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.pricing.map((p) => (
                              <Badge key={p.id} variant="outline" className="text-xs">
                                {TICKET_TYPE_LABELS[p.ticketType as keyof typeof TICKET_TYPE_LABELS] || p.ticketType}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {minPrice === maxPrice
                            ? formatCurrency(minPrice)
                            : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{activePricing.length}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Exhibitions Pricing */}
      {items.filter((i) => i.type === "exhibition").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Exhibition Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exhibition Name</TableHead>
                  <TableHead>Ticket Types</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Active Tiers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items
                  .filter((i) => i.type === "exhibition")
                  .map((item) => {
                    const activePricing = item.pricing.filter((p) => p.active);
                    const prices = item.pricing.map((p) => p.price).sort((a, b) => a - b);
                    const minPrice = prices[0] || 0;
                    const maxPrice = prices[prices.length - 1] || 0;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.pricing.map((p) => (
                              <Badge key={p.id} variant="outline" className="text-xs">
                                {TICKET_TYPE_LABELS[p.ticketType as keyof typeof TICKET_TYPE_LABELS] || p.ticketType}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {minPrice === maxPrice
                            ? formatCurrency(minPrice)
                            : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{activePricing.length}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No shows or exhibitions with pricing found
            </p>
            <p className="text-sm text-muted-foreground">
              Create shows or exhibitions and add pricing tiers to see them here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



