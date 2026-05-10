/**
 * Ollama Cloud AI provider — a separate implementation from lib/ai.ts.
 *
 * Uses the official Ollama Cloud API (https://ollama.com/api).
 * No local installation needed — works on Vercel and any cloud platform.
 *
 * Setup:
 *   1. Sign up at https://ollama.com
 *   2. Create an API key at https://ollama.com/settings/keys
 *   3. Add OLLAMA_API_KEY to .env.local (and Vercel environment variables)
 *   4. Optionally set OLLAMA_MODEL (default: llama3.2)
 */

import type { GitHubCommit, ChangelogTone } from '@/types'

// ----- Config ----------------------------------------------------------------

const OLLAMA_BASE_URL = 'https://ollama.com/api'
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL ?? 'llama3.2'

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
 * Send a chat request to the Ollama Cloud API.
 * Authenticates via the OLLAMA_API_KEY env variable.
 */
async function ollamaCloudChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OLLAMA_API_KEY
  if (!apiKey) throw new Error('OLLAMA_API_KEY is not set. Get a key at https://ollama.com/settings/keys')

  const res = await fetch(`${OLLAMA_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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

// ----- Public API (matches lib/ai.ts exports) --------------------------------

export async function generateChangelogOllama({
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
  // Pre-filter meaningless commits before sending to the model
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

  const raw = await ollamaCloudChat(systemPrompt, userPrompt)
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

export async function improveChangelogEntryOllama(
  entry: string,
  instruction: string
): Promise<string> {
  const systemPrompt =
    'You are editing a changelog entry. Apply the user instruction and return ONLY the improved markdown. No commentary.'

  const raw = await ollamaCloudChat(
    systemPrompt,
    `Original:\n${entry}\n\nInstruction: ${instruction}`
  )
  return raw || entry
}
