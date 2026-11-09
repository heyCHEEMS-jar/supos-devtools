import * as vscode from 'vscode'
import { watchSelectedComponent } from './auto-push-component'
import { createRuntime, type Runtime } from './runtime'
import { resetStore } from './store'

let active: Runtime | undefined

export const activate = async (ctx: vscode.ExtensionContext, restarting = false) => {
  active?.dispose()
  const scope = createRuntime(ctx)
  active = scope

  // 无需登录模块
  try {
    const [{ generateAll, registerGenerateTypes, restartTsServer }, { registerRestart }] = await Promise.all([
      import('./commands/gen-types.js'),
      import('./commands/restart.js')
    ])
    if (scope.signal.aborted) return
    scope.subscriptions.push(
      registerGenerateTypes(scope),
      registerRestart(() => {
        deactivate()
        return activate(ctx, true)
      })
    )

    const folders = vscode.workspace.workspaceFolders ?? []
    if (folders.length) {
      const wrote = await generateAll(scope, folders)
      if (scope.signal.aborted) return
      if (wrote !== null && (wrote || restarting)) {
        await restartTsServer(scope)
        if (restarting) scope.info(vscode.l10n.t('Extension restarted'))
      }
    }
  } catch (err) {
    if (scope.signal.aborted) return
    const message = err instanceof Error ? err.message : String(err)
    scope.error(vscode.l10n.t('Startup failed: {0}', message))
  }

  // 需要登录的远程模块
  try {
    const [{ registerLogin }, { registerPullComponent }, { registerSelectApp }, { registerSelectComponent }, { registerPushComponent }] = await Promise.all([
        import('./commands/login.js'),
        import('./commands/pull-component.js'),
        import('./commands/select-app.js'),
        import('./commands/select-component.js'),
        import('./commands/push-component.js')
      ])
    if (scope.signal.aborted) return
    await scope.store.restoreCompFiles(scope)
    if (scope.signal.aborted) return
    scope.subscriptions.push(
      registerLogin(scope),
      registerSelectApp(scope),
      registerSelectComponent(scope),
      registerPullComponent(scope),
      registerPushComponent(scope)
    )
    let listener = watchSelectedComponent(scope, scope.store)
    scope.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (scope.signal.aborted || !event.affectsConfiguration('autoPushComponentOnChange')) return
        listener?.dispose()
        listener = watchSelectedComponent(scope, scope.store)
      })
    )
  } catch (err) {
    if (scope.signal.aborted) return
    const message = err instanceof Error ? err.message : String(err)
    scope.error(vscode.l10n.t('Startup failed: {0}', message))
  }
}

export const deactivate = () => {
  active?.dispose()
  active = undefined
  resetStore()
}
