import * as vscode from 'vscode'
import { commands } from '../constants/commands'

export const registerRestart = (restart: () => Promise<void>) => vscode.commands.registerCommand(commands.RESTART, restart)
