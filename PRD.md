# Brain Dump + AI — Product Requirements Document (PRD)

## 1. Overview

**Project Name:** Brain Dump + AI  
**Type:** Web Application (PWA-ready)  
**Core Functionality:** A free-form note-taking app where users can dump any thought in their head, and AI helps organize, summarize, and extract actionable items from the text.  
**Target Users:** Professionals, students, and anyone who needs a low-friction way to capture thoughts and turn them into organized notes.

---

## 2. Problem Statement

- People have fleeting thoughts and ideas that get lost if not captured immediately
- Traditional note-taking apps demand structure (folders, tags, titles) upfront — creating friction
- Later, users struggle to review and actionize their raw notes

---

## 3. Goals

1. **Zero-friction capture** — Type anything, anytime, without setup
2. **Automatic organization** — AI summarizes and extracts action items
3. **Discoverability** — Search and filter past dumps by content or tags
4. **Data ownership** — Local-first storage with easy export/import

---

## 4. User Stories

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| 1 | User | Type freely without titles/structure | I can dump thoughts instantly |
| 2 | User | Have my work auto-saved | I never lose what I typed |
| 3 | User | Click a button to get AI analysis | I understand and can action my dump |
| 4 | User | Use #hashtags anywhere | I can categorize without extra steps |
| 5 | User | Search past dumps by keyword or tag | I can find relevant thoughts quickly |
| 6 | User | Export my data as JSON | I can backup or migrate my data |
| 7 | User | Import a JSON backup | I can restore my data |
| 8 | User | Expand a dump to see full content + AI output | I can review in context |

---

## 5. Functional Requirements

### 5.1 Core Features

#### F1: Free-Form Editor
- Large text area for typing without title/format requirements
- Placeholder text encourages immediate use
- Character/word count display (optional)

#### F2: Auto-Save
- Content saved to localStorage on every keystroke (debounced 500ms)
- Visual indicator shows save status ("Saved" / "Saving...")

#### F3: AI Organization (Analyze Button)
- Triggered via "AI Organize" button
- Returns:
  - **Summary** — 2-3 sentence recap
  - **Action Items** — List of actionable tasks extracted
  - **Tags** — Suggested hashtags (merged with existing)
- Loading state while processing
- Graceful fallback without API key (basic suggestions)

#### F4: Hashtag Support
- Detect `#tag` patterns anywhere in text
- Parse and store tags separately
- Display tags as clickable chips

#### F5: Search
- Full-text search across all dumps
- Filter by tags
- Results highlight matching text

#### F6: Data Management
- **Export:** Download all dumps as JSON file
- **Import:** Upload JSON to restore/merge data
- Data structure per entry:
  ```json
  {
    "id": "uuid",
    "content": "string",
    "tags": ["string"],
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "aiSummary": "string | null",
    "aiActions": ["string"] | null
  }
  ```

#### F7: Entry List / History
- List view of past dumps (newest first)
- Preview shows first ~100 chars + tags
- Click to expand full content + AI output
- Delete option per entry

### 5.2 UI/UX Requirements

- **Mobile-first design** — Works well on phone screens
- **Dark/Light mode** — System preference detection
- **Keyboard shortcuts:**
  - `Cmd/Ctrl + Enter` — Trigger AI analysis
  - `Cmd/Ctrl + S` — Manual save (even though auto-save exists)
- **Minimalist aesthetic** — Focus on content, not chrome

### 5.3 Technical Constraints

- **Storage:** Browser localStorage (max ~5-10MB)
- **API:** MiniMax AI (optional — app works without it)
- **No backend required** — Fully client-side

---

## 6. Non-Functional Requirements

| Requirement | Description |
|-------------|-------------|
| Performance | Page load < 2s, input latency < 100ms |
| Offline | Works fully offline (except AI feature) |
| Accessibility | WCAG 2.1 AA — keyboard nav, screen reader support |
| Browser Support | Chrome, Firefox, Safari, Edge (latest 2 versions) |

---

## 7. Future Considerations (Out of Scope v1)

- [ ] Cloud sync / account system
- [ ] Collaboration features
- [ ] Rich text editing (markdown)
- [ ] Mobile native app (iOS/Android)
- [ ] Integration with task managers (Notion, Todoist, etc.)

---

## 8. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Storage | localStorage |
| AI | MiniMax API (optional) |

---

## 9. UI Mockup (Text Representation)

```
┌─────────────────────────────────────┐
│  🧠 Brain Dump + AI         [☀️][⚙️]│
├─────────────────────────────────────┤
│                                     │
│  What's on your mind?               │
│  __________________________________ │
│  │                                  │ │
│  │                                  │ │
│  │                                  │ │
│  │                                  │ │
│  └__________________________________ │ │
│                                     │
│  [#tags appear here]                │
│                                     │
│  [💾 Saved]  [🤖 AI Organize]       │
│                                     │
├─────────────────────────────────────┤
│  Past Dumps                         │
│  ─────────────────                  │
│  📝 2024-02-18 10:30               │
│     "Ideas for the new project..."  │
│     #ideas #project                 │
│                                     │
│  📝 2024-02-17 09:15               │
│     "Meeting notes with team..."    │
│     #meeting #team                  │
└─────────────────────────────────────┘
```

---

## 10. Success Metrics (v1)

- [ ] User can create, view, edit, delete dumps
- [ ] Auto-save works reliably across page refreshes
- [ ] AI analysis returns summary + actions + tags (with API key)
- [ ] Search returns relevant results
- [ ] Export produces valid JSON; Import restores data
- [ ] No critical console errors on Chrome/Firefox/Safari
- [ ] Lighthouse accessibility score > 90

---

## 11. Open Questions

1. **Should AI analysis run on each save or only on-demand?** → *On-demand (button click) to avoid API costs*
2. **How to handle localStorage quota exceeded?** → *Warn user, suggest export*
3. **Versioning?** → *v1.0.0 as MVP, semantic versioning thereafter*

---

*Document Version: 1.0*  
*Last Updated: 2026-02-18*
