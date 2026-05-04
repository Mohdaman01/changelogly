import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GitHubCommit, ChangelogTone } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

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

export async function generateChangelog({
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
      // Skip meaningless 1-word commits or common internal chores
      if (msg.length < 8) return false
      if (msg.includes('wip') || msg.includes('chore:') || msg.includes('merge') || msg.includes('bump')) return false
      return true
    })
    .slice(0, 50) // cap at 50 most meaningful commits to save input tokens
    .map((c) => `- ${c.message}`) // Removed hash/author to save tokens
    .join('\n')

  const systemInstruction = `You are a changelog writer for ${projectName}. 
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

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction,
  })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.4,
    },
  })

  const raw = result.response.text()
  const lines = raw.trim().split('\n')

  // Extract title (first line)
  const title = lines[0].replace(/^#+\s*/, '').trim() || `${projectName} ${version ?? 'Update'}`

  // Extract tags (second line)
  let tags: string[] = []
  if (lines.length > 1 && lines[1].toLowerCase().startsWith('tags:')) {
    try {
      const tagsStr = lines[1].substring(lines[1].indexOf('[')).trim()
      tags = JSON.parse(tagsStr)
    } catch {}
  }

  // Content is everything from the first ## heading onwards
  const contentStartIdx = lines.findIndex((l, i) => i > 1 && l.startsWith('##'))
  const content = contentStartIdx !== -1 
    ? lines.slice(contentStartIdx).join('\n').trim() 
    : lines.slice(2).join('\n').trim()

  return {
    title,
    content,
    tags,
    tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0,
  }
}

export async function improveChangelogEntry(
  entry: string,
  instruction: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction:
      'You are editing a changelog entry. Apply the user instruction and return ONLY the improved markdown. No commentary.',
  })

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: `Original:\n${entry}\n\nInstruction: ${instruction}` }],
      },
    ],
    generationConfig: { maxOutputTokens: 4096 },
  })

  return result.response.text() ?? entry
}
