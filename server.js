const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { performance } = require('perf_hooks');
const { parseHtmlReport } = require('./lib/parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Normalizes and validates input URL
 */
function normalizeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return null;
  let trimmed = inputUrl.trim();
  if (trimmed.includes(' ') || trimmed.length > 2000) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    if (!trimmed.includes('.') && !trimmed.startsWith('localhost')) {
      return null;
    }
    trimmed = 'https://' + trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return null;
    }
    return parsed.href;
  } catch (err) {
    return null;
  }
}

/**
 * POST /api/audit
 * Body: { "url": "https://example.com" }
 */
app.post('/api/audit', async (req, res) => {
  const { url: rawUrl } = req.body || {};

  if (!rawUrl) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required.',
      details: 'Please provide a valid web page URL to audit.'
    });
  }

  const validUrl = normalizeUrl(rawUrl);
  if (!validUrl) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format.',
      details: 'The URL provided must be a valid HTTP or HTTPS web address (e.g., https://example.com).'
    });
  }

  const startTime = performance.now();

  try {
    // Axios request with 10s timeout, max content limit, and permissive HTTP status handling
    const response = await axios.get(validUrl, {
      timeout: 10000,
      maxContentLength: 10 * 1024 * 1024,
      headers: {
        'User-Agent': 'PagePulse-Auditor/1.0 (+https://digitalheroesco.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      validateStatus: (status) => status < 600
    });

    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const contentType = response.headers['content-type'] || '';
    const httpStatus = response.status;

    // Handle non-HTML responses gracefully
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return res.status(200).json({
        success: true,
        data: {
          url: validUrl,
          httpStatus,
          responseTimeMs,
          contentType,
          isHtml: false,
          warning: `The target URL returned non-HTML content type (${contentType}). Audit extraction is limited to HTML documents.`,
          title: null,
          metaDescription: null,
          h1Count: 0,
          h1s: [],
          missingAltImageCount: 0,
          missingAltImages: [],
          totalImages: 0,
          wordCount: 0
        }
      });
    }

    // Delegate parsing to pure parser module (lib/parser.js)
    const html = response.data;
    const parsedReport = parseHtmlReport(typeof html === 'string' ? html : String(html));

    return res.status(200).json({
      success: true,
      data: {
        url: validUrl,
        httpStatus,
        responseTimeMs,
        contentType,
        isHtml: true,
        ...parsedReport
      }
    });

  } catch (error) {
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    let statusCode = 500;
    let errorMessage = 'Failed to fetch and audit the target URL.';
    let details = error.message;

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'Request Timeout';
      details = 'The target website took longer than 10 seconds to respond.';
    } else if (error.code === 'ENOTFOUND') {
      statusCode = 502;
      errorMessage = 'DNS Lookup Failed';
      details = 'Could not resolve domain host. Please check if the URL spelling is correct.';
    } else if (error.code === 'ECONNREFUSED') {
      statusCode = 502;
      errorMessage = 'Connection Refused';
      details = 'Target server actively refused the connection attempt.';
    } else if (error.code === 'ERR_UNSUPPORTED_PROTOCOL' || error.code === 'ERR_INVALID_URL') {
      statusCode = 400;
      errorMessage = 'Unsupported or Invalid URL Scheme';
      details = 'Only http:// and https:// URLs are supported.';
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details,
      meta: {
        url: validUrl,
        responseTimeMs
      }
    });
  }
});

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Page Pulse Defensible Auditor',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with EADDRINUSE graceful port fallback
function startServer(portToUse) {
  const server = app.listen(portToUse, () => {
    console.log(`⚡ Page Pulse Defensible Auditor running on http://localhost:${portToUse}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${portToUse} is already in use. Trying fallback port ${portToUse + 1}...`);
      startServer(portToUse + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
