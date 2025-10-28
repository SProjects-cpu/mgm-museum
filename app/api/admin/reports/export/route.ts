// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'bookings';
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = getServiceSupabase();

    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];

    switch (type) {
      case 'bookings':
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .gte('created_at', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .lte('created_at', endDate || new Date().toISOString())
          .order('created_at', { ascending: false });

        data = bookings || [];
        filename = `bookings-${new Date().toISOString().split('T')[0]}`;
        headers = ['Booking Reference', 'Email', 'Total Amount', 'Status', 'Created At'];
        break;

      case 'revenue':
        const { data: revenue } = await supabase
          .from('bookings')
          .select('booking_reference, total_amount, payment_status, created_at')
          .eq('payment_status', 'completed')
          .gte('created_at', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .lte('created_at', endDate || new Date().toISOString())
          .order('created_at', { ascending: false });

        data = revenue || [];
        filename = `revenue-${new Date().toISOString().split('T')[0]}`;
        headers = ['Booking Reference', 'Amount', 'Status', 'Date'];
        break;

      case 'exhibitions':
        const { data: exhibitions } = await supabase
          .from('exhibitions')
          .select('*')
          .order('created_at', { ascending: false });

        data = exhibitions || [];
        filename = `exhibitions-${new Date().toISOString().split('T')[0]}`;
        headers = ['Name', 'Category', 'Status', 'Capacity', 'Duration'];
        break;

      case 'events':
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        data = events || [];
        filename = `events-${new Date().toISOString().split('T')[0]}`;
        headers = ['Title', 'Event Date', 'Location', 'Status', 'Max Participants'];
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      // Generate CSV
      let csv = headers.join(',') + '\n';
      
      data.forEach((row: any) => {
        const values = Object.values(row).map((val: any) => {
          // Escape commas and quotes
          if (typeof val === 'string') {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csv += values.join(',') + '\n';
      });

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    } else if (format === 'json') {
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}
