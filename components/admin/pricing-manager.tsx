"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { TICKET_TYPE_LABELS } from "@/types";

interface PricingTier {
  id?: string;
  ticketType: string;
  price: number;
  active?: boolean;
  validFrom?: string;
}

interface PricingManagerProps {
  pricing: PricingTier[];
  onChange: (pricing: PricingTier[]) => void;
  label?: string;
  description?: string;
}

export function PricingManager({
  pricing,
  onChange,
  label = "Pricing Tiers",
  description = "Add and manage ticket pricing for different visitor types",
}: PricingManagerProps) {
  const [newPricing, setNewPricing] = useState<PricingTier>({
    ticketType: "adult",
    price: 0,
    active: true,
  });

  const handleAddPricing = () => {
    if (newPricing.price <= 0) {
      return;
    }

    // Check if ticket type already exists
    if (pricing.some((p) => p.ticketType === newPricing.ticketType)) {
      return;
    }

    onChange([...pricing, { ...newPricing, id: Date.now().toString() }]);
    setNewPricing({
      ticketType: "adult",
      price: 0,
      active: true,
    });
  };

  const handleRemovePricing = (index: number) => {
    onChange(pricing.filter((_, i) => i !== index));
  };

  const handleUpdatePrice = (index: number, price: number) => {
    const updated = [...pricing];
    updated[index].price = price;
    onChange(updated);
  };

  const handleToggleActive = (index: number) => {
    const updated = [...pricing];
    updated[index].active = !updated[index].active;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Current Pricing Tiers */}
      {pricing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pricing.map((tier, index) => (
                <div
                  key={tier.id || index}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {TICKET_TYPE_LABELS[tier.ticketType as keyof typeof TICKET_TYPE_LABELS] || tier.ticketType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ₹{tier.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tier.active !== false}
                      onChange={() => handleToggleActive(index)}
                      className="rounded"
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePricing(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Pricing Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Pricing Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-type">Ticket Type</Label>
                <Select
                  value={newPricing.ticketType}
                  onValueChange={(value) =>
                    setNewPricing({ ...newPricing, ticketType: value })
                  }
                >
                  <SelectTrigger id="ticket-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="10"
                  value={newPricing.price || ""}
                  onChange={(e) =>
                    setNewPricing({
                      ...newPricing,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter price"
                />
              </div>
            </div>

            <Button
              onClick={handleAddPricing}
              disabled={
                newPricing.price <= 0 ||
                pricing.some((p) => p.ticketType === newPricing.ticketType)
              }
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pricing Tier
            </Button>

            {pricing.some((p) => p.ticketType === newPricing.ticketType) && (
              <p className="text-xs text-destructive">
                This ticket type already exists
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
