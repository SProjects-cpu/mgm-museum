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
 * PDF styles - Optimized for single page
 */
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: COLORS.background,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottom: `2px solid ${COLORS.accent}`,
  },
  logo: {
    width: 60,
    height: 60,
  },
  ticketTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: COLORS.textLight,
    width: '40%',
  },
  value: {
    fontSize: 10,
    color: COLORS.text,
    width: '60%',
    fontWeight: 'bold',
  },
  highlightBox: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeft: `4px solid ${COLORS.accent}`,
  },
  bookingReference: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 3,
  },
  paymentId: {
    fontSize: 9,
    color: COLORS.textLight,
  },
  qrSection: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
  },
  qrCode: {
    width: 120,
    height: 120,
    marginRight: 15,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  eventInfo: {
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 4,
  },
  footer: {
    marginTop: 15,
    paddingTop: 12,
    borderTop: `1px solid ${COLORS.border}`,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  footerBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 3,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  amountBox: {
    backgroundColor: COLORS.accent,
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  amountText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.background,
    textAlign: 'center',
  },
  ticketNumber: {
    fontSize: 9,
    color: COLORS.textLight,
    fontFamily: 'Courier',
    marginTop: 3,
  },
  twoColumnSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  column: {
    width: '48%',
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

        {/* Guest & Ticket Details - Two Column Layout */}
        <View style={styles.twoColumnSection}>
          {/* Guest Details */}
          <View style={styles.column}>
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

          {/* Ticket Details */}
          <View style={styles.column}>
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
                <Text style={styles.label}>Type:</Text>
                <Text style={styles.value}>{booking.pricing_tier.name}</Text>
              </View>
            )}
          </View>
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
