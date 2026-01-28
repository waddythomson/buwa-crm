import Twilio from 'twilio';

const accountSid = import.meta.env.TWILIO_ACCOUNT_SID;
const authToken = import.meta.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = import.meta.env.TWILIO_VERIFY_SERVICE_SID;

export const twilioClient = Twilio(accountSid, authToken);

// Send OTP via SMS or Email
export async function sendOTP(to: string, channel: 'sms' | 'email' = 'sms') {
  return twilioClient.verify.v2
    .services(verifyServiceSid)
    .verifications.create({ to, channel });
}

// Verify OTP code
export async function verifyOTP(to: string, code: string) {
  return twilioClient.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({ to, code });
}

// Send SMS
export async function sendSMS(to: string, body: string) {
  return twilioClient.messages.create({
    to,
    from: import.meta.env.TWILIO_PHONE_NUMBER,
    body
  });
}

// Make outbound call
export async function makeCall(to: string, twimlUrl: string) {
  return twilioClient.calls.create({
    to,
    from: import.meta.env.TWILIO_PHONE_NUMBER,
    url: twimlUrl
  });
}
