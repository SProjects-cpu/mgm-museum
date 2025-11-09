import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/account/verify-change - Verify email change
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Find token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Verification token has already been used' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Update user email in Supabase Auth
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      {
        email: tokenData.new_email,
      }
    );

    if (updateAuthError) {
      console.error('[Verify API] Error updating user email in Auth:', updateAuthError);
      return NextResponse.json(
        { error: 'Failed to update email address' },
        { status: 500 }
      );
    }

    // Update user email in users table
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ email: tokenData.new_email })
      .eq('id', tokenData.user_id);

    if (updateUserError) {
      console.error('[Verify API] Error updating user email in users table:', updateUserError);
      // Continue anyway, Auth update is more important
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('email_verification_tokens')
      .update({ used: true })
      .eq('token', token);

    if (markUsedError) {
      console.error('[Verify API] Error marking token as used:', markUsedError);
      // Continue anyway, email is already updated
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email address updated successfully. Please log in with your new email.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Verify API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
