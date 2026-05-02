import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cancelSubscription, getSubscription } from '@/lib/razorpay'

// GET — fetch current subscription details for the billing management UI
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('razorpay_subscription_id, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace?.razorpay_subscription_id) {
    return NextResponse.json({ subscription: null, plan: 'free' })
  }

  try {
    const subscription = await getSubscription(workspace.razorpay_subscription_id)
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_end: (subscription as any).current_end,
        plan_id: subscription.plan_id,
      },
      plan: workspace.plan,
    })
  } catch {
    return NextResponse.json({ subscription: null, plan: workspace.plan })
  }
}

// POST — cancel the active subscription immediately
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('razorpay_subscription_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace?.razorpay_subscription_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  await cancelSubscription(workspace.razorpay_subscription_id)

  // Downgrade workspace to free immediately
  await supabaseAdmin
    .from('workspaces')
    .update({ plan: 'free', razorpay_subscription_id: null })
    .eq('clerk_user_id', userId)

  return NextResponse.json({ cancelled: true })
}
