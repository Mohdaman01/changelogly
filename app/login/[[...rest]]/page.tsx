import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-subtle)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg" style={{ background: 'var(--accent)' }}>C</div>
          <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>Welcome to Changelogly</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Sign in with GitHub to get started</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'w-full rounded-2xl border shadow-none',
              socialButtonsBlockButton: 'border rounded-xl',
            },
          }}
        />
      </div>
    </div>
  )
}
