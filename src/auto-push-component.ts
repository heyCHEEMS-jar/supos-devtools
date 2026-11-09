import * as vscode from 'vscode'
import type { CompSource } from './commands/push-component'
import { commands } from './constants/commands'
import { statusBar } from './constants/ui'
import { store } from './store'

export const watchSelectedComponent = (ctx: Pick<vscode.ExtensionContext, 'subscriptions'>, state = store) => {
  if (!vscode.workspace.getConfiguration().get('autoPushComponentOnChange', true)) return

  // 每个文档当前正在执行的完整同步链
  const syncing = new Map<vscode.TextDocument, AbortController>()
  const manualSaves = new WeakSet<vscode.TextDocument>()
  const manualSaveTimes = new WeakMap<vscode.TextDocument, number>()
  let current = vscode.window.activeTextEditor?.document
  let timer: ReturnType<typeof setTimeout> | undefined
  let dirty = false

  const synchronize = async (document: vscode.TextDocument) => {
    const comp = state.getCompByFile(document.uri)
    if (!comp || syncing.has(document)) return

    const controller = new AbortController()
    syncing.set(document, controller)
    try {
      await vscode.commands.executeCommand<boolean>(
        commands.PUSH_COMPONENT,
        { document, ...comp, code: document.getText(), languageId: document.languageId } satisfies CompSource,
        controller.signal
      )
      if (syncing.get(document) !== controller) return
      syncing.delete(document)
      if (current === document) dirty = false
    } catch (err) {
      if (syncing.get(document) !== controller) return
      syncing.delete(document)
      vscode.window.setStatusBarMessage(`$(error) ${statusBar.prefix}: ${err instanceof Error ? err.message : String(err)}`, statusBar.timeout)
    }
  }

  const listener = vscode.Disposable.from(
    // 窗口内容变化时
    vscode.workspace.onDidChangeTextDocument(({ document, contentChanges }) => {
      if (!contentChanges.length || document !== current || !state.getCompByFile(document.uri)) return
      syncing.get(document)?.abort()
      syncing.delete(document)
      dirty = true
      clearTimeout(timer)
      timer = setTimeout(() => void synchronize(document), 2000)
    }),
    // 手动保存时立即同步，节流防止连续请求
    vscode.workspace.onWillSaveTextDocument(({ document, reason }) => {
      if (reason === vscode.TextDocumentSaveReason.Manual) manualSaves.add(document)
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (!manualSaves.delete(document) || document !== current || !state.getCompByFile(document.uri)) return
      const now = Date.now()
      if (now - (manualSaveTimes.get(document) ?? 0) < 500) return
      manualSaveTimes.set(document, now)
      clearTimeout(timer)
      syncing.get(document)?.abort()
      syncing.delete(document)
      dirty = true
      void synchronize(document)
    }),
    // 编辑器窗口变化时
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document === current) return
      clearTimeout(timer)
      if (current && dirty) void synchronize(current)
      current = editor?.document
      dirty = !!current && syncing.has(current) // 恢复新文件窗口的脏状态
    }),
    new vscode.Disposable(() => {
      clearTimeout(timer)
      for (const controller of syncing.values()) controller.abort()
      syncing.clear()
      const index = ctx.subscriptions.indexOf(listener)
      if (index !== -1) ctx.subscriptions.splice(index, 1)
    })
  )
  ctx.subscriptions.push(listener)
  return listener
}
