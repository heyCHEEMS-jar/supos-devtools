import * as vscode from 'vscode'
import { isAbsolutePath } from './utils/file'

export interface App {
  appId: string
  name: string
}

export interface Component {
  folderName: string
  fullPath: string
  path: string
}

const compFilesKey = 'componentFiles'
const getCompFiles = () => vscode.workspace.getConfiguration().inspect<Record<string, string>>(compFilesKey)?.workspaceValue ?? {}
const toUri = (value: string) => (isAbsolutePath(value) ? vscode.Uri.file(value) : vscode.Uri.parse(value))

const saveCompFiles = async (files: Record<string, string>, signal?: AbortSignal) => {
  signal?.throwIfAborted()
  await vscode.workspace.getConfiguration().update(compFilesKey, files, vscode.ConfigurationTarget.Workspace)
  signal?.throwIfAborted()
}

const createStore = (signal?: AbortSignal) => ({
  curApp: undefined as App | undefined,
  curComp: undefined as Component | undefined,
  // 获取组件的 uri，持久化存储，{ "{appId}:{folderName}": "absolutePath" }
  getCompFile(app: App, comp: Component) {
    const value = getCompFiles()[`${app.appId}:${comp.folderName}`]
    return value ? toUri(value) : undefined
  },
  getCompByFile(uri: vscode.Uri) {
    for (const [key, value] of Object.entries(getCompFiles())) {
      const index = key.indexOf(':')
      if (index <= 0 || index === key.length - 1 || toUri(value).toString() !== uri.toString()) continue
      return { appId: key.slice(0, index), folderName: key.slice(index + 1) }
    }
    return undefined
  },
  // 迁移旧工作区状态中的绑定，保留配置中已有的映射
  async restoreCompFiles(ctx: Pick<vscode.ExtensionContext, 'workspaceState'>) {
    signal?.throwIfAborted()
    const saved = ctx.workspaceState.get<Record<string, string>>(compFilesKey)
    if (!saved) return
    await saveCompFiles({ ...saved, ...getCompFiles() }, signal)
    await ctx.workspaceState.update(compFilesKey, undefined)
  },
  async bindCompFile(app: App, comp: Component, uri: vscode.Uri) {
    await saveCompFiles({ ...getCompFiles(), [`${app.appId}:${comp.folderName}`]: uri.fsPath }, signal)
  },
  async removeCompFile(app: App, comp: Component) {
    const files = { ...getCompFiles() }
    delete files[`${app.appId}:${comp.folderName}`]
    await saveCompFiles(files, signal)
  }
})

export let store = createStore()
export const resetStore = (signal?: AbortSignal) => (store = createStore(signal))
