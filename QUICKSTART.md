# Alicia PDF Reader - Quickstart Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- **Bun** (recommended) or Node.js
- **Chrome/Chromium** (for testing)
- **Git** (for cloning)

### 1. Clone & Setup

```bash
git clone https://github.com/nalediym/alicia-pdf-reader.git
cd alicia-pdf-reader
```

### 2. Start the Development Server

```bash
# Using Bun (recommended)
bun server.ts

# Or using Python
python3 -m http.server 8000
```

The server will start on `http://localhost:8000`

### 3. View the Demo

Open your browser and go to:
- **Smoke Test**: http://localhost:8000/demo/smoke-test.html
- **Event Prototype**: http://localhost:8000/prototype/event-tracking-prototype.html
- **MVP Plan**: http://localhost:8000/docs/mvp-plan.html

---

## 📁 Project Structure

```
alicia-pdf-reader/
├── assets/
│   └── alicia.pdf              # The book (Alicia en el País de las Maravillas)
├── demo/
│   └── smoke-test.html        # PDF.js verification test
├── docs/
│   ├── mvp-plan.html          # Interactive MVP dashboard
│   ├── mvp-plan.pdf           # PDF version of plan
│   ├── API_SPECIFICATION.md   # Detailed API docs with ASCII diagrams
│   └── smoke-test-report.html # Automated test results
├── prototype/
│   └── event-tracking-prototype.html  # Working event demo
├── src/                       # (Your code goes here)
├── server.ts                  # Bun dev server
└── README.md
```

---

## 🎯 Core Concepts

### The Gate Pattern

Inspired by Diego's Listen project, the PDF reader uses a "gate" to decide when to trigger AI:

```javascript
// Example: Gate triggers when user hovers for > 2 seconds
if (event.type === 'dwell' && event.duration > 2000) {
  triggerAI('explain', event.text);
}
```

**Default Gate Rules:**
1. **Long dwell** (> 2s) → Explain text
2. **Text selection** (> 3 words) → Translate
3. **Rapid scroll** → Summarize

### Event Stream

Every interaction emits events:

```javascript
{
  type: 'selection',           // or 'dwell', 'navigation', etc.
  timestamp: '2026-03-12T...',
  page: 5,
  pdfCoordinates: { x, y },    // PDF-native coordinates
  metadata: {
    text: 'Alicia estaba...',
    wordCount: 5
  }
}
```

---

## 🛠️ Development Workflow

### Start Building

1. **Create your main app** in `src/`:
```bash
mkdir -p src/components src/api src/utils
touch src/index.html src/app.js src/api/gate.js
```

2. **Copy the prototype** as a starting point:
```bash
cp prototype/event-tracking-prototype.html src/index.html
```

3. **Modify the gate rules** in `src/api/gate.js`:
```javascript
export const gateConfig = {
  rules: [
    {
      name: 'my-custom-rule',
      condition: (event) => event.type === 'selection',
      action: { type: 'explain' }
    }
  ]
};
```

### Test with Chrome MCP

The app exposes a test API for Chrome DevTools:

```javascript
// In browser console or CDP
window.pdfTestAPI.gotoPage(5);           // Jump to page 5
window.pdfTestAPI.getSelection();        // Get current selection
window.pdfTestAPI.captureViewport();     // Screenshot
window.pdfTestAPI.getEventStream();      // See all events
```

---

## 📖 Common Tasks

### Add a New Gate Rule

Edit your gate configuration:

```javascript
// src/api/gate.js
{
  name: 'highlight-questions',
  condition: (event) => {
    return event.type === 'selection' && 
           event.metadata.text.includes('?');
  },
  action: { 
    type: 'explain',
    prompt: 'Explain this question and possible answers'
  }
}
```

### Track Custom Events

```javascript
// In your component
import { emitEvent } from './utils/events';

function handleCustomAction(data) {
  emitEvent({
    type: 'custom-action',
    page: currentPage,
    metadata: data
  });
}
```

### Get PDF Coordinates from Click

```javascript
document.addEventListener('click', (e) => {
  const rect = pdfCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Convert to PDF coordinates
  const pdfCoords = viewer.convertToPdfCoordinates(x, y);
  console.log('PDF coords:', pdfCoords);
});
```

---

## 🧪 Testing

### Manual Testing

1. Open http://localhost:8000/src/index.html
2. Interact with the PDF (hover, select text)
3. Check the Event Stream panel
4. Verify gate triggers correctly

### Automated Testing with Chrome MCP

```typescript
// Example CDP test
const CDP = require('chrome-remote-interface');

async function testNavigation() {
  const client = await CDP();
  const { Runtime } = client;
  
  // Navigate to page 10
  await Runtime.evaluate({
    expression: 'window.pdfTestAPI.gotoPage(10)'
  });
  
  // Verify page changed
  const { result } = await Runtime.evaluate({
    expression: 'window.pdfTestAPI.getCurrentPage()'
  });
  
  console.assert(result.value === 10, 'Page navigation failed');
  await client.close();
}
```

---

## 🎨 UI Components

### Event Stream Panel

```html
<div class="event-panel">
  <div class="event-stream" id="event-stream"></div>
  <div class="gate-indicator">
    <div class="gate-status" id="gate-status"></div>
    <span>AI Gate: <span id="gate-text">Waiting...</span></span>
  </div>
</div>
```

### PDF Viewer with Layers

```html
<div class="pdf-container">
  <canvas id="pdf-canvas"></canvas>           <!-- Layer 1: PDF -->
  <div class="text-layer"></div>              <!-- Layer 2: Text -->
  <canvas class="annotation-layer"></canvas>  <!-- Layer 3: Drawing -->
</div>
```

---

## 🐛 Troubleshooting

### "Failed to fetch PDF" error

**Problem**: Browser blocks file:// requests
**Solution**: Use the dev server (`bun server.ts`)

### Events not appearing

**Problem**: Event stream not initialized
**Solution**: Check that you're importing the event utilities:
```javascript
import { initEventStream } from './utils/events';
initEventStream();
```

### Gate not triggering

**Problem**: Gate rules not matching
**Solution**: Add logging to check event structure:
```javascript
console.log('Event:', event);
console.log('Condition result:', myCondition(event));
```

---

## 📚 Resources

- **API Specification**: `docs/API_SPECIFICATION.md`
- **MVP Plan**: `docs/mvp-plan.html`
- **Listen Project**: https://github.com/CestDiego/listen
- **PDF.js Docs**: https://mozilla.github.io/pdf.js/

---

## 🤝 Team Workflow

### Naledi
- Owns **render layer** (PDF.js integration, text display)
- Focus: `src/components/PDFViewer.js`, `src/utils/pdf.js`

### Boyfriend
- Owns **interaction layer** (events, gate, AI integration)
- Focus: `src/api/gate.js`, `src/components/EventPanel.js`

### Git Workflow
```bash
# Before starting work
git pull origin master

# Create feature branch
git checkout -b feat/your-feature

# Commit and push
git add .
git commit -m "feat: description"
git push origin feat/your-feature

# Create PR on GitHub
```

---

## ✅ Acceptance Criteria Checklist

Before calling it done, verify:

- [ ] PDF renders page 1 of Alicia book
- [ ] Text selection captures Spanish text
- [ ] Clicking text logs to console
- [ ] Screenshot button captures canvas
- [ ] Event stream displays interactions
- [ ] Gate triggers after 2s hover
- [ ] All changes committed to GitHub

---

## 🎉 Next Steps

1. ✅ Smoke test passed - PDF.js works!
2. 🔄 Build the MVP (3 acceptance criteria)
3. ⏳ Add AI integration (gate → LLM)
4. ⏳ Annotation layer (drawing)
5. ⏳ CDP test suite

**You're ready to build!** Start with `src/index.html` and happy coding! 🚀