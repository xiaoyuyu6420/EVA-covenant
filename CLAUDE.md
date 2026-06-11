# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**EVA Covenant** is an Evangelion-themed personality quiz application built with Next.js 16 (App Router), React 19, and Prisma. Users answer 30+ questions to discover their Evangelion pilot personality type. The matching algorithm uses weighted Manhattan distance with rank-normalized grading.

## Essential Commands

```bash
npm run dev              # Start dev server on http://localhost:3002
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest (single run)
npm run test:watch       # Vitest watch mode
npx vitest run src/lib/match-engine.test.ts  # Run single test file

npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db push       # Apply schema changes to SQLite database
npx tsx prisma/seed.ts   # Seed initial data
```

- CI runs on Ubuntu Linux x86_64 — CI result is authoritative over local macOS
- Use `npm ci` (not `npm install`) for consistent dependencies
- Node version: v22.22.1 (`.nvmrc`)

## Architecture

### Core Quiz Flow

1. **Welcome Screen** → User starts test
2. **Question Flow** (30 regular questions):
   - 15 dimensions × 2 questions each (A1-E3)
   - Gate question inserted at position 19 (`GATE_INSERT_POS`)
   - Gate answers dynamically add trigger questions (CMPL, U13G, REI)
3. **Calculating Screen** → Matching algorithm runs client-side
4. **Result Screen** → Display personality type + share options

### Key Files

- `src/hooks/useQuiz.ts` — Quiz state machine, screen transitions, localStorage persistence
- `src/lib/match-engine.ts` — Personality matching algorithm (`scoresToGrades`, `matchPersonality`)
- `src/lib/types.ts` — Dimension definitions, weights, algorithm constants
- `src/lib/storage.ts` — Progress/result persistence to localStorage
- `src/app/api/quiz/route.ts` — Fetches questions from DB with i18n translations
- `src/app/api/match/route.ts` — Server-side matching endpoint (backup)
- `src/app/api/events/route.ts` — Event logging (page_view, quiz_start, etc.)
- `src/app/api/results/route.ts` — Test result submission/storage
- `src/app/api/stats/route.ts` — Public stats endpoint (health check)
- `prisma/schema.prisma` — Data models (Question, Option, PersonalityType, SpecialType, TestRecord, EventLog)

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
- **Components**: WelcomeScreen, TestScreen, ResultScreen + shadcn/ui
- **Animations**: Framer Motion for transitions
- **Keyboard shortcuts**: 1-4 keys for quick answering

### State Management

- `useQuiz` hook manages all quiz state (screen, currentQ, dimScores, gateValue, triggerValue, result)
- **Progress Persistence**: Every answer saves to `localStorage['eva-covenant']`
  - Resumes automatically on reload, clears after completion
- **Result History**: Saved to `localStorage['eva-covenant-results']` (max 50 items)

## Development Workflow

### Adding a New Question
1. Add to `prisma/seed.ts` with proper dimCode, order, options
2. Run `npx tsx prisma/seed.ts` to update DB
3. No code changes needed — quiz fetches from API dynamically

### Adding a New Personality Type
1. Add `PersonalityType` record to seed.ts with unique code, vector, and translations
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

## Testing

- **Framework**: Vitest
- **Test files**:
  - `src/lib/match-engine.test.ts` — Algorithm correctness, boundary detection, special triggers
  - `src/lib/analytics.test.ts` — Analytics aggregation
  - `src/lib/share-preview.test.ts` — Share preview generation
- **Run single test**: `npx vitest run src/lib/match-engine.test.ts`

## Cross-Platform Notes

**Development**: macOS ARM (Apple Silicon) | **Production**: Linux Docker x86_64

- SQLite database not committed — always seed via `prisma/seed.ts`
- Test failures on macOS may pass on Linux — trust CI results
- Line endings: enforced LF via `.gitattributes`

## Deployment

- GitHub Actions auto-deploy on push to master → Docker Hub → production server
- Scripts: `scripts/deploy.sh` (deploy/rollback), `scripts/restore-db.sh` (DB restore), `scripts/backup.sh` (auto-backup)
- Docker: data in `./data`, backups in `./backups`, health check at `/api/stats`

## Auto Sync to GitHub

A Stop hook in `.claude/settings.local.json` auto-commits and pushes uncommitted changes at end of each conversation. This ensures the Docker build server can always pull the latest code.

## Known Constraints

1. **SQLite limitations**: No concurrent writes, single-file DB
2. **No auth system**: Admin panel uses simple password (not user accounts)
3. **Client-side matching**: Algorithm runs in browser, not server
4. **No pagination**: Admin panel loads all records (may slow with >10k TestRecords)
5. **Fixed question count**: 30 regular + 1 gate + 0-1 trigger (hardcoded in useQuiz)
