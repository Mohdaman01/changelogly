import { Resend } from 'resend'
import type { Changelog, Project, Workspace } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function sendChangelogNotification({
  subscribers,
  changelog,
  project,
  workspace,
}: {
  subscribers: string[]
  changelog: Changelog
  project: Project
  workspace: Workspace
}) {
  if (!subscribers.length) return

  const publicUrl = `${APP_URL}/changelog/${workspace.slug}/${project.slug}`
  const changelogUrl = `${publicUrl}/${changelog.id}`

  // Send in batches of 50
  const batches = chunk(subscribers, 50)
  for (const batch of batches) {
    await resend.emails.send({
      from: FROM,
      to: batch,
      subject: `${project.name}: ${changelog.title}`,
      html: buildChangelogEmail({ changelog, project, workspace, changelogUrl }),
    })
  }
}

export async function sendSubscriberConfirmation({
  email,
  token,
  project,
  workspace,
}: {
  email: string
  token: string
  project: Project
  workspace: Workspace
}) {
  const confirmUrl = `${APP_URL}/api/changelog/confirm-subscription?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Confirm your subscription to ${project.name} changelog`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 16px">Confirm your subscription</h2>
        <p>You asked to receive changelog updates for <strong>${project.name}</strong>.</p>
        <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">
          Confirm subscription
        </a>
        <p style="color:#888;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

function buildChangelogEmail({
  changelog,
  project,
  workspace,
  changelogUrl,
}: {
  changelog: Changelog
  project: Project
  workspace: Workspace
  changelogUrl: string
}): string {
  const brandColor = workspace.brand_color ?? '#6366f1'
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:${brandColor};padding:24px 32px">
      <p style="margin:0;color:#fff;font-size:13px;opacity:0.8">${project.name}</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:24px;font-weight:600">${changelog.title}</h1>
      ${changelog.version ? `<p style="margin:6px 0 0;color:#fff;opacity:0.7;font-size:13px">${changelog.version}</p>` : ''}
    </div>
    <div style="padding:32px;color:#374151;font-size:15px;line-height:1.7">
      <a href="${changelogUrl}" style="display:inline-block;padding:10px 20px;background:${brandColor};color:#fff;border-radius:8px;text-decoration:none;font-size:14px;margin-bottom:24px">
        View full changelog →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af">
      You're receiving this because you subscribed to ${project.name} changelog updates.
      <br>
      ${workspace.show_branding !== false ? `Powered by <a href="${APP_URL}" style="color:#6366f1">Changelogly</a>` : ''}
    </div>
  </div>
</body>
</html>`
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}
