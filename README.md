# supOS DevTools

[简体中文](https://github.com/heyCHEEMS-jar/supos-devtools/blob/master/README.md) | [English](https://github.com/heyCHEEMS-jar/supos-devtools/blob/master/README.en.md)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SWC](https://img.shields.io/badge/SWC-F8C457?logo=swc&logoColor=black)
![esbuild](https://img.shields.io/badge/esbuild-FFCF00?logo=esbuild&logoColor=black)
![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?logo=visualstudiocode&logoColor=white)

为 supOS 提供的 VS Code 插件，支持远程可编程组件拉取、自动同步，API 类型提示、代码补全。

---

## 更新日志

详见 [CHANGELOG.md](https://github.com/heyCHEEMS-jar/supos-devtools/blob/master/CHANGELOG.md)

## 安装

- 在 VS Code 扩展面板搜索 `supOS DevTools`。
- 要求 VS Code 1.137.0+，支持 Windows、macOS、Linux 的 x64 / arm64（Linux 包含 glibc / musl）。

## 使用

- **类型提示**：自动生成 `node_modules/@types/supos/index.d.ts`，在 `tsconfig.json` / `jsconfig.json` 的 `compilerOptions.types` 中加入 `"supos"`。未生效时执行“生成类型声明”或“重启扩展”。
- **组件同步**：配置 `baseURL`，通过命令面板登录、选择应用和组件，再执行拉取或推送；支持 JS / TS / JSX / TSX，登录需安装 Chrome 或 Edge。

## 本地打包

```sh
pnpm install
pnpm vsce:package
```

生成的 VSIX 内置 SWC WASM，无需另行安装编译器或平台原生依赖。
