/**
 * Excel Export Service
 * Exports bookings and analytics data to Excel format
 */

import ExcelJS from 'exceljs';
import { formatCurrency } from '@/lib/razorpay/utils';

export interface BookingExportData {
  bookingReference: string;
  date: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  exhibitionShow: string;
  timeSlot: string;
  adultTickets: number;
  childTickets: number;
  studentTickets: number;
  seniorTickets: number;
  totalTickets: number;
  amount: number;
  paymentStatus: string;
  bookingStatus: string;
  paymentMethod: string;
  paymentId: string;
}

export interface AnalyticsSummary {
  totalBookings: number;
  totalRevenue: number;
  totalTickets: number;
  byStatus: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  byTicketType: {
    adult: number;
    child: number;
    student: number;
    senior: number;
  };
  byDate: Array<{ date: string; bookings: number; revenue: number }>;
}

/**
 * Export bookings to Excel
 * @param bookings - Array of booking data
 * @param filename - Output filename
 * @returns Excel file as Buffer
 */
export async function exportBookingsToExcel(
  bookings: BookingExportData[],
  filename: string = 'bookings_export.xlsx'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MGM Science Centre';
  workbook.created = new Date();

  // Create worksheet
  const worksheet = workbook.addWorksheet('Bookings', {
    properties: { tabColor: { argb: 'FF0066CC' } },
  });

  // Define columns
  worksheet.columns = [
    { header: 'Booking Reference', key: 'bookingReference', width: 20 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Visitor Name', key: 'visitorName', width: 25 },
    { header: 'Email', key: 'visitorEmail', width: 30 },
    { header: 'Phone', key: 'visitorPhone', width: 15 },
    { header: 'Exhibition/Show', key: 'exhibitionShow', width: 30 },
    { header: 'Time Slot', key: 'timeSlot', width: 15 },
    { header: 'Adult', key: 'adultTickets', width: 10 },
    { header: 'Child', key: 'childTickets', width: 10 },
    { header: 'Student', key: 'studentTickets', width: 10 },
    { header: 'Senior', key: 'seniorTickets', width: 10 },
    { header: 'Total Tickets', key: 'totalTickets', width: 12 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
    { header: 'Booking Status', key: 'bookingStatus', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Payment ID', key: 'paymentId', width: 25 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add data rows
  bookings.forEach((booking) => {
    const row = worksheet.addRow({
      bookingReference: booking.bookingReference,
      date: new Date(booking.date).toLocaleDateString('en-IN'),
      visitorName: booking.visitorName,
      visitorEmail: booking.visitorEmail,
      visitorPhone: booking.visitorPhone || 'N/A',
      exhibitionShow: booking.exhibitionShow,
      timeSlot: booking.timeSlot,
      adultTickets: booking.adultTickets,
      childTickets: booking.childTickets,
      studentTickets: booking.studentTickets,
      seniorTickets: booking.seniorTickets,
      totalTickets: booking.totalTickets,
      amount: booking.amount,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      paymentMethod: booking.paymentMethod || 'N/A',
      paymentId: booking.paymentId || 'N/A',
    });

    // Format amount as currency
    const amountCell = row.getCell('amount');
    amountCell.numFmt = '₹#,##0.00';

    // Color code status cells
    const paymentStatusCell = row.getCell('paymentStatus');
    const bookingStatusCell = row.getCell('bookingStatus');

    if (booking.paymentStatus === 'paid') {
      paymentStatusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4EDDA' },
      };
    } else if (booking.paymentStatus === 'failed') {
      paymentStatusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8D7DA' },
      };
    }

    if (booking.bookingStatus === 'confirmed') {
      bookingStatusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4EDDA' },
      };
    } else if (booking.bookingStatus === 'cancelled') {
      bookingStatusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8D7DA' },
      };
    }
  });

  // Add borders to all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export analytics to Excel
 * @param bookings - Array of booking data
 * @param summary - Analytics summary
 * @param startDate - Start date for analytics
 * @param endDate - End date for analytics
 * @returns Excel file as Buffer
 */
export async function exportAnalyticsToExcel(
  bookings: BookingExportData[],
  summary: AnalyticsSummary,
  startDate: string,
  endDate: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MGM Science Centre';
  workbook.created = new Date();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: 'FF00CC66' } },
  });

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  // Style header
  const summaryHeader = summarySheet.getRow(1);
  summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summaryHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF00CC66' },
  };

  // Add summary data
  summarySheet.addRow({ metric: 'Report Period', value: `${startDate} to ${endDate}` });
  summarySheet.addRow({ metric: 'Total Bookings', value: summary.totalBookings });
  summarySheet.addRow({ metric: 'Total Revenue', value: formatCurrency(summary.totalRevenue) });
  summarySheet.addRow({ metric: 'Total Tickets Sold', value: summary.totalTickets });
  summarySheet.addRow({ metric: '', value: '' }); // Empty row

  summarySheet.addRow({ metric: 'Ticket Breakdown', value: '' });
  summarySheet.addRow({ metric: '  Adult Tickets', value: summary.byTicketType.adult });
  summarySheet.addRow({ metric: '  Child Tickets', value: summary.byTicketType.child });
  summarySheet.addRow({ metric: '  Student Tickets', value: summary.byTicketType.student });
  summarySheet.addRow({ metric: '  Senior Tickets', value: summary.byTicketType.senior });

  // Date-wise breakdown sheet
  const dateSheet = workbook.addWorksheet('Date-wise Analysis');
  dateSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Bookings', key: 'bookings', width: 15 },
    { header: 'Revenue', key: 'revenue', width: 20 },
  ];

  const dateHeader = dateSheet.getRow(1);
  dateHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dateHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' },
  };

  summary.byDate.forEach((item) => {
    const row = dateSheet.addRow({
      date: new Date(item.date).toLocaleDateString('en-IN'),
      bookings: item.bookings,
      revenue: item.revenue,
    });
    row.getCell('revenue').numFmt = '₹#,##0.00';
  });

  // Bookings detail sheet
  const detailSheet = workbook.addWorksheet('Bookings Detail');
  detailSheet.columns = [
    { header: 'Booking Reference', key: 'bookingReference', width: 20 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Visitor Name', key: 'visitorName', width: 25 },
    { header: 'Exhibition/Show', key: 'exhibitionShow', width: 30 },
    { header: 'Total Tickets', key: 'totalTickets', width: 12 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Status', key: 'bookingStatus', width: 15 },
  ];

  const detailHeader = detailSheet.getRow(1);
  detailHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  detailHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' },
  };

  bookings.forEach((booking) => {
    const row = detailSheet.addRow({
      bookingReference: booking.bookingReference,
      date: new Date(booking.date).toLocaleDateString('en-IN'),
      visitorName: booking.visitorName,
      exhibitionShow: booking.exhibitionShow,
      totalTickets: booking.totalTickets,
      amount: booking.amount,
      bookingStatus: booking.bookingStatus,
    });
    row.getCell('amount').numFmt = '₹#,##0.00';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Calculate analytics summary from bookings
 * @param bookings - Array of booking data
 * @returns Analytics summary
 */
export function calculateAnalyticsSummary(bookings: BookingExportData[]): AnalyticsSummary {
  const summary: AnalyticsSummary = {
    totalBookings: bookings.length,
    totalRevenue: 0,
    totalTickets: 0,
    byStatus: {},
    byPaymentStatus: {},
    byTicketType: {
      adult: 0,
      child: 0,
      student: 0,
      senior: 0,
    },
    byDate: [],
  };

  const dateMap = new Map<string, { bookings: number; revenue: number }>();

  bookings.forEach((booking) => {
    // Revenue and tickets
    summary.totalRevenue += booking.amount;
    summary.totalTickets += booking.totalTickets;

    // Status counts
    summary.byStatus[booking.bookingStatus] = (summary.byStatus[booking.bookingStatus] || 0) + 1;
    summary.byPaymentStatus[booking.paymentStatus] = (summary.byPaymentStatus[booking.paymentStatus] || 0) + 1;

    // Ticket types
    summary.byTicketType.adult += booking.adultTickets;
    summary.byTicketType.child += booking.childTickets;
    summary.byTicketType.student += booking.studentTickets;
    summary.byTicketType.senior += booking.seniorTickets;

    // Date-wise
    const dateKey = new Date(booking.date).toISOString().split('T')[0];
    const existing = dateMap.get(dateKey) || { bookings: 0, revenue: 0 };
    dateMap.set(dateKey, {
      bookings: existing.bookings + 1,
      revenue: existing.revenue + booking.amount,
    });
  });

  // Convert date map to array
  summary.byDate = Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return summary;
}
