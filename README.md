# Brain Dump + AI

Just type everything in your head. Let AI help organize.

## Features

- **Free-form typing** - Dump anything in your head without structure
- **Auto-save** - Your work is saved automatically
- **AI Analysis** - Click "AI Organize" to get:
  - Summary of your dump
  - Actionable items
  - Relevant tags
- **Hashtag support** - Use #tags anywhere in your text
- **Search** - Find past dumps by content or tags
- **Export/Import** - Backup your data as JSON
- **Expandable entries** - Click to see full dump with AI suggestions

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- MiniMax AI (optional)

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local` for AI features:

```bash
MINIMAX_API_KEY=your_api_key_here
```

Get a free API key at https://platform.minimax.chat

## AI Feature

The AI feature is optional. Without an API key, it provides basic suggestions. With a MiniMax API key, you get full AI-powered organization.

## Build

```bash
npm run build
npm start
```

## Data Storage

All data is stored in your browser's localStorage. Use Export to create backups.
