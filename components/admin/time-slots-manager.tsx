"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Save, X, Clock } from "lucide-react";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  day_of_week: number | null;
  active: boolean;
}

interface Props {
  exhibitionId: string;
}

const DAYS_OF_WEEK = [
  { value: null, label: "All Days" },
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function TimeSlotsManager({ exhibitionId }: Props) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    startTime: "10:00",
    endTime: "11:00",
    capacity: 50,
    dayOfWeek: null as number | null,
    active: true,
  });

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/time-slots`);
      if (!response.ok) throw new Error("Failed to fetch time slots");
      const data = await response.json();
      setTimeSlots(data.timeSlots || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [exhibitionId]);

  const handleSave = async () => {
    try {
      const url = `/api/admin/exhibitions/${exhibitionId}/time-slots`;
      const method = editingSlot ? "PUT" : "POST";
      const body = editingSlot
        ? { slotId: editingSlot.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save time slot");

      toast.success(
        editingSlot ? "Time slot updated successfully" : "Time slot created successfully"
      );
      setEditingSlot(null);
      setIsCreating(false);
      resetForm();
      fetchTimeSlots();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return;

    try {
      const response = await fetch(
        `/api/admin/exhibitions/${exhibitionId}/time-slots?slotId=${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete time slot");

      toast.success("Time slot deleted successfully");
      fetchTimeSlots();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (slot: TimeSlot) => {
    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/time-slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          active: !slot.active,
        }),
      });

      if (!response.ok) throw new Error("Failed to update time slot");

      toast.success("Time slot status updated");
      fetchTimeSlots();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      startTime: slot.start_time,
      endTime: slot.end_time,
      capacity: slot.capacity,
      dayOfWeek: slot.day_of_week,
      active: slot.active,
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      startTime: "10:00",
      endTime: "11:00",
      capacity: 50,
      dayOfWeek: null,
      active: true,
    });
  };

  const cancelEdit = () => {
    setEditingSlot(null);
    setIsCreating(false);
    resetForm();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return <div>Loading time slots...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Slots
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure available time slots for bookings
            </p>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Time Slot
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isCreating && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) })
                  }
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Day of Week (Optional)</Label>
                <Select
                  value={formData.dayOfWeek?.toString() || "null"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      dayOfWeek: value === "null" ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem
                        key={day.value?.toString() || "null"}
                        value={day.value?.toString() || "null"}
                      >
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave as "All Days" to apply this slot to every day
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  {editingSlot ? "Update" : "Create"} Time Slot
                </Button>
                <Button variant="outline" onClick={cancelEdit} className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {timeSlots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No time slots configured yet. Add your first time slot to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Capacity: {slot.capacity}
                    </span>
                    {slot.day_of_week !== null && (
                      <span className="text-xs px-2 py-0.5 bg-background rounded">
                        {DAYS_OF_WEEK.find((d) => d.value === slot.day_of_week)?.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={slot.active}
                    onCheckedChange={() => handleToggleActive(slot)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => startEdit(slot)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(slot.id)}
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
