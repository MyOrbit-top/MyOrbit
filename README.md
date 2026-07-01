# 🚀 MyOrbit — 你的专属起始页 & 个人新标签页
> Your Personal Start Page & Dashboard Workspace

MyOrbit 是一个极简、高效、开箱即用的**浏览器起始页**（Browser Start Page）。它旨在替代浏览器默认的新标签页，将你的书签、订阅源和常用工具整合在一个毛玻璃质感的仪表盘中。纯前端实现，无后端依赖，数据全存在本地。

![Vue 3](https://img.shields.io/badge/Vue-3.4+-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ 核心特性 (Features)

- 🧩 **起始页 Widget 系统**：内置**书签树**（支持无限嵌套文件夹）和 **RSS 订阅阅读器**，自由组合你的专属起始页。
- 🔐 **隐私 PIN 锁**：基于 SHA-256 加密，支持 `Public` / `Private` 模式切换，私密书签解锁后可见。
- 🌀 **毛玻璃设计语言**：Glassmorphism 深色优先 UI，完美适配 Light / Dark 双主题。
- 📐 **瀑布流自适应布局**：CSS Masonry 实现卡片自适应排列，拖拽排序随心所欲。
- 🧭 **智能拖拽交互**：书签支持拖拽排序、合并为文件夹；根区域支持拖拽插入顶部/底部/末尾。
- 🔍 **全局瞬时搜索**：实时检索书签标题、关键词、URL 及描述（未解锁的隐私内容自动过滤）。
- 📥 **数据迁移与备份**：支持导入 Chrome HTML 书签，以及 JSON 格式的完整导入/导出。
- 🗄️ **本地持久化缓存**：IndexedDB 缓存 RSS 源与 Favicon，离线也能看。

---

## 🛠 技术栈 (Tech Stack)

| 技术 | 用途 |
|------|------|
| Vue 3 + TypeScript | 响应式框架与类型安全 |
| Vite | 极速构建工具 |
| TailwindCSS | 原子化 CSS 引擎 |
| Lucide Icons | 纯 SVG 矢量图标库 |
| IndexedDB | RSS 与 Favicon 缓存层 |
| localStorage | UI 状态（主题、布局、解锁态）持久化 |

---

## 🚀 快速开始 (Quick Start)

### 环境要求
- Node.js >= 18
- npm / pnpm / yarn 均可

### 安装与运行
```bash
# 克隆项目
git clone https://github.com/MyOrbit-top/myorbit.git
cd myorbit

# 安装依赖
npm install

# 启动开发服务器（默认端口 5173）
npm run dev# 🚀 MyOrbit — 你的专属起始页 & 个人新标签页
> Your Personal Start Page & Dashboard Workspace

MyOrbit 是一个极简、高效、开箱即用的**浏览器起始页**（Browser Start Page）。它旨在替代浏览器默认的新标签页，将你的书签、订阅源和常用工具整合在一个毛玻璃质感的仪表盘中。纯前端实现，无后端依赖，数据全存在本地。

![Vue 3](https://img.shields.io/badge/Vue-3.4+-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ 核心特性 (Features)

- 🧩 **起始页 Widget 系统**：内置**书签树**（支持无限嵌套文件夹）和 **RSS 订阅阅读器**，自由组合你的专属起始页。
- 🔐 **隐私 PIN 锁**：基于 SHA-256 加密，支持 `Public` / `Private` 模式切换，私密书签解锁后可见。
- 🌀 **毛玻璃设计语言**：Glassmorphism 深色优先 UI，完美适配 Light / Dark 双主题。
- 📐 **瀑布流自适应布局**：CSS Masonry 实现卡片自适应排列，拖拽排序随心所欲。
- 🧭 **智能拖拽交互**：书签支持拖拽排序、合并为文件夹；根区域支持拖拽插入顶部/底部/末尾。
- 🔍 **全局瞬时搜索**：实时检索书签标题、关键词、URL 及描述（未解锁的隐私内容自动过滤）。
- 📥 **数据迁移与备份**：支持导入 Chrome HTML 书签，以及 JSON 格式的完整导入/导出。
- 🗄️ **本地持久化缓存**：IndexedDB 缓存 RSS 源与 Favicon，离线也能看。

---

## 🛠 技术栈 (Tech Stack)

| 技术 | 用途 |
|------|------|
| Vue 3 + TypeScript | 响应式框架与类型安全 |
| Vite | 极速构建工具 |
| TailwindCSS | 原子化 CSS 引擎 |
| Lucide Icons | 纯 SVG 矢量图标库 |
| IndexedDB | RSS 与 Favicon 缓存层 |
| localStorage | UI 状态（主题、布局、解锁态）持久化 |

---

## 🚀 快速开始 (Quick Start)

### 环境要求
- Node.js >= 18
- npm / pnpm / yarn 均可

### 安装与运行
```bash
# 克隆项目
git clone https://github.com/MyOrbit-top/myorbit.git
cd myorbit

# 安装依赖
npm install

# 启动开发服务器（默认端口 5173）
npm run dev

浏览器打开 http://localhost:5173，即刻体验你的新起始页！

# 构建生产版本
npm run build


## 📁 项目结构 (Directory Structure)
myorbit/
├── public/images/          # Logo 资源（亮色/暗色）
├── src/
│   ├── components/         # 通用 UI（HeaderBar、SearchBar、DrawerPanel...）
│   ├── widgets/            # 起始页核心组件（Bookmark、RSS、TreeNode）
│   ├── runtime/
│   │   └── store.ts        # 全局状态管理（所有 CRUD 与拖拽逻辑）
│   ├── schemas/
│   │   ├── types.ts        # TypeScript 类型定义
│   │   ├── site.json       # 系统配置（品牌、搜索引擎、主题）
│   │   └── user.json       # 用户数据（含开箱即用的 Demo 示例）
│   ├── utils/              # 工具库（加密/IndexedDB/RSS解析/导入导出）
│   └── styles/
│       └── main.css        # 全局 CSS 变量与毛玻璃效果
├── index.html
├── package.json
└── vite.config.ts


## 🔐 默认安全信息 (Default Security)

# 默认 PIN 码：1234（采用 SHA-256 加密存储）,如需更改自行替换user.json 中的security.pinHash

# 首次启动会自动加载 user.json 中的 Demo 数据，包含 AI 工具集、开发导航 和 科技新闻 RSS，方便你快速体验。


## 🤝 贡献与反馈 (Contributing)
欢迎提交 Issue 与 Pull Request。请确保代码符合 TypeScript 严格模式，且所有 UI 变更兼容 Light / Dark 双主题。



