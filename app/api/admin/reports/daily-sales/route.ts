// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { generateDailySalesReport } from '@/lib/services/pdf-generator';
import { formatCurrency } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const supabase = getServiceSupabase();

    // Fetch bookings for the specified date
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        exhibition:exhibitions(name),
        show:shows(name),
        tickets:booking_tickets(*)
      `)
      .eq('booking_date' as any, date as any)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    // Calculate totals
    const bookingsData = bookings as any[];
    const totalBookings = bookingsData?.length || 0;
    const totalRevenue = bookingsData?.reduce(
      (sum: number, b: any) => sum + parseFloat(b.total_amount),
      0
    ) || 0;
    const cancelledCount = bookingsData?.filter((b: any) => b.status === 'cancelled').length || 0;

    // Prepare report data
    const reportData = {
      date: new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      bookings: (bookingsData || []).map((b: any) => ({
        reference: b.booking_reference,
        customer: b.guest_name || 'Guest',
        exhibition: b.exhibition?.name || b.show?.name || 'N/A',
        amount: parseFloat(b.total_amount),
        status: b.status,
      })),
      totals: {
        bookings: totalBookings,
        revenue: totalRevenue,
        cancelled: cancelledCount,
      },
    };

    // Generate PDF
    const pdfBuffer = await generateDailySalesReport(reportData);

    // Return PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="daily-sales-${date}.pdf"`,
        'Cache-Control': 'private, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error generating daily sales report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}


