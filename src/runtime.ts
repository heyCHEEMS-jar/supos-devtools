import * as vscode from 'vscode'
import { statusBar } from './constants/ui'
import { resetStore } from './store'

export const createRuntime = (ctx: vscode.ExtensionContext) => {
  const controller = new AbortController()
  const cancellation = new vscode.CancellationTokenSource()
  const subscriptions: vscode.Disposable[] = []
  const runtime = {
    extensionUri: ctx.extensionUri,
    workspaceState: ctx.workspaceState,
    secrets: ctx.secrets,
    store: resetStore(controller.signal),
    signal: controller.signal,
    token: cancellation.token,
    subscriptions,
    // 通知也属于当前实例，销毁后不再输出旧任务的消息
    info(message: string) {
      if (!controller.signal.aborted) vscode.window.setStatusBarMessage(`$(info) ${statusBar.prefix}: ${message}`, statusBar.timeout)
    },
    error(message: string) {
      if (!controller.signal.aborted) vscode.window.setStatusBarMessage(`$(error) ${statusBar.prefix}: ${message}`, statusBar.timeout)
    },
    warn(message: string) {
      if (!controller.signal.aborted) vscode.window.setStatusBarMessage(`$(warning) ${statusBar.prefix}: ${message}`, statusBar.timeout)
    },
    dispose() {
      if (controller.signal.aborted) return
      controller.abort(new vscode.CancellationError())
      for (const subscription of subscriptions.splice(0)) subscription.dispose()
      cancellation.cancel()
      cancellation.dispose()
      const index = ctx.subscriptions.indexOf(runtime)
      if (index !== -1) ctx.subscriptions.splice(index, 1)
    }
  }
  ctx.subscriptions.push(runtime)
  return runtime
}

export type Runtime = ReturnType<typeof createRuntime>
