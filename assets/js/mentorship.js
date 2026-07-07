// ============================================
// MENTORSHIP PROGRAM PAGE - JAVASCRIPT
// ============================================

let currentMentorId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeMentorshipPage();
});

async function initializeMentorshipPage() {
    loadMentors();
    setupEventListeners();
}

// Load mentors
async function loadMentors(filterExpertise = '', searchTerm = '') {
    try {
        const mentors = await alumniAPI.getAllMentors();
        
        // Filter mentors
        let filteredMentors = mentors.filter(m => {
            const matchesExpertise = !filterExpertise || m.expertise === filterExpertise;
            const matchesSearch = !searchTerm || 
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.company.toLowerCase().includes(searchTerm.toLowerCase());
            return m.is_approved && matchesExpertise && matchesSearch;
        });
        
        displayMentorCards(filteredMentors);
    } catch (error) {
        console.error('Error loading mentors:', error);
        document.getElementById('mentorsGrid').innerHTML = '<div class="col-12"><p class="text-danger">Error loading mentors</p></div>';
    }
}

// Display mentor cards
function displayMentorCards(mentors) {
    const grid = document.getElementById('mentorsGrid');
    const noMsg = document.getElementById('noMentorsMsg');
    
    if (!mentors || mentors.length === 0) {
        grid.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    
    noMsg.style.display = 'none';
    grid.innerHTML = mentors.map(mentor => {
        const initials = mentor.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const hasPhoto = mentor.photo_url && mentor.photo_url.trim();
        const availability = mentor.availability || 5;
        const expertiseArray = Array.isArray(mentor.expertise) ? mentor.expertise : [mentor.expertise];
        
        let availabilityStatus = 'available';
        let availabilityText = 'Available';
        if (availability < 2) {
            availabilityStatus = 'unavailable';
            availabilityText = 'Not Available';
        } else if (availability < 5) {
            availabilityStatus = 'busy';
            availabilityText = 'Busy';
        }
        
        return `
        <div class="mentor-card">
            <div class="mentor-avatar" style="position: relative;">
                <span class="availability-badge ${availabilityStatus}">
                    <span class="availability-dot"></span>
                    ${availabilityText}
                </span>
                ${hasPhoto ? `<img src="${mentor.photo_url}" alt="${mentor.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div class="mentor-avatar-initials">${initials}</div>`}
            </div>
            <div class="mentor-content">
                <h3 class="mentor-name">${mentor.name}</h3>
                <div class="mentor-title">${mentor.title || mentor.expertise[0] || 'Professional'}</div>
                <div class="mentor-company">
                    <i class="fas fa-building" style="margin-right: 0.5rem;"></i>${mentor.company || 'Not specified'}
                </div>
                
                <div class="expertise-tags">
                    ${expertiseArray.slice(0, 2).map(exp => `
                        <span class="expertise-tag">${exp}</span>
                    `).join('')}
                </div>
                
                <div class="mentor-bio">
                    ${mentor.bio ? truncateText(mentor.bio, 120) : 'A mentoring professional ready to guide you'}
                </div>
                
                <div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--radius-md);">
                    <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem; text-transform: uppercase;">Experience</div>
                    <div style="color: var(--text-primary); font-weight: 700;">${mentor.experience || 5} years</div>
                </div>
                
                <div class="mentor-actions">
                    <button class="mentor-btn mentor-btn-primary" onclick="viewMentorProfile('${mentor.id}')">
                        <i class="fas fa-arrow-right" style="margin-right: 0.5rem;"></i>View Profile
                    </button>
                    <button class="mentor-btn mentor-btn-secondary" onclick="requestMentorship('${mentor.id}', '${mentor.name}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// View mentor profile and request mentorship
async function viewMentorProfile(id) {
    try {
        const mentor = await alumniAPI.getMentor(id);
        currentMentorId = id;
        
        const modalBody = document.getElementById('mentorModalBody');
        const bioText = mentor.bio || 'No bio available';
        const initials = mentor.name.split(' ').map(n => n[0]).join('');
        
        modalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
                <div>
                    <div style="border-radius: 0.875rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 1.5rem; aspect-ratio: 1;">
                        ${mentor.photo_url ? `<img src="${mentor.photo_url}" alt="${mentor.name}" style="width: 100%; height: 100%; display: block; object-fit: cover;">` : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #eef2ff 0%, rgba(99, 102, 241, 0.05) 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #6366f1; font-weight: 700;">${initials}</div>`}
                    </div>
                    <button class="mentor-btn mentor-btn-primary" style="width: 100%; margin-bottom: 0.75rem;" onclick="requestMentorship('${id}', '${mentor.name}')">
                        <i class="fas fa-handshake" style="margin-right: 0.5rem;"></i>Request Mentorship
                    </button>
                    <button class="mentor-btn mentor-btn-secondary" style="width: 100%;" onclick="sendMessage('${id}')">
                        <i class="fas fa-envelope" style="margin-right: 0.5rem;"></i>Send Message
                    </button>
                </div>
                <div>
                    <h2 style="font-size: 1.875rem; font-weight: 700; margin-bottom: 0.5rem;">${mentor.name}</h2>
                    <div style="font-size: 1.125rem; color: var(--primary); margin-bottom: 1.5rem; font-weight: 600;">
                        <i class="fas fa-briefcase" style="margin-right: 0.5rem;"></i>${mentor.title || mentor.expertise || 'Professional'}
                    </div>
                    <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--primary);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Company</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${mentor.company || 'Not specified'}</div>
                        </div>
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--success);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Batch Year</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${mentor.batch_year}</div>
                        </div>
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; border-left: 4px solid var(--warning);">
                            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Experience</div>
                            <div style="color: var(--text-primary); font-weight: 600;">${mentor.experience || 5} years</div>
                        </div>
                    </div>
                    <div>
                        <h4 style="font-weight: 700; margin-bottom: 1rem;">About</h4>
                        <p style="color: var(--text-secondary); line-height: 1.8;">${bioText}</p>
                    </div>
                    <div style="padding: 1rem; background: var(--primary-light); border-radius: 0.75rem; margin-top: 1.5rem;">
                        <div style="font-weight: 600; color: var(--primary);"><i class="fas fa-clock" style="margin-right: 0.5rem;"></i>Availability</div>
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">${mentor.availability || 5} hours/week</div>
                    </div>
                </div>
            </div>
        `;
        
        $('#mentorModal').modal('show');
    } catch (error) {
        console.error('Error loading mentor profile:', error);
        alert('Error loading mentor profile');
    }
}
    function truncateText(text, length) {
        if (!text || text.length <= length) return text || '';
        return text.substring(0, length) + '...';
    }

    function requestMentorship(mentorId, mentorName) {
        if (confirm(`Are you sure you want to request mentorship from ${mentorName}?`)) {
            console.log('Mentorship request sent to:', mentorId);
            alert('Your mentorship request has been sent! The mentor will review and respond to your request soon.');
            $('#mentorModal').modal('hide');
        }
    }
// Request mentorship
    function sendMessage(mentorId) {
        alert('Message feature coming soon! You can reach out to the mentor via email for now.');
    }
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'requestMentorshipBtn') {
        if (!currentMentorId) {
            alert('Please select a mentor');
            return;
        }
        
        const studentName = prompt('Enter your name:');
        if (!studentName) return;
        
        const studentEmail = prompt('Enter your email:');
        if (!studentEmail) return;
        
        const studentPhone = prompt('Enter your phone number:');
        if (!studentPhone) return;
        
        const requestReason = prompt('Why do you want this mentorship? (Brief description):');
        if (!requestReason) return;
        
        submitMentorshipRequest(currentMentorId, {
            student_name: studentName,
            student_email: studentEmail,
            student_phone: studentPhone,
            request_reason: requestReason
        });
    }
});

// Submit mentorship request
async function submitMentorshipRequest(mentorId, studentData) {
    try {
        const result = await alumniAPI.requestMentorship(mentorId, studentData);
        alert('Your mentorship request has been sent to the mentor. They will contact you soon!');
        $('#mentorModal').modal('hide');
    } catch (error) {
        console.error('Error submitting mentorship request:', error);
        alert('Error submitting mentorship request. Please try again.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Expertise filter
    const expertiseFilter = document.getElementById('expertiseFilter');
    if (expertiseFilter) {
        expertiseFilter.addEventListener('change', function(e) {
            const search = document.getElementById('mentorSearch')?.value || '';
            loadMentors(e.target.value, search);
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('mentorSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const expertise = document.getElementById('expertiseFilter')?.value || '';
            loadMentors(expertise, e.target.value);
        }, 300));
    }
    
    // Mentor registration form
    const mentorForm = document.getElementById('mentorRegistrationForm');
    if (mentorForm) {
        mentorForm.addEventListener('submit', handleMentorRegistration);
    }
}

// Handle mentor registration
async function handleMentorRegistration(e) {
    e.preventDefault();
    
    try {
        const formData = {
            name: document.getElementById('mentorName').value,
            email: document.getElementById('mentorEmail').value,
            phone: document.getElementById('mentorPhone').value,
            batch_year: document.getElementById('mentorBatch').value,
            company: document.getElementById('mentorCompany').value,
            expertise: document.getElementById('mentorExpertise').value,
            experience: parseInt(document.getElementById('mentorExperience').value),
            availability: parseInt(document.getElementById('mentorAvailability').value),
            bio: document.getElementById('mentorBio').value
        };
        
        const formDataObj = new FormData();
        Object.keys(formData).forEach(key => {
            formDataObj.append(key, formData[key]);
        });
        
        // Add photo if exists
        const photoInput = document.getElementById('mentorPhoto');
        if (photoInput && photoInput.files.length > 0) {
            formDataObj.append('photo', photoInput.files[0]);
        }
        
        const result = await alumniAPI.registerMentor(formDataObj);
        
        alert('Your mentor application has been submitted! Our admin team will review it and contact you soon.');
        e.target.reset();
    } catch (error) {
        console.error('Error submitting mentor registration:', error);
        alert('Error submitting mentor application. Please try again.');
    }
}

// Utility functions
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
