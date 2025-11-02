"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Trash2, Edit, AlertCircle } from "lucide-react";
import { ShowDialog } from "@/components/admin/show-dialog";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Show {
  id: string;
  name: string;
  type: string;
  status: string;
  duration_minutes: number;
  thumbnail_url?: string;
  pricing?: any[];
  time_slots?: any[];
}

export default function ShowsManagement() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('Shows Management - Rendering with', shows.length, 'shows');

  const fetchShows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/shows');
      if (!response.ok) throw new Error('Failed to fetch shows');
      const data = await response.json();
      setShows(data.shows || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const response = await fetch(`/api/admin/shows/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete show');
      
      toast.success('Show deleted successfully');
      fetchShows();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete show');
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
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">Shows Management</h1>
          <p className="text-muted-foreground">Manage planetarium shows and schedules</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {shows.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No shows found</p>
            <ShowDialog mode="create" onSuccess={fetchShows} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {shows.map((show) => (
          <Card key={show.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{show.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">{show.type}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ShowDialog 
                    mode="edit" 
                    show={show} 
                    onSuccess={fetchShows}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(show.id, show.name)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant={show.status === 'active' ? 'default' : 'secondary'}
                    className={show.status === 'active' ? 'bg-success text-success-foreground' : ''}
                  >
                    {show.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold">{show.duration_minutes} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pricing:</span>
                  <span className="font-semibold">{show.pricing?.length || 0} tiers</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time Slots:</span>
                  <span className="font-semibold">{show.time_slots?.length || 0} slots</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}



