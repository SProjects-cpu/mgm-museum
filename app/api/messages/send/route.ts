import { NextRequest, NextResponse } from 'next/server';
import { mockDataService } from '@/lib/services/mock-data';

// In-memory storage for messages (in production, this would be in database)
let messages: Array<{
  id: string;
  type: 'notification' | 'alert' | 'reminder' | 'broadcast';
  title: string;
  message: string;
  recipientEmail?: string;
  recipientId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
  sentAt?: string;
  metadata?: any;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    switch (type) {
      case 'notification': {
        // Send booking notification
        const message = {
          id: Date.now().toString(),
          type: 'notification' as const,
          title: data.title || 'Booking Notification',
          message: data.message,
          recipientEmail: data.recipientEmail,
          recipientId: data.recipientId,
          priority: data.priority || 'medium',
          status: 'sent' as const,
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          metadata: {
            bookingReference: data.bookingReference,
            actionUrl: data.actionUrl,
          },
        };

        messages.push(message);

        return NextResponse.json({
          success: true,
          message: message,
          messageId: message.id
        });
      }

      case 'alert': {
        // Send system alert
        const message = {
          id: Date.now().toString(),
          type: 'alert' as const,
          title: data.title || 'System Alert',
          message: data.message,
          recipientEmail: data.recipientEmail,
          recipientId: data.recipientId,
          priority: data.priority || 'high',
          status: 'sent' as const,
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          metadata: {
            alertType: data.alertType,
            actionRequired: data.actionRequired,
          },
        };

        messages.push(message);

        return NextResponse.json({
          success: true,
          message: message,
          messageId: message.id
        });
      }

      case 'reminder': {
        // Send booking reminder
        const booking = mockDataService.getBookingByReference(data.bookingReference);
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const message = {
          id: Date.now().toString(),
          type: 'reminder' as const,
          title: 'Visit Reminder',
          message: `Don't forget your visit to ${booking.exhibition?.name || booking.show?.name} on ${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.timeSlot?.startTime}`,
          recipientEmail: booking.guestEmail,
          priority: 'medium' as const,
          status: 'sent' as const,
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          metadata: {
            bookingReference: data.bookingReference,
            hoursBefore: data.hoursBefore || 24,
          },
        };

        messages.push(message);

        return NextResponse.json({
          success: true,
          message: message,
          messageId: message.id
        });
      }

      case 'broadcast': {
        // Send broadcast message to all users
        const message = {
          id: Date.now().toString(),
          type: 'broadcast' as const,
          title: data.title,
          message: data.message,
          priority: data.priority || 'low',
          status: 'sent' as const,
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          metadata: {
            targetAudience: data.targetAudience || 'all',
            sentCount: data.sentCount || 0,
          },
        };

        messages.push(message);

        return NextResponse.json({
          success: true,
          message: message,
          messageId: message.id
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Message sending error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const recipientEmail = searchParams.get('recipientEmail');
    const status = searchParams.get('status');

    let filteredMessages = messages;

    if (type) {
      filteredMessages = filteredMessages.filter(m => m.type === type);
    }

    if (recipientEmail) {
      filteredMessages = filteredMessages.filter(m => m.recipientEmail === recipientEmail);
    }

    if (status) {
      filteredMessages = filteredMessages.filter(m => m.status === status);
    }

    // Sort by created date (newest first)
    filteredMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      messages: filteredMessages,
      total: filteredMessages.length,
    });
  } catch (error) {
    console.error('Message retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve messages' }, { status: 500 });
  }
}