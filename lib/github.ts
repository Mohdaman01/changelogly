import { Octokit } from 'octokit'
import type { GitHubCommit, GitHubRelease } from '@/types'

export function getOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken })
}

export function getGitHubOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    scope: 'repo read:user',
    state,
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error_description ?? data.error)
  return data.access_token
}

export async function getUserRepos(accessToken: string) {
  const octokit = getOctokit(accessToken)
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
    visibility: 'all',
  })
  return data.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    name: r.name,
    private: r.private,
    description: r.description,
    updated_at: r.updated_at,
  }))
}

export async function getCommitsBetween(
  accessToken: string,
  owner: string,
  repo: string,
  since?: string,
  until?: string,
  base?: string,
  head?: string
): Promise<GitHubCommit[]> {
  const octokit = getOctokit(accessToken)

  // If base+head given, use compare API (tag-to-tag)
  if (base && head) {
    const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${base}...${head}`,
      per_page: 100,
    })
    return data.commits.map(formatCommit)
  }

  // Otherwise fetch by date range
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since,
    until,
    per_page: 100,
  })
  return data.map(formatCommit)
}

function formatCommit(c: any): GitHubCommit {
  return {
    sha: c.sha,
    message: c.commit.message.split('\n')[0], // first line only
    author: c.commit.author?.name ?? 'Unknown',
    date: c.commit.author?.date ?? '',
    url: c.html_url,
  }
}

export async function getLatestRelease(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubRelease | null> {
  try {
    const octokit = getOctokit(accessToken)
    const { data } = await octokit.rest.repos.getLatestRelease({ owner, repo })
    return {
      tag: data.tag_name,
      name: data.name ?? data.tag_name,
      body: data.body ?? '',
      published_at: data.published_at ?? '',
      url: data.html_url,
    }
  } catch {
    return null
  }
}

export async function getTags(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string[]> {
  const octokit = getOctokit(accessToken)
  const { data } = await octokit.rest.repos.listTags({ owner, repo, per_page: 20 })
  return data.map((t) => t.name)
}

export async function createWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  secret: string
): Promise<number> {
  const octokit = getOctokit(accessToken)
  const { data } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
      content_type: 'json',
      secret,
    },
    events: ['release'],
    active: true,
  })
  return data.id
}
