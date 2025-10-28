"use client";

import { useState } from "react";
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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PricingManager } from "./pricing-manager";

interface ShowDialogProps {
  mode?: "create" | "edit";
  show?: any;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ShowDialog({ mode = "create", show, trigger, onSuccess }: ShowDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: show?.name || "",
    description: show?.description || "",
    type: show?.type || "planetarium",
    durationMinutes: show?.duration_minutes || 45,
    thumbnailUrl: show?.thumbnail_url || "",
    status: show?.status || "active",
    pricing: show?.pricing || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === "create" 
        ? '/api/admin/shows'
        : `/api/admin/shows/${show.id}`;
      
      const method = mode === "create" ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save show');
      }

      toast.success(
        mode === "create" ? "Show created successfully!" : "Show updated successfully!"
      );

      setOpen(false);
      onSuccess?.();

      if (mode === "create") {
        setFormData({
          name: "",
          description: "",
          type: "planetarium",
          durationMinutes: 45,
          thumbnailUrl: "",
          status: "active",
          pricing: [],
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save show');
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
            Add Show
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Show" : "Edit Show"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new show to your schedule."
              : "Update show details and settings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="show-name">Show Name *</Label>
            <Input
              id="show-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Cosmos Journey"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="show-description">Description *</Label>
            <Textarea
              id="show-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the show experience..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="show-type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="show-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planetarium">Planetarium</SelectItem>
                  <SelectItem value="3d_theatre">3D Theatre</SelectItem>
                  <SelectItem value="holography">Holography</SelectItem>
                  <SelectItem value="live_demo">Live Demo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="show-status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="show-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="show-duration">Duration (min) *</Label>
              <Input
                id="show-duration"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })
                }
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="show-thumbnail">Thumbnail URL</Label>
              <Input
                id="show-thumbnail"
                value={formData.thumbnailUrl}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnailUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Pricing Management */}
          <div className="border-t pt-4">
            <PricingManager
              pricing={formData.pricing}
              onChange={(pricing) => setFormData({ ...formData, pricing })}
              label="Show Pricing"
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
              {mode === "create" ? "Create Show" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}






