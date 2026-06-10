# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**EVA Covenant** is an Evangelion-themed personality quiz application built with Next.js 16 (App Router), React 19, and Prisma. Users answer 30+ questions to discover their Evangelion pilot personality type. The matching algorithm uses weighted Manhattan distance with rank-normalized grading.

## Essential Commands

### Development
```bash
npm run dev              # Start dev server on http://localhost:3002
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run test             # Vitest (single run)
npm run test:watch       # Vitest watch mode
```

### Database Operations
```bash
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db push       # Apply schema changes to SQLite database
npx tsx prisma/seed.ts   # Seed initial data
```

### CI/CD
- Tests run on Ubuntu Linux x86_64 (CI result is authoritative)
- Local macOS tests are advisory only
- Use `npm ci` (not `npm install`) for consistent dependencies

## Architecture

### Core Quiz Flow
1. **Welcome Screen** → User starts test
2. **Question Flow** (30 regular questions):
   - 15 dimensions × 2 questions each (A1-E3)
   - Gate question inserted at position 19 (GATE_INSERT_POS)
   - Gate answers dynamically add trigger questions (CMPL, U13G, REI)
3. **Calculating Screen** → Matching algorithm runs client-side
4. **Result Screen** → Display personality type + share options

### Key Files
- `src/hooks/useQuiz.ts` — Quiz state machine, screen transitions, localStorage persistence
- `src/lib/match-engine.ts` — Personality matching algorithm (scoresToGrades, matchPersonality)
- `src/lib/types.ts` — Dimension definitions, weights, algorithm constants
- `src/lib/storage.ts` — Progress/result persistence to localStorage
- `src/app/api/quiz/route.ts` — Fetches questions from DB with i18n translations
- `src/app/api/match/route.ts` — Server-side matching endpoint (backup)
- `prisma/schema.prisma` — Data models (Question, Option, PersonalityType, SpecialType, TestRecord)

### Matching Algorithm (Critical)

**Score Processing:**
- Raw scores (0-6 per dimension) → rank-normalized grades (4L + 4M + 4H + 3X)
- `scoresToGrades()` uses deterministic tiebreak: `score + index * 0.001`
- **DO NOT** change this without understanding ranking distribution implications

**Similarity Calculation:**
- Weighted Manhattan distance between user grades and template vectors
- `DIM_WEIGHTS`: A1=1.5, A2=1.2, A3=1.0, B1=1.5, etc. (see types.ts)
- Normalized to 0-100% similarity

**Special Triggers (Triple Conditions):**
- **CMPL (Complement/补完)**: gate="complement" + trigger="CMPL" + C1≥5 (high empathy) + A3≤4 (low boundary)
- **U13G (Unit-13 God)**: gate="transcend" + trigger="U13G" + A1≥5 (high sync) + D3≥5 (high existential)
- Both require all three conditions to activate

**Boundary Detection:**
- If top1.similarity - top2.similarity < `delta` (3%):
  - If top1.similarity < `threshold` (50%): fallback to ADAM (special fallback type)
  - Else: mark as boundary case (isBoundary=true)

**Algorithm Constants (types.ts):**
```typescript
ALGO_PARAMS = {
  delta: 3,       // Top1/Top2 gap threshold (%)
  threshold: 50,  // Minimum similarity for non-fallback (%)
  questionsPerDim: 2,
  maxScorePerQ: 3
}
```

### Data Model

**Core Tables:**
- `Question` — dimCode (A1-E3), text, order, isGate, isTrigger, translations (JSON)
- `Option` — questionId, label, score (1-3), value (gate path), trigger (special code), translations (JSON)
- `PersonalityType` — code (e.g., "REI"), name, group, vector (e.g., "HML-MML-HHL-MHM-HLL"), slogan, desc, evaUnit, emoji, translations
- `SpecialType` — code (CMPL/U13G/ADAM), triggerType, triggerCond, translations
- `TestRecord` — code, similarity, scores (JSON), vector, gateAnswer, triggerAnswer, answers[]
- `EventLog` — page_view, quiz_start, quiz_complete, share_click

**Vector Format:**
- 15 characters (L/M/H/X) grouped by model: "HML-MML-HHL-MHM-HLL"
- Models A-E, each with 3 dimensions

### i18n System

- React context: `src/lib/i18n/context.tsx`
- Translations stored in DB as JSON columns on Question/Option/PersonalityType
- API endpoint `/api/quiz?lang=zh|en|ja` resolves translations server-side
- UI strings in `src/lib/i18n/translations.ts`
- Language switcher re-fetches quiz data with new lang param

### Admin Panel

- Protected by password at `/admin`
- CRUD for Questions, PersonalityTypes, SpecialTypes
- Import/Export Excel (xlsx) and Markdown
- Analytics dashboard with TestRecord aggregation
- EventLog viewer

### UI Architecture

- **Mobile-first**: max-width 600px, centered layout
- **Design System**: NERV orange (#F97316) + EVA purple (#9333EA)
- **Components**:
  - `WelcomeScreen` — Language selector, start button
  - `TestScreen` — Question display, option buttons, progress bar
  - `ResultScreen` — Personality card, dimension breakdown, share buttons
  - `ui/button.tsx` — shadcn/ui components
- **Animations**: Framer Motion for transitions
- **Keyboard shortcuts**: 1-4 keys for quick answering

### State Management

- `useQuiz` hook manages all quiz state (screen, currentQ, dimScores, gateValue, triggerValue, result)
- **Progress Persistence**: Every answer saves to `localStorage['eva-covenant']`
  - Resumes automatically on reload
  - Clears after completion
- **Result History**: Saved to `localStorage['eva-covenant-results']` (max 50 items)

## Development Workflow

### Adding a New Question
1. Add to `prisma/seed.ts` with proper dimCode, order, options
2. Run `npx tsx prisma/seed.ts` to update DB
3. No code changes needed — quiz fetches from API dynamically

### Adding a New Personality Type
1. Add `PersonalityType` record to seed.ts with:
   - Unique code (e.g., "ASUKA")
   - Vector matching target grade distribution (e.g., "HMH-LHL-HML-MHM-HMH")
   - Translations JSON
2. Test matching with various score combinations
3. Verify vector produces expected similarity scores

### Modifying Matching Algorithm
**⚠️ High-risk area — changes affect all results**
1. Update constants in `src/lib/types.ts`
2. Modify `matchPersonality()` in `src/lib/match-engine.ts`
3. Update/add tests in `src/lib/match-engine.test.ts`
4. Run full test suite: `npm run test`
5. Manually test edge cases (boundary conditions, special triggers)

### Debugging Quiz Flow
- Check browser DevTools → Application → Local Storage for current progress
- Network tab: `/api/quiz` response shows actual questions served
- Console logs in `useQuiz.ts` for state transitions
- Use `dimScores` array to verify score accumulation

## Cross-Platform Notes

**Development**: macOS ARM (Apple Silicon)
**Production**: Linux Docker x86_64

- Always use `npm ci` (never `npm install`)
- SQLite database not committed — always seed via `prisma/seed.ts`
- Test failures on macOS may pass on Linux — trust CI results
- Line endings: enforced LF via `.gitattributes`
- Node version: locked in `.nvmrc` (v22.22.1)

## Testing

- **Framework**: Vitest
- **Key test file**: `src/lib/match-engine.test.ts`
- **Test focus**: Matching algorithm correctness, boundary detection, special triggers
- **Run single test**: `npx vitest run src/lib/match-engine.test.ts`
- **Coverage areas**:
  - `scoresToGrades()` distribution
  - `matchPersonality()` with various score combinations
  - Special trigger conditions (CMPL, U13G)
  - Boundary/fallback logic

## Common Tasks

### Export/Import Questions
- Admin panel: `/admin/questions`
- Export Excel: downloads current DB questions
- Import Excel: bulk upsert (matched by dimCode + order)
- Markdown export: `/api/admin/export-md`

### Check Test Records
- Admin panel: `/admin/analytics`
- API: `/api/admin/stats` for aggregations
- DB query: `prisma testRecord.findMany({ include: { answers: true } })`

### Deploy
- GitHub Actions auto-deploy on push to master
- Docker Compose on production server
- Health check: `curl https://eva-covenant.com/api/stats`
- Logs: `docker compose logs -f eva-covenant`

### Deployment Architecture

```
本地开发 → GitHub → GitHub Actions → Docker Hub → 服务器(镜像加速)
```

1. 代码推送到 GitHub
2. GitHub Actions 构建镜像并推送到 Docker Hub
3. 服务器执行 `docker compose pull && up -d`（需配置阿里云镜像加速）

### Deployment Scripts

**一键部署** (首次):
```bash
curl -sSL https://raw.githubusercontent.com/xiaoyuyu6420/EVA-covenant/master/scripts/deploy.sh | bash
```

**部署脚本功能**:
- `scripts/deploy.sh` — 一键部署，支持版本管理和回滚
  - 自动配置国内 Docker 镜像加速
  - 交互式设置管理员密码
  - 版本记录和回滚：`./scripts/deploy.sh --rollback`
- `scripts/restore-db.sh` — 交互式数据库恢复工具
  - 列出所有备份供选择
  - 恢复前自动备份当前数据库
  - 自动重启并验证服务
- `scripts/backup.sh` — 容器内自动备份脚本（每 6 小时运行）
  - 使用 SQLite .backup 保证数据一致性
  - gzip 压缩节省空间
  - 保留最近 30 个备份

**Docker 配置**:
- 数据目录：`./data` (bind mount，便于备份)
- 备份目录：`./backups` (bind mount)
- 资源限制：512M 内存，1 CPU
- 健康检查：每 30 秒检测 `/api/stats`

### Server Setup (一次性)

```bash
mkdir -p /opt/eva-covenant && cd /opt/eva-covenant
mkdir -p data backups

# 下载配置文件
curl -o docker-compose.yml https://raw.githubusercontent.com/xiaoyuyu6420/EVA-covenant/master/docker-compose.yml

# 配置环境变量
echo "ADMIN_PASSWORD=你的密码" > .env

# 配置 Docker 镜像加速（阿里云）
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": ["https://你的加速地址.mirror.aliyuncs.com"]
}
EOF
sudo systemctl restart docker

# 首次部署
docker compose pull && docker compose up -d
```

### 日常更新

```bash
cd /opt/eva-covenant
docker compose pull && docker compose up -d
```

### 数据库恢复

```bash
cd /opt/eva-covenant
./scripts/restore-db.sh  # 交互式选择备份恢复
```

### Repositories

| 平台 | 地址 | 用途 |
|---|---|---|
| GitHub | https://github.com/xiaoyuyu6420/EVA-covenant | 主仓库，触发 CI/CD |
| Docker Hub | https://hub.docker.com/r/xiaoyuyu123/eva-covenant | 镜像仓库 |

## Auto Sync to GitHub

A Stop hook is configured in `.claude/settings.local.json` that automatically commits and pushes to GitHub at the end of each conversation if there are uncommitted changes. This ensures the Docker build server can always pull the latest code.

- **Repository**: https://github.com/xiaoyuyu6420/EVA-covenant
- **Branch**: master
- **Hook trigger**: End of each conversation (Stop event)
- **Behavior**: If `git diff` shows changes, runs `git add -A && git commit -m 'auto: sync' && git push`

## Known Constraints

1. **SQLite limitations**: No concurrent writes, single-file DB
2. **No auth system**: Admin panel uses simple password (not user accounts)
3. **Client-side matching**: Algorithm runs in browser, not server
4. **No pagination**: Admin panel loads all records (may slow with >10k TestRecords)
5. **Fixed question count**: 30 regular + 1 gate + 0-1 trigger (hardcoded in useQuiz)

## File References

- Schema: `prisma/schema.prisma`
- Seed data: `prisma/seed.ts`
- Main page: `src/app/page.tsx`
- Quiz hook: `src/hooks/useQuiz.ts`
- Match engine: `src/lib/match-engine.ts`
- Types/constants: `src/lib/types.ts`
- Storage utils: `src/lib/storage.ts`
- i18n context: `src/lib/i18n/context.tsx`
- Admin page: `src/app/admin/page.tsx`
- API routes: `src/app/api/*/route.ts`
