# API Specification: Event-Based PDF Reader with Gate Pattern

## Overview

This specification defines the event-based interaction system for the Alicia PDF Reader, inspired by Diego's Listen project. The system uses a **gate pattern** to decide when user interactions should trigger AI assistance.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ALICIA PDF READER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Viewer     │───▶│ Event Stream │───▶│   AI Gate    │      │
│  │   (PDF.js)   │    │  (JSONL)     │    │  (Filter)    │      │
│  └──────────────┘    └──────────────┘    └──────┬───────┘      │
│         │                                       │                │
│         │                                       ▼                │
│         │                              ┌──────────────┐         │
│         │                              │ AI Analysis  │         │
│         │                              │ (LLM Call)   │         │
│         │                              └──────┬───────┘         │
│         │                                     │                  │
│         ▼                                     ▼                  │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │   Canvas     │◀───────────────────│   Response   │           │
│  │  (Render)    │                    │   Layer      │           │
│  └──────────────┘                    └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. Navigation State

```typescript
interface NavigationState {
  currentPage: number;        // 1-indexed page number
  totalPages: number;         // Total pages in PDF
  scale: number;              // Zoom level (1.0 = 100%)
  viewport: {
    x: number;                // Scroll X position
    y: number;                // Scroll Y position
    width: number;            // Viewport width
    height: number;           // Viewport height
  };
  history: PageHistory[];     // Back/forward navigation stack
}

interface PageHistory {
  page: number;
  viewport: Viewport;
  timestamp: string;          // ISO 8601
}
```

**Actions:**
- `gotoPage(pageNumber: number)` - Jump to specific page
- `skipPages(offset: number)` - Skip forward/backward N pages
- `setScale(scale: number)` - Set zoom level
- `scrollTo(coordinates: { x, y })` - Scroll to position

---

### 2. Event Stream

All user interactions emit structured events:

```typescript
type EventType = 
  | 'navigation'      // Page change, zoom, scroll
  | 'selection'       // Text selection
  | 'dwell'           // Hover > 2 seconds
  | 'highlight'       // Manual highlight action
  | 'draw'            // Annotation drawing
  | 'mark-understood' // User comprehension marker

interface PDFEvent {
  type: EventType;
  timestamp: string;          // ISO 8601
  sessionId: string;          // UUID for session
  page: number;               // Page number
  pdfCoordinates: {           // PDF-native coordinates (72 DPI)
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  viewportCoordinates?: {     // Screen coordinates
    x: number;
    y: number;
  };
  metadata: Record<string, any>; // Event-specific data
}

// Example events:
const selectionEvent: PDFEvent = {
  type: 'selection',
  timestamp: '2026-03-12T10:30:00Z',
  sessionId: 'sess_abc123',
  page: 5,
  pdfCoordinates: { x: 100, y: 200, width: 150, height: 20 },
  metadata: {
    text: 'Alicia estaba empezando a aburrirse...',
    wordCount: 5,
    language: 'es'
  }
};

const dwellEvent: PDFEvent = {
  type: 'dwell',
  timestamp: '2026-03-12T10:30:02Z',
  sessionId: 'sess_abc123',
  page: 5,
  pdfCoordinates: { x: 100, y: 200 },
  metadata: {
    duration: 2500,           // milliseconds
    text: 'Alicia',
    elementType: 'word'
  }
};
```

---

### 3. Gate Pattern

The gate decides when to trigger AI analysis (inspired by Listen):

```typescript
interface GateConfig {
  rules: GateRule[];
  cooldown: number;           // milliseconds between triggers
  maxTriggersPerPage: number;
}

interface GateRule {
  name: string;
  condition: (event: PDFEvent, context: SessionContext) => boolean;
  action: GateAction;
  priority: number;           // Higher = evaluated first
}

type GateAction = 
  | { type: 'explain'; prompt: string }
  | { type: 'translate'; targetLang: string }
  | { type: 'summarize'; maxWords: number }
  | { type: 'define'; dictionary: string };

// Default gate configuration
const defaultGate: GateConfig = {
  rules: [
    {
      name: 'long-dwell',
      condition: (e) => e.type === 'dwell' && e.metadata.duration > 2000,
      action: { type: 'explain', prompt: 'Explain this text in simple terms' },
      priority: 100
    },
    {
      name: 'text-selection',
      condition: (e) => e.type === 'selection' && e.metadata.wordCount > 3,
      action: { type: 'translate', targetLang: 'en' },
      priority: 90
    },
    {
      name: 'rapid-scroll',
      condition: (e, ctx) => ctx.scrollVelocity > 1000, // pixels/second
      action: { type: 'summarize', maxWords: 50 },
      priority: 50
    }
  ],
  cooldown: 5000,             // 5 seconds between AI calls
  maxTriggersPerPage: 3
};
```

---

## Layer Architecture

```
┌─────────────────────────────────────────┐
│         Layer 3: Annotation Canvas      │
│    (Drawing, highlights, notes)         │
│         - Transparent overlay           │
│         - Mouse event capture           │
└─────────────────────────────────────────┘
                   │
                   │ Events
                   ▼
┌─────────────────────────────────────────┐
│         Layer 2: Text Layer             │
│    (Selectable text spans)              │
│         - DOM text elements             │
│         - Coordinate mapping            │
└─────────────────────────────────────────┘
                   │
                   │ Render
                   ▼
┌─────────────────────────────────────────┐
│         Layer 1: PDF Canvas             │
│    (Visual rendering)                   │
│         - PDF.js output                 │
│         - Base display                  │
└─────────────────────────────────────────┘
```

---

## CDP Testability API

Expose these methods for Chrome DevTools Protocol testing:

```typescript
interface PDFTestAPI {
  // Navigation
  gotoPage(page: number): Promise<void>;
  getCurrentPage(): number;
  getTotalPages(): number;
  
  // Content
  getPageText(page?: number): Promise<string>;
  getSelection(): { text: string; coordinates: PDFCoordinates } | null;
  findInDocument(query: string): Promise<SearchResult[]>;
  
  // Events
  getEventStream(): PDFEvent[];
  clearEventStream(): void;
  
  // Annotations
  drawHighlight(coordinates: PDFCoordinates, color?: string): void;
  getAnnotations(): Annotation[];
  
  // Screenshots (for visual regression)
  captureViewport(): Promise<string>; // base64 PNG
  capturePage(page: number): Promise<string>;
  
  // Simulation
  simulateClick(x: number, y: number): void;
  simulateSelect(start: PDFCoordinates, end: PDFCoordinates): void;
  simulateDwell(element: string, duration: number): void;
}

// Expose to window for CDP access
window.pdfTestAPI: PDFTestAPI;
```

---

## Coordinate Systems

```
Screen Coordinates (pixels, top-left origin)
┌────────────────────────────────────────────┐
│                                            │
│    ┌────────────────────────────────┐      │
│    │                                │      │
│    │    PDF Viewport                │      │
│    │    ┌──────────────────────┐    │      │
│    │    │  PDF Coordinates     │    │      │
│    │    │  (points, 72 DPI)    │    │      │
│    │    │                      │    │      │
│    │    │  (0,0) ────────▶     │    │      │
│    │    │   │              (w,0)│    │      │
│    │    │   │                   │    │      │
│    │    │   ▼                   │    │      │
│    │    │  (0,h)             (w,h)│    │      │
│    │    └──────────────────────┘    │      │
│    │                                │      │
│    └────────────────────────────────┘      │
│                                            │
└────────────────────────────────────────────┘

Conversion Functions:
- screenToPDF(x, y): PDFCoordinates
- pdfToScreen(coords): ScreenCoordinates
- applyZoom(coords, scale): ZoomedCoordinates
```

---

## Data Flow: User Highlights Text

```
User Action                    System Response
─────────────────────────────────────────────────────────────
                               
  ┌──────┐                    ┌─────────────┐
  │ User │───▶ select text ──▶│ Text Layer  │
  └──────┘                    └──────┬──────┘
                                     │
                                     │ extract coordinates
                                     ▼
                              ┌─────────────┐
                              │ Map to PDF  │
                              │ coordinates │
                              └──────┬──────┘
                                     │
                                     │ emit event
                                     ▼
                              ┌─────────────┐
                              │ Event:      │
                              │ SELECTION   │
                              └──────┬──────┘
                                     │
                                     │ stream to log
                                     ▼
                              ┌─────────────┐
                              │ Gate Check  │
                              │ (wordCount  │
                              │  > 3?)      │
                              └──────┬──────┘
                                     │
                              ┌──────┴──────┐
                              │             │
                         NO   │             │  YES
                    ┌─────────┤             ├─────────┐
                    │         │             │         │
                    ▼         └─────────────┘         ▼
              ┌─────────┐                      ┌──────────┐
              │  Log    │                      │  Trigger │
              │  only   │                      │  AI API  │
              └─────────┘                      └────┬─────┘
                                                    │
                                                    ▼
                                             ┌──────────┐
                                             │  Display │
                                             │  Response│
                                             │  in Panel│
                                             └──────────┘
```

---

## Implementation Phases

### Phase 1: Core Rendering (This Week)
- [ ] PDF.js integration with text layer
- [ ] Navigation state management
- [ ] Event stream foundation
- [ ] Basic gate (selection only)

### Phase 2: Event Tracking (Next Week)
- [ ] Hover dwell detection
- [ ] Scroll velocity tracking
- [ ] Gate rule engine
- [ ] AI integration (explain/translate)

### Phase 3: Annotations & Testing (Future)
- [ ] Drawing canvas overlay
- [ ] Highlight persistence
- [ ] CDP test suite
- [ ] Visual regression tests

---

## Prototype Available

See `prototype/event-tracking-prototype.html` for a working demonstration of:
- PDF.js rendering with text layer
- Hover dwell tracking with 2-second threshold
- Selection event capture
- Real-time event stream display
- Gate activation visualization

---

## Related Projects

- **Listen** by Diego: github.com/CestDiego/listen - Audio observability with gate pattern
- **PDF.js**: mozilla.github.io/pdf.js - Core PDF rendering library