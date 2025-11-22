"use client";

import { useState, useEffect } from "react";
import { PricingManager } from "./pricing-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface PricingTier {
  id?: string;
  ticketType: string;
  price: number;
  active?: boolean;
  validFrom?: string;
}

interface Props {
  exhibitionId: string;
}

export function PricingManagerWrapper({ exhibitionId }: Props) {
  const [pricing, setPricing] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/pricing`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }
      
      const data = await response.json();
      
      // Transform database format to component format
      const transformedPricing = (data.pricing || []).map((p: any) => ({
        id: p.id,
        ticketType: p.ticket_type,
        price: p.price,
        active: p.active,
        validFrom: p.valid_from
      }));
      
      setPricing(transformedPricing);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [exhibitionId]);

  const handlePricingChange = async (newPricing: PricingTier[]) => {
    // Immediately update local state for instant UI feedback
    setPricing(newPricing);
    
    try {
      setSaving(true);
      
      // Find new items (no id)
      const newItems = newPricing.filter(p => !p.id);
      
      // Find removed items
      const removedItems = pricing.filter(
        oldP => !newPricing.find(newP => newP.id === oldP.id)
      );
      
      // Find updated items
      const updatedItems = newPricing.filter(newP => {
        if (!newP.id) return false;
        const oldP = pricing.find(p => p.id === newP.id);
        return oldP && (
          oldP.price !== newP.price || 
          oldP.active !== newP.active
        );
      });

      // Create new pricing tiers
      for (const item of newItems) {
        const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/pricing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketType: item.ticketType,
            price: item.price,
            active: item.active !== false
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create pricing');
        }
      }

      // Update existing pricing tiers
      for (const item of updatedItems) {
        const response = await fetch(
          `/api/admin/exhibitions/${exhibitionId}/pricing?pricingId=${item.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              price: item.price,
              active: item.active
            })
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update pricing');
        }
      }

      // Delete removed pricing tiers
      for (const item of removedItems) {
        const response = await fetch(
          `/api/admin/exhibitions/${exhibitionId}/pricing?pricingId=${item.id}`,
          {
            method: 'DELETE'
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete pricing');
        }
      }

      toast.success('Pricing updated successfully');
      
      // Refresh pricing data from server to get IDs for new items
      await fetchPricing();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update pricing');
      // Revert to previous state on error
      await fetchPricing();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPricing}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {saving && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Saving pricing changes...</AlertDescription>
          </Alert>
        )}
        
        <PricingManager
          pricing={pricing}
          onChange={handlePricingChange}
          label="Exhibition Pricing"
          description="Manage ticket pricing for different visitor types"
        />
      </CardContent>
    </Card>
  );
}
