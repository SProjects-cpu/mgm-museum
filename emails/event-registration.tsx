import {
  Html, Head, Preview, Body, Container, Section, Text, Button,
} from '@react-email/components';
import * as React from 'react';

interface EventRegistrationEmailProps {
  eventTitle: string;
  customerName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  registrationId: string;
}

export function EventRegistrationEmail(props: EventRegistrationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You're registered for {props.eventTitle}!</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          <Section style={{ padding: '30px', backgroundColor: '#10b981', textAlign: 'center' }}>
            <Text style={{ fontSize: '36px', margin: 0 }}>🎉</Text>
            <Text style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', margin: '12px 0 0 0' }}>
              Registration Confirmed!
            </Text>
          </Section>

          <Section style={{ padding: '40px' }}>
            <Text style={{ fontSize: '18px' }}>Hi {props.customerName},</Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6' }}>
              You're all set for our upcoming event! We're excited to see you there.
            </Text>
            
            <Section style={{ backgroundColor: '#f3f4f6', padding: '24px', borderRadius: '8px', margin: '30px 0' }}>
              <Text style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 16px 0' }}>
                {props.eventTitle}
              </Text>
              <Text style={{ margin: '8px 0' }}>📅 Date: {props.eventDate}</Text>
              <Text style={{ margin: '8px 0' }}>🕐 Time: {props.eventTime}</Text>
              <Text style={{ margin: '8px 0' }}>📍 Location: {props.location}</Text>
              <Text style={{ margin: '8px 0', fontFamily: 'monospace' }}>
                Registration ID: {props.registrationId}
              </Text>
            </Section>

            <Section style={{ textAlign: 'center', margin: '30px 0' }}>
              <Button
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/events`}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                View Event Details
              </Button>
            </Section>
          </Section>

          <Section style={{ padding: '20px', backgroundColor: '#f9fafb', textAlign: 'center' }}>
            <Text style={{ fontSize: '12px', color: '#6b7280' }}>
              Looking forward to seeing you!
              <br />
              MGM Science Centre
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default EventRegistrationEmail;






