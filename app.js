/**
 * Tra Cứu Giá Gói Thay Lõi Lọc Nước
 * Kết nối Firebase Cloud Firestore & Tích hợp Quét QR / Barcode
 */

// Firebase Firestore Config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA_FevBrpgE6R1YVbL321BeuX5J8v0Su00",
  projectId: "crm-43751-71e4b",
  baseUrl: "https://firestore.googleapis.com/v1/projects/crm-43751-71e4b/databases/(default)/documents/tra_cuu_loi_loc"
};

// Global State
const State = {
  products: [],
  packages: {},
  schedule: {},
  metadata: null,
  activeProduct: null,
  activeBrandFilter: 'ALL',
  scannerInstance: null,
  isScanning: false,
  selectedCameraId: null
};

// DOM Elements
const DOM = {
  searchInput: document.getElementById('productSearchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  btnStartScan: document.getElementById('btnStartScan'),
  suggestionsDropdown: document.getElementById('suggestionsDropdown'),
  sampleChips: document.querySelectorAll('.chip'),
  brandPills: document.querySelectorAll('.brand-pill'),
  
  // Results
  emptyState: document.getElementById('emptyState'),
  productResultCard: document.getElementById('productResultCard'),
  resProductCode: document.getElementById('resProductCode'),
  resProductBrand: document.getElementById('resProductBrand'),
  resProductCategory: document.getElementById('resProductCategory'),
  resProductWarranty: document.getElementById('resProductWarranty'),
  resProductName: document.getElementById('resProductName'),
  resProductPrice: document.getElementById('resProductPrice'),
  resProductPriceRange: document.getElementById('resProductPriceRange'),
  resPackageName: document.getElementById('resPackageName'),
  resPackageStatus: document.getElementById('resPackageStatus'),
  noPackageAlert: document.getElementById('noPackageAlert'),
  pricingGridSection: document.getElementById('pricingGridSection'),

  // 4 Years
  resY1Cores: document.getElementById('resY1Cores'),
  resY1Price: document.getElementById('resY1Price'),
  resY1Avg: document.getElementById('resY1Avg'),

  resY2Cores: document.getElementById('resY2Cores'),
  resY2Price: document.getElementById('resY2Price'),
  resY2Avg: document.getElementById('resY2Avg'),

  resY3Cores: document.getElementById('resY3Cores'),
  resY3Price: document.getElementById('resY3Price'),
  resY3Avg: document.getElementById('resY3Avg'),

  resY4Cores: document.getElementById('resY4Cores'),
  resY4Price: document.getElementById('resY4Price'),
  resY4Avg: document.getElementById('resY4Avg'),

  // Schedule
  scheduleSection: document.getElementById('scheduleSection'),
  btnToggleSchedule: document.getElementById('btnToggleSchedule'),
  scheduleTableBody: document.getElementById('scheduleTableBody'),

  // Quote & Actions
  quotePreviewText: document.getElementById('quotePreviewText'),
  btnCopyQuote: document.getElementById('btnCopyQuote'),
  btnCopyQuoteDirect: document.getElementById('btnCopyQuoteDirect'),
  btnPrintCard: document.getElementById('btnPrintCard'),

  // All Products table
  allProductsTableBody: document.getElementById('allProductsTableBody'),
  quickFilterInput: document.getElementById('quickFilterInput'),
  statTotalProducts: document.getElementById('statTotalProducts'),
  statTotalPackages: document.getElementById('statTotalPackages'),

  // Scanner Modal
  scannerModal: document.getElementById('scannerModal'),
  btnCloseScanner: document.getElementById('btnCloseScanner'),
  cameraSelect: document.getElementById('cameraSelect'),
  fileScanInput: document.getElementById('fileScanInput'),

  // Sync Modal
  syncModal: document.getElementById('syncModal'),
  btnOpenSync: document.getElementById('btnOpenSync'),
  btnCloseSync: document.getElementById('btnCloseSync'),
  btnTriggerFirebaseReload: document.getElementById('btnTriggerFirebaseReload'),
  syncLogBox: document.getElementById('syncLogBox'),
  syncLogContent: document.getElementById('syncLogContent'),
  firebaseStatus: document.getElementById('firebaseStatus'),

  // Theme
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  toastContainer: document.getElementById('toastContainer')
};

// Utilities
function formatVND(amount) {
  if (amount == null || isNaN(amount)) return '0';
  return Number(amount).toLocaleString('vi-VN');
}

function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  return str.toLowerCase();
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// Audio Beep on Successful QR/Barcode Scan
function playScanChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12); // E6
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
  } catch (e) {
    // Ignore audio context autoplay restrictions
  }
}

// ==========================================
// DATA INITIALIZATION & FIREBASE INTEGRATION
// ==========================================

async function initData() {
  // 1. First check window.EMBEDDED_DATA for 100% instantaneous 0ms load (works on file:// and http://)
  if (window.EMBEDDED_DATA) {
    applyDataset(window.EMBEDDED_DATA);
    updateStatusBadge('online', 'Dữ liệu: Đã sẵn sàng (222 Máy)');
  } else {
    try {
      const localRes = await fetch('data.json');
      if (localRes.ok) {
        const localData = await localRes.json();
        applyDataset(localData);
        updateStatusBadge('online', 'Dữ liệu: Đã sẵn sàng (222 Máy)');
      }
    } catch (err) {
      console.warn('Local data.json fetch error:', err);
    }
  }

  // 2. Fetch fresh update from Firebase Cloud Firestore in background
  syncFromFirebase(false);
}

function applyDataset(data) {
  if (!data) return;
  State.products = data.products || [];
  
  // Transform packages array into lookup map
  State.packages = {};
  if (Array.isArray(data.packages)) {
    data.packages.forEach(pkg => {
      const norm = removeVietnameseTones(pkg.packageName).trim();
      State.packages[norm] = pkg;
    });
  } else if (typeof data.packages === 'object') {
    State.packages = data.packages;
  }

  State.schedule = data.schedule || {};
  State.metadata = {
    updatedAt: data.lastUpdated || new Date().toISOString(),
    totalProducts: State.products.length,
    totalPackages: Object.keys(State.packages).length
  };

  DOM.statTotalProducts.textContent = State.products.length;
  DOM.statTotalPackages.textContent = Object.keys(State.packages).length;

  renderAllProductsTable(State.products);
}

async function syncFromFirebase(showFeedback = true) {
  if (showFeedback) {
    appendSyncLog('Đang kết nối tới Firebase Firestore (crm-43751-71e4b)...');
  }

  try {
    const url1 = `${FIREBASE_CONFIG.baseUrl}/sheet_may_loc_nuoc?key=${FIREBASE_CONFIG.apiKey}`;
    const url2 = `${FIREBASE_CONFIG.baseUrl}/sheet_goi_thay_lln?key=${FIREBASE_CONFIG.apiKey}`;
    const url3 = `${FIREBASE_CONFIG.baseUrl}/sheet_thoi_gian_thay_loi?key=${FIREBASE_CONFIG.apiKey}`;

    const [r1, r2, r3] = await Promise.all([
      fetch(url1),
      fetch(url2),
      fetch(url3)
    ]);

    if (!r1.ok || !r2.ok) {
      throw new Error(`Lỗi phản hồi Firestore HTTP: ${r1.status}`);
    }

    const doc1 = await r1.json();
    const doc2 = await r2.json();
    const doc3 = r3.ok ? await r3.json() : null;

    const products = JSON.parse(doc1.fields.itemsJson.stringValue);
    const packages = JSON.parse(doc2.fields.itemsJson.stringValue);
    const schedule = (doc3 && doc3.fields && doc3.fields.scheduleJson) ? JSON.parse(doc3.fields.scheduleJson.stringValue) : {};

    applyDataset({
      products: products,
      packages: packages,
      schedule: schedule,
      lastUpdated: doc1.fields.updatedAt ? doc1.fields.updatedAt.stringValue : new Date().toISOString()
    });

    updateStatusBadge('online', 'Firebase Firestore: Đã đồng bộ trực tuyến');
    
    if (showFeedback) {
      appendSyncLog(`✅ Thành công! Đã nạp ${products.length} máy lọc nước và ${packages.length} gói thay lõi từ Firebase.`);
      showToast('Đã đồng bộ dữ liệu từ Firebase thành công!', 'success');
    }
  } catch (err) {
    console.error('Firebase sync error:', err);
    updateStatusBadge('offline', 'Firebase: Dùng dữ liệu đệm Offline');
    if (showFeedback) {
      appendSyncLog(`⚠️ Không thể kết nối Firebase: ${err.message}. Đang sử dụng bộ nhớ đệm an toàn.`);
      showToast('Không kết nối được Firebase, đang dùng dữ liệu lưu trữ.', 'error');
    }
  }
}

function updateStatusBadge(status, text) {
  DOM.firebaseStatus.innerHTML = `
    <span class="status-dot" style="background-color: ${status === 'online' ? 'var(--accent-emerald)' : 'var(--accent-amber)'}"></span>
    <span class="status-label">${text}</span>
  `;
}

function appendSyncLog(msg) {
  DOM.syncLogBox.style.display = 'block';
  const time = new Date().toLocaleTimeString('vi-VN');
  const line = document.createElement('div');
  line.textContent = `[${time}] ${msg}`;
  DOM.syncLogContent.appendChild(line);
  DOM.syncLogContent.scrollTop = DOM.syncLogContent.scrollHeight;
}

// ==========================================
// SEARCH & PRODUCT LOOKUP LOGIC
// ==========================================

function lookupProduct(query) {
  if (!query) return null;
  const cleanQ = String(query).trim();
  
  // 1. Try Exact match by Product Code
  let matched = State.products.find(p => p.code === cleanQ);
  if (matched) return matched;

  // 2. Try clean digits match (if query contains scanned QR url or barcode noise)
  const digitsMatch = cleanQ.match(/\d{13}/);
  if (digitsMatch) {
    matched = State.products.find(p => p.code === digitsMatch[0]);
    if (matched) return matched;
  }

  // 3. Try partial code match if length >= 5
  if (/^\d+$/.test(cleanQ) && cleanQ.length >= 6) {
    matched = State.products.find(p => p.code.startsWith(cleanQ));
    if (matched) return matched;
  }

  // 4. Try normalized name match
  const normQ = removeVietnameseTones(cleanQ);
  matched = State.products.find(p => removeVietnameseTones(p.name).includes(normQ));
  return matched || null;
}

function handleSearchInput(e) {
  const query = e.target.value.trim();
  DOM.btnClearSearch.style.display = query ? 'flex' : 'none';

  if (!query) {
    hideSuggestions();
    return;
  }

  // Auto look up if exactly 13 digits entered!
  if (/^\d{13}$/.test(query)) {
    const product = lookupProduct(query);
    if (product) {
      displayProduct(product);
      hideSuggestions();
      return;
    }
  }

  // Generate suggestions
  renderSuggestions(query);
}

function renderSuggestions(query) {
  const normQ = removeVietnameseTones(query);
  const isNumeric = /^\d+$/.test(query);

  const filtered = State.products.filter(p => {
    // Apply brand filter if active
    if (State.activeBrandFilter !== 'ALL' && p.brand !== State.activeBrandFilter) {
      return false;
    }

    if (isNumeric) {
      return p.code.includes(query);
    } else {
      return removeVietnameseTones(p.name).includes(normQ) || p.code.includes(query) || removeVietnameseTones(p.packageName).includes(normQ);
    }
  }).slice(0, 8); // Top 8 suggestions

  if (filtered.length === 0) {
    DOM.suggestionsDropdown.innerHTML = `
      <div class="suggestion-item" style="cursor: default; color: var(--text-muted);">
        Không tìm thấy máy lọc nước phù hợp với "${query}". Thử mã khác hoặc quét mã vạch.
      </div>
    `;
    DOM.suggestionsDropdown.style.display = 'block';
    return;
  }

  DOM.suggestionsDropdown.innerHTML = filtered.map(p => `
    <div class="suggestion-item" data-code="${p.code}">
      <div class="sug-left">
        <div class="sug-title">${p.name}</div>
        <div class="sug-code">Mã SP: ${p.code} • ${p.brand}</div>
      </div>
      <div class="sug-right">
        <span class="sug-pkg-badge">${p.packageName || 'Chưa có gói'}</span>
      </div>
    </div>
  `).join('');

  DOM.suggestionsDropdown.style.display = 'block';

  // Attach click listeners to suggestions
  DOM.suggestionsDropdown.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.getAttribute('data-code');
      if (code) {
        const prod = State.products.find(x => x.code === code);
        if (prod) {
          DOM.searchInput.value = prod.code;
          DOM.btnClearSearch.style.display = 'flex';
          displayProduct(prod);
          hideSuggestions();
        }
      }
    });
  });
}

function hideSuggestions() {
  DOM.suggestionsDropdown.style.display = 'none';
}

// ==========================================
// RENDER PRODUCT & 4-YEAR PACKAGE PRICING
// ==========================================

function displayProduct(product) {
  if (!product) return;
  State.activeProduct = product;

  // Hide empty state, show card
  DOM.emptyState.style.display = 'none';
  DOM.productResultCard.style.display = 'block';

  // Fill Header Specs
  DOM.resProductCode.textContent = product.code;
  DOM.resProductBrand.textContent = product.brand || 'Khác';
  DOM.resProductCategory.textContent = product.category || 'Máy lọc nước';
  DOM.resProductWarranty.textContent = product.warrantyMonths ? `BH: ${product.warrantyMonths} Tháng` : 'BH Theo hãng';
  DOM.resProductName.textContent = product.name;
  DOM.resProductPrice.textContent = product.price ? `${formatVND(product.price)} ₫` : 'Liên hệ';
  DOM.resProductPriceRange.textContent = product.priceRange || 'Tiêu chuẩn';

  // Package Lookup
  const pkgName = product.packageName;
  DOM.resPackageName.textContent = pkgName;

  const normPkg = removeVietnameseTones(pkgName).trim();
  const pkgData = State.packages[normPkg] || product.packagePricing;

  if (!pkgData || pkgName.toLowerCase().includes('chưa thiết kế')) {
    // Machine has no package designed
    DOM.resPackageStatus.textContent = 'Chưa thiết kế gói thay lõi';
    DOM.resPackageStatus.style.color = 'var(--accent-amber)';
    DOM.noPackageAlert.style.display = 'flex';
    DOM.pricingGridSection.style.display = 'none';
    DOM.scheduleSection.style.display = 'none';
    updateQuoteMessage(product, null);
    return;
  }

  // Has valid package
  DOM.resPackageStatus.textContent = 'Đã có biểu giá chuẩn 4 năm';
  DOM.resPackageStatus.style.color = 'var(--accent-emerald)';
  DOM.noPackageAlert.style.display = 'none';
  DOM.pricingGridSection.style.display = 'block';

  // Year 1
  const y1 = pkgData.year1 || { cores: 0, price: 0 };
  DOM.resY1Cores.textContent = y1.cores;
  DOM.resY1Price.textContent = formatVND(y1.price);
  const avgY1 = y1.cores > 0 ? Math.round(y1.price / y1.cores) : 0;
  DOM.resY1Avg.textContent = avgY1 ? `~${formatVND(avgY1)} ₫/lõi` : 'Định kỳ năm 1';

  // Year 2
  const y2 = pkgData.year2 || { cores: 0, price: 0 };
  DOM.resY2Cores.textContent = y2.cores;
  DOM.resY2Price.textContent = formatVND(y2.price);
  const avgY2 = y2.price ? Math.round(y2.price / 2) : 0;
  DOM.resY2Avg.textContent = avgY2 ? `~${formatVND(avgY2)} ₫/năm` : 'Định kỳ 2 năm';

  // Year 3
  const y3 = pkgData.year3 || { cores: 0, price: 0 };
  DOM.resY3Cores.textContent = y3.cores;
  DOM.resY3Price.textContent = formatVND(y3.price);
  const avgY3 = y3.price ? Math.round(y3.price / 3) : 0;
  DOM.resY3Avg.textContent = avgY3 ? `~${formatVND(avgY3)} ₫/năm` : 'Định kỳ 3 năm';

  // Year 4
  const y4 = pkgData.year4 || { cores: 0, price: 0 };
  DOM.resY4Cores.textContent = y4.cores;
  DOM.resY4Price.textContent = formatVND(y4.price);
  const avgY4 = y4.price ? Math.round(y4.price / 4) : 0;
  DOM.resY4Avg.textContent = avgY4 ? `~${formatVND(avgY4)} ₫/năm` : 'Định kỳ 4 năm';

  // Render Core Schedule Details (From 'Thời gian thay lõi lọc')
  renderScheduleDetails(normPkg);

  // Generate Customer Quote Template
  updateQuoteMessage(product, pkgData);

  // Smooth scroll into result view
  DOM.productResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderScheduleDetails(normPkg) {
  const scheduleItems = State.schedule[normPkg] || [];
  
  if (scheduleItems.length === 0) {
    DOM.scheduleSection.style.display = 'none';
    return;
  }

  DOM.scheduleSection.style.display = 'block';
  DOM.scheduleTableBody.innerHTML = scheduleItems.map(item => `
    <tr>
      <td><strong>Lõi số ${item.position || '-'}</strong></td>
      <td><code style="font-family: var(--font-mono); color: var(--primary);">${item.code || '-'}</code></td>
      <td><strong>${item.name}</strong></td>
      <td><span class="badge" style="background: var(--bg-surface-subtle);">${item.intervalMonths} tháng</span></td>
      <td class="text-center">${item.q1 > 0 ? `<span class="status-check status-yes">${item.q1} cái</span>` : `<span class="status-no">-</span>`}</td>
      <td class="text-center">${item.q2 > 0 ? `<span class="status-check status-yes">${item.q2} cái</span>` : `<span class="status-no">-</span>`}</td>
      <td class="text-center">${item.q3 > 0 ? `<span class="status-check status-yes">${item.q3} cái</span>` : `<span class="status-no">-</span>`}</td>
      <td class="text-center">${item.q4 > 0 ? `<span class="status-check status-yes">${item.q4} cái</span>` : `<span class="status-no">-</span>`}</td>
    </tr>
  `).join('');
}

function updateQuoteMessage(product, pkgData) {
  if (!product) return;
  
  let msg = `Kính gửi Quý khách, Dịch vụ Thợ Điện Máy Xanh xin gửi báo giá gói thay lõi lọc nước chính hãng cho thiết bị:\n\n`;
  msg += `🏷️ Thiết bị: ${product.name}\n`;
  msg += `🔢 Mã sản phẩm: ${product.code}\n`;
  msg += `🏢 Hãng sản xuất: ${product.brand}\n`;
  msg += `📦 Gói thay lõi áp dụng: ${product.packageName}\n\n`;

  if (pkgData) {
    msg += `BẢNG GIÁ DỊCH VỤ THAY LÕI LỌC TRỌN GÓI (ĐÃ BAO GỒM CÔNG THỢ TẬN NHÀ):\n`;
    msg += `1️⃣ Gói 1 Năm (${pkgData.year1?.cores || 0} lõi): ${formatVND(pkgData.year1?.price)} ₫\n`;
    msg += `2️⃣ Gói 2 Năm (${pkgData.year2?.cores || 0} lõi): ${formatVND(pkgData.year2?.price)} ₫  ⭐(Khuyên dùng - Tiết kiệm)\n`;
    msg += `3️⃣ Gói 3 Năm (${pkgData.year3?.cores || 0} lõi): ${formatVND(pkgData.year3?.price)} ₫\n`;
    msg += `4️⃣ Gói 4 Năm (${pkgData.year4?.cores || 0} lõi): ${formatVND(pkgData.year4?.price)} ₫  👑(Gói bảo vệ trọn đời máy)\n\n`;
    msg += `✨ Quyền lợi khách hàng: Cam kết 100% lõi lọc chính hãng, thợ kỹ thuật ĐMX có mặt đúng hẹn, kiểm tra áp lực nước và đo TDS sau khi thay hoàn toàn miễn phí!`;
  } else {
    msg += `⚠️ Lưu ý: Thiết bị này hiện chưa có gói biểu giá chuẩn. Kỹ thuật viên sẽ báo giá lõi thay thế thực tế theo nhu cầu của Quý khách.`;
  }

  DOM.quotePreviewText.textContent = msg;
}

function copyQuoteToClipboard() {
  const text = DOM.quotePreviewText.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Đã sao chép nội dung báo giá vào bộ nhớ tạm! Có thể dán gửi Zalo ngay.', 'success');
  }).catch(() => {
    showToast('Không thể sao chép tự động, vui lòng chọn bôi đen văn bản.', 'error');
  });
}

// ==========================================
// ALL PRODUCTS TABLE
// ==========================================

function renderAllProductsTable(products) {
  const filterVal = removeVietnameseTones(DOM.quickFilterInput?.value || '');
  
  const filtered = products.filter(p => {
    if (State.activeBrandFilter !== 'ALL' && p.brand !== State.activeBrandFilter) {
      return false;
    }
    if (!filterVal) return true;
    return p.code.includes(filterVal) || 
           removeVietnameseTones(p.name).includes(filterVal) ||
           removeVietnameseTones(p.brand).includes(filterVal) ||
           removeVietnameseTones(p.packageName).includes(filterVal);
  });

  DOM.allProductsTableBody.innerHTML = filtered.map(p => `
    <tr data-code="${p.code}">
      <td><span class="badge badge-code">${p.code}</span></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge badge-brand">${p.brand}</span></td>
      <td><strong>${p.price ? formatVND(p.price) + ' ₫' : '-'}</strong></td>
      <td><span class="badge" style="background: ${p.hasPackage ? 'var(--primary-subtle)' : 'var(--bg-surface-subtle)'}; color: ${p.hasPackage ? 'var(--primary)' : 'var(--text-muted)'};">${p.packageName}</span></td>
      <td>
        <button class="btn btn-secondary btn-xs btn-view-prod" data-code="${p.code}">Xem giá</button>
      </td>
    </tr>
  `).join('');

  // Row click listeners
  DOM.allProductsTableBody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', (e) => {
      const code = row.getAttribute('data-code');
      const prod = State.products.find(x => x.code === code);
      if (prod) {
        DOM.searchInput.value = prod.code;
        DOM.btnClearSearch.style.display = 'flex';
        displayProduct(prod);
      }
    });
  });
}

// ==========================================
// QR & BARCODE CAMERA SCANNER
// ==========================================

async function openScannerModal() {
  DOM.scannerModal.style.display = 'flex';
  State.isScanning = true;

  if (typeof Html5Qrcode === 'undefined') {
    showToast('Thư viện quét mã chưa sẵn sàng, vui lòng thử lại sau giây lát.', 'error');
    return;
  }

  try {
    if (!State.scannerInstance) {
      State.scannerInstance = new Html5Qrcode("interactiveScanner");
    }

    // Get camera list
    const cameras = await Html5Qrcode.getCameras();
    DOM.cameraSelect.innerHTML = '';
    
    if (cameras && cameras.length) {
      cameras.forEach((cam, index) => {
        const opt = document.createElement('option');
        opt.value = cam.id;
        opt.textContent = cam.label || `Camera ${index + 1}`;
        DOM.cameraSelect.appendChild(opt);
      });

      // Prefer back camera on mobile devices
      let preferredCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('sau') || c.label.toLowerCase().includes('environment'));
      if (!preferredCam) preferredCam = cameras[cameras.length - 1]; // usually back camera
      
      State.selectedCameraId = preferredCam.id;
      DOM.cameraSelect.value = preferredCam.id;
      startCameraScanning(preferredCam.id);
    } else {
      showToast('Không tìm thấy camera trên thiết bị này.', 'error');
    }
  } catch (err) {
    console.error('Camera enumeration error:', err);
    showToast('Lỗi truy cập camera: ' + err.message, 'error');
  }
}

async function startCameraScanning(cameraId) {
  if (!State.scannerInstance) return;

  const config = {
    fps: 15,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.QR_CODE
    ]
  };

  try {
    // If running, stop first
    if (State.scannerInstance.isScanning) {
      await State.scannerInstance.stop();
    }

    await State.scannerInstance.start(
      cameraId,
      config,
      (decodedText, decodedResult) => {
        handleScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Continuous scan frame error, safely ignore
      }
    );
  } catch (err) {
    console.warn('Start camera error:', err);
  }
}

function handleScanSuccess(rawDecodedText) {
  if (!State.isScanning) return;
  playScanChime();

  console.log('Quét thành công mã thô:', rawDecodedText);
  let targetCode = rawDecodedText.trim();

  // Try extracting 13 digits if scanned string is URL or composite label
  const digitsMatch = targetCode.match(/\b\d{13}\b/);
  if (digitsMatch) {
    targetCode = digitsMatch[0];
  }

  closeScannerModal();

  DOM.searchInput.value = targetCode;
  DOM.btnClearSearch.style.display = 'flex';

  const product = lookupProduct(targetCode);
  if (product) {
    showToast(`Quét thành công! Tìm thấy: ${product.name}`, 'success');
    displayProduct(product);
  } else {
    showToast(`Đã nhận diện mã: ${targetCode} nhưng chưa có trong danh mục 222 máy.`, 'info');
    renderSuggestions(targetCode);
  }
}

async function closeScannerModal() {
  State.isScanning = false;
  if (State.scannerInstance && State.scannerInstance.isScanning) {
    try {
      await State.scannerInstance.stop();
    } catch (e) {}
  }
  DOM.scannerModal.style.display = 'none';
}

// File scan fallback
async function handleFileScan(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    if (!State.scannerInstance) {
      State.scannerInstance = new Html5Qrcode("interactiveScanner");
    }
    const result = await State.scannerInstance.scanFile(file, true);
    if (result) {
      handleScanSuccess(result);
    }
  } catch (err) {
    showToast('Không nhận diện được mã vạch trong ảnh chụp: ' + err.message, 'error');
  }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
  // Search input events
  DOM.searchInput.addEventListener('input', handleSearchInput);
  DOM.searchInput.addEventListener('focus', () => {
    if (DOM.searchInput.value.trim()) {
      renderSuggestions(DOM.searchInput.value.trim());
    }
  });

  // Clear button
  DOM.btnClearSearch.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.btnClearSearch.style.display = 'none';
    hideSuggestions();
    DOM.searchInput.focus();
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-card')) {
      hideSuggestions();
    }
  });

  // Sample Chips
  DOM.sampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const code = chip.getAttribute('data-code');
      DOM.searchInput.value = code;
      DOM.btnClearSearch.style.display = 'flex';
      const prod = lookupProduct(code);
      if (prod) {
        displayProduct(prod);
        hideSuggestions();
      }
    });
  });

  // Brand Filter Pills
  DOM.brandPills.forEach(pill => {
    pill.addEventListener('click', () => {
      DOM.brandPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      State.activeBrandFilter = pill.getAttribute('data-brand');
      renderAllProductsTable(State.products);
      
      // If search input has text, refresh suggestions
      if (DOM.searchInput.value.trim()) {
        renderSuggestions(DOM.searchInput.value.trim());
      }
    });
  });

  // Scanner modal triggers
  DOM.btnStartScan.addEventListener('click', openScannerModal);
  DOM.btnCloseScanner.addEventListener('click', closeScannerModal);
  DOM.scannerModal.addEventListener('click', (e) => {
    if (e.target === DOM.scannerModal) closeScannerModal();
  });

  // Camera dropdown change
  DOM.cameraSelect.addEventListener('change', (e) => {
    const camId = e.target.value;
    State.selectedCameraId = camId;
    startCameraScanning(camId);
  });

  // File scan input
  DOM.fileScanInput.addEventListener('change', handleFileScan);

  // Sync Modal
  DOM.btnOpenSync.addEventListener('click', () => {
    DOM.syncModal.style.display = 'flex';
  });
  DOM.btnCloseSync.addEventListener('click', () => {
    DOM.syncModal.style.display = 'none';
  });
  DOM.syncModal.addEventListener('click', (e) => {
    if (e.target === DOM.syncModal) DOM.syncModal.style.display = 'none';
  });

  // Firebase Trigger Reload
  DOM.btnTriggerFirebaseReload.addEventListener('click', () => {
    syncFromFirebase(true);
  });

  // Toggle Schedule Accordion
  DOM.btnToggleSchedule.addEventListener('click', () => {
    DOM.scheduleSection.classList.toggle('open');
  });

  // Quote Copy buttons
  DOM.btnCopyQuote.addEventListener('click', copyQuoteToClipboard);
  DOM.btnCopyQuoteDirect.addEventListener('click', copyQuoteToClipboard);

  // Print button
  DOM.btnPrintCard.addEventListener('click', () => {
    window.print();
  });

  // Quick filter for all products table
  DOM.quickFilterInput.addEventListener('input', () => {
    renderAllProductsTable(State.products);
  });

  // Theme toggle
  DOM.btnThemeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('theme-dark');
    document.body.classList.toggle('theme-light', !isDark);
    localStorage.setItem('tra_cuu_theme', isDark ? 'dark' : 'light');
  });

  // Restore saved theme
  const savedTheme = localStorage.getItem('tra_cuu_theme');
  if (savedTheme === 'dark') {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  }
}

// Start application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initData();
});
