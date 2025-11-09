"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EXHIBITION_CATEGORY_LABELS } from "@/types";
import { PricingManager } from "./pricing-manager";

interface ExhibitionDialogProps {
  mode?: "create" | "edit";
  exhibition?: any;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface PricingTier {
  id?: string;
  ticketType: string;
  price: number;
  active?: boolean;
}

export function ExhibitionDialog({
  mode = "create",
  exhibition,
  trigger,
  onSuccess,
}: ExhibitionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: exhibition?.name || "",
    description: exhibition?.description || "",
    shortDescription: exhibition?.short_description || "",
    category: exhibition?.category || "planetarium",
    capacity: exhibition?.capacity || 100,
    durationMinutes: exhibition?.duration_minutes || 60,
    status: exhibition?.status || "active",
    featured: exhibition?.featured || false,
    pricing: exhibition?.pricing || [],
  });

  // Fetch exhibition data when dialog opens in edit mode
  const fetchExhibitionData = async () => {
    if (mode === "edit" && exhibition?.id && open) {
      try {
        setLoading(true);
        setFetchError(null);
        const response = await fetch(`/api/admin/exhibitions/${exhibition.id}`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch exhibition details');
        }
        
        const data = await response.json();
        const exhibitionData = data.exhibition;
        
        setFormData({
          name: exhibitionData.name || "",
          description: exhibitionData.description || "",
          shortDescription: exhibitionData.short_description || "",
          category: exhibitionData.category || "planetarium",
          capacity: exhibitionData.capacity || 100,
          durationMinutes: exhibitionData.duration_minutes || 60,
          status: exhibitionData.status || "active",
          featured: exhibitionData.featured || false,
          pricing: exhibitionData.pricing || [],
        });
      } catch (error: any) {
        console.error('Error fetching exhibition:', error);
        setFetchError(error.message);
        toast.error(error.message || 'Failed to load exhibition details');
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchExhibitionData();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === "create" 
        ? '/api/admin/exhibitions'
        : `/api/admin/exhibitions/${exhibition.id}`;
      
      const method = mode === "create" ? 'POST' : 'PUT';

      const payload = mode === "edit" 
        ? { ...formData, id: exhibition.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save exhibition');
      }

      toast.success(
        mode === "create"
          ? "Exhibition created successfully!"
          : "Exhibition updated successfully!"
      );

      setOpen(false);
      onSuccess?.();

      if (mode === "create") {
        setFormData({
          name: "",
          description: "",
          shortDescription: "",
          category: "planetarium",
          capacity: 100,
          durationMinutes: 60,
          status: "active",
          featured: false,
          pricing: [],
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save exhibition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Exhibition
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Exhibition" : "Edit Exhibition"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new exhibition to your museum collection."
              : "Update exhibition details and settings."}
          </DialogDescription>
        </DialogHeader>

        {fetchError && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {fetchError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Exhibition Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full Dome Planetarium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description *</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value })
                }
                placeholder="Brief description for listings..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="rounded"
                />
                Feature on Homepage
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the exhibition experience..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXHIBITION_CATEGORY_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="coming-soon">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duration (min) *</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  required
                />
              </div>
            </div>

          </div>

          {/* Pricing Management */}
          <div className="border-t pt-4">
            <PricingManager
              pricing={formData.pricing}
              onChange={(pricing) => setFormData({ ...formData, pricing })}
              label="Exhibition Pricing"
              description="Add ticket pricing for different visitor types"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Create Exhibition" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}






