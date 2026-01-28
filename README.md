# BuWa CRM

A lightweight CRM for managing SMS and voice communications via Twilio.

## Features

- 📱 Send/receive SMS messages
- 📞 Make/receive phone calls with voicemail
- 📝 Add notes to contact timelines
- 🔐 Passwordless authentication via OTP
- 👥 Multi-user with admin controls

## Setup

### 1. Database Setup (Supabase)

Run the schema in Supabase SQL Editor:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Paste contents of `schema.sql`
5. Click "Run"

### 2. Twilio Setup (after port completes)

1. Log into Twilio Console
2. Get your Account SID and Auth Token from Dashboard
3. Create a Verify Service:
   - Go to Verify → Services → Create new
   - Name it "BuWa CRM"
   - Copy the Service SID
4. Configure webhooks for your phone number:
   - SMS: `https://your-domain.vercel.app/api/twilio/webhook-sms`
   - Voice: `https://your-domain.vercel.app/api/twilio/webhook-voice`

### 3. Environment Variables

Update `.env` with your Twilio credentials.

### 4. Deploy to Vercel

```bash
npm install
vercel
```

## Local Development

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── components/    # React components
├── layouts/       # Page layouts
├── lib/           # Utility functions
├── pages/         # Routes
│   ├── api/       # API endpoints
│   ├── contacts/  # Contact pages
│   └── users/     # User management (admin)
└── public/        # Static assets
```
