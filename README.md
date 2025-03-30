# ChatView Tools

基于 Electron + Vue 3 + TypeScript 开发的微信聊天记录查看工具。

## 项目简介

ChatView Tools 是一个使用 Electron、Vue 3 和 TypeScript 开发的现代化桌面应用，用于查看和分析微信聊天记录。本项目是对 [Ppsoft1991/ChatViewTools](https://github.com/Ppsoft1991/ChatViewTools) 的 Electron 版本重写实现。

## 功能特点

### 与原版的主要区别

1. **技术栈升级**
   - 使用 Electron 替代 Java 实现，提供更好的跨平台支持
   - 采用 Vue 3 + TypeScript 开发，提供更现代的界面和更好的类型支持
   - 使用 Vite 作为构建工具，提供更快的开发体验

2. **界面优化**
   - 现代化的用户界面设计
   - 响应式布局，支持不同屏幕尺寸
   - 更直观的操作流程

3. **性能改进**
   - 更快的启动速度
   - 更流畅的界面响应
   - 更高效的数据处理

### 核心功能

- 微信聊天记录解密
- 聊天记录搜索
- 群聊信息查看
- 聊天上下文浏览
- 消息导出功能

## 重要说明

### 使用限制

由于微信最新版本的安全更新，目前无法通过 DBPass.Bin 文件获取聊天记录。本项目主要用于学习和研究目的，展示了如何使用 Electron 开发桌面应用。

### 学习价值

1. **技术学习**
   - Electron 应用开发
   - Vue 3 组件开发
   - TypeScript 类型系统
   - 桌面应用安全实践

2. **架构设计**
   - 主进程与渲染进程通信
   - 数据加密解密处理
   - 文件系统操作
   - 用户界面设计

## 开发环境要求

- Node.js 16+
- 相关系统依赖（根据操作系统不同）

## 安装和运行

1. 克隆项目
```bash
git clone [项目地址]
cd chatview-tools
```

2. 安装依赖
```bash
npm install
```

3. 开发模式运行
```bash
npm run electron:dev
```

4. 构建应用
```bash
npm run electron:build
```

## 推荐的 IDE 配置

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Electron](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## TypeScript 支持

对于 `.vue` 文件的 TypeScript 支持，请按照以下步骤配置：

1. 在 VS Code 命令面板中运行 `Extensions: Show Built-in Extensions`
2. 找到 `TypeScript and JavaScript Language Features`
3. 右键点击并选择 `Disable (Workspace)`
4. 运行 `Developer: Reload Window` 重新加载 VS Code 窗口

更多关于 Take Over 模式的信息，请参考 [Volar 文档](https://github.com/johnsoncodehk/volar/discussions/471)。

## 项目结构

```
chatview-tools/
├── src/                # 前端源代码
├── electron/          # Electron 主进程代码
├── public/            # 静态资源
└── package.json       # 项目配置
```

## 免责声明

1. 本项目仅供学习和研究使用，不保证与最新版本微信的兼容性。
2. 使用本软件所产生的任何直接或间接的后果由使用者自行承担。
3. 本项目作者不对任何索赔、损害或其他责任负责。