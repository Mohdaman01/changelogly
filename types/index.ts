export type Plan = 'free' | 'starter' | 'pro' | 'team'
export type ChangelogStatus = 'draft' | 'published'
export type ChangelogTone = 'technical' | 'marketing' | 'user-friendly'
export type TeamRole = 'owner' | 'editor' | 'viewer'

export interface Workspace {
  id: string
  clerk_user_id: string
  name: string
  slug: string
  plan: Plan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  github_access_token?: string
  custom_domain?: string
  logo_url?: string
  brand_color: string
  created_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description?: string
  github_repo?: string
  gitlab_repo?: string
  slug: string
  is_public: boolean
  show_branding: boolean
  created_at: string
}

export interface Changelog {
  id: string
  project_id: string
  workspace_id: string
  title: string
  version?: string
  content_md: string
  content_html?: string
  tone: ChangelogTone
  status: ChangelogStatus
  published_at?: string
  from_commit?: string
  to_commit?: string
  tags: string[]
  generation_tokens: number
  created_at: string
  updated_at: string
}

export interface ChangelogSubscriber {
  id: string
  project_id: string
  email: string
  confirmed: boolean
  token: string
  created_at: string
}

export interface TeamMember {
  id: string
  workspace_id: string
  clerk_user_id: string
  role: TeamRole
  invited_email?: string
  accepted: boolean
  created_at: string
}

export interface GitHubCommit {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

export interface GitHubRelease {
  tag: string
  name: string
  body: string
  published_at: string
  url: string
}

export const PLAN_LIMITS: Record<Plan, {
  projects: number
  generations: number // per month, -1 = unlimited
  teamMembers: number
  customDomain: boolean
  widget: boolean
  removeBranding: boolean
  apiAccess: boolean
  autoPublish: boolean
}> = {
  free: {
    projects: 1,
    generations: 10,
    teamMembers: 1,
    customDomain: false,
    widget: false,
    removeBranding: false,
    apiAccess: false,
    autoPublish: false,
  },
  starter: {
    projects: 3,
    generations: -1,
    teamMembers: 1,
    customDomain: true,
    widget: false,
    removeBranding: false,
    apiAccess: false,
    autoPublish: true,
  },
  pro: {
    projects: 10,
    generations: -1,
    teamMembers: 3,
    customDomain: true,
    widget: true,
    removeBranding: true,
    apiAccess: false,
    autoPublish: true,
  },
  team: {
    projects: -1,
    generations: -1,
    teamMembers: -1,
    customDomain: true,
    widget: true,
    removeBranding: true,
    apiAccess: true,
    autoPublish: true,
  },
}

export const PLAN_PRICES: Record<Exclude<Plan, 'free'>, { monthly: number; priceId: string }> = {
  starter: { monthly: 19, priceId: process.env.STRIPE_STARTER_PRICE_ID! },
  pro:     { monthly: 49, priceId: process.env.STRIPE_PRO_PRICE_ID! },
  team:    { monthly: 99, priceId: process.env.STRIPE_TEAM_PRICE_ID! },
}
