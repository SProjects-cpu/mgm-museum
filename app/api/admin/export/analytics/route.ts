import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchAnalyticsData } from '@/lib/analytics/fetch-analytics-data';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData(
      new Date(startDate),
      new Date(endDate)
    );

    // Create PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MGM Museum Analytics Report', 14, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
      14,
      28
    );
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 34);
    doc.setTextColor(0);

    // Summary Statistics
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `₹${analyticsData.revenue.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Total Bookings', analyticsData.bookings.total.toString()],
        ['Total Visitors', analyticsData.visitors.total.toString()],
        ['Average Booking Value', `₹${(analyticsData.revenue.total / analyticsData.bookings.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });

    // Bookings by Status
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Bookings by Status', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Status', 'Count']],
      body: Object.entries(analyticsData.bookings.byStatus).map(([status, count]) => [
        status.toUpperCase(),
        count.toString()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });

    // Top Exhibitions
    const finalY2 = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Exhibitions', 14, finalY2 + 15);

    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Exhibition', 'Bookings', 'Revenue']],
      body: analyticsData.topExhibitions.map(ex => [
        ex.name,
        ex.bookings.toString(),
        `₹${ex.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });

    // Revenue by Date (new page if needed)
    const finalY3 = (doc as any).lastAutoTable.finalY || 50;
    if (finalY3 > 240) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Revenue by Date', 14, 20);
      
      autoTable(doc, {
        startY: 25,
        head: [['Date', 'Revenue']],
        body: analyticsData.revenue.byDate.slice(0, 30).map(item => [
          format(new Date(item.date), 'MMM dd, yyyy'),
          `₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
      });
    } else {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Revenue by Date', 14, finalY3 + 15);
      
      autoTable(doc, {
        startY: finalY3 + 20,
        head: [['Date', 'Revenue']],
        body: analyticsData.revenue.byDate.slice(0, 20).map(item => [
          format(new Date(item.date), 'MMM dd, yyyy'),
          `₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
      });
    }

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `MGM APJ Abdul Kalam Astrospace Science Centre | Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Generate filename
    const filename = `MGM_Analytics_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

    // Return as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('[Analytics Export] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
