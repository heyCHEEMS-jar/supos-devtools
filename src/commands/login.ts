import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import type { Runtime } from '../runtime'
import { login } from '../utils/login'

export const registerLogin = (ctx: Runtime) =>
  vscode.commands.registerCommand(commands.LOGIN, async () => {
    try {
      await login(ctx)
      ctx.info(vscode.l10n.t('supOS login succeeded'))
    } catch (e) {
      if (e instanceof vscode.CancellationError) return
      const message = e instanceof Error ? e.message : String(e)
      ctx.error(vscode.l10n.t('supOS login failed: {0}', message))
    }
  })
