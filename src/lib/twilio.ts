import twilio from 'twilio';

let cachedClient: ReturnType<typeof twilio> | null = null;

export const getTwilioClient = () => {
  if (cachedClient) return cachedClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
  }

  cachedClient = twilio(accountSid, authToken);
  return cachedClient;
};

export const getTwilioPhoneNumber = () => {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error('Twilio phone number missing. Set TWILIO_PHONE_NUMBER.');
  }
  return phoneNumber;
};
