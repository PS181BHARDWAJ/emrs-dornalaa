// ============================================
// NOTABLE ALUMNI PAGE - JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeAlumniPage();
});

async function initializeAlumniPage() {
    loadAlumni();
    loadBatchFilter();
    setupEventListeners();
}

// Load alumni data
async function loadAlumni(filterBatch = '', searchTerm = '') {
    try {
        const alumni = await alumniAPI.getAllAlumni();
        
        // Filter data
        let filteredAlumni = alumni.filter(a => {
            const matchesBatch = !filterBatch || a.batch_year == filterBatch;
            const matchesSearch = !searchTerm || 
                (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.company || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesBatch && matchesSearch;
        });
        
        displayAlumniCards(filteredAlumni);
    } catch (error) {
        console.error('Error loading alumni:', error);
        document.getElementById('alumniGrid').innerHTML = '<div class="col-12"><p class="text-danger">Error loading alumni data</p></div>';
    }
}

// Display alumni cards
function displayAlumniCards(alumni) {
    const grid = document.getElementById('alumniGrid');
    
    if (!alumni || alumni.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><div style="font-size: 1.125rem; color: var(--text-secondary);"><i class="fas fa-search" style="font-size: 2rem; color: var(--text-tertiary); margin-bottom: 1rem; display: block;"></i>No alumni found matching your search</div></div>';
        return;
    }
    
    grid.innerHTML = alumni.map(alumnus => {
        const name = alumnus.name || 'Alumnus';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        const photoUrl = alumniAPI.normalizeMediaUrl(alumnus.photo_url);
        const hasPhoto = !!photoUrl;
        
        return `
        <div class="alumni-card">
            <div class="alumni-avatar" style="position: relative;">
                ${alumnus.is_featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
                ${hasPhoto ? `<img src="${photoUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div class="alumni-avatar-initials">${initials}</div>`}
            </div>
            <div class="alumni-content">
                <h3 class="alumni-name">${name}</h3>
                <div class="alumni-role">${alumnus.current_role || 'Professional'}</div>
                <div class="alumni-company">
                    <i class="fas fa-building" style="margin-right: 0.5rem;"></i>${alumnus.company || 'Not specified'}
                </div>
                <div class="alumni-batch">
                    <i class="fas fa-graduation-cap" style="margin-right: 0.25rem;"></i>Batch ${alumnus.batch_year}
                </div>
                <div class="alumni-description">
                    ${alumnus.success_story ? truncateText(alumnus.success_story, 120) : 'An accomplished graduate of EMRS Dornala'}
                </div>
                <div class="alumni-actions">
                    <button class="alumni-btn alumni-btn-primary" onclick="viewAlumniDetails('${alumnus.id || ''}')">
                        <i class="fas fa-arrow-right" style="margin-right: 0.5rem;"></i>View Profile
                    </button>
                    <button class="alumni-btn alumni-btn-secondary" onclick="shareAlumni('${alumnus.id || ''}', '${name}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// Load batch filter options
async function loadBatchFilter() {
    try {
        const alumni = await alumniAPI.getAllAlumni();
        const batches = [...new Set(alumni.map(a => a.batch_year))].sort((a, b) => b - a);
        
        const filterElement = document.getElementById('batchFilter');
        if (filterElement) {
            filterElement.innerHTML = '<option value="">Filter by Batch Year</option>' +
                batches.map(batch => `<option value="${batch}">${batch}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading batch filter:', error);
    }
}

// View alumnus details in modal
async function viewAlumniDetails(id) {
    try {
        const alumnus = await alumniAPI.getAlumni(id);
        if (!alumnus) {
            throw new Error('Alumni profile not found');
        }
        const detailPhoto = alumniAPI.normalizeMediaUrl(alumnus.photo_url);
        const detailName = alumnus.name || 'Alumnus';
        
        const modalBody = document.getElementById('alumniModalBody');
        modalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
                <div>
                    <div style="width: 100%; border-radius: 0.875rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 1.5rem;">
                        ${detailPhoto ? `<img src="${detailPhoto}" alt="${detailName}" style="width: 100%; height: auto; display: block; object-fit: cover;">` : `<div style="width: 100%; padding: 3rem; background: linear-gradient(135deg, #eef2ff 0%, rgba(99, 102, 241, 0.05) 100%); display: flex; align-items: center; justify-content: center; font-size: 4rem; color: #6366f1; font-weight: 700;">${detailName.split(' ').map(n => n[0]).join('')}</div>`}
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 0.875rem; text-align: center;">
                        <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Batch Year</div>
                        <div style="font-size: 1.25rem; color: var(--primary); font-weight: 600;">${alumnus.batch_year}</div>
                    </div>
                </div>
                <div>
                    <h2 style="font-size: 1.875rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">${detailName}</h2>
                    <div style="font-size: 1.125rem; color: var(--primary); margin-bottom: 1.5rem; font-weight: 600;">
                        <i class="fas fa-briefcase" style="margin-right: 0.5rem;"></i>${alumnus.current_role || 'Professional'}
                    </div>
                    
                    <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--primary);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Company</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${alumnus.company || 'Not specified'}</div>
                        </div>
                        
                        ${alumnus.location ? `
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--success);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;"><i class="fas fa-map-marker-alt" style="margin-right: 0.5rem;"></i>Location</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${alumnus.location}</div>
                        </div>
                        ` : ''}
                        
                        ${alumnus.email ? `
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--warning);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;"><i class="fas fa-envelope" style="margin-right: 0.5rem;"></i>Email</div>
                            <div style="color: var(--primary); word-break: break-all;"><a href="mailto:${alumnus.email}" style="color: var(--primary); text-decoration: none; font-weight: 600;">${alumnus.email}</a></div>
                        </div>
                        ` : ''}
                        
                        ${alumnus.linkedin_url ? `
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid #0a66c2;">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;"><i class="fab fa-linkedin" style="margin-right: 0.5rem;"></i>LinkedIn</div>
                            <a href="${alumnus.linkedin_url}" target="_blank" style="color: #0a66c2; text-decoration: none; font-weight: 600;">View Profile <i class="fas fa-external-link-alt" style="margin-left: 0.5rem;"></i></a>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${alumnus.success_story ? `
                    <div>
                        <h4 style="font-weight: 700; color: var(--text-primary); margin-bottom: 1rem;">Success Story</h4>
                        <p style="color: var(--text-secondary); line-height: 1.8;">${alumnus.success_story}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        $('#alumniModal').modal('show');
    } catch (error) {
        console.error('Error loading alumni details:', error);
        alert('Error loading alumni details');
    }
}

// Share alumni profile
function shareAlumni(id, name) {
    const url = window.location.href;
    const text = `Check out this amazing alumnus from EMRS Dornala: ${name}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'EMRS Dornala Alumni',
            text: text,
            url: url
        }).catch(err => console.log('Share error:', err));
    } else {
        // Fallback: copy to clipboard
        const shareText = `${text}\n${url}`;
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Alumni profile link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('alumniSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const batch = document.getElementById('batchFilter')?.value || '';
            loadAlumni(batch, e.target.value);
        }, 300));
    }
    
    // Filter functionality
    const batchFilter = document.getElementById('batchFilter');
    if (batchFilter) {
        batchFilter.addEventListener('change', function(e) {
            const search = document.getElementById('alumniSearch')?.value || '';
            loadAlumni(e.target.value, search);
        });
    }
}

// Utility functions
function truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
