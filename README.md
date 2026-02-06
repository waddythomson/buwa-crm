# BuWa CRM

A customer relationship management system built with Next.js, Supabase, and Twilio.

## Features

- 📧 Magic link authentication (passwordless login)
- 👥 Contact management
- 💬 SMS messaging via Twilio
- 📞 Voice calls via Twilio
- 📝 Notes on contact timeline
- 👤 Multi-user support with admin roles

## Setup

1. Copy `.env.example` to `.env.local` and fill in your credentials
2. Run the schema.sql in your Supabase SQL editor
3. Deploy to Vercel

## Environment Variables

Required in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `NEXT_PUBLIC_SITE_URL` (your deployed URL)

## Twilio Webhooks

Configure these in Twilio Console for your phone number:
- SMS webhook: `https://your-domain.com/api/twilio/sms` (POST)
- Voice webhook: `https://your-domain.com/api/twilio/voice` (POST)
