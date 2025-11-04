/**
 * Ticket Generation Service
 * Generates PDF tickets with QR codes for bookings
 */

import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/razorpay/utils';

export interface TicketData {
  bookingReference: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  exhibitionName?: string;
  showName?: string;
  bookingDate: string;
  timeSlot: string;
  tickets: {
    adult: number;
    child: number;
    student: number;
    senior: number;
  };
  totalTickets: number;
  totalAmount: number;
  paymentId?: string;
  ticketNumber: string;
}

/**
 * Generate QR code as base64 data URL
 * @param data - Data to encode in QR code
 * @returns Base64 data URL of QR code
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate PDF ticket
 * @param ticketData - Ticket information
 * @returns PDF as Buffer
 */
export async function generateTicketPDF(ticketData: TicketData): Promise<Buffer> {
  try {
    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(ticketData.bookingReference);

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set font
    doc.setFont('helvetica');

    // Header - Museum Name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MGM Science Centre', 105, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Admission Ticket', 105, 30, { align: 'center' });

    // Divider line
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Booking Reference (prominent)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Reference:', 20, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(ticketData.bookingReference, 80, 45);

    // Ticket Number
    doc.setFontSize(10);
    doc.text(`Ticket #: ${ticketData.ticketNumber}`, 20, 52);

    // Exhibition/Show Name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const eventName = ticketData.exhibitionName || ticketData.showName || 'General Admission';
    doc.text(eventName, 20, 65);

    // Visitor Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Visitor Details', 20, 80);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${ticketData.visitorName}`, 20, 88);
    doc.text(`Email: ${ticketData.visitorEmail}`, 20, 95);
    if (ticketData.visitorPhone) {
      doc.text(`Phone: ${ticketData.visitorPhone}`, 20, 102);
    }

    // Visit Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Visit Details', 20, 115);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(ticketData.bookingDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`, 20, 123);
    doc.text(`Time Slot: ${ticketData.timeSlot}`, 20, 130);

    // Ticket Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tickets', 20, 143);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 151;
    if (ticketData.tickets.adult > 0) {
      doc.text(`Adult: ${ticketData.tickets.adult}`, 20, yPos);
      yPos += 7;
    }
    if (ticketData.tickets.child > 0) {
      doc.text(`Child: ${ticketData.tickets.child}`, 20, yPos);
      yPos += 7;
    }
    if (ticketData.tickets.student > 0) {
      doc.text(`Student: ${ticketData.tickets.student}`, 20, yPos);
      yPos += 7;
    }
    if (ticketData.tickets.senior > 0) {
      doc.text(`Senior: ${ticketData.tickets.senior}`, 20, yPos);
      yPos += 7;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Tickets: ${ticketData.totalTickets}`, 20, yPos);

    // Amount
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Amount Paid: ${formatCurrency(ticketData.totalAmount)}`, 20, yPos + 10);

    // QR Code
    doc.addImage(qrCodeDataUrl, 'PNG', 140, 80, 50, 50);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Scan at Entry', 165, 135, { align: 'center' });

    // Instructions Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Important Instructions:', 20, 190);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const instructions = [
      '• Please arrive 15 minutes before your scheduled time slot',
      '• Present this ticket (printed or digital) at the entrance',
      '• The QR code will be scanned for verification',
      '• This ticket is valid only for the date and time mentioned above',
      '• Outside food and beverages are not allowed',
      '• Photography may be restricted in certain areas',
    ];
    
    let instructionY = 198;
    instructions.forEach((instruction) => {
      doc.text(instruction, 20, instructionY);
      instructionY += 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for visiting MGM Science Centre!', 105, 270, { align: 'center' });
    doc.text('For queries, contact: info@mgmapjscicentre.org', 105, 275, { align: 'center' });

    // Divider line at bottom
    doc.setLineWidth(0.3);
    doc.line(20, 265, 190, 265);

    // Payment ID (small text at bottom)
    if (ticketData.paymentId) {
      doc.setFontSize(7);
      doc.text(`Payment ID: ${ticketData.paymentId}`, 20, 285);
    }

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF ticket:', error);
    throw new Error('Failed to generate PDF ticket');
  }
}

/**
 * Generate ticket filename
 * @param bookingReference - Booking reference
 * @returns Filename for the ticket
 */
export function generateTicketFilename(bookingReference: string): string {
  return `ticket_${bookingReference}_${Date.now()}.pdf`;
}
