// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

// GET /api/payments/[paymentId]/status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYMENT_ID',
            message: 'Invalid payment ID format'
          }
        },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get payment transaction with booking details
    const { data: payment, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        bookings!inner(
          id,
          booking_reference,
          total_amount,
          status,
          exhibitions(name, category)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment transaction not found'
          }
        },
        { status: 404 }
      );
    }

    // Check if payment has expired
    const now = new Date();
    const expiresAt = payment.expires_at ? new Date(payment.expires_at) : null;
    let currentStatus = payment.status;

    if (expiresAt && now > expiresAt && payment.status === 'initiated') {
      currentStatus = 'expired';

      // Update payment status to expired
      await supabase
        .from('payment_transactions')
        .update({ status: 'expired' })
        .eq('id', paymentId);
    }

    // Prepare response
    const response: PaymentStatusResponse = {
      success: true,
      data: {
        paymentId: payment.id,
        bookingId: payment.booking_id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        status: currentStatus,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        completedAt: payment.completed_at,
        failureReason: payment.failure_reason,
        metadata: payment.metadata
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while checking payment status'
        }
      },
      { status: 500 }
    );
  }
}

// POST /api/payments/[paymentId]/status - Not allowed
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'POST method not allowed for this endpoint'
      }
    },
    { status: 405 }
  );
}