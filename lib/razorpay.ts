import Razorpay from 'razorpay'
import type { Plan } from '@/types'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

/**
 * Plan ID → monthly price mapping.
 * Plan IDs must be pre-created in the Razorpay Dashboard under
 * Subscriptions → Plans, then copied here as env vars.
 */
export const PLAN_PRICES: Record<Exclude<Plan, 'free'>, { monthly: number; planId: string }> = {
  starter: { monthly: 19, planId: process.env.RAZORPAY_STARTER_PLAN_ID! },
  pro:     { monthly: 49, planId: process.env.RAZORPAY_PRO_PLAN_ID! },
  team:    { monthly: 99, planId: process.env.RAZORPAY_TEAM_PLAN_ID! },
}

/**
 * Create a recurring Razorpay subscription for a given plan.
 * Returns the subscription ID to hand off to the frontend checkout modal.
 */
export async function createSubscription({
  workspaceId,
  planId,
  email,
}: {
  workspaceId: string
  planId: string
  email: string
}): Promise<{ subscriptionId: string }> {
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 120, // 120 billing cycles ≈ 10 years (effectively unlimited)
    quantity: 1,
    customer_notify: 1,
    notes: { workspaceId },
    notify_info: { notify_email: email },
  })

  return { subscriptionId: subscription.id }
}

/**
 * Cancel an active Razorpay subscription immediately.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await razorpay.subscriptions.cancel(subscriptionId, false)
}

/**
 * Fetch current subscription details from Razorpay.
 */
export async function getSubscription(subscriptionId: string) {
  return razorpay.subscriptions.fetch(subscriptionId)
}

/**
 * Map a Razorpay plan_id back to an app Plan tier.
 */
export function getPlanFromPlanId(planId: string): Plan {
  const map: Record<string, Plan> = {
    [process.env.RAZORPAY_STARTER_PLAN_ID!]: 'starter',
    [process.env.RAZORPAY_PRO_PLAN_ID!]: 'pro',
    [process.env.RAZORPAY_TEAM_PLAN_ID!]: 'team',
  }
  return map[planId] ?? 'free'
}
