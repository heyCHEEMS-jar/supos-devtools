import * as vscode from 'vscode'
import type { Runtime } from '../runtime'
import type { App, Component } from '../store'
import { readIfExists } from './file'
import { runWithProgress } from './progress'
import { request } from './request'

interface ComponentListResponse {
  folderInfoList: Component[]
}

interface UploadedResource {
  fullPath: string
  filePath: string
}

type CompTarget = Pick<App, 'appId'> & Pick<Component, 'folderName'>

export const getCompFile = async (ctx: Runtime, app: App, comp: Component) => {
  ctx.signal.throwIfAborted()
  const { store } = ctx
  const uri = store.getCompFile(app, comp)
  if (!uri) {
    if (store.curApp?.appId === app.appId && store.curComp?.folderName === comp.folderName) store.curComp = undefined
    ctx.warn(vscode.l10n.t('Please pull the programmable component first'))
    return
  }
  const content = await readIfExists(uri)
  ctx.signal.throwIfAborted()
  if (content) return uri

  await store.removeCompFile(app, comp)
  if (store.curApp?.appId === app.appId && store.curComp?.folderName === comp.folderName) store.curComp = undefined
  ctx.warn(vscode.l10n.t('Component file does not exist. Please pull it again'))
  return undefined
}

export const fetchComps = async (ctx: Runtime, app: App) => {
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL')
  const apiPath = config.get<string>('componentFolderAPIPath')
  const mgrPath = config.get<string>('programmableComponentMgrPath')
  const url = new URL(`${baseURL}${apiPath}`)
  url.searchParams.set('path', mgrPath ?? '')
  url.searchParams.set('appId', app.appId)
  const { folderInfoList }: ComponentListResponse = await runWithProgress(vscode.l10n.t('Fetching programmable components'), () =>
    request.get(ctx, url.href)
  )
  return folderInfoList.map(({ folderName, fullPath, path }) => ({ folderName, fullPath, path }))
}

const uploadCode = (ctx: Runtime, file: File, type: 'compiled' | 'source', target: CompTarget) => {
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL')
  const apiPath = config.get<string>('uploadResourceAPIPath')
  const mgrPath = config.get<string>('programmableComponentMgrPath')
  const codePath = config.get<string>(type === 'compiled' ? 'componentCompiledCodePath' : 'componentSourceCodePath')
  const form = new FormData()
  form.append('appId', target.appId)
  form.append('path', `${mgrPath}/${target.folderName}${codePath}`)
  form.append('file', file)
  return request(ctx, { url: `${baseURL}${apiPath}`, method: 'POST', body: form }) as Promise<UploadedResource>
}

// 上传编译后的代码
export const uploadCompiledCode = (ctx: Runtime, file: File, target: CompTarget) => uploadCode(ctx, file, 'compiled', target)

// 上传原代码
export const uploadSourceCode = (ctx: Runtime, file: File, target: CompTarget) => uploadCode(ctx, file, 'source', target)

// 拉取原代码
export const fetchSourceCode = (ctx: Runtime, target: CompTarget) => {
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL')
  const apiPath = config.get<string>('resourceAPIPath')
  const mgrPath = config.get<string>('programmableComponentMgrPath')
  const sourcePath = config.get<string>('componentSourceCodePath')
  const fileName = config.get<string>('componentCodeFileName')
  const appId = encodeURIComponent(target.appId)
  const folderName = encodeURIComponent(target.folderName)
  return request(ctx, {
    url: `${baseURL}${apiPath}/${appId}${mgrPath}/${folderName}${sourcePath}/${fileName}`,
    responseType: 'text'
  }) as Promise<string>
}
