document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const auditForm = document.getElementById('auditForm');
  const urlInput = document.getElementById('urlInput');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const iconArrow = submitBtn.querySelector('.icon-arrow');
  const spinner = submitBtn.querySelector('.spinner');

  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const errorDetails = document.getElementById('errorDetails');
  const dismissErrorBtn = document.getElementById('dismissErrorBtn');

  const resultsDashboard = document.getElementById('resultsDashboard');
  const reportTargetUrl = document.getElementById('reportTargetUrl');
  const reportContentType = document.getElementById('reportContentType');
  const copyJsonBtn = document.getElementById('copyJsonBtn');
  const newAuditBtn = document.getElementById('newAuditBtn');

  // Stat Elements
  const statStatus = document.getElementById('statStatus');
  const statStatusLabel = document.getElementById('statStatusLabel');
  const statResponseTime = document.getElementById('statResponseTime');
  const statSpeedLabel = document.getElementById('statSpeedLabel');
  const statH1Count = document.getElementById('statH1Count');
  const statH1Label = document.getElementById('statH1Label');
  const statMissingAltCount = document.getElementById('statMissingAltCount');
  const statAltLabel = document.getElementById('statAltLabel');
  const statWordCount = document.getElementById('statWordCount');

  // Detail Section Elements
  const valTitle = document.getElementById('valTitle');
  const valMetaDesc = document.getElementById('valMetaDesc');
  const h1ListContainer = document.getElementById('h1ListContainer');
  const h1Badge = document.getElementById('h1Badge');
  const imagesAuditContainer = document.getElementById('imagesAuditContainer');
  const imagesBadge = document.getElementById('imagesBadge');
  const jsonPayloadView = document.getElementById('jsonPayloadView');
  const toggleJsonBtn = document.getElementById('toggleJsonBtn');

  let currentRawJson = null;

  // Event Listeners
  auditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (url) runAudit(url);
  });

  // Quick sample buttons
  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleUrl = chip.getAttribute('data-url');
      urlInput.value = sampleUrl;
      runAudit(sampleUrl);
    });
  });

  dismissErrorBtn.addEventListener('click', () => {
    errorState.classList.add('hidden');
    urlInput.focus();
  });

  newAuditBtn.addEventListener('click', () => {
    resultsDashboard.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    urlInput.focus();
  });

  toggleJsonBtn.addEventListener('click', () => {
    const isCollapsed = jsonPayloadView.classList.contains('collapsed');
    if (isCollapsed) {
      jsonPayloadView.classList.remove('collapsed');
      toggleJsonBtn.textContent = 'Collapse';
    } else {
      jsonPayloadView.classList.add('collapsed');
      toggleJsonBtn.textContent = 'Expand';
    }
  });

  copyJsonBtn.addEventListener('click', () => {
    if (!currentRawJson) return;
    navigator.clipboard.writeText(JSON.stringify(currentRawJson, null, 2))
      .then(() => {
        const originalText = copyJsonBtn.innerHTML;
        copyJsonBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => { copyJsonBtn.innerHTML = originalText; }, 2000);
      })
      .catch(() => alert('Failed to copy JSON'));
  });

  /**
   * Triggers API audit call
   */
  async function runAudit(targetUrl) {
    showLoading();

    try {
      // Support opening index.html directly as a local file (file://)
      const apiEndpoint = (window.location.protocol === 'file:' || !window.location.host)
        ? 'http://localhost:3000/api/audit'
        : '/api/audit';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      const json = await response.json();
      currentRawJson = json;

      if (!response.ok || !json.success) {
        showError(
          json.error || 'Audit Failed',
          json.details || 'Unable to audit the requested URL.',
          json.meta ? `Response Time: ${json.meta.responseTimeMs}ms` : null
        );
        return;
      }

      renderResults(json.data);

    } catch (err) {
      showError(
        'Network / Server Error',
        'Could not connect to the Page Pulse audit server. Make sure the backend service is running.',
        err.message
      );
    } finally {
      hideLoading();
    }
  }

  /**
   * Renders successful audit data
   */
  function renderResults(data) {
    errorState.classList.add('hidden');
    resultsDashboard.classList.remove('hidden');

    // Header info
    reportTargetUrl.textContent = data.url;
    reportContentType.innerHTML = `<i class="fa-solid fa-file-code"></i> ${data.contentType || 'text/html'}`;

    // 1. HTTP Status
    const status = data.httpStatus || 200;
    statStatus.textContent = status;
    statStatus.className = 'stat-value ' + getStatusClass(status);
    statStatusLabel.textContent = getStatusDescription(status);

    // 2. Response Time
    statResponseTime.innerHTML = `${data.responseTimeMs} <span class="stat-unit">ms</span>`;
    statSpeedLabel.textContent = getSpeedLabel(data.responseTimeMs);

    // 3. H1 Count
    const h1Count = data.h1Count || 0;
    statH1Count.textContent = h1Count;
    if (h1Count === 1) {
      statH1Label.textContent = 'Optimal: Exactly 1 H1 tag';
    } else if (h1Count === 0) {
      statH1Label.textContent = 'Warning: Missing H1 tag';
    } else {
      statH1Label.textContent = `Multiple H1 tags (${h1Count})`;
    }

    // 4. Missing Alt Images
    const missingAlts = data.missingAltImageCount || 0;
    const totalImgs = data.totalImages || 0;
    statMissingAltCount.textContent = missingAlts;
    if (missingAlts > 0) {
      statMissingAltCount.className = 'stat-value status-4xx';
      statAltLabel.textContent = `${missingAlts} missing alt of ${totalImgs} images`;
    } else {
      statMissingAltCount.className = 'stat-value status-2xx';
      statAltLabel.textContent = `100% compliant (${totalImgs} total images)`;
    }

    // 5. Word Count
    statWordCount.textContent = data.wordCount ? data.wordCount.toLocaleString() : '0';

    // Detailed SEO Info
    valTitle.textContent = data.title ? data.title : '(No <title> tag found on page)';
    valTitle.style.color = data.title ? 'var(--text-main)' : 'var(--text-dim)';

    valMetaDesc.textContent = data.metaDescription ? data.metaDescription : '(No meta description tag present)';
    valMetaDesc.style.color = data.metaDescription ? 'var(--text-main)' : 'var(--text-dim)';

    // H1 List
    h1Badge.textContent = `${h1Count} Found`;
    if (data.h1s && data.h1s.length > 0) {
      h1ListContainer.innerHTML = data.h1s.map((h1Text, i) => `
        <div class="h1-item">
          <span class="h1-num">H1 #${i + 1}</span>
          <span>${escapeHtml(h1Text)}</span>
        </div>
      `).join('');
    } else {
      h1ListContainer.innerHTML = `<p class="empty-list-msg">No H1 headers detected in HTML body.</p>`;
    }

    // Image Alt Audit Details
    imagesBadge.textContent = missingAlts > 0 ? `${missingAlts} Issues` : 'All Good';
    if (missingAlts > 0 && data.missingAltImages && data.missingAltImages.length > 0) {
      imagesAuditContainer.innerHTML = data.missingAltImages.map(img => `
        <div class="image-issue-item">
          <div class="image-issue-info">
            <span class="issue-tag">Missing Alt</span>
            <span class="image-src" title="${escapeHtml(img.src)}">Image #${img.index}: ${escapeHtml(img.src)}</span>
          </div>
        </div>
      `).join('');
      if (missingAlts > data.missingAltImages.length) {
        imagesAuditContainer.innerHTML += `<p class="empty-list-msg">Showing top ${data.missingAltImages.length} missing alt images of ${missingAlts} total.</p>`;
      }
    } else {
      imagesAuditContainer.innerHTML = `
        <div class="no-issues-box">
          <i class="fa-solid fa-circle-check"></i>
          <span>Great news! All ${totalImgs} image(s) on this page have alt attributes defined.</span>
        </div>
      `;
    }

    // JSON Code View
    jsonPayloadView.querySelector('code').textContent = JSON.stringify(data, null, 2);

    // Smooth scroll to results
    resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Helpers
  function showLoading() {
    resultsDashboard.classList.add('hidden');
    errorState.classList.add('hidden');
    loadingState.classList.remove('hidden');

    submitBtn.disabled = true;
    btnText.textContent = 'Auditing...';
    iconArrow.classList.add('hidden');
    spinner.classList.remove('hidden');
  }

  function hideLoading() {
    loadingState.classList.add('hidden');
    submitBtn.disabled = false;
    btnText.textContent = 'Run Audit';
    iconArrow.classList.remove('hidden');
    spinner.classList.add('hidden');
  }

  function showError(title, message, details = null) {
    resultsDashboard.classList.add('hidden');
    errorState.classList.remove('hidden');
    
    errorTitle.textContent = title;
    errorMessage.textContent = message;

    if (details) {
      errorDetails.textContent = details;
      errorDetails.classList.remove('hidden');
    } else {
      errorDetails.classList.add('hidden');
    }

    errorState.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function getStatusClass(status) {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    return 'status-5xx';
  }

  function getStatusDescription(status) {
    const codes = {
      200: '200 OK — Successful Response',
      201: '201 Created',
      301: '301 Moved Permanently',
      302: '302 Found (Redirect)',
      400: '400 Bad Request',
      401: '401 Unauthorized',
      403: '403 Forbidden',
      404: '404 Not Found',
      500: '500 Internal Server Error',
      502: '502 Bad Gateway',
      503: '503 Service Unavailable',
      504: '504 Gateway Timeout'
    };
    return codes[status] || `HTTP Status Code ${status}`;
  }

  function getSpeedLabel(ms) {
    if (ms < 300) return '⚡ Super fast latency';
    if (ms < 800) return '🚀 Fast response';
    if (ms < 2000) return '⏳ Moderate response time';
    return '🐢 Slow response time';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
