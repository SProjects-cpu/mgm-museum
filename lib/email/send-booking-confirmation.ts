/**
 * Send Booking Confirmation Email
 */

import { resend, EMAIL_CONFIG } from './resend-client';
import { BookingConfirmationEmail } from './booking-confirmation-email';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

interface SendBookingConfirmationParams {
  to: string;
  guestName: string;
  bookingReference: string;
  eventTitle: string;
  visitDate: string;
  timeSlot: string;
  totalAmount: number;
  ticketCount: number;
  paymentId: string;
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(
  params: SendBookingConfirmationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Render email template to HTML
    const emailHtml = renderToStaticMarkup(
      React.createElement(BookingConfirmationEmail, {
        guestName: params.guestName,
        bookingReference: params.bookingReference,
        eventTitle: params.eventTitle,
        visitDate: params.visitDate,
        timeSlot: params.timeSlot,
        totalAmount: params.totalAmount,
        ticketCount: params.ticketCount,
        paymentId: params.paymentId,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Booking Confirmed - ${params.bookingReference} | MGM Museum`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send booking confirmation email:', error);
      return { success: false, error: error.message };
    }

    console.log('Booking confirmation email sent successfully:', {
      emailId: data?.id,
      to: params.to,
      bookingReference: params.bookingReference,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
