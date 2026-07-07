// ============================================
// ALUMNI EVENTS PAGE - JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    initializeEventsPage();
});

async function initializeEventsPage() {
    await loadEvents('upcoming');
    setupEventListeners();
}

function parseEventDate(value) {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatEventDate(value, options) {
    const dt = parseEventDate(value);
    if (!dt) return 'Date TBD';
    return dt.toLocaleDateString('en-US', options);
}

function getPrimaryEventImage(event) {
    const direct = alumniAPI.normalizeMediaUrl(event.image_url || event.banner_image || event.image);
    if (direct) return direct;

    if (Array.isArray(event.images) && event.images.length > 0) {
        const first = event.images[0];
        const raw = typeof first === 'string' ? first : (first.url || first.image_url || first.path || '');
        return alumniAPI.normalizeMediaUrl(raw);
    }

    return '';
}

async function loadEvents(filterType = 'upcoming') {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    try {
        const events = await alumniAPI.getAllEvents();
        const now = new Date();

        let filteredEvents = (events || []).filter((event) => {
            const eventDate = parseEventDate(event.date || event.event_date || event.created_at);
            if (!eventDate) return filterType !== 'upcoming';
            return filterType === 'upcoming' ? eventDate >= now : eventDate < now;
        });

        filteredEvents.sort((a, b) => {
            const aDate = parseEventDate(a.date || a.event_date || a.created_at) || new Date(0);
            const bDate = parseEventDate(b.date || b.event_date || b.created_at) || new Date(0);
            return aDate - bDate;
        });

        if (filterType === 'past') {
            filteredEvents.reverse();
        }

        displayEventCards(filteredEvents);
    } catch (error) {
        console.error('Error loading events:', error);
        grid.innerHTML = '<div class="col-12"><p class="text-danger">Error loading events</p></div>';
    }
}

function displayEventCards(events) {
    const grid = document.getElementById('eventsGrid');
    const noMsg = document.getElementById('noEventsMsg');
    if (!grid) return;

    if (!events || events.length === 0) {
        grid.innerHTML = '';
        if (noMsg) noMsg.style.display = 'block';
        return;
    }

    if (noMsg) noMsg.style.display = 'none';

    grid.innerHTML = events.map((event) => {
        const eventDateRaw = event.date || event.event_date || event.created_at;
        const eventDate = parseEventDate(eventDateRaw);
        const formattedDate = formatEventDate(eventDateRaw, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const isUpcoming = eventDate ? new Date() <= eventDate : false;
        const imageUrl = getPrimaryEventImage(event);
        const title = event.title || 'Alumni Event';

        return `
            <div class="event-card">
                <div class="event-banner" style="position: relative;">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-calendar-alt"></i>`}
                    <div class="event-banner-overlay">
                        <div class="event-banner-title">${title}</div>
                        <div class="event-banner-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${formattedDate}
                        </div>
                    </div>
                    <span class="event-status-badge ${isUpcoming ? 'upcoming' : 'past'}">
                        ${isUpcoming ? '<i class="fas fa-clock" style="margin-right: 0.25rem;"></i>Upcoming' : 'Past'}
                    </span>
                </div>
                <div class="event-content">
                    <h3 class="event-title">${title}</h3>
                    <div class="event-meta">
                        <div class="event-meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location || 'Location TBD'}</span>
                        </div>
                        <div class="event-meta-item">
                            <i class="fas fa-users"></i>
                            <span>${event.participants_count || 0} registered</span>
                        </div>
                    </div>
                    <p class="event-description">
                        ${event.description ? truncateText(event.description, 120) : 'An exciting alumni event'}
                    </p>
                    <div class="event-actions">
                        <button class="event-btn event-btn-primary" onclick="viewEventDetails('${event.id || ''}')">
                            <i class="fas fa-arrow-right" style="margin-right: 0.5rem;"></i>View Details
                        </button>
                        <button class="event-btn event-btn-secondary" onclick="registerEvent('${event.id || ''}', '${title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-ticket-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function viewEventDetails(id) {
    try {
        const event = await alumniAPI.getEvent(id);
        if (!event) throw new Error('Event not found');

        const eventDateRaw = event.date || event.event_date || event.created_at;
        const eventDate = parseEventDate(eventDateRaw);
        const formattedDate = formatEventDate(eventDateRaw, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const isUpcoming = eventDate ? new Date() <= eventDate : false;
        const title = event.title || 'Alumni Event';
        const heroImage = getPrimaryEventImage(event);

        let imagesHTML = '';
        if (Array.isArray(event.images) && event.images.length > 0) {
            imagesHTML = `
                <div style="margin-top: 2rem;">
                    <h4 style="font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">Event Gallery</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                        ${event.images.map((img, idx) => {
                            const raw = typeof img === 'string' ? img : (img.url || img.image_url || img.path || '');
                            const url = alumniAPI.normalizeMediaUrl(raw);
                            if (!url) return '';
                            return `<img src="${url}" alt="Event ${idx + 1}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 0.875rem; cursor: pointer;" onclick="openImageModal('${url}')">`;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        const modalBody = document.getElementById('eventModalBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
                <div>
                    <div style="border-radius: 0.875rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 1.5rem;">
                        ${heroImage ? `<img src="${heroImage}" alt="${title}" style="width: 100%; height: auto; display: block; object-fit: cover;">` : `<div style="width: 100%; height: 200px; background: linear-gradient(135deg, #eef2ff 0%, rgba(99, 102, 241, 0.05) 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #6366f1;"><i class="fas fa-calendar-alt"></i></div>`}
                    </div>
                    <button class="event-btn event-btn-primary" style="width: 100%;" onclick="registerEvent('${event.id || ''}', '${title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-ticket-alt" style="margin-right: 0.5rem;"></i>
                        ${isUpcoming ? 'Register Now' : 'View More'}
                    </button>
                </div>
                <div>
                    <h2 style="font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">${title}</h2>

                    <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--primary);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
                                <i class="fas fa-calendar-alt" style="margin-right: 0.5rem;"></i>Date & Time
                            </div>
                            <div style="color: var(--text-primary); font-weight: 600;">${formattedDate}</div>
                        </div>

                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--success);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
                                <i class="fas fa-map-marker-alt" style="margin-right: 0.5rem;"></i>Location
                            </div>
                            <div style="color: var(--text-primary); font-weight: 600;">${event.location || 'Location TBD'}</div>
                        </div>

                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--warning);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
                                <i class="fas fa-users" style="margin-right: 0.5rem;"></i>Registrations
                            </div>
                            <div style="color: var(--text-primary); font-weight: 600;">${event.participants_count || 0} participants</div>
                        </div>
                    </div>

                    <div>
                        <h4 style="font-weight: 700; color: var(--text-primary); margin-bottom: 1rem;">About This Event</h4>
                        <p style="color: var(--text-secondary); line-height: 1.8;">${event.description || 'An exciting event for EMRS Dornala alumni to connect and celebrate.'}</p>
                    </div>
                    ${imagesHTML}
                </div>
            </div>
        `;

        if (window.$ && $('#eventModal').length) {
            $('#eventModal').modal('show');
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        alert('Error loading event details');
    }
}

function registerEvent(eventId, eventTitle) {
    if (!eventId) return;
    if (confirm(`Are you sure you want to register for "${eventTitle}"?`)) {
        console.log('Registered for event:', eventId);
        alert('Thank you for registering! You will receive a confirmation email shortly.');
    }
}

function openImageModal(imageUrl) {
    if (!imageUrl) return;
    window.open(imageUrl, '_blank');
}

function setupEventListeners() {
    const filterButtons = document.querySelectorAll('#eventFilter .nav-link');
    filterButtons.forEach((btn) => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            filterButtons.forEach((b) => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter') || 'upcoming';
            loadEvents(filter);
        });
    });
}

function truncateText(text, length) {
    if (!text || text.length <= length) return text || '';
    return text.substring(0, length) + '...';
}
