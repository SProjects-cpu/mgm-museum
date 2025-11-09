"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/ui/loader";
import { Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Settings {
  general: {
    museum_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
  };
  hours: {
    opening_time: string;
    closing_time: string;
    closed_day: string;
  };
  booking: {
    advance_booking_days: number;
    cancellation_window_hours: number;
    service_fee_percent: number;
    enable_online_booking: boolean;
    auto_confirm_bookings: boolean;
    enable_notifications: boolean;
  };
  system: {
    maintenance_mode: boolean;
  };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    general: {
      museum_name: "",
      contact_email: "",
      contact_phone: "",
      address: "",
    },
    hours: {
      opening_time: "",
      closing_time: "",
      closed_day: "",
    },
    booking: {
      advance_booking_days: 30,
      cancellation_window_hours: 24,
      service_fee_percent: 2.5,
      enable_online_booking: true,
      auto_confirm_bookings: true,
      enable_notifications: true,
    },
    system: {
      maintenance_mode: false,
    },
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    await fetchSettings();
    toast.info('Settings reset to saved values');
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader variant="classic" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">Settings</h1>
        <p className="text-muted-foreground">Configure museum settings and preferences</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic information about your museum</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="museum-name">Museum Name</Label>
            <Input
              id="museum-name"
              value={settings.general.museum_name}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, museum_name: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={settings.general.contact_email}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, contact_email: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Contact Phone</Label>
            <Input
              id="contact-phone"
              value={settings.general.contact_phone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, contact_phone: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={settings.general.address}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, address: e.target.value },
                })
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Opening Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Opening Hours</CardTitle>
          <CardDescription>Set your museum's operating hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opening-time">Opening Time</Label>
              <Input
                id="opening-time"
                type="time"
                value={settings.hours.opening_time}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hours: { ...settings.hours, opening_time: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing-time">Closing Time</Label>
              <Input
                id="closing-time"
                type="time"
                value={settings.hours.closing_time}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hours: { ...settings.hours, closing_time: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closed-day">Weekly Closed Day</Label>
            <Select
              value={settings.hours.closed_day}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  hours: { ...settings.hours, closed_day: value },
                })
              }
            >
              <SelectTrigger id="closed-day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
                <SelectItem value="None">No Closed Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Settings</CardTitle>
          <CardDescription>Configure booking and reservation policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advance-booking">Advance Booking (Days)</Label>
              <Input
                id="advance-booking"
                type="number"
                value={settings.booking.advance_booking_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    booking: {
                      ...settings.booking,
                      advance_booking_days: parseInt(e.target.value),
                    },
                  })
                }
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellation-window">Cancellation Window (Hours)</Label>
              <Input
                id="cancellation-window"
                type="number"
                value={settings.booking.cancellation_window_hours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    booking: {
                      ...settings.booking,
                      cancellation_window_hours: parseInt(e.target.value),
                    },
                  })
                }
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-fee">Service Fee (%)</Label>
              <Input
                id="service-fee"
                type="number"
                step="0.1"
                value={settings.booking.service_fee_percent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    booking: {
                      ...settings.booking,
                      service_fee_percent: parseFloat(e.target.value),
                    },
                  })
                }
                min="0"
                max="100"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="online-booking">Enable Online Booking</Label>
                <p className="text-sm text-muted-foreground">
                  Allow visitors to book tickets online
                </p>
              </div>
              <Switch
                id="online-booking"
                checked={settings.booking.enable_online_booking}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    booking: { ...settings.booking, enable_online_booking: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-confirm">Auto-Confirm Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically confirm bookings after payment
                </p>
              </div>
              <Switch
                id="auto-confirm"
                checked={settings.booking.auto_confirm_bookings}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    booking: { ...settings.booking, auto_confirm_bookings: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to customers
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.booking.enable_notifications}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    booking: { ...settings.booking, enable_notifications: checked },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Advanced system configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode" className="text-base">
                Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable public access to the website
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={settings.system.maintenance_mode}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  system: { ...settings.system, maintenance_mode: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button size="lg" onClick={handleSave} disabled={loading || fetching}>
          {loading && <Loader variant="classic" size="sm" className="mr-2" />}
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
        <Button size="lg" variant="outline" onClick={handleReset} disabled={loading || fetching}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Saved
        </Button>
      </div>
    </div>
  );
}




