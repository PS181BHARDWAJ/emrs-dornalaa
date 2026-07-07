# Alumni Module Documentation

## Overview
The Alumni Module is a comprehensive system for managing and displaying alumni information, events, mentorship programs, and testimonials for EMRS Dornala. It includes both public-facing pages and an admin dashboard for managing content.

## Features

### 1. Public Pages

#### Notable Alumni (`/alumni.html`)
- Display alumni profiles in card format
- Search by name with real-time filtering
- Filter by batch year
- View detailed alumni profiles in modal
- Features alumni can showcase (with "Featured" badge)
- Information displayed:
  - Photo
  - Name
  - Batch year
  - Current role
  - Company/Organization
  - Success story
  - Location, email, LinkedIn profile

#### Alumni Events (`/alumni-events.html`)
- Show upcoming and past events
- Filter between upcoming/past events
- Event cards display:
  - Event image
  - Title, date, location
  - Description
  - Number of participants
- Modal view with full event details and gallery

#### Mentorship Program (`/mentorship.html`)
- **Browse Mentors Tab:**
  - Filter by expertise (AI/ML, Government Jobs, Business, Higher Education, etc.)
  - Search mentors by name/company
  - View mentor profiles with:
    - Photo, name, batch year
    - Expertise and experience
    - Company information
    - Availability (hours/week)
    - Bio

- **Become a Mentor Tab:**
  - Registration form for alumni to become mentors
  - Collect essential information
  - Photo upload capability
  - Approval workflow (admin approval required)

#### Testimonials (`/testimonials.html`)
- Carousel display of testimonials
- Grid view of approved testimonials
- Each testimonial includes:
  - Quote-styled message
  - Author name and batch year
  - Author photo
- "Share Your Story" form for alumni to submit testimonials
- Admin approval workflow for published testimonials

### 2. Admin Dashboard (`/admin-dashboard.html`)

Comprehensive admin panel with an **Alumni Module** sidebar dropdown for managing all alumni content:

#### Alumni Tab
- List all alumni with:
  - Name, batch, current role, company
  - Featured status
  - Edit/Delete actions
- Add new alumni with form
- Edit existing alumni details
- Delete alumni records
- Mark alumni as featured

#### Events Tab
- List all events with date, location, featured status
- Add new events with:
  - Title, date, location
  - Description
  - Multiple image upload
  - Featured status
- Edit event details
- Delete events

#### Mentors & Requests Tab
- View approved mentors
- View pending mentor applications
- Approve/reject mentor requests
- View full mentor details
- Track mentorship requests from students

#### Testimonials Tab
- View approved testimonials
- View pending testimonial submissions
- Approve/reject testimonials before publication
- Delete testimonials

## File Structure

```
Project Root
├── alumni.html                          # Notable Alumni page
├── alumni-events.html                   # Alumni Events page
├── mentorship.html                      # Mentorship Program page
├── testimonials.html                    # Testimonials page
├── admin-dashboard.html                 # Main Admin Dashboard (includes Alumni Module dropdown)
│
├── assets/
│   ├── css/
│   │   └── alumni.css                   # Alumni module styling
│   │
│   └── js/
│       ├── alumni-api.js                # API integration functions
│       ├── alumni.js                    # Notable Alumni page logic
│       ├── alumni-events.js             # Alumni Events page logic
│       ├── mentorship.js                # Mentorship page logic
│       └── testimonials.js              # Testimonials page logic
│
└── backend/
   └── app/routes/alumni.py            # Alumni module APIs (CRUD + approvals)
```

## API Integration

The module uses the following API endpoints (all require authentication token):

### Alumni Endpoints
- `GET /api/alumni` - Get all alumni
- `GET /api/alumni/{id}` - Get single alumni
- `POST /api/alumni` - Create alumni (admin)
- `PUT /api/alumni/{id}` - Update alumni (admin)
- `DELETE /api/alumni/{id}` - Delete alumni (admin)

### Events Endpoints
- `GET /api/alumni-events` - Get all events
- `GET /api/alumni-events/{id}` - Get single event
- `POST /api/alumni-events` - Create event (admin)
- `PUT /api/alumni-events/{id}` - Update event (admin)
- `DELETE /api/alumni-events/{id}` - Delete event (admin)

### Mentorship Endpoints
- `GET /api/mentors` - Get all approved mentors
- `GET /api/mentors/{id}` - Get mentor details
- `POST /api/mentors` - Register as mentor (public)
- `PUT /api/mentors/{id}/approve` - Approve mentor (admin)
- `PUT /api/mentors/{id}/reject` - Reject mentor (admin)
- `POST /api/mentorship-requests` - Request mentorship (public)

### Testimonials Endpoints
- `GET /api/testimonials` - Get all testimonials
- `GET /api/testimonials?approved=true` - Get approved testimonials
- `GET /api/testimonials/{id}` - Get single testimonial
- `POST /api/testimonials` - Submit testimonial (public)
- `PUT /api/testimonials/{id}/approve` - Approve testimonial (admin)
- `PUT /api/testimonials/{id}/reject` - Reject testimonial (admin)
- `DELETE /api/testimonials/{id}` - Delete testimonial (admin)

## Authentication

The admin dashboard requires authentication via token stored in localStorage:
```javascript
localStorage.getItem('emrs_token')
```

The token is obtained from `/api/auth/login` endpoint after successful admin login.

## Design Features

### Responsive Design
- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interface elements

### Card-Based Layout
- Modern card design with hover effects
- Smooth animations and transitions
- Clean typography and spacing

### Color Scheme
- Primary Color: `#9e271f` (School red)
- Secondary Color: `#1a1a1a` (Dark)
- Light Background: `#f8f9fa`
- Text Dark: `#333`
- Text Light: `#666`

### Interactive Elements
- Search and filter functionality
- Modal dialogs for detailed views
- Carousel for testimonials
- Form validation
- Success/error notifications

## Database Schema Requirements

### Alumni Table
```
- id (UUID)
- name (string)
- batch_year (integer)
- current_role (string)
- company (string)
- location (string)
- email (string)
- photo_url (string)
- success_story (text)
- linkedin_url (string)
- is_featured (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Events Table
```
- id (UUID)
- title (string)
- date (datetime)
- time (string)
- location (string)
- description (text)
- image_url (string)
- images (json array)
- participants_count (integer)
- is_featured (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Mentors Table
```
- id (UUID)
- name (string)
- batch_year (integer)
- email (string)
- phone (string)
- company (string)
- expertise (string)
- experience (integer)
- availability (integer) # hours per week
- photo_url (string)
- bio (text)
- is_approved (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Testimonials Table
```
- id (UUID)
- name (string)
- batch (string)
- email (string)
- message (text)
- photo_url (string)
- is_approved (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Mentorship Requests Table
```
- id (UUID)
- mentor_id (foreign key)
- student_name (string)
- student_email (string)
- student_phone (string)
- request_reason (text)
- status (enum: pending, accepted, rejected)
- created_at (timestamp)
- updated_at (timestamp)
```

## Backend Setup Requirements

The module expects a FastAPI/Python backend server running on `http://localhost:5000` with the following configuration:

1. CORS enabled for frontend requests
2. JWT token authentication
3. File upload handling for images
4. MongoDB collections for the entities defined above
5. API endpoints as documented

## How to Use

### For End Users (Public Pages)

1. **View Notable Alumni:**
   - Navigate to Alumni > Notable Alumni
   - Search by name or filter by batch year
   - Click "View More" to see full alumni profile

2. **Attend/View Alumni Events:**
   - Go to Alumni > Alumni Events
   - Switch between upcoming and past events
   - View event details including gallery

3. **Find a Mentor:**
   - Go to Alumni > Mentorship Program
   - Browse mentors by expertise
   - Submit mentorship request
   - Or register as a mentor

4. **Read Testimonials:**
   - Navigate to Alumni > Testimonials
   - View carousel or grid of alumni stories
   - Submit your own testimonial

### For Administrators

1. **Login:**
   - Go to MIS Login
   - Enter credentials
   - You will be redirected to Admin Dashboard
   - Open Alumni Module from the left sidebar dropdown

2. **Manage Alumni:**
   - Click "Alumni" tab
   - Click "Add New Alumni" to create
   - Edit or delete existing alumni
   - Mark alumni as featured

3. **Manage Events:**
   - Click "Events" tab
   - Create new events with images
   - Edit or delete events
   - Mark events as featured

4. **Review Mentors:**
   - Click "Mentors & Requests" tab
   - Review pending mentor applications
   - Approve or reject mentor requests
   - View approved mentors list

5. **Review Testimonials:**
   - Click "Testimonials" tab
   - View pending submissions
   - Approve or reject before publishing
   - Delete inappropriate testimonials

## Customization

### Changing Colors
Edit `assets/css/alumni.css`:
```css
:root {
    --primary-color: #9e271f;
    --secondary-color: #1a1a1a;
    /* ... more variables */
}
```

### Adding New Expertise Types (Mentorship)
Edit the expertise select in `mentorship.html` and update the API accordingly.

### Modifying Card Designs
Adjust styles in `alumni.css` for `.alumni-card`, `.event-card`, `.mentor-card`, and `.testimonial-card`.

## Performance Optimization

- Lazy loading of images
- Debounced search and filter operations
- Pagination support (can be added)
- Image optimization (recommended for production)
- Caching of API responses (can be implemented)

## Security Considerations

1. **Authentication:** All admin operations require valid JWT token
2. **Authorization:** Only authenticated admins can modify content
3. **Input Validation:** All forms validate on client and server
4. **CORS:** Configure to allow only trusted domains
5. **File Upload:** Validate file types and sizes on server

## Troubleshooting

### Alumni not loading
- Check backend server is running on `http://localhost:5000`
- Verify API endpoints are correctly configured
- Check browser console for errors

### Images not displaying
- Ensure image URLs are correct
- Check file permissions on server
- Verify CORS headers are properly configured

### Forms not submitting
- Verify authentication token is present
- Check network tab for API errors
- Validate form data format

## Future Enhancements

1. Advanced search with multiple criteria
2. Alumni directory with vCard export
3. Alumni reunion event management
4. Mentorship program analytics
5. Email notifications for new testimonials
6. Google Maps integration for location
7. Social media integration
8. Alumni contributions/donations tracking
9. Job board for alumni opportunities
10. Alumni magazine/newsletter

## Support & Maintenance

For issues or questions:
- Check this documentation
- Review browser console for errors
- Verify backend API is running
- Check database connectivity
- Ensure proper authentication

## Version History

- v1.1 (Merged Dashboard Update)
   - Alumni management merged into main `admin-dashboard.html`
   - Standalone alumni dashboard removed
   - Added backend alumni API router for full CRUD + approvals

- v1.0 (Initial Release)
  - Four main pages (Alumni, Events, Mentorship, Testimonials)
   - Initial alumni dashboard implementation
  - Responsive design
  - Search and filter functionality

