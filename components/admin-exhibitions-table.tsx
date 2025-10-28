"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { EXHIBITION_CATEGORY_LABELS } from "@/types";
import { toast } from "sonner";
import { useRealtimeSync } from "@/lib/contexts/realtime-sync-context";

interface Exhibition {
  id: string;
  slug: string;
  name: string;
  category: string;
  short_description?: string;
  shortDescription?: string;
  duration_minutes?: number;
  durationMinutes?: number;
  capacity: number;
  images?: string[];
  status: string;
  featured: boolean;
  display_order?: number;
  displayOrder?: number;
  pricing?: Array<{ ticketType: string; price: number }>;
}

export function AdminExhibitionsTable() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Call hooks at top level - MUST be before any conditional returns or useEffect
  const { isConnected, refreshData, subscribeToTable } = useRealtimeSync();

  // Fetch exhibitions from API
  const fetchExhibitions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/admin/exhibitions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setExhibitions(data.exhibitions);
      } else {
        console.error('Failed to fetch exhibitions:', data.error);
        toast.error('Failed to load exhibitions');
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      toast.error('Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  // Initial fetch
  useEffect(() => {
    fetchExhibitions();
  }, [fetchExhibitions]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToTable('exhibitions', (update) => {
      console.log('Admin: Exhibition update received:', update);
      // Refresh data when updates occur
      fetchExhibitions();
    });

    return unsubscribe;
  }, [fetchExhibitions, subscribeToTable]);

  const filteredExhibitions = exhibitions.filter((exhibition) => {
    const matchesSearch = exhibition.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || exhibition.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/exhibitions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          featured: !currentStatus
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Featured status updated');
        fetchExhibitions(); // Refresh the list
        refreshData(['exhibitions']); // Trigger real-time update
      } else {
        toast.error(data.error || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  const handleDeleteExhibition = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/exhibitions?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Exhibition deleted successfully');
        fetchExhibitions(); // Refresh the list
        refreshData(['exhibitions']); // Trigger real-time update
      } else {
        toast.error(data.error || 'Failed to delete exhibition');
      }
    } catch (error) {
      console.error('Error deleting exhibition:', error);
      toast.error('Failed to delete exhibition');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">
              Exhibitions Management
            </h1>
            <p className="text-muted-foreground font-medium">
              Loading exhibitions...
            </p>
          </div>
        </div>
        <Card className="border-2">
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
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
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground font-medium">
              Manage all exhibitions, shows, and galleries
            </p>
            {isConnected && (
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </Badge>
            )}
          </div>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg rounded-xl">
          <Plus className="w-4 h-4" />
          Add Exhibition
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search exhibitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
                className="rounded-xl"
              >
                All
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
                className="rounded-xl"
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "maintenance" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("maintenance")}
                className="rounded-xl"
              >
                Maintenance
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                onClick={fetchExhibitions}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exhibitions Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            All Exhibitions ({filteredExhibitions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Bookings</TableHead>
                  <TableHead className="font-semibold">Revenue</TableHead>
                  <TableHead className="font-semibold">Capacity</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExhibitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No exhibitions found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExhibitions.map((exhibition) => (
                    <TableRow
                      key={exhibition.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{exhibition.name}</p>
                            {exhibition.featured && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {EXHIBITION_CATEGORY_LABELS[exhibition.category as keyof typeof EXHIBITION_CATEGORY_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exhibition.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {exhibition.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {Math.floor(Math.random() * 200) + 50}
                      </TableCell>
                      <TableCell className="font-bold text-primary tabular-nums">
                        {formatCurrency(Math.random() * 20000 + 5000)}
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {exhibition.capacity}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                            <Link href={`/exhibitions/${exhibition.slug}`} target="_blank">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => handleToggleFeatured(exhibition.id, exhibition.featured)}
                            title={exhibition.featured ? "Remove from featured" : "Mark as featured"}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => handleDeleteExhibition(exhibition.id, exhibition.name)}
                          >
                            <Trash2 className="w-4 h-4 text-error" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
