# Mentoga Platform - Testing Guide

## Test Accounts Setup

### Create Your First User Account
1. Click "Sign Up"
2. Enter email: `abaanshujat121@gmail.com`
3. Enter password: `123456`
4. Create account

### Create Your First Consultant Account
1. Click "Sign Up"
2. Enter email: `abaanshujat@gmail.com`
3. Enter password: `123456`
4. Go to Consultant Dashboard
5. Set pricing:
   - Hourly Rate: $75
   - Chat Rate: $1.50/min
   - Video Rate: $2.50/min
6. Add expertise: "Business Strategy", "Career Coaching"
7. Years of Experience: 10

## Testing Workflows

### Test 1: Browse Marketplace
1. Log in as `user@test.com`
2. Click "Marketplace"
3. See consultant card for `consultant@test.com`
4. Click "View Profile"
5. See full profile with rates and expertise
6. View service options (Chat, Video, Voice)

### Test 2: Book a Session
1. On consultant profile, click "Book Video Call Session"
2. Fill in:
   - Date: Tomorrow
   - Time: 2:00 PM
   - Duration: 30 minutes
3. Amount shows as $75 (30 min × $2.50/min)
4. Click "Book Session"
5. Success message appears

### Test 3: View User Dashboard
1. Click "Dashboard" (in navigation)
2. See stats:
   - Total Bookings: 1
   - Upcoming Sessions: 1
   - Completed: 0
   - Total Spent: $75
3. View booking in list with status "pending"

### Test 4: View Consultant Dashboard
1. Log in as `consultant@test.com`
2. Click "Dashboard"
3. See stats:
   - Earnings shown (will be $0 until payment)
   - Sessions: 1
   - Upcoming Sessions: 1
4. View incoming booking

### Test 5: Create a Course
1. Log in as `consultant@test.com`
2. Click "Courses"
3. Click "Create Course"
4. Fill in:
   - Title: "Digital Marketing Masterclass"
   - Price: $99.99
   - Category: "Marketing"
   - Level: "Intermediate"
   - Description: "Learn advanced digital marketing strategies"
5. Click "Create Course"
6. See course card appear in list

### Test 6: Chat System
1. Log in as `user@test.com`
2. From User Dashboard, click booking
3. Chat box widget appears
4. Send message: "Hi, excited for our call!"
5. Log in as `consultant@test.com`
6. Open same booking chat
7. See message from user
8. Send reply: "Looking forward to it!"
9. Both users see messages in real-time

### Test 7: Search and Filter
1. Log in as any user
2. Go to Marketplace
3. Search box:
   - Search "consultant" - should find consultant
   - Search "Business" - should find by expertise
4. Filter tabs:
   - Click "Business Strategy" - shows matching consultants
   - Click "All" - shows all again
5. Sort dropdown:
   - Select "Lowest Price"
   - Select "Most Sessions"

### Test 8: Consultant Settings
1. Log in as `consultant@test.com`
2. Click "Settings" in dashboard
3. Update:
   - Hourly Rate: $85
   - Chat Rate: $1.75/min
   - Video Rate: $3.00/min
   - Years: 11
4. Click "Save Settings"
5. Settings update confirmed

### Test 9: Admin Dashboard
1. Create admin user (requires database edit for now)
2. Log in as admin
3. See overview stats:
   - Total Users
   - Active Consultants
   - Total Bookings
   - Total Revenue

## Test Data Scenarios

### Scenario A: Multiple Consultants
Create multiple consultant accounts with different:
- Expertise tags
- Pricing
- Experience levels
- Descriptions

### Scenario B: Multiple Bookings
Create several bookings as one user to test:
- Dashboard statistics
- Different session types
- Different durations
- Different times

### Scenario C: Course Sales
1. Create course as consultant
2. Log in as different user
3. Browse courses
4. Purchase course (when Stripe integrated)
5. Track enrollment

### Scenario D: Review System
After booking completion:
1. User leaves 5-star review
2. Comment: "Great session!"
3. Consultant rating updates
4. Review appears on profile

## Edge Case Testing

### Test: Booking Too Soon
1. Try to book for same day
2. System should show only future dates
3. Minimum 24 hours ahead

### Test: Maximum Duration
1. Book for 2+ hours
2. System calculates price correctly
3. Amount displayed accurately

### Test: Chat During Booking
1. Book a session
2. Open chat before booking time
3. Messages persist
4. History shows after session starts

### Test: Role Switching
1. Create user account
2. Upgrade to consultant
3. Switch between user and consultant actions
4. UI updates appropriately

### Test: Session Status Flow
1. Create booking (status: pending)
2. Consultant accepts (status: confirmed)
3. After time passes (status: completed)
4. Can leave review only after completion

## Browser Testing

Test on:
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop)
- Chrome Mobile
- Safari iOS

Check:
- Responsive design
- Touch interactions
- Form inputs
- Navigation menu collapse
- Modal responsiveness

## Performance Testing

1. Open Developer Tools (F12)
2. Go to Network tab
3. Reload page
4. Check:
   - Bundle size (~92KB gzipped)
   - Load time
   - API response times
5. Go to Performance tab
6. Record interaction
7. Check CPU usage
8. Check memory usage

## Load Testing (When Ready)

```bash
# Use tools like Apache Bench
ab -n 1000 -c 10 https://your-deployment-url

# Or use Lighthouse for performance
npx lighthouse https://your-deployment-url
```

## Database Testing

### Check User Created
1. Sign up new user
2. Verify in `user_profiles` table
3. Check auth_id matches
4. Check role is "user"

### Check Consultant Data
1. Create consultant
2. Verify in `consultants` table
3. Check pricing values
4. Check expertise tags array

### Check Booking Created
1. Book session
2. Verify in `bookings` table
3. Check all fields populated
4. Check status is "pending"

### Check Messages Stored
1. Send chat message
2. Verify in `messages` table
3. Check content and timestamps
4. Check sender_id matches user

## Testing Checklist

### Core Features
- [ ] Sign up and login work
- [ ] Marketplace displays consultants
- [ ] Search filters work
- [ ] Consultant profiles load
- [ ] Can book sessions
- [ ] Chat works in real-time
- [ ] Dashboards show correct data
- [ ] Course creation works
- [ ] Admin dashboard loads

### User Experience
- [ ] Responsive on mobile
- [ ] Loading states visible
- [ ] Error messages clear
- [ ] Form validation works
- [ ] Navigation works
- [ ] Buttons have hover states
- [ ] Transitions are smooth

### Data Integrity
- [ ] Users can't see others' data
- [ ] Booking amounts calculate correctly
- [ ] Ratings update properly
- [ ] Message history preserves
- [ ] Course enrollments track

### Performance
- [ ] Pages load quickly
- [ ] Chat is responsive
- [ ] Database queries are fast
- [ ] No lag in interactions
- [ ] Images load efficiently

## Reporting Issues

When you find a bug:
1. Note exact steps to reproduce
2. Screenshot the issue
3. Check browser console for errors
4. Document expected vs actual behavior
5. Check which user role triggers it

## Testing After Stripe Integration

When payments are added:
1. Test booking with payment
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry
4. Any 3-digit CVC
5. Verify amount charged
6. Check consultant earnings update
7. Test failed payment
8. Test refund processing

## Performance Benchmarks

- **Marketplace Load**: < 2 seconds
- **Profile Load**: < 1 second
- **Chat Response**: < 500ms
- **Booking Creation**: < 1 second
- **Dashboard Update**: < 500ms

---

**Happy Testing!** Report any issues for improvements.
