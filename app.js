/**
 * Tra Cứu Giá Gói Thay Lõi Lọc Nước
 * Kết nối Firebase Cloud Firestore, Tích hợp Quét QR / Barcode & Quản Lý Khuyến Mãi
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
  selectedCameraId: null,
  // Role-Based Access Control (RBAC): 'staff' (Mặc định) hoặc 'admin' (Password: 43751)
  currentRole: 'staff',
  // Promotion settings (Gói 1 năm: 10%, Gói 2 năm: 15%, Gói 3 năm: 20%, Gói 4 năm: 25%)
  promotions: {
    enabled: true,
    programName: "Chương Trình Ưu Đãi Thay Lõi Thợ ĐMX",
    discountY1: 10,
    discountY2: 15,
    discountY3: 20,
    discountY4: 25
  }
};

// Mật khẩu quản trị viên (Admin)
const ADMIN_PASSWORD = '43751';

// DOM Elements
const DOM = {
  searchInput: document.getElementById('productSearchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  btnStartScan: document.getElementById('btnStartScan'),
  btnMobileScanFab: document.getElementById('btnMobileScanFab'),
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

  // Promotion Banner & Controls
  promoBannerWrap: document.getElementById('promoBannerWrap'),
  promoTitleText: document.getElementById('promoTitleText'),
  togglePromoActive: document.getElementById('togglePromoActive'),
  btnOpenPromoSettings: document.getElementById('btnOpenPromoSettings'),

  // Year 1
  resY1Cores: document.getElementById('resY1Cores'),
  featY1Cores: document.getElementById('featY1Cores'),
  tagY1Discount: document.getElementById('tagY1Discount'),
  wrapY1OldPrice: document.getElementById('wrapY1OldPrice'),
  resY1OldPrice: document.getElementById('resY1OldPrice'),
  resY1Price: document.getElementById('resY1Price'),
  resY1Save: document.getElementById('resY1Save'),
  resY1Avg: document.getElementById('resY1Avg'),

  // Year 2
  resY2Cores: document.getElementById('resY2Cores'),
  featY2Cores: document.getElementById('featY2Cores'),
  tagY2Discount: document.getElementById('tagY2Discount'),
  wrapY2OldPrice: document.getElementById('wrapY2OldPrice'),
  resY2OldPrice: document.getElementById('resY2OldPrice'),
  resY2Price: document.getElementById('resY2Price'),
  resY2Save: document.getElementById('resY2Save'),
  resY2Avg: document.getElementById('resY2Avg'),

  // Year 3
  resY3Cores: document.getElementById('resY3Cores'),
  featY3Cores: document.getElementById('featY3Cores'),
  tagY3Discount: document.getElementById('tagY3Discount'),
  wrapY3OldPrice: document.getElementById('wrapY3OldPrice'),
  resY3OldPrice: document.getElementById('resY3OldPrice'),
  resY3Price: document.getElementById('resY3Price'),
  resY3Save: document.getElementById('resY3Save'),
  resY3Avg: document.getElementById('resY3Avg'),

  // Year 4
  resY4Cores: document.getElementById('resY4Cores'),
  featY4Cores: document.getElementById('featY4Cores'),
  tagY4Discount: document.getElementById('tagY4Discount'),
  wrapY4OldPrice: document.getElementById('wrapY4OldPrice'),
  resY4OldPrice: document.getElementById('resY4OldPrice'),
  resY4Price: document.getElementById('resY4Price'),
  resY4Save: document.getElementById('resY4Save'),
  resY4Avg: document.getElementById('resY4Avg'),

  // Card Features Lists (Sheet "Thời gian thay lõi lọc")
  featListY1: document.getElementById('featListY1'),
  featListY2: document.getElementById('featListY2'),
  featListY3: document.getElementById('featListY3'),
  featListY4: document.getElementById('featListY4'),

  // Mobile Grid View Switcher
  yearCardsGrid: document.getElementById('yearCardsGrid'),
  pricingViewModeBar: document.getElementById('pricingViewModeBar'),
  btnModeCompact: document.getElementById('btnModeCompact'),
  btnModeDetail: document.getElementById('btnModeDetail'),

  // Package Cores Summary Table (Sheet GÓI THAY LLN)
  summaryBoxPkgName: document.getElementById('summaryBoxPkgName'),
  tableSummaryCoresBody: document.getElementById('tableSummaryCoresBody'),

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

  // Promotion Settings Modal
  promoSettingsModal: document.getElementById('promoSettingsModal'),
  btnClosePromoSettings: document.getElementById('btnClosePromoSettings'),
  inputPromoName: document.getElementById('inputPromoName'),
  inputDiscountY1: document.getElementById('inputDiscountY1'),
  inputDiscountY2: document.getElementById('inputDiscountY2'),
  inputDiscountY3: document.getElementById('inputDiscountY3'),
  inputDiscountY4: document.getElementById('inputDiscountY4'),
  btnSavePromoLocal: document.getElementById('btnSavePromoLocal'),
  btnSavePromoFirebase: document.getElementById('btnSavePromoFirebase'),
  btnResetPromoDefaults: document.getElementById('btnResetPromoDefaults'),

  // Theme
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  toastContainer: document.getElementById('toastContainer'),

  // Role Switcher & Admin Auth (1 Button góc phải trên)
  btnRoleToggle: document.getElementById('btnRoleToggle'),
  roleBadgeIcon: document.getElementById('roleBadgeIcon'),
  roleBadgeText: document.getElementById('roleBadgeText'),
  roleModal: document.getElementById('roleModal'),
  btnCloseRoleModal: document.getElementById('btnCloseRoleModal'),
  btnCancelRoleModal: document.getElementById('btnCancelRoleModal'),
  optRoleStaff: document.getElementById('optRoleStaff'),
  optRoleAdmin: document.getElementById('optRoleAdmin'),
  adminPasswordBlock: document.getElementById('adminPasswordBlock'),
  inputAdminPassword: document.getElementById('inputAdminPassword'),
  adminPasswordError: document.getElementById('adminPasswordError'),
  btnToggleAdminPassEye: document.getElementById('btnToggleAdminPassEye'),
  btnConfirmRoleChange: document.getElementById('btnConfirmRoleChange'),
  labelConfirmRole: document.getElementById('labelConfirmRole'),

  // Device Mode Switcher & Mobile Simulator
  deviceSwitchWrap: document.getElementById('deviceSwitchWrap'),
  btnSwitchDesktop: document.getElementById('btnSwitchDesktop'),
  btnSwitchMobile: document.getElementById('btnSwitchMobile'),
  simModalOverlay: document.getElementById('simModalOverlay'),
  selectSimDevice: document.getElementById('selectSimDevice'),
  selectSimScale: document.getElementById('selectSimScale'),
  btnSimRotate: document.getElementById('btnSimRotate'),
  labelSimRotate: document.getElementById('labelSimRotate'),
  btnSimReload: document.getElementById('btnSimReload'),
  btnCloseSimulator: document.getElementById('btnCloseSimulator'),
  simPhoneChassis: document.getElementById('simPhoneChassis'),
  simPhoneScreenWrap: document.getElementById('simPhoneScreenWrap'),
  simIframe: document.getElementById('simIframe'),
  simCurrentDeviceName: document.getElementById('simCurrentDeviceName'),
  simDimCaption: document.getElementById('simDimCaption')
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
  // Check URL parameters for ?embed=1 and ?code=...
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbed = urlParams.get('embed') === '1' || window.self !== window.top;
  if (isEmbed) {
    document.body.classList.add('is-embedded');
  }

  // Initialize Role (Staff as default, or saved admin session, or URL param)
  const paramRole = urlParams.get('role');
  if (paramRole && (paramRole === 'admin' || paramRole === 'staff')) {
    applyRole(paramRole);
  } else {
    initRole();
  }

  // Load saved local promotions if exists
  loadSavedPromotions();

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

  // If specific product code passed in URL, load it automatically
  const paramCode = urlParams.get('code');
  if (paramCode && State.products?.length > 0) {
    const prod = lookupProduct(paramCode);
    if (prod) {
      displayProduct(prod);
      DOM.searchInput.value = paramCode;
      DOM.btnClearSearch.style.display = 'flex';
    }
  }

  // 2. Fetch fresh update from Firebase Cloud Firestore in background (including promotions)
  syncFromFirebase(false);
  fetchPromotionsFromFirebase();
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

  if (data.promotions) {
    // Only override if not already customized in localStorage
    if (!localStorage.getItem('tra_cuu_promotions')) {
      State.promotions = { ...State.promotions, ...data.promotions };
    }
  }

  DOM.statTotalProducts.textContent = State.products.length;
  DOM.statTotalPackages.textContent = Object.keys(State.packages).length;

  renderAllProductsTable(State.products);
  updatePromotionUI();
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

// Load promotions from Firebase
async function fetchPromotionsFromFirebase() {
  try {
    const url = `${FIREBASE_CONFIG.baseUrl}/promotions?key=${FIREBASE_CONFIG.apiKey}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const doc = await resp.json();
      if (doc && doc.fields) {
        const p = doc.fields;
        State.promotions = {
          enabled: p.enabled ? p.enabled.booleanValue : true,
          programName: p.programName ? p.programName.stringValue : "Chương Trình Ưu Đãi Thay Lõi Thợ ĐMX",
          discountY1: p.discountY1 ? Number(p.discountY1.integerValue || 10) : 10,
          discountY2: p.discountY2 ? Number(p.discountY2.integerValue || 15) : 15,
          discountY3: p.discountY3 ? Number(p.discountY3.integerValue || 20) : 20,
          discountY4: p.discountY4 ? Number(p.discountY4.integerValue || 25) : 25
        };
        localStorage.setItem('tra_cuu_promotions', JSON.stringify(State.promotions));
        updatePromotionUI();
        if (State.activeProduct) {
          displayProduct(State.activeProduct);
        }
      }
    }
  } catch (e) {
    console.warn('Cannot fetch promotions from Firebase, using local config:', e);
  }
}

function loadSavedPromotions() {
  try {
    const saved = localStorage.getItem('tra_cuu_promotions');
    if (saved) {
      State.promotions = JSON.parse(saved);
    }
  } catch (e) {}
  updatePromotionUI();
}

function updatePromotionUI() {
  if (DOM.togglePromoActive) {
    DOM.togglePromoActive.checked = State.promotions.enabled;
  }
  if (DOM.promoTitleText) {
    DOM.promoTitleText.textContent = `${State.promotions.programName || 'Ưu Đãi Đặc Biệt'}: Giảm ${State.promotions.discountY1}% - ${State.promotions.discountY2}% - ${State.promotions.discountY3}% - ${State.promotions.discountY4}%`;
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
// (TÍNH TOÁN & HIỂN THỊ KHUYẾN MÃI CHI TIẾT)
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

  const promo = State.promotions;
  const isPromo = promo.enabled;

  // Helper calculation for each year
  function applyCardDiscount(coresEl, tagEl, wrapOldEl, oldPriceEl, priceEl, saveEl, avgEl, yearData, discountPercent, yearNum) {
    const cores = yearData?.cores || 0;
    const origPrice = yearData?.price || 0;
    coresEl.textContent = cores;

    if (isPromo && discountPercent > 0 && origPrice > 0) {
      const discountAmount = Math.round(origPrice * discountPercent / 100);
      const finalPrice = Math.max(0, origPrice - discountAmount);

      tagEl.textContent = `-${discountPercent}%`;
      tagEl.style.display = 'inline-block';

      wrapOldEl.style.display = 'flex';
      oldPriceEl.textContent = `${formatVND(origPrice)} ₫`;

      priceEl.textContent = formatVND(finalPrice);
      priceEl.style.color = '#ef4444';

      saveEl.textContent = `Tiết kiệm ${formatVND(discountAmount)} ₫`;
      saveEl.style.display = 'inline-block';

      if (yearNum === 1) {
        const avg = cores > 0 ? Math.round(finalPrice / cores) : 0;
        avgEl.textContent = avg ? `~${formatVND(avg)} ₫/lõi` : 'Định kỳ năm 1';
      } else {
        const avg = Math.round(finalPrice / yearNum);
        avgEl.textContent = avg ? `~${formatVND(avg)} ₫/năm` : `Định kỳ ${yearNum} năm`;
      }
    } else {
      // Normal original pricing without promo
      tagEl.style.display = 'none';
      wrapOldEl.style.display = 'none';
      priceEl.textContent = formatVND(origPrice);
      priceEl.style.color = 'var(--text-main)';
      saveEl.style.display = 'none';

      if (yearNum === 1) {
        const avg = cores > 0 ? Math.round(origPrice / cores) : 0;
        avgEl.textContent = avg ? `~${formatVND(avg)} ₫/lõi` : 'Định kỳ năm 1';
      } else {
        const avg = Math.round(origPrice / yearNum);
        avgEl.textContent = avg ? `~${formatVND(avg)} ₫/năm` : `Định kỳ ${yearNum} năm`;
      }
    }
  }

  // Year 1 (Mặc định giảm 10%)
  applyCardDiscount(
    DOM.resY1Cores, DOM.tagY1Discount, DOM.wrapY1OldPrice, DOM.resY1OldPrice, 
    DOM.resY1Price, DOM.resY1Save, DOM.resY1Avg, pkgData.year1, promo.discountY1, 1
  );

  // Year 2 (Mặc định giảm 15%)
  applyCardDiscount(
    DOM.resY2Cores, DOM.tagY2Discount, DOM.wrapY2OldPrice, DOM.resY2OldPrice, 
    DOM.resY2Price, DOM.resY2Save, DOM.resY2Avg, pkgData.year2, promo.discountY2, 2
  );

  // Year 3 (Mặc định giảm 20%)
  applyCardDiscount(
    DOM.resY3Cores, DOM.tagY3Discount, DOM.wrapY3OldPrice, DOM.resY3OldPrice, 
    DOM.resY3Price, DOM.resY3Save, DOM.resY3Avg, pkgData.year3, promo.discountY3, 3
  );

  // Year 4 (Mặc định giảm 25%)
  applyCardDiscount(
    DOM.resY4Cores, DOM.tagY4Discount, DOM.wrapY4OldPrice, DOM.resY4OldPrice, 
    DOM.resY4Price, DOM.resY4Save, DOM.resY4Avg, pkgData.year4, promo.discountY4, 4
  );

  // Extract detailed cores from sheet 'Thời gian thay lõi lọc'
  const cores = getCoresForProduct(product);

  // Render dynamic card features (Sheet 'Thời gian thay lõi lọc' + Service perks)
  renderAllCardFeatures(cores, pkgData);

  // Render Cores Summary Table (Sheet GÓI THAY LLN)
  renderCoresSummaryTable(pkgData, pkgName);

  // Render Core Schedule Details (From 'Thời gian thay lõi lọc')
  renderScheduleDetails(cores);

  // Generate Customer Quote Template with Promo Details & Filter Core Details
  updateQuoteMessage(product, pkgData);

  // Smooth scroll into result view
  DOM.productResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getCoresForProduct(product) {
  if (product && Array.isArray(product.coreSchedule) && product.coreSchedule.length > 0) {
    return product.coreSchedule;
  }
  const pkgName = product?.packageName || '';
  const rawKey = pkgName.toLowerCase().trim().replace(/\s+/g, ' ');
  if (State.schedule && State.schedule[rawKey]) {
    return State.schedule[rawKey];
  }
  const noTone = removeVietnameseTones(pkgName).trim();
  if (State.schedule && State.schedule[noTone]) {
    return State.schedule[noTone];
  }
  if (State.schedule) {
    for (const [k, v] of Object.entries(State.schedule)) {
      if (k.toLowerCase() === rawKey || removeVietnameseTones(k).trim() === noTone) {
        return v;
      }
    }
  }
  return [];
}

function renderAllCardFeatures(cores, pkgData) {
  renderSingleCardFeatures(DOM.featListY1, 1, pkgData?.year1, cores, [
    "Miễn phí 100% công thợ ĐMX tới nhà",
    "Kiểm tra chất lượng nước sau thay"
  ]);
  renderSingleCardFeatures(DOM.featListY2, 2, pkgData?.year2, cores, [
    "Miễn phí công thợ ĐMX trọn gói 2 năm",
    "Nhắc lịch tự động trước khi tới kỳ"
  ]);
  renderSingleCardFeatures(DOM.featListY3, 3, pkgData?.year3, cores, [
    "Miễn phí công thợ ĐMX trọn gói 3 năm",
    "Bảo dưỡng màng RO & áp lực bơm"
  ]);
  renderSingleCardFeatures(DOM.featListY4, 4, pkgData?.year4, cores, [
    "Miễn phí công thợ ĐMX trọn đời 4 năm",
    "Bảo dưỡng toàn diện máy trọn đời"
  ]);
}

function renderSingleCardFeatures(container, yearNum, yearData, cores, perks) {
  if (!container) return;
  const totalCores = yearData?.cores || 0;

  let html = `
    <li class="feat-core-highlight">
      <span>📦 Số lượng lõi thay:</span>
      <strong class="badge-cores-count">${totalCores} lõi lọc</strong>
    </li>
    <li class="feat-card-toggle-row">
      <button type="button" class="btn-card-toggle-details" data-target="detailsY${yearNum}">
        <span>Chi tiết lõi</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toggle-icon">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </li>
    <div class="feat-details-drawer" id="detailsY${yearNum}">
  `;

  if (cores && cores.length > 0) {
    cores.forEach((c, idx) => {
      let qty = 0;
      if (yearNum === 1) qty = c.y1_cumulative || c.y1_count || 0;
      else if (yearNum === 2) qty = c.y2_cumulative || ((c.y1_count || 0) + (c.y2_count || 0)) || 0;
      else if (yearNum === 3) qty = c.y3_cumulative || ((c.y1_count || 0) + (c.y2_count || 0) + (c.y3_count || 0)) || 0;
      else if (yearNum === 4) qty = c.y4_cumulative || c.total_4y || ((c.y1_count || 0) + (c.y2_count || 0) + (c.y3_count || 0) + (c.y4_count || 0)) || 0;

      const posLabel = c.position ? `Lõi ${c.position}` : `Lõi ${idx + 1}`;
      const intervalLabel = c.intervalMonths ? `Định kỳ ${c.intervalMonths} th` : 'Định kỳ chuẩn';
      const codeLabel = c.code ? `<span class="feat-core-code" title="Mã linh kiện ĐMX: ${c.code}">Mã: ${c.code}</span>` : '';

      html += `
        <li class="feat-core-item" title="${c.name} - Thay định kỳ ${c.intervalMonths || '-'} tháng (Mã: ${c.code || '-'})">
          <span class="feat-core-bullet">✓</span>
          <div class="feat-core-content">
            <div class="feat-core-title-row">
              <span class="feat-core-pos">${posLabel}</span>
              <span class="feat-core-name">${c.name}</span>
              <span class="feat-core-qty-tag">x${qty} lõi</span>
            </div>
            <div class="feat-core-sub-row">
              <span class="feat-core-interval">⏱️ ${intervalLabel}</span>
              ${codeLabel}
            </div>
          </div>
        </li>
      `;
    });
  } else {
    html += `
      <li class="feat-service-item">
        <span class="feat-service-bullet">✓</span>
        <span>Thay thế định kỳ theo tiêu chuẩn hãng</span>
      </li>
    `;
  }

  if (perks && perks.length > 0) {
    perks.forEach(p => {
      html += `
        <li class="feat-service-item">
          <span class="feat-service-bullet">✓</span>
          <span>${p}</span>
        </li>
      `;
    });
  }

  html += `</div>`;

  container.innerHTML = html;
}

function renderCoresSummaryTable(pkgData, pkgName) {
  if (DOM.summaryBoxPkgName) {
    DOM.summaryBoxPkgName.textContent = pkgName;
  }
  if (!DOM.tableSummaryCoresBody) return;

  const promo = State.promotions;
  const isPromo = promo.enabled;

  const rows = [
    { title: 'Gói 1 Năm', data: pkgData.year1, discount: promo.discountY1, yearNum: 1 },
    { title: 'Gói 2 Năm', data: pkgData.year2, discount: promo.discountY2, yearNum: 2 },
    { title: 'Gói 3 Năm', data: pkgData.year3, discount: promo.discountY3, yearNum: 3 },
    { title: 'Gói 4 Năm', data: pkgData.year4, discount: promo.discountY4, yearNum: 4 }
  ];

  DOM.tableSummaryCoresBody.innerHTML = rows.map(r => {
    const cores = r.data?.cores || 0;
    const origP = r.data?.price || 0;
    let finalP = origP;
    let saveP = 0;
    if (isPromo && r.discount > 0 && origP > 0) {
      saveP = Math.round(origP * r.discount / 100);
      finalP = origP - saveP;
    }
    const avg = r.yearNum === 1 
      ? (cores > 0 ? Math.round(finalP / cores) : 0)
      : Math.round(finalP / r.yearNum);
    const avgText = r.yearNum === 1 ? `~${formatVND(avg)} ₫/lõi` : `~${formatVND(avg)} ₫/năm`;

    return `
      <tr>
        <td><strong>${r.title}</strong></td>
        <td class="text-center">
          <span class="table-cores-badge">${cores} lõi lọc</span>
        </td>
        <td><strong style="color: var(--text-muted); font-family: var(--font-mono);">${formatVND(origP)} ₫</strong></td>
        <td>
          <strong style="color: ${saveP > 0 ? '#ef4444' : 'var(--text-main)'}; font-family: var(--font-mono); font-size: 14px;">
            ${formatVND(finalP)} ₫
          </strong>
          ${saveP > 0 ? `<span class="badge" style="background: rgba(239,68,68,0.15); color: #ef4444; margin-left: 4px; font-size: 11px;">-${r.discount}%</span>` : ''}
        </td>
        <td>
          ${saveP > 0 ? `<span class="save-tag" style="margin-bottom:0;">Tiết kiệm ${formatVND(saveP)} ₫</span>` : `<span style="color: var(--text-light);">-</span>`}
        </td>
        <td><span style="font-weight: 600; color: var(--text-muted);">${avgText}</span></td>
      </tr>
    `;
  }).join('');
}

function renderScheduleDetails(cores) {
  const scheduleItems = (cores && cores.length > 0) ? cores : [];
  
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
  const promo = State.promotions;
  const isPromo = promo.enabled;
  
  let msg = `Kính gửi Quý khách, Dịch vụ Thợ Điện Máy Xanh xin gửi báo giá gói thay lõi lọc nước chính hãng cho thiết bị:\n\n`;
  msg += `🏷️ Thiết bị: ${product.name}\n`;
  msg += `🔢 Mã sản phẩm: ${product.code}\n`;
  msg += `🏢 Hãng sản xuất: ${product.brand}\n`;
  msg += `📦 Gói thay lõi áp dụng: ${product.packageName}\n\n`;

  if (pkgData) {
    if (isPromo) {
      msg += `🔥 CHƯƠNG TRÌNH KHUYẾN MÃI: ${promo.programName.toUpperCase()} (ĐÃ BAO GỒM CÔNG THỢ TẬN NHÀ):\n`;
      
      // Y1
      const p1 = pkgData.year1?.price || 0;
      const s1 = Math.round(p1 * promo.discountY1 / 100);
      const f1 = p1 - s1;
      msg += `1️⃣ Gói 1 Năm (${pkgData.year1?.cores || 0} lõi): ${formatVND(f1)} ₫  (Giá gốc: ${formatVND(p1)} ₫ - Giảm ${promo.discountY1}%, Tiết kiệm ${formatVND(s1)} ₫)\n`;

      // Y2
      const p2 = pkgData.year2?.price || 0;
      const s2 = Math.round(p2 * promo.discountY2 / 100);
      const f2 = p2 - s2;
      msg += `2️⃣ Gói 2 Năm (${pkgData.year2?.cores || 0} lõi): ${formatVND(f2)} ₫  (Giá gốc: ${formatVND(p2)} ₫ - Giảm ${promo.discountY2}%, Tiết kiệm ${formatVND(s2)} ₫) ⭐(Khuyên dùng)\n`;

      // Y3
      const p3 = pkgData.year3?.price || 0;
      const s3 = Math.round(p3 * promo.discountY3 / 100);
      const f3 = p3 - s3;
      msg += `3️⃣ Gói 3 Năm (${pkgData.year3?.cores || 0} lõi): ${formatVND(f3)} ₫  (Giá gốc: ${formatVND(p3)} ₫ - Giảm ${promo.discountY3}%, Tiết kiệm ${formatVND(s3)} ₫)\n`;

      // Y4
      const p4 = pkgData.year4?.price || 0;
      const s4 = Math.round(p4 * promo.discountY4 / 100);
      const f4 = p4 - s4;
      msg += `4️⃣ Gói 4 Năm (${pkgData.year4?.cores || 0} lõi): ${formatVND(f4)} ₫  (Giá gốc: ${formatVND(p4)} ₫ - Giảm ${promo.discountY4}%, Tiết kiệm ${formatVND(s4)} ₫) 👑(Bảo vệ trọn đời máy)\n\n`;
    } else {
      msg += `BẢNG GIÁ DỊCH VỤ THAY LÕI LỌC TRỌN GÓI (ĐÃ BAO GỒM CÔNG THỢ TẬN NHÀ):\n`;
      msg += `1️⃣ Gói 1 Năm (${pkgData.year1?.cores || 0} lõi): ${formatVND(pkgData.year1?.price)} ₫\n`;
      msg += `2️⃣ Gói 2 Năm (${pkgData.year2?.cores || 0} lõi): ${formatVND(pkgData.year2?.price)} ₫  ⭐(Khuyên dùng - Tiết kiệm)\n`;
      msg += `3️⃣ Gói 3 Năm (${pkgData.year3?.cores || 0} lõi): ${formatVND(pkgData.year3?.price)} ₫\n`;
      msg += `4️⃣ Gói 4 Năm (${pkgData.year4?.cores || 0} lõi): ${formatVND(pkgData.year4?.price)} ₫  👑(Gói bảo vệ trọn đời máy)\n\n`;
    }

    const cores = getCoresForProduct(product);
    if (cores && cores.length > 0) {
      msg += `🔩 DANH MỤC LÕI LỌC THAY THẾ (Sheet 'Thời gian thay lõi lọc'):\n`;
      cores.forEach(c => {
        msg += `  • Lõi ${c.position || '-'}: ${c.name} (Định kỳ ${c.intervalMonths || '-'} tháng - Mã ĐMX: ${c.code || '-'})\n`;
      });
      msg += `\n`;
    }

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
    showToast('Đã sao chép nội dung báo giá ưu đãi vào bộ nhớ tạm! Có thể gửi ngay cho khách.', 'success');
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
// ROLE-BASED ACCESS CONTROL (RBAC) CONTROLLER
// Roles: 'staff' (Nhân viên - Mặc định) & 'admin' (Admin - Mật khẩu: 43751)
// Quyền hạn Nhân viên: Chỉ tra cứu, không có quyền thiết lập các thông số khác (như khuyến mãi)
// ==========================================

let selectedRoleInModal = 'staff';

function initRole() {
  const savedRole = localStorage.getItem('tra_cuu_role') || 'staff';
  applyRole(savedRole);
}

function applyRole(role) {
  const isTargetAdmin = (role === 'admin');
  State.currentRole = isTargetAdmin ? 'admin' : 'staff';
  localStorage.setItem('tra_cuu_role', State.currentRole);

  // Cập nhật class trên body để CSS ẩn/hiện và khóa quyền
  document.body.classList.remove('role-staff', 'role-admin');
  document.body.classList.add(isTargetAdmin ? 'role-admin' : 'role-staff');

  // Cập nhật 1 button góc phải trên
  if (DOM.btnRoleToggle) {
    DOM.btnRoleToggle.classList.remove('role-staff', 'role-admin');
    DOM.btnRoleToggle.classList.add(isTargetAdmin ? 'role-admin' : 'role-staff');
    DOM.btnRoleToggle.title = isTargetAdmin 
      ? 'Tài khoản: Quản trị viên (Admin) - Toàn quyền thiết lập (Bấm để đổi)' 
      : 'Tài khoản: Nhân viên - Chỉ tra cứu thông tin (Bấm để chuyển sang Admin)';
  }

  if (DOM.roleBadgeIcon) {
    DOM.roleBadgeIcon.textContent = isTargetAdmin ? '🛡️' : '👤';
  }

  if (DOM.roleBadgeText) {
    DOM.roleBadgeText.textContent = isTargetAdmin ? 'Admin' : 'Nhân viên';
  }

  // Khóa công tắc khuyến mãi khi ở quyền Nhân viên
  if (DOM.togglePromoActive) {
    DOM.togglePromoActive.disabled = !isTargetAdmin;
  }
}

function openRoleModal() {
  if (!DOM.roleModal) return;
  selectedRoleInModal = State.currentRole || 'staff';
  updateRoleModalUI();

  if (DOM.inputAdminPassword) {
    DOM.inputAdminPassword.value = '';
    DOM.inputAdminPassword.type = 'password';
    DOM.inputAdminPassword.classList.remove('input-shake');
  }
  if (DOM.adminPasswordError) {
    DOM.adminPasswordError.style.display = 'none';
  }
  if (DOM.btnToggleAdminPassEye) {
    DOM.btnToggleAdminPassEye.textContent = '👁️';
  }

  DOM.roleModal.style.display = 'flex';

  if (selectedRoleInModal === 'admin' && DOM.inputAdminPassword) {
    setTimeout(() => DOM.inputAdminPassword.focus(), 100);
  }
}

function closeRoleModal() {
  if (!DOM.roleModal) return;
  DOM.roleModal.style.display = 'none';
  if (DOM.inputAdminPassword) {
    DOM.inputAdminPassword.value = '';
    DOM.inputAdminPassword.classList.remove('input-shake');
  }
  if (DOM.adminPasswordError) {
    DOM.adminPasswordError.style.display = 'none';
  }
}

function selectRoleOption(role) {
  selectedRoleInModal = role;
  updateRoleModalUI();
}

function updateRoleModalUI() {
  const isStaff = (selectedRoleInModal === 'staff');

  if (DOM.optRoleStaff && DOM.optRoleAdmin) {
    DOM.optRoleStaff.classList.toggle('active', isStaff);
    DOM.optRoleAdmin.classList.toggle('active', !isStaff);

    const staffRadio = DOM.optRoleStaff.querySelector('.role-opt-radio');
    const adminRadio = DOM.optRoleAdmin.querySelector('.role-opt-radio');
    if (staffRadio) staffRadio.textContent = isStaff ? '✓' : '';
    if (adminRadio) adminRadio.textContent = !isStaff ? '✓' : '';
  }

  if (DOM.adminPasswordBlock) {
    DOM.adminPasswordBlock.style.display = isStaff ? 'none' : 'block';
  }

  if (DOM.adminPasswordError) {
    DOM.adminPasswordError.style.display = 'none';
  }

  if (DOM.labelConfirmRole) {
    DOM.labelConfirmRole.textContent = isStaff ? 'Xác Nhận (Nhân viên)' : 'Đăng Nhập Admin';
  }

  if (!isStaff && DOM.inputAdminPassword) {
    setTimeout(() => DOM.inputAdminPassword.focus(), 80);
  }
}

function handleConfirmRole() {
  if (selectedRoleInModal === 'admin') {
    const enteredPass = DOM.inputAdminPassword?.value || '';
    if (enteredPass.trim() === ADMIN_PASSWORD) {
      applyRole('admin');
      closeRoleModal();
      showToast('🛡️ Xác thực Admin thành công! Đã cấp toàn quyền thiết lập hệ thống.', 'success');
    } else {
      if (DOM.adminPasswordError) {
        DOM.adminPasswordError.style.display = 'block';
      }
      if (DOM.inputAdminPassword) {
        DOM.inputAdminPassword.classList.add('input-shake');
        setTimeout(() => DOM.inputAdminPassword.classList.remove('input-shake'), 400);
        DOM.inputAdminPassword.select();
      }
    }
  } else {
    // Tài khoản Nhân viên: không cần mật khẩu
    applyRole('staff');
    closeRoleModal();
    showToast('👤 Đã chuyển sang tài khoản Nhân viên (Quyền tra cứu thông tin).', 'info');
  }
}

function toggleAdminPasswordEye() {
  if (!DOM.inputAdminPassword) return;
  const isPass = (DOM.inputAdminPassword.type === 'password');
  DOM.inputAdminPassword.type = isPass ? 'text' : 'password';
  if (DOM.btnToggleAdminPassEye) {
    DOM.btnToggleAdminPassEye.textContent = isPass ? '🙈' : '👁️';
  }
}

// ==========================================
// PROMOTION MODAL & SETTINGS MANAGEMENT
// ==========================================

function openPromoSettingsModal() {
  if (State.currentRole !== 'admin') {
    showToast('⚠️ Bạn cần quyền Quản trị viên (Admin) để cài đặt khuyến mãi!', 'error');
    return;
  }
  const p = State.promotions;
  DOM.inputPromoName.value = p.programName || "Chương Trình Ưu Đãi Thay Lõi Thợ ĐMX";
  DOM.inputDiscountY1.value = p.discountY1 ?? 10;
  DOM.inputDiscountY2.value = p.discountY2 ?? 15;
  DOM.inputDiscountY3.value = p.discountY3 ?? 20;
  DOM.inputDiscountY4.value = p.discountY4 ?? 25;
  DOM.promoSettingsModal.style.display = 'flex';
}

function closePromoSettingsModal() {
  DOM.promoSettingsModal.style.display = 'none';
}

function savePromoSettings(isSaveFirebase = false) {
  if (State.currentRole !== 'admin') {
    showToast('⚠️ Nhân viên chỉ có quyền tra cứu, không thể thiết lập thông số!', 'error');
    return;
  }
  const name = DOM.inputPromoName.value.trim() || "Chương Trình Ưu Đãi Thay Lõi Thợ ĐMX";
  const y1 = Math.min(90, Math.max(0, parseInt(DOM.inputDiscountY1.value) || 0));
  const y2 = Math.min(90, Math.max(0, parseInt(DOM.inputDiscountY2.value) || 0));
  const y3 = Math.min(90, Math.max(0, parseInt(DOM.inputDiscountY3.value) || 0));
  const y4 = Math.min(90, Math.max(0, parseInt(DOM.inputDiscountY4.value) || 0));

  State.promotions = {
    enabled: DOM.togglePromoActive.checked,
    programName: name,
    discountY1: y1,
    discountY2: y2,
    discountY3: y3,
    discountY4: y4
  };

  localStorage.setItem('tra_cuu_promotions', JSON.stringify(State.promotions));
  updatePromotionUI();

  if (State.activeProduct) {
    displayProduct(State.activeProduct);
  }

  closePromoSettingsModal();
  showToast('Đã lưu và áp dụng khuyến mãi thành công!', 'success');

  if (isSaveFirebase) {
    pushPromotionsToFirebase(State.promotions);
  }
}

async function pushPromotionsToFirebase(p) {
  try {
    const url = `${FIREBASE_CONFIG.baseUrl}/promotions?key=${FIREBASE_CONFIG.apiKey}`;
    const payload = {
      fields: {
        enabled: { booleanValue: p.enabled },
        programName: { stringValue: p.programName },
        discountY1: { integerValue: String(p.discountY1) },
        discountY2: { integerValue: String(p.discountY2) },
        discountY3: { integerValue: String(p.discountY3) },
        discountY4: { integerValue: String(p.discountY4) },
        updatedAt: { stringValue: new Date().toISOString() }
      }
    };
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (resp.ok) {
      showToast('Đã đồng bộ khuyến mãi mới lên Firebase Firestore!', 'success');
    }
  } catch (err) {
    console.error('Firebase promo upload error:', err);
    showToast('Lỗi tải khuyến mãi lên Firebase: ' + err.message, 'error');
  }
}

function resetPromoDefaults() {
  if (State.currentRole !== 'admin') {
    showToast('⚠️ Nhân viên không có quyền đặt lại thông số khuyến mãi!', 'error');
    return;
  }
  DOM.inputPromoName.value = "Chương Trình Ưu Đãi Thay Lõi Thợ ĐMX";
  DOM.inputDiscountY1.value = 10;
  DOM.inputDiscountY2.value = 15;
  DOM.inputDiscountY3.value = 20;
  DOM.inputDiscountY4.value = 25;
}

// ==========================================
// MOBILE DEVICE SIMULATOR CONTROLLER
// ==========================================

let simIsLandscape = false;

function openMobileSimulator() {
  if (!DOM.simModalOverlay) return;
  // If already running inside iframe, don't open recursive modal
  if (window.self !== window.top || document.body.classList.contains('is-embedded')) return;

  const currentCode = State.currentProduct?.code || (DOM.searchInput?.value.trim() || '1114171000203');
  const targetUrl = `index.html?code=${encodeURIComponent(currentCode)}&embed=1&role=${encodeURIComponent(State.currentRole || 'staff')}`;

  DOM.simIframe.src = targetUrl;
  DOM.simModalOverlay.style.display = 'flex';
  DOM.btnSwitchMobile?.classList.add('active');
  DOM.btnSwitchDesktop?.classList.remove('active');

  updateSimulatorDimensions();
}

function closeMobileSimulator() {
  if (!DOM.simModalOverlay) return;
  DOM.simModalOverlay.style.display = 'none';
  DOM.simIframe.src = 'about:blank';
  DOM.btnSwitchDesktop?.classList.add('active');
  DOM.btnSwitchMobile?.classList.remove('active');
}

function updateSimulatorDimensions() {
  if (!DOM.selectSimDevice || !DOM.simPhoneScreenWrap || !DOM.simPhoneChassis) return;

  const selectedOpt = DOM.selectSimDevice.options[DOM.selectSimDevice.selectedIndex];
  if (!selectedOpt) return;

  let baseW = parseInt(selectedOpt.getAttribute('data-w'), 10) || 440;
  let baseH = parseInt(selectedOpt.getAttribute('data-h'), 10) || 956;
  const os = selectedOpt.getAttribute('data-os') || 'ios';

  let w = simIsLandscape ? baseH : baseW;
  let h = simIsLandscape ? baseW : baseH;

  DOM.simPhoneScreenWrap.style.width = `${w}px`;
  DOM.simPhoneScreenWrap.style.height = `${h}px`;

  DOM.simPhoneChassis.classList.remove('os-ios', 'os-android', 'os-fold');
  DOM.simPhoneChassis.classList.add(`os-${os}`);

  // Calculate Auto Scale so the entire phone comfortably fits in viewport stage
  const scaleSelectVal = DOM.selectSimScale?.value || 'auto';
  let scale = 1;

  if (scaleSelectVal === 'auto') {
    const availableH = Math.max(300, window.innerHeight - 56 - 60); // 56px toolbar + 60px padding/caption
    const availableW = Math.max(300, window.innerWidth - 40);
    const scaleH = availableH / (h + 24); // chassis border
    const scaleW = availableW / (w + 24);
    scale = Math.min(1, scaleH, scaleW);
    scale = Math.max(0.35, Math.min(1, scale));
  } else {
    scale = parseFloat(scaleSelectVal) || 1;
  }

  DOM.simPhoneChassis.style.transform = `scale(${scale.toFixed(3)})`;

  if (DOM.simCurrentDeviceName) {
    DOM.simCurrentDeviceName.textContent = selectedOpt.textContent.split('(')[0].trim();
  }
  if (DOM.simDimCaption) {
    const orientText = simIsLandscape ? 'Ngang' : 'Dọc';
    DOM.simDimCaption.innerHTML = `📱 Đang mô phỏng: <strong>${selectedOpt.textContent.split('(')[0].trim()}</strong> (${w} × ${h} px - ${orientText}) - Tỷ lệ hiển thị: ${Math.round(scale * 100)}%`;
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
  if (DOM.btnMobileScanFab) {
    DOM.btnMobileScanFab.addEventListener('click', openScannerModal);
  }
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

  // Toggle Promotion Switch (Chỉ Admin mới có quyền bật/tắt)
  DOM.togglePromoActive.addEventListener('change', (e) => {
    if (State.currentRole !== 'admin') {
      e.preventDefault();
      DOM.togglePromoActive.checked = State.promotions.enabled;
      showToast('⚠️ Nhân viên chỉ có quyền tra cứu, không thể bật/tắt khuyến mãi!', 'error');
      return;
    }
    State.promotions.enabled = e.target.checked;
    localStorage.setItem('tra_cuu_promotions', JSON.stringify(State.promotions));
    if (State.activeProduct) {
      displayProduct(State.activeProduct);
    }
    showToast(State.promotions.enabled ? 'Đã bật áp dụng khuyến mãi!' : 'Đã tắt khuyến mãi, hiển thị giá gốc.', 'info');
  });

  // Open & Close Promo Settings Modal
  DOM.btnOpenPromoSettings.addEventListener('click', openPromoSettingsModal);
  DOM.btnClosePromoSettings.addEventListener('click', closePromoSettingsModal);
  DOM.promoSettingsModal.addEventListener('click', (e) => {
    if (e.target === DOM.promoSettingsModal) closePromoSettingsModal();
  });

  // Promo Settings Actions
  DOM.btnSavePromoLocal.addEventListener('click', () => savePromoSettings(false));
  DOM.btnSavePromoFirebase.addEventListener('click', () => savePromoSettings(true));
  DOM.btnResetPromoDefaults.addEventListener('click', resetPromoDefaults);

  // Role Switcher & Modal Events (1 Button góc phải trên)
  if (DOM.btnRoleToggle) {
    DOM.btnRoleToggle.addEventListener('click', openRoleModal);
  }
  if (DOM.btnCloseRoleModal) {
    DOM.btnCloseRoleModal.addEventListener('click', closeRoleModal);
  }
  if (DOM.btnCancelRoleModal) {
    DOM.btnCancelRoleModal.addEventListener('click', closeRoleModal);
  }
  if (DOM.roleModal) {
    DOM.roleModal.addEventListener('click', (e) => {
      if (e.target === DOM.roleModal) closeRoleModal();
    });
  }
  if (DOM.optRoleStaff) {
    DOM.optRoleStaff.addEventListener('click', () => selectRoleOption('staff'));
  }
  if (DOM.optRoleAdmin) {
    DOM.optRoleAdmin.addEventListener('click', () => selectRoleOption('admin'));
  }
  if (DOM.btnConfirmRoleChange) {
    DOM.btnConfirmRoleChange.addEventListener('click', handleConfirmRole);
  }
  if (DOM.btnToggleAdminPassEye) {
    DOM.btnToggleAdminPassEye.addEventListener('click', toggleAdminPasswordEye);
  }
  if (DOM.inputAdminPassword) {
    DOM.inputAdminPassword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmRole();
      }
    });
    DOM.inputAdminPassword.addEventListener('input', () => {
      if (DOM.adminPasswordError) DOM.adminPasswordError.style.display = 'none';
      DOM.inputAdminPassword.classList.remove('input-shake');
    });
  }

  // Mobile Grid View Switcher (2x2 Compact vs Detailed)
  if (DOM.btnModeCompact && DOM.btnModeDetail && DOM.yearCardsGrid) {
    DOM.btnModeCompact.addEventListener('click', () => {
      DOM.btnModeCompact.classList.add('active');
      DOM.btnModeDetail.classList.remove('active');
      DOM.yearCardsGrid.classList.remove('detailed-grid');
      DOM.yearCardsGrid.classList.add('compact-grid');

      // Collapse all individual drawers
      DOM.yearCardsGrid.querySelectorAll('.feat-details-drawer.is-open').forEach(el => el.classList.remove('is-open'));
      DOM.yearCardsGrid.querySelectorAll('.btn-card-toggle-details.is-active').forEach(b => {
        b.classList.remove('is-active');
        const text = b.querySelector('span');
        if (text) text.textContent = 'Chi tiết lõi';
      });
    });

    DOM.btnModeDetail.addEventListener('click', () => {
      DOM.btnModeDetail.classList.add('active');
      DOM.btnModeCompact.classList.remove('active');
      DOM.yearCardsGrid.classList.remove('compact-grid');
      DOM.yearCardsGrid.classList.add('detailed-grid');
    });

    // Delegated click for individual card toggle button
    DOM.yearCardsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-card-toggle-details');
      if (!btn) return;
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const drawer = targetId ? document.getElementById(targetId) : btn.closest('.card-features')?.querySelector('.feat-details-drawer');
      if (!drawer) return;

      const isOpen = drawer.classList.toggle('is-open');
      btn.classList.toggle('is-active', isOpen);
      const textSpan = btn.querySelector('span');
      if (textSpan) {
        textSpan.textContent = isOpen ? 'Thu gọn' : 'Chi tiết lõi';
      }
    });
  }

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

  // Device Mode Switcher & Mobile Simulator
  if (DOM.btnSwitchMobile) {
    DOM.btnSwitchMobile.addEventListener('click', openMobileSimulator);
  }
  if (DOM.btnSwitchDesktop) {
    DOM.btnSwitchDesktop.addEventListener('click', closeMobileSimulator);
  }
  if (DOM.btnCloseSimulator) {
    DOM.btnCloseSimulator.addEventListener('click', closeMobileSimulator);
  }
  if (DOM.selectSimDevice) {
    DOM.selectSimDevice.addEventListener('change', updateSimulatorDimensions);
  }
  if (DOM.selectSimScale) {
    DOM.selectSimScale.addEventListener('change', updateSimulatorDimensions);
  }
  if (DOM.btnSimRotate) {
    DOM.btnSimRotate.addEventListener('click', () => {
      simIsLandscape = !simIsLandscape;
      if (DOM.labelSimRotate) DOM.labelSimRotate.textContent = simIsLandscape ? 'Ngang' : 'Dọc';
      updateSimulatorDimensions();
    });
  }
  if (DOM.btnSimReload) {
    DOM.btnSimReload.addEventListener('click', () => {
      if (DOM.simIframe?.contentWindow) {
        DOM.simIframe.contentWindow.location.reload();
      }
    });
  }
  window.addEventListener('resize', () => {
    if (DOM.simModalOverlay && DOM.simModalOverlay.style.display !== 'none' && DOM.selectSimScale?.value === 'auto') {
      updateSimulatorDimensions();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.simModalOverlay && DOM.simModalOverlay.style.display !== 'none') {
      closeMobileSimulator();
    }
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
