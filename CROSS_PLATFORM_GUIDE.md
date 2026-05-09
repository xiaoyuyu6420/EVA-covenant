# 跨平台开发指南

## 环境信息
- **开发环境**: macOS ARM (Apple Silicon)
- **CI/CD 环境**: Ubuntu Linux x86_64
- **部署环境**: Linux Docker x86_64

## 核心原则

### 1. 依赖一致性
- ✅ 使用 `.nvmrc` 锁定 Node.js 版本 (v22.22.1)
- ✅ 使用 `package-lock.json` 锁定依赖版本
- ✅ 始终使用 `npm ci` 而非 `npm install`

### 2. 行尾符处理
- ✅ 使用 `.gitattributes` 强制 LF 行尾
- ✅ 所有代码文件使用 Unix 风格换行

### 3. 数据库策略
- ✅ **不要**将 SQLite 数据库提交到 Git
- ✅ 使用 `prisma/seed.ts` 初始化数据
- ✅ 使用迁移脚本管理 schema 变更

### 4. 测试策略
- ✅ **CI 是最终测试标准** (Linux AMD64)
- ✅ 本地测试仅用于开发验证
- ✅ 所有 PR 必须通过 CI 测试

## 开发工作流

### 本地开发
```bash
# 1. 安装依赖（如果 package-lock.json 变更）
npm ci

# 2. 生成 Prisma Client
npx prisma generate

# 3. 初始化数据库（如果是新环境）
npx prisma db push
npx tsx prisma/seed.ts

# 4. 启动开发服务器
npm run dev
```

### 提交代码
```bash
# 1. 本地测试（快速验证）
npm run test

# 2. 类型检查
npx tsc --noEmit

# 3. 提交（Git 会自动处理行尾符）
git add .
git commit -m "your message"
git push origin master
```

### CI 流程
1. **Test Job**: 在 Ubuntu x64 上运行完整测试
2. **Build Job**: 构建 Docker 镜像 (linux/amd64)
3. **Deploy Job**: 推送到服务器并运行

## 常见问题

### Q: macOS 上测试通过，CI 失败？
**A**: 以 CI 结果为准。可能原因：
- 依赖版本不一致 → 删除 node_modules 重新 `npm ci`
- 测试用例依赖环境 → 使用 Mock 或条件跳过

### Q: 如何在本地模拟生产环境？
**A**: 使用 Docker Desktop:
```bash
docker build --platform linux/amd64 -t eva-test .
docker run -p 3002:3002 eva-test
```

### Q: 数据库数据如何迁移？
**A**: 
- **Schema**: 使用 Prisma Migration
- **数据**: 使用 `scripts/export-data.sh` 导出 SQL，然后在目标环境导入

## 关键文件

| 文件 | 作用 |
|------|------|
| `.nvmrc` | 锁定 Node.js 版本 |
| `.gitattributes` | 规范行尾符 |
| `.dockerignore` | 优化 Docker 构建 |
| `package-lock.json` | 锁定依赖版本 |
| `.github/workflows/deploy.yml` | CI/CD 配置 |

## 部署验证

部署后检查：
```bash
# 检查容器运行状态
docker ps | grep eva-covenant

# 检查健康检查接口
curl http://localhost:3002/api/stats

# 查看日志
docker compose logs -f
```
