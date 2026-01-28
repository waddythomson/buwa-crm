import type { APIRoute } from 'astro';
import { findUser } from '../../../lib/auth';
import { sendOTP } from '../../../lib/twilio';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { identifier } = await request.json();
    
    // Check if user exists
    const user = await findUser(identifier);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found. Contact admin for access.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine channel (SMS or email)
    const isPhone = identifier.startsWith('+') || /^\d+$/.test(identifier);
    const channel = isPhone ? 'sms' : 'email';
    
    // Normalize phone number
    let to = identifier;
    if (isPhone && !identifier.startsWith('+')) {
      to = '+1' + identifier.replace(/\D/g, '');
    }

    // Send OTP via Twilio Verify
    await sendOTP(to, channel);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
