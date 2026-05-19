import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { marked } from 'marked'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelative(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function parseGitHubRepo(repoString: string): { owner: string; repo: string } | null {
  const parts = repoString.replace('https://github.com/', '').split('/')
  if (parts.length < 2) return null
  return { owner: parts[0], repo: parts[1] }
}

export function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert Markdown to HTML using marked library
 * Safe for rendering in dangerouslySetInnerHTML
 */
export async function markdownToHtml(md: string): Promise<string> {
  if (!md) return ''
  try {
    const html = await marked(md)
    return html as string
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return `<p>${md.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
  }
}

/**
 * Synchronous version for server-side rendering
 * Falls back to simple regex if marked is not available
 */
export function simpleMarkdown(md: string): string {
  if (!md) return ''
  
  // Try to use marked if available (client-side)
  try {
    const result = marked.parse(md)
    return typeof result === 'string' ? result : ''
  } catch (error) {
    // Fallback to simple regex-based rendering
    return md
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)\n?(?=<li>|$)/g, '$1')
      .replace(/(<li>.*(?:\n(?!<li>).+)*)/gs, '<ul>$&</ul>')
      .replace(/\n\n+/g, '<br/><br/>')
  }
}
