// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

// Test Razorpay connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyId, keySecret } = body;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Key ID and Secret are required' },
        { status: 400 }
      );
    }

    // Test the credentials by attempting to fetch payments
    const response = await fetch('https://api.razorpay.com/v1/payments', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: 'Razorpay credentials are valid',
        paymentsCount: data.count || 0
      });
    } else if (response.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Razorpay credentials. Please check your Key ID and Secret.' },
        { status: 401 }
      );
    } else {
      return NextResponse.json(
        { error: `Razorpay API error: ${response.statusText}` },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test connection' },
      { status: 500 }
    );
  }
}
