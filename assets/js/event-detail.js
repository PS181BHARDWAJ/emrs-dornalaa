function parseDetailDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDetailDate(value) {
  const date = parseDetailDate(value);
  if (!date) return 'Date TBD';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getDetailGallery(item) {
  const gallery = Array.isArray(item.gallery_images) ? item.gallery_images : [];
  if (gallery.length) return gallery;
  if (item.image_url) return [item.image_url];
  return [];
}

function galleryImageUrl(raw) {
  return normalizeMediaUrl(raw || 'images/default-banner.jpg');
}

function sanitizeRichText(value) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(value || ''), 'text/html');

  doc.querySelectorAll('script, style').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith('on')) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return doc.body.innerHTML;
}

function openLightbox(src) {
  const overlay = document.getElementById('lightboxOverlay');
  const image = document.getElementById('lightboxImage');
  if (!overlay || !image) return;
  image.src = src;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const overlay = document.getElementById('lightboxOverlay');
  const image = document.getElementById('lightboxImage');
  if (!overlay || !image) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  image.src = '';
  document.body.style.overflow = '';
}

function readCachedEvent(eventId) {
  try {
    const direct = sessionStorage.getItem(`emrs_event_${eventId}`);
    if (direct) return JSON.parse(direct);
    const last = sessionStorage.getItem('emrs_event_last');
    if (last) {
      const parsed = JSON.parse(last);
      if (String(parsed?.id || '') === String(eventId)) return parsed;
    }
  } catch (error) {
    console.warn('Unable to read cached event payload', error);
  }
  return null;
}

async function fetchEventDetail(eventId) {
  const primary = await apiFetch(`/events/${encodeURIComponent(eventId)}`);
  if (primary.ok) return await primary.json();

  const fallback = await apiFetch('/events?category=event&include_inactive=true&limit=500');
  if (fallback.ok) {
    const items = await fallback.json();
    const list = Array.isArray(items) ? items : [];
    const found = list.find((entry) => String(entry.id) === String(eventId));
    if (found) return found;
  }

  throw new Error('Unable to load event');
}

function renderDetail(item) {
  const root = document.getElementById('eventDetailRoot');
  if (!root) return;

  const gallery = getDetailGallery(item);
  const heroImage = galleryImageUrl(item.image_url || gallery[0]);
  const description = item.full_description || item.short_description || 'No description available.';

  root.innerHTML = `
    <article class="detail-card">
      <div class="detail-hero">
        <img src="${heroImage}" alt="${escapeHtml(item.title || 'Event image')}" loading="lazy">
        <div class="detail-hero-overlay">
          <span class="detail-badge">${escapeHtml(item.event_category || 'General')}</span>
          <h1>${escapeHtml(item.title || 'Untitled event')}</h1>
          <p>${escapeHtml(item.short_description || '')}</p>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-meta-grid">
          <div class="detail-meta-card"><span>Date</span><strong>${formatDetailDate(item.event_date)}</strong></div>
          <div class="detail-meta-card"><span>Category</span><strong>${escapeHtml(item.event_category || 'General')}</strong></div>
          <div class="detail-meta-card"><span>Location</span><strong>${escapeHtml(item.location || 'Location TBD')}</strong></div>
          <div class="detail-meta-card"><span>Type</span><strong>${escapeHtml(item.category || 'event')}</strong></div>
        </div>

        <div class="detail-copy">${sanitizeRichText(description)}</div>

        <div class="detail-actions">
          <a class="detail-button secondary" href="events.html">Back to Events</a>
          <button class="detail-button" type="button" id="shareEventBtn">Share</button>
          ${item.brochure_url ? `<a class="detail-button secondary" href="${galleryImageUrl(item.brochure_url)}" target="_blank" rel="noopener noreferrer">Download Brochure</a>` : ''}
        </div>

        <section class="gallery-section">
          <div class="section-heading">
            <h2>Image Gallery</h2>
            <span>${gallery.length} image${gallery.length === 1 ? '' : 's'}</span>
          </div>
          <div class="gallery-grid">
            ${gallery.length ? gallery.map((url, index) => `
              <button class="gallery-item" type="button" data-gallery-index="${index}">
                <img src="${galleryImageUrl(url)}" alt="Gallery image ${index + 1}" loading="lazy">
              </button>
            `).join('') : '<p class="empty-copy">No additional images uploaded for this event.</p>'}
          </div>
        </section>
      </div>
    </article>
  `;

  root.querySelectorAll('.gallery-item').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.getAttribute('data-gallery-index') || '0');
      openLightbox(galleryImageUrl(gallery[index]));
    });
  });

  const shareButton = document.getElementById('shareEventBtn');
  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      const sharePayload = {
        title: item.title || 'Event Details',
        text: item.short_description || 'EMRS Dornala event',
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(sharePayload);
          return;
        } catch (error) {
          console.warn(error);
        }
      }

      try {
        await navigator.clipboard.writeText(window.location.href);
        shareButton.textContent = 'Link Copied';
        setTimeout(() => {
          shareButton.textContent = 'Share';
        }, 1400);
      } catch (error) {
        console.error(error);
      }
    });
  }
}

async function initializeEventDetailPage() {
  const root = document.getElementById('eventDetailRoot');
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');

  if (!eventId) {
    if (root) root.innerHTML = '<p>Invalid event link.</p>';
    return;
  }

  try {
    const item = await fetchEventDetail(eventId);
    renderDetail(item);
  } catch (error) {
    console.error(error);
    const cached = readCachedEvent(eventId);
    if (cached) {
      renderDetail(cached);
      return;
    }
    if (root) root.innerHTML = '<p>Could not load the event right now.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initializeEventDetailPage);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
});
