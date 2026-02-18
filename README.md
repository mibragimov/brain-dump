# Brain Dump + AI

Zero-friction capture for scattered thoughts — with AI summaries and an action hub across all dumps.

## What this version includes (BRD-aligned MVP)

- **Free-form capture** with auto-save
- **Per-dump AI organize** (summary, action items, suggested tags)
- **Tags + entity extraction** (hashtags + MVP-lite entity chips)
- **Task layer** on top of dumps
  - Mark done/open
  - Edit due dates
  - Add/remove manual tasks
- **Unified action views**: Today / This week / All
- **Search + filter** across content, summaries, tags, entities
- **Local-first storage** (no account required)
- **Export / import JSON** with conflict handling by latest `updatedAt`
- **PWA-ready manifest**

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- LocalStorage (MVP local-first data)
- MiniMax (optional) for AI analysis

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment

Create `.env.local` for AI features (OpenAI preferred, MiniMax fallback):

```bash
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

# Optional fallback
MINIMAX_API_KEY=your_minimax_key
MINIMAX_MODEL=abab6.5s-chat
```

Without a key, the app falls back to mock AI responses so flows remain testable.

## Data model

Each dump stores:

- `id`
- `content`
- `tags[]`
- `entities[]`
- `createdAt`, `updatedAt`
- `aiSummary`
- `aiActions[]`
- `tasks[]` where each task has:
  - `id`, `label`, `status` (`open|done`), `dueDate`, `source` (`ai|manual`)

## Keyboard shortcuts

- **Cmd/Ctrl + Enter** → AI Organize

## Build

```bash
npm run build
npm start
```

## Notes

This is MVP local-first architecture by design. Cloud sync/collab/cross-dump AI Q&A are intentionally kept for post-MVP phases.
