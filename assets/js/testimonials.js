// ============================================
// TESTIMONIALS PAGE - JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    initializeTestimonialsPage();
});

let testimonialsCache = [];

async function initializeTestimonialsPage() {
    await loadTestimonials();
    setupEventListeners();
}

function testimonialPhotoUrl(test) {
    return alumniAPI.normalizeMediaUrl(test.photo_url || test.image_url || test.photo || '');
}

function testimonialBatchLabel(test) {
    return test.batch_year || test.batch || 'N/A';
}

async function loadTestimonials() {
    try {
        const testimonials = await alumniAPI.getApprovedTestimonials();
        testimonialsCache = Array.isArray(testimonials) ? testimonials : [];
        displayTestimonialsCarousel(testimonials);
    } catch (error) {
        console.error('Error loading testimonials:', error);
        const carousel = document.getElementById('testimonialsCarousel');
        if (carousel) {
            carousel.innerHTML = '<div class="text-danger">Error loading testimonials</div>';
        }
    }
}

function displayTestimonialsCarousel(testimonials) {
    const carousel = document.getElementById('testimonialsCarousel');
    if (!carousel) return;

    if (!testimonials || testimonials.length === 0) {
        carousel.innerHTML = '<div class="text-center text-muted">No testimonials yet</div>';
        return;
    }

    carousel.innerHTML = testimonials.map((test, index) => {
        const name = test.name || 'Alumni';
        const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase();
        const photo = testimonialPhotoUrl(test);
        const msg = test.message || 'Amazing experience at EMRS Dornala';

        return `
        <div class="testimonial-card">
            <div class="quote-icon">
                <i class="fas fa-quote-left"></i>
            </div>
            <div class="testimonial-header">
                <p class="testimonial-quote" role="button" tabindex="0" onclick="openTestimonialPopup(${index})" onkeydown="if(event.key==='Enter'){openTestimonialPopup(${index});}">
                    "${escapeHtml(msg)}"
                </p>
            </div>
            <div class="testimonial-footer">
                <div class="testimonial-avatar">
                    ${photo ? `<img src="${photo}" alt="${name}">` : initials}
                </div>
                <div class="testimonial-author">
                    <div class="testimonial-name">${escapeHtml(name)}</div>
                    <div class="testimonial-batch">Batch ${testimonialBatchLabel(test)}</div>
                </div>
            </div>
        </div>
    `;
    }).join('');

    if (window.$ && $(carousel).owlCarousel) {
        const shouldLoop = testimonials.length > 3;
        $(carousel).owlCarousel({
            loop: shouldLoop,
            rewind: !shouldLoop,
            margin: 30,
            nav: true,
            dots: true,
            autoplay: true,
            autoplayTimeout: 5000,
            autoplaySpeed: 900,
            smartSpeed: 900,
            rtl: false,
            responsive: {
                0: { items: 1 },
                768: { items: 2 },
                1200: { items: 3 }
            }
        });
    }
}

function displayTestimonialsGrid(testimonials) {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    if (!testimonials || testimonials.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><i class="fas fa-comments" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem; display: block;"></i><p style="font-size: 1.125rem; color: var(--text-secondary);">No testimonials yet. Be the first to share your story!</p></div>';
        return;
    }

    grid.innerHTML = testimonials.map((test) => {
        const name = test.name || 'Alumni';
        const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase();
        const photo = testimonialPhotoUrl(test);

        return `
        <div class="testimonial-card">
            <div class="quote-icon">
                <i class="fas fa-quote-left"></i>
            </div>
            <div class="testimonial-header">
                <p class="testimonial-quote">
                    "${truncateText(test.message || 'Great experience', 150)}"
                </p>
            </div>
            <div class="testimonial-footer">
                <div class="testimonial-avatar">
                    ${photo ? `<img src="${photo}" alt="${name}">` : initials}
                </div>
                <div class="testimonial-author">
                    <div class="testimonial-name">${name}</div>
                    <div class="testimonial-batch">Batch ${testimonialBatchLabel(test)}</div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function setupEventListeners() {
    const form = document.getElementById('testimonialForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
        }

        try {
            const payload = {
                name: document.getElementById('testName')?.value || '',
                batch: document.getElementById('testBatch')?.value || '',
                email: document.getElementById('testEmail')?.value || '',
                message: document.getElementById('testMessage')?.value || ''
            };

            const photo = document.getElementById('testPhoto')?.files?.[0];
            const fd = new FormData();
            Object.keys(payload).forEach((key) => fd.append(key, payload[key]));
            if (photo) fd.append('photo', photo);

            await alumniAPI.submitTestimonial(fd);
            alert('Thank you! Your testimonial has been submitted for review.');
            form.reset();
        } catch (error) {
            console.error('Error submitting testimonial:', error);
            alert('Unable to submit testimonial right now. Please try again later.');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane" style="margin-right: 0.5rem;"></i>Submit Testimonial';
            }
        }
    });
}

function truncateText(text, length) {
    if (!text || text.length <= length) return text || '';
    return text.substring(0, length) + '...';
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function openTestimonialPopup(index) {
    const item = testimonialsCache[index];
    if (!item) return;

    const name = item.name || 'Alumni';
    const message = item.message || 'Amazing experience at EMRS Dornala';
    const batch = testimonialBatchLabel(item);
    const photo = testimonialPhotoUrl(item);

    const modalBody = document.getElementById('testimonialDetailBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
            <div class="testimonial-avatar" style="width:56px; height:56px;">
                ${photo ? `<img src="${photo}" alt="${escapeHtml(name)}">` : escapeHtml(name.charAt(0).toUpperCase())}
            </div>
            <div>
                <div style="font-weight:700; font-size:1.05rem;">${escapeHtml(name)}</div>
                <div style="color:var(--text-secondary); font-size:0.9rem;">Batch ${escapeHtml(batch)}</div>
            </div>
        </div>
        <div style="font-size:1rem; line-height:1.8; color:var(--text-primary);">"${escapeHtml(message)}"</div>
    `;

    if (window.$ && $('#testimonialDetailModal').length) {
        $('#testimonialDetailModal').modal('show');
    }
}
