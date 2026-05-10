/**
 * Groq Cloud AI provider — a completely free cloud alternative to Gemini.
 *
 * Uses Groq's OpenAI-compatible API (no local model installation needed).
 * Works perfectly on Vercel.
 *
 * Setup:
 *   1. Sign up at https://console.groq.com (no credit card required)
 *   2. Create a free API key at https://console.groq.com/keys
 *   3. Add GROQ_API_KEY to .env.local and Vercel environment variables
 *   4. Optionally set GROQ_MODEL (default: llama-3.3-70b-versatile)
 *
 * Free tier limits (as of 2025):
 *   - 30 requests/minute
 *   - 14,400 requests/day
 *   - 6,000 tokens/minute
 */

import type { GitHubCommit, ChangelogTone } from '@/types'

// ----- Config ----------------------------------------------------------------

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const GROQ_MODEL    = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

// ----- Tone instructions (mirrors lib/ai.ts) ---------------------------------

const TONE_INSTRUCTIONS: Record<ChangelogTone, string> = {
  technical: `Write for software engineers. Use precise technical language.
    Include function/API names where relevant. Group by: Breaking Changes,
    New Features, Bug Fixes, Performance, Chores. Be concise and factual.`,

  marketing: `Write for a marketing/product audience. Use exciting, benefit-focused
    language. Highlight user value, not implementation details. Group by:
    What's New, Improvements, Fixes. Make it feel like a product announcement.`,

  'user-friendly': `Write for end users. Plain English, no jargon. Focus on what
    changed from the user's perspective and why it matters to them. Group by:
    New Features, Improvements, Bug Fixes. Keep it brief and warm.`,
}

// ----- Core helper -----------------------------------------------------------

/**
 * Call Groq's OpenAI-compatible Chat Completions API.
 */
async function groqChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys')

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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

// ----- Public API (matches lib/ai.ts exports) --------------------------------

export async function generateChangelogGroq({
  commits,
  version,
  projectName,
  tone,
  previousContext,
}: {
  commits: GitHubCommit[]
  version?: string
  projectName: string
  tone: ChangelogTone
  previousContext?: string
}): Promise<{ title: string; content: string; tags: string[]; tokensUsed: number }> {
  const commitList = commits
    .filter((c) => {
      const msg = c.message.toLowerCase()
      if (msg.length < 8) return false
      if (msg.includes('wip') || msg.includes('chore:') || msg.includes('merge') || msg.includes('bump')) return false
      return true
    })
    .slice(0, 50)
    .map((c) => `- ${c.message}`)
    .join('\n')

  const systemPrompt = `You are a changelog writer for ${projectName}.
${TONE_INSTRUCTIONS[tone]}

CRITICAL RULES:
- Output ONLY valid Markdown.
- No introductory or concluding remarks.
- Follow this EXACT format:

[Title line, plain text]
Tags: ["tag1", "tag2"]

## [Emoji] [Group Name]
- [Content]

- Never mention internal tooling, CI, or dependency bumps in user-friendly/marketing tone.`

  const userPrompt = `Generate a changelog for ${projectName}${version ? ` ${version}` : ''}.

Commits:
${commitList}
${previousContext ? `\nPrevious changelog for context:\n${previousContext}` : ''}`

  const raw = await groqChat(systemPrompt, userPrompt)
  const lines = raw.trim().split('\n')

  const title = lines[0].replace(/^#+\s*/, '').trim() || `${projectName} ${version ?? 'Update'}`

  let tags: string[] = []
  if (lines.length > 1 && lines[1].toLowerCase().startsWith('tags:')) {
    try {
      const tagsStr = lines[1].substring(lines[1].indexOf('[')).trim()
      tags = JSON.parse(tagsStr)
    } catch {}
  }

  const contentStartIdx = lines.findIndex((l, i) => i > 1 && l.startsWith('##'))
  const content = contentStartIdx !== -1
    ? lines.slice(contentStartIdx).join('\n').trim()
    : lines.slice(2).join('\n').trim()

  return { title, content, tags, tokensUsed: 0 }
}

export async function improveChangelogEntryGroq(
  entry: string,
  instruction: string
): Promise<string> {
  const raw = await groqChat(
    'You are editing a changelog entry. Apply the user instruction and return ONLY the improved markdown. No commentary.',
    `Original:\n${entry}\n\nInstruction: ${instruction}`
  )
  return raw || entry
}
