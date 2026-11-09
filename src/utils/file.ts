import * as path from 'node:path'
import * as vscode from 'vscode'
import { statusBar } from '../constants/ui'

// 使用 windows 路径或 UNC 额外校验绝对路径，阻止 windows 上使用“/”开头的路径，必须使用盘符开头的绝对路径
export const isAbsolutePath = (value: string) => path.isAbsolute(value) && (process.platform !== 'win32' || /^[a-zA-Z]:[\\/]|^\\\\/.test(value))

export const readIfExists = async (uri: vscode.Uri) => {
  try {
    return await vscode.workspace.fs.readFile(uri)
  } catch {
    return undefined
  }
}

export const writeFile = async (uri: vscode.Uri, content: Uint8Array, signal?: AbortSignal) => {
  signal?.throwIfAborted()
  await vscode.workspace.fs.writeFile(uri, content)
  signal?.throwIfAborted()
}

export const showFile = async (uri: vscode.Uri, signal?: AbortSignal) => {
  signal?.throwIfAborted()
  const document = await vscode.workspace.openTextDocument(uri)
  signal?.throwIfAborted()
  await vscode.window.showTextDocument(document)
  signal?.throwIfAborted()
  return document
}

export const equalFile = (a: Uint8Array | undefined, b: Uint8Array) => !!a && a.length === b.length && a.every((v, i) => v === b[i])

export const writeIfChanged = async (dir: vscode.Uri, fileName: string, content: Uint8Array, signal?: AbortSignal) => {
  const to = vscode.Uri.joinPath(dir, fileName)
  const previous = await readIfExists(to)
  signal?.throwIfAborted()
  if (equalFile(previous, content)) return false
  await vscode.workspace.fs.createDirectory(dir)
  await writeFile(to, content, signal)
  return true
}

export const backupCompFile = async (uri: vscode.Uri, code: string, signal?: AbortSignal) => {
  signal?.throwIfAborted()
  const { name, ext } = path.parse(uri.fsPath)
  const saved = vscode.workspace.getConfiguration().get<string>('componentCodeBackupPath')?.trim()
  const dir = saved ? vscode.Uri.file(saved) : vscode.Uri.joinPath(uri, '..')
  const invalidPath = () => new Error(vscode.l10n.t('Component code backup path is invalid or does not exist: {0}', dir.fsPath))
  if (saved && !isAbsolutePath(saved)) throw invalidPath()

  let stat: vscode.FileStat
  try {
    stat = await vscode.workspace.fs.stat(dir)
  } catch {
    signal?.throwIfAborted()
    throw invalidPath()
  }
  signal?.throwIfAborted()

  // 非普通目录或符号链接指向的目录则抛错
  if (!(stat.type & vscode.FileType.Directory)) throw invalidPath()

  const backup = vscode.Uri.joinPath(dir, `${name}.backup${ext}`)
  await writeFile(backup, new TextEncoder().encode(code), signal)
  return backup
}

export const foldersOrWarn = () => {
  const folders = vscode.workspace.workspaceFolders ?? []
  if (!folders.length) vscode.window.setStatusBarMessage(`$(warning) ${statusBar.prefix}: ${vscode.l10n.t('Please open a folder first')}`, statusBar.timeout)
  return folders
}

export const pickSaveFolder = async (key: string, token?: vscode.CancellationToken) => {
  if (token?.isCancellationRequested) throw new vscode.CancellationError()
  const folders = foldersOrWarn()
  if (!folders.length) return

  const config = vscode.workspace.getConfiguration()
  const saved = config.inspect<string>(key)?.workspaceValue
  const absolute = saved && isAbsolutePath(saved)
  if (absolute) return vscode.Uri.file(saved)

  const custom = vscode.l10n.t('Custom location')
  const items: { label: string; description?: string; folder?: vscode.Uri; remember: boolean }[] = folders.flatMap((folder) => [
    { label: folder.name, description: folder.uri.fsPath, folder: folder.uri, remember: false },
    { label: vscode.l10n.t('{0} (Remember this option)', folder.name), description: folder.uri.fsPath, folder: folder.uri, remember: true }
  ])
  items.push({ label: custom, remember: false }, { label: vscode.l10n.t('{0} (Remember this option)', custom), remember: true })

  const selected = await vscode.window.showQuickPick(items, { placeHolder: vscode.l10n.t('Select workspace for component file') }, token)
  if (!selected) return

  const folder = selected.folder ?? (await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false }))?.[0]
  if (token?.isCancellationRequested) throw new vscode.CancellationError()
  if (folder && selected.remember) await config.update(key, folder.fsPath, vscode.ConfigurationTarget.Workspace)
  return folder
}
