import { NextResponse } from 'next/server'

// Migrated to /api/webhooks/razorpay
export async function POST() {
  return NextResponse.json({ error: 'Webhook endpoint moved to /api/webhooks/razorpay' }, { status: 410 })
}
