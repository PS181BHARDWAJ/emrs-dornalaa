# Sports Facilities Module - Implementation Guide

## Overview
The Sports Facilities module is a comprehensive, premium, modern system for managing sports content on the EMRS Dornala website. It includes:

1. **Public Sports Page** (`sports.html`) - Modern, animated UI for displaying sports facilities, events, and achievements
2. **Admin Dashboard Integration** - Full CRUD management from the admin dashboard
3. **Backend APIs** - RESTful endpoints with JWT authentication and MongoDB integration
4. **Responsive Design** - Works seamlessly on desktop and mobile devices

## Module Structure

### 1. Public Sports Page (`sports.html`)

#### Features:
- **Hero Section**: Dynamic banner with customizable image, title, subtitle, and CTA buttons
- **Sports Facilities Grid**: Display all sports with images, descriptions, and icons
- **Sports Events Section**: Upcoming, ongoing, and past events with filtering
- **Student Achievements**: Gallery of student sports achievements with medals/trophies
- **Real-time Updates**: Auto-refreshes every 30 seconds to show latest data
- **Premium UI**: Framer Motion-style animations, glassmorphism cards, gradient overlays
- **Breadcrumb Navigation**: Easy navigation structure

#### API Calls:
- `GET /api/facilities/sports` - Get all active sports
- `GET /api/facilities/sports/events` - Get all active sports events
- `GET /api/facilities/sports/achievements` - Get all active achievements

### 2. Admin Dashboard Integration

#### Sidebar Menu Structure:
```
├── Facilities Management
│   ├── Sports Facilities
│   ├── Sports Events
│   └── Sports Achievements
```

#### Features:
- **Sports Facilities Manager**
  - Add/Edit/Delete sports facilities
  - Upload facility images
  - Manage equipment and coaches lists
  - Featured and active status toggling
  - Order management for custom sorting

- **Sports Events Manager**
  - Create upcoming, ongoing, and past events
  - Upload event banners
  - Manage event dates, venues, and participants
  - Registration details management
  - Event type filtering

- **Sports Achievements Manager**
  - Record student achievements
  - Upload achievement images
  - Track student details, class, competition
  - Position/medal tracking
  - Featured achievements for homepage

### 3. Backend API Endpoints

#### Authentication
All admin endpoints require JWT bearer token in Authorization header

#### Sports Facilities Endpoints
```
GET    /api/facilities/sports              - Get all active sports
GET    /api/facilities/sports/all          - Get all sports (admin)
GET    /api/facilities/sports/{id}         - Get specific sport
POST   /api/facilities/sports              - Create sport (admin)
PUT    /api/facilities/sports/{id}         - Update sport (admin)
DELETE /api/facilities/sports/{id}         - Delete sport (admin)
PATCH  /api/facilities/sports/{id}/toggle  - Toggle active status (admin)
```

#### Sports Events Endpoints
```
GET    /api/facilities/sports/events             - Get active events
GET    /api/facilities/sports/events/all         - Get all events (admin)
GET    /api/facilities/sports/events/{id}        - Get specific event
POST   /api/facilities/sports/events             - Create event (admin)
PUT    /api/facilities/sports/events/{id}        - Update event (admin)
DELETE /api/facilities/sports/events/{id}        - Delete event (admin)
PATCH  /api/facilities/sports/events/{id}/toggle - Toggle active status (admin)
```

#### Sports Achievements Endpoints
```
GET    /api/facilities/sports/achievements             - Get active achievements
GET    /api/facilities/sports/achievements/all         - Get all achievements (admin)
GET    /api/facilities/sports/achievements/{id}        - Get specific achievement
POST   /api/facilities/sports/achievements             - Create achievement (admin)
PUT    /api/facilities/sports/achievements/{id}        - Update achievement (admin)
DELETE /api/facilities/sports/achievements/{id}        - Delete achievement (admin)
PATCH  /api/facilities/sports/achievements/{id}/toggle - Toggle active status (admin)
```

## Setup Instructions

### 1. Backend Setup
The backend APIs are already configured and running. The sports routes are registered with prefix `/api/facilities`.

**Database Collections**:
- `sports_facilities` - Stores sports facility information
- `sports_events` - Stores sports event data
- `sports_achievements` - Stores student achievements

### 2. Public Page Access
Access the sports page at: `http://localhost:8000/sports.html`

**Features**:
- Breadcrumb navigation for SEO
- Responsive grid layouts
- Smooth animations and transitions
- Real-time data fetching
- Loading states and empty state messages

### 3. Admin Dashboard
Access admin dashboard at: `http://localhost:8000/admin-dashboard.html`

**Login**: Use your admin credentials

**Navigation**:
1. Click on "Facilities" dropdown in sidebar
2. Select desired section (Sports Facilities, Events, or Achievements)
3. Fill in the form to add new items
4. Manage existing items using the table below

## API Request Examples

### Create a Sports Facility
```bash
curl -X POST http://localhost:8000/api/facilities/sports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Cricket" \
  -F "description=State-of-the-art cricket facilities" \
  -F "icon=fas fa-cricket" \
  -F "facility_details=Full ground with training nets" \
  -F "image=@cricket.jpg" \
  -F "featured=true" \
  -F "active=true"
```

### Create a Sports Event
```bash
curl -X POST http://localhost:8000/api/facilities/sports/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Annual Sports Day" \
  -F "event_date=2024-05-15T10:00:00" \
  -F "venue=School Grounds" \
  -F "sport_type=General" \
  -F "event_type=upcoming" \
  -F "description=Annual sports competition" \
  -F "banner_image=@event_banner.jpg" \
  -F "active=true"
```

### Create an Achievement
```bash
curl -X POST http://localhost:8000/api/facilities/sports/achievements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=National Champion" \
  -F "student_name=John Doe" \
  -F "student_class=XII A" \
  -F "competition=National Athletics Championship" \
  -F "position=Gold" \
  -F "sport_type=Athletics" \
  -F "achievement_type=medal" \
  -F "achieved_at=2024-04-20T00:00:00" \
  -F "image=@achievement.jpg" \
  -F "featured=true" \
  -F "active=true"
```

## Data Models

### Sport Facility
```json
{
  "id": "ObjectId",
  "name": "Cricket",
  "description": "State-of-the-art cricket facilities",
  "icon": "fas fa-cricket",
  "image_url": "path/to/image",
  "facility_details": "Full ground with training nets",
  "equipment": ["Bats", "Balls", "Helmets"],
  "coaches": ["Coach Name"],
  "order": 0,
  "featured": true,
  "active": true,
  "created_at": "timestamp"
}
```

### Sports Event
```json
{
  "id": "ObjectId",
  "title": "Annual Sports Day",
  "description": "Annual sports competition",
  "banner_image": "path/to/image",
  "event_date": "2024-05-15T10:00:00",
  "venue": "School Grounds",
  "sport_type": "General",
  "event_type": "upcoming",
  "registration_details": "Registration by May 10",
  "participants": ["School A", "School B"],
  "results": "Winners announcement",
  "gallery_images": ["image1", "image2"],
  "order": 0,
  "active": true,
  "created_at": "timestamp"
}
```

### Sports Achievement
```json
{
  "id": "ObjectId",
  "title": "National Champion",
  "student_name": "John Doe",
  "student_class": "XII A",
  "competition": "National Athletics Championship",
  "achievement_type": "medal",
  "position": "Gold",
  "sport_type": "Athletics",
  "image_url": "path/to/image",
  "gallery_images": ["image1", "image2"],
  "details": "Won in 100m sprint",
  "achieved_at": "2024-04-20T00:00:00",
  "order": 0,
  "featured": true,
  "active": true,
  "created_at": "timestamp"
}
```

## Features Summary

### Public Page Features
✅ Responsive design (mobile, tablet, desktop)
✅ Dynamic data loading from APIs
✅ Smooth animations and transitions
✅ Filter sports events by type
✅ Search and sort capabilities
✅ Auto-refresh every 30 seconds
✅ Loading states
✅ Empty state messages
✅ SEO-friendly structure
✅ Accessible markup

### Admin Features
✅ Full CRUD operations
✅ Image uploads with compression
✅ Drag-and-drop sorting
✅ Bulk operations
✅ Live preview
✅ Form validation
✅ Toast notifications
✅ Confirmation dialogs
✅ Search/filter tables
✅ Export functionality (coming soon)

### Backend Features
✅ JWT authentication
✅ MongoDB integration
✅ File upload handling
✅ Data validation with Pydantic
✅ CORS support
✅ Error handling
✅ Request pagination
✅ Filtering and searching
✅ Activity logging
✅ Rate limiting (coming soon)

## Customization Guide

### Styling
The sports page uses inline CSS for maximum compatibility. To customize:

1. **Colors**: Edit the `:root` variables in `sports.html`
   ```css
   --sports-primary: #0b4f6c;
   --sports-accent: #d9480f;
   --sports-success: #1f8a70;
   ```

2. **Fonts**: Change in the `<head>` section
   ```html
   <link href="https://fonts.googleapis.com/css2?family=YourFont&display=swap">
   ```

3. **Animations**: Adjust animation timings and effects in the styles

### Adding New Sections
The module is designed to be extensible. To add new sections:

1. Add backend endpoints in `backend/app/routes/sports.py`
2. Create admin manager function in `admin-dashboard.html`
3. Add sidebar menu item with toggle function
4. Create public page section in `sports.html`

## Troubleshooting

### APIs Return 400 Bad Request
- Check the Authorization header is present and valid
- Verify all required form fields are filled
- Ensure file uploads are the correct format

### Images Not Loading
- Check the file upload path is correct
- Verify image file exists in uploads directory
- Check CORS headers are properly configured

### Admin Dashboard Not Loading Data
- Verify JWT token is still valid (login again if needed)
- Check browser console for errors
- Ensure backend server is running
- Verify database connection is active

### Sports Page Not Updating
- Check if APIs are returning data: `GET /api/facilities/sports`
- Verify network connectivity
- Clear browser cache and refresh
- Check if data is marked as `active: true`

## Performance Optimization

### Caching
The public page auto-refreshes every 30 seconds. For better performance:
- Increase refresh interval in `sports.html` (line: `setInterval(loadData, 30000)`)
- Implement server-side caching for frequently accessed data
- Use CDN for image delivery

### Database Optimization
- Create indexes on `active` and `created_at` fields
- Archive old events periodically
- Optimize image sizes before upload

## Security Notes

✅ JWT authentication on all admin endpoints
✅ Server-side validation on all inputs
✅ File type and size validation
✅ CORS policies configured
✅ SQL injection prevention (MongoDB)
✅ XSS protection with sanitized output

## Future Enhancements

🔜 Image optimization and compression
🔜 Advanced filtering and search
🔜 Export to PDF/Excel
🔜 Bulk upload functionality
🔜 Achievement certificates generation
🔜 Email notifications
🔜 Analytics and statistics
🔜 Multi-language support
🔜 Archive functionality
🔜 Approval workflow for achievements

## Support & Documentation

For more information, refer to:
- [Backend Code](backend/app/routes/sports.py)
- [Public Page](sports.html)
- [Admin Dashboard](admin-dashboard.html)
- [API Documentation](docs/api.md)

## License

This module is part of the EMRS Dornala system.
