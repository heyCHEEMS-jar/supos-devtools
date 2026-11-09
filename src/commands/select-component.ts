import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import type { Runtime } from '../runtime'
import { fetchComps, getCompFile } from '../utils/component'
import { showFile } from '../utils/file'
import { selectApp } from './select-app'

export const selectComp = async (ctx: Runtime) => {
  const { store } = ctx
  if (!store.curApp) await selectApp(ctx)
  const { curApp } = store
  if (!curApp) return

  const comps = await fetchComps(ctx, curApp)
  const selected = await vscode.window.showQuickPick(
    comps.map((comp) => ({ label: comp.folderName, description: comp.path, comp })),
    { placeHolder: vscode.l10n.t('Select Programmable Component') },
    ctx.token
  )
  if (!selected) return

  const uri = await getCompFile(ctx, curApp, selected.comp)
  if (!uri) return
  await showFile(uri, ctx.signal)
  if (store.curApp?.appId !== curApp.appId) return
  store.curComp = { ...selected.comp }
  ctx.info(vscode.l10n.t('Selected component {0}', store.curComp.folderName))
}

export const registerSelectComponent = (ctx: Runtime) => vscode.commands.registerCommand(commands.SELECT_COMPONENT, () => selectComp(ctx))
