# Change Log

## 0.0.51 - 2026-11-09

- Added `CHANGELOG.en.md` with English translations of all historical release notes.
- Updated language-switching and changelog links in both READMEs to point to the corresponding documents in the `heyCHEEMS-jar/supos-devtools` GitHub repository.

## 0.0.5 - 2026-11-06

- Added project-level VS Code settings to view and manually edit persistent mappings between components (`appId:folderName`) and absolute local file paths.
- Store persistent mappings only in the current workspace settings to prevent them from being shared across workspaces.
- Added a user-level auto-push setting, enabled by default, that runs the existing push workflow when the code file for the currently selected component is saved.
- Added a 1-second throttle for auto-push; stop watching the file if the component mapping becomes invalid or a push fails.
- Fetch the original code from the platform and back it up locally before manual pushes as well.

## 0.0.42 - 2026-11-06

- Removed the login requirement from the restart extension command, allowing local type declarations to be generated and type hints to be refreshed without logging in.
- Initialize local type features independently of remote commands, so remote dependency loading failures no longer block type generation or hint refreshes.

## 0.0.4 - 2026-11-06

- Renamed the extension from `supOS Bridge` to `supOS DevTools`, unified the package name and command prefix as `supos-devtools`, and updated the keywords.
- Switched packaging to `vsce-pnpm` to support pnpm dependency collection.
- Switched the compiler from `@swc/core` to `@swc/wasm`, retaining JS / TS / JSX / TSX compilation options and using the same WASM module across platforms.
- Removed platform-specific SWC native dependencies and dedicated installation settings to reduce packaged dependencies and prevent missing native bindings from making commands unavailable.
- Changed command modules to load concurrently via `Promise.all` within startup error handling; show a startup error dialog if dependency loading fails.

## 0.0.3 - 2026-11-05

- Added a command to pull programmable components, with support for saving to a workspace or custom directory, remembering workspace paths, and overwriting existing files.
- Added a command to push programmable components, compiling JavaScript, TypeScript, JSX, and TSX with SWC and uploading both source and compiled code.
- Added persistent bindings between components and local files, automatically restored after the extension restarts; validate and open the corresponding local file when selecting a component.
- Improved component selection state: update it only after a file is successfully opened or a pull completes; automatically clear invalid bindings and the current component when the local file is missing.
- Fetch the app list when selecting an app instead of preloading it at startup or after login; automatically clear the current component when switching apps.
- Added settings for resource upload, resource access, component management, source code, compiled code, code file names, and local save paths.
- Added Chinese and English messages for component pulling, pushing, and local file management, along with persistence tests.

## 0.0.23 - 2026-11-04

- Added commands to select an app and a programmable component, displaying the cached app list first and refreshing it in the background.
- Added progress notifications for asynchronous tasks to show the current status while fetching apps and programmable components.
- Disabled automatic login at startup; load apps only when a ticket already exists and prompt users to log in again when it expires.
- Improved cancellation, response validation, and error handling for browser login, and added a configurable login page path.
- Added settings for app management, component directories, and component query parameters, along with Chinese and English messages.

## 0.0.22 - 2026-10-27

- Added browser login to obtain a ticket through the platform's official page and store it securely.
- Added a login command and replaced startup login with on-demand login before operations that require authentication.
- Automatically log in when a request has no ticket or the ticket is invalid, then retry the original request once.
- Added `baseURL` and `loginAPIPath` login settings.
- Added Chinese and English localization for runtime messages and extension information.

## 0.0.21 - 2026-09-30

- Renamed the extension from `supOS Snippets` to `supOS Bridge`.

## 0.0.2 - 2026-09-29

- Changed the type declaration output path to `node_modules/@types/supos/index.d.ts`.
- Removed the `suposSnippets.typesDir` setting.
- Automatically restart the TypeScript service when the type declaration file is first written or its contents change.
- Reorganized the project structure into separate modules for commands, constants, and utilities.
- Fixed an extra literal `undefined` at the end of hover documentation for methods without parameters.

## 0.0.1 - 2026-09-20

- Added code snippets and completion suggestions for the `scriptUtil` / `$os` APIs.
- Generate `supos.d.ts` to provide method name and parameter completion, along with hover documentation.
- Added commands to generate type declarations and restart the extension.
- Added the `suposSnippets.typesDir` setting to specify the output directory.
