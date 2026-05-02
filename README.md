# Changelogly

Auto-generate beautiful changelogs from your GitHub commits using AI. Publish to a branded public page, embed an in-app widget, and notify email subscribers automatically.

## ✦ Features

- **AI changelog generation** — GPT-4o-mini transforms raw commits into readable release notes
- **GitHub integration** — OAuth connect, commit fetching, tag-to-tag ranges
- **Branded public page** — `yourapp.changelogly.com` or custom domain
- **Email subscribers** — subscribe form + confirmation email + auto-notify on publish
- **In-app widget** — embeddable "What's new" popup (Pro+)
- **Auto-publish** — GitHub release webhook triggers generation + publish (Starter+)
- **Stripe billing** — Free / Starter ($19) / Pro ($49) / Team ($99)

## ✦ Tech stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk (GitHub OAuth) |
| Database | Supabase (Postgres + RLS) |
| AI | OpenAI gpt-4o-mini |
| Payments | Stripe Subscriptions |
| Email | Resend |
| Deploy | Vercel |

## ✦ Setup guide

### 1. Clone and install

```bash
git clone <your-repo>
cd changelogly
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values — see `.env.local.example` for instructions.

### 3. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste contents of `supabase-schema.sql` → Run
3. Copy your project URL and keys to `.env.local`

### 4. Clerk

1. Create app at [clerk.com](https://clerk.com)
2. Enable **GitHub** social login
3. Copy publishable key + secret key to `.env.local`
4. Set redirect URLs:
   - Sign-in: `http://localhost:3000/login`
   - After sign-in: `http://localhost:3000/dashboard`
   - After sign-up: `http://localhost:3000/onboarding`

### 5. GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. New OAuth App:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/github/callback`
3. Copy Client ID + Secret to `.env.local`

### 6. OpenAI

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local`

### 7. Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Create 3 products in Stripe dashboard:
   - Starter — $19/month recurring
   - Pro — $49/month recurring
   - Team — $99/month recurring
3. Copy each Price ID to `.env.local`
4. Set up webhook:
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Copy webhook secret to `.env.local`

For local testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 8. Resend (Email)

1. Create account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create API key → add to `.env.local`

### 9. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 10. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add all environment variables in Vercel dashboard → Settings → Environment Variables.

## ✦ Project structure

```
changelogly/
├── app/
│   ├── api/
│   │   ├── auth/github/          # GitHub OAuth flow
│   │   ├── changelog/            # Generate, publish, subscribe, widget
│   │   ├── github/repos/         # Repo + tag fetching
│   │   ├── projects/             # Project CRUD
│   │   ├── stripe/               # Checkout + billing portal
│   │   ├── webhooks/             # Stripe + GitHub webhooks
│   │   └── workspace/            # Workspace CRUD
│   ├── changelog/[workspace]/    # Public changelog pages
│   ├── dashboard/                # App dashboard
│   │   ├── changelogs/           # Changelog editor
│   │   ├── projects/             # Project management
│   │   └── settings/             # Workspace + billing settings
│   ├── login/                    # Clerk sign-in
│   └── onboarding/               # New user setup
├── lib/
│   ├── ai.ts                     # OpenAI changelog generation
│   ├── github.ts                 # GitHub API (Octokit)
│   ├── email.ts                  # Resend email service
│   ├── stripe.ts                 # Stripe helpers
│   ├── supabase.ts               # Supabase clients
│   └── utils.ts                  # Shared utilities
├── types/
│   └── index.ts                  # TypeScript types + plan limits
├── public/
│   └── widget.js                 # Embeddable in-app changelog widget
├── supabase-schema.sql           # Database schema (run in Supabase)
├── middleware.ts                 # Clerk auth middleware
└── .env.local.example            # All required env vars
```

## ✦ Key flows

### User generates a changelog
1. Dashboard → Project → Generate
2. Picks tag range + tone
3. POST `/api/changelog/generate` → fetches GitHub commits → calls OpenAI → saves as draft
4. User edits in markdown editor
5. Clicks Publish → POST `/api/changelog/[id]/publish` → emails subscribers

### Auto-publish on GitHub release
1. User creates GitHub Release (tag push)
2. GitHub fires webhook to `/api/webhooks/github`
3. Changelogly fetches commits between last and new tag
4. AI generates changelog → auto-publishes → emails subscribers

### In-app widget
1. User includes `<script src="changelogly.com/widget.js" data-project="ID">` in their app
2. Widget fetches changelogs from `/api/changelog/widget?projectId=ID`
3. Shows a floating button with unread badge
4. Click opens panel with latest entries

## ✦ Monetization summary

| Plan | Price | Projects | Generations | Key feature |
|------|-------|----------|-------------|-------------|
| Free | $0 | 1 | 10/mo | Public page |
| Starter | $19/mo | 3 | Unlimited | Auto-publish, custom domain |
| Pro | $49/mo | 10 | Unlimited | Widget, remove branding |
| Team | $99/mo | Unlimited | Unlimited | API, unlimited team |

**AI cost per generation:** ~$0.002 (gpt-4o-mini at 1,500 tokens)
**Gross margin at $49/mo Pro:** ~97%

## ✦ Launch checklist

- [ ] Deploy to Vercel
- [ ] Set up custom domain
- [ ] Configure Stripe webhook with production URL
- [ ] Add GitHub OAuth production callback URL
- [ ] Test end-to-end: sign up → create project → generate → publish → receive email
- [ ] Post on X/Twitter #buildinpublic
- [ ] Submit to Product Hunt
- [ ] Post Show HN
