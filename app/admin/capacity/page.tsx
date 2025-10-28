'use client';
// @ts-nocheck

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Users, Settings, AlertCircle, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { getServiceSupabase } from '@/lib/supabase/client';

interface CapacityOverride {
  id?: string;
  override_date: string;
  capacity: number;
  reason?: string;
  is_closed: boolean;
}

export default function AdminCapacityPage() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [overrides, setOverrides] = useState<CapacityOverride[]>([]);
  const [editing, setEditing] = useState<CapacityOverride | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverrides();
  }, []);

  const fetchOverrides = async () => {
    try {
      const supabase = getServiceSupabase();
      const { data, error } = await supabase
        .from('capacity_overrides')
        .select('*')
        .order('override_date');

      if (!error && data) {
        setOverrides(data as any);
      }
    } catch (error) {
      console.error('Error fetching overrides:', error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if override exists
    const existing = overrides.find(o => o.override_date === dateStr);
    
    if (existing) {
      setEditing(existing);
    } else {
      setEditing({
        override_date: dateStr,
        capacity: 50,
        reason: '',
        is_closed: false,
      });
    }
  };

  const handleSave = async () => {
    if (!editing) return;

    setLoading(true);
    try {
      const supabase = getServiceSupabase();

      if (editing.id) {
        // Update existing
        const { error } = await supabase
          .from('capacity_overrides')
          .update({
            capacity: editing.capacity,
            reason: editing.reason,
            is_closed: editing.is_closed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editing.id);

        if (error) throw error;
        toast.success('Capacity override updated');
      } else {
        // Create new
        const { error } = await supabase
          .from('capacity_overrides')
          .insert({
            override_date: editing.override_date,
            capacity: editing.capacity,
            reason: editing.reason,
            is_closed: editing.is_closed,
          });

        if (error) throw error;
        toast.success('Capacity override created');
      }

      fetchOverrides();
      setEditing(null);
      setSelectedDate(undefined);
    } catch (error: any) {
      console.error('Error saving override:', error);
      toast.error(error.message || 'Failed to save capacity override');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this capacity override?')) return;

    setLoading(true);
    try {
      const supabase = getServiceSupabase();
      const { error } = await supabase
        .from('capacity_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Capacity override deleted');
      fetchOverrides();
      setEditing(null);
      setSelectedDate(undefined);
    } catch (error: any) {
      console.error('Error deleting override:', error);
      toast.error(error.message || 'Failed to delete capacity override');
    } finally {
      setLoading(false);
    }
  };

  const getDateModifiers = () => {
    const closed: Date[] = [];
    const modified: Date[] = [];

    overrides.forEach(override => {
      const date = new Date(override.override_date);
      if (override.is_closed) {
        closed.push(date);
      } else {
        modified.push(date);
      }
    });

    return { closed, modified };
  };

  const { closed, modified } = getDateModifiers();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Capacity Management</h1>
        <p className="text-muted-foreground">
          Manage daily capacity and closure dates
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={{ closed, modified }}
              modifiersClassNames={{
                closed: 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100',
                modified: 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100',
              }}
              className="rounded-md border"
            />

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900 border border-red-200" />
                <span>Closed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 border border-blue-200" />
                <span>Capacity Modified</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Capacity Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm font-medium">
                    {new Date(editing.override_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Closed Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label>Museum Closed</Label>
                      <p className="text-xs text-muted-foreground">
                        Mark this day as closed
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={editing.is_closed}
                    onCheckedChange={(checked) =>
                      setEditing({ ...editing, is_closed: checked })
                    }
                  />
                </div>

                {/* Capacity */}
                {!editing.is_closed && (
                  <div className="space-y-2">
                    <Label htmlFor="capacity">
                      Daily Capacity
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="capacity"
                        type="number"
                        min="0"
                        max="500"
                        value={editing.capacity}
                        onChange={(e) =>
                          setEditing({ ...editing, capacity: parseInt(e.target.value) || 0 })
                        }
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default capacity is 50 per time slot
                    </p>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason (Optional)
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Special event, maintenance, holiday"
                    value={editing.reason || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, reason: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  {editing.id && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(editing.id!)}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setSelectedDate(undefined);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a date to manage capacity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overrides List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Overrides</CardTitle>
        </CardHeader>
        <CardContent>
          {overrides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No capacity overrides configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(override.override_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {override.is_closed ? (
                        <Badge variant="destructive">Closed</Badge>
                      ) : (
                        <>Capacity: {override.capacity}</>
                      )}
                    </p>
                    {override.reason && (
                      <p className="text-xs text-muted-foreground mt-1">{override.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(new Date(override.override_date));
                      setEditing(override);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
