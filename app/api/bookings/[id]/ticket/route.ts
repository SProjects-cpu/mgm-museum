import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const bookingId = params.id;

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        exhibitions (
          id,
          title,
          slug,
          description
        ),
        time_slots (
          id,
          slot_date,
          start_time,
          end_time
        )
      `)
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      return NextResponse.json(
        { success: false, message: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    // Cast to any to avoid TypeScript errors
    const bookingData = booking as any;

    // Generate PDF ticket
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    
    // Generate QR code
    const qrCodeData = JSON.stringify({
      bookingId: bookingData.id,
      reference: bookingData.booking_reference,
      date: bookingData.booking_date,
    });
    
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    
    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('MGM Museum', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).font('Helvetica').text('E-Ticket', { align: 'center' });
    doc.moveDown(1);

    // Booking Reference
    doc.fontSize(12).font('Helvetica-Bold').text('Booking Reference:', 50, doc.y);
    doc.font('Helvetica').text(bookingData.booking_reference, 200, doc.y - 12);
    doc.moveDown(0.5);

    // Exhibition/Show Details
    if (bookingData.exhibitions) {
      doc.font('Helvetica-Bold').text('Exhibition:', 50, doc.y);
      doc.font('Helvetica').text(bookingData.exhibitions.title, 200, doc.y - 12);
      doc.moveDown(0.5);
    }

    // Date and Time
    doc.font('Helvetica-Bold').text('Date:', 50, doc.y);
    doc.font('Helvetica').text(
      new Date(bookingData.booking_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      200,
      doc.y - 12
    );
    doc.moveDown(0.5);

    if (bookingData.time_slots) {
      doc.font('Helvetica-Bold').text('Time:', 50, doc.y);
      doc.font('Helvetica').text(
        `${bookingData.time_slots.start_time} - ${bookingData.time_slots.end_time}`,
        200,
        doc.y - 12
      );
      doc.moveDown(0.5);
    }

    // Guest Details
    if (bookingData.guest_name) {
      doc.font('Helvetica-Bold').text('Guest Name:', 50, doc.y);
      doc.font('Helvetica').text(bookingData.guest_name, 200, doc.y - 12);
      doc.moveDown(0.5);
    }

    // Tickets
    if (bookingData.metadata?.tickets) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Tickets:', 50, doc.y);
      doc.moveDown(0.3);
      
      Object.entries(bookingData.metadata.tickets).forEach(([type, count]: [string, any]) => {
        if (count > 0) {
          doc.font('Helvetica').text(
            `${count} x ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            70,
            doc.y
          );
          doc.moveDown(0.3);
        }
      });
    }

    // Amount
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Total Amount:', 50, doc.y);
    doc.font('Helvetica').text(`₹${bookingData.total_amount}`, 200, doc.y - 12);
    doc.moveDown(0.5);

    // Status
    doc.font('Helvetica-Bold').text('Status:', 50, doc.y);
    doc.font('Helvetica').text(bookingData.status.toUpperCase(), 200, doc.y - 12);
    doc.moveDown(2);

    // QR Code
    const qrCodeBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64');
    doc.image(qrCodeBuffer, 200, doc.y, { width: 150, height: 150 });
    doc.moveDown(10);

    // Instructions
    doc.fontSize(10).font('Helvetica-Bold').text('Important Instructions:', 50, doc.y);
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica')
      .text('• Please arrive at least 15 minutes before your scheduled time', 50, doc.y)
      .text('• Carry a valid ID proof for verification', 50, doc.y + 15)
      .text('• This ticket is non-transferable and non-refundable', 50, doc.y + 30)
      .text('• Present this ticket (printed or digital) at the entrance', 50, doc.y + 45);

    // Footer
    doc.fontSize(8).text(
      'For any queries, please contact support@mgmmuseum.com',
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();
    
    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${bookingData.booking_reference}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating ticket:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate ticket" },
      { status: 500 }
    );
  }
}
