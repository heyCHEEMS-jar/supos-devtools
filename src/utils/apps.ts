import * as vscode from 'vscode'
import type { Runtime } from '../runtime'
import type { App } from '../store'
import { request } from './request'

export const loadApps = async (ctx: Runtime, { autoLogin = true }: { autoLogin?: boolean } = {}) => {
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL')
  const apiPath = config.get<string>('applicationMgrAPIPath')
  const { list }: { list: App[] } = await request(ctx, { url: `${baseURL}${apiPath}`, autoLogin })
  return list.map(({ appId, name }) => ({ appId, name }))
}
