// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

// GET - Fetch Razorpay credentials (masked)
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const { data: credentials, error } = await supabase
      .from('razorpay_credentials')
      .select('id, environment, is_active, last_used_at, created_at, updated_at')
      .order('environment');

    if (error) {
      console.error('Error fetching credentials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({ credentials: credentials || [] });
  } catch (error: any) {
    console.error('Error in credentials API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create/Update Razorpay credentials
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const {
      environment,
      keyId,
      keySecret,
      webhookSecret,
    } = body;

    // Validate required fields
    if (!environment || !keyId || !keySecret || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['production', 'test'].includes(environment)) {
      return NextResponse.json(
        { error: 'Environment must be either production or test' },
        { status: 400 }
      );
    }

    const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;
    if (!encryptionKey) {
      return NextResponse.json(
        { error: 'Encryption key not configured' },
        { status: 500 }
      );
    }

    // Encrypt credentials using database function
    const { data: encryptedKeyId } = await supabase
      .rpc('encrypt_credential', {
        plain_text: keyId,
        encryption_key: encryptionKey
      });

    const { data: encryptedKeySecret } = await supabase
      .rpc('encrypt_credential', {
        plain_text: keySecret,
        encryption_key: encryptionKey
      });

    const { data: encryptedWebhookSecret } = await supabase
      .rpc('encrypt_credential', {
        plain_text: webhookSecret,
        encryption_key: encryptionKey
      });

    // Check if credentials already exist for this environment
    const { data: existing } = await supabase
      .from('razorpay_credentials')
      .select('id')
      .eq('environment', environment)
      .single();

    if (existing) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('razorpay_credentials')
        .update({
          key_id_encrypted: encryptedKeyId,
          key_secret_encrypted: encryptedKeySecret,
          webhook_secret_encrypted: encryptedWebhookSecret,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating credentials:', updateError);
        return NextResponse.json(
          { error: 'Failed to update credentials' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Credentials updated successfully',
        credentialId: existing.id
      });
    } else {
      // Insert new credentials
      const { data: credential, error: insertError } = await supabase
        .from('razorpay_credentials')
        .insert({
          environment,
          key_id_encrypted: encryptedKeyId,
          key_secret_encrypted: encryptedKeySecret,
          webhook_secret_encrypted: encryptedWebhookSecret,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating credentials:', insertError);
        return NextResponse.json(
          { error: 'Failed to create credentials' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Credentials created successfully',
        credentialId: credential.id
      });
    }
  } catch (error: any) {
    console.error('Error in credentials POST API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
