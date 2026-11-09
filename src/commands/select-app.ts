import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import type { Runtime } from '../runtime'
import { loadApps } from '../utils/apps'
import { runWithProgress } from '../utils/progress'

export const selectApp = async (ctx: Runtime) => {
  const { store } = ctx
  const apps = await runWithProgress(vscode.l10n.t('Fetching apps'), () => loadApps(ctx))
  const selected = await vscode.window.showQuickPick(
    apps.map((app) => ({ label: app.name, description: app.appId, app })),
    { placeHolder: vscode.l10n.t('Select App') },
    ctx.token
  )
  if (!selected) return

  if (store.curApp?.appId !== selected.app.appId) store.curComp = undefined
  store.curApp = { ...selected.app }
  ctx.info(vscode.l10n.t('{0} selected', store.curApp.name))
}

export const registerSelectApp = (ctx: Runtime) => vscode.commands.registerCommand(commands.SELECT_APP, () => selectApp(ctx))
