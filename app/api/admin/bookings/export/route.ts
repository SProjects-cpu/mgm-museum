import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { 
  exportBookingsToExcel, 
  exportAnalyticsToExcel,
  calculateAnalyticsSummary,
  type BookingExportData 
} from '@/lib/services/excel-export';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');
    const exportType = searchParams.get('type') || 'bookings'; // 'bookings' or 'analytics'

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        exhibition:exhibitions(name),
        show:shows(name),
        time_slot:time_slots(start_time, end_time)
      `);

    // Apply filters
    if (startDate) {
      query = query.gte('booking_date', startDate);
    }
    if (endDate) {
      query = query.lte('booking_date', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }
    if (search) {
      query = query.or(`booking_reference.ilike.%${search}%,visitor_name.ilike.%${search}%,visitor_email.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings for export:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No bookings found for export' },
        { status: 404 }
      );
    }

    // Transform data for export
    const exportData: BookingExportData[] = bookings.map((booking) => ({
      bookingReference: booking.booking_reference,
      date: booking.booking_date,
      visitorName: booking.visitor_name,
      visitorEmail: booking.visitor_email,
      visitorPhone: booking.visitor_phone || '',
      exhibitionShow: booking.exhibition?.name || booking.show?.name || 'N/A',
      timeSlot: booking.time_slot
        ? `${booking.time_slot.start_time} - ${booking.time_slot.end_time}`
        : 'N/A',
      adultTickets: booking.adult_tickets || 0,
      childTickets: booking.child_tickets || 0,
      studentTickets: booking.student_tickets || 0,
      seniorTickets: booking.senior_tickets || 0,
      totalTickets: booking.total_tickets,
      amount: parseFloat(booking.total_amount),
      paymentStatus: booking.payment_status,
      bookingStatus: booking.status,
      paymentMethod: booking.payment_method || '',
      paymentId: booking.payment_id || '',
    }));

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `${exportType}_${timestamp}.xlsx`;

    let excelBuffer: Buffer;

    if (exportType === 'analytics') {
      // Calculate analytics summary
      const summary = calculateAnalyticsSummary(exportData);
      const start = startDate || exportData[exportData.length - 1]?.date || '';
      const end = endDate || exportData[0]?.date || '';
      
      excelBuffer = await exportAnalyticsToExcel(exportData, summary, start, end);
    } else {
      // Standard bookings export
      excelBuffer = await exportBookingsToExcel(exportData, filename);
    }

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error exporting bookings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to export bookings' },
      { status: 500 }
    );
  }
}
