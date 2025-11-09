import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend('re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE');

// POST /api/admin/account/request-change - Request credential change
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newEmail, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    if (!newEmail && !newPassword) {
      return NextResponse.json(
        { error: 'Either new email or new password must be provided' },
        { status: 400 }
      );
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Handle password change (no verification needed)
    if (newPassword && !newEmail) {
      // Validate password strength
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      if (!/[A-Z]/.test(newPassword)) {
        return NextResponse.json(
          { error: 'Password must contain at least one uppercase letter' },
          { status: 400 }
        );
      }

      if (!/[a-z]/.test(newPassword)) {
        return NextResponse.json(
          { error: 'Password must contain at least one lowercase letter' },
          { status: 400 }
        );
      }

      if (!/[0-9]/.test(newPassword)) {
        return NextResponse.json(
          { error: 'Password must contain at least one number' },
          { status: 400 }
        );
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('[Account API] Error updating password:', updateError);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Password updated successfully',
          verificationRequired: false,
        },
        { status: 200 }
      );
    }

    // Handle email change (requires verification)
    if (newEmail) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }

      // Check if email is already in use
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', newEmail)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: 'Email address is already in use' }, { status: 400 });
      }

      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token in database
      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .insert({
          user_id: user.id,
          token,
          new_email: newEmail,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        console.error('[Account API] Error creating verification token:', tokenError);
        return NextResponse.json(
          { error: 'Failed to create verification token' },
          { status: 500 }
        );
      }

      // Send verification email
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/account/verify?token=${token}`;

      try {
        await resend.emails.send({
          from: 'MGM Science Centre <noreply@mgmapjscicentre.org>',
          to: newEmail,
          subject: 'Verify Your New Email Address',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Email Verification</h1>
                  </div>
                  <div class="content">
                    <p>Hello,</p>
                    <p>You have requested to change your email address for your MGM Science Centre admin account.</p>
                    <p>Please click the button below to verify your new email address:</p>
                    <p style="text-align: center;">
                      <a href="${verificationUrl}" class="button">Verify Email Address</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                    <p><strong>This link will expire in 24 hours.</strong></p>
                    <p>If you did not request this change, please ignore this email and your account will remain unchanged.</p>
                  </div>
                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} MGM Science Centre. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error('[Account API] Error sending verification email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send verification email' },
          { status: 500 }
        );
      }

      // If password change was also requested, update it now
      if (newPassword) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          console.error('[Account API] Error updating password:', updateError);
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Verification email sent. Please check your inbox.',
          verificationRequired: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('[Account API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
