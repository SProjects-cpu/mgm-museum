"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Save, X, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface ScheduleOverride {
  id: string;
  exhibition_id: string;
  date: string;
  capacity: number | null;
  available: boolean;
  notes: string | null;
}

interface Props {
  exhibitionId: string;
}

export function ScheduleManager({ exhibitionId }: Props) {
  const [schedules, setSchedules] = useState<ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleOverride | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    capacity: null as number | null,
    available: true,
    notes: "",
  });

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/schedule`);
      if (!response.ok) throw new Error("Failed to fetch schedule overrides");
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [exhibitionId]);

  const handleSave = async () => {
    try {
      const url = `/api/admin/exhibitions/${exhibitionId}/schedule`;
      const method = editingSchedule ? "PUT" : "POST";
      const body = editingSchedule
        ? { scheduleId: editingSchedule.id, ...formData }
        : formData;

      const queryParams = editingSchedule ? `?scheduleId=${editingSchedule.id}` : '';
      const response = await fetch(`${url}${queryParams}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save schedule override');
      }

      toast.success(
        editingSchedule ? "Schedule override updated successfully" : "Schedule override created successfully"
      );
      setEditingSchedule(null);
      setIsCreating(false);
      resetForm();
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule override?")) return;

    try {
      const response = await fetch(
        `/api/admin/exhibitions/${exhibitionId}/schedule?scheduleId=${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete schedule override");

      toast.success("Schedule override deleted successfully");
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleAvailable = async (schedule: ScheduleOverride) => {
    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/schedule?scheduleId=${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          available: !schedule.available,
        }),
      });

      if (!response.ok) throw new Error("Failed to update schedule override");

      toast.success("Schedule override status updated");
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEdit = (schedule: ScheduleOverride) => {
    setEditingSchedule(schedule);
    setFormData({
      date: schedule.date,
      capacity: schedule.capacity,
      available: schedule.available,
      notes: schedule.notes || "",
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      date: "",
      capacity: null,
      available: true,
      notes: "",
    });
  };

  const cancelEdit = () => {
    setEditingSchedule(null);
    setIsCreating(false);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div>Loading schedule overrides...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Schedule Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure date-specific availability and capacity
            </p>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Schedule Override
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isCreating && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  disabled={!!editingSchedule}
                />
                {editingSchedule && (
                  <p className="text-xs text-muted-foreground">
                    Date cannot be changed after creation
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Capacity Override (Optional)</Label>
                <Input
                  type="number"
                  value={formData.capacity || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      capacity: e.target.value ? parseInt(e.target.value) : null 
                    })
                  }
                  min="0"
                  placeholder="Leave empty to use default capacity"
                />
                <p className="text-xs text-muted-foreground">
                  Override the default exhibition capacity for this specific date
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any notes about this schedule override..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.available}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, available: checked })
                  }
                />
                <Label>Available for Booking</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  {editingSchedule ? "Update" : "Create"} Schedule Override
                </Button>
                <Button variant="outline" onClick={cancelEdit} className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {schedules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No schedule overrides configured yet.</p>
            <p className="text-sm">Add your first override to customize availability for specific dates.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">
                      {formatDate(schedule.date)}
                    </span>
                    {schedule.capacity !== null && (
                      <span className="text-sm text-muted-foreground">
                        Capacity: {schedule.capacity}
                      </span>
                    )}
                    {!schedule.available && (
                      <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded">
                        Unavailable
                      </span>
                    )}
                  </div>
                  {schedule.notes && (
                    <p className="text-sm text-muted-foreground">{schedule.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={schedule.available}
                    onCheckedChange={() => handleToggleAvailable(schedule)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => startEdit(schedule)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
