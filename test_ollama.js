/**
 * Ollama Cloud API test script
 *
 * Run with: node test_ollama.js
 *
 * No local installation needed! Uses the Ollama Cloud API.
 * Get your key at: https://ollama.com/settings/keys
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

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL || 'llama3.2'
const OLLAMA_BASE    = 'https://ollama.com/api'

// ----- Validation ------------------------------------------------------------

if (!OLLAMA_API_KEY) {
  console.error('\n❌ OLLAMA_API_KEY is not set.')
  console.error('   1. Sign up at https://ollama.com')
  console.error('   2. Generate a key at https://ollama.com/settings/keys')
  console.error('   3. Add it to your .env.local:\n')
  console.error('      OLLAMA_API_KEY=your_key_here\n')
  process.exit(1)
}

// ----- Helper ----------------------------------------------------------------

async function ollamaCloudChat(systemPrompt, userPrompt) {
  const res = await fetch(`${OLLAMA_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      options: { temperature: 0.4 },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama Cloud API error [${res.status}]: ${text}`)
  }

  const json = await res.json()
  return json.message?.content ?? ''
}

// ----- Test ------------------------------------------------------------------

async function main() {
  console.log(`\n🔑 Using Ollama Cloud API`)
  console.log(`📦 Model: ${OLLAMA_MODEL}`)
  console.log(`🌐 Endpoint: ${OLLAMA_BASE}/chat\n`)

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
- Added Ollama cloud support for AI generation`

  console.log('📝 Generating changelog...\n')
  const start = Date.now()

  try {
    const raw = await ollamaCloudChat(systemPrompt, userPrompt)
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
    console.log('\n✅ Ollama Cloud API is working!\n')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

main()
