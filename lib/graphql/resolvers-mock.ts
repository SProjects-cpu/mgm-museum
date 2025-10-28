import { mockDataService } from '@/lib/services/mock-data';

// Mock resolvers that use the mock data service instead of Supabase
export const mockResolvers = {
  Query: {
    exhibitions: async (_: any, { status, featured }: any) => {
      return mockDataService.getExhibitions(status, featured);
    },

    exhibition: async (_: any, { slug }: any) => {
      return mockDataService.getExhibitionBySlug(slug);
    },

    shows: async (_: any, { type }: any) => {
      return mockDataService.getShows(type);
    },

    availableTimeSlots: async (_: any, { date, exhibitionId, showId }: any) => {
      return mockDataService.getAvailableTimeSlots(date, exhibitionId, showId);
    },

    booking: async (_: any, { reference }: any) => {
      return mockDataService.getBookingByReference(reference);
    },

    myBookings: async (_: any, __: any, context: any) => {
      // In mock mode, return all bookings (no auth required)
      return mockDataService.getMyBookings();
    },

    bookedSeats: async (_: any, { showId, date, timeSlotId }: any) => {
      return mockDataService.getBookedSeats(showId, date, timeSlotId);
    },

    // PDF Generation Queries
    generateTicketPDF: async (_: any, { bookingReference }: any) => {
      // Return the API URL for PDF generation
      return `/api/pdf/generate?type=ticket&reference=${bookingReference}`;
    },

    generateReportPDF: async (_: any, { reportType, startDate, endDate }: any) => {
      // Return the API URL for report generation
      return `/api/pdf/generate?type=report&reportType=${reportType}&startDate=${startDate}&endDate=${endDate}`;
    },

    // Availability Check Query
    checkAvailability: async (_: any, { date, exhibitionId, showId, timeSlotId, requestedSeats }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/availability/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, exhibitionId, showId, timeSlotId, requestedSeats }),
        });
        const result = await response.json();
        return JSON.stringify(result);
      } catch (error) {
        console.error('Availability check error:', error);
        return JSON.stringify({ error: 'Failed to check availability' });
      }
    },
  },

  Mutation: {
    createBooking: async (_: any, { input }: any) => {
      const booking = mockDataService.createBooking(input);
      return {
        booking,
        paymentOrder: null, // Will be implemented when payment is enabled
      };
    },

    confirmBooking: async (_: any, { reference }: any) => {
      return mockDataService.confirmBooking(reference);
    },

    cancelBooking: async (_: any, { reference }: any) => {
      return mockDataService.cancelBooking(reference);
    },

    // PDF Generation Mutations
    generateTicketPDF: async (_: any, { bookingReference }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/pdf/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'ticket', bookingReference }),
        });
        if (response.ok) {
          return `/api/pdf/generate?type=ticket&reference=${bookingReference}`;
        }
        throw new Error('PDF generation failed');
      } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error('Failed to generate PDF');
      }
    },

    generateReportPDF: async (_: any, { reportType, startDate, endDate }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/pdf/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'report', reportType, startDate, endDate }),
        });
        if (response.ok) {
          return `/api/pdf/generate?type=report&reportType=${reportType}&startDate=${startDate}&endDate=${endDate}`;
        }
        throw new Error('Report generation failed');
      } catch (error) {
        console.error('Report generation error:', error);
        throw new Error('Failed to generate report');
      }
    },

    // Email Service Mutations
    sendBookingConfirmation: async (_: any, { bookingReference }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'booking-confirmation', bookingReference }),
        });
        const result = await response.json();
        return result.success || false;
      } catch (error) {
        console.error('Email sending error:', error);
        return false;
      }
    },

    sendBookingReminder: async (_: any, { bookingReference, hoursBefore }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'booking-reminder', bookingReference, hoursBefore }),
        });
        const result = await response.json();
        return result.success || false;
      } catch (error) {
        console.error('Email sending error:', error);
        return false;
      }
    },

    sendBookingCancellation: async (_: any, { bookingReference, refundAmount }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'booking-cancellation', bookingReference, refundAmount }),
        });
        const result = await response.json();
        return result.success || false;
      } catch (error) {
        console.error('Email sending error:', error);
        return false;
      }
    },

    // Message Service Mutations
    sendNotification: async (_: any, { title, message, recipientEmail, recipientId, priority, bookingReference }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'notification',
            data: { title, message, recipientEmail, recipientId, priority, bookingReference }
          }),
        });
        const result = await response.json();
        return result.messageId || '';
      } catch (error) {
        console.error('Notification sending error:', error);
        throw new Error('Failed to send notification');
      }
    },

    sendAlert: async (_: any, { title, message, recipientEmail, recipientId, alertType, actionRequired }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'alert',
            data: { title, message, recipientEmail, recipientId, alertType, actionRequired }
          }),
        });
        const result = await response.json();
        return result.messageId || '';
      } catch (error) {
        console.error('Alert sending error:', error);
        throw new Error('Failed to send alert');
      }
    },

    sendBroadcast: async (_: any, { title, message, targetAudience, priority }: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'broadcast',
            data: { title, message, targetAudience, priority }
          }),
        });
        const result = await response.json();
        return result.messageId || '';
      } catch (error) {
        console.error('Broadcast sending error:', error);
        throw new Error('Failed to send broadcast');
      }
    },

    // Existing mutations (placeholders for now)
    registerForEvent: async (_: any, { input }: any) => {
      // Mock implementation
      return {
        id: Date.now().toString(),
        name: input.name,
        email: input.email,
        status: 'registered',
      };
    },

    subscribeNewsletter: async (_: any, { email, name }: any) => {
      return {
        email,
        subscribedAt: new Date().toISOString(),
      };
    },

    submitContactForm: async (_: any, { input }: any) => {
      return {
        id: Date.now().toString(),
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
      };
    },
  },
};