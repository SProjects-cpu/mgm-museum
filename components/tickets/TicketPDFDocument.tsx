/**
 * PDF Ticket Document Component
 * Renders professional museum ticket using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { getEventTitle, formatTimeSlot } from '@/lib/tickets/fetch-ticket-data';
import { TicketPDFProps } from '@/types/tickets';

/**
 * Museum brand colors
 */
const COLORS = {
  primary: '#1a1a1a',
  accent: '#d4af37',
  text: '#333333',
  textLight: '#666666',
  border: '#e0e0e0',
  background: '#ffffff',
};

/**
 * PDF styles
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: COLORS.background,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: `2px solid ${COLORS.accent}`,
  },
  logo: {
    width: 80,
    height: 80,
  },
  ticketTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: COLORS.textLight,
    width: '40%',
  },
  value: {
    fontSize: 11,
    color: COLORS.text,
    width: '60%',
    fontWeight: 'bold',
  },
  highlightBox: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeft: `4px solid ${COLORS.accent}`,
  },
  bookingReference: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  paymentId: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  qrSection: {
    flexDirection: 'row',
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  qrCode: {
    width: 150,
    height: 150,
    marginRight: 20,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  eventInfo: {
    fontSize: 11,
    color: COLORS.text,
    marginBottom: 5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: `1px solid ${COLORS.border}`,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: COLORS.textLight,
    marginBottom: 3,
  },
  footerBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },
  amountBox: {
    backgroundColor: COLORS.accent,
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
    textAlign: 'center',
  },
  ticketNumber: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: 'Courier',
    marginTop: 5,
  },
});

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * PDF Ticket Document Component
 */
export const TicketPDFDocument: React.FC<TicketPDFProps> = ({
  booking,
  qrCodeDataUrl,
  museumLogo,
}) => {
  const eventTitle = getEventTitle(booking);
  const timeSlot = formatTimeSlot(booking.time_slots);
  const visitDate = formatDate(booking.time_slots.slot_date);
  const ticketNumber = booking.tickets[0]?.ticket_number || 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {museumLogo && <Image src={museumLogo} style={styles.logo} />}
            {!museumLogo && (
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.primary }}>
                MGM Museum
              </Text>
            )}
          </View>
          <Text style={styles.ticketTitle}>TICKET</Text>
        </View>

        {/* Booking Reference & Payment ID */}
        <View style={styles.highlightBox}>
          <Text style={styles.bookingReference}>
            Booking: {booking.booking_reference}
          </Text>
          {booking.payment_id && (
            <Text style={styles.paymentId}>
              Payment ID: {booking.payment_id}
            </Text>
          )}
        </View>

        {/* QR Code & Event Details */}
        <View style={styles.qrSection}>
          <Image src={qrCodeDataUrl} style={styles.qrCode} />
          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle}>{eventTitle}</Text>
            <Text style={styles.eventInfo}>📅 {visitDate}</Text>
            <Text style={styles.eventInfo}>🕐 {timeSlot}</Text>
            {booking.pricing_tier && (
              <Text style={styles.eventInfo}>
                🎫 {booking.pricing_tier.quantity} × {booking.pricing_tier.name}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Guest Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{booking.guest_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{booking.guest_email}</Text>
          </View>
          {booking.guest_phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{booking.guest_phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Ticket Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ticket Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ticket Number:</Text>
            <Text style={styles.value}>{ticketNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>CONFIRMED</Text>
          </View>
          {booking.pricing_tier && (
            <View style={styles.row}>
              <Text style={styles.label}>Ticket Type:</Text>
              <Text style={styles.value}>{booking.pricing_tier.name}</Text>
            </View>
          )}
        </View>

        {/* Amount Paid */}
        <View style={styles.amountBox}>
          <Text style={styles.amountText}>
            Amount Paid: {formatCurrency(booking.total_amount)}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBold}>MGM Museum</Text>
          <Text style={styles.footerText}>
            Please arrive 15 minutes before your scheduled time
          </Text>
          <Text style={styles.footerText}>
            Present this ticket at the entrance for verification
          </Text>
          <Text style={styles.footerText}>
            For inquiries: info@mgmmuseum.com | +91 1234567890
          </Text>
          <Text style={[styles.footerText, { marginTop: 10 }]}>
            www.mgmmuseum.com
          </Text>
        </View>
      </Page>
    </Document>
  );
};
