import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSubscription, PLAN_PRICES } from '@/lib/razorpay'
import type { Plan } from '@/types'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()

  if (!plan || plan === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? ''

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const priceInfo = PLAN_PRICES[plan as Exclude<Plan, 'free'>]
  if (!priceInfo) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })

  const { subscriptionId } = await createSubscription({
    workspaceId: workspace.id,
    planId: priceInfo.planId,
    email,
  })

  // Return everything the frontend needs to open the Razorpay checkout modal
  return NextResponse.json({
    subscriptionId,
    keyId: process.env.RAZORPAY_KEY_ID,
    amount: priceInfo.monthly * 100, // amount in paise (INR smallest unit)
    currency: 'INR',
    name: 'Changelogly',
    description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — Monthly`,
    prefill: { email },
    theme: { color: '#6366f1' },
  })
}
