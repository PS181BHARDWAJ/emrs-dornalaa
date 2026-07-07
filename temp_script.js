
let alumniMenuOpen = false;
let facilitiesMenuOpen = false;
let resultsMenuOpen = false;
let admissionsMenuOpen = false;
const THEME_STORAGE_KEY = 'emrs_admin_theme';
const SIDEBAR_STORAGE_KEY = 'emrs_admin_sidebar';

function isMobileView() {
  return window.matchMedia('(max-width: 992px)').matches;
}

function renderLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function updateThemeToggleEmoji() {
  const emoji = document.getElementById('themeToggleEmoji');
  if (!emoji) return;
  emoji.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
}

function applyTheme(theme, persist = true) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  updateThemeToggleEmoji();
  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }
}

function toggleTheme() {
  document.body.classList.add('theme-transition');
  const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(nextTheme, true);
  setTimeout(() => document.body.classList.remove('theme-transition'), 320);
}

function applyDesktopSidebarState() {
  const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY) || 'expanded';
  document.body.classList.toggle('sidebar-collapsed', saved === 'collapsed');
}

function toggleSidebar() {
  if (isMobileView()) {
    document.body.classList.toggle('sidebar-mobile-open');
    return;
  }

  const collapsed = document.body.classList.toggle('sidebar-collapsed');
  localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'collapsed' : 'expanded');
}

function closeMobileSidebar() {
  document.body.classList.remove('sidebar-mobile-open');
}

function syncSidebarWithViewport() {
  if (isMobileView()) {
    document.body.classList.remove('sidebar-collapsed');
  } else {
    document.body.classList.remove('sidebar-mobile-open');
    applyDesktopSidebarState();
  }
}

function initializeDashboardPreferences() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  applyTheme(savedTheme, false);
  syncSidebarWithViewport();

  // Keep Alumni submenu expanded by default so all 4 items are visible.
  setAlumniMenuState(true, false);
  setFacilitiesMenuState(true, false);
  setResultsMenuState(true, false);
  setAdmissionsMenuState(true, false);
}

function setAlumniMenuState(isOpen, scrollLastItem = false) {
  alumniMenuOpen = !!isOpen;
  const menu = document.getElementById('alumniMenu');
  const icon = document.getElementById('alumniToggleIcon');
  if (!menu || !icon) return;

  if (alumniMenuOpen) {
    menu.classList.remove('is-collapsed');
    icon.style.transform = 'rotate(90deg)';

    if (scrollLastItem) {
      const lastItem = document.getElementById('navAlumniTestimonials');
      if (lastItem) {
        lastItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  } else {
    menu.classList.add('is-collapsed');
    icon.style.transform = 'rotate(0)';
  }
}

function setFacilitiesMenuState(isOpen, scrollLastItem = false) {
  facilitiesMenuOpen = !!isOpen;
  const menu = document.getElementById('facilitiesMenu');
  const icon = document.getElementById('facilitiesToggleIcon');
  if (!menu || !icon) return;

  if (facilitiesMenuOpen) {
    menu.classList.remove('is-collapsed');
    icon.style.transform = 'rotate(90deg)';

    if (scrollLastItem) {
      const lastItem = document.getElementById('navSportsAchievements');
      if (lastItem) {
        lastItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  } else {
    menu.classList.add('is-collapsed');
    icon.style.transform = 'rotate(0)';
  }
}

function setResultsMenuState(isOpen, scrollLastItem = false) {
  resultsMenuOpen = !!isOpen;
  const menu = document.getElementById('resultsMenu');
  const icon = document.getElementById('resultsToggleIcon');
  if (!menu || !icon) return;

  if (resultsMenuOpen) {
    menu.classList.remove('is-collapsed');
    icon.style.transform = 'rotate(90deg)';

    if (scrollLastItem) {
      const lastItem = document.getElementById('navResultsClassPortals');
      if (lastItem) {
        lastItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  } else {
    menu.classList.add('is-collapsed');
    icon.style.transform = 'rotate(0)';
  }
}

function toggleResultsMenu() {
  setResultsMenuState(!resultsMenuOpen, true);
}

function toggleAlumniMenu() {
  setAlumniMenuState(!alumniMenuOpen, true);
}

function toggleFacilitiesMenu() {
  setFacilitiesMenuState(!facilitiesMenuOpen, true);
}

function setAdmissionsMenuState(isOpen, scrollLastItem = false) {
  admissionsMenuOpen = !!isOpen;
  const menu = document.getElementById('admissionsMenu');
  const icon = document.getElementById('admissionsToggleIcon');
  if (!menu || !icon) return;

  if (admissionsMenuOpen) {
    menu.classList.remove('is-collapsed');
    icon.style.transform = 'rotate(90deg)';

    if (scrollLastItem) {
      const lastItem = document.getElementById('navAdmissionsRejected');
      if (lastItem) {
        lastItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  } else {
    menu.classList.add('is-collapsed');
    icon.style.transform = 'rotate(0)';
  }
}

function toggleAdmissionsMenu() {
  setAdmissionsMenuState(!admissionsMenuOpen, true);
}

function showProfileMenu(event) {
  event.stopPropagation();
  alert('Profile & Settings - Coming Soon!');
}

function updateLastModified() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeStr = `${hours}:${String(minutes).padStart(2, '0')}`;
  document.getElementById('lastUpdatedTime').textContent = timeStr;
}

function resetDashboardScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  const scrollTargets = [document.getElementById('appMain'), ...document.querySelectorAll('.manager-pane')];
  scrollTargets.forEach((target) => {
    if (!target) return;
    target.scrollTop = 0;
    target.scrollLeft = 0;
  });
}

// Initialize last modified time
updateLastModified();
setInterval(updateLastModified, 60000);

const baseUrl = 'https://emrsdornala.onrender.com/api';
const facilitiesBase = baseUrl + '/facilities';
const mediaBaseUrl = baseUrl.replace(/\/api\/?$/, '');
const token = localStorage.getItem('emrs_token');
if(!token) { window.location.href='admin-login.html'; }

const facilityConfigs = {
  mess: {
    navId: 'navMessInfo',
    managerId: 'messManager',
    routePrefix: '/mess',
    heroDefaults: {
      title: 'Mess Facilities',
      subtitle: 'Nutritious and hygienic dining for every student.',
      overlay_opacity: 0.35,
    },
    statsDefaults: {
      students: 500,
      meals: 4,
      staff: 12,
      quality: 100,
    },
    statFields: [
      { name: 'students', label: 'Students Served Daily', placeholder: '500' },
      { name: 'meals', label: 'Meals Per Day', placeholder: '4' },
      { name: 'staff', label: 'Kitchen Staff', placeholder: '12' },
      { name: 'quality', label: 'Hygiene Standards (%)', placeholder: '100' },
    ],
    heroFields: [
      { name: 'title', label: 'Title', placeholder: 'Mess Facilities' },
      { name: 'subtitle', label: 'Subtitle', placeholder: 'Nutritious and hygienic dining for every student.' },
      { name: 'overlay_opacity', label: 'Overlay Opacity', placeholder: '0.35', type: 'number', min: 0, max: 1, step: 0.05 },
    ],
  },
  school: {
    navId: 'navSchoolInfo',
    managerId: 'schoolManager',
    routePrefix: '/school',
    heroDefaults: {
      title: 'School Campus',
      subtitle: 'Modern classrooms, labs and innovative learning spaces.',
      overlay_opacity: 0.35,
    },
    statsDefaults: {
      students: 520,
      teachers: 32,
      smart_classes: 8,
      pass_rate: 96,
    },
    statFields: [
      { name: 'students', label: 'Students', placeholder: '520' },
      { name: 'teachers', label: 'Teachers', placeholder: '32' },
      { name: 'smart_classes', label: 'Smart Classrooms', placeholder: '8' },
      { name: 'pass_rate', label: 'Pass Rate (%)', placeholder: '96' },
    ],
    heroFields: [
      { name: 'title', label: 'Title', placeholder: 'School Campus' },
      { name: 'subtitle', label: 'Subtitle', placeholder: 'Modern classrooms, labs and innovative learning spaces.' },
      { name: 'overlay_opacity', label: 'Overlay Opacity', placeholder: '0.35', type: 'number', min: 0, max: 1, step: 0.05 },
    ],
  },
  playground: {
    navId: 'navPlaygroundInfo',
    managerId: 'playgroundManager',
    routePrefix: '/playground',
    heroDefaults: {
      title: 'Playground Facilities',
      subtitle: 'Sports grounds that build strength, discipline and teamwork.',
      overlay_opacity: 0.35,
    },
    statsDefaults: {
      sports: 14,
      grounds: 6,
      athletes: 94,
      achievements: 28,
    },
    statFields: [
      { name: 'sports', label: 'Sports Offered', placeholder: '14' },
      { name: 'grounds', label: 'Play Areas', placeholder: '6' },
      { name: 'athletes', label: 'Student Athletes', placeholder: '94' },
      { name: 'achievements', label: 'Achievements', placeholder: '28' },
    ],
    heroFields: [
      { name: 'title', label: 'Title', placeholder: 'Playground Facilities' },
      { name: 'subtitle', label: 'Subtitle', placeholder: 'Sports grounds that build strength, discipline and teamwork.' },
      { name: 'overlay_opacity', label: 'Overlay Opacity', placeholder: '0.35', type: 'number', min: 0, max: 1, step: 0.05 },
    ],
  },
  staffQuarters: {
    navId: 'navStaffQuartersInfo',
    managerId: 'staffQuartersManager',
    routePrefix: '/staff_quarters',
    heroDefaults: {
      title: 'Staff Quarters',
      subtitle: 'Secure, comfortable housing for faculty and staff.',
      overlay_opacity: 0.35,
    },
    statsDefaults: {
      units: 72,
      faculty: 42,
      security: 24,
      occupancy: 98,
    },
    statFields: [
      { name: 'units', label: 'Housing Units', placeholder: '72' },
      { name: 'faculty', label: 'Faculty Accommodation', placeholder: '42' },
      { name: 'security', label: 'Security Staff', placeholder: '24' },
      { name: 'occupancy', label: 'Occupancy (%)', placeholder: '98' },
    ],
    heroFields: [
      { name: 'title', label: 'Title', placeholder: 'Staff Quarters' },
      { name: 'subtitle', label: 'Subtitle', placeholder: 'Secure, comfortable housing for faculty and staff.' },
      { name: 'overlay_opacity', label: 'Overlay Opacity', placeholder: '0.35', type: 'number', min: 0, max: 1, step: 0.05 },
    ],
  },
};

async function loadFacilityManager(section) {
  const config = facilityConfigs[section];
  if (!config) {
    showAlert('Unknown facility section: ' + section, 'danger');
    return;
  }

  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  const activeNav = document.getElementById(config.navId);
  if (activeNav) activeNav.classList.add('active');

  panelTitle.textContent = `Manage ${config.heroDefaults.title}`;
  const manager = document.getElementById(config.managerId);
  document.querySelectorAll('[id$="Manager"]').forEach(el => el.classList.add('d-none'));
  if (!manager) {
    showAlert('Facility manager pane not found', 'danger');
    return;
  }
  manager.classList.remove('d-none');

  const heroFormId = `${section}HeroForm`;
  const heroTitleId = `${section}HeroTitle`;
  const heroSubtitleId = `${section}HeroSubtitle`;
  const heroOverlayId = `${section}HeroOverlay`;
  const heroBannerId = `${section}HeroBanner`;
  const heroBannerPreviewId = `${section}HeroBannerPreview`;

  const statsFormId = `${section}StatsForm`;
  const statsFieldsHtml = config.statFields.map(field => {
    const fieldId = `${section}Stat_${field.name}`;
    const inputType = field.type || 'number';
    const stepAttr = field.type === 'number' && field.step ? `step="${field.step}"` : '';
    const minAttr = field.type === 'number' && typeof field.min !== 'undefined' ? `min="${field.min}"` : '';
    const maxAttr = field.type === 'number' && typeof field.max !== 'undefined' ? `max="${field.max}"` : '';
    return `
          <div>
            <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">${field.label}</label>
            <input type="${inputType}" id="${fieldId}" placeholder="${field.placeholder}" ${stepAttr} ${minAttr} ${maxAttr} style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
          </div>`;
  }).join('');

  const galleryFormId = `${section}GalleryForm`;
  const galleryTitleId = `${section}GalleryTitle`;
  const galleryCaptionId = `${section}GalleryCaption`;
  const galleryMediaTypeId = `${section}GalleryMediaType`;
  const galleryMediaId = `${section}GalleryMedia`;
  const galleryOrderId = `${section}GalleryOrder`;
  const galleryFeaturedId = `${section}GalleryFeatured`;
  const galleryActiveId = `${section}GalleryActive`;
  const galleryEditId = `${section}GalleryEditId`;
  const galleryContentId = `${section}GalleryContent`;

  const html = `
    <div style="display:grid; gap:1.5rem;">
      <section style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Hero Section</h4>
        <form id="${heroFormId}" style="display:grid; gap:1rem;">
          <div>
            <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Title</label>
            <input type="text" id="${heroTitleId}" placeholder="${config.heroDefaults.title}" required style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
          </div>
          <div>
            <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Subtitle</label>
            <input type="text" id="${heroSubtitleId}" placeholder="${config.heroDefaults.subtitle}" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
          </div>
          <div>
            <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Banner Image</label>
            <input type="file" id="${heroBannerId}" accept="image/*" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
            <img id="${heroBannerPreviewId}" style="display:none; max-width:100%; max-height:220px; margin-top:0.75rem; border-radius:0.5rem; border:1px solid var(--border);">
          </div>
          <div>
            <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Overlay Opacity</label>
            <input type="number" id="${heroOverlayId}" min="0" max="1" step="0.05" value="${config.heroDefaults.overlay_opacity}" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
          </div>
          <button type="submit" style="padding:0.75rem 1.5rem; background:var(--primary); color:white; border:none; border-radius:0.5rem; cursor:pointer; font-weight:600;">Save Hero</button>
        </form>
      </section>

      <section style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Stats Section</h4>
        <form id="${statsFormId}" style="display:grid; gap:1rem;">
          ${statsFieldsHtml}
          <button type="submit" style="padding:0.75rem 1.5rem; background:var(--primary); color:white; border:none; border-radius:0.5rem; cursor:pointer; font-weight:600;">Save Stats</button>
        </form>
      </section>

      <section style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Gallery Section</h4>
        <form id="${galleryFormId}" style="display:grid; gap:1rem;">
          <input type="hidden" id="${galleryEditId}" value="">
          <div>
            <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Title</label>
            <input type="text" id="${galleryTitleId}" placeholder="Gallery title" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
          </div>
          <div>
            <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Caption</label>
            <textarea id="${galleryCaptionId}" rows="3" placeholder="Optional caption" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem; resize:vertical;"></textarea>
          </div>
          <div style="display:grid; gap:1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
            <div>
              <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Media Type</label>
              <select id="${galleryMediaTypeId}" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Media File</label>
              <input type="file" id="${galleryMediaId}" accept="image/*,video/*" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
            </div>
            <div>
              <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Order</label>
              <input type="number" id="${galleryOrderId}" value="0" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
            </div>
          </div>
          <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
            <label style="display:flex; gap:0.5rem; align-items:center; font-weight:600; margin:0;"><input type="checkbox" id="${galleryFeaturedId}"> Featured</label>
            <label style="display:flex; gap:0.5rem; align-items:center; font-weight:600; margin:0;"><input type="checkbox" id="${galleryActiveId}" checked> Active</label>
          </div>
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
            <button type="submit" style="padding:0.75rem 1.5rem; background:var(--primary); color:white; border:none; border-radius:0.5rem; cursor:pointer; font-weight:600;">Save Gallery Item</button>
            <button type="button" id="${galleryFormId}Cancel" style="display:none; padding:0.75rem 1.5rem; background:var(--text-secondary); color:white; border:none; border-radius:0.5rem; cursor:pointer; font-weight:600;">Cancel Edit</button>
          </div>
        </form>
        <div id="${galleryContentId}" style="margin-top:1.5rem; min-height:200px; color:var(--text-secondary);">Loading gallery...</div>
      </section>
    </div>
  `;

  manager.innerHTML = html;

  document.getElementById(heroBannerId).addEventListener('change', (event) => {
    const file = event.target.files[0];
    const preview = document.getElementById(heroBannerPreviewId);
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else if (preview) {
      preview.style.display = 'none';
    }
  });

  document.getElementById(heroFormId).addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById(heroTitleId).value);
    formData.append('subtitle', document.getElementById(heroSubtitleId).value);
    formData.append('overlay_opacity', document.getElementById(heroOverlayId).value);
    const file = document.getElementById(heroBannerId).files[0];
    if (file) formData.append('banner', file);

    const response = await fetch(`${baseUrl}${config.routePrefix}/hero`, {
      method: 'PUT',
      headers: {'Authorization': 'Bearer ' + token},
      body: formData,
    });
    if (!response.ok) {
      showAlert('Failed to save hero settings', 'danger');
      return;
    }
    showAlert('Hero section saved');
    await loadFacilityHeroData(section);
  });

  document.getElementById(statsFormId).addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    config.statFields.forEach(field => {
      formData.append(field.name, document.getElementById(`${section}Stat_${field.name}`).value);
    });

    const response = await fetch(`${baseUrl}${config.routePrefix}/stats`, {
      method: 'PUT',
      headers: {'Authorization': 'Bearer ' + token},
      body: formData,
    });
    if (!response.ok) {
      showAlert('Failed to save stats', 'danger');
      return;
    }
    showAlert('Stats saved');
    await loadFacilityStatsData(section);
  });

  const galleryForm = document.getElementById(galleryFormId);
  galleryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const editIdValue = document.getElementById(galleryEditId).value;
    const formData = new FormData();
    formData.append('title', document.getElementById(galleryTitleId).value);
    formData.append('caption', document.getElementById(galleryCaptionId).value);
    formData.append('featured', document.getElementById(galleryFeaturedId).checked ? 'true' : 'false');
    formData.append('display_order', document.getElementById(galleryOrderId).value || '0');
    formData.append('active', document.getElementById(galleryActiveId).checked ? 'true' : 'false');
    const mediaFile = document.getElementById(galleryMediaId).files[0];
    if (mediaFile) {
      formData.append('image', mediaFile);
    }

    const method = editIdValue ? 'PUT' : 'POST';
    const url = editIdValue ? `${baseUrl}${config.routePrefix}/gallery/${editIdValue}` : `${baseUrl}${config.routePrefix}/gallery`;
    const response = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!response.ok) {
      showAlert('Failed to save gallery item', 'danger');
      return;
    }
    showAlert(editIdValue ? 'Gallery item updated' : 'Gallery item added');
    galleryForm.reset();
    document.getElementById(galleryEditId).value = '';
    document.getElementById(`${galleryFormId}Cancel`).style.display = 'none';
    await loadFacilityGalleryData(section);
  });

  document.getElementById(`${galleryFormId}Cancel`).addEventListener('click', () => {
    galleryForm.reset();
    document.getElementById(galleryEditId).value = '';
    document.getElementById(`${galleryFormId}Cancel`).style.display = 'none';
  });

  await loadFacilityData(section);
}

async function loadFacilityData(section) {
  await Promise.all([
    loadFacilityHeroData(section),
    loadFacilityStatsData(section),
    loadFacilityGalleryData(section),
  ]);
}

async function loadFacilityHeroData(section) {
  const config = facilityConfigs[section];
  if (!config) return;
  const heroTitleId = `${section}HeroTitle`;
  const heroSubtitleId = `${section}HeroSubtitle`;
  const heroOverlayId = `${section}HeroOverlay`;
  const heroBannerPreviewId = `${section}HeroBannerPreview`;

  const response = await fetch(`${baseUrl}${config.routePrefix}/hero`);
  if (!response.ok) {
    showAlert('Unable to load hero data', 'danger');
    return;
  }
  const data = await response.json();
  document.getElementById(heroTitleId).value = data.title || config.heroDefaults.title;
  document.getElementById(heroSubtitleId).value = data.subtitle || config.heroDefaults.subtitle;
  document.getElementById(heroOverlayId).value = data.overlay_opacity ?? config.heroDefaults.overlay_opacity;
  const preview = document.getElementById(heroBannerPreviewId);
  if (data.banner_image && preview) {
    preview.src = normalizeMediaUrl(data.banner_image);
    preview.style.display = 'block';
  } else if (preview) {
    preview.style.display = 'none';
  }
}

async function loadFacilityStatsData(section) {
  const config = facilityConfigs[section];
  if (!config) return;
  const response = await fetch(`${baseUrl}${config.routePrefix}/stats`);
  if (!response.ok) {
    showAlert('Unable to load stats data', 'danger');
    return;
  }
  const data = await response.json();
  config.statFields.forEach(field => {
    const fieldId = `${section}Stat_${field.name}`;
    const input = document.getElementById(fieldId);
    if (input) input.value = data[field.name] ?? '';
  });
}

async function loadFacilityGalleryData(section) {
  const config = facilityConfigs[section];
  if (!config) return;
  const galleryContentId = `${section}GalleryContent`;
  const container = document.getElementById(galleryContentId);
  if (!container) return;

  const response = await fetch(`${baseUrl}${config.routePrefix}/gallery`);
  if (!response.ok) {
    container.innerHTML = '<div style="padding:1rem; color:var(--text-secondary)">Unable to load gallery.</div>';
    return;
  }
  const items = await response.json();
  if (!items || items.length === 0) {
    container.innerHTML = '<div style="padding:1rem; color:var(--text-secondary)">No gallery items yet.</div>';
    return;
  }

  container.innerHTML = `
    <table style="width:100%; border-collapse: collapse;">
      <thead style="border-bottom: 2px solid var(--border);">
        <tr>
          <th style="padding: 1rem; text-align:left; font-weight:700;">Title</th>
          <th style="padding: 1rem; text-align:left; font-weight:700;">Type</th>
          <th style="padding: 1rem; text-align:left; font-weight:700;">Featured</th>
          <th style="padding: 1rem; text-align:left; font-weight:700;">Status</th>
          <th style="padding: 1rem; text-align:center; font-weight:700;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:1rem;">${item.title || '-'}</td>
            <td style="padding:1rem;">${item.image ? 'Media' : 'N/A'}</td>
            <td style="padding:1rem;">${item.featured ? 'Yes' : 'No'}</td>
            <td style="padding:1rem;">${item.active ? 'Active' : 'Inactive'}</td>
            <td style="padding:1rem; text-align:center; white-space:nowrap;">
              <button onclick="editFacilityGalleryItem('${section}','${item.id}')" style="padding:0.4rem 0.8rem; background:var(--primary); color:white; border:none; border-radius:0.35rem; cursor:pointer; margin-right:0.4rem;">Edit</button>
              <button onclick="deleteFacilityGalleryItem('${section}','${item.id}')" style="padding:0.4rem 0.8rem; background:var(--danger); color:white; border:none; border-radius:0.35rem; cursor:pointer;">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function editFacilityGalleryItem(section, id) {
  const config = facilityConfigs[section];
  if (!config) return;
  const response = await fetch(`${baseUrl}${config.routePrefix}/gallery/${id}`);
  if (!response.ok) {
    showAlert('Failed to load gallery details', 'danger');
    return;
  }
  const item = await response.json();
  document.getElementById(`${section}GalleryEditId`).value = id;
  document.getElementById(`${section}GalleryTitle`).value = item.title || '';
  document.getElementById(`${section}GalleryCaption`).value = item.caption || '';
  document.getElementById(`${section}GalleryMediaType`).value = item.media_type || 'image';
  document.getElementById(`${section}GalleryFeatured`).checked = item.featured || false;
  document.getElementById(`${section}GalleryActive`).checked = item.active !== false;
  document.getElementById(`${section}GalleryOrder`).value = item.display_order || 0;
  document.getElementById(`${section}GalleryFormCancel`).style.display = 'inline-flex';
}

async function deleteFacilityGalleryItem(section, id) {
  if (!confirm('Delete this gallery item?')) return;
  const config = facilityConfigs[section];
  if (!config) return;
  const response = await fetch(`${baseUrl}${config.routePrefix}/gallery/${id}`, {
    method: 'DELETE',
    headers: {'Authorization': 'Bearer ' + token},
  });
  if (!response.ok) {
    showAlert('Failed to delete gallery item', 'danger');
    return;
  }
  showAlert('Gallery item deleted');
  await loadFacilityGalleryData(section);
}

let editSectionId = null;

const panelTitle = document.getElementById('panelTitle');
const announcementManager = document.getElementById('announcementManager');
const notificationManager = document.getElementById('notificationManager');
const eventsManager = document.getElementById('eventsManager');
const calendarManager = document.getElementById('calendarManager');
const staffManager = document.getElementById('staffManager');
const contactPageManager = document.getElementById('contactPageManager');
const resultsManager = document.getElementById('resultsManager');
const alumniNotableManager = document.getElementById('alumniNotableManager');
const alumniEventsManager = document.getElementById('alumniEventsManager');
const alumniTestimonialsManager = document.getElementById('alumniTestimonialsManager');
const admissionsManager = document.getElementById('admissionsManager');
const admissionsCircularsManager = document.getElementById('admissionsCircularsManager');
const admissionsScheduleManager = document.getElementById('admissionsScheduleManager');
let cachedCircularItems = [];
let cachedScheduleItems = [];
let cachedEventItems = [];
let cachedCalendarItems = [];
let cachedStaffItems = [];
let cachedAlumniNotable = [];
let cachedAlumniEvents = [];
let cachedAlumniTestimonials = [];
const managerCache = new Map();
const MANAGER_CACHE_TTL = 45000;

async function fetchJsonCached(cacheKey, url, fallback = []) {
  const now = Date.now();
  const cached = managerCache.get(cacheKey);
  if (cached && now - cached.ts < MANAGER_CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url, {headers:{'Authorization':'Bearer '+token}});
  if (!response.ok) {
    if (cached) return cached.data;
    return fallback;
  }

  const data = await response.json();
  managerCache.set(cacheKey, { ts: now, data });
  return data;
}

function hideAllManagers() {
  document.querySelectorAll('[id$="Manager"]').forEach(el => el.classList.add('d-none'));
}

function showAlert(message, type='success') {
  const safeMessage = String(message || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const alertHtml = `<div class="alert alert-${type}" style="margin-bottom: 1rem;"><i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${safeMessage}</span></div>`;
  document.getElementById('alerts').innerHTML = alertHtml;
  setTimeout(() => {
    const alert = document.querySelector('.alert');
    if (alert) {
      alert.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => document.getElementById('alerts').innerHTML = '', 300);
    }
  }, 3000);
}

function normalizeMediaUrl(url) {
  if (!url) return '';
  const value = String(url);
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${mediaBaseUrl}${value}`;
  return `${mediaBaseUrl}/uploads/${value.replace(/^\/+/, '')}`;
}

async function fetchJsonFirstAvailable(paths, options = {}) {
  let lastError = null;
  for (const path of paths) {
    try {
      const res = await fetch(`${baseUrl}${path}`, options);
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404) {
        lastError = new Error(`404 for ${path}`);
        continue;
      }
      lastError = new Error(`${res.status} for ${path}`);
      continue;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No endpoint available');
}

async function fetchJsonOptional(paths, options = {}, fallback = []) {
  try {
    return await fetchJsonFirstAvailable(paths, options);
  } catch (error) {
    return fallback;
  }
}

function setActiveNav(selectedPage) {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  const item = document.querySelector(`[data-page='${selectedPage}']`);
  if(item) item.classList.add('active');
}

function escapeHtml(text) {
  return String(text||'')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\n/g, '\\n');
}

async function loadAnnouncements(){
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navAnnouncements').classList.add('active');
  loadAnnouncementManager('whats_new');
}

async function loadNotifications(){
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navNotifications').classList.add('active');
  loadAnnouncementManager('notification');
}

function fillAnnouncementForm(item){
  document.getElementById('annEditId').value = item.id || '';
  document.getElementById('annTitle').value = item.title || '';
  document.getElementById('annMessage').value = item.message || '';
  document.getElementById('annLink').value = item.link && item.link !== '#' ? item.link : '';
  document.getElementById('annPdfUrl').value = item.pdf_url || '';
  document.getElementById('annFileSize').value = item.file_size || '';
  document.getElementById('annCategory').value = item.category || 'notification';
  document.getElementById('annIsNew').checked = !!item.is_new;
  document.getElementById('annShowTicker').checked = !!item.show_in_ticker;
  document.getElementById('annActive').checked = !!item.active;
  document.getElementById('announcementFormTitle').textContent = 'Edit Item';
  document.getElementById('announcementSubmitBtn').textContent = 'Update';
}

function resetAnnouncementForm(defaultCategory){
  document.getElementById('annEditId').value = '';
  document.getElementById('annTitle').value = '';
  document.getElementById('annMessage').value = '';
  document.getElementById('annLink').value = '';
  document.getElementById('annPdfUrl').value = '';
  document.getElementById('annFileSize').value = '';
  document.getElementById('annImage').value = '';
  document.getElementById('annPdfFile').value = '';
  document.getElementById('annCategory').value = defaultCategory;
  document.getElementById('annIsNew').checked = false;
  document.getElementById('annShowTicker').checked = true;
  document.getElementById('annActive').checked = true;
  document.getElementById('announcementFormTitle').textContent = defaultCategory === 'whats_new' ? 'Add What\'s New Item' : 'Add Notification Item';
  document.getElementById('announcementSubmitBtn').textContent = 'Add';
}

async function loadAnnouncementManager(category){
  const isWhatsNew = category === 'whats_new';
  panelTitle.textContent = isWhatsNew ? 'Manage Announcements' : 'Manage Notifications';
  hideAllManagers();
  announcementManager.classList.remove('d-none');

  let list = [];
  try {
    const payload = await fetchJsonCached('announcements_all', `${baseUrl}/announcements/all`, []);
    list = Array.isArray(payload) ? payload : [];
  } catch (error) {
    showAlert('Unable to load announcements. Please login again or check API connectivity.', 'danger');
    announcementManager.innerHTML = `<div class="card p-3"><p class="mb-0 text-danger">Could not load data from API.</p></div>`;
    return;
  }

  const filtered = list.filter(item => (item.category || 'notification') === category);

  announcementManager.innerHTML = `
    <div class="card card-accent p-3 mb-3">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem;">
        <i class="fas ${isWhatsNew ? 'fa-newspaper' : 'fa-envelope-open-text'}" style="font-size:1.5rem; color:var(--primary);"></i>
        <div>
          <h5 id="announcementFormTitle" style="margin:0;">${isWhatsNew ? 'Add What\'s New Item' : 'Add Notification Item'}</h5>
          <p style="color:var(--text-secondary); font-size:0.875rem; margin:0.25rem 0 0;">Create and manage your ${isWhatsNew ? 'announcements' : 'notifications'}</p>
        </div>
      </div>
      <form id="announcementForm" onsubmit="return false;" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1rem;">
        <input type="hidden" id="annEditId">
        <div><label>Title <span style="color:var(--danger);">*</span></label><input id="annTitle" class="form-control" required></div>
        <div><label>Category</label><select id="annCategory" class="form-control"><option value="whats_new">What's New</option><option value="notification">Notification</option></select></div>
        <div style="grid-column: 1 / -1;"><label>Description</label><textarea id="annMessage" class="form-control" rows="3"></textarea></div>
        <div><label>Link</label><input id="annLink" class="form-control" placeholder="https://..."></div>
        <div><label>PDF URL</label><input id="annPdfUrl" class="form-control" placeholder="/uploads/...pdf"></div>
        <div><label>File Size</label><input id="annFileSize" class="form-control" placeholder="128 KB"></div>
        <div><label>Image</label><input type="file" id="annImage" class="form-control" accept="image/*"></div>
        <div><label>PDF File</label><input type="file" id="annPdfFile" class="form-control" accept="application/pdf"></div>
        <div style="grid-column: 1 / -1; display:flex; gap:1rem; flex-wrap:wrap;">
          <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="annIsNew" class="form-check-input" style="margin:0;"> Show NEW badge</label>
          <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="annShowTicker" class="form-check-input" checked style="margin:0;"> Show in top ticker</label>
          <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="annActive" class="form-check-input" checked style="margin:0;"> Active</label>
        </div>
        <div style="grid-column: 1 / -1; display:flex; gap:0.75rem;">
          <button id="announcementSubmitBtn" class="btn btn-primary" onclick="saveAnnouncement('${category}')"><i class="fas fa-save"></i> Add</button>
          <button class="btn btn-secondary" type="button" onclick="resetAnnouncementForm('${category}')"><i class="fas fa-redo"></i> Reset</button>
        </div>
      </form>
    </div>
    
    <div class="card p-3">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
        <i class="fas fa-list" style="font-size:1.25rem; color:var(--primary);"></i>
        <h5 style="margin:0;">Existing Items <span style="color:var(--text-tertiary); font-size:0.875rem; font-weight:400;">(${filtered.length})</span></h5>
      </div>
      <div style="overflow-x:auto;">
        <table class="table table-sm">
          <thead>
            <tr>
              <th><i class="fas fa-heading" style="margin-right:0.25rem;"></i> Title</th>
              <th><i class="fas fa-star" style="margin-right:0.25rem;"></i> NEW</th>
              <th><i class="fas fa-rss" style="margin-right:0.25rem;"></i> Ticker</th>
              <th><i class="fas fa-check-circle" style="margin-right:0.25rem;"></i> Active</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map(item=>`<tr>
              <td><strong>${item.title || ''}</strong></td>
              <td><span style="display:inline-block; padding:0.25rem 0.75rem; background:${item.is_new ? 'var(--primary-light)' : 'var(--background)'}; color:${item.is_new ? 'var(--primary)' : 'var(--text-secondary)'}; border-radius:0.375rem; font-size:0.8125rem; font-weight:600;">${item.is_new ? 'Yes':'No'}</span></td>
              <td><span style="display:inline-block; padding:0.25rem 0.75rem; background:${item.show_in_ticker ? 'var(--success-light)' : 'var(--background)'}; color:${item.show_in_ticker ? 'var(--success)' : 'var(--text-secondary)'}; border-radius:0.375rem; font-size:0.8125rem; font-weight:600;">${item.show_in_ticker ? 'Yes':'No'}</span></td>
              <td><span style="display:inline-block; padding:0.25rem 0.75rem; background:${item.active ? 'var(--success-light)' : 'var(--danger-light)'}; color:${item.active ? 'var(--success)' : 'var(--danger)'}; border-radius:0.375rem; font-size:0.8125rem; font-weight:600;">${item.active ? 'Yes':'No'}</span></td>
              <td style="text-align:center;"><button class='btn btn-sm btn-primary' onclick='editAnnouncement("${item.id}", "${category}")'><i class="fas fa-edit"></i></button> <button class='btn btn-sm btn-warning' onclick='toggleAnnouncement("${item.id}", "${category}")'><i class="fas fa-sync"></i></button> <button class='btn btn-sm btn-danger' onclick='deleteAnnouncement("${item.id}", "${category}")'><i class="fas fa-trash"></i></button></td>
            </tr>`).join('') : `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-tertiary);">No items found. Create your first one above!</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const categoryInput = document.getElementById('annCategory');
  categoryInput.value = category;
}


async function saveAnnouncement(defaultCategory){
  const editId = document.getElementById('annEditId').value;
  const title = document.getElementById('annTitle').value;
  const message = document.getElementById('annMessage').value;
  const link = document.getElementById('annLink').value;
  const pdfUrl = document.getElementById('annPdfUrl').value;
  const fileSize = document.getElementById('annFileSize').value;
  const category = document.getElementById('annCategory').value || defaultCategory;
  const isNew = document.getElementById('annIsNew').checked;
  const showInTicker = document.getElementById('annShowTicker').checked;
  const active = document.getElementById('annActive').checked;
  const image = document.getElementById('annImage').files[0];
  const pdfFile = document.getElementById('annPdfFile').files[0];

  const formData = new FormData();
  formData.append('title', title);
  formData.append('message', message);
  formData.append('link', link);
  formData.append('pdf_url', pdfUrl);
  formData.append('file_size', fileSize);
  formData.append('category', category);
  formData.append('is_new', isNew);
  formData.append('show_in_ticker', showInTicker);
  formData.append('active', active);
  if(image) formData.append('image', image);
  if(pdfFile) formData.append('pdf_file', pdfFile);

  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `${baseUrl}/announcements/${editId}` : `${baseUrl}/announcements`;

  const res = await fetch(url, {method, body: formData, headers:{'Authorization':'Bearer '+token}});
  if(!res.ok){
    const text = await res.text();
    showAlert(`Save failed: ${text}`,'danger');
    return;
  }
  managerCache.delete('announcements_all');
  showAlert(editId ? 'Updated item' : 'Created item');
  loadAnnouncementManager(defaultCategory);
}

async function editAnnouncement(id, defaultCategory){
  const list = await fetch(`${baseUrl}/announcements/all`, {headers:{'Authorization':'Bearer '+token}}).then(r=>r.json());
  const item = list.find(entry => entry.id === id);
  if(!item){
    showAlert('Item not found', 'danger');
    return;
  }
  fillAnnouncementForm(item);
  if(!item.category){
    document.getElementById('annCategory').value = defaultCategory;
  }
}

async function toggleAnnouncement(id, defaultCategory){
  await fetch(`${baseUrl}/announcements/${id}/toggle`, {method:'PATCH', headers:{'Authorization':'Bearer '+token}});
  managerCache.delete('announcements_all');
  loadAnnouncementManager(defaultCategory);
}

async function deleteAnnouncement(id, defaultCategory){
  await fetch(`${baseUrl}/announcements/${id}`, {method:'DELETE', headers:{'Authorization':'Bearer '+token}});
  managerCache.delete('announcements_all');
  loadAnnouncementManager(defaultCategory);
}

function previewEventImage(input) {
  const file = input.files && input.files[0];
  const preview = document.getElementById('eventImagePreview');
  if (!preview) return;

  if (!file) {
    preview.style.display = 'none';
    preview.src = '';
    return;
  }

  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.style.display = 'block';
}

function previewEventGallery(input) {
  const wrap = document.getElementById('eventGalleryPreview');
  if (!wrap) return;

  const files = Array.from(input.files || []);
  if (!files.length) {
    wrap.innerHTML = '';
    return;
  }

  wrap.innerHTML = files.map((file) => {
    const url = URL.createObjectURL(file);
    return `<img src="${url}" alt="Gallery preview" style="width:96px; height:74px; object-fit:cover; border-radius:0.4rem; border:1px solid var(--border);">`;
  }).join('');
}

function runEventEditorCommand(command) {
  document.execCommand(command, false, null);
  syncEventDescriptionToInput();
}

function syncEventDescriptionToInput() {
  const editor = document.getElementById('eventFullDescriptionEditor');
  const hidden = document.getElementById('eventFullDescription');
  if (!editor || !hidden) return;
  hidden.value = editor.innerHTML.trim();
}

function setEventEditorContent(value) {
  const editor = document.getElementById('eventFullDescriptionEditor');
  const hidden = document.getElementById('eventFullDescription');
  if (!editor || !hidden) return;
  const html = value || '';
  editor.innerHTML = html;
  hidden.value = html;
}

function initializeEventEditor() {
  const editor = document.getElementById('eventFullDescriptionEditor');
  if (!editor) return;
  editor.addEventListener('input', syncEventDescriptionToInput);
}

function updatePublishBothVisibility() {
  const editId = document.getElementById('eventEditId')?.value;
  const category = document.getElementById('eventCategory')?.value;
  const publishBothWrap = document.getElementById('publishBothToggleWrap');
  const publishBothLabel = document.getElementById('publishBothLabel');
  const publishBoth = document.getElementById('publishBoth');
  if (!publishBothWrap || !publishBoth) return;

  const canShow = (category === 'home_slider');
  publishBothWrap.style.display = canShow ? 'block' : 'none';
  if (publishBothLabel) {
    publishBothLabel.textContent = editId
      ? 'Also update in Event'
      : 'Also publish in Event';
  }
  if (!canShow) publishBoth.checked = false;
}

function fillEventForm(item) {
  document.getElementById('eventEditId').value = item.id || '';
  document.getElementById('eventTitle').value = item.title || '';
  document.getElementById('eventShortDescription').value = item.short_description || '';
  setEventEditorContent(item.full_description || '');
  document.getElementById('eventCategory').value = item.category || 'event';
  document.getElementById('eventContentType').value = item.category || 'event';
  document.getElementById('eventSubCategory').value = item.event_category || 'General';
  document.getElementById('eventLocation').value = item.location || '';
  document.getElementById('eventStatus').value = item.status || 'published';
  document.getElementById('eventFeatured').checked = !!item.is_featured;
  document.getElementById('eventHighlighted').checked = !!item.is_highlighted;
  document.getElementById('eventDate').value = item.event_date || '';
  document.getElementById('eventActive').checked = !!item.active;
  document.getElementById('eventImages').value = '';
  document.getElementById('eventBrochure').value = '';
  document.getElementById('eventFormTitle').textContent = 'Edit Item';
  document.getElementById('eventSubmitBtn').textContent = 'Update';

  updatePublishBothVisibility();

  const preview = document.getElementById('eventImagePreview');
  if (item.image_url) {
    preview.src = normalizeMediaUrl(item.image_url);
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
    preview.src = '';
  }

  const galleryPreview = document.getElementById('eventGalleryPreview');
  const galleryImages = Array.isArray(item.gallery_images) ? item.gallery_images : [];
  if (galleryPreview) {
    galleryPreview.innerHTML = galleryImages.map((url) => `
      <img src="${normalizeMediaUrl(url)}" alt="Gallery" style="width:96px; height:74px; object-fit:cover; border-radius:0.4rem; border:1px solid var(--border);">
    `).join('');
  }
}

function resetEventForm(defaultCategory) {
  document.getElementById('eventEditId').value = '';
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventShortDescription').value = '';
  setEventEditorContent('');
  document.getElementById('eventSubCategory').value = 'General';
  document.getElementById('eventLocation').value = '';
  document.getElementById('eventStatus').value = 'published';
  document.getElementById('eventFeatured').checked = false;
  document.getElementById('eventHighlighted').checked = false;
  document.getElementById('eventCategory').value = defaultCategory;
  document.getElementById('eventContentType').value = defaultCategory;
  document.getElementById('eventDate').value = '';
  document.getElementById('eventImage').value = '';
  document.getElementById('eventImages').value = '';
  document.getElementById('eventBrochure').value = '';
  document.getElementById('eventActive').checked = true;
  const publishBoth = document.getElementById('publishBoth');
  if (publishBoth) publishBoth.checked = false;
  document.getElementById('eventFormTitle').textContent = defaultCategory === 'home_slider' ? 'Add Home Slider Item' : (defaultCategory === 'event' ? 'Add Event' : 'Add Achievement');
  document.getElementById('eventSubmitBtn').textContent = 'Add';

  const preview = document.getElementById('eventImagePreview');
  preview.style.display = 'none';
  preview.src = '';
  const galleryPreview = document.getElementById('eventGalleryPreview');
  if (galleryPreview) galleryPreview.innerHTML = '';
  updatePublishBothVisibility();
}

async function loadEventManager(defaultCategory = 'event') {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  const activeNavId = defaultCategory === 'event' ? 'navEvents' : 'navEventItems';
  document.getElementById(activeNavId).classList.add('active');
  panelTitle.textContent = defaultCategory === 'event' ? 'Manage Events' : 'Manage Achievements';
  hideAllManagers();
  eventsManager.classList.remove('d-none');

  cachedEventItems = await fetchJsonCached('events_all', `${baseUrl}/events/all`, []);
  if (!Array.isArray(cachedEventItems)) {
    showAlert('Unable to load event items', 'danger');
    cachedEventItems = [];
  }

  const filteredEventItems = cachedEventItems.filter((item) => {
    const category = String(item?.category || '').toLowerCase();
    if (defaultCategory === 'event') return category === 'event';
    if (defaultCategory === 'achievement') return category === 'achievement' || category === 'home_slider';
    return category === defaultCategory;
  });

  const contentTypeHtml = defaultCategory === 'event'
    ? '<input type="hidden" id="eventContentType" value="event"><input type="hidden" id="eventCategory" value="event">'
    : `<div><label>Content Type Selector</label><select id="eventContentType" class="form-control" onchange="document.getElementById('eventCategory').value=this.value; updatePublishBothVisibility()"><option value="achievement">Achievement</option><option value="home_slider">Home Slider</option></select><input type="hidden" id="eventCategory" value="${defaultCategory}"></div>`;

  eventsManager.innerHTML = `
    <div class="card card-accent p-3 mb-3">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem;">
        <i class="fas fa-star" style="font-size:1.5rem; color:var(--primary);"></i>
        <div>
          <h5 id="eventFormTitle" style="margin:0;">${defaultCategory === 'event' ? 'Add Event' : 'Add Achievement'}</h5>
          <p style="color:var(--text-secondary); font-size:0.875rem; margin:0.25rem 0 0;">Create memorable events and achievements</p>
        </div>
      </div>
      <form id="eventForm" onsubmit="return false;" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1rem;">
        <input type="hidden" id="eventEditId">
        <div><label>Title <span style="color:var(--danger);">*</span></label><input id="eventTitle" class="form-control" required></div>
        ${contentTypeHtml}
        <div><label>Event Category</label><select id="eventSubCategory" class="form-control"><option>Academic</option><option>Cultural</option><option>Sports</option><option>Visit</option><option>Workshop</option><option>Celebration</option><option>General</option></select></div>
        <div><label>Date <span style="color:var(--text-tertiary);">(Optional)</span></label><input id="eventDate" class="form-control" type="date"></div>
        <div><label>Location <span style="color:var(--text-tertiary);">(Optional)</span></label><input id="eventLocation" class="form-control" placeholder="Campus Auditorium, Dornala"></div>
        <div><label>Status</label><select id="eventStatus" class="form-control"><option value="published">Published</option><option value="draft">Draft</option></select></div>
        <div style="grid-column: 1 / -1;"><label>Short Description (2-3 lines) <span style="color:var(--danger);">*</span></label><textarea id="eventShortDescription" class="form-control" rows="2" required></textarea></div>
        <div style="grid-column: 1 / -1;">
          <label>Full Description (Rich Text Editor)</label>
          <div class="editor-toolbar">
            <button type="button" class="btn btn-sm editor-toolbar-btn" onclick="runEventEditorCommand('bold')"><i class="fas fa-bold"></i></button>
            <button type="button" class="btn btn-sm editor-toolbar-btn" onclick="runEventEditorCommand('italic')"><i class="fas fa-italic"></i></button>
            <button type="button" class="btn btn-sm editor-toolbar-btn" onclick="runEventEditorCommand('insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
            <button type="button" class="btn btn-sm editor-toolbar-btn" onclick="runEventEditorCommand('insertOrderedList')"><i class="fas fa-list-ol"></i></button>
          </div>
          <div id="eventFullDescriptionEditor" contenteditable="true" class="form-control"></div>
          <textarea id="eventFullDescription" style="display:none;"></textarea>
        </div>
        <div><label>Featured Image (Thumbnail)</label><input type="file" id="eventImage" class="form-control" accept="image/*" onchange="previewEventImage(this)"></div>
        <div><label>Upload Multiple Images</label><input type="file" id="eventImages" class="form-control" accept="image/*" multiple onchange="previewEventGallery(this)"></div>
        <div><label>Download Brochure (Optional PDF)</label><input type="file" id="eventBrochure" class="form-control" accept="application/pdf"></div>
        <div style="grid-column: 1 / -1;"><img id="eventImagePreview" alt="Preview" style="display:none; max-height:180px; border:1px solid var(--border); border-radius:0.625rem; object-fit:cover;"></div>
        <div id="eventGalleryPreview" style="grid-column: 1 / -1; display:flex; gap:0.5rem; flex-wrap:wrap;"></div>
        <div id="publishBothToggleWrap" style="grid-column: 1 / -1; display:flex; gap:1rem; flex-wrap:wrap;">
          <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="publishBoth" class="form-check-input" style="margin:0;"><span id="publishBothLabel">Publish in both sections</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="eventFeatured" class="form-check-input" style="margin:0;"><span>Featured</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="eventHighlighted" class="form-check-input" style="margin:0;"><span>Highlight</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" id="eventActive" class="form-check-input" checked style="margin:0;"> Active</label>
        </div>
        <div style="grid-column: 1 / -1; display:flex; gap:0.75rem;" id="eventActionsWrap">
          <button id="eventSubmitBtn" class="btn btn-primary" onclick="saveEventItem('${defaultCategory}')"><i class="fas fa-save"></i> Add</button>
          <button type="button" class="btn btn-secondary" onclick="resetEventForm('${defaultCategory}')"><i class="fas fa-redo"></i> Reset</button>
        </div>
      </form>
    </div>
    
    <div class="card p-3">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
        <i class="fas fa-th-list" style="font-size:1.25rem; color:var(--primary);"></i>
        <h5 style="margin:0;">Existing Items <span style="color:var(--text-tertiary); font-size:0.875rem; font-weight:400;">(${filteredEventItems.length})</span></h5>
      </div>
      <div style="overflow-x:auto;">
        <table class="table table-sm">
          <thead>
            <tr>
              <th><i class="fas fa-heading" style="margin-right:0.25rem;"></i> Title</th>
              <th><i class="fas fa-tag" style="margin-right:0.25rem;"></i> Category</th>
              <th><i class="fas fa-folder-open" style="margin-right:0.25rem;"></i> Event Category</th>
              <th><i class="fas fa-calendar" style="margin-right:0.25rem;"></i> Date</th>
              <th><i class="fas fa-check-circle" style="margin-right:0.25rem;"></i> Status</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEventItems.length ? filteredEventItems.map(item => `
              <tr>
                <td><strong>${item.title || ''}</strong></td>
                <td><span style="display:inline-block; padding:0.25rem 0.75rem; background:var(--primary-light); color:var(--primary); border-radius:0.375rem; font-size:0.8125rem; font-weight:600;">${item.category || 'event'}</span></td>
                <td>${item.event_category || '-'}</td>
                <td>${item.event_date ? new Date(item.event_date).toLocaleDateString() : '-'}</td>
                <td><span style="display:inline-block; padding:0.25rem 0.75rem; background:${item.status === 'published' ? 'var(--success-light)' : 'var(--warning-light)'}; color:${item.status === 'published' ? 'var(--success)' : 'var(--warning)'}; border-radius:0.375rem; font-size:0.8125rem; font-weight:600;">${item.status || (item.active ? 'published' : 'draft')}</span></td>
                <td style="text-align:center;"><button class='btn btn-sm btn-primary' onclick='editEventItem("${item.id}")'><i class="fas fa-edit"></i></button> <button class='btn btn-sm btn-danger' onclick='deleteEventItem("${item.id}", "${defaultCategory}")'><i class="fas fa-trash"></i></button></td>
              </tr>
            `).join('') : `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-tertiary);">No events found. Create your first one above!</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('eventCategory').value = defaultCategory;
  document.getElementById('eventContentType').value = defaultCategory;
  initializeEventEditor();
  syncEventDescriptionToInput();
  updatePublishBothVisibility();
}

async function saveEventItem(defaultCategory) {
  const editId = document.getElementById('eventEditId').value;
  const title = document.getElementById('eventTitle').value;
  const shortDescription = document.getElementById('eventShortDescription').value;
  syncEventDescriptionToInput();
  const fullDescription = document.getElementById('eventFullDescription').value;
  const category = document.getElementById('eventCategory').value || defaultCategory;
  const eventCategory = document.getElementById('eventSubCategory').value || 'General';
  const location = document.getElementById('eventLocation').value;
  const status = document.getElementById('eventStatus').value || 'published';
  const isFeatured = document.getElementById('eventFeatured').checked;
  const isHighlighted = document.getElementById('eventHighlighted').checked;
  const eventDate = document.getElementById('eventDate').value;
  const active = document.getElementById('eventActive').checked;
  const publishBoth = document.getElementById('publishBoth')?.checked;
  const image = document.getElementById('eventImage').files[0];
  const images = Array.from(document.getElementById('eventImages').files || []);
  const brochure = document.getElementById('eventBrochure').files[0];
  const shouldSyncBoth = publishBoth && (category === 'home_slider');

  function buildEventFormData(targetCategory, syncBothOnEdit) {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('short_description', shortDescription);
    fd.append('full_description', fullDescription);
    fd.append('category', targetCategory);
    fd.append('event_category', eventCategory);
    fd.append('location', location);
    fd.append('status', status);
    fd.append('is_featured', isFeatured);
    fd.append('is_highlighted', isHighlighted);
    if (syncBothOnEdit) {
      fd.append('categories', 'event,home_slider');
    }
    fd.append('event_date', eventDate);
    fd.append('active', active);
    if (image) fd.append('image', image);
    images.forEach((item) => fd.append('images', item));
    if (brochure) fd.append('brochure', brochure);
    return fd;
  }

  // Reliable create behavior: explicitly create both records in one click.
  if (!editId && shouldSyncBoth) {
    const secondCategory = 'event';
    const firstResponse = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      body: buildEventFormData(category, false),
      headers: {'Authorization':'Bearer '+token}
    });

    if (!firstResponse.ok) {
      const text = await firstResponse.text();
      showAlert(`Save failed: ${text}`, 'danger');
      return;
    }

    const secondResponse = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      body: buildEventFormData(secondCategory, false),
      headers: {'Authorization':'Bearer '+token}
    });

    if (!secondResponse.ok) {
      const text = await secondResponse.text();
      showAlert(`Second save failed: ${text}`, 'danger');
      return;
    }

    managerCache.delete('events_all');
    showAlert('Created item in Home Slider and Event');
    loadEventManager(defaultCategory);
    return;
  }

  const formData = buildEventFormData(category, !!editId && shouldSyncBoth);

  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `${baseUrl}/events/${editId}` : `${baseUrl}/events`;
  const response = await fetch(url, {method, body: formData, headers:{'Authorization':'Bearer '+token}});

  if (!response.ok) {
    const text = await response.text();
    showAlert(`Save failed: ${text}`, 'danger');
    return;
  }

  if (editId && shouldSyncBoth) {
    showAlert('Updated item in both Event and Home Slider');
  } else {
    showAlert(editId ? 'Updated event item' : 'Created event item');
  }
  managerCache.delete('events_all');
  loadEventManager(defaultCategory);
}

function editEventItem(id) {
  const item = cachedEventItems.find((entry) => entry.id === id);
  if (!item) {
    showAlert('Item not found', 'danger');
    return;
  }
  fillEventForm(item);
}

async function deleteEventItem(id, defaultCategory) {
  if (!confirm('Delete this item?')) return;
  const response = await fetch(`${baseUrl}/events/${id}`, {method:'DELETE', headers:{'Authorization':'Bearer '+token}});
  if (!response.ok) {
    showAlert('Delete failed', 'danger');
    return;
  }
  managerCache.delete('events_all');
  showAlert('Deleted');
  loadEventManager(defaultCategory);
}

function getMonthOptions(selected = '') {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return months.map(month => `<option value="${month}" ${month === selected ? 'selected' : ''}>${month}</option>`).join('');
}

async function loadCalendarManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navCalendar').classList.add('active');
  panelTitle.textContent = 'Manage Calendar';
  hideAllManagers();
  calendarManager.classList.remove('d-none');

  cachedCalendarItems = await fetchJsonCached('calendar_all', `${baseUrl}/calendar/all`, []);
  if (!Array.isArray(cachedCalendarItems)) {
    showAlert('Unable to load calendar', 'danger');
    cachedCalendarItems = [];
  }

  calendarManager.innerHTML = `
    <div class="card p-3 mb-3">
      <h5 id="calendarFormTitle">Add Calendar Row</h5>
      <form onsubmit="return false;">
        <input type="hidden" id="calEditId">
        <div class="mb-2"><label>Month</label><select id="calMonth" class="form-control">${getMonthOptions()}</select></div>
        <div class="mb-2"><label>Activity</label><input id="calActivity" class="form-control" required></div>
        <div class="mb-2"><label>Details</label><textarea id="calDetails" class="form-control" rows="3" required></textarea></div>
        <div class="mb-2 form-check"><input type="checkbox" id="calActive" class="form-check-input" checked><label class="form-check-label" for="calActive">Active</label></div>
        <button class="btn btn-primary" onclick="saveCalendarItem()" id="calSubmitBtn">Add</button>
        <button class="btn btn-secondary" type="button" onclick="resetCalendarForm()">Reset</button>
      </form>
    </div>
    <div class="card p-3">
      <h5>Calendar Rows</h5>
      <table class="table table-sm">
        <thead><tr><th>Month</th><th>Activity</th><th>Details</th><th>Actions</th></tr></thead>
        <tbody>
          ${cachedCalendarItems.length ? cachedCalendarItems.map(item => `
            <tr>
              <td>${item.month || ''}</td>
              <td>${item.activity || ''}</td>
              <td>${item.details || ''}</td>
              <td>
                <button class='btn btn-sm btn-primary' onclick='editCalendarItem("${item.id}")'>Edit</button>
                <button class='btn btn-sm btn-secondary' onclick='moveCalendarItem("${item.id}","up")'>&uarr;</button>
                <button class='btn btn-sm btn-secondary' onclick='moveCalendarItem("${item.id}","down")'>&darr;</button>
                <button class='btn btn-sm btn-danger' onclick='deleteCalendarItem("${item.id}")'>Delete</button>
              </td>
            </tr>
          `).join('') : `<tr><td colspan="4">No calendar rows found.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function resetCalendarForm() {
  document.getElementById('calEditId').value = '';
  document.getElementById('calMonth').value = 'January';
  document.getElementById('calActivity').value = '';
  document.getElementById('calDetails').value = '';
  document.getElementById('calActive').checked = true;
  document.getElementById('calendarFormTitle').textContent = 'Add Calendar Row';
  document.getElementById('calSubmitBtn').textContent = 'Add';
}

function editCalendarItem(id) {
  const item = cachedCalendarItems.find(entry => entry.id === id);
  if (!item) {
    showAlert('Calendar row not found', 'danger');
    return;
  }
  document.getElementById('calEditId').value = item.id;
  document.getElementById('calMonth').value = item.month || 'January';
  document.getElementById('calActivity').value = item.activity || '';
  document.getElementById('calDetails').value = item.details || '';
  document.getElementById('calActive').checked = !!item.active;
  document.getElementById('calendarFormTitle').textContent = 'Edit Calendar Row';
  document.getElementById('calSubmitBtn').textContent = 'Update';
}

async function saveCalendarItem() {
  const editId = document.getElementById('calEditId').value;
  const formData = new FormData();
  formData.append('month', document.getElementById('calMonth').value);
  formData.append('activity', document.getElementById('calActivity').value);
  formData.append('details', document.getElementById('calDetails').value);
  formData.append('active', document.getElementById('calActive').checked ? '1' : '0');

  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `${baseUrl}/calendar/${editId}` : `${baseUrl}/calendar`;
  const res = await fetch(url, {method, body: formData, headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Save calendar row failed', 'danger');
    return;
  }
  managerCache.delete('calendar_all');
  showAlert(editId ? 'Calendar row updated' : 'Calendar row added');
  await loadCalendarManager();
  resetCalendarForm();
}

async function deleteCalendarItem(id) {
  if (!confirm('Delete this calendar row?')) return;
  const res = await fetch(`${baseUrl}/calendar/${id}`, {method:'DELETE', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Delete failed', 'danger');
    return;
  }
  managerCache.delete('calendar_all');
  showAlert('Deleted');
  loadCalendarManager();
}

async function moveCalendarItem(id, direction) {
  const res = await fetch(`${baseUrl}/calendar/${id}/move?direction=${direction}`, {method:'PATCH', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Reorder failed', 'danger');
    return;
  }
  managerCache.delete('calendar_all');
  loadCalendarManager();
}

async function loadStaffManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navStaff').classList.add('active');
  panelTitle.textContent = 'Manage Staff';
  hideAllManagers();
  staffManager.classList.remove('d-none');

  cachedStaffItems = await fetchJsonCached('staff_all', `${baseUrl}/staff/all`, []);
  if (!Array.isArray(cachedStaffItems)) {
    showAlert('Unable to load staff', 'danger');
    cachedStaffItems = [];
  }

  staffManager.innerHTML = `
    <div class="card p-3 mb-3">
      <h5 id="staffFormTitle">Add Staff</h5>
      <form onsubmit="return false;">
        <input type="hidden" id="staffEditId">
        <div class="mb-2"><label>Photo</label><input type="file" id="staffPhoto" class="form-control" accept="image/*" onchange="previewStaffPhoto(this)"></div>
        <div class="mb-2"><img id="staffPhotoPreview" alt="Preview" style="display:none; width:120px; height:120px; object-fit:cover; border-radius:10px; border:1px solid #d8dee9;"></div>
        <div class="mb-2"><label>Name</label><input id="staffName" class="form-control" required></div>
        <div class="mb-2"><label>Designation</label><input id="staffDesignation" class="form-control" required></div>
        <div class="mb-2"><label>Department</label><input id="staffDepartment" class="form-control" required></div>
        <div class="mb-2"><label>Contact / Email</label><input id="staffContact" class="form-control"></div>
        <div class="mb-2 form-check"><input type="checkbox" id="staffActive" class="form-check-input" checked><label class="form-check-label" for="staffActive">Active</label></div>
        <button class="btn btn-primary" id="staffSubmitBtn" onclick="saveStaffItem()">Add</button>
        <button type="button" class="btn btn-secondary" onclick="resetStaffForm()">Reset</button>
      </form>
    </div>
    <div class="card p-3">
      <h5>Staff Directory Items</h5>
      <table class="table table-sm">
        <thead><tr><th>Name</th><th>Designation</th><th>Department</th><th>Contact</th><th>Actions</th></tr></thead>
        <tbody>
          ${cachedStaffItems.length ? cachedStaffItems.map(item => `
            <tr>
              <td>${item.name || ''}</td>
              <td>${item.designation || ''}</td>
              <td>${item.department || ''}</td>
              <td>${item.contact || ''}</td>
              <td>
                <button class='btn btn-sm btn-primary' onclick='editStaffItem("${item.id}")'>Edit</button>
                <button class='btn btn-sm btn-secondary' onclick='moveStaffItem("${item.id}","up")'>&uarr;</button>
                <button class='btn btn-sm btn-secondary' onclick='moveStaffItem("${item.id}","down")'>&darr;</button>
                <button class='btn btn-sm btn-danger' onclick='deleteStaffItem("${item.id}")'>Delete</button>
              </td>
            </tr>
          `).join('') : `<tr><td colspan="5">No staff entries found.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function previewStaffPhoto(input) {
  const preview = document.getElementById('staffPhotoPreview');
  const file = input.files && input.files[0];
  if (!preview) return;
  if (!file) {
    preview.style.display = 'none';
    preview.src = '';
    return;
  }
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
}

function resetStaffForm() {
  document.getElementById('staffEditId').value = '';
  document.getElementById('staffName').value = '';
  document.getElementById('staffDesignation').value = '';
  document.getElementById('staffDepartment').value = '';
  document.getElementById('staffContact').value = '';
  document.getElementById('staffPhoto').value = '';
  document.getElementById('staffActive').checked = true;
  document.getElementById('staffFormTitle').textContent = 'Add Staff';
  document.getElementById('staffSubmitBtn').textContent = 'Add';
  const preview = document.getElementById('staffPhotoPreview');
  preview.style.display = 'none';
  preview.src = '';
}

function editStaffItem(id) {
  const item = cachedStaffItems.find(entry => entry.id === id);
  if (!item) {
    showAlert('Staff item not found', 'danger');
    return;
  }
  document.getElementById('staffEditId').value = item.id;
  document.getElementById('staffName').value = item.name || '';
  document.getElementById('staffDesignation').value = item.designation || '';
  document.getElementById('staffDepartment').value = item.department || '';
  document.getElementById('staffContact').value = item.contact || item.email || item.phone || '';
  document.getElementById('staffActive').checked = !!item.active;
  document.getElementById('staffFormTitle').textContent = 'Edit Staff';
  document.getElementById('staffSubmitBtn').textContent = 'Update';

  const preview = document.getElementById('staffPhotoPreview');
  if (item.photo_url) {
    preview.src = normalizeMediaUrl(item.photo_url);
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
    preview.src = '';
  }
}

async function saveStaffItem() {
  const editId = document.getElementById('staffEditId').value;
  const formData = new FormData();
  formData.append('name', document.getElementById('staffName').value);
  formData.append('designation', document.getElementById('staffDesignation').value);
  formData.append('department', document.getElementById('staffDepartment').value);
  formData.append('contact', document.getElementById('staffContact').value);
  formData.append('active', document.getElementById('staffActive').checked ? '1' : '0');

  const photo = document.getElementById('staffPhoto').files[0];
  if (photo) formData.append('photo', photo);

  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `${baseUrl}/staff/${editId}` : `${baseUrl}/staff`;
  const res = await fetch(url, {method, body: formData, headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Save staff failed', 'danger');
    return;
  }
  managerCache.delete('staff_all');
  showAlert(editId ? 'Staff updated' : 'Staff added');
  await loadStaffManager();
  resetStaffForm();
}

async function deleteStaffItem(id) {
  if (!confirm('Delete this staff item?')) return;
  const res = await fetch(`${baseUrl}/staff/${id}`, {method:'DELETE', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Delete staff failed', 'danger');
    return;
  }
  managerCache.delete('staff_all');
  showAlert('Deleted');
  loadStaffManager();
}

async function moveStaffItem(id, direction) {
  const res = await fetch(`${baseUrl}/staff/${id}/move?direction=${direction}`, {method:'PATCH', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Reorder staff failed', 'danger');
    return;
  }
  managerCache.delete('staff_all');
  loadStaffManager();
}

function parseLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function linesToText(lines) {
  return Array.isArray(lines) ? lines.join('\n') : '';
}

async function loadContactPageManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navContactPage').classList.add('active');
  panelTitle.textContent = 'Manage Contact Us';
  hideAllManagers();
  contactPageManager.classList.remove('d-none');

  let data;
  try {
    const res = await fetch(`${baseUrl}/contact-page`);
    if (!res.ok) {
      showAlert('Unable to load contact page content', 'danger');
      return;
    }
    data = await res.json();
  } catch (error) {
    showAlert('Unable to load contact page content', 'danger');
    return;
  }

  const cards = Array.isArray(data.cards) ? data.cards : [];
  const card = (idx) => cards[idx] || { title: '', lines: [] };

  contactPageManager.innerHTML = `
    <div class="card p-3 mb-3">
      <h5>Edit Contact Us Top Section</h5>
      <p class="text-muted mb-3">Structure is fixed (header + 4 cards). Edit only text content below.</p>
      <form onsubmit="return false;">
        <div class="mb-2"><label>Header Title</label><input id="contactHeaderTitle" class="form-control" value="${escapeHtml(data.header_title || '')}" required></div>
        <div class="mb-3"><label>Header Subtitle</label><input id="contactHeaderSubtitle" class="form-control" value="${escapeHtml(data.header_subtitle || '')}" required></div>

        <hr>
        <h6>Card 1</h6>
        <div class="mb-2"><label>Card Title</label><input id="contactCard1Title" class="form-control" value="${escapeHtml(card(0).title)}" required></div>
        <div class="mb-3"><label>Lines (one per line)</label><textarea id="contactCard1Lines" class="form-control" rows="4" required>${escapeHtml(linesToText(card(0).lines))}</textarea></div>

        <h6>Card 2</h6>
        <div class="mb-2"><label>Card Title</label><input id="contactCard2Title" class="form-control" value="${escapeHtml(card(1).title)}" required></div>
        <div class="mb-3"><label>Lines (one per line, use Label: Value format if needed)</label><textarea id="contactCard2Lines" class="form-control" rows="4" required>${escapeHtml(linesToText(card(1).lines))}</textarea></div>

        <h6>Card 3</h6>
        <div class="mb-2"><label>Card Title</label><input id="contactCard3Title" class="form-control" value="${escapeHtml(card(2).title)}" required></div>
        <div class="mb-3"><label>Lines (one per line, use Label: Value format if needed)</label><textarea id="contactCard3Lines" class="form-control" rows="4" required>${escapeHtml(linesToText(card(2).lines))}</textarea></div>

        <h6>Card 4</h6>
        <div class="mb-2"><label>Card Title</label><input id="contactCard4Title" class="form-control" value="${escapeHtml(card(3).title)}" required></div>
        <div class="mb-3"><label>Lines (one per line)</label><textarea id="contactCard4Lines" class="form-control" rows="4" required>${escapeHtml(linesToText(card(3).lines))}</textarea></div>

        <button class="btn btn-primary" onclick="saveContactPageContent()">Save Contact Us Content</button>
      </form>
    </div>
  `;
}

async function saveContactPageContent() {
  const payload = {
    header_title: document.getElementById('contactHeaderTitle').value,
    header_subtitle: document.getElementById('contactHeaderSubtitle').value,
    cards: [
      {
        title: document.getElementById('contactCard1Title').value,
        lines: parseLines(document.getElementById('contactCard1Lines').value),
      },
      {
        title: document.getElementById('contactCard2Title').value,
        lines: parseLines(document.getElementById('contactCard2Lines').value),
      },
      {
        title: document.getElementById('contactCard3Title').value,
        lines: parseLines(document.getElementById('contactCard3Lines').value),
      },
      {
        title: document.getElementById('contactCard4Title').value,
        lines: parseLines(document.getElementById('contactCard4Lines').value),
      },
    ],
  };

  const res = await fetch(`${baseUrl}/contact-page`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    showAlert('Save contact page failed', 'danger');
    return;
  }

  showAlert('Contact Us content updated successfully');
}

let currentResultsClass = 'VI';
let currentResultsStudentId = null;
let currentResultNoticeId = null;
let currentResultTopperId = null;

function switchResultsTab(tabId) {
  document.querySelectorAll('.results-tab-pane').forEach(p => p.classList.add('d-none'));
  document.querySelectorAll('.results-tab-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById('res-pane-' + tabId).classList.remove('d-none');
  document.getElementById('tab-btn-' + tabId).classList.add('active');
}

async function changeAdminClass(classCode) {
  currentResultsClass = classCode;
  document.getElementById('selectedClassLabel').innerText = classCode;
  await fetchClassResults();
}

async function fetchClassResults() {
  try {
    const res = await fetch(`${baseUrl}/results/class/${currentResultsClass}`, {
      headers: {'Authorization': 'Bearer ' + token}
    });
    if (!res.ok) throw new Error('Failed to load class results');
    const students = await res.json();
    renderStudentsTable(students);
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '';
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No student records found in this class.</td></tr>';
    return;
  }
  
  students.forEach(s => {
    const statusColor = s.status === 'Pass' ? 'text-success fw-bold' : 'text-danger fw-bold';
    const tr = `
      <tr>
        <td>${s.roll_no}</td>
        <td>${escapeHtml(s.student_name)}</td>
        <td>${s.total}</td>
        <td>${s.percentage}%</td>
        <td class="${statusColor}">${s.status}</td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-primary py-0 px-1" onclick="editStudentResult('${s.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger py-0 px-1" onclick="deleteStudentResult('${s.id}')"><i class="fas fa-trash"></i></button>
            <a href="${baseUrl}/results/student/${s.admission_no}/pdf" class="btn btn-sm btn-secondary py-0 px-1" target="_blank"><i class="fas fa-file-pdf"></i></a>
          </div>
        </td>
      </tr>
    `;
    tbody.innerHTML += tr;
  });
}

async function saveHeroConfig(e) {
  e.preventDefault();
  const title = document.getElementById('resHeroTitle').value;
  const subtitle = document.getElementById('resHeroSubtitle').value;
  const bannerFile = document.getElementById('resHeroBannerFile').files[0];
  
  const fd = new FormData();
  fd.append('title', title);
  fd.append('subtitle', subtitle);
  if (bannerFile) {
    fd.append('banner_file', bannerFile);
  }
  
  try {
    const res = await fetch(`${baseUrl}/results/hero`, {
      method: 'PUT',
      headers: {'Authorization': 'Bearer ' + token},
      body: fd
    });
    if (!res.ok) throw new Error('Failed to save Hero config');
    showAlert('Hero settings updated successfully!');
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function saveGlobalStats(e) {
  e.preventDefault();
  const pass = document.getElementById('resStatPass').value;
  const dist = document.getElementById('resStatDist').value;
  const first = document.getElementById('resStatFirst').value;
  const appeared = document.getElementById('resStatAppeared').value;
  const passed = document.getElementById('resStatPassed').value;
  const topper = document.getElementById('resStatTopper').value;
  
  const fd = new FormData();
  fd.append('pass_percentage', pass);
  fd.append('distinctions', dist);
  fd.append('first_division', first);
  fd.append('students_appeared', appeared);
  fd.append('students_passed', passed);
  fd.append('topper_marks', topper);
  
  try {
    const res = await fetch(`${baseUrl}/results/statistics`, {
      method: 'PUT',
      headers: {'Authorization': 'Bearer ' + token},
      body: fd
    });
    if (!res.ok) throw new Error('Failed to save global statistics');
    showAlert('Global statistics updated successfully!');
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function fetchResultNotices() {
  try {
    const res = await fetch(`${baseUrl}/results/notices`);
    if (!res.ok) throw new Error('Failed to load notices');
    const notices = await res.json();
    renderNoticesTable(notices);
  } catch (err) {
    console.error(err);
  }
}

function renderNoticesTable(notices) {
  const tbody = document.getElementById('noticesTableBody');
  tbody.innerHTML = '';
  if (notices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No result notices found.</td></tr>';
    return;
  }
  
  notices.forEach(n => {
    const docLink = n.pdf_url ? `<a href="${n.pdf_url}" target="_blank" class="text-danger"><i class="fas fa-file-pdf"></i> PDF</a>` : 'None';
    const tr = `
      <tr>
        <td>${n.notice_date}</td>
        <td>${escapeHtml(n.title)} ${n.pinned ? '📌' : ''}</td>
        <td>${n.pinned ? 'Pinned' : 'Regular'}</td>
        <td>${docLink}</td>
        <td>
          <button class="btn btn-sm btn-primary py-0 px-1" onclick="editNoticeRow('${n.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger py-0 px-1" onclick="deleteNoticeRow('${n.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
    tbody.innerHTML += tr;
  });
}

function resetNoticeForm() {
  currentResultNoticeId = null;
  document.getElementById('noticeEditId').value = '';
  document.getElementById('noticeTitle').value = '';
  document.getElementById('noticeDate').value = '';
  document.getElementById('noticeContent').value = '';
  document.getElementById('noticePinned').checked = false;
  document.getElementById('noticePdfFile').value = '';
  document.getElementById('noticePdfLinkContainer').innerHTML = '';
  document.getElementById('noticeFormTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add Result Notice';
  document.getElementById('noticeSubmitBtn').innerHTML = '<i class="fas fa-plus"></i> Add Notice';
}

async function editNoticeRow(id) {
  try {
    const res = await fetch(`${baseUrl}/results/notices`);
    const notices = await res.json();
    const notice = notices.find(n => n.id === id);
    if (!notice) return;
    
    currentResultNoticeId = id;
    document.getElementById('noticeEditId').value = id;
    document.getElementById('noticeTitle').value = notice.title;
    document.getElementById('noticeDate').value = notice.notice_date;
    document.getElementById('noticeContent').value = notice.content;
    document.getElementById('noticePinned').checked = !!notice.pinned;
    
    if (notice.pdf_url) {
      document.getElementById('noticePdfLinkContainer').innerHTML = `
        <span class="text-success"><i class="fas fa-check-circle"></i> Existing PDF: 
        <a href="${notice.pdf_url}" target="_blank">${notice.pdf_name || 'Download'}</a></span>
        <br><label class="mt-1"><input type="checkbox" id="removeNoticePdf"> Remove existing PDF</label>
      `;
    } else {
      document.getElementById('noticePdfLinkContainer').innerHTML = '';
    }
    
    document.getElementById('noticeFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Result Notice';
    document.getElementById('noticeSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Save Changes';
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function saveResultNotice(e) {
  e.preventDefault();
  const title = document.getElementById('noticeTitle').value;
  const date = document.getElementById('noticeDate').value;
  const content = document.getElementById('noticeContent').value;
  const pinned = document.getElementById('noticePinned').checked;
  const pdfFile = document.getElementById('noticePdfFile').files[0];
  const removePdf = document.getElementById('removeNoticePdf') ? document.getElementById('removeNoticePdf').checked : false;
  
  const fd = new FormData();
  fd.append('title', title);
  fd.append('notice_date', date);
  fd.append('content', content);
  fd.append('pinned', String(pinned));
  if (pdfFile) {
    fd.append('pdf_file', pdfFile);
  }
  if (currentResultNoticeId) {
    fd.append('remove_pdf', String(removePdf));
  }
  
  try {
    let url = `${baseUrl}/results/notices`;
    let method = 'POST';
    if (currentResultNoticeId) {
      url += `/${currentResultNoticeId}`;
      method = 'PUT';
    }
    
    const res = await fetch(url, {
      method: method,
      headers: {'Authorization': 'Bearer ' + token},
      body: fd
    });
    
    if (!res.ok) throw new Error('Failed to save notice');
    showAlert(currentResultNoticeId ? 'Notice updated successfully!' : 'Notice created successfully!');
    resetNoticeForm();
    await fetchResultNotices();
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function deleteNoticeRow(id) {
  if (!confirm('Are you sure you want to delete this notice?')) return;
  try {
    const res = await fetch(`${baseUrl}/results/notices/${id}`, {
      method: 'DELETE',
      headers: {'Authorization': 'Bearer ' + token}
    });
    if (!res.ok) throw new Error('Failed to delete notice');
    showAlert('Notice deleted successfully!');
    await fetchResultNotices();
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function fetchResultToppers() {
  try {
    const res = await fetch(`${baseUrl}/results/toppers`);
    if (!res.ok) throw new Error('Failed to load toppers');
    const toppers = await res.json();
    renderToppersTable(toppers);
  } catch (err) {
    console.error(err);
  }
}

function renderToppersTable(toppers) {
  const tbody = document.getElementById('toppersTableBody');
  tbody.innerHTML = '';
  if (toppers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No toppers recorded yet.</td></tr>';
    return;
  }
  
  toppers.forEach(t => {
    const photo = t.photo_url ? `<img src="${t.photo_url}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">` : '<span class="text-muted">None</span>';
    const tr = `
      <tr>
        <td>${photo}</td>
        <td>${escapeHtml(t.student_name)}</td>
        <td>Class ${t.class}</td>
        <td>${t.percentage}% (${t.marks})</td>
        <td>${t.rank}</td>
        <td>
          <button class="btn btn-sm btn-primary py-0 px-1" onclick="editTopperRow('${t.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger py-0 px-1" onclick="deleteTopperRow('${t.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
    tbody.innerHTML += tr;
  });
}

function resetTopperForm() {
  currentResultTopperId = null;
  document.getElementById('topperEditId').value = '';
  document.getElementById('topperStudentName').value = '';
  document.getElementById('topperClass').value = 'VI';
  document.getElementById('topperMarksObtained').value = '';
  document.getElementById('topperPercentage').value = '';
  document.getElementById('topperRank').value = '';
  document.getElementById('topperMedal').value = '';
  document.getElementById('topperPhotoFile').value = '';
  document.getElementById('topperPhotoPreviewContainer').innerHTML = '';
  document.getElementById('topperFormTitle').innerHTML = '<i class="fas fa-user-plus"></i> Add Top Performer';
  document.getElementById('topperSubmitBtn').innerHTML = '<i class="fas fa-plus"></i> Add Topper';
}

async function editTopperRow(id) {
  try {
    const res = await fetch(`${baseUrl}/results/toppers`);
    const toppers = await res.json();
    const topper = toppers.find(t => t.id === id);
    if (!topper) return;
    
    currentResultTopperId = id;
    document.getElementById('topperEditId').value = id;
    document.getElementById('topperStudentName').value = topper.student_name;
    document.getElementById('topperClass').value = topper.class;
    document.getElementById('topperMarksObtained').value = topper.marks;
    document.getElementById('topperPercentage').value = topper.percentage;
    document.getElementById('topperRank').value = topper.rank;
    document.getElementById('topperMedal').value = topper.medal || '';
    
    if (topper.photo_url) {
      document.getElementById('topperPhotoPreviewContainer').innerHTML = `
        <img src="${topper.photo_url}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid #ddd;">
        <br><label class="mt-1"><input type="checkbox" id="removeTopperPhoto"> Remove photo</label>
      `;
    } else {
      document.getElementById('topperPhotoPreviewContainer').innerHTML = '';
    }
    
    document.getElementById('topperFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Top Performer';
    document.getElementById('topperSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Save Changes';
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function saveResultTopper(e) {
  e.preventDefault();
  const studentName = document.getElementById('topperStudentName').value;
  const topperClass = document.getElementById('topperClass').value;
  const marks = document.getElementById('topperMarksObtained').value;
  const percentage = document.getElementById('topperPercentage').value;
  const rank = document.getElementById('topperRank').value;
  const medal = document.getElementById('topperMedal').value;
  const photoFile = document.getElementById('topperPhotoFile').files[0];
  const removePhoto = document.getElementById('removeTopperPhoto') ? document.getElementById('removeTopperPhoto').checked : false;
  
  const fd = new FormData();
  fd.append('student_name', studentName);
  fd.append('class', topperClass);
  fd.append('marks', marks);
  fd.append('percentage', percentage);
  fd.append('rank', rank);
  fd.append('medal', medal);
  if (photoFile) {
    fd.append('student_photo', photoFile);
  }
  if (currentResultTopperId) {
    fd.append('remove_photo', String(removePhoto));
  }
  
  try {
    let url = `${baseUrl}/results/toppers`;
    let method = 'POST';
    if (currentResultTopperId) {
      url += `/${currentResultTopperId}`;
      method = 'PUT';
    }
    
    const res = await fetch(url, {
      method: method,
      headers: {'Authorization': 'Bearer ' + token},
      body: fd
    });
    
    if (!res.ok) throw new Error('Failed to save topper profile');
    showAlert(currentResultTopperId ? 'Topper profile updated successfully!' : 'Topper profile added successfully!');
    resetTopperForm();
    await fetchResultToppers();
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function deleteTopperRow(id) {
  if (!confirm('Are you sure you want to delete this topper?')) return;
  try {
    const res = await fetch(`${baseUrl}/results/toppers/${id}`, {
      method: 'DELETE',
      headers: {'Authorization': 'Bearer ' + token}
    });
    if (!res.ok) throw new Error('Failed to delete topper');
    showAlert('Topper profile deleted successfully!');
    await fetchResultToppers();
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

function resetStudentForm() {
  currentResultsStudentId = null;
  document.getElementById('studentEditId').value = '';
  document.getElementById('resStudentName').value = '';
  document.getElementById('resAdmissionNo').value = '';
  document.getElementById('resRollNo').value = '';
  document.getElementById('resFatherName').value = '';
  document.getElementById('resSection').value = 'A';
  document.getElementById('resAcademicYear').value = '2025-2026';
  
  document.getElementById('score_english').value = '';
  document.getElementById('score_hindi').value = '';
  document.getElementById('score_maths').value = '';
  document.getElementById('score_science').value = '';
  document.getElementById('score_social').value = '';
  document.getElementById('score_computer').value = '';
  
  document.getElementById('score_add_name').value = '';
  document.getElementById('score_add_val').value = '';
  
  document.getElementById('studentFormTitle').innerHTML = '<i class="fas fa-user-edit"></i> Add Student Result';
}

async function editStudentResult(id) {
  try {
    const res = await fetch(`${baseUrl}/results/class/${currentResultsClass}`, {
      headers: {'Authorization': 'Bearer ' + token}
    });
    const students = await res.json();
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    currentResultsStudentId = id;
    document.getElementById('studentEditId').value = id;
    document.getElementById('resStudentName').value = student.student_name;
    document.getElementById('resAdmissionNo').value = student.admission_no;
    document.getElementById('resRollNo').value = student.roll_no;
    document.getElementById('resFatherName').value = student.father_name;
    document.getElementById('resSection').value = student.section || 'A';
    document.getElementById('resAcademicYear').value = student.academic_year || '2025-2026';
    
    // Reset all score inputs first
    document.getElementById('score_english').value = '';
    document.getElementById('score_hindi').value = '';
    document.getElementById('score_maths').value = '';
    document.getElementById('score_science').value = '';
    document.getElementById('score_social').value = '';
    document.getElementById('score_computer').value = '';
    document.getElementById('score_add_name').value = '';
    document.getElementById('score_add_val').value = '';
    
    // Load subjects
    student.subjects.forEach(sub => {
      const subNameLower = sub.subject.toLowerCase();
      if (subNameLower.includes('english')) {
        document.getElementById('score_english').value = sub.obtained_marks;
      } else if (subNameLower.includes('hindi')) {
        document.getElementById('score_hindi').value = sub.obtained_marks;
      } else if (subNameLower.includes('math') || subNameLower.includes('algebra')) {
        document.getElementById('score_maths').value = sub.obtained_marks;
      } else if (subNameLower.includes('science') && !subNameLower.includes('social')) {
        document.getElementById('score_science').value = sub.obtained_marks;
      } else if (subNameLower.includes('social')) {
        document.getElementById('score_social').value = sub.obtained_marks;
      } else if (subNameLower.includes('computer')) {
        document.getElementById('score_computer').value = sub.obtained_marks;
      } else {
        // Additional subject
        document.getElementById('score_add_name').value = sub.subject;
        document.getElementById('score_add_val').value = sub.obtained_marks;
      }
    });
    
    document.getElementById('studentFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Student Result';
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function saveStudentResult(e) {
  e.preventDefault();
  
  const subjects = [
    { subject: "English", obtained_marks: parseFloat(document.getElementById('score_english').value) },
    { subject: "Hindi", obtained_marks: parseFloat(document.getElementById('score_hindi').value) },
    { subject: "Mathematics", obtained_marks: parseFloat(document.getElementById('score_maths').value) },
    { subject: "Science", obtained_marks: parseFloat(document.getElementById('score_science').value) },
    { subject: "Social Science", obtained_marks: parseFloat(document.getElementById('score_social').value) },
    { subject: "Computer", obtained_marks: parseFloat(document.getElementById('score_computer').value) }
  ];
  
  const addName = document.getElementById('score_add_name').value.trim();
  const addVal = document.getElementById('score_add_val').value;
  if (addName && addVal !== '') {
    subjects.push({ subject: addName, obtained_marks: parseFloat(addVal) });
  }
  
  const payload = {
    student_name: document.getElementById('resStudentName').value.trim(),
    admission_no: document.getElementById('resAdmissionNo').value.trim(),
    roll_no: document.getElementById('resRollNo').value.trim(),
    father_name: document.getElementById('resFatherName').value.trim(),
    class: currentResultsClass,
    section: document.getElementById('resSection').value.trim(),
    academic_year: document.getElementById('resAcademicYear').value.trim(),
    subjects: subjects
  };
  
  try {
    let url = `${baseUrl}/results`;
    let method = 'POST';
    if (currentResultsStudentId) {
      url += `/${currentResultsStudentId}`;
      method = 'PUT';
    }
    
    const res = await fetch(url, {
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errText = await res.text();
      let errDetails = 'Failed to save student result';
      try {
        const errJson = JSON.parse(errText);
        errDetails = errJson.detail || errDetails;
      } catch(e){}
      throw new Error(errDetails);
    }
    
    showAlert(currentResultsStudentId ? 'Student result updated!' : 'Student result added!');
    resetStudentForm();
    await fetchClassResults();
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function deleteStudentResult(id) {
  if (!confirm('Are you sure you want to delete this student result?')) return;
  try {
    const res = await fetch(`${baseUrl}/results/${id}`, {
      method: 'DELETE',
      headers: {'Authorization': 'Bearer ' + token}
    });
    if (!res.ok) throw new Error('Failed to delete student result');
    showAlert('Student result deleted successfully!');
    await fetchClassResults();
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

async function importClassResults() {
  const fileInput = document.getElementById('bulkExcelFile');
  if (fileInput.files.length === 0) return;
  
  const fd = new FormData();
  fd.append('file', fileInput.files[0]);
  
  try {
    const res = await fetch(`${baseUrl}/results/import/${currentResultsClass}`, {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + token},
      body: fd
    });
    
    if (!res.ok) throw new Error('Bulk import request failed');
    const result = await res.json();
    showAlert(result.message);
    fileInput.value = '';
    await fetchClassResults();
  } catch (err) {
    showAlert(err.message, 'danger');
    fileInput.value = '';
  }
}

async function downloadAuthenticatedFile(url, defaultFilename) {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    if (!res.ok) throw new Error(`Failed to download file (HTTP ${res.status})`);
    
    let filename = defaultFilename;
    const disposition = res.headers.get('content-disposition');
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const parts = disposition.split(';');
      for (let part of parts) {
        part = part.trim();
        if (part.startsWith('filename=')) {
          filename = part.substring(9).replace(/['"]/g, '');
        }
      }
    }
    
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (err) {
    showAlert(err.message, 'danger');
  }
}

function exportClassResultsExcel() {
  downloadAuthenticatedFile(`${baseUrl}/results/export/excel/${currentResultsClass}`, `class_${currentResultsClass}_results.xlsx`);
}

function exportClassResultsPdf() {
  downloadAuthenticatedFile(`${baseUrl}/results/export/pdf/${currentResultsClass}`, `class_${currentResultsClass}_results.pdf`);
}

async function loadResultsSection(tabId) {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  
  const sidebarIds = {
    'hero-stats': 'navResultsHeroStats',
    'notices': 'navResultsNotices',
    'toppers': 'navResultsToppers',
    'class-portals': 'navResultsClassPortals'
  };
  const activeSidebarId = sidebarIds[tabId];
  if (activeSidebarId && document.getElementById(activeSidebarId)) {
    document.getElementById(activeSidebarId).classList.add('active');
  }

  panelTitle.textContent = 'Manage Results';
  hideAllManagers();
  resultsManager.classList.remove('d-none');

  if (!document.getElementById('res-pane-hero-stats')) {
    resultsManager.innerHTML = `
    <div class="card card-accent p-3 mb-3">
      <!-- Tabs Navigation -->
      <div class="d-flex gap-2 mb-4 border-bottom pb-2 flex-wrap">
        <button id="tab-btn-hero-stats" class="btn btn-outline-primary active results-tab-btn" onclick="switchResultsTab('hero-stats')"><i class="fas fa-chart-line"></i> Hero & Statistics</button>
        <button id="tab-btn-notices" class="btn btn-outline-primary results-tab-btn" onclick="switchResultsTab('notices')"><i class="fas fa-bullhorn"></i> Result Notices</button>
        <button id="tab-btn-toppers" class="btn btn-outline-primary results-tab-btn" onclick="switchResultsTab('toppers')"><i class="fas fa-trophy"></i> Top Performers</button>
        <button id="tab-btn-class-portals" class="btn btn-outline-primary results-tab-btn" onclick="switchResultsTab('class-portals')"><i class="fas fa-graduation-cap"></i> Class Results (VI-XII)</button>
      </div>

      <!-- PANE 1: Hero & Statistics -->
      <div id="res-pane-hero-stats" class="results-tab-pane">
        <h5 class="mb-3 text-primary"><i class="fas fa-heading"></i> Portal Hero Configuration</h5>
        <form id="heroConfigForm" onsubmit="saveHeroConfig(event)" class="mb-4">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Portal Title</label>
              <input type="text" id="resHeroTitle" class="form-control" required placeholder="Academic Results">
            </div>
            <div class="col-md-6">
              <label class="form-label">Portal Subtitle</label>
              <input type="text" id="resHeroSubtitle" class="form-control" required placeholder="View Examination Results">
            </div>
            <div class="col-md-6">
              <label class="form-label">Hero Banner Image</label>
              <input type="file" id="resHeroBannerFile" class="form-control" accept="image/*">
              <small class="text-muted">Leave empty to keep existing banner.</small>
            </div>
            <div class="col-md-6 d-flex align-items-end">
              <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Hero Config</button>
            </div>
          </div>
        </form>
        
        <hr>
        
        <h5 class="mt-4 mb-3 text-primary"><i class="fas fa-percentage"></i> Global Statistics Counters</h5>
        <form id="globalStatsForm" onsubmit="saveGlobalStats(event)">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Pass Percentage (%)</label>
              <input type="text" id="resStatPass" class="form-control" required placeholder="98%">
            </div>
            <div class="col-md-4">
              <label class="form-label">Distinctions Count</label>
              <input type="text" id="resStatDist" class="form-control" required placeholder="120">
            </div>
            <div class="col-md-4">
              <label class="form-label">First Division Count</label>
              <input type="text" id="resStatFirst" class="form-control" required placeholder="210">
            </div>
            <div class="col-md-4">
              <label class="form-label">Students Appeared</label>
              <input type="text" id="resStatAppeared" class="form-control" required placeholder="350">
            </div>
            <div class="col-md-4">
              <label class="form-label">Students Passed</label>
              <input type="text" id="resStatPassed" class="form-control" required placeholder="343">
            </div>
            <div class="col-md-4">
              <label class="form-label">Topper Marks (%)</label>
              <input type="text" id="resStatTopper" class="form-control" required placeholder="98.8%">
            </div>
            <div class="col-12 text-end">
              <button type="submit" class="btn btn-success"><i class="fas fa-save"></i> Save Global Stats</button>
            </div>
          </div>
        </form>
      </div>

      <!-- PANE 2: Notices -->
      <div id="res-pane-notices" class="results-tab-pane d-none">
        <div class="row">
          <div class="col-md-5 border-end">
            <h5 id="noticeFormTitle" class="mb-3 text-primary"><i class="fas fa-plus-circle"></i> Add Result Notice</h5>
            <form id="resultNoticeForm" onsubmit="saveResultNotice(event)">
              <input type="hidden" id="noticeEditId">
              <div class="mb-3">
                <label class="form-label">Notice Title</label>
                <input type="text" id="noticeTitle" class="form-control" required placeholder="Class X Result Declared">
              </div>
              <div class="mb-3">
                <label class="form-label">Notice Date</label>
                <input type="date" id="noticeDate" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Notice Content</label>
                <textarea id="noticeContent" class="form-control" rows="4" required placeholder="Details about revaluation, dates, etc."></textarea>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" id="noticePinned" class="form-check-input">
                <label class="form-check-label" for="noticePinned">Pin this notice to top</label>
              </div>
              <div class="mb-3">
                <label class="form-label">Notice Document (PDF)</label>
                <input type="file" id="noticePdfFile" class="form-control" accept="application/pdf">
                <div id="noticePdfLinkContainer" class="mt-1 small"></div>
              </div>
              <div class="d-flex gap-2">
                <button type="submit" id="noticeSubmitBtn" class="btn btn-primary"><i class="fas fa-plus"></i> Add Notice</button>
                <button type="button" class="btn btn-secondary" onclick="resetNoticeForm()"><i class="fas fa-redo"></i> Cancel</button>
              </div>
            </form>
          </div>
          <div class="col-md-7">
            <h5 class="mb-3 text-primary"><i class="fas fa-list"></i> Result Notices Directory</h5>
            <div class="table-responsive">
              <table class="table table-bordered table-striped table-sm">
                <thead class="table-dark">
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Document</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="noticesTableBody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- PANE 3: Toppers -->
      <div id="res-pane-toppers" class="results-tab-pane d-none">
        <div class="row">
          <div class="col-md-5 border-end">
            <h5 id="topperFormTitle" class="mb-3 text-primary"><i class="fas fa-user-plus"></i> Add Top Performer</h5>
            <form id="resultTopperForm" onsubmit="saveResultTopper(event)">
              <input type="hidden" id="topperEditId">
              <div class="mb-3">
                <label class="form-label">Student Name</label>
                <input type="text" id="topperStudentName" class="form-control" required placeholder="John Doe">
              </div>
              <div class="mb-3">
                <label class="form-label">Class</label>
                <select id="topperClass" class="form-control" required>
                  <option value="VI">Class VI</option>
                  <option value="VII">Class VII</option>
                  <option value="VIII">Class VIII</option>
                  <option value="IX">Class IX</option>
                  <option value="X">Class X</option>
                  <option value="XI">Class XI</option>
                  <option value="XII">Class XII</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Marks Obtained</label>
                <input type="text" id="topperMarksObtained" class="form-control" required placeholder="580/600">
              </div>
              <div class="mb-3">
                <label class="form-label">Percentage (%)</label>
                <input type="number" step="0.01" id="topperPercentage" class="form-control" required placeholder="96.67">
              </div>
              <div class="mb-3">
                <label class="form-label">Rank</label>
                <input type="text" id="topperRank" class="form-control" required placeholder="1st">
              </div>
              <div class="mb-3">
                <label class="form-label">Medal / Award</label>
                <input type="text" id="topperMedal" class="form-control" placeholder="Gold Medalist">
              </div>
              <div class="mb-3">
                <label class="form-label">Topper Photo</label>
                <input type="file" id="topperPhotoFile" class="form-control" accept="image/*">
                <div id="topperPhotoPreviewContainer" class="mt-2 text-center"></div>
              </div>
              <div class="d-flex gap-2">
                <button type="submit" id="topperSubmitBtn" class="btn btn-primary"><i class="fas fa-plus"></i> Add Topper</button>
                <button type="button" class="btn btn-secondary" onclick="resetTopperForm()"><i class="fas fa-redo"></i> Cancel</button>
              </div>
            </form>
          </div>
          <div class="col-md-7">
            <h5 class="mb-3 text-primary"><i class="fas fa-trophy"></i> Top Performers Directory</h5>
            <div class="table-responsive">
              <table class="table table-bordered table-striped table-sm">
                <thead class="table-dark">
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Score</th>
                    <th>Rank</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="toppersTableBody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- PANE 4: Class Portals -->
      <div id="res-pane-class-portals" class="results-tab-pane d-none">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 bg-light p-3 rounded border">
          <div class="d-flex align-items-center gap-2">
            <label class="fw-bold mb-0">Select Class:</label>
            <select id="adminClassSelector" class="form-control" style="width:150px;" onchange="changeAdminClass(this.value)">
              <option value="VI">Class VI</option>
              <option value="VII">Class VII</option>
              <option value="VIII">Class VIII</option>
              <option value="IX">Class IX</option>
              <option value="X">Class X</option>
              <option value="XI">Class XI</option>
              <option value="XII">Class XII</option>
            </select>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <input type="file" id="bulkExcelFile" style="display:none;" accept=".csv,.xlsx" onchange="importClassResults()">
            <button class="btn btn-info btn-sm text-white" onclick="document.getElementById('bulkExcelFile').click()"><i class="fas fa-file-excel"></i> Import Excel/CSV</button>
            <button class="btn btn-primary btn-sm" onclick="exportClassResultsExcel()"><i class="fas fa-file-download"></i> Export Excel</button>
            <button class="btn btn-secondary btn-sm" onclick="exportClassResultsPdf()"><i class="fas fa-file-pdf"></i> Export Consolidated PDF</button>
          </div>
        </div>

        <div class="row">
          <div class="col-md-5 border-end">
            <h5 id="studentFormTitle" class="mb-3 text-primary"><i class="fas fa-user-edit"></i> Add Student Result</h5>
            <form id="studentResultForm" onsubmit="saveStudentResult(event)">
              <input type="hidden" id="studentEditId">
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Student Name</label>
                  <input type="text" id="resStudentName" class="form-control" required placeholder="Jane Doe">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Admission Number</label>
                  <input type="text" id="resAdmissionNo" class="form-control" required placeholder="ADM-2025-001">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Roll Number</label>
                  <input type="text" id="resRollNo" class="form-control" required placeholder="10">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Father's Name</label>
                  <input type="text" id="resFatherName" class="form-control" required placeholder="Robert Doe">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Section</label>
                  <input type="text" id="resSection" class="form-control" required placeholder="A" value="A">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Academic Year</label>
                  <input type="text" id="resAcademicYear" class="form-control" required placeholder="2025-2026" value="2025-2026">
                </div>
              </div>
              
              <h6 class="border-bottom pb-1 text-secondary mb-2">Subject Scores</h6>
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label">English</label>
                  <input type="number" step="0.5" id="score_english" class="form-control" required min="0" max="100" placeholder="/100">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Hindi</label>
                  <input type="number" step="0.5" id="score_hindi" class="form-control" required min="0" max="100" placeholder="/100">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Mathematics</label>
                  <input type="number" step="0.5" id="score_maths" class="form-control" required min="0" max="100" placeholder="/100">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Science</label>
                  <input type="number" step="0.5" id="score_science" class="form-control" required min="0" max="100" placeholder="/100">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Social Science</label>
                  <input type="number" step="0.5" id="score_social" class="form-control" required min="0" max="100" placeholder="/100">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Computer</label>
                  <input type="number" step="0.5" id="score_computer" class="form-control" required min="0" max="100" placeholder="/100">
                </div>
              </div>

              <h6 class="border-bottom pb-1 text-secondary mb-2">Additional Subject (Optional)</h6>
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Subject Name</label>
                  <input type="text" id="score_add_name" class="form-control" placeholder="e.g. Sanskrit">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Marks Obtained</label>
                  <input type="number" step="0.5" id="score_add_val" class="form-control" min="0" max="100" placeholder="/100">
                </div>
              </div>

              <div class="d-flex gap-2">
                <button type="submit" id="studentSubmitBtn" class="btn btn-success"><i class="fas fa-save"></i> Save Student Result</button>
                <button type="button" class="btn btn-secondary" onclick="resetStudentForm()"><i class="fas fa-redo"></i> Cancel</button>
              </div>
            </form>
          </div>

          <div class="col-md-7">
            <h5 class="mb-3 text-primary"><i class="fas fa-users"></i> Class Student Directory (<span id="selectedClassLabel">VI</span>)</h5>
            <div class="table-responsive">
              <table class="table table-bordered table-striped table-sm">
                <thead class="table-dark">
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Total</th>
                    <th>Pct %</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="studentsTableBody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Initialize values
    try {
      const heroRes = await fetch(`${baseUrl}/results/hero`, {headers: {'Authorization': 'Bearer ' + token}});
      if (heroRes.ok) {
        const hero = await heroRes.json();
        document.getElementById('resHeroTitle').value = hero.title || 'Academic Results';
        document.getElementById('resHeroSubtitle').value = hero.subtitle || 'View Examination Results';
      }

      const statsRes = await fetch(`${baseUrl}/results/statistics`, {headers: {'Authorization': 'Bearer ' + token}});
      if (statsRes.ok) {
        const stats = await statsRes.json();
        document.getElementById('resStatPass').value = stats.pass_percentage || '98%';
        document.getElementById('resStatDist').value = stats.distinctions || '120';
        document.getElementById('resStatFirst').value = stats.first_division || '210';
        document.getElementById('resStatAppeared').value = stats.students_appeared || '350';
        document.getElementById('resStatPassed').value = stats.students_passed || '343';
        document.getElementById('resStatTopper').value = stats.topper_marks || '98.8%';
      }

      await fetchResultNotices();
      await fetchResultToppers();
    } catch (err) {
      console.error(err);
    }
  }

  switchResultsTab(tabId);

  if (tabId === 'class-portals') {
    document.getElementById('adminClassSelector').value = currentResultsClass;
    document.getElementById('selectedClassLabel').innerText = currentResultsClass;
    await fetchClassResults();
  }
}

async function loadResultsManager() {
  await loadResultsSection('hero-stats');
}

async function loadAlumniNotableManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navAlumniNotable').classList.add('active');
  panelTitle.textContent = 'Manage Notable Alumni';
  hideAllManagers();
  alumniNotableManager.classList.remove('d-none');

  const res = await fetch(`${baseUrl}/alumni/admin/all`, {headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Unable to load alumni items', 'danger');
    return;
  }
  cachedAlumniNotable = await res.json();

  alumniNotableManager.innerHTML = `
    <div class="card card-accent p-3 mb-3">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem;">
        <i class="fas fa-user-tie" style="font-size:1.5rem; color:var(--primary);"></i>
        <div>
          <h5 id="alumniFormTitle" style="margin:0;">Add Notable Alumni</h5>
          <p style="color:var(--text-secondary); font-size:0.875rem; margin:0.25rem 0 0;">Showcase your successful alumni and their achievements</p>
        </div>
      </div>
      <form onsubmit="return false;" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1rem;">
        <input type="hidden" id="alumniEditId">
        <div><label>Name <span style="color:var(--danger);">*</span></label><input id="alumniName" class="form-control" required></div>
        <div><label>Batch Year <span style="color:var(--danger);">*</span></label><input id="alumniBatch" class="form-control" required></div>
        <div><label>Current Role <span style="color:var(--danger);">*</span></label><input id="alumniRole" class="form-control" required></div>
        <div><label>Company <span style="color:var(--danger);">*</span></label><input id="alumniCompany" class="form-control" required></div>
        <div><label>Location</label><input id="alumniLocation" class="form-control"></div>
        <div><label>Email</label><input id="alumniEmail" class="form-control" type="email"></div>
        <div><label>LinkedIn URL</label><input id="alumniLinkedin" class="form-control" placeholder="https://linkedin.com/in/..."></div>
        <div style="grid-column: 1 / -1;"><label>Success Story</label><textarea id="alumniStory" class="form-control" rows="3"></textarea></div>
        <div><label>Profile Photo</label><input id="alumniPhoto" type="file" class="form-control" accept="image/*"></div>
        <div style="grid-column: 1 / -1; display:flex; gap:1rem; flex-wrap:wrap;">
          <label style="display:flex; align-items:center; gap:0.5rem;"><input id="alumniFeatured" type="checkbox" class="form-check-input" style="margin:0;"> <span><strong>Featured</strong> <span style="color:var(--text-tertiary); font-size:0.8125rem;">(Show on homepage)</span></span></label>
          <label style="display:flex; align-items:center; gap:0.5rem;"><input id="alumniActive" type="checkbox" class="form-check-input" checked style="margin:0;"> Active</label>
        </div>
        <div style="grid-column: 1 / -1; display:flex; gap:0.75rem;">
          <button id="alumniSubmitBtn" class="btn btn-primary" onclick="saveAlumniNotable()"><i class="fas fa-save"></i> Add</button>
          <button type="button" class="btn btn-secondary" onclick="resetAlumniNotableForm()"><i class="fas fa-redo"></i> Reset</button>
        </div>
      </form>
    </div>
    
    <div class="card p-3">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
        <i class="fas fa-users" style="font-size:1.25rem; color:var(--primary);"></i>
        <h5 style="margin:0;">Alumni Directory <span style="color:var(--text-tertiary); font-size:0.875rem; font-weight:400;">(${cachedAlumniNotable.length})</span></h5>
      </div>
      ${cachedAlumniNotable.length ? `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1.5rem;">
        ${cachedAlumniNotable.map(item => `
          <div class="card" style="display:flex; flex-direction:column; overflow:hidden;">
            <div style="background:linear-gradient(135deg, var(--primary-light), rgba(99, 102, 241, 0.08)); padding:2rem; text-align:center; border-bottom:1px solid var(--border);">
              <div style="width:64px; height:64px; background:var(--primary); border-radius:50%; margin:0 auto 1rem; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; font-weight:700;">
                ${item.name && item.name[0] ? item.name[0].toUpperCase() : 'A'}
              </div>
            </div>
            <div style="padding:1.25rem; flex:1;">
              <h6 style="margin:0 0 0.5rem;">${item.name || ''}</h6>
              <p style="margin:0 0 1rem; font-size:0.8125rem; color:var(--text-secondary);"><strong>${item.current_role || ''}</strong> @ ${item.company || ''}</p>
              <p style="margin:0 0 0.75rem; font-size:0.8125rem; color:var(--text-tertiary);">
                <i class="fas fa-graduation-cap" style="margin-right:0.25rem;"></i> Batch ${item.batch_year || ''}
              </p>
              ${item.location ? `<p style="margin:0 0 1rem; font-size:0.8125rem; color:var(--text-tertiary);"><i class="fas fa-map-marker-alt" style="margin-right:0.25rem;"></i> ${item.location}</p>` : ''}
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                ${item.is_featured ? `<span style="display:inline-block; padding:0.25rem 0.75rem; background:var(--warning-light); color:#92400e; border-radius:0.375rem; font-size:0.75rem; font-weight:600;"><i class="fas fa-star" style="margin-right:0.25rem;"></i> Featured</span>` : ''}
                <span style="display:inline-block; padding:0.25rem 0.75rem; background:${item.active ? 'var(--success-light)' : 'var(--danger-light)'}; color:${item.active ? 'var(--success)' : 'var(--danger)'}; border-radius:0.375rem; font-size:0.75rem; font-weight:600;">${item.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div style="padding:1rem; border-top:1px solid var(--border); display:flex; gap:0.5rem;">
              <button class='btn btn-sm btn-primary flex-grow-1' onclick='editAlumniNotable("${item.id}")'><i class="fas fa-edit"></i> Edit</button>
              <button class='btn btn-sm btn-danger' onclick='deleteAlumniNotable("${item.id}")'><i class="fas fa-trash"></i></button>
            </div>
          </div>
        `).join('')}
      </div>` : `<div style="text-align:center; padding:2rem; color:var(--text-tertiary);">
        <i class="fas fa-inbox" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.5;"></i>
        <p>No alumni entries yet. Add your first notable alumni to get started!</p>
      </div>`}
    </div>
  `;
}

function resetAlumniNotableForm() {
  document.getElementById('alumniEditId').value = '';
  document.getElementById('alumniName').value = '';
  document.getElementById('alumniBatch').value = '';
  document.getElementById('alumniRole').value = '';
  document.getElementById('alumniCompany').value = '';
  document.getElementById('alumniLocation').value = '';
  document.getElementById('alumniEmail').value = '';
  document.getElementById('alumniLinkedin').value = '';
  document.getElementById('alumniStory').value = '';
  document.getElementById('alumniPhoto').value = '';
  document.getElementById('alumniFeatured').checked = false;
  document.getElementById('alumniActive').checked = true;
  document.getElementById('alumniFormTitle').textContent = 'Add Notable Alumni';
  document.getElementById('alumniSubmitBtn').textContent = 'Add';
}

function editAlumniNotable(id) {
  const item = cachedAlumniNotable.find(entry => entry.id === id);
  if (!item) {
    showAlert('Alumni item not found', 'danger');
    return;
  }
  document.getElementById('alumniEditId').value = item.id;
  document.getElementById('alumniName').value = item.name || '';
  document.getElementById('alumniBatch').value = item.batch_year || '';
  document.getElementById('alumniRole').value = item.current_role || '';
  document.getElementById('alumniCompany').value = item.company || '';
  document.getElementById('alumniLocation').value = item.location || '';
  document.getElementById('alumniEmail').value = item.email || '';
  document.getElementById('alumniLinkedin').value = item.linkedin_url || '';
  document.getElementById('alumniStory').value = item.success_story || '';
  document.getElementById('alumniFeatured').checked = !!item.is_featured;
  document.getElementById('alumniActive').checked = !!item.active;
  document.getElementById('alumniFormTitle').textContent = 'Edit Notable Alumni';
  document.getElementById('alumniSubmitBtn').textContent = 'Update';
}

async function saveAlumniNotable() {
  const editId = document.getElementById('alumniEditId').value;
  const fd = new FormData();
  fd.append('name', document.getElementById('alumniName').value);
  fd.append('batch_year', document.getElementById('alumniBatch').value);
  fd.append('current_role', document.getElementById('alumniRole').value);
  fd.append('company', document.getElementById('alumniCompany').value);
  fd.append('location', document.getElementById('alumniLocation').value);
  fd.append('email', document.getElementById('alumniEmail').value);
  fd.append('linkedin_url', document.getElementById('alumniLinkedin').value);
  fd.append('success_story', document.getElementById('alumniStory').value);
  fd.append('is_featured', document.getElementById('alumniFeatured').checked);
  fd.append('active', document.getElementById('alumniActive').checked);
  const photo = document.getElementById('alumniPhoto').files[0];
  if (photo) fd.append('photo', photo);

  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `${baseUrl}/alumni/${editId}` : `${baseUrl}/alumni`;
  const res = await fetch(url, {method, body: fd, headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Save alumni item failed', 'danger');
    return;
  }
  showAlert(editId ? 'Alumni item updated' : 'Alumni item added');
  await loadAlumniNotableManager();
  resetAlumniNotableForm();
}

async function deleteAlumniNotable(id) {
  if (!confirm('Delete this alumni item?')) return;
  const res = await fetch(`${baseUrl}/alumni/${id}`, {method:'DELETE', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Delete alumni item failed', 'danger');
    return;
  }
  showAlert('Deleted');
  loadAlumniNotableManager();
}

async function loadAlumniEventsManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navAlumniEvents').classList.add('active');
  panelTitle.textContent = 'Manage Alumni Events';
  hideAllManagers();
  alumniEventsManager.classList.remove('d-none');

  const res = await fetch(`${baseUrl}/alumni-events/admin/all`, {headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Unable to load alumni events', 'danger');
    return;
  }
  cachedAlumniEvents = await res.json();

  alumniEventsManager.innerHTML = `
    <div class="card p-3 mb-3">
      <h5 id="alumniEventFormTitle">Add Alumni Event</h5>
      <form onsubmit="return false;">
        <input type="hidden" id="alumniEventEditId">
        <div class="mb-2"><label>Title</label><input id="alumniEventTitle" class="form-control" required></div>
        <div class="mb-2"><label>Date</label><input id="alumniEventDate" class="form-control" type="datetime-local" required></div>
        <div class="mb-2"><label>Location</label><input id="alumniEventLocation" class="form-control" required></div>
        <div class="mb-2"><label>Description</label><textarea id="alumniEventDescription" class="form-control" rows="4" required></textarea></div>
        <div class="mb-2"><label>Participants Count</label><input id="alumniEventParticipants" class="form-control" type="number" min="0" value="0"></div>
        <div class="mb-2"><label>Images</label><input id="alumniEventImages" class="form-control" type="file" multiple accept="image/*"></div>
        <div class="mb-2 form-check"><input id="alumniEventFeatured" type="checkbox" class="form-check-input"><label class="form-check-label" for="alumniEventFeatured">Featured</label></div>
        <div class="mb-2 form-check"><input id="alumniEventActive" type="checkbox" class="form-check-input" checked><label class="form-check-label" for="alumniEventActive">Active</label></div>
        <button id="alumniEventSubmitBtn" class="btn btn-primary" onclick="saveAlumniEvent()">Add</button>
        <button type="button" class="btn btn-secondary" onclick="resetAlumniEventForm()">Reset</button>
      </form>
    </div>
    <div class="card p-3">
      <h5>Existing Alumni Events</h5>
      <table class="table table-sm"><thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Featured</th><th>Actions</th></tr></thead><tbody>
      ${cachedAlumniEvents.length ? cachedAlumniEvents.map(item => `
        <tr>
          <td>${item.title || ''}</td>
          <td>${item.date || ''}</td>
          <td>${item.location || ''}</td>
          <td>${item.is_featured ? 'Yes' : 'No'}</td>
          <td>
            <button class='btn btn-sm btn-primary' onclick='editAlumniEvent("${item.id}")'>Edit</button>
            <button class='btn btn-sm btn-danger' onclick='deleteAlumniEvent("${item.id}")'>Delete</button>
          </td>
        </tr>
      `).join('') : `<tr><td colspan="5">No alumni events found.</td></tr>`}
      </tbody></table>
    </div>
  `;
}

function resetAlumniEventForm() {
  document.getElementById('alumniEventEditId').value = '';
  document.getElementById('alumniEventTitle').value = '';
  document.getElementById('alumniEventDate').value = '';
  document.getElementById('alumniEventLocation').value = '';
  document.getElementById('alumniEventDescription').value = '';
  document.getElementById('alumniEventParticipants').value = '0';
  document.getElementById('alumniEventImages').value = '';
  document.getElementById('alumniEventFeatured').checked = false;
  document.getElementById('alumniEventActive').checked = true;
  document.getElementById('alumniEventFormTitle').textContent = 'Add Alumni Event';
  document.getElementById('alumniEventSubmitBtn').textContent = 'Add';
}

function editAlumniEvent(id) {
  const item = cachedAlumniEvents.find(entry => entry.id === id);
  if (!item) {
    showAlert('Alumni event not found', 'danger');
    return;
  }
  document.getElementById('alumniEventEditId').value = item.id;
  document.getElementById('alumniEventTitle').value = item.title || '';
  document.getElementById('alumniEventDate').value = item.date ? String(item.date).slice(0, 16) : '';
  document.getElementById('alumniEventLocation').value = item.location || '';
  document.getElementById('alumniEventDescription').value = item.description || '';
  document.getElementById('alumniEventParticipants').value = item.participants_count || 0;
  document.getElementById('alumniEventFeatured').checked = !!item.is_featured;
  document.getElementById('alumniEventActive').checked = !!item.active;
  document.getElementById('alumniEventFormTitle').textContent = 'Edit Alumni Event';
  document.getElementById('alumniEventSubmitBtn').textContent = 'Update';
}

async function saveAlumniEvent() {
  const editId = document.getElementById('alumniEventEditId').value;
  const fd = new FormData();
  fd.append('title', document.getElementById('alumniEventTitle').value);
  fd.append('date', document.getElementById('alumniEventDate').value);
  fd.append('location', document.getElementById('alumniEventLocation').value);
  fd.append('description', document.getElementById('alumniEventDescription').value);
  fd.append('participants_count', document.getElementById('alumniEventParticipants').value || 0);
  fd.append('is_featured', document.getElementById('alumniEventFeatured').checked);
  fd.append('active', document.getElementById('alumniEventActive').checked);
  const files = document.getElementById('alumniEventImages').files;
  for (let i = 0; i < files.length; i += 1) {
    fd.append('images', files[i]);
  }

  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `${baseUrl}/alumni-events/${editId}` : `${baseUrl}/alumni-events`;
  const res = await fetch(url, {method, body: fd, headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Save alumni event failed', 'danger');
    return;
  }
  showAlert(editId ? 'Alumni event updated' : 'Alumni event added');
  await loadAlumniEventsManager();
  resetAlumniEventForm();
}

async function deleteAlumniEvent(id) {
  if (!confirm('Delete this alumni event?')) return;
  const res = await fetch(`${baseUrl}/alumni-events/${id}`, {method:'DELETE', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Delete alumni event failed', 'danger');
    return;
  }
  showAlert('Deleted');
  loadAlumniEventsManager();
}

async function loadAlumniTestimonialsManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navAlumniTestimonials').classList.add('active');
  panelTitle.textContent = 'Manage Alumni Testimonials';
  hideAllManagers();
  alumniTestimonialsManager.classList.remove('d-none');

  try {
    const testimonials = await fetchJsonFirstAvailable([
      '/testimonials/all',
      '/testimonials'
    ], {headers:{'Authorization':'Bearer '+token}});
    cachedAlumniTestimonials = Array.isArray(testimonials) ? testimonials : [];
  } catch (error) {
    showAlert('Unable to load testimonials (endpoint not available)', 'danger');
    alumniTestimonialsManager.innerHTML = `<div class="card p-3"><p class="mb-0 text-danger">Testimonials API endpoints are not available on the current backend.</p></div>`;
    return;
  }

  alumniTestimonialsManager.innerHTML = `
    <div class="card p-3 mb-3">
      <h5 id="testimonialFormTitle">Add Testimonial</h5>
      <form onsubmit="return false;">
        <input type="hidden" id="testimonialEditId">
        <div class="mb-2"><label>Name</label><input id="testimonialName" class="form-control" required></div>
        <div class="mb-2"><label>Batch</label><input id="testimonialBatch" class="form-control" required></div>
        <div class="mb-2"><label>Email</label><input id="testimonialEmail" class="form-control" required></div>
        <div class="mb-2"><label>Message</label><textarea id="testimonialMessage" class="form-control" rows="4" required></textarea></div>
        <div class="mb-2"><label>Photo</label><input id="testimonialPhoto" type="file" class="form-control" accept="image/*"></div>
        <div class="mb-2 form-check"><input id="testimonialApproved" type="checkbox" class="form-check-input"><label class="form-check-label" for="testimonialApproved">Approved</label></div>
        <button id="testimonialSubmitBtn" class="btn btn-primary" onclick="saveTestimonial()">Add</button>
        <button type="button" class="btn btn-secondary" onclick="resetTestimonialForm()">Reset</button>
      </form>
    </div>
    <div class="card p-3">
      <h5>Testimonials</h5>
      <table class="table table-sm"><thead><tr><th>Name</th><th>Batch</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${cachedAlumniTestimonials.length ? cachedAlumniTestimonials.map(item => `
        <tr>
          <td>${item.name || ''}</td>
          <td>${item.batch || ''}</td>
          <td>${item.status || ''}</td>
          <td>
            <button class='btn btn-sm btn-primary' onclick='editTestimonial("${item.id}")'>Edit</button>
            <button class='btn btn-sm btn-success' onclick='approveTestimonialInline("${item.id}")'>Approve</button>
            <button class='btn btn-sm btn-warning' onclick='rejectTestimonialInline("${item.id}")'>Reject</button>
            <button class='btn btn-sm btn-danger' onclick='deleteTestimonialInline("${item.id}")'>Delete</button>
          </td>
        </tr>
      `).join('') : `<tr><td colspan="4">No testimonials found.</td></tr>`}
      </tbody></table>
    </div>
  `;
}

function resetTestimonialForm() {
  document.getElementById('testimonialEditId').value = '';
  document.getElementById('testimonialName').value = '';
  document.getElementById('testimonialBatch').value = '';
  document.getElementById('testimonialEmail').value = '';
  document.getElementById('testimonialMessage').value = '';
  document.getElementById('testimonialPhoto').value = '';
  document.getElementById('testimonialApproved').checked = false;
  document.getElementById('testimonialFormTitle').textContent = 'Add Testimonial';
  document.getElementById('testimonialSubmitBtn').textContent = 'Add';
}

function editTestimonial(id) {
  const item = cachedAlumniTestimonials.find(entry => entry.id === id);
  if (!item) {
    showAlert('Testimonial not found', 'danger');
    return;
  }
  document.getElementById('testimonialEditId').value = item.id;
  document.getElementById('testimonialName').value = item.name || '';
  document.getElementById('testimonialBatch').value = item.batch || '';
  document.getElementById('testimonialEmail').value = item.email || '';
  document.getElementById('testimonialMessage').value = item.message || '';
  document.getElementById('testimonialApproved').checked = !!item.is_approved;
  document.getElementById('testimonialFormTitle').textContent = 'Edit Testimonial';
  document.getElementById('testimonialSubmitBtn').textContent = 'Update';
}

async function saveTestimonial() {
  const editId = document.getElementById('testimonialEditId').value;
  const fd = new FormData();
  fd.append('name', document.getElementById('testimonialName').value);
  fd.append('batch', document.getElementById('testimonialBatch').value);
  fd.append('email', document.getElementById('testimonialEmail').value);
  fd.append('message', document.getElementById('testimonialMessage').value);
  fd.append('is_approved', document.getElementById('testimonialApproved').checked);
  const photo = document.getElementById('testimonialPhoto').files[0];
  if (photo) fd.append('photo', photo);

  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `${baseUrl}/testimonials/${editId}` : `${baseUrl}/testimonials`;
  const headers = editId ? {'Authorization':'Bearer '+token} : {};
  const res = await fetch(url, {method, body: fd, headers});
  if (!res.ok) {
    showAlert('Save testimonial failed', 'danger');
    return;
  }
  showAlert(editId ? 'Testimonial updated' : 'Testimonial added');
  await loadAlumniTestimonialsManager();
  resetTestimonialForm();
}

async function approveTestimonialInline(id) {
  const res = await fetch(`${baseUrl}/testimonials/${id}/approve`, {method:'PUT', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Approve testimonial failed', 'danger');
    return;
  }
  showAlert('Testimonial approved');
  loadAlumniTestimonialsManager();
}

async function rejectTestimonialInline(id) {
  const res = await fetch(`${baseUrl}/testimonials/${id}/reject`, {method:'PUT', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Reject testimonial failed', 'danger');
    return;
  }
  showAlert('Testimonial rejected');
  loadAlumniTestimonialsManager();
}

async function deleteTestimonialInline(id) {
  if (!confirm('Delete this testimonial?')) return;
  const res = await fetch(`${baseUrl}/testimonials/${id}`, {method:'DELETE', headers:{'Authorization':'Bearer '+token}});
  if (!res.ok) {
    showAlert('Delete testimonial failed', 'danger');
    return;
  }
  showAlert('Deleted');
  loadAlumniTestimonialsManager();
}

// ==================== SPORTS FACILITIES MANAGER ====================
async function loadSportsFacilitiesManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navSportsFacilities').classList.add('active');
  
  const panelTitle = document.getElementById('panelTitle');
  panelTitle.textContent = 'Manage Sports Facilities';
  
  const manager = document.getElementById('sportsFacilitiesManager');
  manager.classList.remove('d-none');
  document.querySelectorAll('[id$="Manager"]:not(#sportsFacilitiesManager)').forEach(el => el.classList.add('d-none'));
  
  manager.innerHTML = `
    <div style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; margin-bottom: 1.5rem;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Add New Sport</h5>
      <form id="sportForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <input type="hidden" id="sportEditId">
        <input type="text" id="sportName" placeholder="Sport Name" required style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="sportDescription" placeholder="Description" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="file" id="sportImage" accept="image/*" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <div style="grid-column: 1 / -1;"><img id="sportImagePreview" alt="Preview" style="display:none; max-height:180px; border:1px solid var(--border); border-radius:0.625rem; object-fit:cover;"></div>
        <input type="text" id="sportIcon" placeholder="Font Awesome icon (e.g., fas fa-dumbbell)" value="fas fa-dumbbell" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="sportFacility" placeholder="Facility Details" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="number" id="sportOrder" placeholder="Order" value="0" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <div style="display: flex; gap: 0.5rem; grid-column: 1 / -1;">
          <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="sportFeatured"> Featured</label>
          <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="sportActive" checked> Active</label>
        </div>
        <button type="submit" style="grid-column: 1 / -1; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Save Sport</button>
        <button type="button" id="sportFormCancel" style="grid-column: 1 / -1; padding: 0.75rem; background: var(--border); color: var(--text-primary); border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: none;">Cancel Edit</button>
      </form>
    </div>
    <div id="sportsList" style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; overflow-x: auto;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Sports Facilities</h5>
      <div id="sportsContent" style="min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Loading...</div>
    </div>
  `;
  
  // Add image preview handler for sports
  document.getElementById('sportImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('sportImagePreview');
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'none';
    }
  });
  
  document.getElementById('sportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('sportEditId').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('sportName').value);
    formData.append('description', document.getElementById('sportDescription').value);
    formData.append('icon', document.getElementById('sportIcon').value);
    formData.append('facility_details', document.getElementById('sportFacility').value);
    formData.append('order', document.getElementById('sportOrder').value);
    formData.append('featured', document.getElementById('sportFeatured').checked ? '1' : '0');
    formData.append('active', document.getElementById('sportActive').checked ? '1' : '0');
    
    const imageFile = document.getElementById('sportImage').files[0];
    if (imageFile) formData.append('image', imageFile);
    
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${facilitiesBase}/sports/${editId}` : `${facilitiesBase}/sports`;
    
    const res = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!res.ok) {
      showAlert('Failed to save sport', 'danger');
      return;
    }
    
    showAlert(editId ? 'Sport updated' : 'Sport added');
    document.getElementById('sportForm').reset();
    document.getElementById('sportEditId').value = '';
    document.getElementById('sportFormCancel').style.display = 'none';
    await loadSportsFacilitiesData();
  });
  
  document.getElementById('sportFormCancel').addEventListener('click', () => {
    document.getElementById('sportForm').reset();
    document.getElementById('sportEditId').value = '';
    document.getElementById('sportFormCancel').style.display = 'none';
  });
  
  await loadSportsFacilitiesData();
}

async function loadSportsFacilitiesData() {
  const res = await fetch(`${facilitiesBase}/sports/all`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    showAlert('Failed to load sports: ' + (txt || res.status), 'danger');
    document.getElementById('sportsContent').innerHTML = '<div style="padding:1rem; color:var(--text-secondary)">Failed to load sports.</div>';
    return;
  }
  const sports = await res.json();
  
  const html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead style="border-bottom: 2px solid var(--border);">
        <tr>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Image</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Name</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Description</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Status</th>
          <th style="padding: 1rem; text-align: center; font-weight: 700;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sports.map(s => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem;">
              ${s.image ? `<img src="${normalizeMediaUrl(s.image)}" alt="${s.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem;">` : '<span style="color: var(--text-secondary);">No image</span>'}
            </td>
            <td style="padding: 1rem;">${s.name}</td>
            <td style="padding: 1rem; color: var(--text-secondary);">${(s.description || '').substring(0, 50)}${(s.description || '').length > 50 ? '...' : ''}</td>
            <td style="padding: 1rem;">
              <span style="padding: 0.25rem 0.75rem; background: ${s.active ? 'var(--success-light)' : 'var(--danger-light)'}; color: ${s.active ? 'var(--success)' : 'var(--danger)'}; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;">
                ${s.active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td style="padding: 1rem; text-align: center;">
              <button onclick="editSport('${s.id}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; margin-right: 0.5rem;">Edit</button>
              <button onclick="deleteSport('${s.id}')" style="padding: 0.5rem 1rem; background: var(--danger); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  document.getElementById('sportsContent').innerHTML = html;
}

async function editSport(id) {
  const res = await fetch(`${facilitiesBase}/sports/${id}`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load sport details', 'danger');
    return;
  }
  const sport = await res.json();
  
  document.getElementById('sportEditId').value = id;
  document.getElementById('sportName').value = sport.name;
  document.getElementById('sportDescription').value = sport.description || '';
  document.getElementById('sportIcon').value = sport.icon || 'fas fa-dumbbell';
  document.getElementById('sportFacility').value = sport.facility_details || '';
  document.getElementById('sportOrder').value = sport.order || 0;
  document.getElementById('sportFeatured').checked = sport.featured || false;
  document.getElementById('sportActive').checked = sport.active !== false;
  document.getElementById('sportFormCancel').style.display = 'block';
  
  // Show existing image if it exists
  if (sport.image) {
    const preview = document.getElementById('sportImagePreview');
    preview.src = normalizeMediaUrl(sport.image);
    preview.style.display = 'block';
  }
  
  document.getElementById('sportName').focus();
  document.querySelector('#sportsList').scrollIntoView({ behavior: 'smooth' });
}

async function deleteSport(id) {
  if (!confirm('Delete this sport?')) return;
  const res = await fetch(`${facilitiesBase}/sports/${id}`, { method: 'DELETE', headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to delete sport', 'danger');
    return;
  }
  showAlert('Sport deleted');
  await loadSportsFacilitiesData();
}

// ==================== SPORTS EVENTS MANAGER ====================
async function loadSportsEventsManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navSportsEvents').classList.add('active');
  
  const panelTitle = document.getElementById('panelTitle');
  panelTitle.textContent = 'Manage Sports Events';
  
  const manager = document.getElementById('sportsEventsManager');
  manager.classList.remove('d-none');
  document.querySelectorAll('[id$="Manager"]:not(#sportsEventsManager)').forEach(el => el.classList.add('d-none'));
  
  manager.innerHTML = `
    <div style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; margin-bottom: 1.5rem;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Add New Event</h5>
      <form id="eventForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <input type="hidden" id="eventEditId">
        <input type="text" id="eventTitle" placeholder="Event Title" required style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="datetime-local" id="eventDate" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="eventVenue" placeholder="Venue" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="eventSportType" placeholder="Sport Type" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <select id="eventType" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="past">Past</option>
        </select>
        <input type="file" id="eventBanner" accept="image/*" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <textarea id="eventDescription" placeholder="Description" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem; grid-column: 1 / -1;"></textarea>
        <textarea id="eventRegistration" placeholder="Registration Details" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem; grid-column: 1 / -1;"></textarea>
        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="eventActive" checked> Active</label>
        <button type="submit" style="grid-column: 1 / -1; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Save Event</button>
        <button type="button" id="eventFormCancel" style="grid-column: 1 / -1; padding: 0.75rem; background: var(--border); color: var(--text-primary); border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: none;">Cancel Edit</button>
      </form>
    </div>
    <div id="eventsList" style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; overflow-x: auto;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Sports Events</h5>
      <div id="eventsContent" style="min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Loading...</div>
    </div>
  `;
  
  document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('eventEditId').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('eventTitle').value);
    formData.append('event_date', document.getElementById('eventDate').value);
    formData.append('venue', document.getElementById('eventVenue').value);
    formData.append('sport_type', document.getElementById('eventSportType').value);
    formData.append('event_type', document.getElementById('eventType').value);
    formData.append('description', document.getElementById('eventDescription').value);
    formData.append('registration_details', document.getElementById('eventRegistration').value);
    formData.append('active', document.getElementById('eventActive').checked ? '1' : '0');
    
    const bannerFile = document.getElementById('eventBanner').files[0];
    if (bannerFile) formData.append('banner_image', bannerFile);
    
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${facilitiesBase}/sports/events/${editId}` : `${facilitiesBase}/sports/events`;
    
    const res = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!res.ok) {
      showAlert('Failed to save event', 'danger');
      return;
    }
    
    showAlert(editId ? 'Event updated' : 'Event added');
    document.getElementById('eventForm').reset();
    document.getElementById('eventEditId').value = '';
    document.getElementById('eventFormCancel').style.display = 'none';
    await loadSportsEventsData();
  });
  
  document.getElementById('eventFormCancel').addEventListener('click', () => {
    document.getElementById('eventForm').reset();
    document.getElementById('eventEditId').value = '';
    document.getElementById('eventFormCancel').style.display = 'none';
  });
  
  await loadSportsEventsData();
}

async function loadSportsEventsData() {
  const res = await fetch(`${facilitiesBase}/sports/events/all`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    showAlert('Failed to load events: ' + (txt || res.status), 'danger');
    document.getElementById('eventsContent').innerHTML = '<div style="padding:1rem; color:var(--text-secondary)">Failed to load events.</div>';
    return;
  }
  const events = await res.json();
  
  const html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead style="border-bottom: 2px solid var(--border);">
        <tr>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Title</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Date</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Type</th>
          <th style="padding: 1rem; text-align: center; font-weight: 700;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${events.map(e => {
          const eventDate = new Date(e.event_date).toLocaleDateString();
          return `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem;">${e.title}</td>
            <td style="padding: 1rem; color: var(--text-secondary);">${eventDate}</td>
            <td style="padding: 1rem;">${e.event_type}</td>
            <td style="padding: 1rem; text-align: center;">
              <button onclick="editEvent('${e.id}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; margin-right: 0.5rem;">Edit</button>
              <button onclick="deleteEvent('${e.id}')" style="padding: 0.5rem 1rem; background: var(--danger); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">Delete</button>
            </td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  `;
  
  document.getElementById('eventsContent').innerHTML = html;
}

async function editEvent(id) {
  const res = await fetch(`${facilitiesBase}/sports/events/${id}`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load event details', 'danger');
    return;
  }
  const event = await res.json();
  
  document.getElementById('eventEditId').value = id;
  document.getElementById('eventTitle').value = event.title;
  document.getElementById('eventDate').value = new Date(event.event_date).toISOString().slice(0, 16);
  document.getElementById('eventVenue').value = event.venue || '';
  document.getElementById('eventSportType').value = event.sport_type || '';
  document.getElementById('eventType').value = event.event_type || 'upcoming';
  document.getElementById('eventDescription').value = event.description || '';
  document.getElementById('eventRegistration').value = event.registration_details || '';
  document.getElementById('eventActive').checked = event.active !== false;
  document.getElementById('eventFormCancel').style.display = 'block';
  
  document.getElementById('eventTitle').focus();
}

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  const res = await fetch(`${facilitiesBase}/sports/events/${id}`, { method: 'DELETE', headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to delete event', 'danger');
    return;
  }
  showAlert('Event deleted');
  await loadSportsEventsData();
}

// ==================== SPORTS ACHIEVEMENTS MANAGER ====================
async function loadSportsAchievementsManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navSportsAchievements').classList.add('active');
  
  const panelTitle = document.getElementById('panelTitle');
  panelTitle.textContent = 'Manage Sports Achievements';
  
  const manager = document.getElementById('sportsAchievementsManager');
  manager.classList.remove('d-none');
  document.querySelectorAll('[id$="Manager"]:not(#sportsAchievementsManager)').forEach(el => el.classList.add('d-none'));
  
  manager.innerHTML = `
    <div style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; margin-bottom: 1.5rem;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Add New Achievement</h5>
      <form id="achievementForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <input type="hidden" id="achievementEditId">
        <input type="text" id="achievementTitle" placeholder="Achievement Title" required style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="studentName" placeholder="Student Name" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="studentClass" placeholder="Class" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="competition" placeholder="Competition Name" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="position" placeholder="Position (Gold, Silver, Bronze, etc.)" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="text" id="sportType" placeholder="Sport Type" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <select id="achievementType" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
          <option value="medal">Medal</option>
          <option value="trophy">Trophy</option>
          <option value="certificate">Certificate</option>
          <option value="result">Result</option>
        </select>
        <input type="datetime-local" id="achievedAt" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <input type="file" id="achievementImage" accept="image/*" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <textarea id="achievementDetails" placeholder="Details" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem; grid-column: 1 / -1;"></textarea>
        <div style="display: flex; gap: 0.5rem; grid-column: 1 / -1;">
          <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="achievementFeatured"> Featured</label>
          <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="achievementActive" checked> Active</label>
        </div>
        <button type="submit" style="grid-column: 1 / -1; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Save Achievement</button>
        <button type="button" id="achievementFormCancel" style="grid-column: 1 / -1; padding: 0.75rem; background: var(--border); color: var(--text-primary); border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: none;">Cancel Edit</button>
      </form>
    </div>
    <div id="achievementsList" style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; overflow-x: auto;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Achievements</h5>
      <div id="achievementsContent" style="min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Loading...</div>
    </div>
  `;
  
  document.getElementById('achievementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('achievementEditId').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('achievementTitle').value);
    formData.append('student_name', document.getElementById('studentName').value);
    formData.append('student_class', document.getElementById('studentClass').value);
    formData.append('competition', document.getElementById('competition').value);
    formData.append('position', document.getElementById('position').value);
    formData.append('sport_type', document.getElementById('sportType').value);
    formData.append('achievement_type', document.getElementById('achievementType').value);
    formData.append('achieved_at', document.getElementById('achievedAt').value);
    formData.append('details', document.getElementById('achievementDetails').value);
    formData.append('featured', document.getElementById('achievementFeatured').checked ? '1' : '0');
    formData.append('active', document.getElementById('achievementActive').checked ? '1' : '0');
    
    const imageFile = document.getElementById('achievementImage').files[0];
    if (imageFile) formData.append('image', imageFile);
    
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${facilitiesBase}/sports/achievements/${editId}` : `${facilitiesBase}/sports/achievements`;
    
    const res = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!res.ok) {
      showAlert('Failed to save achievement', 'danger');
      return;
    }
    
    showAlert(editId ? 'Achievement updated' : 'Achievement added');
    document.getElementById('achievementForm').reset();
    document.getElementById('achievementEditId').value = '';
    document.getElementById('achievementFormCancel').style.display = 'none';
    await loadSportsAchievementsData();
  });
  
  document.getElementById('achievementFormCancel').addEventListener('click', () => {
    document.getElementById('achievementForm').reset();
    document.getElementById('achievementEditId').value = '';
    document.getElementById('achievementFormCancel').style.display = 'none';
  });
  
  await loadSportsAchievementsData();
}

async function loadSportsAchievementsData() {
  const res = await fetch(`${facilitiesBase}/sports/achievements/all`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    showAlert('Failed to load achievements: ' + (txt || res.status), 'danger');
    document.getElementById('achievementsContent').innerHTML = '<div style="padding:1rem; color:var(--text-secondary)">Failed to load achievements.</div>';
    return;
  }
  const achievements = await res.json();
  
  const html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead style="border-bottom: 2px solid var(--border);">
        <tr>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Title</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Student</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Position</th>
          <th style="padding: 1rem; text-align: center; font-weight: 700;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${achievements.map(a => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem;">${a.title}</td>
            <td style="padding: 1rem; color: var(--text-secondary);">${a.student_name || '-'}</td>
            <td style="padding: 1rem;">${a.position || a.achievement_type}</td>
            <td style="padding: 1rem; text-align: center;">
              <button onclick="editAchievement('${a.id}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; margin-right: 0.5rem;">Edit</button>
              <button onclick="deleteAchievement('${a.id}')" style="padding: 0.5rem 1rem; background: var(--danger); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  document.getElementById('achievementsContent').innerHTML = html;
}

async function editAchievement(id) {
  const res = await fetch(`${facilitiesBase}/sports/achievements/${id}`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load achievement details', 'danger');
    return;
  }
  const achievement = await res.json();
  
  document.getElementById('achievementEditId').value = id;
  document.getElementById('achievementTitle').value = achievement.title;
  document.getElementById('studentName').value = achievement.student_name || '';
  document.getElementById('studentClass').value = achievement.student_class || '';
  document.getElementById('competition').value = achievement.competition || '';
  document.getElementById('position').value = achievement.position || '';
  document.getElementById('sportType').value = achievement.sport_type || '';
  document.getElementById('achievementType').value = achievement.achievement_type || 'medal';
  document.getElementById('achievedAt').value = new Date(achievement.achieved_at).toISOString().slice(0, 16);
  document.getElementById('achievementDetails').value = achievement.details || '';
  document.getElementById('achievementFeatured').checked = achievement.featured || false;
  document.getElementById('achievementActive').checked = achievement.active !== false;
  document.getElementById('achievementFormCancel').style.display = 'block';
  
  document.getElementById('achievementTitle').focus();
}

async function deleteAchievement(id) {
  if (!confirm('Delete this achievement?')) return;
  const res = await fetch(`${facilitiesBase}/sports/achievements/${id}`, { method: 'DELETE', headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to delete achievement', 'danger');
    return;
  }
  showAlert('Achievement deleted');
  await loadSportsAchievementsData();
}

// ==================== HOSTEL INFO MANAGER ====================
async function loadHostelInfoManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navHostelInfo').classList.add('active');
  
  const panelTitle = document.getElementById('panelTitle');
  panelTitle.textContent = 'Manage Hostel Info';
  
  const manager = document.getElementById('hostelInfoManager');
  manager.classList.remove('d-none');
  document.querySelectorAll('[id$="Manager"]:not(#hostelInfoManager)').forEach(el => el.classList.add('d-none'));

  const html = `
    <form id="hostelInfoForm" style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
      <input type="hidden" id="hostelEditId" value="">
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Title <span style="color: red;">*</span></label>
        <input type="text" id="hostelTitle" placeholder="Hostel Facilities" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; font-size: 1rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Subtitle</label>
        <input type="text" id="hostelSubtitle" placeholder="Premium Residential Excellence" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; font-size: 1rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Description</label>
        <textarea id="hostelDescription" placeholder="Describe your hostel facilities..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; font-size: 1rem; min-height: 100px; resize: vertical;"></textarea>
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Banner Image</label>
        <input type="file" id="hostelImage" accept="image/*" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        <img id="hostelImagePreview" style="display: none; max-width: 100%; max-height: 200px; margin-top: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border);">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Overlay Opacity (0-1)</label>
        <input type="number" id="hostelOverlay" value="0.3" min="0" max="1" step="0.1" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">CTA Button Text</label>
          <input type="text" id="hostelCTAText" value="Explore" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">CTA Button Link</label>
          <input type="text" id="hostelCTALink" value="#schedule" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
        </div>
      </div>
      
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="checkbox" id="hostelActive" checked>
        <label style="margin: 0; font-weight: 600;">Active</label>
      </div>
      
      <button type="submit" style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Save</button>
      <button type="button" id="hostelFormCancel" style="display: none; padding: 0.75rem 1.5rem; background: var(--text-secondary); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Cancel</button>
    </form>
    
    <div id="hostelList" style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; overflow-x: auto;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Current Hostel Info</h5>
      <div id="hostelContent" style="min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Loading...</div>
    </div>
  `;
  
  document.getElementById('hostelInfoManager').innerHTML = html;
  
  // Add image preview handler
  document.getElementById('hostelImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('hostelImagePreview');
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'none';
    }
  });
  
  document.getElementById('hostelInfoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const title = document.getElementById('hostelTitle').value.trim();
    if (!title) {
      showAlert('Title is required', 'danger');
      return;
    }
    
    const editId = document.getElementById('hostelEditId').value;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subtitle', document.getElementById('hostelSubtitle').value);
    formData.append('description', document.getElementById('hostelDescription').value);
    formData.append('overlay_opacity', document.getElementById('hostelOverlay').value);
    formData.append('cta_button_text', document.getElementById('hostelCTAText').value);
    formData.append('cta_button_link', document.getElementById('hostelCTALink').value);
    
    // Send boolean as 1/0 which Pydantic can parse
    if (document.getElementById('hostelActive').checked) {
      formData.append('active', '1');
    } else {
      formData.append('active', '0');
    }
    
    const imageFile = document.getElementById('hostelImage').files[0];
    if (imageFile) formData.append('banner_image', imageFile);
    
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${baseUrl}/hostel/${editId}` : `${baseUrl}/hostel`;
    
    console.log('Submitting hostel form to', url, 'with title:', title);
    
    const res = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Hostel save error:', { status: res.status, error: errorData });
      const errorMsg = errorData.detail ? (Array.isArray(errorData.detail) ? JSON.stringify(errorData.detail) : errorData.detail) : 'Failed to save hostel info';
      showAlert(errorMsg, 'danger');
      return;
    }
    
    showAlert(editId ? 'Hostel info updated' : 'Hostel info created');
    document.getElementById('hostelInfoForm').reset();
    document.getElementById('hostelEditId').value = '';
    document.getElementById('hostelFormCancel').style.display = 'none';
    await loadHostelInfoData();
  });
  
  document.getElementById('hostelFormCancel').addEventListener('click', () => {
    document.getElementById('hostelInfoForm').reset();
    document.getElementById('hostelEditId').value = '';
    document.getElementById('hostelFormCancel').style.display = 'none';
  });
  
  await loadHostelInfoData();
}

async function loadHostelInfoData() {
  const res = await fetch(`${baseUrl}/hostel/admin`, { headers: {'Authorization': 'Bearer ' + token} });
  const hostelInfo = await res.json();
  
  if (!hostelInfo || !hostelInfo.id) {
    document.getElementById('hostelContent').innerHTML = '<div style="padding:1rem; color:var(--text-secondary)">No hostel info created yet. Fill the form above to create one.</div>';
    return;
  }
  
  document.getElementById('hostelContent').innerHTML = `
    <div style="display: grid; gap: 1rem;">
      ${hostelInfo.banner_image ? `
        <div style="border-radius: 0.875rem; overflow: hidden; border: 1px solid var(--border);">
          <img src="${normalizeMediaUrl(hostelInfo.banner_image)}" alt="Hostel Banner" style="width: 100%; height: 300px; object-fit: cover;">
        </div>
      ` : ''}
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 2px solid var(--border);">
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Field</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Value</th>
          <th style="padding: 1rem; text-align: center; font-weight: 700;">Action</th>
        </tr>
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem;">Title</td>
          <td style="padding: 1rem;">${hostelInfo.title}</td>
          <td rowspan="7" style="padding: 1rem; text-align: center; vertical-align: center;">
            <button onclick="loadHostelInfoForEdit('${hostelInfo.id}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">Edit</button>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem;">Subtitle</td>
          <td style="padding: 1rem;">${hostelInfo.subtitle || 'N/A'}</td>
        </tr>
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem;">Description</td>
          <td style="padding: 1rem; color: var(--text-secondary);">${(hostelInfo.description || '').substring(0, 100)}${(hostelInfo.description || '').length > 100 ? '...' : ''}</td>
        </tr>
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem;">CTA Button Text</td>
          <td style="padding: 1rem;">${hostelInfo.cta_button_text || 'Explore'}</td>
        </tr>
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem;">CTA Button Link</td>
          <td style="padding: 1rem;">${hostelInfo.cta_button_link || '#schedule'}</td>
        </tr>
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem;">Overlay Opacity</td>
          <td style="padding: 1rem;">${hostelInfo.overlay_opacity || 0.3}</td>
        </tr>
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 1rem;">Status</td>
          <td style="padding: 1rem;">
            <span style="padding: 0.25rem 0.75rem; background: ${hostelInfo.active ? 'var(--success-light)' : 'var(--danger-light)'}; color: ${hostelInfo.active ? 'var(--success)' : 'var(--danger)'}; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;">
              ${hostelInfo.active ? 'Active' : 'Inactive'}
            </span>
          </td>
        </tr>
      </table>
    </div>
  `;
}

async function loadHostelInfoForEdit(id) {
  const res = await fetch(`${baseUrl}/hostel/admin`, { headers: {'Authorization': 'Bearer ' + token} });
  const hostelInfo = await res.json();
  if (!hostelInfo) {
    showAlert('Failed to load hostel info', 'danger');
    return;
  }
  
  document.getElementById('hostelEditId').value = hostelInfo.id;
  document.getElementById('hostelTitle').value = hostelInfo.title;
  document.getElementById('hostelSubtitle').value = hostelInfo.subtitle || '';
  document.getElementById('hostelDescription').value = hostelInfo.description || '';
  document.getElementById('hostelOverlay').value = hostelInfo.overlay_opacity || 0.3;
  document.getElementById('hostelCTAText').value = hostelInfo.cta_button_text || 'Explore';
  document.getElementById('hostelCTALink').value = hostelInfo.cta_button_link || '#schedule';
  document.getElementById('hostelActive').checked = hostelInfo.active !== false;
  document.getElementById('hostelFormCancel').style.display = 'block';
  
  // Show existing image if it exists
  if (hostelInfo.banner_image) {
    const preview = document.getElementById('hostelImagePreview');
    preview.src = normalizeMediaUrl(hostelInfo.banner_image);
    preview.style.display = 'block';
  }
  
  document.getElementById('hostelTitle').focus();
}

// ==================== HOSTEL SCHEDULE MANAGER ====================
async function loadHostelScheduleManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navHostelSchedule').classList.add('active');
  
  const panelTitle = document.getElementById('panelTitle');
  panelTitle.textContent = 'Manage Hostel Schedule';
  
  const manager = document.getElementById('hostelScheduleManager');
  manager.classList.remove('d-none');
  document.querySelectorAll('[id$="Manager"]:not(#hostelScheduleManager)').forEach(el => el.classList.add('d-none'));

  const html = `
    <form id="scheduleForm" style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
      <input type="hidden" id="scheduleEditId" value="">
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Activity Title</label>
        <input type="text" id="scheduleTitle" placeholder="e.g., Breakfast" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Time</label>
        <input type="text" id="scheduleTime" placeholder="e.g., 7:00 AM - 8:00 AM" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Description</label>
        <textarea id="scheduleDesc" placeholder="Add any special notes or instructions..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; min-height: 80px; resize: vertical;"></textarea>
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Icon Class</label>
        <input type="text" id="scheduleIcon" value="fas fa-clock" placeholder="e.g., fas fa-utensils" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Order</label>
        <input type="number" id="scheduleOrder" value="0" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="checkbox" id="scheduleActive" checked>
        <label style="margin: 0; font-weight: 600;">Active</label>
      </div>
      
      <button type="submit" style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Add Schedule</button>
      <button type="button" id="scheduleFormCancel" style="display: none; padding: 0.75rem 1.5rem; background: var(--text-secondary); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Cancel</button>
    </form>
    
    <div id="scheduleList" style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; overflow-x: auto;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Hostel Schedules</h5>
      <div id="scheduleContent" style="min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Loading...</div>
    </div>
  `;
  
  document.getElementById('hostelScheduleManager').innerHTML = html;
  
  document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('scheduleEditId').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('scheduleTitle').value);
    formData.append('time', document.getElementById('scheduleTime').value);
    formData.append('description', document.getElementById('scheduleDesc').value);
    formData.append('icon', document.getElementById('scheduleIcon').value);
    formData.append('order', document.getElementById('scheduleOrder').value);
    formData.append('active', document.getElementById('scheduleActive').checked ? '1' : '0');
    
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${baseUrl}/hostel/schedules/${editId}` : `${baseUrl}/hostel/schedules`;
    
    const res = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!res.ok) {
      showAlert('Failed to save schedule', 'danger');
      return;
    }
    
    showAlert(editId ? 'Schedule updated' : 'Schedule added');
    document.getElementById('scheduleForm').reset();
    document.getElementById('scheduleEditId').value = '';
    document.getElementById('scheduleFormCancel').style.display = 'none';
    await loadHostelSchedulesData();
  });
  
  document.getElementById('scheduleFormCancel').addEventListener('click', () => {
    document.getElementById('scheduleForm').reset();
    document.getElementById('scheduleEditId').value = '';
    document.getElementById('scheduleFormCancel').style.display = 'none';
  });
  
  await loadHostelSchedulesData();
}

async function loadHostelSchedulesData() {
  const res = await fetch(`${baseUrl}/hostel/schedules/all`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load schedules', 'danger');
    return;
  }
  const schedules = await res.json();
  
  const html = schedules.length === 0 ? '<div style="padding:1rem; color:var(--text-secondary)">No schedules yet.</div>' : `
    <table style="width: 100%; border-collapse: collapse;">
      <thead style="border-bottom: 2px solid var(--border);">
        <tr>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Time</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Activity</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Description</th>
          <th style="padding: 1rem; text-align: center; font-weight: 700;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${schedules.map(s => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem; font-weight: 600;">${s.time}</td>
            <td style="padding: 1rem;">${s.title}</td>
            <td style="padding: 1rem; color: var(--text-secondary);">${(s.description || '').substring(0, 40)}...</td>
            <td style="padding: 1rem; text-align: center;">
              <button onclick="editSchedule('${s.id}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; margin-right: 0.5rem;">Edit</button>
              <button onclick="deleteSchedule('${s.id}')" style="padding: 0.5rem 1rem; background: var(--danger); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  document.getElementById('scheduleContent').innerHTML = html;
}

async function editSchedule(id) {
  const res = await fetch(`${baseUrl}/hostel/schedules/${id}`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load schedule', 'danger');
    return;
  }
  const schedule = await res.json();
  
  document.getElementById('scheduleEditId').value = id;
  document.getElementById('scheduleTitle').value = schedule.title;
  document.getElementById('scheduleTime').value = schedule.time;
  document.getElementById('scheduleDesc').value = schedule.description || '';
  document.getElementById('scheduleIcon').value = schedule.icon || 'fas fa-clock';
  document.getElementById('scheduleOrder').value = schedule.order || 0;
  document.getElementById('scheduleActive').checked = schedule.active !== false;
  document.getElementById('scheduleFormCancel').style.display = 'block';
  document.getElementById('scheduleTitle').focus();
}

async function deleteSchedule(id) {
  if (!confirm('Delete this schedule?')) return;
  const res = await fetch(`${baseUrl}/hostel/schedules/${id}`, { method: 'DELETE', headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to delete schedule', 'danger');
    return;
  }
  showAlert('Schedule deleted');
  await loadHostelSchedulesData();
}

// ==================== HOSTEL NOTICES MANAGER ====================
async function loadHostelNoticesManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navHostelNotices').classList.add('active');
  
  const panelTitle = document.getElementById('panelTitle');
  panelTitle.textContent = 'Manage Hostel Notices';
  
  const manager = document.getElementById('hostelNoticesManager');
  manager.classList.remove('d-none');
  document.querySelectorAll('[id$="Manager"]:not(#hostelNoticesManager)').forEach(el => el.classList.add('d-none'));

  const html = `
    <form id="noticeForm" style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
      <input type="hidden" id="noticeEditId" value="">
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Notice Title</label>
        <input type="text" id="noticeTitle" placeholder="e.g., Hostel Maintenance Schedule" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Content</label>
        <textarea id="noticeContent" placeholder="Notice content..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; min-height: 100px; resize: vertical;"></textarea>
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Category</label>
        <select id="noticeCategory" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
          <option value="notice">General Notice</option>
          <option value="rule">Rule & Regulation</option>
          <option value="circular">Circular</option>
        </select>
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Attachment (PDF/DOC)</label>
        <input type="file" id="noticeAttachment" accept=".pdf,.doc,.docx" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="checkbox" id="noticePinned">
          <label style="margin: 0; font-weight: 600;">Pin Important</label>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="checkbox" id="noticeActive" checked>
          <label style="margin: 0; font-weight: 600;">Active</label>
        </div>
      </div>
      
      <button type="submit" style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Add Notice</button>
      <button type="button" id="noticeFormCancel" style="display: none; padding: 0.75rem 1.5rem; background: var(--text-secondary); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Cancel</button>
    </form>
    
    <div id="noticeList" style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; overflow-x: auto;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Hostel Notices</h5>
      <div id="noticeContent" style="min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Loading...</div>
    </div>
  `;
  
  document.getElementById('hostelNoticesManager').innerHTML = html;
  
  document.getElementById('noticeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('noticeEditId').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('noticeTitle').value);
    formData.append('content', document.getElementById('noticeContent').value);
    formData.append('category', document.getElementById('noticeCategory').value);
    formData.append('pinned', document.getElementById('noticePinned').checked ? '1' : '0');
    formData.append('active', document.getElementById('noticeActive').checked ? '1' : '0');
    
    const attachmentFile = document.getElementById('noticeAttachment').files[0];
    if (attachmentFile) formData.append('attachment', attachmentFile);
    
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${baseUrl}/hostel/notices/${editId}` : `${baseUrl}/hostel/notices`;
    
    const res = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!res.ok) {
      showAlert('Failed to save notice', 'danger');
      return;
    }
    
    showAlert(editId ? 'Notice updated' : 'Notice added');
    document.getElementById('noticeForm').reset();
    document.getElementById('noticeEditId').value = '';
    document.getElementById('noticeFormCancel').style.display = 'none';
    await loadHostelNoticesData();
  });
  
  document.getElementById('noticeFormCancel').addEventListener('click', () => {
    document.getElementById('noticeForm').reset();
    document.getElementById('noticeEditId').value = '';
    document.getElementById('noticeFormCancel').style.display = 'none';
  });
  
  await loadHostelNoticesData();
}

async function loadHostelNoticesData() {
  const res = await fetch(`${baseUrl}/hostel/notices/all`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load notices', 'danger');
    return;
  }
  const notices = await res.json();
  
  const html = notices.length === 0 ? '<div style="padding:1rem; color:var(--text-secondary)">No notices yet.</div>' : `
    <table style="width: 100%; border-collapse: collapse;">
      <thead style="border-bottom: 2px solid var(--border);">
        <tr>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Title</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Category</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Status</th>
          <th style="padding: 1rem; text-align: center; font-weight: 700;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${notices.map(n => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem;">${n.title} ${n.pinned ? '📌' : ''}</td>
            <td style="padding: 1rem; color: var(--text-secondary);">${n.category}</td>
            <td style="padding: 1rem;">
              <span style="padding: 0.25rem 0.75rem; background: ${n.active ? 'var(--success-light)' : 'var(--danger-light)'}; color: ${n.active ? 'var(--success)' : 'var(--danger)'}; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;">
                ${n.active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td style="padding: 1rem; text-align: center;">
              <button onclick="editNotice('${n.id}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; margin-right: 0.5rem;">Edit</button>
              <button onclick="deleteNotice('${n.id}')" style="padding: 0.5rem 1rem; background: var(--danger); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  document.getElementById('noticeContent').innerHTML = html;
}

async function editNotice(id) {
  const res = await fetch(`${baseUrl}/hostel/notices/${id}`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load notice', 'danger');
    return;
  }
  const notice = await res.json();
  
  document.getElementById('noticeEditId').value = id;
  document.getElementById('noticeTitle').value = notice.title;
  document.getElementById('noticeContent').value = notice.content;
  document.getElementById('noticeCategory').value = notice.category || 'notice';
  document.getElementById('noticePinned').checked = notice.pinned || false;
  document.getElementById('noticeActive').checked = notice.active !== false;
  document.getElementById('noticeFormCancel').style.display = 'block';
  document.getElementById('noticeTitle').focus();
}

async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  const res = await fetch(`${baseUrl}/hostel/notices/${id}`, { method: 'DELETE', headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to delete notice', 'danger');
    return;
  }
  showAlert('Notice deleted');
  await loadHostelNoticesData();
}

// ==================== HOSTEL GALLERY MANAGER ====================
async function loadHostelGalleryManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navHostelGallery').classList.add('active');
  
  const panelTitle = document.getElementById('panelTitle');
  panelTitle.textContent = 'Manage Hostel Gallery';
  
  const manager = document.getElementById('hostelGalleryManager');
  manager.classList.remove('d-none');
  document.querySelectorAll('[id$="Manager"]:not(#hostelGalleryManager)').forEach(el => el.classList.add('d-none'));

  const html = `
    <form id="galleryForm" style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
      <input type="hidden" id="galleryEditId" value="">
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Title</label>
        <input type="text" id="galleryTitle" placeholder="e.g., Main Hostel Building" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Caption</label>
        <input type="text" id="galleryCaption" placeholder="Short description..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Category</label>
        <select id="galleryCategory" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
          <option value="hostel-life">Hostel Life</option>
          <option value="rooms">Rooms</option>
          <option value="dining-hall">Dining Hall</option>
          <option value="study-areas">Study Areas</option>
          <option value="activities">Activities</option>
          <option value="celebrations">Celebrations</option>
        </select>
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Media Type</label>
        <select id="galleryMediaType" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Media File (Image/Video)</label>
        <input type="file" id="galleryMedia" accept="image/*,video/*" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div>
        <label style="display: block; font-weight: 700; margin-bottom: 0.5rem;">Order</label>
        <input type="number" id="galleryOrder" value="0" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      </div>
      
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="checkbox" id="galleryFeatured">
          <label style="margin: 0; font-weight: 600;">Featured</label>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="checkbox" id="galleryActive" checked>
          <label style="margin: 0; font-weight: 600;">Active</label>
        </div>
      </div>
      
      <button type="submit" style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Upload to Gallery</button>
      <button type="button" id="galleryFormCancel" style="display: none; padding: 0.75rem 1.5rem; background: var(--text-secondary); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">Cancel</button>
    </form>
    
    <div id="galleryList" style="background: var(--card-bg); border-radius: 0.875rem; border: 1px solid var(--border); padding: 1.5rem; overflow-x: auto;">
      <h5 style="margin-bottom: 1rem; font-weight: 700;">Hostel Gallery</h5>
      <div id="galleryContent" style="min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">Loading...</div>
    </div>
  `;
  
  document.getElementById('hostelGalleryManager').innerHTML = html;
  
  document.getElementById('galleryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('galleryEditId').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('galleryTitle').value);
    formData.append('caption', document.getElementById('galleryCaption').value);
    formData.append('category', document.getElementById('galleryCategory').value);
    formData.append('media_type', document.getElementById('galleryMediaType').value);
    formData.append('featured', document.getElementById('galleryFeatured').checked ? 'true' : 'false');
    formData.append('order', document.getElementById('galleryOrder').value);
    formData.append('active', document.getElementById('galleryActive').checked ? 'true' : 'false');
    
    const mediaFile = document.getElementById('galleryMedia').files[0];
    if (mediaFile) formData.append('media', mediaFile);
    
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${baseUrl}/hostel/gallery/${editId}` : `${baseUrl}/hostel/gallery`;
    
    const res = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!res.ok) {
      showAlert('Failed to save gallery item', 'danger');
      return;
    }
    
    showAlert(editId ? 'Gallery item updated' : 'Gallery item added');
    document.getElementById('galleryForm').reset();
    document.getElementById('galleryEditId').value = '';
    document.getElementById('galleryFormCancel').style.display = 'none';
    await loadHostelGalleryData();
  });
  
  document.getElementById('galleryFormCancel').addEventListener('click', () => {
    document.getElementById('galleryForm').reset();
    document.getElementById('galleryEditId').value = '';
    document.getElementById('galleryFormCancel').style.display = 'none';
  });
  
  await loadHostelGalleryData();
}

async function loadHostelGalleryData() {
  const res = await fetch(`${baseUrl}/hostel/gallery/all`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load gallery', 'danger');
    return;
  }
  const items = await res.json();
  
  const html = items.length === 0 ? '<div style="padding:1rem; color:var(--text-secondary)">No gallery items yet.</div>' : `
    <table style="width: 100%; border-collapse: collapse;">
      <thead style="border-bottom: 2px solid var(--border);">
        <tr>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Title</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Category</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Type</th>
          <th style="padding: 1rem; text-align: left; font-weight: 700;">Status</th>
          <th style="padding: 1rem; text-align: center; font-weight: 700;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1rem;">${item.title} ${item.featured ? '⭐' : ''}</td>
            <td style="padding: 1rem; color: var(--text-secondary);">${item.category}</td>
            <td style="padding: 1rem; font-size: 0.875rem;">${item.media_type}</td>
            <td style="padding: 1rem;">
              <span style="padding: 0.25rem 0.75rem; background: ${item.active ? 'var(--success-light)' : 'var(--danger-light)'}; color: ${item.active ? 'var(--success)' : 'var(--danger)'}; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;">
                ${item.active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td style="padding: 1rem; text-align: center;">
              <button onclick="editGalleryItem('${item.id}')" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; margin-right: 0.5rem;">Edit</button>
              <button onclick="deleteGalleryItem('${item.id}')" style="padding: 0.5rem 1rem; background: var(--danger); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  document.getElementById('galleryContent').innerHTML = html;
}

async function editGalleryItem(id) {
  const res = await fetch(`${baseUrl}/hostel/gallery/${id}`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to load gallery item', 'danger');
    return;
  }
  const item = await res.json();
  
  document.getElementById('galleryEditId').value = id;
  document.getElementById('galleryTitle').value = item.title;
  document.getElementById('galleryCaption').value = item.caption || '';
  document.getElementById('galleryCategory').value = item.category || 'hostel-life';
  document.getElementById('galleryMediaType').value = item.media_type || 'image';
  document.getElementById('galleryFeatured').checked = item.featured || false;
  document.getElementById('galleryOrder').value = item.order || 0;
  document.getElementById('galleryActive').checked = item.active !== false;
  document.getElementById('galleryFormCancel').style.display = 'block';
  document.getElementById('galleryTitle').focus();
}

async function deleteGalleryItem(id) {
  if (!confirm('Delete this gallery item?')) return;
  const res = await fetch(`${baseUrl}/hostel/gallery/${id}`, { method: 'DELETE', headers: {'Authorization': 'Bearer ' + token} });
  if (!res.ok) {
    showAlert('Failed to delete gallery item', 'danger');
    return;
  }
  showAlert('Gallery item deleted');
  await loadHostelGalleryData();
}

// ==================== CAMPUS GALLERY MANAGER ====================
const campusGalleryCategoryOptions = ['sports', 'medical facilities', 'library', 'hostel', 'lab'];

function campusGalleryCategoryLabel(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

async function loadCampusGalleryManager() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.getElementById('navCampusGallery').classList.add('active');

  const panelTitle = document.getElementById('panelTitle');
  panelTitle.textContent = 'Manage Campus Gallery';

  const manager = document.getElementById('campusGalleryManager');
  manager.classList.remove('d-none');
  document.querySelectorAll('[id$="Manager"]:not(#campusGalleryManager)').forEach(el => el.classList.add('d-none'));

  const html = `
    <form id="campusGalleryForm" style="display:grid; gap:1.25rem; margin-bottom:2rem;">
      <input type="hidden" id="campusGalleryEditId" value="">
      <div style="display:grid; gap:1.25rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <div>
          <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Title</label>
          <input type="text" id="campusGalleryTitle" placeholder="e.g., Science Lab Block" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
        </div>
        <div>
          <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Category</label>
          <input type="text" id="campusGalleryCategory" list="campusGalleryCategoryList" placeholder="sports, medical facilities, library..." style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
          <datalist id="campusGalleryCategoryList">
            ${campusGalleryCategoryOptions.map(category => `<option value="${category}"></option>`).join('')}
          </datalist>
        </div>
      </div>
      <div>
        <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Short Description</label>
        <textarea id="campusGalleryDescription" rows="3" placeholder="A brief caption or description for the image..." style="width:100%; padding:0.85rem; border:1px solid var(--border); border-radius:0.5rem; resize:vertical;"></textarea>
      </div>
      <div style="display:grid; gap:1.25rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); align-items:end;">
        <div>
          <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Upload Image</label>
          <input type="file" id="campusGalleryImage" accept="image/*" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem; background:var(--card-bg);">
        </div>
        <div>
          <label style="display:block; font-weight:700; margin-bottom:0.5rem;">Display Order</label>
          <input type="number" id="campusGalleryOrder" value="0" min="0" style="width:100%; padding:0.75rem; border:1px solid var(--border); border-radius:0.5rem;">
        </div>
      </div>
      <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
        <label style="display:flex; gap:0.5rem; align-items:center; font-weight:600; margin:0;">
          <input type="checkbox" id="campusGalleryActive" checked>
          Active
        </label>
        <button type="submit" style="padding:0.75rem 1.5rem; background:var(--primary); color:white; border:none; border-radius:0.5rem; cursor:pointer; font-weight:600;">Save Gallery Item</button>
        <button type="button" id="campusGalleryCancel" style="display:none; padding:0.75rem 1.5rem; background:var(--text-secondary); color:white; border:none; border-radius:0.5rem; cursor:pointer; font-weight:600;">Cancel Edit</button>
      </div>
    </form>
    <div id="campusGalleryTableWrap" style="background:var(--card-bg); border:1px solid var(--border); border-radius:0.875rem; padding:1.5rem; overflow-x:auto;">
      <div style="display:flex; justify-content:space-between; gap:1rem; align-items:center; margin-bottom:1rem; flex-wrap:wrap;">
        <h5 style="margin:0; font-weight:700;">Campus Life Gallery</h5>
        <span style="color:var(--text-secondary); font-size:0.875rem;">Use the order field to rearrange the public grid.</span>
      </div>
      <div id="campusGalleryContent" style="min-height:200px; display:flex; align-items:center; justify-content:center; color:var(--text-secondary);">Loading...</div>
    </div>
  `;

  manager.innerHTML = html;

  document.getElementById('campusGalleryForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const editId = document.getElementById('campusGalleryEditId').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('campusGalleryTitle').value);
    formData.append('description', document.getElementById('campusGalleryDescription').value);
    formData.append('category', document.getElementById('campusGalleryCategory').value);
    formData.append('order', document.getElementById('campusGalleryOrder').value || '0');
    formData.append('active', document.getElementById('campusGalleryActive').checked ? 'true' : 'false');

    const imageFile = document.getElementById('campusGalleryImage').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${baseUrl}/campus/gallery/${editId}` : `${baseUrl}/campus/gallery`;
    const response = await fetch(url, { method, headers: {'Authorization': 'Bearer ' + token}, body: formData });
    if (!response.ok) {
      showAlert('Failed to save campus gallery item', 'danger');
      return;
    }

    showAlert(editId ? 'Campus gallery item updated' : 'Campus gallery item added');
    document.getElementById('campusGalleryForm').reset();
    document.getElementById('campusGalleryEditId').value = '';
    document.getElementById('campusGalleryActive').checked = true;
    document.getElementById('campusGalleryCancel').style.display = 'none';
    await loadCampusGalleryData();
  });

  document.getElementById('campusGalleryCancel').addEventListener('click', () => {
    document.getElementById('campusGalleryForm').reset();
    document.getElementById('campusGalleryEditId').value = '';
    document.getElementById('campusGalleryActive').checked = true;
    document.getElementById('campusGalleryCancel').style.display = 'none';
  });

  await loadCampusGalleryData();
}

async function loadCampusGalleryData() {
  const response = await fetch(`${baseUrl}/campus/gallery/all`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!response.ok) {
    showAlert('Failed to load campus gallery', 'danger');
    return;
  }

  const items = await response.json();
  const html = items.length === 0 ? '<div style="padding:1rem; color:var(--text-secondary)">No campus gallery items yet.</div>' : `
    <table style="width:100%; border-collapse:collapse;">
      <thead style="border-bottom:2px solid var(--border);">
        <tr>
          <th style="padding:1rem; text-align:left; font-weight:700;">Image</th>
          <th style="padding:1rem; text-align:left; font-weight:700;">Title</th>
          <th style="padding:1rem; text-align:left; font-weight:700;">Category</th>
          <th style="padding:1rem; text-align:left; font-weight:700;">Order</th>
          <th style="padding:1rem; text-align:left; font-weight:700;">Status</th>
          <th style="padding:1rem; text-align:center; font-weight:700;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:1rem; width:110px;">
              <img src="${item.image_url || 'images/logo_emrs.jpg'}" alt="${item.title || 'Campus gallery item'}" loading="lazy" style="width:88px; height:66px; object-fit:cover; border-radius:0.5rem; border:1px solid var(--border);">
            </td>
            <td style="padding:1rem; font-weight:600;">${item.title || '-'}</td>
            <td style="padding:1rem; color:var(--text-secondary);">${campusGalleryCategoryLabel(item.category)}</td>
            <td style="padding:1rem;">${item.order ?? 0}</td>
            <td style="padding:1rem;">
              <span style="display:inline-block; padding:0.25rem 0.75rem; background:${item.active ? 'var(--success-light)' : 'var(--danger-light)'}; color:${item.active ? 'var(--success)' : 'var(--danger)'}; border-radius:0.375rem; font-size:0.8125rem; font-weight:600;">${item.active ? 'Active' : 'Inactive'}</span>
            </td>
            <td style="padding:1rem; text-align:center; white-space:nowrap;">
              <button class='btn btn-sm btn-primary' onclick='editCampusGalleryItem("${item.id}")'><i class="fas fa-edit"></i></button>
              <button class='btn btn-sm btn-danger' onclick='deleteCampusGalleryItem("${item.id}")'><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('campusGalleryContent').innerHTML = html;
}

async function editCampusGalleryItem(id) {
  const response = await fetch(`${baseUrl}/campus/gallery/${id}`, { headers: {'Authorization': 'Bearer ' + token} });
  if (!response.ok) {
    showAlert('Failed to load campus gallery item', 'danger');
    return;
  }

  const item = await response.json();
  document.getElementById('campusGalleryEditId').value = id;
  document.getElementById('campusGalleryTitle').value = item.title || '';
  document.getElementById('campusGalleryDescription').value = item.description || '';
  document.getElementById('campusGalleryCategory').value = item.category || 'general';
  document.getElementById('campusGalleryOrder').value = item.order || 0;
  document.getElementById('campusGalleryActive').checked = item.active !== false;
  document.getElementById('campusGalleryCancel').style.display = 'inline-flex';
  document.getElementById('campusGalleryTitle').focus();
}

let currentAdmissionsFilter = 'All';
let cachedAdmissions = [];

async function loadAdmissionsManager(statusFilter) {
  currentAdmissionsFilter = statusFilter || 'All';
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  const activeId = `navAdmissions${currentAdmissionsFilter}`;
  if (document.getElementById(activeId)) {
    document.getElementById(activeId).classList.add('active');
  }
  panelTitle.textContent = `Manage Admissions - ${currentAdmissionsFilter}`;
  hideAllManagers();
  admissionsManager.classList.remove('d-none');
  
  // Set up container markup on first load
  admissionsManager.innerHTML = `
    <!-- KPI CARDS -->
    <div class="row g-3 mb-4" id="admKpiCards">
      <div class="col-md-3">
        <div class="card card-accent p-3 d-flex flex-column align-items-center justify-content-center text-center">
          <h6 class="text-muted mb-1">Total Applications</h6>
          <h2 class="mb-0" id="kpiTotal">-</h2>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card p-3 d-flex flex-column align-items-center justify-content-center text-center border-left" style="border-left: 4px solid #f59e0b !important;">
          <h6 class="text-muted mb-1">Pending</h6>
          <h2 class="mb-0 text-warning" id="kpiPending">-</h2>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card p-3 d-flex flex-column align-items-center justify-content-center text-center border-left" style="border-left: 4px solid #10b981 !important;">
          <h6 class="text-muted mb-1">Approved</h6>
          <h2 class="mb-0 text-success" id="kpiApproved">-</h2>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card p-3 d-flex flex-column align-items-center justify-content-center text-center border-left" style="border-left: 4px solid #ef4444 !important;">
          <h6 class="text-muted mb-1">Rejected</h6>
          <h2 class="mb-0 text-danger" id="kpiRejected">-</h2>
        </div>
      </div>
    </div>

    <!-- FILTERS AND CONTROLS -->
    <div class="card p-3 mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label" style="font-size:0.8rem; font-weight:600;">Search Keyword</label>
          <input type="text" id="admSearch" class="form-control" placeholder="Name, App No, Email..." oninput="triggerAdmissionsSearch()">
        </div>
        <div class="col-md-2">
          <label class="form-label" style="font-size:0.8rem; font-weight:600;">Class Filter</label>
          <select id="admClassFilter" class="form-select" onchange="triggerAdmissionsSearch()">
            <option value="All">All Classes</option>
            <option value="6">Class 6</option>
            <option value="7">Class 7</option>
            <option value="8">Class 8</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label" style="font-size:0.8rem; font-weight:600;">Date Submitted</label>
          <input type="date" id="admDateFilter" class="form-control" onchange="triggerAdmissionsSearch()">
        </div>
        <div class="col-md-5 d-flex gap-2">
          <button class="btn btn-secondary flex-grow-1" onclick="resetAdmissionsFilters()"><i class="fas fa-undo"></i> Reset</button>
          <button class="btn btn-primary flex-grow-1" onclick="exportAdmissionsExcel()"><i class="fas fa-file-excel"></i> Export Excel</button>
        </div>
      </div>
    </div>

    <!-- APPLICATIONS TABLE -->
    <div class="card p-0 mb-4" style="overflow-x: auto;">
      <table class="table table-hover mb-0" id="admTable">
        <thead class="bg-light">
          <tr>
            <th class="px-3 py-2">Application No</th>
            <th class="px-3 py-2">Student Name</th>
            <th class="px-3 py-2">Class</th>
            <th class="px-3 py-2">Father Name</th>
            <th class="px-3 py-2">Email</th>
            <th class="px-3 py-2">Date Submitted</th>
            <th class="px-3 py-2">Status</th>
            <th class="px-3 py-2 text-end">Actions</th>
          </tr>
        </thead>
        <tbody id="admTableBody">
          <tr>
            <td colspan="8" class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin"></i> Loading applications...</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- DETAILS MODAL (HIDDEN BY DEFAULT) -->
    <div id="admDetailModalOverlay" class="d-none" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); z-index:1050; display:flex; justify-content:center; align-items:center; padding: 20px;">
      <div class="card p-0" style="width:100%; max-width:850px; max-height:90vh; overflow-y:auto; border-radius:10px; background:white; display:flex; flex-direction:column;">
        <div class="modal-header px-4 py-3 bg-light d-flex justify-content-between align-items-center" style="border-bottom:1px solid #e2e8f0;">
          <h5 class="mb-0 text-primary" style="font-weight:700;"><i class="fas fa-file-alt"></i> Application Details</h5>
          <button class="btn-close border-0 bg-transparent text-muted" style="font-size:1.5rem;" onclick="closeAdmissionDetailModal()">&times;</button>
        </div>
        <div class="modal-body p-4" id="admModalBodyContent">
          <!-- Populated by JavaScript -->
        </div>
      </div>
    </div>
  `;
  
  await fetchAdmissionsData();
}

async function fetchAdmissionsData() {
  const tableBody = document.getElementById('admTableBody');
  if (!tableBody) return;
  
  try {
    // 1. Fetch KPI Totals (Global)
    const kpiRes = await fetch(`${baseUrl}/admin/admissions`, {
      headers: {'Authorization': 'Bearer ' + token}
    });
    
    if (kpiRes.ok) {
      const allItems = await kpiRes.json();
      document.getElementById('kpiTotal').textContent = allItems.length;
      document.getElementById('kpiPending').textContent = allItems.filter(x => x.status === 'Pending').length;
      document.getElementById('kpiApproved').textContent = allItems.filter(x => x.status === 'Approved').length;
      document.getElementById('kpiRejected').textContent = allItems.filter(x => x.status === 'Rejected').length;
    }
    
    // 2. Fetch Filtered Table Data
    const searchVal = document.getElementById('admSearch').value.trim();
    const classVal = document.getElementById('admClassFilter').value;
    const dateVal = document.getElementById('admDateFilter').value;
    
    const filterUrl = `${baseUrl}/admin/admissions?status=${currentAdmissionsFilter}&classApplying=${classVal}&date=${dateVal}&search=${searchVal}`;
    const res = await fetch(filterUrl, {
      headers: {'Authorization': 'Bearer ' + token}
    });
    
    if (!res.ok) {
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle"></i> Failed to retrieve admissions data.</td></tr>`;
      return;
    }
    
    cachedAdmissions = await res.json();
    
    if (cachedAdmissions.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No applications found matching the criteria.</td></tr>`;
      return;
    }
    
    tableBody.innerHTML = '';
    cachedAdmissions.forEach(item => {
      const dateObj = new Date(item.submittedAt);
      const dateStr = dateObj.toLocaleDateString('en-IN');
      
      let badgeClass = 'status-pending';
      if (item.status === 'Approved') badgeClass = 'status-approved';
      else if (item.status === 'Rejected') badgeClass = 'status-rejected';
      else if (item.status === 'Under Review') badgeClass = 'status-review';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-3 py-2"><a href="javascript:void(0)" onclick="openAdmissionDetailModal('${item.id}')" style="font-weight:700; text-decoration:none;">${item.applicationNo}</a></td>
        <td class="px-3 py-2"><b>${item.studentName}</b></td>
        <td class="px-3 py-2">Class ${item.classApplying}</td>
        <td class="px-3 py-2">${item.fatherName}</td>
        <td class="px-3 py-2">${item.email || 'N/A'}</td>
        <td class="px-3 py-2">${dateStr}</td>
        <td class="px-3 py-2"><span class="status-badge ${badgeClass}" style="padding: 3px 10px; font-size: 0.75rem;">${item.status}</span></td>
        <td class="px-3 py-2 text-end">
          <div class="d-flex gap-1 justify-content-end">
            <button class="btn btn-light btn-sm text-primary py-0 px-2" title="View details" onclick="openAdmissionDetailModal('${item.id}')"><i class="fas fa-eye"></i></button>
            ${item.status !== 'Approved' ? `<button class="btn btn-light btn-sm text-success py-0 px-2" title="Approve" onclick="approveAdmission('${item.id}')"><i class="fas fa-check"></i></button>` : ''}
            ${item.status !== 'Rejected' ? `<button class="btn btn-light btn-sm text-warning py-0 px-2" title="Reject" onclick="rejectAdmission('${item.id}')"><i class="fas fa-times"></i></button>` : ''}
            <button class="btn btn-light btn-sm text-danger py-0 px-2" title="Delete" onclick="deleteAdmission('${item.id}')"><i class="fas fa-trash"></i></button>
            <button class="btn btn-light btn-sm text-info py-0 px-2" title="Download Form PDF" onclick="downloadAdmissionPdf('${item.applicationNo}')"><i class="fas fa-file-pdf"></i></button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle"></i> Server communication error.</td></tr>`;
  }
}

let searchTimeout;
function triggerAdmissionsSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchAdmissionsData();
  }, 300);
}

function resetAdmissionsFilters() {
  document.getElementById('admSearch').value = '';
  document.getElementById('admClassFilter').value = 'All';
  document.getElementById('admDateFilter').value = '';
  fetchAdmissionsData();
}

function exportAdmissionsExcel() {
  const searchVal = document.getElementById('admSearch').value.trim();
  const classVal = document.getElementById('admClassFilter').value;
  const dateVal = document.getElementById('admDateFilter').value;
  
  const query = `status=${currentAdmissionsFilter}&classApplying=${classVal}&date=${dateVal}&search=${searchVal}`;
  downloadAuthenticatedFile(`${baseUrl}/admin/admissions/export/excel?${query}`, 'admissions.xlsx');
}

function downloadAdmissionPdf(appNo) {
  window.open(`${baseUrl}/admissions/${appNo}/pdf`, '_blank');
}

async function openAdmissionDetailModal(id) {
  const modal = document.getElementById('admDetailModalOverlay');
  const modalBody = document.getElementById('admModalBodyContent');
  modalBody.innerHTML = `<div class="text-center py-5 text-muted"><i class="fas fa-spinner fa-spin fa-2x"></i> Fetching detail records...</div>`;
  modal.classList.remove('d-none');
  
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/${id}`, {
      headers: {'Authorization': 'Bearer ' + token}
    });
    if (!res.ok) {
      modalBody.innerHTML = `<div class="alert alert-danger">Error: Unable to fetch details.</div>`;
      return;
    }
    
    const app = await res.json();
    
    let badgeClass = 'status-pending';
    if (app.status === 'Approved') badgeClass = 'status-approved';
    else if (app.status === 'Rejected') badgeClass = 'status-rejected';
    else if (app.status === 'Under Review') badgeClass = 'status-review';

    // Build files previews dynamically
    let docPreviewsHtml = '';
    const docs = app.documents;
    
    for (let key in docs) {
      const relPath = docs[key];
      if (relPath) {
        const fileExt = relPath.split('.').pop().toLowerCase();
        const docLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const fullFileUrl = `${mediaBaseUrl}${relPath}`;
        
        let previewEl = '';
        if (fileExt === 'pdf') {
          previewEl = `<iframe src="${fullFileUrl}" style="width:100%; height:250px; border:1px solid #cbd5e1; border-radius:4px;"></iframe>`;
        } else {
          previewEl = `<img src="${fullFileUrl}" style="max-width:100%; max-height:220px; border:1px solid #cbd5e1; border-radius:4px; object-fit:contain;">`;
        }
        
        docPreviewsHtml += `
          <div class="col-md-6 mb-4">
            <div class="card p-2 h-100 bg-light">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="font-weight-bold" style="font-size:0.85rem; color:#334155;">${docLabel}</span>
                <a href="${fullFileUrl}" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size:0.75rem;"><i class="fas fa-download"></i> Download</a>
              </div>
              <div class="text-center d-flex justify-content-center align-items-center" style="min-height:120px;">
                ${previewEl}
              </div>
            </div>
          </div>
        `;
      }
    }

    modalBody.innerHTML = `
      <div class="row mb-4">
        <div class="col-md-3 text-center mb-3">
          <img src="${mediaBaseUrl}${app.documents.photo}" style="width:120px; height:140px; border-radius:6px; border:1px solid #cbd5e1; object-fit:cover; margin-bottom:10px;">
          <h5 class="mb-1">${app.studentName}</h5>
          <span class="status-badge ${badgeClass}">${app.status}</span>
        </div>
        <div class="col-md-9">
          <h6 class="text-primary border-bottom pb-1 mb-2"><i class="fas fa-info-circle"></i> Application Header</h6>
          <table class="table table-sm table-bordered">
            <tbody>
              <tr><th width="30%">Application No</th><td><b>${app.applicationNo}</b></td></tr>
              <tr><th>Class Applied For</th><td>Class ${app.classApplying}</td></tr>
              <tr><th>Aadhaar Number</th><td>${app.aadhaar || 'N/A'}</td></tr>
              <tr><th>Submission Date</th><td>${new Date(app.submittedAt).toLocaleString('en-IN')}</td></tr>
              <tr><th>Official Remarks</th><td class="text-danger font-weight-bold">${app.remarks || 'None'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <h6 class="text-primary border-bottom pb-1 mb-2"><i class="fas fa-user-circle"></i> Student & Parent Details</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <table class="table table-sm table-striped">
            <tbody>
              <tr><th width="40%">Student Name</th><td>${app.studentName}</td></tr>
              <tr><th>Gender</th><td>${app.gender}</td></tr>
              <tr><th>Date of Birth</th><td>${app.dob}</td></tr>
              <tr><th>Category</th><td>${app.category}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="col-md-6">
          <table class="table table-sm table-striped">
            <tbody>
              <tr><th width="40%">Father Name</th><td>${app.fatherName}</td></tr>
              <tr><th>Mother Name</th><td>${app.motherName}</td></tr>
              <tr><th>Occupation</th><td>${app.occupation || 'N/A'}</td></tr>
              <tr><th>Annual Income</th><td>INR ${app.annualIncome || 'N/A'}</td></tr>
              <tr><th>Mobile No</th><td>${app.mobile}</td></tr>
              <tr><th>Email ID</th><td>${app.email || 'N/A'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <h6 class="text-primary border-bottom pb-1 mb-2"><i class="fas fa-map-marker-alt"></i> Address Information</h6>
      <table class="table table-sm table-bordered mb-4">
        <tbody>
          <tr><th width="20%">State / District</th><td>${app.address.state} / ${app.address.district}</td></tr>
          <tr><th>Village / Town</th><td>${app.address.village}</td></tr>
          <tr><th>Pincode</th><td>${app.address.pincode}</td></tr>
          <tr><th>Full Address</th><td>${app.address.fullAddress}</td></tr>
        </tbody>
      </table>

      <h6 class="text-primary border-bottom pb-1 mb-2"><i class="fas fa-graduation-cap"></i> Academic Details</h6>
      <table class="table table-sm table-striped mb-4 text-center">
        <thead class="bg-light">
          <tr>
            <th>Previous School</th>
            <th>Last Class Passed</th>
            <th>Board</th>
            <th>Percentage</th>
            <th>Year of Passing</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${app.academic.previousSchool || 'N/A'}</td>
            <td>${app.academic.lastClass || 'N/A'}</td>
            <td>${app.academic.board || 'N/A'}</td>
            <td>${app.academic.percentage || 'N/A'}</td>
            <td>${app.academic.passingYear || 'N/A'}</td>
          </tr>
        </tbody>
      </table>

      <h6 class="text-primary border-bottom pb-1 mb-3"><i class="fas fa-paperclip"></i> Uploaded Documents & Previews</h6>
      <div class="row">
        ${docPreviewsHtml}
      </div>

      <!-- Action Panel -->
      <div class="border-top pt-3 mt-4">
        <h6 class="text-primary mb-3" style="font-weight:700;"><i class="fas fa-edit"></i> Update Application Status</h6>
        <div class="bg-light p-3 rounded border">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label font-weight-bold mb-1" style="font-size:0.8rem; font-weight:600;">Select Status</label>
              <select id="updateStatusSelect" class="form-select form-select-sm" required>
                <option value="Submitted" ${app.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
                <option value="Under Review" ${app.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                <option value="Documents Pending" ${app.status === 'Documents Pending' ? 'selected' : ''}>Documents Pending</option>
                <option value="Documents Verified" ${app.status === 'Documents Verified' ? 'selected' : ''}>Documents Verified</option>
                <option value="Approved" ${app.status === 'Approved' ? 'selected' : ''}>Approved</option>
                <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                <option value="Admission Confirmed" ${app.status === 'Admission Confirmed' ? 'selected' : ''}>Admission Confirmed</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label font-weight-bold mb-1" style="font-size:0.8rem; font-weight:600;">Remarks (Email Update)</label>
              <input type="text" id="updateStatusRemarks" class="form-control form-control-sm" placeholder="Enter status remarks..." value="${app.remarks || ''}">
            </div>
            <div class="col-md-4">
              <label class="form-label font-weight-bold mb-1" style="font-size:0.8rem; font-weight:600;">Next Instructions</label>
              <input type="text" id="updateStatusInstructions" class="form-control form-control-sm" placeholder="Next steps for candidate..." value="">
            </div>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button type="button" class="btn btn-secondary btn-sm" onclick="closeAdmissionDetailModal()">Close</button>
            <button type="button" class="btn btn-info btn-sm text-white" onclick="downloadAdmissionPdf('${app.applicationNo}')"><i class="fas fa-file-pdf"></i> Download PDF</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="submitStatusUpdate('${app.id}')"><i class="fas fa-save"></i> Save Status</button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    modalBody.innerHTML = `<div class="alert alert-danger">Error fetching application record details.</div>`;
  }
}

function closeAdmissionDetailModal() {
  document.getElementById('admDetailModalOverlay').classList.add('d-none');
}

async function submitStatusUpdate(id) {
  const status = document.getElementById('updateStatusSelect').value;
  const remarks = document.getElementById('updateStatusRemarks').value.trim();
  const nextInstructions = document.getElementById('updateStatusInstructions').value.trim();
  
  const formData = new FormData();
  formData.append('status', status);
  formData.append('remarks', remarks);
  formData.append('nextInstructions', nextInstructions);
  
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      body: formData
    });
    
    if (res.ok) {
      showAlert('Application status updated and notification queued successfully!');
      closeAdmissionDetailModal();
      fetchAdmissionsData();
    } else {
      const data = await res.json();
      showAlert(data.detail || 'Status update failed.', 'danger');
    }
  } catch (err) {
    showAlert('Server connection error.', 'danger');
  }
}

async function loadAdmissionsAnalytics() {
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  const activeId = `navAdmissionsAnalytics`;
  if (document.getElementById(activeId)) {
    document.getElementById(activeId).classList.add('active');
  }
  panelTitle.textContent = `Admissions Analytics & Reports`;
  hideAllManagers();
  admissionsManager.classList.remove('d-none');
  
  admissionsManager.innerHTML = `
    <div class="text-center py-5 text-muted"><i class="fas fa-spinner fa-spin fa-2x"></i> Compiling analytics metrics...</div>
  `;
  
  try {
    const res = await fetch(`${baseUrl}/admin/admissions`, {
      headers: {'Authorization': 'Bearer ' + token}
    });
    
    if (!res.ok) {
      admissionsManager.innerHTML = `<div class="alert alert-danger">Failed to load admissions data.</div>`;
      return;
    }
    
    const apps = await res.json();
    const total = apps.length;
    
    if (total === 0) {
      admissionsManager.innerHTML = `
        <div class="alert alert-info">No applications submitted yet. Analytics will be available once applications are received.</div>
      `;
      return;
    }
    
    const approved = apps.filter(x => x.status === 'Approved').length;
    const rejected = apps.filter(x => x.status === 'Rejected').length;
    const pending = apps.filter(x => x.status === 'Pending').length;
    
    const approvedRate = ((approved / total) * 100).toFixed(1);
    const rejectedRate = ((rejected / total) * 100).toFixed(1);
    const pendingRate = ((pending / total) * 100).toFixed(1);
    
    const classCounts = {};
    const genderCounts = {};
    const categoryCounts = {};
    const monthCounts = {};
    
    const classesList = ["VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    classesList.forEach(c => classCounts[c] = 0);
    
    apps.forEach(item => {
      const cls = item.classApplying || 'N/A';
      classCounts[cls] = (classCounts[cls] || 0) + 1;
      
      const gen = item.gender || 'N/A';
      genderCounts[gen] = (genderCounts[gen] || 0) + 1;
      
      const cat = item.category || 'N/A';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      
      if (item.submittedAt) {
        try {
          const date = new Date(item.submittedAt);
          const monthName = date.toLocaleString('default', { month: 'long' });
          monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
        } catch (e) {}
      }
    });
    
    const makeProgressBar = (label, count, total) => {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      return `
        <div class="mb-3">
          <div class="d-flex justify-content-between mb-1" style="font-size: 0.85rem; font-weight: 600;">
            <span class="text-secondary">${label}</span>
            <span class="text-primary">${count} (${percentage}%)</span>
          </div>
          <div class="progress" style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
            <div class="progress-bar bg-primary" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      `;
    };
    
    let classProgressHtml = '';
    classesList.forEach(cls => {
      classProgressHtml += makeProgressBar(`Class ${cls}`, classCounts[cls] || 0, total);
    });
    
    let genderProgressHtml = '';
    const genders = Object.keys(genderCounts).sort();
    genders.forEach(g => {
      genderProgressHtml += makeProgressBar(g, genderCounts[g], total);
    });
    
    let categoryProgressHtml = '';
    const categories = Object.keys(categoryCounts).sort();
    categories.forEach(c => {
      categoryProgressHtml += makeProgressBar(c, categoryCounts[c], total);
    });
    
    let monthProgressHtml = '';
    const months = Object.keys(monthCounts);
    months.forEach(m => {
      monthProgressHtml += makeProgressBar(m, monthCounts[m], total);
    });
    
    admissionsManager.innerHTML = `
      <!-- KPI STATS CARDS -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card p-3 border-left d-flex flex-column align-items-center justify-content-center text-center" style="border-left: 4px solid #0056b3 !important;">
            <h6 class="text-muted mb-1" style="font-size:0.85rem;">Total Applications</h6>
            <h2 class="mb-0 text-primary" style="font-weight:700;">${total}</h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3 border-left d-flex flex-column align-items-center justify-content-center text-center" style="border-left: 4px solid #f59e0b !important;">
            <h6 class="text-muted mb-1" style="font-size:0.85rem;">Pending Ratio</h6>
            <h2 class="mb-0 text-warning" style="font-weight:700;">${pending} <span style="font-size:0.9rem; font-weight:normal;">(${pendingRate}%)</span></h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3 border-left d-flex flex-column align-items-center justify-content-center text-center" style="border-left: 4px solid #10b981 !important;">
            <h6 class="text-muted mb-1" style="font-size:0.85rem;">Approval Rate</h6>
            <h2 class="mb-0 text-success" style="font-weight:700;">${approved} <span style="font-size:0.9rem; font-weight:normal;">(${approvedRate}%)</span></h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3 border-left d-flex flex-column align-items-center justify-content-center text-center" style="border-left: 4px solid #ef4444 !important;">
            <h6 class="text-muted mb-1" style="font-size:0.85rem;">Rejection Rate</h6>
            <h2 class="mb-0 text-danger" style="font-weight:700;">${rejected} <span style="font-size:0.9rem; font-weight:normal;">(${rejectedRate}%)</span></h2>
          </div>
        </div>
      </div>
      
      <!-- GRAPHICAL DISTRIBUTIONS -->
      <div class="row g-4 mb-4">
        <!-- Distribution by Class -->
        <div class="col-md-6">
          <div class="card p-4 h-100 shadow-sm border-0" style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <h5 class="card-title text-primary mb-3" style="font-weight:700;"><i class="fas fa-graduation-cap"></i> Distribution by Class</h5>
            <div>
              ${classProgressHtml}
            </div>
          </div>
        </div>
        
        <!-- Distribution by Gender -->
        <div class="col-md-6">
          <div class="card p-4 h-100 shadow-sm border-0" style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <h5 class="card-title text-primary mb-3" style="font-weight:700;"><i class="fas fa-venus-mars"></i> Distribution by Gender</h5>
            <div>
              ${genderProgressHtml || '<p class="text-muted small">No gender demographics recorded.</p>'}
            </div>
          </div>
        </div>
      </div>
      
      <div class="row g-4">
        <!-- Distribution by Category -->
        <div class="col-md-6">
          <div class="card p-4 h-100 shadow-sm border-0" style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <h5 class="card-title text-primary mb-3" style="font-weight:700;"><i class="fas fa-users"></i> Distribution by Category</h5>
            <div>
              ${categoryProgressHtml || '<p class="text-muted small">No category demographics recorded.</p>'}
            </div>
          </div>
        </div>
        
        <!-- Distribution by Submission Month -->
        <div class="col-md-6">
          <div class="card p-4 h-100 shadow-sm border-0" style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <h5 class="card-title text-primary mb-3" style="font-weight:700;"><i class="fas fa-calendar-alt"></i> Submission Month Timeline</h5>
            <div>
              ${monthProgressHtml || '<p class="text-muted small">No submission timeline recorded.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
    
  } catch (err) {
    console.error(err);
    admissionsManager.innerHTML = `<div class="alert alert-danger">Server communication error. Please try again.</div>`;
  }
}

async function approveAdmission(id, fromModal = false) {
  if (!confirm('Are you sure you want to APPROVE this admission application?')) return;
  
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/${id}/approve`, {
      method: 'PUT',
      headers: {'Authorization': 'Bearer ' + token}
    });
    
    if (res.ok) {
      showAlert('Application approved successfully!');
      if (fromModal) closeAdmissionDetailModal();
      fetchAdmissionsData();
    } else {
      const data = await res.json();
      showAlert(data.detail || 'Approval failed.', 'danger');
    }
  } catch (err) {
    showAlert('Server connection error.', 'danger');
  }
}

async function rejectAdmission(id, fromModal = false) {
  const remarks = prompt('Enter Rejection Remarks / Reasons:');
  if (remarks === null) return; // user cancelled prompt
  
  const formData = new FormData();
  formData.append('remarks', remarks.trim());
  
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/${id}/reject`, {
      method: 'PUT',
      headers: {'Authorization': 'Bearer ' + token},
      body: formData
    });
    
    if (res.ok) {
      showAlert('Application rejected successfully!');
      if (fromModal) closeAdmissionDetailModal();
      fetchAdmissionsData();
    } else {
      const data = await res.json();
      showAlert(data.detail || 'Rejection failed.', 'danger');
    }
  } catch (err) {
    showAlert('Server connection error.', 'danger');
  }
}

async function deleteAdmission(id) {
  if (!confirm('Are you sure you want to permanently DELETE this admission application? This will also remove all uploaded document files from disk. This action is irreversible!')) return;
  
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/${id}`, {
      method: 'DELETE',
      headers: {'Authorization': 'Bearer ' + token}
    });
    
    if (res.ok) {
      showAlert('Application and files deleted.');
      closeAdmissionDetailModal();
      fetchAdmissionsData();
    } else {
      const data = await res.json();
      showAlert(data.detail || 'Delete operation failed.', 'danger');
    }
  } catch (err) {
    showAlert('Server connection error.', 'danger');
  }
}


// =====================================================
// ADMISSION CIRCULARS/NOTICES CRUD
// =====================================================

async function loadAdmissionsCircularsManager() {
  hideAllManagers();
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  if (document.getElementById('navAdmissionsCirculars')) {
    document.getElementById('navAdmissionsCirculars').classList.add('active');
  }
  panelTitle.textContent = 'Manage Admissions Circulars & Notices';
  admissionsCircularsManager.classList.remove('d-none');
  
  cachedCircularItems = await fetchJsonCached('circulars_all', `${baseUrl}/admin/admissions/circulars`, []);
  if (!Array.isArray(cachedCircularItems)) {
    showAlert('Unable to load admissions notices/circulars', 'danger');
    cachedCircularItems = [];
  }
  
  admissionsCircularsManager.innerHTML = `
    <div class="card p-4 card-accent mb-4">
      <h5 id="circularFormTitle"><i class="fas fa-plus-circle text-primary"></i> Add Admission Circular/Notice</h5>
      <p style="color:var(--text-secondary); font-size:0.875rem;">Publish new notices, documents, or custom link notifications to the admission notices page.</p>
      <form id="circularForm" onsubmit="return false;" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1.25rem; margin-top:1rem;">
        <input type="hidden" id="circularEditId" value="" />
        <div style="grid-column: 1 / -1;">
          <label class="form-label" style="font-weight:600;">Title *</label>
          <input type="text" id="circularTitle" class="form-control" placeholder="e.g., EMRS Dornala Online Admissions Open for Academic Year 2026-27" required />
        </div>
        <div style="grid-column: 1 / -1;">
          <label class="form-label" style="font-weight:600;">Description / Message</label>
          <textarea id="circularDescription" class="form-control" rows="3" placeholder="Provide a brief description of the circular or notice content..."></textarea>
        </div>
        <div>
          <label class="form-label" style="font-weight:600;">Custom URL Link (Optional)</label>
          <input type="text" id="circularLink" class="form-control" placeholder="e.g., http://example.com" />
        </div>
        <div>
          <label class="form-label" style="font-weight:600;">Custom PDF URL (Optional)</label>
          <input type="text" id="circularPdfUrl" class="form-control" placeholder="e.g., /uploads/pdf/document.pdf" />
        </div>
        <div>
          <label class="form-label" style="font-weight:600;">Upload PDF Document File (Optional)</label>
          <input type="file" id="circularPdfFile" class="form-control" accept=".pdf" />
        </div>
        <div class="d-flex align-items-center gap-4 pt-4">
          <label class="d-flex align-items-center gap-2 font-weight-bold" style="cursor:pointer;">
            <input type="checkbox" id="circularIsNew" style="width:16px; height:16px;" />
            <span>Mark as NEW Badge</span>
          </label>
          <label class="d-flex align-items-center gap-2 font-weight-bold" style="cursor:pointer;">
            <input type="checkbox" id="circularActive" style="width:16px; height:16px;" checked />
            <span>Active / Visible</span>
          </label>
        </div>
        <div style="grid-column: 1 / -1; display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.5rem;">
          <button class="btn btn-primary" onclick="saveCircularItem()" id="circularSubmitBtn"><i class="fas fa-save"></i> Add Circular</button>
          <button class="btn btn-secondary" type="button" onclick="resetCircularForm()"><i class="fas fa-undo"></i> Reset</button>
        </div>
      </form>
    </div>
    
    <div class="card p-4">
      <h5 class="mb-3"><i class="fas fa-list text-primary"></i> Current Admission Circulars & Notices</h5>
      <div class="table-responsive">
        <table class="table table-bordered table-striped align-middle mb-0">
          <thead class="table-dark">
            <tr>
              <th>Title</th>
              <th style="width: 15%;">Link / PDF</th>
              <th style="width: 12%; text-align:center;">New Badge</th>
              <th style="width: 12%; text-align:center;">Status</th>
              <th style="width: 18%; text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${cachedCircularItems.length ? cachedCircularItems.map(item => `
              <tr>
                <td>
                  <div class="font-weight-bold">${item.title}</div>
                  <small class="text-muted d-block" style="max-width:400px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.description || 'No description'}</small>
                </td>
                <td>
                  ${item.pdf_url ? `<a href="${normalizeMediaUrl(item.pdf_url)}" target="_blank" class="badge bg-primary text-white"><i class="fas fa-file-pdf"></i> PDF Document</a>` : ''}
                  ${item.link ? `<a href="${item.link}" target="_blank" class="badge bg-secondary text-white"><i class="fas fa-link"></i> Link</a>` : ''}
                  ${(!item.pdf_url && !item.link) ? '<span class="text-muted">None</span>' : ''}
                </td>
                <td style="text-align:center;">
                  <span class="badge ${item.is_new ? 'bg-success text-white' : 'bg-secondary text-white'}">${item.is_new ? 'Yes' : 'No'}</span>
                </td>
                <td style="text-align:center;">
                  <button class="btn btn-sm ${item.active ? 'btn-success' : 'btn-secondary'}" onclick="toggleCircularItem('${item.id}')">
                    ${item.active ? '<i class="fas fa-eye"></i> Active' : '<i class="fas fa-eye-slash"></i> Inactive'}
                  </button>
                </td>
                <td style="text-align:center;">
                  <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-sm btn-primary" onclick="editCircularItem('${item.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCircularItem('${item.id}')"><i class="fas fa-trash"></i> Delete</button>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="5" class="text-center py-3 text-muted">No circular notices published.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
  renderLucideIcons();
}

function resetCircularForm() {
  document.getElementById('circularForm').reset();
  document.getElementById('circularEditId').value = '';
  document.getElementById('circularFormTitle').innerHTML = '<i class="fas fa-plus-circle text-primary"></i> Add Admission Circular/Notice';
  document.getElementById('circularSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Add Circular';
}

function editCircularItem(id) {
  const item = cachedCircularItems.find(entry => entry.id === id);
  if (!item) {
    showAlert('Notice not found', 'danger');
    return;
  }
  document.getElementById('circularEditId').value = item.id;
  document.getElementById('circularTitle').value = item.title;
  document.getElementById('circularDescription').value = item.description;
  document.getElementById('circularLink').value = item.link;
  document.getElementById('circularPdfUrl').value = item.pdf_url;
  document.getElementById('circularIsNew').checked = item.is_new;
  document.getElementById('circularActive').checked = item.active;
  
  document.getElementById('circularFormTitle').innerHTML = '<i class="fas fa-edit text-primary"></i> Edit Admission Circular/Notice';
  document.getElementById('circularSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update Circular';
  
  // Scroll to form
  document.getElementById('circularFormTitle').scrollIntoView({ behavior: 'smooth' });
}

async function saveCircularItem() {
  const editId = document.getElementById('circularEditId').value;
  const title = document.getElementById('circularTitle').value.trim();
  const description = document.getElementById('circularDescription').value.trim();
  const link = document.getElementById('circularLink').value.trim();
  const pdf_url = document.getElementById('circularPdfUrl').value.trim();
  const is_new = document.getElementById('circularIsNew').checked;
  const active = document.getElementById('circularActive').checked;
  const fileInput = document.getElementById('circularPdfFile');
  
  if (!title) {
    showAlert('Title is required', 'danger');
    return;
  }
  
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('link', link);
  formData.append('pdf_url', pdf_url);
  formData.append('is_new', is_new);
  formData.append('active', active);
  if (fileInput.files.length > 0) {
    formData.append('pdf_file', fileInput.files[0]);
  }
  
  const url = editId ? `${baseUrl}/admin/admissions/circulars/${editId}` : `${baseUrl}/admin/admissions/circulars`;
  const method = editId ? 'PUT' : 'POST';
  
  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    
    if (!res.ok) {
      const err = await res.json();
      showAlert(err.detail || 'Save failed', 'danger');
      return;
    }
    
    managerCache.delete('circulars_all');
    showAlert(editId ? 'Admission notice updated' : 'Admission notice added successfully');
    await loadAdmissionsCircularsManager();
    resetCircularForm();
  } catch (e) {
    showAlert('Server error saving circular notice', 'danger');
  }
}

async function toggleCircularItem(id) {
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/circulars/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      showAlert('Toggle failed', 'danger');
      return;
    }
    managerCache.delete('circulars_all');
    showAlert('Circular notice visibility updated');
    await loadAdmissionsCircularsManager();
  } catch (e) {
    showAlert('Connection error', 'danger');
  }
}

async function deleteCircularItem(id) {
  if (!confirm('Are you sure you want to delete this circular notice? This will also remove any associated PDF uploaded files.')) return;
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/circulars/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      showAlert('Delete failed', 'danger');
      return;
    }
    managerCache.delete('circulars_all');
    showAlert('Circular notice deleted');
    await loadAdmissionsCircularsManager();
  } catch (e) {
    showAlert('Connection error', 'danger');
  }
}


// =====================================================
// ADMISSION SCHEDULE/CALENDAR CRUD
// =====================================================

async function loadAdmissionsScheduleManager() {
  hideAllManagers();
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  if (document.getElementById('navAdmissionsSchedule')) {
    document.getElementById('navAdmissionsSchedule').classList.add('active');
  }
  panelTitle.textContent = 'Manage Admissions Schedule';
  admissionsScheduleManager.classList.remove('d-none');
  
  cachedScheduleItems = await fetchJsonCached('schedules_all', `${baseUrl}/admin/admissions/schedules`, []);
  if (!Array.isArray(cachedScheduleItems)) {
    showAlert('Unable to load admissions schedule list', 'danger');
    cachedScheduleItems = [];
  }
  
  admissionsScheduleManager.innerHTML = `
    <div class="card p-4 card-accent mb-4">
      <h5 id="scheduleFormTitle"><i class="fas fa-calendar-plus text-primary"></i> Add Admission Schedule Event</h5>
      <p style="color:var(--text-secondary); font-size:0.875rem;">Manage the timeline events displayed on the public notice board.</p>
      <form id="scheduleForm" onsubmit="return false;" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1.25rem; margin-top:1rem;">
        <input type="hidden" id="scheduleEditId" value="" />
        <div style="grid-column: 1 / -1;">
          <label class="form-label" style="font-weight:600;">Event Name *</label>
          <input type="text" id="scheduleEvent" class="form-control" placeholder="e.g., Online Form Application Window" required />
        </div>
        <div>
          <label class="form-label" style="font-weight:600;">Start Date / Display Date *</label>
          <input type="text" id="scheduleStartDate" class="form-control" placeholder="e.g., June 24, 2026" required />
        </div>
        <div>
          <label class="form-label" style="font-weight:600;">End Date (Optional)</label>
          <input type="text" id="scheduleEndDate" class="form-control" placeholder="e.g., July 15, 2026" />
        </div>
        <div>
          <label class="form-label" style="font-weight:600;">Action / Status Tag *</label>
          <select id="scheduleStatus" class="form-select">
            <option value="Active">Active (Green)</option>
            <option value="Upcoming">Upcoming (Yellow)</option>
            <option value="Pending">Pending (Gray)</option>
            <option value="Completed">Completed (Blue)</option>
          </select>
        </div>
        <div class="d-flex align-items-center pt-4">
          <label class="d-flex align-items-center gap-2 font-weight-bold" style="cursor:pointer;">
            <input type="checkbox" id="scheduleActive" style="width:16px; height:16px;" checked />
            <span>Active / Visible in Table</span>
          </label>
        </div>
        <div style="grid-column: 1 / -1; display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.5rem;">
          <button class="btn btn-primary" onclick="saveScheduleItem()" id="scheduleSubmitBtn"><i class="fas fa-save"></i> Add Event</button>
          <button class="btn btn-secondary" type="button" onclick="resetScheduleForm()"><i class="fas fa-undo"></i> Reset</button>
        </div>
      </form>
    </div>
    
    <div class="card p-4">
      <h5 class="mb-3"><i class="fas fa-calendar-alt text-primary"></i> Admissions Timeline events</h5>
      <div class="table-responsive">
        <table class="table table-bordered table-striped align-middle mb-0">
          <thead class="table-dark">
            <tr class="text-center">
              <th style="width: 8%; text-align:center;">Order</th>
              <th style="text-align:left;">Activity Event</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status Badge</th>
              <th style="width: 25%; text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${cachedScheduleItems.length ? cachedScheduleItems.map((item, index) => {
              let badgeClass = 'bg-secondary';
              if (item.status === 'Active') badgeClass = 'bg-success';
              else if (item.status === 'Upcoming') badgeClass = 'bg-warning text-dark';
              else if (item.status === 'Completed') badgeClass = 'bg-info';
              return `
                <tr class="text-center">
                  <td>
                    <span class="font-weight-bold" style="font-size:1.1rem; color:var(--primary);">${index + 1}</span>
                  </td>
                  <td style="text-align:left;">
                    <div class="font-weight-bold">${item.event}</div>
                  </td>
                  <td>${item.start_date}</td>
                  <td>${item.end_date || '<span class="text-muted">-</span>'}</td>
                  <td>
                    <span class="badge ${badgeClass} text-white">${item.status}</span>
                  </td>
                  <td>
                    <div class="d-flex justify-content-center gap-1">
                      <button class="btn btn-sm btn-primary" onclick="editScheduleItem('${item.id}')"><i class="fas fa-edit"></i> Edit</button>
                      <button class="btn btn-sm btn-secondary" onclick="moveScheduleItem('${item.id}', 'up')" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
                      <button class="btn btn-sm btn-secondary" onclick="moveScheduleItem('${item.id}', 'down')" ${index === cachedScheduleItems.length - 1 ? 'disabled' : ''}>&darr;</button>
                      <button class="btn btn-sm btn-danger" onclick="deleteScheduleItem('${item.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="6" class="text-center py-3 text-muted">No schedule events published.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
  renderLucideIcons();
}

function resetScheduleForm() {
  document.getElementById('scheduleForm').reset();
  document.getElementById('scheduleEditId').value = '';
  document.getElementById('scheduleStatus').value = 'Pending';
  document.getElementById('scheduleFormTitle').innerHTML = '<i class="fas fa-calendar-plus text-primary"></i> Add Admission Schedule Event';
  document.getElementById('scheduleSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Add Event';
}

function editScheduleItem(id) {
  const item = cachedScheduleItems.find(entry => entry.id === id);
  if (!item) {
    showAlert('Schedule event not found', 'danger');
    return;
  }
  document.getElementById('scheduleEditId').value = item.id;
  document.getElementById('scheduleEvent').value = item.event;
  document.getElementById('scheduleStartDate').value = item.start_date;
  document.getElementById('scheduleEndDate').value = item.end_date;
  document.getElementById('scheduleStatus').value = item.status;
  document.getElementById('scheduleActive').checked = item.active;
  
  document.getElementById('scheduleFormTitle').innerHTML = '<i class="fas fa-calendar-plus text-primary"></i> Edit Admission Schedule Event';
  document.getElementById('scheduleSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update Event';
  
  document.getElementById('scheduleFormTitle').scrollIntoView({ behavior: 'smooth' });
}

async function saveScheduleItem() {
  const editId = document.getElementById('scheduleEditId').value;
  const event = document.getElementById('scheduleEvent').value.trim();
  const start_date = document.getElementById('scheduleStartDate').value.trim();
  const end_date = document.getElementById('scheduleEndDate').value.trim();
  const status = document.getElementById('scheduleStatus').value;
  const active = document.getElementById('scheduleActive').checked;
  
  if (!event || !start_date) {
    showAlert('Event name and start date are required', 'danger');
    return;
  }
  
  const formData = new FormData();
  formData.append('event', event);
  formData.append('start_date', start_date);
  formData.append('end_date', end_date);
  formData.append('status', status);
  formData.append('active', active);
  
  const url = editId ? `${baseUrl}/admin/admissions/schedules/${editId}` : `${baseUrl}/admin/admissions/schedules`;
  const method = editId ? 'PUT' : 'POST';
  
  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    
    if (!res.ok) {
      const err = await res.json();
      showAlert(err.detail || 'Save failed', 'danger');
      return;
    }
    
    managerCache.delete('schedules_all');
    showAlert(editId ? 'Admission schedule event updated' : 'Admission schedule event added successfully');
    await loadAdmissionsScheduleManager();
    resetScheduleForm();
  } catch (e) {
    showAlert('Server error saving schedule event', 'danger');
  }
}

async function deleteScheduleItem(id) {
  if (!confirm('Are you sure you want to delete this schedule event?')) return;
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/schedules/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      showAlert('Delete failed', 'danger');
      return;
    }
    managerCache.delete('schedules_all');
    showAlert('Schedule event deleted');
    await loadAdmissionsScheduleManager();
  } catch (e) {
    showAlert('Connection error', 'danger');
  }
}

async function moveScheduleItem(id, direction) {
  try {
    const res = await fetch(`${baseUrl}/admin/admissions/schedules/${id}/move?direction=${direction}`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      showAlert('Movement failed', 'danger');
      return;
    }
    managerCache.delete('schedules_all');
    await loadAdmissionsScheduleManager();
  } catch (e) {
    showAlert('Connection error', 'danger');
  }
}


function init() {
  initializeDashboardPreferences();
  renderLucideIcons();

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', toggleSidebar);
  }

  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  window.addEventListener('resize', syncSidebarWithViewport);

  document.getElementById('navLogoutBtn').addEventListener('click', ()=>{
    if(confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('emrs_token'); 
      window.location='admin-login.html';
    }
  });
  document.getElementById('navAnnouncements').addEventListener('click', loadAnnouncements);
  document.getElementById('navNotifications').addEventListener('click', loadNotifications);
  document.getElementById('navEventItems').addEventListener('click', () => loadEventManager('achievement'));
  document.getElementById('navEvents').addEventListener('click', () => loadEventManager('event'));
  document.getElementById('navCalendar').addEventListener('click', loadCalendarManager);
  document.getElementById('navStaff').addEventListener('click', loadStaffManager);
  document.getElementById('navContactPage').addEventListener('click', loadContactPageManager);
  document.getElementById('navResultsHeroStats').addEventListener('click', () => loadResultsSection('hero-stats'));
  document.getElementById('navResultsNotices').addEventListener('click', () => loadResultsSection('notices'));
  document.getElementById('navResultsToppers').addEventListener('click', () => loadResultsSection('toppers'));
  document.getElementById('navResultsClassPortals').addEventListener('click', () => loadResultsSection('class-portals'));
  document.getElementById('navSportsFacilities').addEventListener('click', loadSportsFacilitiesManager);
  document.getElementById('navSportsEvents').addEventListener('click', loadSportsEventsManager);
  document.getElementById('navSportsAchievements').addEventListener('click', loadSportsAchievementsManager);
  document.getElementById('navCampusGallery').addEventListener('click', loadCampusGalleryManager);
  document.getElementById('navHostelInfo').addEventListener('click', loadHostelInfoManager);
  document.getElementById('navHostelSchedule').addEventListener('click', loadHostelScheduleManager);
  document.getElementById('navHostelNotices').addEventListener('click', loadHostelNoticesManager);
  document.getElementById('navHostelGallery').addEventListener('click', loadHostelGalleryManager);
  document.getElementById('navMessInfo').addEventListener('click', () => loadFacilityManager('mess'));
  document.getElementById('navSchoolInfo').addEventListener('click', () => loadFacilityManager('school'));
  document.getElementById('navPlaygroundInfo').addEventListener('click', () => loadFacilityManager('playground'));
  document.getElementById('navStaffQuartersInfo').addEventListener('click', () => loadFacilityManager('staffQuarters'));
  document.getElementById('navAlumniNotable').addEventListener('click', loadAlumniNotableManager);
  document.getElementById('navAlumniEvents').addEventListener('click', loadAlumniEventsManager);
  document.getElementById('navAlumniTestimonials').addEventListener('click', loadAlumniTestimonialsManager);
  document.getElementById('navAdmissionsAll').addEventListener('click', () => loadAdmissionsManager('All'));
  document.getElementById('navAdmissionsPending').addEventListener('click', () => loadAdmissionsManager('Pending'));
  document.getElementById('navAdmissionsApproved').addEventListener('click', () => loadAdmissionsManager('Approved'));
  document.getElementById('navAdmissionsRejected').addEventListener('click', () => loadAdmissionsManager('Rejected'));
  if (document.getElementById('navAdmissionsAnalytics')) {
    document.getElementById('navAdmissionsAnalytics').addEventListener('click', () => loadAdmissionsAnalytics());
  }
  if (document.getElementById('navAdmissionsCirculars')) {
    document.getElementById('navAdmissionsCirculars').addEventListener('click', loadAdmissionsCircularsManager);
  }
  if (document.getElementById('navAdmissionsSchedule')) {
    document.getElementById('navAdmissionsSchedule').addEventListener('click', loadAdmissionsScheduleManager);
  }

    document.querySelectorAll('#sidebar .sidebar-item, #sidebar .sidebar-group-title').forEach((item) => {
      item.addEventListener('click', () => {
        resetDashboardScroll();
      });
    });

  document.querySelectorAll('#sidebar .sidebar-item').forEach((item) => {
    item.addEventListener('click', () => {
      if (isMobileView()) {
        closeMobileSidebar();
      }
    });
  });

  loadAnnouncements();
  resetDashboardScroll();
}

init();
