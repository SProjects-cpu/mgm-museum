"use client";

import { useState } from "react";
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
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    museumName: "MGM APJ Abdul Kalam Astrospace Science Centre",
    contactEmail: "info@mgmapjscicentre.org",
    contactPhone: "+91 (240) 123-4567",
    address: "Near Datta Mandir, Paithan Road, Aurangabad, Maharashtra 431005",
    openingTime: "09:30",
    closingTime: "17:30",
    closedDay: "monday",
    advanceBooking: 90,
    cancellationWindow: 24,
    serviceFee: 2,
    enableOnlineBooking: true,
    enableNotifications: true,
    maintenanceMode: false,
    autoConfirmBookings: false,
  });

  const handleSave = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Settings saved successfully!");
    setLoading(false);
  };

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
              value={settings.museumName}
              onChange={(e) =>
                setSettings({ ...settings, museumName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={settings.contactEmail}
              onChange={(e) =>
                setSettings({ ...settings, contactEmail: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Contact Phone</Label>
            <Input
              id="contact-phone"
              value={settings.contactPhone}
              onChange={(e) =>
                setSettings({ ...settings, contactPhone: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={settings.address}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
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
                value={settings.openingTime}
                onChange={(e) =>
                  setSettings({ ...settings, openingTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing-time">Closing Time</Label>
              <Input
                id="closing-time"
                type="time"
                value={settings.closingTime}
                onChange={(e) =>
                  setSettings({ ...settings, closingTime: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closed-day">Weekly Closed Day</Label>
            <Select
              value={settings.closedDay}
              onValueChange={(value) =>
                setSettings({ ...settings, closedDay: value })
              }
            >
              <SelectTrigger id="closed-day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="none">No Closed Day</SelectItem>
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
                value={settings.advanceBooking}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    advanceBooking: parseInt(e.target.value),
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
                value={settings.cancellationWindow}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cancellationWindow: parseInt(e.target.value),
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
                value={settings.serviceFee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    serviceFee: parseInt(e.target.value),
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
                checked={settings.enableOnlineBooking}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOnlineBooking: checked })
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
                checked={settings.autoConfirmBookings}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoConfirmBookings: checked })
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
                checked={settings.enableNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableNotifications: checked })
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
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button size="lg" onClick={handleSave} disabled={loading}>
          {loading && <Loader variant="classic" size="sm" className="mr-2" />}
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
        <Button size="lg" variant="outline" disabled={loading}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}




