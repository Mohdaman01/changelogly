import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import { getPlanFromPlanId } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  // Validate HMAC-SHA256 signature against webhook secret
  const isValid = Razorpay.validateWebhookSignature(
    body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET!
  )

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body) as {
    event: string
    payload: {
      subscription?: { entity: Record<string, any> }
      payment?: { entity: Record<string, any> }
    }
  }

  switch (event.event) {
    /**
     * subscription.charged — fires every time a recurring payment succeeds.
     * This is the Razorpay equivalent of Stripe's checkout.session.completed
     * and customer.subscription.updated combined.
     */
    case 'subscription.charged': {
      const subscription = event.payload.subscription?.entity
      if (!subscription) break

      const workspaceId = subscription.notes?.workspaceId as string | undefined
      if (!workspaceId) break

      const plan = getPlanFromPlanId(subscription.plan_id)

      await supabaseAdmin
        .from('workspaces')
        .update({
          plan,
          razorpay_customer_id: subscription.customer_id ?? null,
          razorpay_subscription_id: subscription.id,
        })
        .eq('id', workspaceId)
      break
    }

    /**
     * subscription.cancelled — fires when a subscription is cancelled
     * (equivalent to Stripe's customer.subscription.deleted).
     */
    case 'subscription.cancelled': {
      const subscription = event.payload.subscription?.entity
      if (!subscription) break

      await supabaseAdmin
        .from('workspaces')
        .update({ plan: 'free', razorpay_subscription_id: null })
        .eq('razorpay_customer_id', subscription.customer_id)
      break
    }

    /**
     * subscription.halted — fires when a subscription auto-pauses after
     * repeated payment failures (Razorpay-specific behavior).
     */
    case 'subscription.halted': {
      const subscription = event.payload.subscription?.entity
      if (!subscription) break

      await supabaseAdmin
        .from('workspaces')
        .update({ plan: 'free' })
        .eq('razorpay_customer_id', subscription.customer_id)
      break
    }

    /**
     * payment.failed — fires when an individual charge attempt fails.
     * Log for alerting; plan is kept active until subscription halts.
     */
    case 'payment.failed': {
      const payment = event.payload.payment?.entity
      console.error('[Razorpay] Payment failed:', {
        id: payment?.id,
        email: payment?.email,
        error: payment?.error_description,
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
