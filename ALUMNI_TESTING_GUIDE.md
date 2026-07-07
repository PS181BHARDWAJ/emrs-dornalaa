# Alumni Module - Testing & Setup Guide

## Prerequisites

- Node.js/Python backend server running
- MySQL/PostgreSQL database
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Project files deployed

---

## Step 1: Start Your Backend Server

### If using Python/FastAPI (Backend):

```bash
cd emrs-master/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 5000
```

The server should run on: `http://localhost:5000`

### Verify Backend is Running:
- Visit `http://localhost:5000/api/alumni` in your browser
- You should see a JSON response (even if empty `[]`)
- If you see `{"error": "..."}`, backend is running but database needs setup

---

## Step 2: Prepare Test Data

### Create Sample Alumni Records (Test Data):

Option A: Using cURL/Postman:
```bash
curl -X POST http://localhost:5000/api/alumni \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj Kumar",
    "batch_year": 2015,
    "current_role": "Software Engineer",
    "company": "Google",
    "location": "Bangalore",
    "email": "raj@example.com",
    "success_story": "Started as intern, now senior engineer",
    "is_featured": true
  }'
```

Option B: Use Admin Dashboard (Recommended):
1. Login to admin dashboard
2. Fill forms with sample data
3. Upload test images

---

## Step 3: Test Frontend Pages

### Test 1: Notable Alumni Page

**URL:** `http://localhost:5000/alumni.html`

**Test Cases:**
- [ ] Page loads without errors
- [ ] Alumni cards display with:
  - [ ] Profile photo placeholder
  - [ ] Name
  - [ ] Batch year
  - [ ] Current role
  - [ ] Company name
  - [ ] "View More" button
- [ ] Search functionality works:
  - [ ] Type alumni name → filters results
  - [ ] Search is case-insensitive
- [ ] Batch filter works:
  - [ ] Select batch year → updates list
  - [ ] Multiple batches appear in dropdown
- [ ] Click "View More" → Modal opens with full details
- [ ] Featured badge displays for featured alumni
- [ ] Responsive design works on mobile (use DevTools)

**Expected Output:**
```
✓ Loading alumni from API
✓ Displaying 3+ alumni cards
✓ Search updates results in real-time
✓ Filter dropdown populated
✓ Modal shows full alumni details
```

---

### Test 2: Alumni Events Page

**URL:** `http://localhost:5000/alumni-events.html`

**Test Cases:**
- [ ] Page loads without errors
- [ ] Events display in card format
- [ ] "Upcoming Events" tab active by default
- [ ] Switch to "Past Events" tab → shows past events
- [ ] Event cards include:
  - [ ] Event image
  - [ ] Title
  - [ ] Date and location
  - [ ] Description
- [ ] Click "View Details" → Opens modal with:
  - [ ] Full description
  - [ ] Event gallery/images
  - [ ] Date, time, location
  - [ ] Participant count
- [ ] Featured badge appears on featured events

**Expected Output:**
```
✓ Events loaded from API
✓ Tab switching works (upcoming/past)
✓ Event details modal opens correctly
✓ Image gallery displays
```

---

### Test 3: Mentorship Program Page

**URL:** `http://localhost:5000/mentorship.html`

**Test Cases:**

#### Browse Mentors Tab:
- [ ] Page loads and shows mentors
- [ ] Mentor cards display:
  - [ ] Profile photo
  - [ ] Name
  - [ ] Batch year
  - [ ] Expertise badge
  - [ ] Company
  - [ ] Experience years
  - [ ] Availability hours
- [ ] Expertise filter works:
  - [ ] Select expertise → filters mentors
  - [ ] Dropdown has all options
- [ ] Search works:
  - [ ] Type mentor name → filters results
- [ ] Click "View Profile" → Modal opens with:
  - [ ] Full mentor details
  - [ ] "Request Mentorship" button

#### Request Mentorship:
- [ ] Click "Request Mentorship" button
- [ ] Prompts for student info:
  - [ ] Student name
  - [ ] Email
  - [ ] Phone
  - [ ] Request reason
- [ ] Successful submission shows confirmation

#### Become Mentor Tab:
- [ ] Form displays all fields:
  - [ ] Name, email, phone
  - [ ] Batch year
  - [ ] Company
  - [ ] Expertise dropdown
  - [ ] Experience years
  - [ ] Availability
  - [ ] Bio/description
- [ ] Form validation works:
  - [ ] Required fields marked
  - [ ] Can't submit empty form
- [ ] File upload works:
  - [ ] Can upload profile photo
- [ ] Submit button works:
  - [ ] Shows success message
  - [ ] Form resets

**Expected Output:**
```
✓ Mentors loaded and filtered
✓ Search functionality works
✓ Mentor profile modal opens
✓ Mentorship request submitted
✓ Mentor registration form works
```

---

### Test 4: Testimonials Page

**URL:** `http://localhost:5000/testimonials.html`

**Test Cases:**

#### Testimonials Display:
- [ ] Carousel slider loads:
  - [ ] Shows testimonials
  - [ ] Navigation arrows work
  - [ ] Auto-rotates testimonials
  - [ ] Includes alumni photo, name, batch
- [ ] Grid view displays below:
  - [ ] Testimonial cards
  - [ ] Quote styling
  - [ ] Author info
- [ ] Each testimonial shows:
  - [ ] Quote icon
  - [ ] Message text
  - [ ] Author name
  - [ ] Batch year
  - [ ] Author photo

#### Submit Testimonial:
- [ ] "Share Your Story" form displays
- [ ] Form fields work:
  - [ ] Name input
  - [ ] Batch input
  - [ ] Email input
  - [ ] Message textarea
  - [ ] Photo upload (optional)
- [ ] Form validation:
  - [ ] Required fields marked
  - [ ] Can't submit empty
- [ ] Submit works:
  - [ ] Shows success message
  - [ ] Form resets
  - [ ] New testimonial appears (after admin approval)

**Expected Output:**
```
✓ Testimonials carousel displays
✓ Carousel auto-rotates
✓ Grid displays all approved testimonials
✓ Submit form works
✓ Success message shows
```

---

## Step 4: Test Admin Dashboard

**URL:** `http://localhost:5000/admin-dashboard.html`

### Prerequisites:
- Must be logged in (valid token in localStorage)
- Token obtained from admin login page
- In the left sidebar, open **Alumni Module** and choose a section:
  - Notable Alumni
  - Alumni Events
  - Mentorship Program
  - Testimonials

### Test 4.1: Alumni Management Tab

**[✓] Load Notable Alumni Section:**
- [ ] Admin dashboard loads
- [ ] Alumni Module > Notable Alumni is accessible
- [ ] Alumni table loads with existing records
- [ ] Table shows: Name, Batch, Role, Company, Featured status, Actions

**[✓] Add Alumni:**
- [ ] Click "Add New Alumni" button
- [ ] Form modal opens
- [ ] All fields are empty
- [ ] Fill form with test data:
  ```
  Name: John Doe
  Batch: 2012
  Role: CEO
  Company: Tech Startup
  Location: Mumbai
  Email: john@example.com
  Story: Founded my own company...
  Featured: Check the box
  Photo: Upload image
  ```
- [ ] Click "Save Alumni"
- [ ] Success notification appears
- [ ] New record appears in table

**[✓] Edit Alumni:**
- [ ] Click edit icon on any alumni
- [ ] Form pre-fills with existing data
- [ ] Change a field (e.g., role)
- [ ] Click "Save Alumni"
- [ ] Change reflected in table

**[✓] Delete Alumni:**
- [ ] Click delete icon
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Record removed from table

---

### Test 4.2: Alumni Events Section

**[✓] Add Event:**
- [ ] Open Alumni Module > Alumni Events
- [ ] Click "Add New Event" button
- [ ] Form modal opens
- [ ] Fill event form:
  ```
  Title: Annual Alumni Reunion
  Date: 2025-06-15
  Location: School Campus
  Description: Join us for our annual reunion...
  Images: Upload 2-3 photos
  Featured: Check the box
  ```
  - [ ] Click "Save Event"
  - [ ] Event appears in table


