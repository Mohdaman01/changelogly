import { NextResponse } from 'next/server'

// Migrated to /api/razorpay/checkout
export async function POST() {
  return NextResponse.json({ error: 'Endpoint moved to /api/razorpay/checkout' }, { status: 410 })
}
