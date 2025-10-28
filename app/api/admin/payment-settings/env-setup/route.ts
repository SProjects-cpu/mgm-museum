// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

// GET - Retrieve environment setup information
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Fetch encryption key configuration
    const { data: config, error } = await supabase
      .from('system_configuration')
      .select('config_key, description, is_sensitive')
      .eq('config_key', 'DATABASE_ENCRYPTION_KEY')
      .single();

    if (error) {
      console.error('Error fetching config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    // Check if encryption key is set in environment
    const encryptionKeySet = !!process.env.DATABASE_ENCRYPTION_KEY;

    return NextResponse.json({
      encryptionKeyConfigured: encryptionKeySet,
      configuration: {
        key: config?.config_key,
        description: config?.description,
        isSensitive: config?.is_sensitive
      },
      setupInstructions: {
        step1: 'Add to .env.local file',
        step2: 'DATABASE_ENCRYPTION_KEY=YzQ3GlNzntjVLy16kSgvEJZS4PNHDdit19QiosSftxM=',
        step3: 'Restart your development server',
        step4: 'Verify in Payment Settings page'
      }
    });
  } catch (error: any) {
    console.error('Error in env setup API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Verify encryption key is set
export async function POST(request: NextRequest) {
  try {
    const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;

    if (!encryptionKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'DATABASE_ENCRYPTION_KEY not found in environment variables',
          setupRequired: true
        },
        { status: 400 }
      );
    }

    // Verify the key format (should be base64)
    try {
      Buffer.from(encryptionKey, 'base64');
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          message: 'DATABASE_ENCRYPTION_KEY is not valid base64',
          setupRequired: true
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Encryption key is properly configured',
      keyLength: encryptionKey.length,
      keyPreview: `${encryptionKey.substring(0, 10)}...${encryptionKey.substring(encryptionKey.length - 10)}`
    });
  } catch (error: any) {
    console.error('Error verifying encryption key:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
