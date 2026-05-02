import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const url = await createBillingPortalSession(
    workspace.stripe_customer_id,
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
  )

  return NextResponse.json({ url })
}
