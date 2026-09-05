# ComfyUI 全景解析

一个零依赖的中文可视化知识库，帮助对 AIGC 有兴趣但不熟悉底层原理的读者系统理解 ComfyUI：

- **第一部分 · 架构解析** — 前后端架构、执行引擎（增量缓存 / 拓扑排序 / 显存调度）、源码目录导读、自定义节点开发、接管 ComfyUI 的三条路线（含可运行的 API 客户端示例）
- **第二部分 · 节点包全解** — 官方核心节点 + 主流第三方节点包，逐节点分析：功能 / 真实结构可视化 / 上下游 / 参数选项含义 / 为什么需要。节点卡片左侧是与 ComfyUI 同构的可交互节点图，点击端口或控件右侧详情自动展开
- **第三部分 · 工作流图鉴** — 每条工作流提供：可交互节点图（点击看职责、高亮数据链路、按阶段聚焦）、依赖清单（类型徽章 + 获取指引）、管线阶段拆解、全量逐节点分析、可展开的源 JSON 与一键下载

## 工作流源文件的来源

工作流页面的源文件分两类，页面上有明确徽章标注：

- **📄 真实文件**：从公开仓库下载的原始工作流（ComfyUI 官方模板库 [Comfy-Org/workflow_templates](https://github.com/Comfy-Org/workflow_templates)、[cubiq/ComfyUI_Workflows](https://github.com/cubiq/ComfyUI_Workflows) 等），可点击溯源，25 个，全部通过 `scripts/validate-workflows.mjs` 结构校验
- **🧪 本站自制参考版**：暂无公开原始文件对应的工作流（如换脸、NSFW 结构解析），依据社区通用结构构造的 API 格式参考实现，同样经过结构校验

## 特性

- 🎨 仿 ComfyUI 深色视觉语言，节点图与官方界面同构（类型决定连线颜色）
- 🖱 全部节点图可交互：拖拽平移、滚轮缩放、点击节点弹出说明并高亮上下游
- 🔗 工作流节点可一键跳转到第二部分对应节点包详解
- 🔍 全站搜索（Ctrl+K）、分类筛选、阶段聚焦、上一条/下一条导航
- 📦 零外部依赖（无 CDN、无框架、无构建步骤），国内网络可直接访问

## 访问

https://winter971.github.io/comfyui-insight/

## 本地运行

直接双击 `index.html`，或：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 校验与数据质量

```bash
node scripts/validate-workflows.mjs assets/files/workflows
```

校验项：JSON 可解析、UI 格式（含子图）/API 格式结构完整、连线引用的节点与槽位存在、class_type 非空。

## 数据来源与声明

内容基于 ComfyUI v0.34.2 源码结构与各节点包官方文档整理。本站不托管任何模型文件、不提供下载渠道；涉及换脸与人像内容均附合规提示；「成人内容」部分仅为管线结构的技术解析（18+，遵守当地法律）。

## 更新方式

在本地修改后 `git push` 到 main 分支，GitHub Pages 自动重新发布。项目约定见 [AGENTS.md](AGENTS.md)。
