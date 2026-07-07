# Sports Facilities Module - Quick Start Testing Guide

## Test the System Step by Step

### Step 1: Verify Backend is Running
✅ The FastAPI server should be running on `http://localhost:8000`

Check by opening in browser:
- `http://localhost:8000/docs` (Swagger UI - auto-generated API docs)

### Step 2: Test Public Sports Page
1. Open: `http://localhost:8000/sports.html`
2. You should see:
   - ✅ Hero section with title and CTA buttons
   - ✅ Three loading skeleton cards (will fill once data is added)
   - ✅ Event filtering buttons
   - ✅ Achievement gallery section
   - ✅ Responsive design on mobile

### Step 3: Access Admin Dashboard
1. Open: `http://localhost:8000/admin-dashboard.html`
2. Login with admin credentials
3. Look for new "Facilities" menu in sidebar with three sub-items:
   - ✅ Sports Facilities
   - ✅ Sports Events
   - ✅ Sports Achievements

### Step 4: Add First Sports Facility

**In Admin Dashboard:**
1. Click "Sports Facilities" in sidebar
2. Fill in the form:
   - **Sport Name**: Cricket
   - **Description**: State-of-the-art cricket facilities
   - **Icon**: fas fa-cricket (or fas fa-dumbbell)
   - **Facility Details**: Full ground with training nets
   - **Featured**: Check this box
   - **Active**: Check this box (default)
3. Click "Save Sport"
4. You should see success notification
5. The sport appears in the table below

**Verify on Public Page:**
1. Refresh `http://localhost:8000/sports.html`
2. The cricket card should now appear in "Our Sports Facilities" section

### Step 5: Add Sports Event

**In Admin Dashboard:**
1. Click "Sports Events" in sidebar
2. Fill in the form:
   - **Event Title**: Annual Sports Day 2024
   - **Event Date**: 2024-05-15 (set to future date)
   - **Venue**: School Main Ground
   - **Sport Type**: General
   - **Event Type**: upcoming
   - **Description**: Grand annual sports competition
3. Click "Save Event"
4. You should see success notification

**Verify on Public Page:**
1. Refresh `http://localhost:8000/sports.html`
2. Scroll to "Sports Events" section
3. The event card should appear
4. Try filtering by "Upcoming" button

### Step 6: Add Student Achievement

**In Admin Dashboard:**
1. Click "Sports Achievements" in sidebar
2. Fill in the form:
   - **Achievement Title**: Cricket Champion
   - **Student Name**: John Doe
   - **Class**: XII A
   - **Competition**: State Cricket Tournament
   - **Position**: Gold
   - **Sport Type**: Cricket
   - **Achievement Type**: medal
   - **Featured**: Check this box
3. Click "Save Achievement"

**Verify on Public Page:**
1. Refresh `http://localhost:8000/sports.html`
2. Scroll to "Student Achievements" section
3. Achievement card should appear with student details

### Step 7: Test CRUD Operations

#### Edit a Sports Facility
1. In "Sports Facilities", click "Edit" on any sport
2. Change the description
3. Click "Save Sport"
4. Verify changes in table and on public page

#### Delete an Item
1. Click "Delete" button
2. Confirm in the dialog
3. Item should be removed from list

#### Toggle Active Status
1. Add a sport and uncheck "Active"
2. Save it
3. Go to public page - it should NOT appear
4. Go back to admin, check "Active" and save
5. Refresh public page - it should now appear

### Step 8: Test File Uploads

#### Upload Sports Image
1. In Sports Facilities form
2. Click "Choose Image" file input
3. Select any JPG/PNG image
4. Save sport
5. Image should appear on public page

#### Upload Event Banner
1. In Sports Events form
2. Select event banner image
3. Save event
4. Banner appears on event card

### Step 9: Test Filtering & Sorting

#### Event Type Filtering
1. Add multiple events with different types (upcoming, ongoing, past)
2. On public page, click filter buttons:
   - ✅ "All Events" - shows all
   - ✅ "Upcoming" - shows only upcoming
   - ✅ "Ongoing" - shows only ongoing
   - ✅ "Past Events" - shows only past

#### Sport Ordering
1. Set different "Order" values for sports (0, 1, 2, etc.)
2. Refresh public page
3. Sports appear in order specified

### Step 10: API Testing with curl

#### Create Sport via API
```bash
curl -X POST http://localhost:8000/api/facilities/sports \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Football" \
  -F "description=Professional football field" \
  -F "featured=true" \
  -F "active=true"
```

#### Get All Sports
```bash
curl -X GET http://localhost:8000/api/facilities/sports
```

#### Get Sports (Admin with all)
```bash
curl -X GET http://localhost:8000/api/facilities/sports/all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Step 11: Test Responsive Design

#### Desktop (1920x1080)
- ✅ 3-4 column grid for sports
- ✅ Full navigation visible

#### Tablet (768x1024)
- ✅ 2 column grid
- ✅ Touch-friendly buttons
- ✅ Menu scales appropriately

#### Mobile (375x667)
- ✅ Single column layout
- ✅ Full-width cards
- ✅ Readable text
- ✅ Swipeable events

### Step 12: Test Auto-Refresh

1. Open public page on two browser windows
2. Add a new sport in one window (admin)
3. Without refreshing the other window, wait 30 seconds
4. New sport should automatically appear

### Common Test Data

**Sports to Add:**
- Cricket (fas fa-cricket or fas fa-star)
- Football (fas fa-futbol)
- Volleyball (fas fa-volleyball)
- Athletics (fas fa-running)
- Basketball (fas fa-basketball)
- Kabaddi (fas fa-users)

**Events to Add:**
- Annual Sports Day (upcoming)
- Inter-School Tournament (ongoing)
- Cricket Championship (past)
- Track & Field Meet (upcoming)

**Achievements:**
- National Champion in 100m sprint
- State Cricket Tournament Winner
- Regional Basketball Champions
- Delhi Schools Athletics Gold Medalist

## Expected API Responses

### Get Sports (Success)
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Cricket",
    "description": "State-of-the-art cricket facilities",
    "icon": "fas fa-cricket",
    "image_url": "/uploads/sports/...",
    "facility_details": "Full ground",
    "equipment": [],
    "coaches": [],
    "order": 0,
    "featured": true,
    "active": true,
    "created_at": "2024-05-10T10:30:00"
  }
]
```

### Create Sport (Success)
```json
{
  "id": "507f1f77bcf86cd799439012"
}
```

### Error Responses
```json
{
  "detail": "Invalid sport id"
}
```

## Browser Console Checks

Open browser developer console (F12) and check for:
- ✅ No 404 errors
- ✅ No CORS errors
- ✅ No undefined variable errors
- ✅ Network requests to `/api/facilities/*` return 200/201

## Troubleshooting Tests

### If sports don't appear on public page:
1. Open browser console (F12)
2. Type: `fetch('http://localhost:8000/api/facilities/sports').then(r => r.json()).then(console.log)`
3. Check if array is returned with your sports

### If admin forms don't submit:
1. Check Authorization header is valid
2. Verify all required fields are filled
3. Look at network tab for error response

### If images don't upload:
1. Check file is actually selected
2. Verify image format is supported (JPG, PNG, WebP)
3. Check uploads directory exists and is writable

## Performance Metrics

Expected metrics:
- Page load time: < 2 seconds
- API response time: < 500ms
- Images load: < 1 second each
- Admin form submit: < 2 seconds
- Public page scroll: Smooth 60fps

## Success Criteria

You'll know the Sports Facilities module is working correctly when:

✅ Sports are visible on public page
✅ Admin dashboard loads and shows Sports section
✅ You can create, edit, delete sports/events/achievements
✅ Images upload and display correctly
✅ Public page updates automatically after admin changes
✅ Event filtering works correctly
✅ Responsive design works on all screen sizes
✅ No errors in browser console
✅ API endpoints respond correctly
✅ Data persists after page refresh

## Next Steps

Once testing is complete:

1. **Deploy to Production**
   - Update base URLs from localhost to production domain
   - Enable HTTPS
   - Set up proper error monitoring

2. **Content Creation**
   - Populate sports facilities
   - Add upcoming events
   - Document achievements

3. **Customization**
   - Customize colors and fonts
   - Add custom CSS
   - Integrate with other modules

4. **Integration**
   - Link from main navigation
   - Add to sitemap
   - Update internal links

5. **Optimization**
   - Optimize images
   - Set up image compression
   - Configure caching headers

## Support

If you encounter any issues:
1. Check the console for error messages
2. Review the SPORTS_FACILITIES_README.md
3. Check API response in network tab
4. Verify all files are in correct locations
5. Ensure backend server is running
