import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import type { Runtime } from '../runtime'
import { compileComponent } from '../utils/compile'
import { fetchSourceCode, getCompFile, uploadCompiledCode, uploadSourceCode } from '../utils/component'
import { backupCompFile, showFile } from '../utils/file'
import { runWithProgress } from '../utils/progress'
import { selectApp } from './select-app'
import { selectComp } from './select-component'

export interface CompSource {
  document: vscode.TextDocument
  appId: string
  folderName: string
  code: string
  languageId: string
}

export const pushComp = async (ctx: Runtime, { document, appId, folderName, code, languageId }: CompSource, signal = ctx.signal) => {
  const taskCtx: Runtime = signal === ctx.signal ? ctx : { ...ctx, signal: AbortSignal.any([ctx.signal, signal]) }
  const fileName = vscode.workspace.getConfiguration().get('componentCodeFileName', 'index.js')
  await runWithProgress(vscode.l10n.t('Synchronizing component {0}', folderName), async () => {
    const target = { appId, folderName }
    const compiled = await compileComponent(code, document.fileName, languageId).catch(() => {
      throw new Error(vscode.l10n.t('Compilation failed. Check the syntax.'))
    })
    const remoteCode = await fetchSourceCode(taskCtx, target).catch(() => {
      throw new Error(vscode.l10n.t('Failed to fetch source code. Try again.'))
    })
    await backupCompFile(document.uri, remoteCode, taskCtx.signal).catch(() => {
      throw new Error(vscode.l10n.t('Failed to back up source code. Check the path.'))
    })
    await uploadSourceCode(taskCtx, new File([code], fileName, { type: 'text/javascript' }), target).catch(() => {
      throw new Error(vscode.l10n.t('Failed to upload source code. Try again.'))
    })
    await uploadCompiledCode(taskCtx, new File([compiled], fileName, { type: 'text/javascript' }), target).catch(() => {
      throw new Error(vscode.l10n.t('Failed to upload compiled code. Try again.'))
    })
  })
  if (taskCtx.signal.aborted) return false
  const time = new Date().toLocaleTimeString([], { hour12: false })
  ctx.info(`${vscode.l10n.t('Synchronized component {0}', folderName)} (${time})`)
  return true
}

export const registerPushComponent = (ctx: Runtime) =>
  vscode.commands.registerCommand(commands.PUSH_COMPONENT, async (source?: CompSource, signal?: AbortSignal) => {
    if (source) return pushComp(ctx, source, signal)
    const { store } = ctx
    if (!store.curApp) await selectApp(ctx)
    if (!store.curApp) return false
    if (!store.curComp) await selectComp(ctx)
    const { curApp, curComp } = store
    if (!curApp || !curComp) return false

    const uri = await getCompFile(ctx, curApp, curComp)
    if (!uri) return false
    const document = await showFile(uri, ctx.signal)
    return pushComp(ctx, {
      document,
      appId: curApp.appId,
      folderName: curComp.folderName,
      code: document.getText(),
      languageId: document.languageId
    })
  })
