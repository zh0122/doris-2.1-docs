# Apache Doris 2.1 中文文档归档（非官方）

这是 **Apache Doris 2.1 中文文档**的只读归档站，部署在 GitHub Pages 上。

- 在线地址：https://zh0122.github.io/doris-2.1-docs/
- 内容来源：`apache/doris-website` 仓库中归档的 2.1 中文文档（`archived_docs`）
- 仅保留 2.1 单版本、中文、全文搜索
- 非 Apache 官方站点；官方站点是 https://doris.apache.org/

## 本地运行

```bash
npm install
npm start
```

构建并本地预览：

```bash
npm run build
npm run serve
```

> 注意：站点 `baseUrl` 为 `/doris-2.1-docs/`，本地访问地址是
> `http://localhost:3000/doris-2.1-docs/`。

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并发布到 GitHub Pages：

- workflow：`.github/workflows/deploy.yml`
- 构建命令：`npm run build`
- 发布目录：`build/`

## 目录说明

```text
docs/                 2.1 中文文档（Markdown/MDX）
sidebars.json         2.1 侧边栏
static/images/        文档实际引用的图片
static/files/         文档中可下载的脚本
docusaurus.config.js  Docusaurus 配置（单语言 zh-CN）
```

## 已知处理

- 文档中指向 `/images/...`、`/files/...` 的绝对路径已加上 `/doris-2.1-docs/` 前缀，
  以适配 GitHub Pages 项目子路径。
- `/zh-CN/images/...` 已归一化为 `/images/...`。
- 已移除/修复 2.1 中已失效的 Nereids 链接，并修正 iceberg-catalog 的锚点。
- 搜索索引在 `npm run build` 时生成，无需额外服务。