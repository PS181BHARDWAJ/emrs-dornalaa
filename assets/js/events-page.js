const EVENTS_PAGE_SIZE = 8;
let eventsData = [];
let filteredEventsData = [];
let visibleEvents = EVENTS_PAGE_SIZE;

function parseEventDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatEventDate(value) {
  const date = parseEventDate(value);
  if (!date) return 'Date TBD';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function eventSortValue(item) {
  const eventDate = parseEventDate(item.event_date);
  if (eventDate) return eventDate.getTime();
  const createdAt = parseEventDate(item.created_at);
  return createdAt ? createdAt.getTime() : 0;
}

function getFeaturedImage(item) {
  const gallery = Array.isArray(item.gallery_images) ? item.gallery_images : [];
  return normalizeMediaUrl(item.image_url || gallery[0] || 'images/default-banner.jpg');
}

function heroMarkup() {
  return `
    <section class="events-hero">
      <div class="events-hero-copy">
        <span class="events-kicker">EMRS Dornala</span>
        <h1>Events</h1>
        <p>Browse academic, cultural, sports, and campus events with quick filters, featured highlights, and detailed galleries.</p>
      </div>
    </section>
  `;
}

function featuredMarkup(items) {
  if (!items.length) {
    return '<div class="events-empty-note">No featured events are available right now.</div>';
  }

  return `
    <div class="featured-grid">
      ${items.slice(0, 3).map((item, index) => {
        const image = getFeaturedImage(item);
        return `
          <article class="featured-card" style="animation-delay:${index * 0.08}s">
            <img src="${image}" alt="${escapeHtml(item.title || 'Featured event')}" loading="lazy">
            <div class="featured-overlay">
              <span class="badge-pill">Featured</span>
              <h2>${escapeHtml(item.title || 'Untitled')}</h2>
              <p>${escapeHtml(item.short_description || '')}</p>
              <div class="featured-meta">${formatEventDate(item.event_date)} · ${escapeHtml(item.event_category || 'General')}</div>
              <a class="read-more-btn" data-event-id="${encodeURIComponent(item.id)}" href="event-detail.html?id=${encodeURIComponent(item.id)}">Read More</a>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function cardMarkup(item, index) {
  const image = getFeaturedImage(item);
  const summary = item.short_description || item.full_description || 'No description available.';
  return `
    <article class="event-card" style="animation-delay:${Math.min(index * 0.05, 0.4)}s">
      <img src="${image}" alt="${escapeHtml(item.title || 'Event image')}" loading="lazy">
      <div class="event-card-body">
        <div class="event-topline">
          <span class="category-pill">${escapeHtml(item.event_category || 'General')}</span>
          <span class="event-date">${formatEventDate(item.event_date)}</span>
        </div>
        <h3>${escapeHtml(item.title || 'Untitled')}</h3>
        <p>${escapeHtml(summary)}</p>
        <div class="event-footer">
          <span class="type-pill">${escapeHtml(item.category || 'event')}</span>
          <a class="read-more-btn" data-event-id="${encodeURIComponent(item.id)}" href="event-detail.html?id=${encodeURIComponent(item.id)}">Read More</a>
        </div>
      </div>
    </article>
  `;
}

function cacheEventForDetail(item) {
  if (!item || !item.id) return;
  try {
    const key = `emrs_event_${item.id}`;
    sessionStorage.setItem(key, JSON.stringify(item));
    sessionStorage.setItem('emrs_event_last', JSON.stringify(item));
  } catch (error) {
    console.warn('Unable to cache event detail payload', error);
  }
}

function renderSkeletons() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 6 }).map(() => `
    <article class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
    </article>
  `).join('');
}

function renderFallbackState(message) {
  const main = document.getElementById('eventsPageRoot');
  if (!main) return;

  main.innerHTML = `
    <section class="events-hero">
      <div class="events-hero-copy">
        <span class="events-kicker">EMRS Dornala</span>
        <h1>Events</h1>
        <p>Browse academic, cultural, sports, and campus events with quick filters, featured highlights, and detailed galleries.</p>
      </div>
    </section>
    <section class="events-shell">
      <div class="events-empty-note">${escapeHtml(message || 'Could not load events right now.')}</div>
    </section>
  `;
}

function populateFilters(items) {
  const categorySelect = document.getElementById('categoryFilter');
  const yearSelect = document.getElementById('yearFilter');

  const categories = Array.from(new Set(items.map((item) => (item.event_category || '').trim()).filter(Boolean))).sort();
  const years = Array.from(new Set(items.map((item) => {
    const date = parseEventDate(item.event_date);
    return date ? date.getFullYear() : null;
  }).filter(Boolean))).sort((a, b) => b - a);

  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">All Categories</option>' + categories.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  }
  if (yearSelect) {
    yearSelect.innerHTML = '<option value="">All Years</option>' + years.map((value) => `<option value="${value}">${value}</option>`).join('');
  }
}

function applyFilters() {
  const searchValue = (document.getElementById('searchEvents')?.value || '').trim().toLowerCase();
  const categoryValue = document.getElementById('categoryFilter')?.value || '';
  const yearValue = Number(document.getElementById('yearFilter')?.value || 0);
  const monthValue = Number(document.getElementById('monthFilter')?.value || 0);

  filteredEventsData = eventsData.filter((item) => {
    if (searchValue && !(item.title || '').toLowerCase().includes(searchValue)) return false;
    if (categoryValue && (item.event_category || '') !== categoryValue) return false;
    if (yearValue || monthValue) {
      const date = parseEventDate(item.event_date);
      if (!date) return false;
      if (yearValue && date.getFullYear() !== yearValue) return false;
      if (monthValue && (date.getMonth() + 1) !== monthValue) return false;
    }
    return true;
  });

  visibleEvents = EVENTS_PAGE_SIZE;
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('eventsGrid');
  const loadMore = document.getElementById('loadMoreArea');
  if (!grid || !loadMore) return;

  const visible = filteredEventsData.slice(0, visibleEvents);
  if (!visible.length) {
    grid.innerHTML = '<div class="events-empty-note">No events match the selected filters.</div>';
    loadMore.innerHTML = '';
    return;
  }

  grid.innerHTML = visible.map((item, index) => cardMarkup(item, index)).join('');

  grid.querySelectorAll('.read-more-btn[data-event-id]').forEach((link) => {
    link.addEventListener('click', () => {
      const eventId = decodeURIComponent(link.getAttribute('data-event-id') || '');
      const item = filteredEventsData.find((entry) => String(entry.id) === String(eventId));
      if (item) cacheEventForDetail(item);
    });
  });

  if (visibleEvents < filteredEventsData.length) {
    loadMore.innerHTML = '<button type="button" class="load-more-btn" id="loadMoreBtn">Load More</button>';
    const button = document.getElementById('loadMoreBtn');
    if (button) {
      button.addEventListener('click', () => {
        visibleEvents = Math.min(visibleEvents + EVENTS_PAGE_SIZE, filteredEventsData.length);
        renderGrid();
      });
    }
  } else {
    loadMore.innerHTML = '';
  }
}

async function initializeEventsPage() {
  const main = document.getElementById('eventsPageRoot');
  if (!main) return;

  renderSkeletons();

  try {
    const response = await apiFetch('/events?category=event&status=published&limit=500');
    if (!response.ok) throw new Error('Unable to load events');

    eventsData = (await response.json())
      .filter((item) => item && (item.category || '').toLowerCase() === 'event')
      .filter((item) => item && (item.status === 'published' || item.active !== false))
      .sort((a, b) => eventSortValue(b) - eventSortValue(a));

    filteredEventsData = [...eventsData];
    main.innerHTML = `
      ${heroMarkup()}
      <section class="events-shell">
        <div class="events-filters-wrap">
          <input id="searchEvents" class="events-control" type="search" placeholder="Search by title" aria-label="Search events by title">
          <select id="categoryFilter" class="events-control" aria-label="Filter events by category"></select>
          <select id="yearFilter" class="events-control" aria-label="Filter events by year"></select>
          <select id="monthFilter" class="events-control" aria-label="Filter events by month">
            <option value="">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        <div class="section-heading">
          <h2>Featured Events</h2>
        </div>
        <div id="featuredEventsArea"></div>
        <div class="section-heading section-heading-main">
          <h2>Latest Events</h2>
          <span>${eventsData.length} items</span>
        </div>
        <div id="eventsGrid" class="events-grid"></div>
        <div id="loadMoreArea" class="load-more-row"></div>
      </section>
    `;

    populateFilters(eventsData);

    // Read category from URL parameter and pre-select in filter dropdown
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      const categorySelect = document.getElementById('categoryFilter');
      if (categorySelect) {
        const match = Array.from(categorySelect.options).find(
          (opt) => opt.value.toLowerCase() === categoryParam.toLowerCase()
        );
        if (match) {
          categorySelect.value = match.value;
        }
      }
    }

    const featured = eventsData.filter((item) => item.is_featured || item.is_highlighted);
    const featuredArea = document.getElementById('featuredEventsArea');
    if (featuredArea) featuredArea.innerHTML = featuredMarkup(featured);
    if (featuredArea) {
      featuredArea.querySelectorAll('.read-more-btn[data-event-id]').forEach((link) => {
        link.addEventListener('click', () => {
          const eventId = decodeURIComponent(link.getAttribute('data-event-id') || '');
          const item = eventsData.find((entry) => String(entry.id) === String(eventId));
          if (item) cacheEventForDetail(item);
        });
      });
    }
    applyFilters();

    ['searchEvents', 'categoryFilter', 'yearFilter', 'monthFilter'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', applyFilters);
        element.addEventListener('change', applyFilters);
      }
    });
  } catch (error) {
    console.error(error);
    renderFallbackState('Could not load events right now.');
  }
}

document.addEventListener('DOMContentLoaded', initializeEventsPage);
