import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { booking_id, rating, comment } = body;

    // Validate required fields
    if (!booking_id) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify booking belongs to user and is confirmed/completed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, status')
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return NextResponse.json(
        { success: false, message: 'Booking not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check booking status
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Can only provide feedback for confirmed or completed bookings' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('booking_id', booking_id)
      .single();

    if (existingFeedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback already exists for this booking' },
        { status: 409 }
      );
    }

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        booking_id,
        user_id: user.id,
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Failed to create feedback:', feedbackError);
      return NextResponse.json(
        { success: false, message: 'Failed to create feedback' },
        { status: 500 }
      );
    }

    console.log('Feedback created successfully:', feedback.id);

    return NextResponse.json({
      success: true,
      feedback,
      message: 'Feedback submitted successfully',
    });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
