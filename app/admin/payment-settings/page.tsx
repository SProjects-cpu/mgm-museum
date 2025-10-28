"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Settings, Eye, EyeOff, Save } from "lucide-react";

export default function PaymentSettingsPage() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [encryptionKeyConfigured, setEncryptionKeyConfigured] = useState(false);
  const [setupInstructions, setSetupInstructions] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    environment: "test",
    keyId: "",
    keySecret: "",
    webhookSecret: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [credsRes, configsRes, envRes] = await Promise.all([
        fetch("/api/admin/payment-settings/credentials"),
        fetch("/api/admin/payment-settings/configurations"),
        fetch("/api/admin/payment-settings/env-setup")
      ]);

      if (credsRes.ok) {
        const data = await credsRes.json();
        setCredentials(data.credentials || []);
      }

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigurations(data.configurations || []);
      }

      if (envRes.ok) {
        const data = await envRes.json();
        setEncryptionKeyConfigured(data.encryptionKeyConfigured);
        setSetupInstructions(data.setupInstructions);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.keyId || !formData.keySecret) {
      toast.error("Key ID and Secret are required to test");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/payment-settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId: formData.keyId,
          keySecret: formData.keySecret
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`✅ ${data.message}`);
      } else {
        toast.error(data.error || "Connection test failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!formData.keyId || !formData.keySecret || !formData.webhookSecret) {
      toast.error("All fields are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/payment-settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setFormData({ environment: "test", keyId: "", keySecret: "", webhookSecret: "" });
        fetchData();
      } else {
        toast.error(data.error || "Failed to save credentials");
      }
    } catch (error) {
      toast.error("Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <p className="text-muted-foreground">Manage Razorpay credentials and payment configurations</p>
      </div>

      {!encryptionKeyConfigured && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">⚠️ Setup Required</CardTitle>
            <CardDescription className="text-yellow-800">Encryption key not configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-yellow-900">
              Add the following to your <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code> file:
            </p>
            <div className="bg-yellow-100 p-3 rounded font-mono text-sm break-all">
              DATABASE_ENCRYPTION_KEY=YzQ3GlNzntjVLy16kSgvEJZS4PNHDdit19QiosSftxM=
            </div>
            <p className="text-xs text-yellow-800">
              After adding the key, restart your development server and refresh this page.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Razorpay Credentials
          </CardTitle>
          <CardDescription>Add or update encrypted Razorpay API credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Environment</Label>
              <Select value={formData.environment} onValueChange={(v) => setFormData({ ...formData, environment: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Razorpay Key ID</Label>
            <Input
              type={showSecrets ? "text" : "password"}
              value={formData.keyId}
              onChange={(e) => setFormData({ ...formData, keyId: e.target.value })}
              placeholder="rzp_test_xxxxx"
            />
          </div>

          <div>
            <Label>Razorpay Key Secret</Label>
            <Input
              type={showSecrets ? "text" : "password"}
              value={formData.keySecret}
              onChange={(e) => setFormData({ ...formData, keySecret: e.target.value })}
              placeholder="Enter secret key"
            />
          </div>

          <div>
            <Label>Webhook Secret</Label>
            <Input
              type={showSecrets ? "text" : "password"}
              value={formData.webhookSecret}
              onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
              placeholder="Enter webhook secret"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowSecrets(!showSecrets)} variant="outline">
              {showSecrets ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showSecrets ? "Hide" : "Show"} Secrets
            </Button>
            <Button onClick={handleTestConnection} disabled={saving} variant="secondary">
              🔗 Test Connection
            </Button>
            <Button onClick={handleSaveCredentials} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Credentials
            </Button>
          </div>

          {credentials.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Existing Credentials</h3>
              {credentials.map((cred) => (
                <div key={cred.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <Badge>{cred.environment}</Badge>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {cred.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Updated: {new Date(cred.updated_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Payment Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {configurations.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{config.config_key}</span>
                  <span className="ml-2 text-muted-foreground">{config.config_value}</span>
                </div>
                <Badge variant={config.is_active ? "default" : "secondary"}>
                  {config.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
