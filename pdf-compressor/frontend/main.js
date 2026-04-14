const API_URL = `${window.location.origin}/api`;

let originalFile = null;
let compressedFile = null;
let isCompressing = false;
let compressionEstimates = [];

const pdfInput = document.getElementById('pdfFileInput');
const uploadArea = document.getElementById('uploadArea');
const browseBtn = document.getElementById('browseBtn');
const fileInfoDiv = document.getElementById('fileInfo');
const compressionOptionsDiv = document.getElementById('compressionOptions');
const compressBtn = document.getElementById('compressBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const originalSizeSpan = document.getElementById('originalSize');
const compressedSizeSpan = document.getElementById('compressedSize');
const reductionSpan = document.getElementById('reduction');
const downloadBtn = document.getElementById('downloadBtn');
const compressionLevelSelect = document.getElementById('compressionLevel');
let estimateSummary = document.getElementById('estimateSummary');
let estimateGrid = document.getElementById('estimateGrid');

function ensureEstimateElements() {
  if (!compressionOptionsDiv || !compressBtn) {
    return;
  }

  if (!estimateSummary) {
    estimateSummary = document.createElement('div');
    estimateSummary.id = 'estimateSummary';
    estimateSummary.className = 'file-info';
    estimateSummary.style.display = 'none';
    compressionOptionsDiv.insertBefore(estimateSummary, compressBtn);
  }

  if (!estimateGrid) {
    estimateGrid = document.createElement('div');
    estimateGrid.id = 'estimateGrid';
    estimateGrid.className = 'result-info';
    estimateGrid.style.display = 'none';
    estimateGrid.style.marginBottom = '18px';
    compressionOptionsDiv.insertBefore(estimateGrid, compressBtn);
  }
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 Bytes';
  }

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
}

function setUIVisibility(upload, options, progress, result) {
  if (uploadArea) uploadArea.style.display = upload ? 'block' : 'none';
  if (compressionOptionsDiv) compressionOptionsDiv.style.display = options ? 'block' : 'none';
  if (progressContainer) progressContainer.style.display = progress ? 'block' : 'none';
  if (resultSection) resultSection.style.display = result ? 'block' : 'none';
}

function updateProgress(percent, message) {
  if (!progressBar || !progressText) {
    return;
  }

  const safePercent = Math.min(100, Math.max(0, percent));
  progressBar.style.width = `${safePercent}%`;
  progressBar.textContent = `${safePercent}%`;
  progressText.textContent = message || `Processing... ${safePercent}%`;
}

function resetTool() {
  originalFile = null;
  compressedFile = null;
  compressionEstimates = [];

  if (pdfInput) {
    pdfInput.value = '';
  }

  if (fileInfoDiv) {
    fileInfoDiv.style.display = 'none';
    fileInfoDiv.innerHTML = '';
  }

  ensureEstimateElements();
  if (estimateSummary) {
    estimateSummary.style.display = 'none';
    estimateSummary.innerHTML = '';
  }
  if (estimateGrid) {
    estimateGrid.style.display = 'none';
    estimateGrid.innerHTML = '';
  }

  setUIVisibility(true, false, false, false);
}

function setCompressionOptionLabels() {
  if (!compressionLevelSelect) {
    return;
  }

  const labels = {
    low: '🟢 Low - Best quality',
    medium: '🟡 Medium - Balanced',
    high: '🔴 High - Strongest compression',
    extreme: '⚫ Extreme - Maximum compression'
  };

  Array.from(compressionLevelSelect.options).forEach((option) => {
    option.textContent = labels[option.value] || option.textContent;
  });
}

function renderEstimateCards() {
  ensureEstimateElements();
  if (!estimateSummary || !estimateGrid || !compressionEstimates.length) {
    return;
  }

  const selectedLevel = compressionLevelSelect.value;
  const selectedEstimate =
    compressionEstimates.find((entry) => entry.level === selectedLevel) || compressionEstimates[0];

  estimateSummary.style.display = 'block';
  estimateSummary.innerHTML = `
    <strong>Expected size for ${selectedLevel}:</strong> ${formatFileSize(selectedEstimate.compressedSize)}<br>
    <strong>Expected reduction:</strong> ${selectedEstimate.reductionPercent}%<br>
    <small>${selectedEstimate.message}</small>
  `;

  estimateGrid.style.display = 'block';
  estimateGrid.innerHTML = compressionEstimates
    .map((entry) => {
      const active = entry.level === selectedLevel;
      return `
        <div class="result-row${active ? ' highlight' : ''}" style="display:block; margin-bottom:10px; padding:12px; border-radius:10px; border:${active ? '2px solid #667eea' : '1px solid #e2e8f0'};">
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
            <strong style="text-transform:capitalize;">${entry.level} Compression</strong>
            <span style="font-weight: 600;">Est. Size: ${formatFileSize(entry.compressedSize)}</span>
          </div>
          <div style="margin-top:6px; font-size: 0.95rem; color:${entry.optimized ? '#2f855a' : '#dd6b20'};">
            Size will reduce by <strong>${entry.reductionPercent}%</strong>
          </div>
        </div>
      `;
    })
    .join('') + '<div id="estimateInlineAd" class="ad-container ad-inline" style="margin-top: 15px;"></div>';
}

async function estimateCompressionOptions() {
  if (!originalFile) {
    return;
  }

  ensureEstimateElements();
  estimateSummary.style.display = 'none';
  estimateSummary.innerHTML = '';
  estimateGrid.style.display = 'none';

  try {
    const formData = new FormData();
    formData.append('file', originalFile);

    const response = await fetch(`${API_URL}/compress/estimate`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let message = 'Could not estimate compression.';
      try {
        const errorData = await response.json();
        message = errorData.error || message;
      } catch (error) {
        // Ignore parse issues.
      }
      throw new Error(message);
    }

    const data = await response.json();
    compressionEstimates = Array.isArray(data.estimates) ? data.estimates : [];
    renderEstimateCards();
  } catch (error) {
    compressionEstimates = [];
    estimateSummary.style.display = 'block';
    estimateSummary.innerHTML = `<strong>Estimate unavailable:</strong> ${error.message}`;
    estimateGrid.style.display = 'none';
  }
}

function handleFileUpload(file) {
  if (!file || file.type !== 'application/pdf') {
    alert('Please select a valid PDF file.');
    return;
  }

  if (file.size > 6 * 1024 * 1024) {
    alert('File is too large for the cloud version. The maximum size on Netlify is 6 MB. Please try a smaller file.');
    return;
  }

  originalFile = file;
  compressedFile = null;

  if (fileInfoDiv) {
    fileInfoDiv.innerHTML = `
      <strong>Selected:</strong> ${file.name}<br>
      <strong>Size:</strong> ${formatFileSize(file.size)}
    `;
    fileInfoDiv.style.display = 'block';
  }

  setUIVisibility(false, true, false, false);
  estimateCompressionOptions();
}

async function compressPDF() {
  if (!originalFile || isCompressing) {
    return;
  }

  isCompressing = true;
  compressBtn.disabled = true;
  compressBtn.textContent = 'Compressing...';
  setUIVisibility(false, false, true, false);
  updateProgress(5, 'Preparing file...');

  try {
    const formData = new FormData();
    formData.append('file', originalFile);
    formData.append('level', compressionLevelSelect.value);

    updateProgress(25, 'Uploading PDF...');

    const response = await fetch(`${API_URL}/compress`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let message = 'Compression failed.';
      try {
        const errorData = await response.json();
        message = errorData.error || message;
      } catch (error) {
        // Ignore JSON parsing issues.
      }
      throw new Error(message);
    }

    updateProgress(75, 'Finalizing file...');

    const blob = await response.blob();
    const originalSize = Number(response.headers.get('X-Compression-Original-Size')) || originalFile.size;
    const compressedSize = Number(response.headers.get('X-Compression-Compressed-Size')) || blob.size;
    const reduction = response.headers.get('X-Compression-Reduction') || '0.0';
    const optimized = response.headers.get('X-Compression-Optimized') === 'true';
    const message = decodeURIComponent(
      response.headers.get('X-Compression-Message') || 'PDF processed successfully.'
    );

    compressedFile = blob;
    originalSizeSpan.textContent = formatFileSize(originalSize);
    compressedSizeSpan.textContent = formatFileSize(compressedSize);

    reductionSpan.innerHTML = optimized
      ? `
        <span style="color: #48bb78; font-size: 1.2rem; font-weight: bold;">${reduction}% reduction</span>
        <br><small>${message}</small>
      `
      : `
        <span style="color: #dd6b20; font-size: 1.05rem; font-weight: bold;">0.0% reduction</span>
        <br><small>${message}</small>
      `;

    updateProgress(100, 'Compression complete.');
    await new Promise((resolve) => setTimeout(resolve, 250));
    setUIVisibility(false, false, false, true);
  } catch (error) {
    console.error('Compression error:', error);
    alert(error.message || 'Compression failed. Please try again.');
    resetTool();
  } finally {
    compressBtn.disabled = false;
    compressBtn.textContent = 'Start Compression';
    isCompressing = false;
  }
}

function downloadPDF() {
  if (!compressedFile || !originalFile) {
    alert('Please compress a PDF first.');
    return;
  }

  const url = URL.createObjectURL(compressedFile);
  const link = document.createElement('a');
  link.href = url;
  link.download = `compressed_${originalFile.name}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function loadLogo() {
  const logoImg = document.getElementById('siteLogo');
  const logoText = document.querySelector('.logo h1');
  if (!logoImg) return;

  try {
    const response = await fetch(`${API_URL}/logo?t=${Date.now()}`);
    const data = await response.json();
    
    if (data.success && data.logo) {
      let baseUrl = window.location.origin;
      if (API_URL.startsWith('http')) {
        baseUrl = new URL(API_URL).origin;
      }

      const logoUrl = data.logo.startsWith('http') 
        ? data.logo 
        : `${baseUrl}${data.logo}`;

      // Pre-load to avoid flicker
      const tempImg = new Image();
      tempImg.onload = () => {
        logoImg.src = tempImg.src;
        logoImg.style.display = 'inline-block';
        logoImg.style.opacity = '1';
        if (logoText) logoText.style.marginLeft = '8px';
      };
      tempImg.onerror = () => {
        logoImg.style.display = 'none';
        if (logoText) logoText.style.marginLeft = '0';
      };
      
      tempImg.src = logoUrl + `?t=${Date.now()}`;
    } else {
      logoImg.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading logo:', error);
    if (logoImg) logoImg.style.display = 'none';
  }
}

async function loadAndRenderAds() {
  try {
    const response = await fetch(`${API_URL}/ads`);
    const data = await response.json();

    if (!data.success || !data.ads) {
      return;
    }

    const adSlots = data.ads;
    Object.keys(adSlots).forEach((position) => {
      const adCode = adSlots[position];
      if (!adCode) return;

      // The ID in HTML should now match the position key from backend
      const container = document.getElementById(position);
      if (!container) return;

      container.innerHTML = `
        <div class="ad-label">Advertisement</div>
        <div class="ad-content-wrapper">
          ${adCode}
        </div>
      `;
      container.style.display = 'block';
    });
  } catch (error) {
    console.error('Error loading ads:', error);
  }
}

if (pdfInput) {
  pdfInput.addEventListener('change', (event) => {
    const [file] = event.target.files;
    if (file) {
      handleFileUpload(file);
    }
    pdfInput.value = '';
  });
}

if (browseBtn) {
  browseBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    pdfInput.click();
  });
}

if (uploadArea) {
  uploadArea.addEventListener('click', (event) => {
    if (browseBtn && (event.target === browseBtn || browseBtn.contains(event.target))) {
      return;
    }
    if (pdfInput) {
      pdfInput.click();
    }
  });

  uploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f7fafc';
  });

  uploadArea.addEventListener('dragleave', (event) => {
    event.preventDefault();
    uploadArea.style.borderColor = '#e2e8f0';
    uploadArea.style.background = 'transparent';
  });

  uploadArea.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadArea.style.borderColor = '#e2e8f0';
    uploadArea.style.background = 'transparent';

    const [file] = event.dataTransfer.files;
    if (file) {
      handleFileUpload(file);
    }
  });
}

if (compressBtn) {
  compressBtn.addEventListener('click', compressPDF);
}

if (compressionLevelSelect) {
  compressionLevelSelect.addEventListener('change', () => {
    if (compressionEstimates.length) {
      renderEstimateCards();
    }
  });
}

if (downloadBtn) {
  downloadBtn.addEventListener('click', downloadPDF);
}

setCompressionOptionLabels();
ensureEstimateElements();
window.resetTool = resetTool;

setUIVisibility(true, false, false, false);
document.addEventListener('DOMContentLoaded', () => {
  loadAndRenderAds();
  loadLogo();
  initHamburgerMenu();
});

// ===== HAMBURGER / MOBILE NAV =====
function initHamburgerMenu() {
  const btn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');
  if (!btn || !navLinks) return;

  // Create overlay backdrop
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  function openNav() {
    navLinks.classList.add('open');
    btn.classList.add('open');
    overlay.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navLinks.classList.remove('open');
    btn.classList.remove('open');
    overlay.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    navLinks.classList.contains('open') ? closeNav() : openNav();
  });

  overlay.addEventListener('click', closeNav);

  // Close nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}
