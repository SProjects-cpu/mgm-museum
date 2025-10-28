import { getServiceSupabase } from '@/lib/supabase/config';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface TicketData {
  ticketNumber: string;
  bookingReference: string;
  visitorName: string;
  visitorEmail: string;
  exhibitionName: string;
  exhibitionCategory: string;
  visitDate: string;
  timeSlot: string;
  amount: number;
  status: string;
}

export interface GeneratedTicket {
  ticketId: string;
  ticketNumber: string;
  downloadUrl: string;
  qrCodeData: string;
  expiresAt?: string;
  metadata: TicketData;
}

export class TicketService {
  private supabase = getServiceSupabase();

  /**
   * Generate ticket for a completed booking
   */
  async generateTicket(bookingId: string): Promise<GeneratedTicket> {
    try {
      // Get booking details with related data
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .select(`
          *,
          exhibitions(name, category),
          users(email, full_name),
          payment_transactions!inner(status, amount)
        `)
        .eq('id', bookingId)
        .eq('payment_transactions.status', 'completed')
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found or payment not completed');
      }

      // Check if ticket already exists
      const { data: existingTicket } = await this.supabase
        .from('tickets')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      if (existingTicket) {
        throw new Error('Ticket already generated for this booking');
      }

      // Generate unique ticket number
      const { data: ticketNumber } = await this.supabase
        .rpc('generate_ticket_number');

      if (!ticketNumber) {
        throw new Error('Failed to generate ticket number');
      }

      // Create QR code data
      const qrCodeData = `TICKET:${ticketNumber}:BOOKING:${bookingId}:EXHIBITION:${booking.exhibitions?.name}:TIMESTAMP:${Date.now()}`;

      // Calculate expiry time (24 hours after visit date)
      const visitDateTime = new Date(`${booking.booking_date}T${booking.time_slot_id}`);
      const expiresAt = new Date(visitDateTime.getTime() + (24 * 60 * 60 * 1000));

      // Prepare ticket data
      const ticketData: TicketData = {
        ticketNumber,
        bookingReference: booking.booking_reference,
        visitorName: booking.guest_name || booking.users?.full_name || 'Guest Visitor',
        visitorEmail: booking.guest_email || booking.users?.email || '',
        exhibitionName: booking.exhibitions?.name || 'Museum Exhibition',
        exhibitionCategory: booking.exhibitions?.category || 'general',
        visitDate: booking.booking_date,
        timeSlot: booking.time_slot_id,
        amount: booking.total_amount,
        status: 'confirmed'
      };

      // Generate PDF ticket
      const pdfBuffer = await this.generateTicketPDF(ticketData, qrCodeData);

      // Upload PDF to Supabase storage
      const fileName = `tickets/${ticketNumber}.pdf`;
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('tickets')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload ticket PDF: ${uploadError.message}`);
      }

      // Get public URL for the PDF
      const { data: { publicUrl } } = this.supabase.storage
        .from('tickets')
        .getPublicUrl(fileName);

      // Save ticket record to database
      const { data: ticket, error: ticketError } = await this.supabase
        .from('tickets')
        .insert({
          booking_id: bookingId,
          ticket_number: ticketNumber,
          ticket_data: ticketData,
          qr_code_data: qrCodeData,
          pdf_url: publicUrl,
          status: 'generated',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (ticketError) {
        throw new Error(`Failed to save ticket record: ${ticketError.message}`);
      }

      return {
        ticketId: ticket.id,
        ticketNumber,
        downloadUrl: publicUrl,
        qrCodeData,
        expiresAt: expiresAt.toISOString(),
        metadata: ticketData
      };

    } catch (error) {
      console.error('Error generating ticket:', error);
      throw error;
    }
  }

  /**
   * Generate PDF ticket with museum branding
   */
  private async generateTicketPDF(ticketData: TicketData, qrCodeData: string): Promise<Buffer> {
    try {
      const doc = new jsPDF();

      // Museum branding header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('MGM MUSEUM', 20, 30);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Visit Confirmation Ticket', 20, 45);

      // Ticket details
      doc.setFontSize(12);
      let yPosition = 65;

      const details = [
        `Ticket Number: ${ticketData.ticketNumber}`,
        `Booking Reference: ${ticketData.bookingReference}`,
        `Visitor Name: ${ticketData.visitorName}`,
        `Email: ${ticketData.visitorEmail}`,
        `Exhibition: ${ticketData.exhibitionName}`,
        `Visit Date: ${new Date(ticketData.visitDate).toLocaleDateString()}`,
        `Time Slot: ${ticketData.timeSlot}`,
        `Amount Paid: ₹${ticketData.amount}`,
        `Status: ${ticketData.status.toUpperCase()}`
      ];

      details.forEach(detail => {
        doc.text(detail, 20, yPosition);
        yPosition += 8;
      });

      // Generate QR Code
      try {
        const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
          width: 128,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Convert buffer to base64 for PDF embedding
        const qrCodeBase64 = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;

        // Add QR code to PDF
        doc.addImage(qrCodeBase64, 'PNG', 130, 60, 50, 50);

        // Add QR code label
        doc.setFontSize(10);
        doc.text('Scan for Entry', 130, 115);

      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Continue without QR code if generation fails
      }

      // Terms and conditions
      yPosition += 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);

      const terms = [
        '• This ticket is valid for the specified date and time only',
        '• Please arrive 15 minutes before your scheduled time',
        '• Ticket is non-refundable and non-transferable',
        '• Valid ID may be required for entry',
        '• Museum reserves the right to admission'
      ];

      terms.forEach(term => {
        doc.text(term, 20, yPosition);
        yPosition += 6;
      });

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition + 10);

      // Return PDF as buffer
      return Buffer.from(doc.output('arraybuffer'));

    } catch (error) {
      console.error('Error generating PDF ticket:', error);
      throw new Error('Failed to generate ticket PDF');
    }
  }

  /**
   * Validate ticket for entry
   */
  async validateTicket(qrCodeData: string): Promise<{
    isValid: boolean;
    ticket?: any;
    error?: string;
  }> {
    try {
      // Find ticket by QR code data
      const { data: ticket, error } = await this.supabase
        .from('tickets')
        .select(`
          *,
          bookings!inner(
            booking_reference,
            booking_date,
            time_slot_id,
            exhibitions(name, category)
          )
        `)
        .eq('qr_code_data', qrCodeData)
        .single();

      if (error || !ticket) {
        return { isValid: false, error: 'Ticket not found' };
      }

      // Check if ticket is already used
      if (ticket.status === 'validated') {
        return { isValid: false, error: 'Ticket already used' };
      }

      // Check if ticket is expired
      if (ticket.expires_at) {
        const expiryTime = new Date(ticket.expires_at);
        if (new Date() > expiryTime) {
          return { isValid: false, error: 'Ticket expired' };
        }
      }

      // Check if visit date/time is valid
      const visitDateTime = new Date(`${ticket.bookings.booking_date}T${ticket.bookings.time_slot_id}`);
      if (new Date() < visitDateTime) {
        return { isValid: false, error: 'Too early for visit' };
      }

      // Mark ticket as validated
      await this.supabase
        .from('tickets')
        .update({
          status: 'validated',
          validated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      return {
        isValid: true,
        ticket: {
          ticketNumber: ticket.ticket_number,
          visitorName: ticket.ticket_data.visitorName,
          exhibitionName: ticket.bookings.exhibitions?.name,
          visitDate: ticket.bookings.booking_date,
          timeSlot: ticket.bookings.time_slot_id
        }
      };

    } catch (error) {
      console.error('Error validating ticket:', error);
      return { isValid: false, error: 'Validation failed' };
    }
  }

  /**
   * Send ticket via email
   */
  async sendTicketByEmail(ticketId: string, recipientEmail?: string): Promise<boolean> {
    try {
      // Get ticket details
      const { data: ticket } = await this.supabase
        .from('tickets')
        .select(`
          *,
          bookings!inner(
            guest_email,
            users(email)
          )
        `)
        .eq('id', ticketId)
        .single();

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const email = recipientEmail || ticket.bookings.guest_email || ticket.bookings.users?.email;

      if (!email) {
        throw new Error('No email address available for ticket');
      }

      // Email sending logic (implement with your email service)
      const emailResult = await this.sendTicketEmail(email, ticket);

      if (emailResult) {
        // Update ticket as sent
        await this.supabase
          .from('tickets')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', ticketId);

        return true;
      }

      return false;

    } catch (error) {
      console.error('Error sending ticket by email:', error);
      return false;
    }
  }

  /**
   * Send ticket confirmation email
   */
  private async sendTicketEmail(email: string, ticket: any): Promise<boolean> {
    try {
      // This would integrate with your email service (Resend, SendGrid, etc.)
      // For now, we'll just log the email that would be sent

      console.log('Sending ticket email:', {
        to: email,
        ticketNumber: ticket.ticket_number,
        downloadUrl: ticket.pdf_url,
        exhibitionName: ticket.ticket_data.exhibitionName,
        visitDate: ticket.ticket_data.visitDate
      });

      // TODO: Implement actual email sending
      // const emailService = new EmailService();
      // await emailService.sendTicketConfirmation(email, ticket);

      return true;

    } catch (error) {
      console.error('Error sending ticket email:', error);
      return false;
    }
  }

  /**
   * Get tickets for a booking
   */
  async getTicketsForBooking(bookingId: string) {
    try {
      const { data: tickets, error } = await this.supabase
        .from('tickets')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch tickets: ${error.message}`);
      }

      return tickets || [];

    } catch (error) {
      console.error('Error fetching tickets for booking:', error);
      throw error;
    }
  }

  /**
   * Regenerate ticket (for admin use)
   */
  async regenerateTicket(ticketId: string): Promise<GeneratedTicket> {
    try {
      // Get existing ticket
      const { data: existingTicket } = await this.supabase
        .from('tickets')
        .select(`
          *,
          bookings!inner(*)
        `)
        .eq('id', ticketId)
        .single();

      if (!existingTicket) {
        throw new Error('Ticket not found');
      }

      // Generate new ticket number
      const { data: newTicketNumber } = await this.supabase
        .rpc('generate_ticket_number');

      // Create new QR code data
      const newQrCodeData = `TICKET:${newTicketNumber}:BOOKING:${existingTicket.booking_id}:EXHIBITION:${existingTicket.ticket_data.exhibitionName}:REGENERATED:${Date.now()}`;

      // Generate new PDF
      const pdfBuffer = await this.generateTicketPDF(existingTicket.ticket_data, newQrCodeData);

      // Upload new PDF
      const fileName = `tickets/${newTicketNumber}.pdf`;
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('tickets')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload new ticket PDF: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('tickets')
        .getPublicUrl(fileName);

      // Create new ticket record
      const { data: newTicket, error: ticketError } = await this.supabase
        .from('tickets')
        .insert({
          booking_id: existingTicket.booking_id,
          ticket_number: newTicketNumber,
          ticket_data: existingTicket.ticket_data,
          qr_code_data: newQrCodeData,
          pdf_url: publicUrl,
          status: 'generated',
          expires_at: existingTicket.expires_at
        })
        .select()
        .single();

      if (ticketError) {
        throw new Error(`Failed to create new ticket record: ${ticketError.message}`);
      }

      // Mark old ticket as cancelled
      await this.supabase
        .from('tickets')
        .update({ status: 'cancelled' })
        .eq('id', ticketId);

      return {
        ticketId: newTicket.id,
        ticketNumber: newTicketNumber,
        downloadUrl: publicUrl,
        qrCodeData: newQrCodeData,
        expiresAt: existingTicket.expires_at,
        metadata: existingTicket.ticket_data
      };

    } catch (error) {
      console.error('Error regenerating ticket:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ticketService = new TicketService();