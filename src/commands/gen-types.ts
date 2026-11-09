import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { filePaths } from '../constants/file-paths'
import type { Runtime } from '../runtime'
import { foldersOrWarn, writeIfChanged } from '../utils/file'

// supos.d.ts 类型文件写到 node_modules/@types/supos 下
export const generateTypes = async (ctx: Runtime, folder: vscode.WorkspaceFolder) => {
  ctx.signal.throwIfAborted()
  const from = vscode.Uri.joinPath(ctx.extensionUri, filePaths.TYPES_SOURCE)
  const dir = vscode.Uri.joinPath(folder.uri, filePaths.TYPES_DIR)
  return writeIfChanged(dir, filePaths.TYPES_ENTRY, await vscode.workspace.fs.readFile(from), ctx.signal)
}

export const generateAll = async (ctx: Runtime, folders: readonly vscode.WorkspaceFolder[]) => {
  try {
    let wrote = false
    for (const folder of folders) if (await generateTypes(ctx, folder)) wrote = true
    return wrote
  } catch (e) {
    if (ctx.signal.aborted) return null
    const path = `${filePaths.TYPES_DIR}/${filePaths.TYPES_ENTRY}`
    const message = e instanceof Error ? e.message : String(e)
    ctx.error(vscode.l10n.t('Failed to write {0}: {1}', path, message))
    return null
  }
}

export const restartTsServer = async (ctx: Runtime) => {
  ctx.signal.throwIfAborted()
  await vscode.commands.executeCommand('typescript.restartTsServer')
  ctx.signal.throwIfAborted()
}

// 生成 .d.ts
export const registerGenerateTypes = (ctx: Runtime) =>
  vscode.commands.registerCommand(commands.GENERATE_TYPES, async () => {
    const folders = foldersOrWarn()
    if (!folders.length) return
    const wrote = await generateAll(ctx, folders)
    if (wrote === null) return
    if (wrote) await restartTsServer(ctx)
    const message = wrote ? vscode.l10n.t('Wrote {0}', `${filePaths.TYPES_DIR}/${filePaths.TYPES_ENTRY}`) : vscode.l10n.t('Type hints are up to date')
    ctx.info(message)
  })
