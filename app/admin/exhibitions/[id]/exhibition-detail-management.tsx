"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Loader2,
  Image as ImageIcon,
  FileText,
  Clock,
  DollarSign,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EXHIBITION_CATEGORY_LABELS } from "@/types";
import { ExhibitionContentManager } from "@/components/admin/exhibition-content-manager";
import { TimeSlotsManager } from "@/components/admin/time-slots-manager";
import { PricingManagerWrapper } from "@/components/admin/pricing-manager-wrapper";

import { ImageUploadZone } from "@/components/admin/image-upload-zone";

interface Props {
  exhibitionId: string;
}

export function ExhibitionDetailManagement({ exhibitionId }: Props) {
  const [exhibition, setExhibition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "planetarium",
    capacity: 100,
    durationMinutes: 60,
    status: "active",
    featured: false,
    images: [] as string[],
    videoUrl: "",
    virtualTourUrl: "",
  });

  const fetchExhibition = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/exhibitions?id=${exhibitionId}`);
      if (!response.ok) throw new Error("Failed to fetch exhibition");
      const data = await response.json();
      const exhibitionData = data.exhibitions?.[0];
      
      if (exhibitionData) {
        setExhibition(exhibitionData);
        setFormData({
          name: exhibitionData.name || "",
          description: exhibitionData.description || "",
          shortDescription: exhibitionData.short_description || "",
          category: exhibitionData.category || "planetarium",
          capacity: exhibitionData.capacity || 100,
          durationMinutes: exhibitionData.duration_minutes || 60,
          status: exhibitionData.status || "active",
          featured: exhibitionData.featured || false,
          images: exhibitionData.images || [],
          videoUrl: exhibitionData.video_url || "",
          virtualTourUrl: exhibitionData.virtual_tour_url || "",
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibition();
  }, [exhibitionId]);

  const handleSaveBasicInfo = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: exhibitionId,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to update exhibition");

      toast.success("Exhibition updated successfully");
      fetchExhibition();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Exhibition not found</p>
            <Button asChild className="mt-4">
              <Link href="/admin/exhibitions">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Exhibitions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/exhibitions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{exhibition.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={exhibition.status === "active" ? "default" : "secondary"}>
                {exhibition.status}
              </Badge>
              {exhibition.featured && <Badge variant="destructive">Featured</Badge>}
            </div>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/exhibitions/${exhibition.slug}`} target="_blank">
            View Live Page
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="timeslots">Time Slots</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Exhibition Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Full Dome Planetarium"
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXHIBITION_CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="coming_soon">Coming Soon</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) })
                    }
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: parseInt(e.target.value),
                      })
                    }
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, shortDescription: e.target.value })
                  }
                  placeholder="Brief description for listings"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed description"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Images</Label>
                <ImageUploadZone
                  exhibitionId={exhibitionId}
                  currentImages={formData.images}
                  onUploadSuccess={(url) => {
                    setFormData({
                      ...formData,
                      images: [...formData.images, url],
                    });
                  }}
                  onDeleteImage={(url) => {
                    setFormData({
                      ...formData,
                      images: formData.images.filter((img) => img !== url),
                    });
                  }}
                  maxFiles={10}
                  maxSizeMB={5}
                  bucket="exhibition-images"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="virtualTourUrl">Virtual Tour URL (Optional)</Label>
                  <Input
                    id="virtualTourUrl"
                    value={formData.virtualTourUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, virtualTourUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked })
                  }
                />
                <Label>Featured Exhibition</Label>
              </div>

              <Button onClick={handleSaveBasicInfo} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Sections Tab */}
        <TabsContent value="content">
          <ExhibitionContentManager exhibitionId={exhibitionId} />
        </TabsContent>

        {/* Time Slots Tab */}
        <TabsContent value="timeslots">
          <TimeSlotsManager exhibitionId={exhibitionId} />
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <PricingManagerWrapper exhibitionId={exhibitionId} />
        </TabsContent>


      </Tabs>
    </div>
  );
}
