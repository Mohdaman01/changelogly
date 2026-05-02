# Changelogly

Auto-generate beautiful changelogs from your GitHub commits using AI. Publish to a branded public page, embed an in-app widget, and notify email subscribers automatically.

## ✦ Features

- **AI changelog generation** — GPT-4o-mini transforms raw commits into readable release notes
- **GitHub integration** — OAuth connect, commit fetching, tag-to-tag ranges
- **Branded public page** — `yourapp.changelogly.com` or custom domain
- **Email subscribers** — subscribe form + confirmation email + auto-notify on publish
- **In-app widget** — embeddable "What's new" popup (Pro+)
- **Auto-publish** — GitHub release webhook triggers generation + publish (Starter+)
- **Razorpay billing** — Free / Starter (₹19) / Pro (₹49) / Team (₹99)

## ✦ Tech stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk (GitHub OAuth) |
| Database | Supabase (Postgres + RLS) |
| AI | Google Gemini 1.5 Flash |
| Payments | Razorpay Subscriptions |
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

### 6. Google Gemini

1. Get API key from [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Add `GEMINI_API_KEY` to `.env.local`

### 7. Razorpay

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to **Subscriptions → Plans** and create 3 plans:
   - Starter — ₹19/month recurring
   - Pro — ₹49/month recurring
   - Team — ₹99/month recurring
3. Copy each Plan ID (`plan_xxxx`) to `.env.local`
4. Go to **Settings → API Keys** → generate key pair → copy to `.env.local`
5. Set up webhook:
   - Go to **Settings → Webhooks → Add New Webhook**
   - Endpoint: `https://yourdomain.com/api/webhooks/razorpay`
   - Events: `subscription.charged`, `subscription.cancelled`, `subscription.halted`, `payment.failed`
   - Copy the **webhook secret** to `RAZORPAY_WEBHOOK_SECRET` in `.env.local`

For local testing, use the [Razorpay webhook simulator](https://dashboard.razorpay.com/app/webhooks) or expose localhost via:
```bash
npx localtunnel --port 3000
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
│   │   ├── razorpay/             # Checkout + subscription portal
│   │   ├── webhooks/             # Razorpay + GitHub webhooks
│   │   └── workspace/            # Workspace CRUD
│   ├── changelog/[workspace]/    # Public changelog pages
│   ├── dashboard/                # App dashboard
│   │   ├── changelogs/           # Changelog editor
│   │   ├── projects/             # Project management
│   │   └── settings/             # Workspace + billing settings
│   ├── login/                    # Clerk sign-in
│   └── onboarding/               # New user setup
├── lib/
│   ├── ai.ts                     # Gemini changelog generation
│   ├── github.ts                 # GitHub API (Octokit)
│   ├── email.ts                  # Resend email service
│   ├── razorpay.ts               # Razorpay helpers
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
3. POST `/api/changelog/generate` → fetches GitHub commits → calls Gemini → saves as draft
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

**AI cost per generation:** ~$0.00007 (Gemini 1.5 Flash at 1,500 tokens)
**Gross margin at ₹49/mo Pro:** ~99%

## ✦ Launch checklist

- [ ] Deploy to Vercel
- [ ] Set up custom domain
- [ ] Configure Razorpay webhook with production URL
- [ ] Add GitHub OAuth production callback URL
- [ ] Test end-to-end: sign up → create project → generate → publish → receive email
- [ ] Post on X/Twitter #buildinpublic
- [ ] Submit to Product Hunt
- [ ] Post Show HN

##Test Log Generation

http://localhost:3000/dashboard
