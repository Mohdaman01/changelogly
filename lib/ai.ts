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
    .slice(0, 100) // cap at 100 commits
    .map((c) => `- [${c.sha.slice(0, 7)}] ${c.message} (${c.author})`)
    .join('\n')

  const systemInstruction = `You are a changelog writer for ${projectName}. 
${TONE_INSTRUCTIONS[tone]}

Rules:
- Output ONLY valid Markdown
- Start with a short title line (no #, just plain text) on the FIRST line
- Then a blank line
- Then the full changelog body using ## headings for groups
- Add relevant emoji to section headers (e.g. ## ✨ New Features)
- End with a JSON block on the last line: {"tags":["tag1","tag2"]} — max 5 tags
- If a commit message is meaningless (e.g. "fix", "wip", "update"), skip it
- Never mention internal tooling, CI, or dependency bumps in user-friendly/marketing tone`

  const userPrompt = `Generate a changelog for ${projectName}${version ? ` ${version}` : ''}.

Commits:
${commitList}
${previousContext ? `\nPrevious changelog for context:\n${previousContext}` : ''}`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
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

  // Extract tags JSON from last line
  let tags: string[] = []
  const lastLine = lines[lines.length - 1]
  if (lastLine.startsWith('{')) {
    try {
      const parsed = JSON.parse(lastLine)
      tags = parsed.tags ?? []
      lines.pop()
    } catch {}
  }

  // Content is everything after first line
  const content = lines.slice(2).join('\n').trim()

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
    model: 'gemini-2.5-flash',
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
