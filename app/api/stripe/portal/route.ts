import { NextResponse } from 'next/server'

// Migrated to /api/razorpay/portal
export async function POST() {
  return NextResponse.json({ error: 'Endpoint moved to /api/razorpay/portal' }, { status: 410 })
}
