# 🎥 Loom Demo Presentation Script — Page Pulse Defensible

Use this step-by-step guide to record your 2-minute **Loom video demo** for Digital Heroes Task B submission.

---

## ⏱️ Video Outline (2 Minutes Total)

| Section | Time | What to Show on Screen | What to Say |
| :--- | :--- | :--- | :--- |
| **1. Intro & Live Demo** | 0:00 - 0:45 | Web UI at `http://localhost:3000` | "Hi! This is Page Pulse Defensible. Let me show you how it audits web pages in real-time." |
| **2. Test Suite & Architecture** | 0:45 - 1:20 | Terminal running `npm test` & `lib/parser.js` | "We decoupled the parsing logic into a pure module and wrote unit tests with Jest covering happy paths and failure cases." |
| **3. Self-Critique / Future Changes** | 1:20 - 2:00 | VS Code showing `server.js` or `README.md` | "If I had another day, I would add headless browser support for JavaScript-rendered Single-Page Applications..." |

---

## 🗣️ Word-for-Word Script

### Part 1: Live Application Demo (0:00 - 0:45)
> *"Hello! This is **Page Pulse Defensible**, a web page auditing tool built for the Digital Heroes training task.*
> 
> *Here on the web interface, I can enter any URL, such as `example.com`, and click **Run Audit**. In real time, the tool fetches the target page and generates a clean report displaying:
> 1. HTTP status code (`200 OK`) and server response latency in milliseconds.
> 2. SEO Title and Meta Description tags.
> 3. H1 Heading structure count.
> 4. Image accessibility audit detecting missing `alt` attributes.
> 5. Approximate body text word count.
> 
> *It also handles invalid URLs, timeouts, and non-HTML payloads cleanly without ever crashing."*

### Part 2: Unit Testing & Design Decisions (0:45 - 1:20)
> *"For Task B, I made the tool defensible by decoupling the parsing engine into a pure module in `lib/parser.js`.
> 
> *Let's run `npm test` in the terminal. As you can see, our Jest test suite executes unit tests covering:
> - The **Happy Path** (extracting title, meta, H1s, image alts, and word counts).
> - **Failure Case 1** (graceful handling of empty or null HTML inputs).
> - **Failure Case 2** (parsing non-HTML or raw JSON payloads without crashing)."*

### Part 3: Self-Critique & What I Would Change With Another Day (1:20 - 2:00)
> *"Finally, one part of the code I would change if I had another day is handling **Client-Side Rendered (CSR) Single-Page Applications**.
> 
> *Currently, Cheerio parses static HTML string delivered on initial HTTP GET. However, React or Vue SPAs often return an empty root div initially, populating headings dynamically via JavaScript after load.
> 
> *If I had another day, I would integrate a fallback worker using Puppeteer or Playwright to execute client-side JavaScript when an initial HTML response returns zero headings, ensuring 100% audit accuracy for SPAs. Thank you!"*
