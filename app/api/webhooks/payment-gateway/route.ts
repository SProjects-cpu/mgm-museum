// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { z } from 'zod';

// Webhook payload validation schema
const PaymentWebhookSchema = z.object({
  eventType: z.enum([
    'payment.initiated',
    'payment.processing',
    'payment.completed',
    'payment.failed',
    'payment.expired'
  ]),
  paymentId: z.string().uuid('Invalid payment ID'),
  bookingId: z.string().uuid('Invalid booking ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  paymentMethod: z.enum(['upi', 'bank_transfer']),
  status: z.string(),
  timestamp: z.string().datetime('Invalid timestamp'),
  metadata: z.object({
    upiTransactionId: z.string().optional(),
    bankReference: z.string().optional(),
    customerVpa: z.string().optional(),
    gatewayTransactionId: z.string().optional()
  }).optional(),
  failureReason: z.string().optional()
});

// Types for better type safety
interface PaymentWebhookPayload {
  eventType: 'payment.initiated' | 'payment.processing' | 'payment.completed' | 'payment.failed' | 'payment.expired';
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'upi' | 'bank_transfer';
  status: string;
  timestamp: string;
  metadata?: {
    upiTransactionId?: string;
    bankReference?: string;
    customerVpa?: string;
    gatewayTransactionId?: string;
  };
  failureReason?: string;
}

// Webhook signature verification (implement based on your payment gateway)
async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Process payment completion
async function processPaymentCompletion(
  supabase: any,
  paymentId: string,
  webhookData: PaymentWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update payment transaction
    const { error: paymentError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        gateway_response: webhookData,
        completed_at: new Date().toISOString(),
        metadata: {
          ...webhookData.metadata,
          webhookReceivedAt: new Date().toISOString()
        }
      })
      .eq('id', paymentId);

    if (paymentError) {
      throw new Error(`Failed to update payment: ${paymentError.message}`);
    }

    // Update booking payment status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed'
      })
      .eq('id', webhookData.bookingId);

    if (bookingError) {
      throw new Error(`Failed to update booking: ${bookingError.message}`);
    }

    // Generate ticket automatically if enabled
    const { data: config } = await supabase
      .from('payment_configurations')
      .select('config_value')
      .eq('config_key', 'auto_ticket_generation')
      .single();

    if (config?.config_value === true) {
      // Trigger ticket generation (will be implemented in ticket service)
      await generateTicketForBooking(supabase, webhookData.bookingId);
    }

    // Send confirmation email (will be implemented in email service)
    await sendPaymentConfirmationEmail(supabase, webhookData.bookingId);

    return { success: true };
  } catch (error) {
    console.error('Error processing payment completion:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Process payment failure
async function processPaymentFailure(
  supabase: any,
  paymentId: string,
  webhookData: PaymentWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update payment transaction
    const { error: paymentError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        gateway_response: webhookData,
        failure_reason: webhookData.failureReason,
        metadata: {
          ...webhookData.metadata,
          webhookReceivedAt: new Date().toISOString()
        }
      })
      .eq('id', paymentId);

    if (paymentError) {
      throw new Error(`Failed to update payment: ${paymentError.message}`);
    }

    // Update booking payment status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'failed'
      })
      .eq('id', webhookData.bookingId);

    if (bookingError) {
      throw new Error(`Failed to update booking: ${bookingError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing payment failure:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Ticket generation placeholder (will be implemented in ticket service)
async function generateTicketForBooking(supabase: any, bookingId: string): Promise<void> {
  try {
    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        exhibitions(name, category),
        users(email, full_name)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Generate unique ticket number
    const { data: ticketNumber } = await supabase
      .rpc('generate_ticket_number');

    // Create QR code data
    const qrCodeData = `TICKET:${ticketNumber}:BOOKING:${bookingId}:EXHIBITION:${booking.exhibitions?.name}`;

    // Calculate expiry time (24 hours after visit date)
    const visitDateTime = new Date(`${booking.booking_date}T${booking.time_slot_id}`);
    const expiresAt = new Date(visitDateTime.getTime() + (24 * 60 * 60 * 1000));

    // Prepare ticket data
    const ticketData = {
      ticketNumber,
      bookingReference: booking.booking_reference,
      visitorName: booking.guest_name || booking.users?.full_name || 'Guest',
      visitorEmail: booking.guest_email || booking.users?.email,
      exhibitionName: booking.exhibitions?.name,
      exhibitionCategory: booking.exhibitions?.category,
      visitDate: booking.booking_date,
      timeSlot: booking.time_slot_id,
      amount: booking.total_amount,
      status: 'confirmed'
    };

    // Create ticket record
    const { error: ticketError } = await supabase
      .from('tickets')
      .insert({
        booking_id: bookingId,
        ticket_number: ticketNumber,
        ticket_data: ticketData,
        qr_code_data: qrCodeData,
        status: 'generated',
        expires_at: expiresAt.toISOString()
      });

    if (ticketError) {
      throw new Error(`Failed to create ticket: ${ticketError.message}`);
    }

    console.log(`Ticket generated successfully: ${ticketNumber} for booking: ${bookingId}`);
  } catch (error) {
    console.error('Error generating ticket:', error);
    // Don't throw error to prevent webhook processing failure
  }
}

// Email confirmation placeholder (will be implemented in email service)
async function sendPaymentConfirmationEmail(supabase: any, bookingId: string): Promise<void> {
  try {
    // Get booking details for email
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        exhibitions(name),
        users(email, full_name),
        tickets(ticket_number, pdf_url)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      throw new Error('Booking not found for email');
    }

    // Email sending logic will be implemented here
    console.log(`Payment confirmation email would be sent for booking: ${bookingId}`);

    // Update ticket status to indicate email sent
    if (booking.tickets?.[0]?.id) {
      await supabase
        .from('tickets')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', booking.tickets[0].id);
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw error to prevent webhook processing failure
  }
}

// POST /api/webhooks/payment-gateway
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-Payment-Signature') || '';
    const eventType = request.headers.get('X-Payment-Event') || '';

    // Get webhook secret from environment
    const webhookSecret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Payment gateway webhook secret not configured');
      return NextResponse.json(
        { success: false, message: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValidSignature) {
      console.warn('Invalid webhook signature received');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse and validate webhook payload
    let webhookData: PaymentWebhookPayload;
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      console.error('Invalid JSON in webhook payload:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const validationResult = PaymentWebhookSchema.safeParse(webhookData);

    if (!validationResult.success) {
      console.error('Invalid webhook payload structure:', validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payload structure',
          errors: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Log webhook event for audit trail
    await supabase
      .from('webhook_events')
      .insert({
        event_type: webhookData.eventType,
        provider: 'payment_gateway',
        payload: webhookData,
        signature: signature,
        processed: false
      });

    // Process webhook based on event type
    let processingResult = { success: true };

    switch (webhookData.eventType) {
      case 'payment.completed':
        processingResult = await processPaymentCompletion(supabase, webhookData.paymentId, webhookData);
        break;

      case 'payment.failed':
        processingResult = await processPaymentFailure(supabase, webhookData.paymentId, webhookData);
        break;

      case 'payment.processing':
        // Update payment status to processing
        await supabase
          .from('payment_transactions')
          .update({
            status: 'processing',
            gateway_response: webhookData
          })
          .eq('id', webhookData.paymentId);
        break;

      case 'payment.initiated':
      case 'payment.expired':
        // Update payment status
        await supabase
          .from('payment_transactions')
          .update({
            status: webhookData.eventType === 'payment.initiated' ? 'initiated' : 'expired',
            gateway_response: webhookData
          })
          .eq('id', webhookData.paymentId);
        break;

      default:
        console.warn(`Unknown webhook event type: ${webhookData.eventType}`);
    }

    // Update webhook event as processed
    await supabase
      .from('webhook_events')
      .update({
        processed: processingResult.success,
        processed_at: new Date().toISOString(),
        error_message: processingResult.error
      })
      .eq('event_type', webhookData.eventType)
      .eq('payload->paymentId', webhookData.paymentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!processingResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Webhook processed with errors',
          error: processingResult.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      processed: true
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during webhook processing'
      },
      { status: 500 }
    );
  }
}

// GET /api/webhooks/payment-gateway - Not allowed
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET method not allowed for webhook endpoint'
      }
    },
    { status: 405 }
  );
}