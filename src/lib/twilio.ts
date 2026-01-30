import Twilio from 'twilio';

const accountSid = import.meta.env.TWILIO_ACCOUNT_SID;
const authToken = import.meta.env.TWILIO_AUTH_TOKEN;

export const twilioClient = Twilio(accountSid, authToken);

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
