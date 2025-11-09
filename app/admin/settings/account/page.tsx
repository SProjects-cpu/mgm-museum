"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Save, Mail, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.currentPassword || !emailForm.newEmail) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/account/request-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: emailForm.currentPassword,
          newEmail: emailForm.newEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request email change');
      }

      setVerificationSent(true);
      setEmailForm({ currentPassword: "", newEmail: "" });
      toast.success(data.message);
    } catch (error) {
      console.error('Error requesting email change:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request email change');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    // Validate password strength
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(passwordForm.newPassword)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(passwordForm.newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/account/request-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success(data.message);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">
          Account Settings
        </h1>
        <p className="text-muted-foreground">Manage your admin account credentials</p>
      </div>

      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Change Email Address
          </CardTitle>
          <CardDescription>
            Update your login email address. You will need to verify the new email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationSent ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Verification Email Sent
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Please check your inbox and click the verification link to complete the email change.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-current-password">Current Password</Label>
                <Input
                  id="email-current-password"
                  type="password"
                  value={emailForm.currentPassword}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, currentPassword: e.target.value })
                  }
                  placeholder="Enter your current password"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">New Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, newEmail: e.target.value })
                  }
                  placeholder="Enter your new email address"
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader variant="classic" size="sm" className="mr-2" />}
                <Mail className="w-4 h-4 mr-2" />
                Send Verification Email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your login password. Must be at least 8 characters with uppercase, lowercase, and number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password-current-password">Current Password</Label>
              <Input
                id="password-current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                placeholder="Enter your current password"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="Enter your new password"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="Confirm your new password"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader variant="classic" size="sm" className="mr-2" />}
              <Save className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Password Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              Minimum 8 characters
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              At least one uppercase letter (A-Z)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              At least one lowercase letter (a-z)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              At least one number (0-9)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
