// ============================================
// ALUMNI API INTEGRATION
// ============================================

const alumniAPI = {
    baseHost: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8000'
        : 'https://emrs-dornalaa.onrender.com',

    get baseURL() {
        return `${this.baseHost}/api`;
    },

    get mediaBaseURL() {
        return this.baseURL.replace(/\/api\/?$/, '');
    },

    toFormData(data) {
        if (data instanceof FormData) return data;
        const formData = new FormData();
        Object.keys(data || {}).forEach((key) => {
            const value = data[key];
            if (Array.isArray(value)) {
                value.forEach((item) => formData.append(key, item));
            } else if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
        return formData;
    },

    normalizeMediaUrl(url) {
        if (!url) return '';
        const value = String(url).trim();
        if (!value) return '';
        if (value.startsWith('http://') || value.startsWith('https://')) return value;
        if (value.startsWith('/')) return `${this.mediaBaseURL}${value}`;
        return `${this.mediaBaseURL}/uploads/${value.replace(/^\/+/, '')}`;
    },

    normalizeAlumnus(item) {
        if (!item) return item;
        return {
            ...item,
            photo_url: this.normalizeMediaUrl(item.photo_url || item.photo || item.image_url || '')
        };
    },

    normalizeEvent(item) {
        if (!item) return item;
        const normalizedImages = Array.isArray(item.images)
            ? item.images.map((img) => {
                if (typeof img === 'string') {
                    return this.normalizeMediaUrl(img);
                }
                const raw = img?.url || img?.image_url || img?.path || '';
                return {
                    ...img,
                    url: this.normalizeMediaUrl(raw)
                };
            })
            : [];

        return {
            ...item,
            image_url: this.normalizeMediaUrl(item.image_url || item.banner_image || item.image || ''),
            images: normalizedImages
        };
    },

    normalizeTestimonial(item) {
        if (!item) return item;
        return {
            ...item,
            batch_year: item.batch_year || item.batch || '',
            photo_url: this.normalizeMediaUrl(item.photo_url || item.photo || item.image_url || '')
        };
    },

    async requestFirstJson(paths, options = {}) {
        let lastError = null;
        for (const path of paths) {
            try {
                const response = await fetch(`${this.baseURL}${path}`, options);
                if (!response.ok) {
                    if (response.status === 404) {
                        lastError = new Error(`404 for ${path}`);
                        continue;
                    }
                    const err = await response.text();
                    throw new Error(`Request failed (${response.status}): ${err || path}`);
                }
                return await response.json();
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error('No endpoint available');
    },

    authHeaders(json = false) {
        const token = localStorage.getItem('emrs_token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        if (json) headers['Content-Type'] = 'application/json';
        return headers;
    },

    // ============================================
    // ALUMNI ENDPOINTS
    // ============================================

    async getAllAlumni() {
        try {
            const list = await this.requestFirstJson(['/alumni', '/alumni/all']);
            return Array.isArray(list) ? list.map((item) => this.normalizeAlumnus(item)) : [];
        } catch (error) {
            console.error('Error fetching alumni:', error);
            return [];
        }
    },

    async getAlumni(id) {
        try {
            const data = await this.requestFirstJson([`/alumni/${id}`]);
            return this.normalizeAlumnus(data);
        } catch (error) {
            console.error('Error fetching alumni:', error);
            return null;
        }
    },

    async createAlumni(data) {
        try {
            const formData = this.toFormData(data);
            const response = await fetch(`${this.baseURL}/alumni`, {
                method: 'POST',
                headers: this.authHeaders(),
                body: formData
            });
            if (!response.ok) throw new Error('Failed to create alumni');
            return await response.json();
        } catch (error) {
            console.error('Error creating alumni:', error);
            throw error;
        }
    },

    async updateAlumni(id, data) {
        try {
            const formData = this.toFormData(data);
            const response = await fetch(`${this.baseURL}/alumni/${id}`, {
                method: 'PUT',
                headers: this.authHeaders(),
                body: formData
            });
            if (!response.ok) throw new Error('Failed to update alumni');
            return await response.json();
        } catch (error) {
            console.error('Error updating alumni:', error);
            throw error;
        }
    },

    async deleteAlumni(id) {
        try {
            const response = await fetch(`${this.baseURL}/alumni/${id}`, {
                method: 'DELETE',
                headers: this.authHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete alumni');
            return true;
        } catch (error) {
            console.error('Error deleting alumni:', error);
            throw error;
        }
    },

    // ============================================
    // ALUMNI EVENTS ENDPOINTS
    // ============================================

    async getAllEvents() {
        try {
            const list = await this.requestFirstJson(['/alumni-events', '/alumni-events/all']);
            return Array.isArray(list) ? list.map((item) => this.normalizeEvent(item)) : [];
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    },

    async getEvent(id) {
        try {
            const data = await this.requestFirstJson([`/alumni-events/${id}`]);
            return this.normalizeEvent(data);
        } catch (error) {
            console.error('Error fetching event:', error);
            return null;
        }
    },

    async createEvent(data) {
        try {
            const formData = this.toFormData(data);
            const response = await fetch(`${this.baseURL}/alumni-events`, {
                method: 'POST',
                headers: this.authHeaders(),
                body: formData
            });
            if (!response.ok) throw new Error('Failed to create event');
            return await response.json();
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    async updateEvent(id, data) {
        try {
            const formData = this.toFormData(data);
            const response = await fetch(`${this.baseURL}/alumni-events/${id}`, {
                method: 'PUT',
                headers: this.authHeaders(),
                body: formData
            });
            if (!response.ok) throw new Error('Failed to update event');
            return await response.json();
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    async deleteEvent(id) {
        try {
            const response = await fetch(`${this.baseURL}/alumni-events/${id}`, {
                method: 'DELETE',
                headers: this.authHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete event');
            return true;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    },

    // ============================================
    // TESTIMONIALS ENDPOINTS
    // ============================================

    async getAllTestimonials() {
        try {
            const list = await this.requestFirstJson(['/testimonials/all', '/testimonials']);
            return Array.isArray(list) ? list.map((item) => this.normalizeTestimonial(item)) : [];
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            return [];
        }
    },

    async getApprovedTestimonials() {
        try {
            const list = await this.requestFirstJson([
                '/testimonials?approved=true',
                '/testimonials/approved',
                '/testimonials/all',
                '/testimonials'
            ]);
            if (!Array.isArray(list)) return [];

            const normalized = list.map((item) => this.normalizeTestimonial(item));
            return normalized.filter((item) => {
                if (item.is_approved === true || item.approved === true) return true;
                const status = String(item.status || '').toLowerCase();
                if (!status) return true;
                return status === 'approved' || status === 'active' || status === 'published';
            });
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            return [];
        }
    },

    async getTestimonial(id) {
        try {
            const data = await this.requestFirstJson([`/testimonials/${id}`]);
            return this.normalizeTestimonial(data);
        } catch (error) {
            console.error('Error fetching testimonial:', error);
            return null;
        }
    },

    async submitTestimonial(data) {
        try {
            const formData = this.toFormData(data);
            const response = await fetch(`${this.baseURL}/testimonials`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Failed to submit testimonial');
            return await response.json();
        } catch (error) {
            console.error('Error submitting testimonial:', error);
            throw error;
        }
    }
};
