import * as vscode from 'vscode'
import { chromium, type Browser } from 'playwright-core'
import { statusBar } from '../constants/ui'
import type { Runtime } from '../runtime'

export const login = async (ctx: Runtime) => {
  ctx.signal.throwIfAborted()
  const config = vscode.workspace.getConfiguration()
  let baseURL = config.get<string>('baseURL', '').trim().replace(/\/+$/, '')
  const pagePath = config.get<string>('loginPagePath', '/login').trim()
  const apiPath = config.get<string>('loginAPIPath', '/').trim()
  if (!baseURL) {
    baseURL =
      (await vscode.window.showInputBox(
        {
          ignoreFocusOut: true,
          placeHolder: vscode.l10n.t(vscode.l10n.t('Please configure {0} first', 'baseURL'))
        },
        ctx.token
      )) || ''
  }
  ctx.signal.throwIfAborted()

  if (baseURL) {
    await config.update('baseURL', baseURL)
  } else {
    throw new Error(vscode.l10n.t('Please configure {0} first', 'baseURL'))
  }
  ctx.signal.throwIfAborted()

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: `${statusBar.prefix}: ${vscode.l10n.t('Complete login in the opened browser')}`,
      cancellable: true
    },
    async (_progress, token) => {
      let browser: Browser | undefined
      const close = () => void browser?.close().catch(() => {})
      ctx.signal.addEventListener('abort', close, { once: true })
      const cancellation = vscode.Disposable.from(token.onCancellationRequested(close), ctx.token.onCancellationRequested(close))
      try {
        if (token.isCancellationRequested) throw new vscode.CancellationError()
        ctx.signal.throwIfAborted()
        browser = await chromium
          .launch({ channel: 'chrome', headless: false })
          .catch(() => {
            ctx.signal.throwIfAborted()
            return chromium.launch({ channel: 'msedge', headless: false })
          })
          .catch((e) => {
            ctx.signal.throwIfAborted()
            throw new Error(vscode.l10n.t('Could not start Chrome or Edge: {0}', e instanceof Error ? e.message : String(e)))
          })
        if (token.isCancellationRequested) throw new vscode.CancellationError()
        ctx.signal.throwIfAborted()

        const page = await browser.newPage({ ignoreHTTPSErrors: true })
        const responsePromise = page.waitForResponse(
          async (res) => {
            if (res.request().method() !== 'POST' || !new URL(res.url()).pathname.endsWith(apiPath) || !res.ok()) return false
            const result: { ticket?: unknown } | null = await res.json().catch(() => null)
            return typeof result?.ticket === 'string' && !!result.ticket.trim()
          },
          { timeout: 0 }
        )

        const [res] = await Promise.all([responsePromise, page.goto(`${baseURL}${pagePath}`)])
        const { ticket } = (await res.json()) as { ticket: string }
        if (token.isCancellationRequested) throw new vscode.CancellationError()
        ctx.signal.throwIfAborted()
        await ctx.secrets.store('ticket', ticket)
        return ticket
      } catch (e) {
        if (ctx.signal.aborted || token.isCancellationRequested || (browser && !browser.isConnected())) throw new vscode.CancellationError()
        throw e
      } finally {
        cancellation.dispose()
        ctx.signal.removeEventListener('abort', close)
        await browser?.close().catch(() => {})
      }
    }
  )
}
