# Quick Start Guide - Alumni Module Testing

## 🚀 Quick Setup (5 Minutes)

### Step 1: Verify Backend is Running

**Windows PowerShell:**
```powershell
# Navigate to backend folder
cd emrs-master/backend

# Install dependencies
pip install -r requirements.txt

# Start server
python -m uvicorn app.main:app --host 127.0.0.1 --port 5000
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

**macOS/Linux:**
```bash
cd emrs-master/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 5000
```

---

### Step 2: Test Backend Connectivity

Open browser and visit:
```
http://localhost:5000/api/alumni
```

Expected response (even if empty):
```json
[]
```

If you see this, **✓ Backend is working!**

---

### Step 3: Open Frontend Pages

Navigate to your project folder and open:

**For Local Testing (without server):**
```
file:///PATH_TO_PROJECT/alumni.html
file:///PATH_TO_PROJECT/alumni-events.html
file:///PATH_TO_PROJECT/mentorship.html
file:///PATH_TO_PROJECT/testimonials.html
```

**For Server-Based Testing (Recommended):**
```
http://localhost:5000/alumni.html
http://localhost:5000/alumni-events.html
http://localhost:5000/mentorship.html
http://localhost:5000/testimonials.html
```

---

## 📝 Step-by-Step Testing

### Test 1: Check Notable Alumni Page (2 mins)

1. Open: `alumni.html`
2. Check console (F12 → Console):
   - Should say "Loading alumni from API"
   - No red errors
3. Page should show:
   - Title: "Notable Alumni"
   - Search box
   - Batch filter dropdown
   - (Empty if no data yet)

**✓ PASS if:** Page loads, no console errors

---

### Test 2: Check Alumni Events Page (2 mins)

1. Open: `alumni-events.html`
2. Check console for errors
3. Should show:
   - Title: "Alumni Events"
   - "Upcoming Events" tab active
   - "Past Events" tab available
   - (Empty if no events)

**✓ PASS if:** Page loads, tabs clickable

---

### Test 3: Check Mentorship Page (2 mins)

1. Open: `mentorship.html`
2. Should display:
   - Title: "Mentorship Program"
   - "Browse Mentors" and "Become a Mentor" tabs
   - Expertise dropdown
   - Search box
   - (Empty if no mentors)

**✓ PASS if:** Both tabs work, forms visible

---

### Test 4: Check Testimonials Page (2 mins)

1. Open: `testimonials.html`
2. Should show:
   - Title: "Alumni Testimonials"
   - "Share Your Story" form
   - (Empty carousel/grid if no testimonials)

**✓ PASS if:** Form visible and inputs work

---

### Test 5: Admin Dashboard Access (3 mins)

1. **First, get a token:**
   - Go to: `admin-login.html`
   - Login with admin credentials
   - Token automatically saved to localStorage

2. **Access admin dashboard:**
   - Go to: `admin-dashboard.html`
   - Use the left sidebar **Alumni Module** dropdown
   - Open each section: Notable Alumni, Alumni Events, Mentorship Program, Testimonials

**✓ PASS if:** Dashboard loads without errors

---

## 🧪 Quick Data Testing (Optional)

### Add Test Alumni Via Admin:

1. Go to `admin-dashboard.html`
2. Open **Alumni Module > Notable Alumni**
3. Fill and save a new alumni record
3. Fill the form:
   - Name: "Test Alumni"
   - Batch: 2020
   - Role: "Software Engineer"
   - Company: "Tech Corp"
   - Story: "Test story here"
4. Click "Save Alumni"
5. Should see success message
6. Record appears in table

### Verify on Public Page:

1. Go to `alumni.html`
2. New record should appear
3. Click "View More" to see details

---

## 🔍 Check Console for Errors

### Open Developer Tools:
- **Windows:** Press `F12` or `Ctrl+Shift+I`
- **Mac:** Press `Cmd+Option+I`

### Check Console Tab:
- [ ] No **RED** messages (errors are fine if not critical)
- [ ] Alumni data should appear in console
- [ ] API calls should show in Network tab

### Check Network Tab:
- Click tab
- Reload page
- Look for requests:
  - `alumni-api.js` - 200 ✓
  - `alumni.js` - 200 ✓
  - `/api/alumni` - 200 ✓ (or empty array)

---

## 📱 Mobile Testing

### Using Chrome DevTools:

1. Press F12
2. Click **device icon** (top left)
3. Select device (iPhone 12, iPad, etc.)
4. Test on each page:
   - [ ] No horizontal scroll
   - [ ] Text readable
   - [ ] Buttons clickable
   - [ ] Forms work

---

## ✅ Final Verification Checklist

Run through this checklist:

```
PAGES LOAD:
[ ] alumni.html loads
[ ] alumni-events.html loads
[ ] mentorship.html loads
[ ] testimonials.html loads
[ ] admin-dashboard.html loads

NO ERRORS:
[ ] F12 Console has no red errors
[ ] All CSS files loaded (Network tab)
[ ] All JS files loaded (Network tab)
[ ] API calls successful (Network tab)

FORMS WORK:
[ ] Search works on alumni page
[ ] Filter works on alumni page
[ ] Batch dropdown populated
[ ] Expertise filter works
[ ] Forms don't have errors

RESPONSIVE:
[ ] Desktop looks good
[ ] Mobile view looks good (use DevTools)
[ ] No horizontal scrolling

ADMIN:
[ ] Can access admin dashboard
[ ] Can add alumni
[ ] Can view alumni in table
[ ] Can edit alumni
[ ] Can delete alumni
```

**If all checked: ✓ Alumni Module is Ready!**

---

## 🆘 Troubleshooting

### Problem: "Cannot GET /api/alumni"
```
Solution:
1. Backend not running
2. Run: python -m uvicorn app.main:app --host 127.0.0.1 --port 5000
3. Check it says: "Running on http://127.0.0.1:5000"
```

### Problem: Blank Page / No Content
```
Solution:
1. Check Console (F12)
2. Look for red error messages
3. Common: CSS/JS not loading
4. Solution: Check file paths
```

### Problem: Admin Dashboard Shows Error
```
Solution:
1. Haven't logged in
2. Token missing from localStorage
3. Fix: Login via admin-login.html first
```

### Problem: Images Not Showing
```
Solution:
1. Using placeholder images from CDN
2. Replace with actual image paths
3. Or upload images to server
```

---

## 🎯 Expected Results

### When Everything Works:

**Alumni Page:**
```
✓ Shows "Notable Alumni" title
✓ Search box functional
✓ Batch filter populated
✓ Cards display (if data exists)
✓ Click "View More" → Modal opens
```

**Events Page:**
```
✓ Shows "Alumni Events" title
✓ Tabs switch (Upcoming/Past)
✓ Event cards display (if data exists)
✓ Click "View Details" → Modal opens
```

**Mentorship Page:**
```
✓ Shows "Mentorship Program" title
✓ Browse/Become Mentor tabs work
✓ Forms functional
✓ Filter/Search works
```

**Testimonials Page:**
```
✓ Shows "Alumni Testimonials" title
✓ Carousel displays
✓ Submit form works
✓ Grid shows testimonials
```

**Admin Dashboard:**
```
✓ All 4 tabs accessible
✓ Can add content
✓ Can edit content
✓ Can delete content
✓ Status updates work
```

---

## 📞 Next Steps

Once testing is complete:

1. **Deploy to Server:**
   - Upload all files to web server
   - Update BASE_URL in API files if needed
   - Test in browser

2. **Configure Backend:**
   - Setup database tables
   - Create admin user
   - Configure authentication

3. **Go Live:**
   - Update navbar links
   - Announce Alumni section
   - Monitor for issues

---

## 💡 Pro Tips

1. **Keep DevTools Open:**
   - Always check Console while testing
   - Network tab shows API performance

2. **Test on Real Mobile:**
   - DevTools mobile view not 100% accurate
   - Test on actual phone if possible

3. **Clear Cache Often:**
   - Old versions can cause issues
   - Use: Ctrl+Shift+Delete (Chrome)

4. **Test With Data:**
   - Module works better with real data
   - Add 3-5 test records for better UX

---

Good luck! 🚀

