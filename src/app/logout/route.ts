import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  (await cookies()).delete('session');
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://buwa-crm.vercel.app'));
}
