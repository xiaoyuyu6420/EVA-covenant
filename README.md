<div align="center">

# EVA COVENANT

**新世纪福音战士人格测试**

*基于加权曼哈顿距离与等级归一化算法的性格匹配系统*

[![CI/CD](https://github.com/xiaoyuyu6420/EVA-covenant/actions/workflows/deploy.yml/badge.svg)](https://github.com/xiaoyuyu6420/EVA-covenant/actions/workflows/deploy.yml)
[![Docker](https://img.shields.io/docker/pulls/xiaoyuyu123/eva-covenant.svg)](https://hub.docker.com/r/xiaoyuyu123/eva-covenant)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](#english) · [快速开始](#quick-start) · [部署文档](#production-deployment) · [算法详解](#matching-algorithm)

</div>

---

EVA Covenant 是一个新世纪福音战士主题的人格测试应用。用户回答 30+ 道精选问题，系统通过 15 维度加权评分 + 等级归一化算法，精准匹配最接近的 EVA 驾驶员人格。

## ✨ Key Features

| | | |
|:---:|:---:|:---:|
| 🧠 **科学匹配** | 🎯 **动态触发** | 🌐 **多语言** |
| 加权曼哈顿距离 + 等级归一化<br>15 维度精准人格画像 | 门控问题 + 三重条件检测<br>补完 / 初号机觉醒 / 亚当 | 中文 / English / 日本語<br>数据库驱动 i18n |
| 📱 **移动优先** | 📊 **管理后台** | 🐳 **一键部署** |
| NERV 橙 + EVA 紫设计系统<br>Framer Motion 动效 | 题目 CRUD + Excel 导入导出<br>数据分析面板 | Docker Hub 镜像<br>自动备份 + 健康检查 |

## 🚀 Quick Start

### 一键部署（推荐）

服务器上执行一行命令，脚本自动完成：目录创建 → 配置下载 → 密码设置 → 镜像加速 → 拉起容器。

```bash
curl -sSL https://raw.githubusercontent.com/xiaoyuyu6420/EVA-covenant/master/scripts/deploy.sh | bash
```

### Docker Compose 部署

```bash
git clone https://github.com/xiaoyuyu6420/EVA-covenant.git
cd EVA-covenant
cp .env.production.example .env
# 编辑 .env 设置管理员密码
docker compose up -d
```

服务运行在 `http://localhost:8092`。

**数据目录**：
- `./data` — SQLite 数据库（bind mount）
- `./backups` — 自动备份（bind mount）

### Docker Run

```bash
docker run -d \
  --name eva-covenant \
  -p 8092:3002 \
  -v $(pwd)/data:/app/prisma \
  -v $(pwd)/backups:/backups \
  --restart unless-stopped \
  xiaoyuyu123/eva-covenant:latest
```

### 本地开发

```bash
npm ci
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```

访问 `http://localhost:3002`。

## 🏗 Architecture

### 用户流程

```
Welcome ──▶ Questions (30) ──▶ Gate (pos 19) ──▶ Trigger
                                    │                 │
                              scoresToGrades    CMPL / U13G
                                    │                 │
                              dimScores ◀────── answers │
                                    │                  │
                              Calculating              │
                                    │                  │
                              Result ──▶ Share ◀───────┘
```

### CI/CD 流水线

```
本地 (master) ──push──▶ GitHub
                            │
                      GitHub Actions
                       ┌──┴──┐
                       │test │ npm ci · test · tsc
                       └──┬──┘
                       ┌──▼──┐
                       │build│ Docker build → Docker Hub
                       └──┬──┘
                          │
                 xiaoyuyu123/eva-covenant
                          │
                   服务器 docker pull
```

## 🧮 Matching Algorithm

### 评分流程

```
原始分数 (0-6/维度) ──▶ 等级归一化 (4L+4M+4H+3X) ──▶ 加权曼哈顿距离 ──▶ 相似度%
```

### 核心参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `delta` | 3% | Top1/Top2 差距阈值，低于此值触发边界检测 |
| `threshold` | 50% | 最低相似度，低于此值回退到 ADAM |
| `questionsPerDim` | 2 | 每维度题目数量 |
| `maxScorePerQ` | 3 | 每题最高分 |

### 特殊触发

| 类型 | 触发条件 |
|------|---------|
| **CMPL（补完）** | gate=`complement` + C1≥5 (高共情) + A3≤4 (低边界) |
| **U13G（初号机觉醒）** | gate=`transcend` + A1≥5 (高同步率) + D3≥5 (高存在感) |
| **ADAM（亚当）** | 相似度 < 50% 且 Top1/Top2 差距 < 3% |

### 向量格式

```
HML-MML-HHL-MHM-HLL
│   │   │   │   │
A   B   C   D   E          5 个模型，每个 3 维度
│   │   │   │   │          L=Low M=Medium H=High X=eXtreme
1-3 1-3 1-3 1-3 1-3
```

## 🛡 Production Deployment

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8092` | 外部访问端口 |
| `ADMIN_PASSWORD` | `admin123` | 管理后台密码 |
| `ADMIN_SECRET` | 随机生成 | Session 加密密钥 |
| `IMAGE` | `xiaoyuyu123/eva-covenant:latest` | Docker 镜像 |

### 数据安全

- **持久化** — Bind Mount (`./data`, `./backups`)，便于管理和手动备份
- **自动备份** — 容器内每 6 小时 `sqlite3 .backup` + gzip 压缩，保留 30 个备份
- **版本回滚** — `./scripts/deploy.sh --rollback` 一键回滚到上一版本
- **数据库恢复** — `./scripts/restore-db.sh` 交互式选择备份恢复
- **日志轮转** — 单文件 10MB，最多 3 个轮转
- **健康检查** — 每 30 秒检测 `/api/stats`，异常自动重启

### 常用运维

```bash
docker compose logs -f          # 查看日志
docker compose restart          # 重启服务
docker compose down             # 停止服务
docker compose pull && docker compose up -d  # 更新

# 版本管理
./scripts/deploy.sh --rollback  # 回滚到上一版本

# 数据库恢复
./scripts/restore-db.sh         # 交互式选择备份恢复
```

## 🛠 Tech Stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript |
| **Database** | SQLite + Prisma ORM |
| **UI** | Tailwind CSS + shadcn/ui + Framer Motion |
| **Testing** | Vitest |
| **CI/CD** | GitHub Actions → Docker Hub |
| **Container** | Docker + Docker Compose |

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                # 主页面
│   ├── admin/page.tsx          # 管理后台
│   └── api/
│       ├── quiz/route.ts       # 题目接口
│       └── match/route.ts      # 匹配接口
├── hooks/
│   └── useQuiz.ts              # 测试状态机
├── lib/
│   ├── match-engine.ts         # 匹配算法
│   ├── types.ts                # 类型与常量
│   ├── storage.ts              # localStorage 持久化
│   └── i18n/                   # 国际化
├── components/
│   ├── WelcomeScreen.tsx
│   ├── TestScreen.tsx
│   └── ResultScreen.tsx
prisma/
├── schema.prisma               # 数据模型
└── seed.ts                     # 种子数据
```

## 🧪 Development

```bash
npm run test              # 运行测试
npx tsc --noEmit          # 类型检查
npm run lint              # 代码检查
npx prisma db push        # 应用 schema 变更
npx tsx prisma/seed.ts    # 导入种子数据
```

## 🤝 Contributing

Issues 和 Pull Requests 欢迎！

```bash
git clone https://github.com/xiaoyuyu6420/EVA-covenant.git
cd EVA-covenant
npm ci
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```

## 📄 License

[MIT](LICENSE)

---

<div align="center">

*使徒来袭之际，你将如何选择？*

</div>
