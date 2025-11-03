import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { formatCurrency } from '@/lib/utils';
// Optional Supabase import for storage functionality
let supabaseClient: any = null;
try {
  const { getServiceSupabase } = require('@/lib/supabase/client');
  supabaseClient = { getServiceSupabase };
} catch (error) {
  // Supabase not available in test environment
  console.warn('Supabase client not available');
}

interface TicketData {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  exhibition: string;
  date: string;
  time: string;
  tickets: Array<{
    type: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  specialRequirements?: string;
  seats?: string[];
}

/**
 * Generate e-ticket PDF (BookMyShow style)
 */
export async function generateTicketPDF(data: TicketData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Background and border
  doc.setFillColor(245, 250, 255); // Light blue background
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setDrawColor(52, 152, 219); // Blue border
  doc.setLineWidth(0.5);
  doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin);

  // Header Section
  doc.setFillColor(52, 152, 219);
  doc.rect(margin / 2, margin / 2, pageWidth - margin, 40, 'F');

  // Logo placeholder (you can add actual logo here)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MGM SCIENCE CENTRE', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('E-TICKET', pageWidth / 2, 35, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  let currentY = 55;

  // Ticket Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING CONFIRMED', pageWidth / 2, currentY, { align: 'center' });

  currentY += 3;
  doc.setLineWidth(0.3);
  doc.setDrawColor(52, 152, 219);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // QR Code Section
  const qrCodeDataUrl = await QRCode.toDataURL(data.bookingReference, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // QR Code (centered)
  const qrSize = 60;
  doc.addImage(qrCodeDataUrl, 'PNG', (pageWidth - qrSize) / 2, currentY, qrSize, qrSize);

  currentY += qrSize + 5;

  // Booking Reference (centered, below QR)
  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  doc.setTextColor(52, 152, 219);
  doc.text(data.bookingReference, pageWidth / 2, currentY, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  currentY += 10;

  // Visitor Details Section
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 25, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('VISITOR DETAILS', margin + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.customerName}`, margin + 5, currentY + 12);
  doc.text(`Email: ${data.customerEmail}`, margin + 5, currentY + 18);

  currentY += 30;

  // Event Details Section
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 50, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 152, 219);
  doc.text('EVENT DETAILS', margin + 5, currentY + 7);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const detailsLeft = margin + 5;
  const detailsRight = pageWidth / 2 + 10;
  let detailsY = currentY + 15;

  // Exhibition Name (full width)
  doc.setFont('helvetica', 'bold');
  doc.text('Exhibition:', detailsLeft, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.exhibition, detailsLeft + 25, detailsY);

  detailsY += 8;

  // Date and Time
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', detailsLeft, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date, detailsLeft + 25, detailsY);

  doc.setFont('helvetica', 'bold');
  doc.text('Time:', detailsRight, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.time, detailsRight + 25, detailsY);

  detailsY += 8;

  // Seats (if applicable)
  if (data.seats && data.seats.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Seats:', detailsLeft, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.seats.join(', '), detailsLeft + 25, detailsY);
    detailsY += 8;
  }

  currentY += 55;

  // Ticket Breakdown Table
  const ticketTableData = data.tickets.map((ticket) => [
    ticket.type.toUpperCase(),
    ticket.quantity.toString(),
    formatCurrency(ticket.price),
    formatCurrency(ticket.price * ticket.quantity),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['TICKET TYPE', 'QTY', 'PRICE', 'SUBTOTAL']],
    body: ticketTableData,
    foot: [['', '', 'TOTAL', formatCurrency(data.totalAmount)]],
    theme: 'grid',
    headStyles: {
      fillColor: [52, 152, 219],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Special Requirements
  if (data.specialRequirements) {
    doc.setFillColor(255, 243, 199);
    doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 15, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Special Requirements:', margin + 5, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(data.specialRequirements, margin + 5, currentY + 11, {
      maxWidth: pageWidth - 2 * margin - 10,
    });

    currentY += 20;
  }

  // Important Instructions
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 30, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('IMPORTANT INSTRUCTIONS', margin + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  const instructions = [
    '• Please carry a valid ID proof for verification',
    '• Arrive 15 minutes before your scheduled time',
    '• This ticket is non-transferable and valid only for the date mentioned',
    '• Present the QR code at the entrance for scanning',
  ];

  let instructionY = currentY + 11;
  instructions.forEach((instruction) => {
    doc.text(instruction, margin + 5, instructionY);
    instructionY += 5;
  });

  doc.setTextColor(0, 0, 0);
  currentY += 35;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const footerY = pageHeight - 20;
  doc.text('MGM APJ Abdul Kalam Astrospace Science Centre', pageWidth / 2, footerY, {
    align: 'center',
  });
  doc.text('Jalgaon Road, Behind Siddharth Garden, Aurangabad, Maharashtra 431003', pageWidth / 2, footerY + 4, {
    align: 'center',
  });
  doc.text('Phone: +91-XXX-XXX-XXXX | Email: info@mgmapjscicentre.org', pageWidth / 2, footerY + 8, {
    align: 'center',
  });

  // Watermark
  doc.setFontSize(50);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'bold');
  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.1 }));
  doc.text('VALID TICKET', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45,
  });
  doc.restoreGraphicsState();

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate admin report PDF
 */
export async function generateDailySalesReport(data: {
  date: string;
  bookings: Array<{
    reference: string;
    customer: string;
    exhibition: string;
    amount: number;
    status: string;
  }>;
  totals: {
    bookings: number;
    revenue: number;
    cancelled: number;
  };
}): Promise<Buffer> {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DAILY SALES REPORT', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${data.date}`, 105, 30, { align: 'center' });

  // Summary Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, 45);

  doc.setFont('helvetica', 'normal');
  doc.text(`Total Bookings: ${data.totals.bookings}`, 20, 52);
  doc.text(`Total Revenue: ${formatCurrency(data.totals.revenue)}`, 20, 59);
  doc.text(`Cancelled: ${data.totals.cancelled}`, 20, 66);

  // Bookings Table
  const tableData = data.bookings.map((b) => [
    b.reference,
    b.customer,
    b.exhibition,
    formatCurrency(b.amount),
    b.status,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Booking Ref', 'Customer', 'Exhibition', 'Amount', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [52, 152, 219],
    },
  });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate QR Code as base64 data URL
 */
export async function generateQRCode(data: string): Promise<string> {
  return await QRCode.toDataURL(data, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Save PDF to Supabase Storage and return public URL
 */
export async function savePDFToStorage(
  pdfBuffer: Buffer,
  filename: string,
  bucket: string = 'tickets'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Check if Supabase is available
    if (!supabaseClient) {
      return { success: false, error: 'Supabase client not available' };
    }

    const { getServiceSupabase } = supabaseClient;
    const supabase = getServiceSupabase();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate and save ticket PDF with Supabase Storage integration
 */
export async function generateAndSaveTicketPDF(
  data: TicketData,
  bucket: string = 'tickets'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Generate PDF buffer
    const pdfBuffer = await generateTicketPDF(data);

    // Save to storage
    const filename = `ticket-${data.bookingReference}.pdf`;
    const storageResult = await savePDFToStorage(pdfBuffer, filename, bucket);

    if (!storageResult.success) {
      return storageResult;
    }

    return {
      success: true,
      url: storageResult.url,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate and save report PDF with Supabase Storage integration
 */
export async function generateAndSaveReportPDF(
  data: {
    date: string;
    bookings: Array<{
      reference: string;
      customer: string;
      exhibition: string;
      amount: number;
      status: string;
    }>;
    totals: {
      bookings: number;
      revenue: number;
      cancelled: number;
    };
  },
  reportType: string = 'daily-sales',
  bucket: string = 'reports'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Generate PDF buffer
    const pdfBuffer = await generateDailySalesReport(data);

    // Save to storage
    const filename = `${reportType}-${data.date}.pdf`;
    const storageResult = await savePDFToStorage(pdfBuffer, filename, bucket);

    if (!storageResult.success) {
      return storageResult;
    }

    return {
      success: true,
      url: storageResult.url,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}