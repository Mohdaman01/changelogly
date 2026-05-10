/**
 * Groq Cloud API test script
 *
 * Run with: node test_groq.js
 *
 * Groq is a free cloud API — no credit card required.
 * Get a free key at: https://console.groq.com/keys
 */

const fs = require('fs')

// Load .env.local manually (no external dependencies needed)
try {
  const env = fs.readFileSync('.env.local', 'utf-8')
  for (const line of env.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  // .env.local not found — fall back to shell env
}

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL   = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GROQ_BASE    = 'https://api.groq.com/openai/v1'

// ----- Validation ------------------------------------------------------------

if (!GROQ_API_KEY) {
  console.error('\n❌ GROQ_API_KEY is not set.')
  console.error('   1. Sign up (free) at https://console.groq.com')
  console.error('   2. Create a key at https://console.groq.com/keys')
  console.error('   3. Add it to your .env.local:\n')
  console.error('      GROQ_API_KEY=gsk_your_key_here\n')
  process.exit(1)
}

// ----- Helper ----------------------------------------------------------------

async function groqChat(systemPrompt, userPrompt) {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq API error [${res.status}]: ${text}`)
  }

  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

// ----- Test ------------------------------------------------------------------

async function main() {
  console.log(`\n✅ Using Groq Cloud API (FREE tier)`)
  console.log(`📦 Model: ${GROQ_MODEL}`)
  console.log(`🌐 Endpoint: ${GROQ_BASE}/chat/completions\n`)

  const systemPrompt = `You are a changelog writer for MyTestApp.
Write for software engineers. Group by: Breaking Changes, New Features, Bug Fixes.

CRITICAL RULES:
- Output ONLY valid Markdown.
- No introductory or concluding remarks.
- Follow this EXACT format:

[Title line, plain text]
Tags: ["tag1", "tag2"]

## [Emoji] [Group Name]
- [Content]`

  const userPrompt = `Generate a changelog for MyTestApp v2.0.0.

Commits:
- Migrated payment gateway from Stripe to Razorpay
- Migrated AI provider from OpenAI to Gemini
- Upgraded Gemini model from 1.5-flash to 2.5-flash
- Fixed authentication redirect loop on dashboard
- Added Groq cloud support for AI generation`

  console.log('📝 Generating changelog...\n')
  const start = Date.now()

  try {
    const raw = await groqChat(systemPrompt, userPrompt)
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    // Parse output
    const lines = raw.trim().split('\n')
    const title = lines[0].replace(/^#+\s*/, '').trim() || 'MyTestApp v2.0.0'
    let tags = []
    if (lines.length > 1 && lines[1].toLowerCase().startsWith('tags:')) {
      try { tags = JSON.parse(lines[1].substring(lines[1].indexOf('[')).trim()) } catch {}
    }
    const contentStartIdx = lines.findIndex((l, i) => i > 1 && l.startsWith('##'))
    const content = contentStartIdx !== -1
      ? lines.slice(contentStartIdx).join('\n').trim()
      : lines.slice(2).join('\n').trim()

    console.log(`⏱  Generated in ${elapsed}s`)
    console.log('─'.repeat(60))
    console.log('📌 TITLE:', title)
    console.log('🏷  TAGS:', tags)
    console.log('\n📄 CONTENT:\n')
    console.log(content)
    console.log('─'.repeat(60))
    console.log('\n✅ Groq Cloud API is working!\n')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

main()
