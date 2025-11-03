'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface TicketShowcaseConfig {
  id: string;
  is_enabled: boolean;
  price_per_person: number;
  currency: string;
  currency_symbol: string;
  button_text: string;
  button_link: string;
  opening_time: string;
  closing_time: string;
  closed_days: string[];
  features: string[];
  experience_types: Array<{ value: string; label: string }>;
}

export default function TicketShowcaseAdmin() {
  const [config, setConfig] = useState<TicketShowcaseConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [newExpType, setNewExpType] = useState({ value: '', label: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ticket-showcase');
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/ticket-showcase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Configuration saved successfully');
        setConfig(data.config);
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      toast.error('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim() || !config) return;
    setConfig({
      ...config,
      features: [...config.features, newFeature.trim()],
    });
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    if (!config) return;
    setConfig({
      ...config,
      features: config.features.filter((_, i) => i !== index),
    });
  };

  const addExperienceType = () => {
    if (!newExpType.value.trim() || !newExpType.label.trim() || !config) return;
    setConfig({
      ...config,
      experience_types: [...config.experience_types, { ...newExpType }],
    });
    setNewExpType({ value: '', label: '' });
  };

  const removeExperienceType = (index: number) => {
    if (!config) return;
    setConfig({
      ...config,
      experience_types: config.experience_types.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!config) {
    return <div className="p-8">Failed to load configuration</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ticket Showcase Configuration</h1>
          <p className="text-muted-foreground">Manage the homepage ticket booking widget</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Enable/Disable */}
        <Card>
          <CardHeader>
            <CardTitle>Widget Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.is_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, is_enabled: checked })}
              />
              <Label>Show widget on homepage</Label>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Currency Symbol</Label>
                <Input
                  value={config.currency_symbol}
                  onChange={(e) => setConfig({ ...config, currency_symbol: e.target.value })}
                />
              </div>
              <div>
                <Label>Price Per Person</Label>
                <Input
                  type="number"
                  value={config.price_per_person}
                  onChange={(e) => setConfig({ ...config, price_per_person: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Currency Code</Label>
                <Input
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new feature"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFeature()}
              />
              <Button onClick={addFeature}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {config.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="flex-1">{feature}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeFeature(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Experience Types */}
        <Card>
          <CardHeader>
            <CardTitle>Experience Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Value (e.g., general)"
                value={newExpType.value}
                onChange={(e) => setNewExpType({ ...newExpType, value: e.target.value })}
              />
              <Input
                placeholder="Label (e.g., General Admission)"
                value={newExpType.label}
                onChange={(e) => setNewExpType({ ...newExpType, label: e.target.value })}
              />
              <Button onClick={addExperienceType}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {config.experience_types.map((type, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="flex-1">{type.label} ({type.value})</span>
                  <Button variant="ghost" size="sm" onClick={() => removeExperienceType(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Opening Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Opening Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Opening Time</Label>
                <Input
                  value={config.opening_time}
                  onChange={(e) => setConfig({ ...config, opening_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Closing Time</Label>
                <Input
                  value={config.closing_time}
                  onChange={(e) => setConfig({ ...config, closing_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Closed Days (comma-separated)</Label>
              <Input
                value={config.closed_days.join(', ')}
                onChange={(e) => setConfig({ ...config, closed_days: e.target.value.split(',').map(d => d.trim()) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Button Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Call-to-Action Button</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Button Text</Label>
              <Input
                value={config.button_text}
                onChange={(e) => setConfig({ ...config, button_text: e.target.value })}
              />
            </div>
            <div>
              <Label>Button Link</Label>
              <Input
                value={config.button_link}
                onChange={(e) => setConfig({ ...config, button_link: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
