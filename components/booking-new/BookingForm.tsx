'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Phone, User, AlertCircle } from 'lucide-react';
import type { BookingFormData } from '@/types/booking-new';

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  loading?: boolean;
  error?: string | null;
}

export function BookingForm({ onSubmit, loading, error }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    specialRequirements: '',
    accessibilityRequirements: '',
    marketingConsent: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};

    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Name is required';
    }

    if (!formData.visitorEmail.trim()) {
      newErrors.visitorEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.visitorEmail)) {
      newErrors.visitorEmail = 'Invalid email address';
    }

    if (formData.visitorPhone && !/^\+?[\d\s()-]{10,}$/.test(formData.visitorPhone)) {
      newErrors.visitorPhone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof BookingFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitor Details</CardTitle>
        <CardDescription>
          Please provide your contact information for booking confirmation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.visitorName}
                onChange={(e) => handleChange('visitorName', e.target.value)}
                className={`pl-10 ${errors.visitorName ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.visitorName && (
              <p className="text-sm text-destructive">{errors.visitorName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.visitorEmail}
                onChange={(e) => handleChange('visitorEmail', e.target.value)}
                className={`pl-10 ${errors.visitorEmail ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.visitorEmail && (
              <p className="text-sm text-destructive">{errors.visitorEmail}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Booking confirmation will be sent to this email
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.visitorPhone}
                onChange={(e) => handleChange('visitorPhone', e.target.value)}
                className={`pl-10 ${errors.visitorPhone ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.visitorPhone && (
              <p className="text-sm text-destructive">{errors.visitorPhone}</p>
            )}
          </div>

          {/* Special Requirements */}
          <div className="space-y-2">
            <Label htmlFor="special">Special Requirements (Optional)</Label>
            <Textarea
              id="special"
              placeholder="Dietary restrictions, group information, etc."
              value={formData.specialRequirements}
              onChange={(e) => handleChange('specialRequirements', e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Accessibility Requirements */}
          <div className="space-y-2">
            <Label htmlFor="accessibility">Accessibility Requirements (Optional)</Label>
            <Textarea
              id="accessibility"
              placeholder="Wheelchair access, hearing assistance, etc."
              value={formData.accessibilityRequirements}
              onChange={(e) => handleChange('accessibilityRequirements', e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Marketing Consent */}
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="marketing"
              checked={formData.marketingConsent}
              onCheckedChange={(checked) => handleChange('marketingConsent', checked === true)}
              disabled={loading}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="marketing"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Keep me updated
              </label>
              <p className="text-sm text-muted-foreground">
                Send me news about upcoming exhibitions, events, and special offers
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By confirming, you agree to our{' '}
            <a href="/terms" className="underline hover:text-primary">
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
