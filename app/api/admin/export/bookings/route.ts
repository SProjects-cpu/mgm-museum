import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format, subDays, startOfDay, endOfDay, startOfToday, startOfTomorrow, endOfTomorrow } from 'date-fns';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as admin.' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body for filters
    const body = await request.json();
    const { dateRange = 'all', startDate: customStartDate, endDate: customEndDate, status, search } = body;

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = startOfToday();
        endDate = endOfDay(new Date());
        break;
      case 'tomorrow':
        startDate = startOfTomorrow();
        endDate = endOfTomorrow();
        break;
      case 'last_week':
        startDate = startOfDay(subDays(new Date(), 7));
        endDate = endOfDay(new Date());
        break;
      case 'last_month':
        startDate = startOfDay(subDays(new Date(), 30));
        endDate = endOfDay(new Date());
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          return NextResponse.json(
            { error: 'Custom date range requires startDate and endDate' },
            { status: 400 }
          );
        }
        startDate = startOfDay(new Date(customStartDate));
        endDate = endOfDay(new Date(customEndDate));
        break;
      default:
        startDate = new Date('2020-01-01');
        endDate = new Date('2030-12-31');
    }

    // Fetch all bookings (no pagination for export)
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_phone,
        user_id,
        booking_date,
        time_slot_id,
        total_amount,
        status,
        payment_details,
        created_at,
        users:user_id (
          full_name,
          email,
          phone
        ),
        tickets (
          ticket_number
        ),
        time_slots:time_slot_id (
          start_time,
          end_time
        )
      `)
      .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
      .lte('booking_date', format(endDate, 'yyyy-MM-dd'))
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`booking_reference.ilike.%${search}%,guest_name.ilike.%${search}%,guest_email.ilike.%${search}%`);
    }

    const { data: bookingsData, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('[Export API] Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: bookingsError.message },
        { status: 500 }
      );
    }

    // Get booking tickets count
    const bookingIds = bookingsData?.map(b => b.id) || [];
    const { data: ticketCounts } = await supabase
      .from('booking_tickets')
      .select('booking_id, quantity')
      .in('booking_id', bookingIds);

    const ticketCountMap = new Map<string, number>();
    ticketCounts?.forEach(tc => {
      const current = ticketCountMap.get(tc.booking_id) || 0;
      ticketCountMap.set(tc.booking_id, current + tc.quantity);
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');

    // Define columns with exact names from requirements
    worksheet.columns = [
      { header: 'Visitor Name', key: 'visitorName', width: 25 },
      { header: 'Visitor Email', key: 'visitorEmail', width: 30 },
      { header: 'Visitor Phone Number', key: 'visitorPhone', width: 20 },
      { header: 'Booking Reference', key: 'bookingReference', width: 25 },
      { header: 'Ticket Number', key: 'ticketNumber', width: 25 },
      { header: 'Razorpay_Id', key: 'razorpayId', width: 30 },
      { header: 'Book-visit Date', key: 'visitDate', width: 15 },
      { header: 'Book Visit Time-slot', key: 'visitTimeSlot', width: 20 },
      { header: 'Number of Tickets Booked by visitor', key: 'numberOfTickets', width: 15 },
      { header: 'Amount Paid', key: 'amountPaid', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Booking Timestamp (YYYY-MM-DD)', key: 'bookingTimestamp', width: 25 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 11 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(1).height = 20;

    // Add data rows
    bookingsData?.forEach(booking => {
      const visitorName = booking.guest_name || booking.users?.full_name || 'N/A';
      const visitorEmail = booking.guest_email || booking.users?.email || 'N/A';
      const visitorPhone = booking.guest_phone || booking.users?.phone || 'N/A';
      const ticketNumber = booking.tickets?.[0]?.ticket_number || 'N/A';
      const razorpayId = booking.payment_details?.razorpay_payment_id || 'N/A';
      const visitTimeSlot = booking.time_slots 
        ? `${booking.time_slots.start_time} - ${booking.time_slots.end_time}`
        : 'N/A';
      const numberOfTickets = ticketCountMap.get(booking.id) || 0;

      worksheet.addRow({
        visitorName,
        visitorEmail,
        visitorPhone,
        bookingReference: booking.booking_reference,
        ticketNumber,
        razorpayId,
        visitDate: format(new Date(booking.booking_date), 'yyyy-MM-dd'),
        visitTimeSlot,
        numberOfTickets,
        amountPaid: `₹${booking.total_amount.toFixed(2)}`,
        status: booking.status.toUpperCase(),
        bookingTimestamp: format(new Date(booking.created_at), 'yyyy-MM-dd HH:mm:ss'),
      });
    });

    // Add auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'L1',
    };

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate filename
    const dateRangeStr = dateRange === 'custom' 
      ? `${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`
      : dateRange;
    const filename = `MGM_Bookings_${dateRangeStr}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('[Export API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate Excel file',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
