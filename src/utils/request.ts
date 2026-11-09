import * as vscode from 'vscode'
import type { Runtime } from '../runtime'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  timeout?: number
  headers?: Headers
  body?: any
  autoLogin?: boolean
  responseType?: 'json' | 'text'
}

export class TicketExpiredError extends Error {}

export const request = async (ctx: Runtime, options: RequestOptions) => {
  const { url, method = 'GET', timeout = 15000, body = null, autoLogin = true, responseType = 'json' } = options
  const { signal } = ctx
  signal.throwIfAborted()
  const headers = new Headers(options.headers)
  const json = body !== null && (Object.getPrototypeOf(body) === Object.prototype || Array.isArray(body)) // 排除 Date/RegExp 等
  if (json && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const send = (ticket: string) => {
    headers.set('Authorization', `Bearer ${ticket}`)
    return fetch(url, {
      method,
      headers,
      body: json ? JSON.stringify(body) : body,
      signal: timeout > 0 ? AbortSignal.any([signal, AbortSignal.timeout(timeout)]) : signal
    })
  }

  let ticket = await ctx.secrets.get('ticket')
  const hadTicket = !!ticket
  if (!ticket) {
    if (!autoLogin) throw new TicketExpiredError()
    const { login } = await import('./login.js')
    ticket = await login(ctx)
  }

  let res = await send(ticket)
  if (res.status === 401) {
    await ctx.secrets.delete('ticket')
    if (!autoLogin) throw new TicketExpiredError()
    if (hadTicket) {
      const { login } = await import('./login.js')
      ticket = await login(ctx)
      res = await send(ticket)
      if (res.status === 401) await ctx.secrets.delete('ticket')
    }
  }

  if (!res.ok) throw new Error(vscode.l10n.t('Request failed: HTTP {0}', res.status))
  return responseType === 'text' ? res.text() : res.json()
}

request.get = (ctx: Runtime, url: string, timeout?: number) => request(ctx, { url, method: 'GET', timeout })
request.post = (ctx: Runtime, url: string, timeout?: number) => request(ctx, { url, method: 'POST', timeout })
request.put = (ctx: Runtime, url: string, timeout?: number) => request(ctx, { url, method: 'PUT', timeout })
request.delete = (ctx: Runtime, url: string, timeout?: number) => request(ctx, { url, method: 'DELETE', timeout })
