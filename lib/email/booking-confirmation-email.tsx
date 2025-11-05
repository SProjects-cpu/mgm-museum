/**
 * Booking Confirmation Email Template
 */

import React from 'react';

interface BookingConfirmationEmailProps {
  guestName: string;
  bookingReference: string;
  eventTitle: string;
  visitDate: string;
  timeSlot: string;
  totalAmount: number;
  ticketCount: number;
  paymentId: string;
}

export const BookingConfirmationEmail: React.FC<BookingConfirmationEmailProps> = ({
  guestName,
  bookingReference,
  eventTitle,
  visitDate,
  timeSlot,
  totalAmount,
  ticketCount,
  paymentId,
}) => {
  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            background: #f8f8f8;
            padding: 30px 20px;
            border-radius: 0 0 8px 8px;
          }
          .booking-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #d4af37;
          }
          .booking-ref {
            font-size: 24px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 10px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .detail-label {
            color: #666;
            font-weight: 500;
          }
          .detail-value {
            color: #1a1a1a;
            font-weight: bold;
          }
          .amount-box {
            background: #d4af37;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 20px;
            font-weight: bold;
          }
          .info-box {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
          }
          .info-box h3 {
            margin-top: 0;
            color: #1976d2;
          }
          .info-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .info-box li {
            margin: 8px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
          }
          .footer a {
            color: #d4af37;
            text-decoration: none;
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>🎫 Booking Confirmed!</h1>
          <p>Thank you for booking with MGM Museum</p>
        </div>

        <div className="content">
          <p>Dear {guestName},</p>
          <p>
            Your booking has been confirmed! We're excited to welcome you to MGM Museum.
          </p>

          <div className="booking-box">
            <div className="booking-ref">Booking: {bookingReference}</div>
            <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
              Payment ID: {paymentId}
            </p>
          </div>

          <div className="booking-box">
            <h3 style={{ marginTop: 0, color: '#1a1a1a' }}>Visit Details</h3>
            
            <div className="detail-row">
              <span className="detail-label">Event:</span>
              <span className="detail-value">{eventTitle}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{visitDate}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Time:</span>
              <span className="detail-value">{timeSlot}</span>
            </div>
            
            <div className="detail-row" style={{ borderBottom: 'none' }}>
              <span className="detail-label">Tickets:</span>
              <span className="detail-value">{ticketCount} ticket(s)</span>
            </div>
          </div>

          <div className="amount-box">
            Amount Paid: ₹{totalAmount.toFixed(2)}
          </div>

          <div className="info-box">
            <h3>📋 What's Next?</h3>
            <ul>
              <li>Download your ticket from the confirmation page</li>
              <li>Please arrive 15 minutes before your scheduled time</li>
              <li>Present your ticket (digital or printed) at the entrance</li>
              <li>Keep your booking reference handy: <strong>{bookingReference}</strong></li>
            </ul>
          </div>

          <p style={{ textAlign: 'center', margin: '30px 0' }}>
            <a 
              href="https://mgm-museum.vercel.app/bookings/confirmation?ids={bookingReference}"
              style={{
                background: '#d4af37',
                color: 'white',
                padding: '12px 30px',
                textDecoration: 'none',
                borderRadius: '6px',
                display: 'inline-block',
                fontWeight: 'bold'
              }}
            >
              View Booking Details
            </a>
          </p>
        </div>

        <div className="footer">
          <p><strong>MGM Museum</strong></p>
          <p>
            For inquiries: <a href="mailto:info@mgmmuseum.com">info@mgmmuseum.com</a> | 
            +91 1234567890
          </p>
          <p>
            <a href="https://mgm-museum.vercel.app">www.mgmmuseum.com</a>
          </p>
        </div>
      </body>
    </html>
  );
};
