// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

// GET - Fetch payment configurations
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const { data: configurations, error } = await supabase
      .from('payment_configurations')
      .select('*')
      .order('config_key');

    if (error) {
      console.error('Error fetching configurations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ configurations: configurations || [] });
  } catch (error: any) {
    console.error('Error in configurations API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create payment configuration
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const {
      configKey,
      configValue,
      gatewayType,
      retryAttempts,
      retryDelaySeconds,
      webhookTimeoutSeconds
    } = body;

    if (!configKey || !configValue) {
      return NextResponse.json(
        { error: 'Config key and value are required' },
        { status: 400 }
      );
    }

    const { data: configuration, error } = await supabase
      .from('payment_configurations')
      .insert({
        config_key: configKey,
        config_value: configValue,
        gateway_type: gatewayType || 'razorpay',
        retry_attempts: retryAttempts || 3,
        retry_delay_seconds: retryDelaySeconds || 30,
        webhook_timeout_seconds: webhookTimeoutSeconds || 10,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating configuration:', error);
      return NextResponse.json(
        { error: 'Failed to create configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Configuration created successfully',
      configuration
    });
  } catch (error: any) {
    console.error('Error in configurations POST API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update payment configuration
export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const {
      id,
      configValue,
      retryAttempts,
      retryDelaySeconds,
      webhookTimeoutSeconds,
      isActive
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (configValue !== undefined) updateData.config_value = configValue;
    if (retryAttempts !== undefined) updateData.retry_attempts = retryAttempts;
    if (retryDelaySeconds !== undefined) updateData.retry_delay_seconds = retryDelaySeconds;
    if (webhookTimeoutSeconds !== undefined) updateData.webhook_timeout_seconds = webhookTimeoutSeconds;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: configuration, error } = await supabase
      .from('payment_configurations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating configuration:', error);
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Configuration updated successfully',
      configuration
    });
  } catch (error: any) {
    console.error('Error in configurations PUT API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
