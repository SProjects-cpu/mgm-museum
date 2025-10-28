// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { z } from 'zod';

// Validation schema for payment initiation
const PaymentInitiationSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  paymentMethod: z.enum(['upi', 'bank_transfer'], {
    errorMap: () => ({ message: 'Payment method must be either upi or bank_transfer' })
  }),
  selectedBankAccount: z.string().uuid('Invalid bank account ID').optional(),
  customerInfo: z.object({
    name: z.string().min(1, 'Customer name is required').max(255, 'Name too long'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^(\+91|91|0)?[6-9]\d{9}$/, 'Invalid phone number format')
  }),
  metadata: z.record(z.any()).optional()
});

// Types for better type safety
interface PaymentInitiationRequest {
  bookingId: string;
  paymentMethod: 'upi' | 'bank_transfer';
  selectedBankAccount?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  metadata?: Record<string, any>;
}

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  upi_id?: string;
  is_active: boolean;
  display_order: number;
}

interface Booking {
  id: string;
  booking_reference: string;
  user_id: string | null;
  guest_email: string | null;
  exhibition_id: string | null;
  total_amount: number;
  status: string;
  payment_status: string;
}

interface Exhibition {
  id: string;
  name: string;
  category: string;
}

// POST /api/payments/initiate
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = PaymentInitiationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const { bookingId, paymentMethod, selectedBankAccount, customerInfo, metadata }: PaymentInitiationRequest = validationResult.data;

    // Initialize Supabase client
    const supabase = getServiceSupabase();

    // Verify booking exists and is eligible for payment
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found or invalid'
          }
        },
        { status: 404 }
      );
    }

    // Check if booking already has successful payment
    if (booking.payment_status === 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BOOKING_ALREADY_PAID',
            message: 'This booking has already been paid for'
          }
        },
        { status: 409 }
      );
    }

    // Get payment configuration
    const { data: paymentConfig } = await supabase
      .from('payment_configurations')
      .select('config_key, config_value')
      .in('config_key', ['payment_timeout_minutes', 'max_payment_amount', 'min_payment_amount']);

    const config = paymentConfig?.reduce((acc, item) => {
      acc[item.config_key] = item.config_value;
      return acc;
    }, {} as Record<string, any>) || {};

    const timeoutMinutes = parseInt(config.payment_timeout_minutes || '15');
    const maxAmount = parseInt(config.max_payment_amount || '50000');
    const minAmount = parseInt(config.min_payment_amount || '1');

    // Validate payment amount
    if (booking.total_amount > maxAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AMOUNT_TOO_HIGH',
            message: `Payment amount exceeds maximum limit of ₹${maxAmount}`
          }
        },
        { status: 400 }
      );
    }

    if (booking.total_amount < minAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AMOUNT_TOO_LOW',
            message: `Payment amount below minimum limit of ₹${minAmount}`
          }
        },
        { status: 400 }
      );
    }

    // For bank transfers, validate selected bank account
    if (paymentMethod === 'bank_transfer' && selectedBankAccount) {
      const { data: bankAccount, error: bankError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', selectedBankAccount)
        .eq('is_active', true)
        .single();

      if (bankError || !bankAccount) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_BANK_ACCOUNT',
              message: 'Selected bank account is not available'
            }
          },
          { status: 400 }
        );
      }
    }

    // Generate unique payment reference
    const { data: paymentRef } = await supabase
      .rpc('generate_payment_reference');

    // Calculate payment expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);

    // Create payment transaction record
    const { data: paymentTransaction, error: paymentError } = await supabase
      .from('payment_transactions')
      .insert({
        booking_id: bookingId,
        payment_gateway_id: `pg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        payment_method: paymentMethod,
        amount: booking.total_amount,
        currency: 'INR',
        status: 'initiated',
        reference_number: paymentRef,
        metadata: {
          customerInfo,
          bookingReference: booking.booking_reference,
          ...metadata
        },
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment transaction:', paymentError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_CREATION_FAILED',
            message: 'Failed to create payment transaction'
          }
        },
        { status: 500 }
      );
    }

    // Get bank account details for response
    let bankDetails = null;
    if (paymentMethod === 'bank_transfer' && selectedBankAccount) {
      const { data: bankAccount } = await supabase
        .from('bank_accounts')
        .select('account_name, account_number, bank_name, ifsc_code, upi_id')
        .eq('id', selectedBankAccount)
        .single();

      if (bankAccount) {
        bankDetails = {
          accountName: bankAccount.account_name,
          accountNumber: bankAccount.account_number,
          bankName: bankAccount.bank_name,
          ifscCode: bankAccount.ifsc_code,
          upiId: bankAccount.upi_id
        };
      }
    }

    // For UPI payments, get the first available UPI ID
    let upiId = null;
    if (paymentMethod === 'upi') {
      const { data: bankAccount } = await supabase
        .from('bank_accounts')
        .select('upi_id')
        .eq('is_active', true)
        .not('upi_id', 'is', null)
        .order('display_order')
        .limit(1)
        .single();

      upiId = bankAccount?.upi_id;
    }

    // Generate QR code data for UPI payments
    let qrCode = null;
    let qrCodeUrl = null;
    if (paymentMethod === 'upi' && upiId) {
      // Create UPI payment URL
      const upiUrl = `upi://pay?pa=${upiId}&pn=MGM%20Museum&am=${booking.total_amount}&cu=INR&tn=Payment%20for%20${booking.booking_reference}`;

      // In a real implementation, you would generate a QR code image
      // For now, we'll return the UPI URL
      qrCode = upiUrl;
      qrCodeUrl = `/api/qrcode?data=${encodeURIComponent(upiUrl)}`;
    }

    // Prepare response
    const response: CreatePaymentResponse = {
      success: true,
      data: {
        paymentId: paymentTransaction.id,
        bookingId: bookingId,
        amount: booking.total_amount,
        currency: 'INR',
        paymentMethod: paymentMethod,
        status: 'initiated',
        expiresAt: expiresAt.toISOString(),
        paymentDetails: {
          ...(upiId && { upiId }),
          ...(qrCode && { qrCode }),
          ...(qrCodeUrl && { qrCodeUrl }),
          ...(bankDetails && { bankDetails }),
          referenceNumber: paymentRef
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during payment initiation'
        }
      },
      { status: 500 }
    );
  }
}

// GET /api/payments/initiate - Not allowed
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET method not allowed for this endpoint'
      }
    },
    { status: 405 }
  );
}