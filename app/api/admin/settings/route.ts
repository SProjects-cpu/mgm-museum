import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/settings - Fetch all settings
export async function GET(request: NextRequest) {
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
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true }) as any;

    if (settingsError) {
      console.error('[Settings API] Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Group settings by category
    const groupedSettings: Record<string, any> = {};
    
    settings?.forEach((setting) => {
      if (!groupedSettings[setting.category]) {
        groupedSettings[setting.category] = {};
      }
      
      // Parse JSONB value
      const key = setting.key.replace(`${setting.category}_`, '');
      groupedSettings[setting.category][key] = setting.value;
    });

    return NextResponse.json(groupedSettings, { status: 200 });
  } catch (error) {
    console.error('[Settings API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
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
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate settings structure
    const validCategories = ['general', 'hours', 'booking', 'system'];
    const updates: Array<{ key: string; value: any; category: string }> = [];

    for (const [category, settings] of Object.entries(body)) {
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category: ${category}` },
          { status: 400 }
        );
      }

      for (const [key, value] of Object.entries(settings as Record<string, any>)) {
        // Validate specific settings
        if (category === 'booking') {
          if (key === 'advance_booking_days' && (typeof value !== 'number' || value < 1)) {
            return NextResponse.json(
              { error: 'advance_booking_days must be a positive number' },
              { status: 400 }
            );
          }
          if (key === 'cancellation_window_hours' && (typeof value !== 'number' || value < 0)) {
            return NextResponse.json(
              { error: 'cancellation_window_hours must be a non-negative number' },
              { status: 400 }
            );
          }
          if (key === 'service_fee_percent' && (typeof value !== 'number' || value < 0 || value > 100)) {
            return NextResponse.json(
              { error: 'service_fee_percent must be between 0 and 100' },
              { status: 400 }
            );
          }
        }

        if (category === 'general' && key === 'contact_email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value as string)) {
            return NextResponse.json(
              { error: 'Invalid email format' },
              { status: 400 }
            );
          }
        }

        updates.push({
          key: `${category}_${key}`,
          value: JSON.stringify(value),
          category,
        });
      }
    }

    // Update settings in database
    for (const update of updates) {
      const { error: updateError } = await (supabase
        .from('system_settings') as any)
        .update({
          value: update.value,
          updated_by: user.id,
        })
        .eq('key', update.key);

      if (updateError) {
        console.error(`[Settings API] Error updating ${update.key}:`, updateError);
        return NextResponse.json(
          { error: `Failed to update setting: ${update.key}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: 'Settings updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Settings API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
