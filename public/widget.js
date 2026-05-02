/**
 * Changelogly In-App Widget
 * ─────────────────────────
 * Include in your app:
 *   <script src="https://changelogly.com/widget.js" data-project="YOUR_PROJECT_ID"></script>
 *
 * Optional attributes:
 *   data-position="bottom-right"   (bottom-right | bottom-left | top-right | top-left)
 *   data-brand-color="#6366f1"
 *   data-label="What's new"
 */
;(function () {
  'use strict'

  const script = document.currentScript || document.querySelector('script[data-project]')
  if (!script) return

  const projectId = script.getAttribute('data-project')
  const position = script.getAttribute('data-position') || 'bottom-right'
  const brandColor = script.getAttribute('data-brand-color') || '#6366f1'
  const label = script.getAttribute('data-label') || "What's new"
  const API_BASE = script.src.replace('/widget.js', '')

  if (!projectId) {
    console.warn('[Changelogly] data-project attribute is required')
    return
  }

  const STORAGE_KEY = `changelogly_last_seen_${projectId}`

  // ─── Styles ─────────────────────────────────────────────────────
  const css = `
    #changelogly-btn {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 24px;' : 'top: 24px;'}
      ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px;
      background: ${brandColor};
      color: #fff;
      border: none;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 2px 12px ${brandColor}44;
      transition: transform 0.15s, opacity 0.15s;
    }
    #changelogly-btn:hover { transform: translateY(-1px); opacity: 0.92; }
    #changelogly-badge {
      background: #fff;
      color: ${brandColor};
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      padding: 1px 7px;
      min-width: 18px;
      text-align: center;
      display: none;
    }
    #changelogly-panel {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 72px;' : 'top: 72px;'}
      ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      width: 360px;
      max-height: 520px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      z-index: 9999;
      display: none;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
    }
    #changelogly-panel.open { display: flex; }
    .cl-panel-header {
      padding: 16px 18px;
      border-bottom: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .cl-panel-title { font-size: 14px; font-weight: 600; color: #111; }
    .cl-panel-close {
      background: none; border: none; cursor: pointer;
      font-size: 18px; color: #9ca3af; line-height: 1;
      padding: 2px 6px; border-radius: 6px;
    }
    .cl-panel-close:hover { background: #f3f4f6; }
    .cl-panel-body { overflow-y: auto; flex: 1; padding: 16px 18px; }
    .cl-entry { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6; }
    .cl-entry:last-child { border-bottom: none; margin-bottom: 0; }
    .cl-entry-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .cl-version { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: ${brandColor}18; color: ${brandColor}; }
    .cl-date { font-size: 11px; color: #9ca3af; }
    .cl-title { font-size: 14px; font-weight: 600; color: #111; margin-bottom: 4px; }
    .cl-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
    .cl-tag { font-size: 10px; padding: 2px 6px; border-radius: 999px; background: #f3f4f6; color: #6b7280; }
    .cl-panel-footer { padding: 10px 18px; border-top: 1px solid #f3f4f6; text-align: center; }
    .cl-panel-footer a { font-size: 12px; color: #9ca3af; text-decoration: none; }
    .cl-panel-footer a:hover { color: #6b7280; }
    .cl-loading { text-align: center; padding: 24px; color: #9ca3af; font-size: 13px; }
    .cl-new-dot { width: 7px; height: 7px; border-radius: 50%; background: ${brandColor}; display: inline-block; }
  `

  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  // ─── Button ─────────────────────────────────────────────────────
  const btn = document.createElement('button')
  btn.id = 'changelogly-btn'
  btn.innerHTML = `<span class="cl-new-dot" id="changelogly-dot" style="display:none"></span>${label}<span id="changelogly-badge"></span>`
  document.body.appendChild(btn)

  // ─── Panel ──────────────────────────────────────────────────────
  const panel = document.createElement('div')
  panel.id = 'changelogly-panel'
  panel.innerHTML = `
    <div class="cl-panel-header">
      <span class="cl-panel-title">${label}</span>
      <button class="cl-panel-close" id="changelogly-close">×</button>
    </div>
    <div class="cl-panel-body" id="changelogly-body">
      <div class="cl-loading">Loading…</div>
    </div>
    <div class="cl-panel-footer">
      <a href="${API_BASE}/changelog" target="_blank">View full changelog</a>
    </div>
  `
  document.body.appendChild(panel)

  // ─── State ──────────────────────────────────────────────────────
  let open = false
  let changelogs: any[] = []
  let loaded = false

  // ─── Load changelogs ────────────────────────────────────────────
  async function loadChangelogs() {
    if (loaded) return
    try {
      const res = await fetch(`${API_BASE}/api/changelog/widget?projectId=${projectId}`)
      const data = await res.json()
      changelogs = data.changelogs ?? []
      loaded = true
      renderChangelogs()
      checkUnread()
    } catch {
      document.getElementById('changelogly-body')!.innerHTML =
        '<div class="cl-loading">Failed to load.</div>'
    }
  }

  function renderChangelogs() {
    const body = document.getElementById('changelogly-body')!
    if (!changelogs.length) {
      body.innerHTML = '<div class="cl-loading">No updates yet.</div>'
      return
    }
    body.innerHTML = changelogs
      .map(
        (cl) => `
      <div class="cl-entry">
        <div class="cl-entry-meta">
          ${cl.version ? `<span class="cl-version">${cl.version}</span>` : ''}
          <span class="cl-date">${formatDate(cl.published_at)}</span>
        </div>
        <div class="cl-title">${cl.title}</div>
        ${cl.tags?.length ? `<div class="cl-tags">${cl.tags.map((t: string) => `<span class="cl-tag">${t}</span>`).join('')}</div>` : ''}
      </div>`
      )
      .join('')
  }

  function checkUnread() {
    const lastSeen = localStorage.getItem(STORAGE_KEY)
    if (!changelogs.length) return
    const latest = changelogs[0].published_at
    if (!lastSeen || latest > lastSeen) {
      const badge = document.getElementById('changelogly-badge')!
      const dot = document.getElementById('changelogly-dot')!
      badge.textContent = 'New'
      badge.style.display = 'inline-block'
      dot.style.display = 'inline-block'
    }
  }

  function markSeen() {
    if (changelogs.length) {
      localStorage.setItem(STORAGE_KEY, changelogs[0].published_at)
    }
    const badge = document.getElementById('changelogly-badge')!
    const dot = document.getElementById('changelogly-dot')!
    badge.style.display = 'none'
    dot.style.display = 'none'
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ─── Events ─────────────────────────────────────────────────────
  btn.addEventListener('click', () => {
    open = !open
    panel.classList.toggle('open', open)
    if (open) {
      loadChangelogs()
      markSeen()
    }
  })

  document.getElementById('changelogly-close')!.addEventListener('click', () => {
    open = false
    panel.classList.remove('open')
  })

  document.addEventListener('click', (e) => {
    if (open && !panel.contains(e.target as Node) && !btn.contains(e.target as Node)) {
      open = false
      panel.classList.remove('open')
    }
  })

  // Pre-check unread on load
  loadChangelogs()
})()
