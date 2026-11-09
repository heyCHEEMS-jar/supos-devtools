import * as vscode from 'vscode'
import { statusBar } from '../constants/ui'

export const runWithProgress = async <T>(title: string, task: () => Promise<T>) =>
  vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: `${statusBar.prefix}: ${title}` }, task)
