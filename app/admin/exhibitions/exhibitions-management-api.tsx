"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Star,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { ExhibitionDialog } from "@/components/admin/exhibition-dialog";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";

interface Exhibition {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  status: string;
  capacity: number | null;
  duration_minutes: number | null;
  featured_image: string | null;
  is_featured: boolean;
  display_order: number;
  pricing?: any[];
}

export function ExhibitionsManagement() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/admin/exhibitions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch exhibitions');
      
      const data = await response.json();
      setExhibitions(data.exhibitions || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibitions();
  }, [filterStatus]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const response = await fetch(`/api/admin/exhibitions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete exhibition');
      
      toast.success('Exhibition deleted successfully');
      fetchExhibitions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete exhibition');
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/exhibitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update featured status');
      
      toast.success('Featured status updated');
      fetchExhibitions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update featured status');
    }
  };

  const filteredExhibitions = exhibitions.filter((exhibition) => {
    const matchesSearch = exhibition.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">
            Exhibitions Management
          </h1>
          <p className="text-muted-foreground">
            Manage all exhibitions, shows, and galleries with real-time updates
          </p>
        </div>
        <ExhibitionDialog mode="create" onSuccess={fetchExhibitions} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search exhibitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("inactive")}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exhibitions Grid */}
      {filteredExhibitions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No exhibitions found</p>
            <ExhibitionDialog mode="create" onSuccess={fetchExhibitions} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExhibitions.map((exhibition) => (
            <Card key={exhibition.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      {exhibition.name}
                      {exhibition.is_featured && (
                        <Star className="w-4 h-4 fill-warning text-warning" />
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{exhibition.category}</Badge>
                      <Badge
                        variant={exhibition.status === 'active' ? 'default' : 'secondary'}
                        className={exhibition.status === 'active' ? 'bg-success text-success-foreground' : ''}
                      >
                        {exhibition.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  {exhibition.description && (
                    <p className="text-muted-foreground line-clamp-2">
                      {exhibition.description}
                    </p>
                  )}
                  {exhibition.capacity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-semibold">{exhibition.capacity}</span>
                    </div>
                  )}
                  {exhibition.duration_minutes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-semibold">{exhibition.duration_minutes} min</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pricing:</span>
                    <span className="font-semibold">{exhibition.pricing?.length || 0} tiers</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/admin/exhibitions/${exhibition.id}`}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFeatured(exhibition.id, exhibition.is_featured)}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(exhibition.id, exhibition.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
