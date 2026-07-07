(function () {
  const LOCAL_API_ORIGIN = 'https://emrsdornala.onrender.com';

  function getApiOrigin() {
    return 'https://emrsdornala.onrender.com';
  }

  const apiOrigin = getApiOrigin();

  function apiUrl(path) {
    const normalized = String(path || '').startsWith('/') ? path : `/${path}`;
    return `${apiOrigin}/api${normalized}`;
  }

  function normalizeMediaUrl(url) {
    if (!url) return '';
    const value = String(url).trim().replace('/uploads/annoucements/', '/uploads/announcements/');
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value;
    if (value.startsWith('/')) return `${apiOrigin}${value}`;
    if (value.startsWith('uploads/') || value.startsWith('assets/') || value.startsWith('images/') || value.startsWith('WriteReadData/')) {
      return `${apiOrigin}/${value}`;
    }
    return `${apiOrigin}/uploads/${value.replace(/^\/+/, '')}`;
  }

  async function fetchJson(path, fallback) {
    try {
      const response = await fetch(apiUrl(path), { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to load ${path}`, error);
      return fallback;
    }
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el && value !== undefined && value !== null && value !== '') el.textContent = value;
  }

  function setHeroBackground(selector, url, overlaySelector, overlayOpacity) {
    const bg = document.querySelector(selector);
    if (bg && url) bg.style.backgroundImage = `url("${normalizeMediaUrl(url)}")`;

    if (overlaySelector && overlayOpacity !== undefined && overlayOpacity !== null) {
      const overlay = document.querySelector(overlaySelector);
      if (overlay) overlay.style.backgroundColor = `rgba(0, 0, 0, ${Number(overlayOpacity) || 0.35})`;
    }
  }

  function setStat(selector, value, suffix) {
    const el = document.querySelector(selector);
    if (!el || value === undefined || value === null || value === '') return;
    el.textContent = `${value}${suffix || ''}`;
    if (el.classList.contains('counter')) {
      el.setAttribute('data-target', value);
    }
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderGallery(selector, items, options = {}) {
    const container = document.querySelector(selector);
    if (!container) return;
    clearChildren(container);

    if (!Array.isArray(items) || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = options.emptyClass || 'empty-state';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = options.emptyText || 'Gallery will be updated soon.';
      container.appendChild(empty);
      return;
    }

    items.forEach((item, index) => {
      const imageUrl = normalizeMediaUrl(item.image || item.media_url || item.image_url || item.banner_image);
      const card = document.createElement('div');
      card.className = options.itemClass || 'gallery-item';
      card.setAttribute('data-gallery-index', String(index));
      if (options.animate) card.setAttribute('data-aos', 'zoom-in');

      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = item.title || item.caption || 'Campus image';
      img.loading = 'lazy';
      img.onerror = function () {
        this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect fill=%22%23e8eef4%22 width=%22600%22 height=%22400%22/%3E%3C/svg%3E';
      };
      card.appendChild(img);

      if (item.featured) {
        const badge = document.createElement('div');
        badge.className = options.badgeClass || 'featured-badge';
        badge.textContent = 'Featured';
        card.appendChild(badge);
      }

      const overlay = document.createElement('div');
      overlay.className = options.overlayClass || 'gallery-overlay';
      overlay.textContent = item.title || item.caption || 'View';
      card.appendChild(overlay);

      card.addEventListener('click', () => {
        if (typeof window.openLightbox === 'function') {
          window.openLightbox(imageUrl);
        }
      });

      container.appendChild(card);
    });
  }

  async function loadShells(headerSelector, footerSelector) {
    try {
      const response = await fetch('index.html');
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const headerTarget = document.querySelector(headerSelector || '#headerShell');
      const footerTarget = document.querySelector(footerSelector || '#footerShell');

      if (headerTarget) {
        const wrapper = doc.querySelector('#wrapper');
        if (wrapper) {
          const parts = [];
          wrapper.querySelectorAll(':scope > .tobbar_main, :scope > .headertoppanel, :scope > .navbar-area').forEach((node) => {
            parts.push(node.outerHTML);
          });
          headerTarget.innerHTML = parts.join('\n');
        } else {
          const navbar = doc.querySelector('.navbar-area');
          if (navbar) headerTarget.innerHTML = navbar.outerHTML;
        }
      }

      if (footerTarget) {
        const footer = doc.querySelector('footer');
        if (footer) footerTarget.innerHTML = footer.outerHTML;
      }

      if (window.jQuery && typeof window.jQuery.fn.meanmenu === 'function' && window.jQuery('.mean-menu').length && !window.jQuery('.mean-container').length) {
        window.jQuery('.mean-menu').meanmenu({ meanScreenWidth: '991' });
      }
    } catch (error) {
      console.error('Failed to load shared page shell', error);
    }
  }

  async function loadFacilityPage(config) {
    await loadShells(config.headerSelector, config.footerSelector);

    const hero = await fetchJson(`${config.basePath}/hero`, {});
    setText(config.heroTitle, hero.title);
    setText(config.heroSubtitle, hero.subtitle);
    setHeroBackground(config.heroBanner, hero.banner_image, config.heroOverlay, hero.overlay_opacity);

    const stats = await fetchJson(`${config.basePath}/stats`, {});
    Object.keys(config.stats || {}).forEach((key) => {
      const stat = config.stats[key];
      setStat(stat.selector, stats[key], stat.suffix);
    });

    const gallery = await fetchJson(`${config.basePath}/gallery`, []);
    renderGallery(config.gallerySelector, gallery, config.galleryOptions || {});
  }

  window.EMRSFacility = {
    apiOrigin,
    apiUrl,
    normalizeMediaUrl,
    fetchJson,
    setText,
    renderGallery,
    loadShells,
    loadFacilityPage,
  };
})();
