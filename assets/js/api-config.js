/**
 * Global API Configuration and Utilities
 * Production-ready API integration for EMRS Dornala
 */

// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://emrsdornala.onrender.com',
  
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout'
    },
    
    // Facilities
    MESS: '/api/mess',
    SCHOOL: '/api/school',
    PLAYGROUND: '/api/playground',
    STAFF_QUARTERS: '/api/staff_quarters',
    HOSTEL: '/api/hostel',
    SPORTS: '/api/facilities/sports',
    CAMPUS: '/api/campus',
    
    // Content
    ANNOUNCEMENTS: '/api/announcements/all',
    EVENTS: '/api/events/all',
    STAFF: '/api/staff/all',
    ALUMNI: '/api/alumni',
    ALUMNI_EVENTS: '/api/alumni-events',
    MENTORS: '/api/mentors/all',
    TESTIMONIALS: '/api/testimonials/all',
    CONTACT: '/api/contact-page'
  },
  
  TIMEOUT: 10000
};

/**
 * Enhanced API Call Handler with Error Management
 */
async function apiCall(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = API_CONFIG.TIMEOUT
  } = options;

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal,
      credentials: 'include'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Endpoint not found: ${endpoint}`);
        return { data: null, error: 'Endpoint not found', status: 404 };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, error: null, status: response.status };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`API call timeout: ${endpoint}`);
      return { data: null, error: 'Request timeout', status: 0 };
    }
    console.error(`API call failed: ${endpoint}`, error);
    return { data: null, error: error.message, status: 0 };
  }
}

/**
 * Facility Data Loader
 */
async function loadFacilityData(facility) {
  const endpoint = API_CONFIG.ENDPOINTS[facility.toUpperCase()] || `${API_CONFIG.BASE_URL}/api/${facility}`;
  
  return Promise.all([
    apiCall(`${endpoint}/hero`),
    apiCall(`${endpoint}/stats`),
    apiCall(`${endpoint}/gallery`)
  ]);
}

/**
 * Render Facility Hero Section
 */
function renderFacilityHero(container, heroData, facilityName) {
  if (!container || !heroData) return;

  const overlay = heroData.overlay_opacity || 0.35;
  const html = `
    <section class="hero-section" style="
      background-image: url('${heroData.banner_image || ''}');
      background-size: cover;
      background-position: center;
      position: relative;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, ${overlay});
      "></div>
      <div style="
        position: relative;
        z-index: 2;
        text-align: center;
        color: white;
      ">
        <h1 style="font-size: 3rem; margin: 0; font-weight: bold;">
          ${escapeHtml(heroData.title || facilityName)}
        </h1>
        <p style="font-size: 1.2rem; margin-top: 1rem;">
          ${escapeHtml(heroData.subtitle || '')}
        </p>
      </div>
    </section>
  `;
  
  container.innerHTML = html;
}

/**
 * Render Facility Statistics
 */
function renderFacilityStats(container, statsData) {
  if (!container || !statsData) return;

  const stats = Object.entries(statsData)
    .filter(([key]) => key !== '_id')
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').toUpperCase(),
      value: value
    }));

  const html = `
    <div class="stats-grid" style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      padding: 2rem;
    ">
      ${stats.map(stat => `
        <div class="stat-card" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
        ">
          <div style="font-size: 2.5rem; font-weight: bold;">
            ${stat.value}
          </div>
          <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.9;">
            ${stat.label}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  container.innerHTML = html;
}

/**
 * Render Facility Gallery
 */
function renderFacilityGallery(container, galleryData) {
  if (!container || !Array.isArray(galleryData) || galleryData.length === 0) {
    if (container) container.innerHTML = '<p style="padding: 2rem; text-align: center;">No gallery items available.</p>';
    return;
  }

  const html = `
    <div class="gallery-grid" style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
    ">
      ${galleryData.map((item, idx) => `
        <div class="gallery-item" style="
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <img src="${item.image || ''}" alt="${escapeHtml(item.title || '')}" style="
            width: 100%;
            height: 250px;
            object-fit: cover;
          ">
          <div style="padding: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0;">${escapeHtml(item.title || 'Untitled')}</h4>
            <p style="margin: 0; color: #666; font-size: 0.9rem;">${escapeHtml(item.caption || '')}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  container.innerHTML = html;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize Facility Page
 */
async function initializeFacilityPage(facility, config = {}) {
  const {
    heroSelector = '.hero-container',
    statsSelector = '.stats-container',
    gallerySelector = '.gallery-container',
    loadingClass = 'loading',
    errorClass = 'error'
  } = config;

  // Get containers
  const heroContainer = document.querySelector(heroSelector);
  const statsContainer = document.querySelector(statsSelector);
  const galleryContainer = document.querySelector(gallerySelector);

  // Add loading state
  [heroContainer, statsContainer, galleryContainer].forEach(el => {
    if (el) el.classList.add(loadingClass);
  });

  try {
    // Load data
    const [heroRes, statsRes, galleryRes] = await loadFacilityData(facility);

    if (heroRes.data && heroContainer) {
      renderFacilityHero(heroContainer, heroRes.data, facility);
    }

    if (statsRes.data && statsContainer) {
      renderFacilityStats(statsContainer, statsRes.data);
    }

    if (galleryRes.data && galleryContainer) {
      renderFacilityGallery(galleryContainer, galleryRes.data);
    }

    // Remove loading state
    [heroContainer, statsContainer, galleryContainer].forEach(el => {
      if (el) el.classList.remove(loadingClass);
    });

  } catch (error) {
    console.error(`Failed to initialize facility page: ${facility}`, error);
    [heroContainer, statsContainer, galleryContainer].forEach(el => {
      if (el) {
        el.classList.remove(loadingClass);
        el.classList.add(errorClass);
        el.innerHTML = '<p style="padding: 2rem; color: red;">Failed to load content. Please try again later.</p>';
      }
    });
  }
}

/**
 * Load Generic API Content
 */
async function loadApiContent(endpoint, containerSelector, renderFunction) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.classList.add('loading');

  try {
    const { data, error } = await apiCall(endpoint);
    
    if (error || !data) {
      throw new Error(error || 'Failed to load content');
    }

    renderFunction(container, data);
    container.classList.remove('loading');
  } catch (err) {
    console.error(`Failed to load content from ${endpoint}`, err);
    container.classList.add('error');
    container.innerHTML = '<p style="padding: 1rem; color: red;">Failed to load content.</p>';
  }
}

// Export for use in other scripts
window.API = {
  config: API_CONFIG,
  call: apiCall,
  loadFacilityData,
  renderFacilityHero,
  renderFacilityStats,
  renderFacilityGallery,
  initializeFacilityPage,
  loadApiContent,
  escapeHtml
};

console.log('✅ API Configuration loaded. Base URL:', API_CONFIG.BASE_URL);
