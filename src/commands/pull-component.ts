import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import type { Runtime } from '../runtime'
import { fetchComps, fetchSourceCode } from '../utils/component'
import { pickSaveFolder, readIfExists, showFile, writeFile } from '../utils/file'
import { runWithProgress } from '../utils/progress'
import { selectApp } from './select-app'

const savePathKey = 'componentCodeLocalPath'

export const registerPullComponent = (ctx: Runtime) =>
  vscode.commands.registerCommand(commands.PULL_COMPONENT, async () => {
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
    const curComp = selected.comp

    const folder = await pickSaveFolder(savePathKey, ctx.token)
    if (!folder) return

    const fileName = `${curComp.folderName}.js`
    const uri = vscode.Uri.joinPath(folder, fileName)
    if (await readIfExists(uri)) {
      const overwrite = vscode.l10n.t('Overwrite')
      if (
        (await vscode.window.showWarningMessage(vscode.l10n.t('{0} already exists. Overwrite it?', fileName), { modal: true }, overwrite)) !== overwrite
      )
        return
    }

    const code = await runWithProgress(vscode.l10n.t('Fetching component source code'), () =>
      fetchSourceCode(ctx, { appId: curApp.appId, folderName: curComp.folderName })
    )
    await writeFile(uri, new TextEncoder().encode(code), ctx.signal)
    await store.bindCompFile(curApp, curComp, uri)
    await showFile(uri, ctx.signal)
    if (store.curApp?.appId === curApp.appId) store.curComp = { ...curComp }
    ctx.info(vscode.l10n.t('Pulled component {0}', curComp.folderName))
  })
