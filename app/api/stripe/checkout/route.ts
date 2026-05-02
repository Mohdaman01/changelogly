import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createCheckoutSession, PLAN_PRICES } from '@/lib/stripe'
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

  const url = await createCheckoutSession({
    workspaceId: workspace.id,
    clerkUserId: userId,
    email,
    priceId: priceInfo.priceId,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=upgraded`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  })

  return NextResponse.json({ url })
}
