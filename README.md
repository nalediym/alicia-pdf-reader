# Alicia PDF Reader

A PDF reader built for reading *Alicia en el País de las Maravillas* with text extraction and screenshot capabilities.

## Project Overview

This is a Tiger Mom-disciplined MVP project focused on one thing: proving PDF.js can render a Spanish book and extract text from it.

## Repository Structure

```
alicia-pdf-reader/
├── assets/
│   └── alicia.pdf              # The book (Alicia en el País de las Maravillas)
├── docs/
│   ├── mvp-plan.html          # Interactive MVP planning dashboard
│   ├── mvp-plan.pdf           # PDF version of the plan
│   └── interview-orchestration.html  # Stakeholder interview system
├── demo/
│   └── smoke-test.html        # PDF.js smoke test
├── src/
│   └── (MVP implementation will go here)
└── README.md
```

## Acceptance Criteria

1. **Render Page 1** — Browser loads and renders page 1 of the Alicia PDF
2. **Click to Extract** — Clicking any paragraph logs Spanish text to console
3. **Screenshot Capture** — Button captures canvas and displays the image

## Tech Stack

- **PDF.js** (pdfjs-dist) — PDF rendering engine
- **Vanilla JavaScript** — No frameworks, keep it simple
- **HTML Canvas** — For rendering and screenshots

## Team Split

- **Naledi** — Owns the render layer (PDF.js initialization, text display)
- **Boyfriend** — Owns the interaction layer (click handlers, screenshots)

## Phase

Phase 0 (Spark) — Ship the dumbest possible version that works.

## Shiny Things Box

Captured for later:
- Phase 2: "Chat with PDFs" via AI integration
- Phase 1: Annotation overlay (pencil/ink)
- Phase 4: RAG/vector DB for large docs
- Future: Multi-page navigation, search, bookmarks

## Quick Start

1. Open `demo/smoke-test.html` to verify PDF.js works
2. Check `docs/mvp-plan.html` for the full plan
3. Start building in `src/`

## License

Private project for learning and collaboration.
