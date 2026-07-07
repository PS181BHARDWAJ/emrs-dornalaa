const emrsApiHosts = [
  'https://emrsdornala.onrender.com'
];
let emrsActiveHost = emrsApiHosts[0];

async function emrsFetch(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const hosts = [emrsActiveHost, ...emrsApiHosts.filter((host) => host !== emrsActiveHost)];
  let lastError = null;

  for (const host of hosts) {
    try {
      const response = await fetch(`${host}/api${normalizedPath}`, options);
      if (response.ok) {
        emrsActiveHost = host;
        return response;
      }
      if (response.status < 500 && response.status !== 503) {
        emrsActiveHost = host;
        return response;
      }
      lastError = new Error(`Request failed with ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No API host available');
}

async function fetchAnnouncements() {
  const response = await emrsFetch('/announcements');
  if (!response.ok) return [];
  return response.json();
}

async function fetchEvents() {
  const response = await emrsFetch('/events');
  if (!response.ok) return [];
  return response.json();
}

async function fetchStaff() {
  const response = await emrsFetch('/staff');
  if (!response.ok) return [];
  return response.json();
}

function renderAnnouncements(items) {
  const holder = document.getElementById('announcement-block');
  if (!holder) return;
  holder.innerHTML = items.map(item => `\n    <div class="announcement-item">\n      <h5>${item.message}</h5>\n      <p>${item.link ? `<a href='${item.link}' target='_blank'>More</a>` : ''}</p>\n    </div>`).join('\n');
}

function renderEvents(items) {
  const holder = document.getElementById('events-block');
  if (!holder) return;
  holder.innerHTML = items.slice(0,4).map(e => `\n    <div class='col-md-3'>\n      <img src='${normalizeMediaUrl(e.image_url) || "WriteReadData/MD32145/events.jpg"}' class='img-fluid' />\n      <h6>${e.title}</h6>\n      <small>${e.event_date}</small>\n    </div>`).join('');
}

function normalizeMediaUrl(url) {
  if (!url) return '';
  
  // Handle full URLs and GridFS API paths
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/api/files/')) {
    return url;
  }
  
  // Handle root paths
  if (url.startsWith('/')) {
    return url;
  }
  
  // Handle WriteReadData, images, and assets
  if (url.startsWith('WriteReadData/') || url.startsWith('images/') || url.startsWith('assets/')) {
    return `/${url}`;
  }
  
  // Handle old /uploads paths
  return `/uploads/${url}`;
}

function renderStaff(items) {
  const holder = document.getElementById('staff-block');
  if (!holder) return;
  holder.innerHTML = items.slice(0,6).map(s => `\n    <div class='col-md-2 text-center pb-2'>\n      <img src='${normalizeMediaUrl(s.photo_url) || "images/teacher-placeholder.png"}' class='img-fluid rounded-circle mb-1' style='max-height:100px;'/>\n      <strong>${s.name}</strong>\n      <p>${s.role}</p>\n    </div>`).join('');
}

async function initDynamicContent() {
  const [announcements, events, staff] = await Promise.all([fetchAnnouncements(), fetchEvents(), fetchStaff()]);
  renderAnnouncements(announcements);
  renderEvents(events);
  renderStaff(staff);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initDynamicContent().catch(console.error);
  });
}
