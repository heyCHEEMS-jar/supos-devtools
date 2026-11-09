# supOS DevTools

[简体中文](https://github.com/heyCHEEMS-jar/supos-devtools/blob/master/README.md) | [English](https://github.com/heyCHEEMS-jar/supos-devtools/blob/master/README.en.md)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SWC](https://img.shields.io/badge/SWC-F8C457?logo=swc&logoColor=black)
![esbuild](https://img.shields.io/badge/esbuild-FFCF00?logo=esbuild&logoColor=black)
![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?logo=visualstudiocode&logoColor=white)

A VS Code extension for supOS programmable components, with remote code pulling and synchronization, API type hints, and code completion.

---

## Changelog

See [CHANGELOG.en.md](https://github.com/heyCHEEMS-jar/supos-devtools/blob/master/CHANGELOG.en.md).

## Installation

- Search for `supOS DevTools` in the VS Code Extensions panel.
- Requires VS Code 1.137.0+. Supports Windows, macOS, and Linux on x64 / arm64, including glibc / musl on Linux.

## Usage

- **Type hints**: Automatically generates `node_modules/@types/supos/index.d.ts`. Add `"supos"` to `compilerOptions.types` in `tsconfig.json` / `jsconfig.json`. If hints do not appear, run the command to generate type declarations or restart the extension.
- **Component synchronization**: Configure `baseURL`, then use the Command Palette to log in, select an app and component, and pull or push code. Supports JS / TS / JSX / TSX. Login requires Chrome or Edge.

## Local Packaging

```sh
pnpm install
pnpm vsce:package
```

The generated VSIX includes SWC WASM; no separate compiler or platform-native dependencies are required.
