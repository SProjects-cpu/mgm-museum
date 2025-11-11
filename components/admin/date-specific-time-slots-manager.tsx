"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Save, X, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

interface DateSpecificTimeSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  current_bookings: number;
  active: boolean;
}

interface Props {
  exhibitionId: string;
}

export function DateSpecificTimeSlotsManager({ exhibitionId }: Props) {
  const [timeSlots, setTimeSlots] = useState<DateSpecificTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<DateSpecificTimeSlot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    slotDate: "",
    startTime: "10:00",
    endTime: "11:00",
    capacity: 50,
    active: true,
  });

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/date-time-slots`);
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
      if (!formData.slotDate) {
        toast.error("Please select a date");
        return;
      }

      const url = `/api/admin/exhibitions/${exhibitionId}/date-time-slots`;
      const method = editingSlot ? "PUT" : "POST";
      const body = editingSlot
        ? { slotId: editingSlot.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save time slot");
      }

      toast.success(
        editingSlot ? "Time slot updated successfully" : "Time slot created successfully"
      );
      setEditingSlot(null);
      setIsCreating(false);
      resetForm();
      await fetchTimeSlots(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return;

    try {
      const response = await fetch(
        `/api/admin/exhibitions/${exhibitionId}/date-time-slots?slotId=${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete time slot");

      toast.success("Time slot deleted successfully");
      await fetchTimeSlots(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (slot: DateSpecificTimeSlot) => {
    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/date-time-slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          active: !slot.active,
        }),
      });

      if (!response.ok) throw new Error("Failed to update time slot");

      toast.success("Time slot status updated");
      await fetchTimeSlots(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEdit = (slot: DateSpecificTimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      slotDate: slot.slot_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      capacity: slot.capacity,
      active: slot.active,
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      slotDate: "",
      startTime: "10:00",
      endTime: "11:00",
      capacity: 50,
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Group slots by date
  const slotsByDate = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) {
      acc[slot.slot_date] = [];
    }
    acc[slot.slot_date].push(slot);
    return acc;
  }, {} as Record<string, DateSpecificTimeSlot[]>);

  const sortedDates = Object.keys(slotsByDate).sort();

  if (loading) {
    return <div>Loading time slots...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date-Specific Time Slots
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage time slots for specific dates
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
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.slotDate}
                  onChange={(e) =>
                    setFormData({ ...formData, slotDate: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

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
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {slotsByDate[date].map((slot) => (
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
                            {slot.current_bookings}/{slot.capacity} booked
                          </span>
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
                          disabled={slot.current_bookings > 0}
                          title={slot.current_bookings > 0 ? "Cannot delete slot with bookings" : "Delete slot"}
                        >
                          <Trash2 className={`w-4 h-4 ${slot.current_bookings > 0 ? 'text-muted-foreground' : 'text-destructive'}`} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
