import { generateTicketPDF, generateQRCode } from '../lib/services/pdf-generator-enhanced';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function testPDFGeneration() {
  console.log('Testing PDF generation...');

  try {
    // Test QR Code generation
    console.log('Generating QR code...');
    const qrCode = await generateQRCode('TEST-BOOKING-123');
    console.log('✅ QR Code generated successfully');

    // Test PDF generation
    console.log('Generating PDF ticket...');
    const ticketData = {
      bookingReference: 'TEST-BOOKING-123',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      exhibition: 'Space Exploration Journey',
      date: new Date().toLocaleDateString('en-IN'),
      time: '10:00 AM',
      tickets: [
        {
          type: 'Adult',
          quantity: 2,
          price: 150,
        },
        {
          type: 'Child',
          quantity: 1,
          price: 100,
        },
      ],
      totalAmount: 400,
      specialRequirements: 'Wheelchair accessible seating',
      seats: ['A1', 'A2', 'A3'],
    };

    const pdfBuffer = await generateTicketPDF(ticketData);
    console.log('✅ PDF generated successfully');

    // Save PDF to test directory
    const testDir = join(process.cwd(), 'test-output');
    await mkdir(testDir, { recursive: true });

    const pdfPath = join(testDir, 'test-ticket.pdf');
    await writeFile(pdfPath, pdfBuffer);

    console.log(`✅ PDF saved to: ${pdfPath}`);
    console.log('🎉 PDF generation test completed successfully!');

  } catch (error) {
    console.error('❌ PDF generation test failed:', error);
    process.exit(1);
  }
}

testPDFGeneration();