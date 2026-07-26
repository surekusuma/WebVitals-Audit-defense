# Page Pulse Defensible 🛡️ — Web Page Auditor (Task B)

> **Built for Digital Heroes Training Task** — [digitalheroesco.com](https://digitalheroesco.com)

**Page Pulse Defensible** is a production-grade, test-verified web auditing engine built for **Digital Heroes Task B**. It extracts HTTP status, response latency, SEO metadata, heading structure, image accessibility attributes, and word count from any target URL.

---

## 📋 Table of Contents

- [Quick Start & Setup](#-quick-start--setup)
- [Unit Test Suite (Requirement A)](#-unit-test-suite-requirement-a)
- [API Contract (Requirement B)](#-api-contract-requirement-b)
- [3 Architectural Design Decisions (Requirement B)](#-3-architectural-design-decisions-requirement-b)
- [Self-Critique & Future Enhancements](#-self-critique--future-enhancements)
- [Loom Demo Walkthrough Script](#-loom-demo-walkthrough-script)

---

## ⚡ Quick Start & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone & navigate to project directory**:
   ```bash
   cd page-pulse-defensible
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Unit Test Suite (Requirement A)

The HTML parsing engine is fully decoupled inside [`lib/parser.js`](lib/parser.js) and covered by unit tests using **Jest**.

Run the unit test suite:
```bash
npm test
```

### Covered Test Scenarios:
1. **Happy Path**: Parses a complete, valid HTML document with `<title>`, `<meta description>`, multiple `<h1>` headers, images with/without `alt` attributes, and body text.
2. **Failure Case 1 (Empty / Malformed Input)**: Gracefully handles `null`, `undefined`, or empty string inputs without throwing unhandled exceptions.
3. **Failure Case 2 (Non-HTML Content / Raw JSON)**: Parses raw JSON strings or plain text without crashing, returning structured fallback fields.
4. **Edge Cases**: Handles HTML missing `<title>` or `<meta>` tags, and verifies word count normalization.

---

## 📖 API Contract (Requirement B)

### `POST /api/audit`

Accepts a JSON payload containing the target `url` and returns a comprehensive page analysis report.

#### Request Body
```json
{
  "url": "https://example.com"
}
```

#### Response (200 OK — Successful Audit)
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/",
    "httpStatus": 200,
    "responseTimeMs": 185,
    "contentType": "text/html; charset=UTF-8",
    "isHtml": true,
    "title": "Example Domain",
    "metaDescription": "This domain is for use in illustrative examples in documents.",
    "h1Count": 1,
    "h1s": [
      "Example Domain"
    ],
    "totalImages": 1,
    "missingAltImageCount": 0,
    "missingAltImages": [],
    "wordCount": 125,
    "isEmpty": false
  }
}
```

#### Error Response (400 Bad Request / 502 Bad Gateway / 504 Gateway Timeout)
```json
{
  "success": false,
  "error": "Invalid URL format.",
  "details": "The URL provided must be a valid HTTP or HTTPS web address (e.g., https://example.com)."
}
```

---

## 📐 3 Architectural Design Decisions (Requirement B)

### Decision 1: Decoupled Pure Parser Module (`lib/parser.js`)
- **Reasoning**: Rather than embedding Cheerio DOM parsing directly inside Express route handlers, the parsing logic is isolated as a pure, deterministic function (`parseHtmlReport`). This enables lightning-fast Jest unit tests without mocking Express HTTP request/response objects or spinning up network listeners.

### Decision 2: Non-Blocking Fetching with Strict 10s Timeout & 10MB Stream Guard
- **Reasoning**: Web scrapers and audit tools querying untrusted remote URLs face resource-exhaustion vectors (hanging connections or giant binary downloads). Using Axios with `timeout: 10000` and `maxContentLength: 10 * 1024 * 1024` guarantees that the backend worker never deadlocks or runs out of memory.

### Decision 3: Permissive HTTP Status Code Handling (`validateStatus: status < 600`)
- **Reasoning**: Traditional HTTP clients throw an exception for HTTP 404 or 500 error codes. However, in a web audit tool, users explicitly want to analyze error pages (e.g., verifying if a custom 404 page has proper title tags or structural H1s). Accepting status codes up to 599 allows Page Pulse to return a full audit report even on failing HTTP pages.

---

## 🛠️ Self-Critique & What I Would Change With Another Day

If given another day to improve this codebase:

> **Headless Browser Execution Fallback for Client-Side Rendered (CSR) Single-Page Applications**:
> 
> *Current Limitation*: Cheerio parses the static HTML string returned by the initial HTTP GET request. Single-Page Applications built with modern frameworks (React, Vue, CSR Next.js) often return an empty `<div id="root"></div>` on initial payload, rendering headings and text dynamically via JavaScript execution.
> 
> *Proposed Solution*: Introduce a fallback worker using `Puppeteer` or `Playwright`. If `lib/parser.js` detects `wordCount < 10` and `h1Count === 0` on an initial HTML response, automatically queue a headless browser instance to execute client-side scripts before passing the rendered DOM to `lib/parser.js`.

---

## 📽️ Loom Demo Walkthrough Script

A ready-to-record presentation script is available in [`LOOM_DEMO_SCRIPT.md`](LOOM_DEMO_SCRIPT.md).
