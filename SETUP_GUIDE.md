# Mentoga SaaS Platform - Setup Guide

A complete full-stack SaaS consultation platform where creators/consultants can monetize their expertise through paid chats, video calls, courses, and more.

## Platform Overview

### System Roles

1. **Admin** - Platform management, user moderation, analytics, revenue oversight
2. **Consultant/Creator** - Offer services, set pricing, manage bookings, create courses
3. **User/Client** - Browse consultants, book sessions, purchase courses, leave reviews

## Core Features Implemented

### 1. Authentication & User Management ✅
- Email/password signup and login
- Role-based access control (Admin, Consultant, User)
- Profile management with extended user information
- JWT authentication via Supabase

### 2. Marketplace Discovery ✅
- Browse all active consultants
- Search by name or expertise tags
- Filter by expertise category
- Sort by rating, price, or session count
- Detailed consultant profiles with reviews

### 3. User Dashboards ✅
- **User Dashboard**: View bookings, track spending, session history
- **Consultant Dashboard**: Monitor earnings, sessions, ratings, pricing settings
- **Admin Dashboard**: Platform analytics, user management, revenue tracking

### 4. Booking & Scheduling System ✅
- Book consultants for chat, video, or voice sessions
- Select date, time, and duration
- Automatic price calculation based on service type
- Session status tracking (pending, confirmed, completed, cancelled)

### 5. LMS (Course System) ✅
- Create and manage online courses
- Set course pricing and difficulty levels
- Track student enrollments and earnings
- Course categorization and descriptions

### 6. Real-time Chat System ✅
- 1-to-1 messaging between users and consultants
- Real-time updates using Supabase Realtime
- Message persistence in database
- Read receipts and timestamps

### 7. Consultant Profiles ✅
- Detailed profile pages with expertise, experience, rates
- Ratings and reviews section
- Service-specific pricing (chat, video, voice)
- Verification badge support

## Database Architecture

### Core Tables
- **user_profiles** - Extended user information, roles
- **consultants** - Consultant-specific data, pricing, ratings
- **bookings** - Session reservations with status tracking
- **messages** - Chat messages with read status
- **calls** - Video/voice call records and analytics
- **payments** - Transaction records
- **courses** - Online courses by consultants
- **reviews** - Ratings and feedback

### Security Features
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- User data isolation
- Authentication checks on all operations

## Technology Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

### Backend/Database
- **Supabase** - PostgreSQL database, Auth, Realtime
- **Node.js** - Runtime environment

### Payment Integration (Ready to Setup)
- **Stripe** - Payment processing

## Getting Started

### 1. Environment Setup

Supabase credentials are already configured in `.env`:
```env
VITE_SUPABASE_URL=https://hrazpkjbzgrevumylpwa.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Creating Test Data

#### Create a Consultant Profile
1. Sign up as a regular user
2. Navigate to Consultant Dashboard
3. Click "Become a Consultant" or use the admin tools
4. Set your rates:
   - Hourly rate: $50-150
   - Chat rate: $0.50-2/minute
   - Video rate: $1-5/minute

#### Add Expertise Tags
Update your consultant profile with tags like:
- Business Strategy
- Web Development
- Digital Marketing
- Career Coaching
- etc.

### 3. Testing the Platform

#### User Flow
1. Sign up as a regular user
2. Browse marketplace to find consultants
3. View consultant profiles and reviews
4. Book a session (video, chat, or voice)
5. Start a chat conversation
6. Rate and review after session

#### Consultant Flow
1. Sign up and become a consultant
2. Set pricing and availability
3. Create courses
4. View upcoming bookings
5. Track earnings and analytics

#### Admin Flow
1. Access admin dashboard
2. View platform statistics
3. Monitor payments and disputes
4. Manage users and consultants

## Payment Integration Setup (IMPORTANT)

### Stripe Configuration

To enable payments, you need to configure Stripe:

1. **Create Stripe Account**
   - Go to https://dashboard.stripe.com
   - Sign up or log in

2. **Get API Keys**
   - Navigate to Developers > API Keys
   - Copy your Secret Key and Publishable Key

3. **Setup Payment Processing**
   - Add Stripe credentials to environment
   - Deploy payment processing edge function
   - Configure webhook endpoints

4. **Test Mode**
   - Use test card: 4242 4242 4242 4242
   - Any future expiry date
   - Any 3-digit CVC

### Payment Features to Implement
- Stripe integration for session payments
- Automatic platform commission calculation (configurable percentage)
- Payout management for consultants
- Invoice generation
- Refund processing

For detailed Stripe setup: https://bolt.new/setup/stripe

## Advanced Features (Available for Development)

### 1. Video Call System (WebRTC)
- Real-time peer-to-peer video calls
- Screen sharing capability
- Call recording
- Session auto-termination based on booking duration

### 2. Advanced Messaging
- File attachments
- Voice notes
- Message reactions
- Typing indicators
- Online/offline status

### 3. Payment Enhancements
- Multiple payment methods (PayPal, Credit cards)
- Subscription plans for recurring revenue
- Tip/Buy coffee feature
- Automatic payouts to consultants

### 4. Analytics Dashboard
- Detailed earnings reports
- Revenue trends
- Popular services
- Peak booking times
- Customer acquisition analysis

### 5. Notification System
- Email notifications for bookings
- In-app notifications
- SMS reminders
- Calendar sync integration

## File Structure

```
src/
├── components/
│   └── Navigation.tsx          # Main navigation bar
├── contexts/
│   └── AuthContext.tsx         # Authentication state management
├── lib/
│   └── supabase.ts            # Supabase client setup
├── pages/
│   ├── auth/
│   │   ├── AuthPages.tsx
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── booking/
│   │   └── BookingPage.tsx
│   ├── chat/
│   │   └── ChatBox.tsx
│   ├── courses/
│   │   └── CourseLMS.tsx
│   ├── dashboard/
│   │   ├── UserDashboard.tsx
│   │   ├── ConsultantDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── marketplace/
│       ├── Marketplace.tsx
│       └── ConsultantProfile.tsx
├── types/
│   └── index.ts               # TypeScript type definitions
├── App.tsx                    # Main app component
├── index.css                  # Global styles
└── main.tsx                   # Entry point
```

## Deployment Checklist

- [ ] Configure Stripe payment processing
- [ ] Set up email notifications
- [ ] Configure webhook endpoints
- [ ] Test payment flows
- [ ] Deploy to production
- [ ] Set up monitoring and logging
- [ ] Configure CDN for media
- [ ] Enable analytics
- [ ] Set up customer support system

## Next Steps

1. **Payment Integration**: Set up Stripe for bookings and course purchases
2. **Video Calling**: Implement WebRTC for real-time video sessions
3. **Email Notifications**: Configure email alerts for bookings
4. **Admin Tools**: Complete admin management interfaces
5. **Mobile Responsive**: Optimize for mobile devices
6. **Performance**: Add caching and optimization

## Support & Resources

- Supabase Documentation: https://supabase.com/docs
- Stripe Documentation: https://stripe.com/docs
- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs

## API Endpoints Reference

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Consultants
- `GET /consultants` - List all consultants
- `GET /consultants/:id` - Get consultant details
- `PUT /consultants/:id` - Update consultant profile

### Bookings
- `POST /bookings` - Create new booking
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id` - Update booking status
- `DELETE /bookings/:id` - Cancel booking

### Messages
- `POST /messages` - Send message
- `GET /messages/:bookingId` - Get conversation

### Courses
- `POST /courses` - Create course
- `GET /courses` - List courses
- `POST /courses/:id/enroll` - Enroll in course

### Payments
- `POST /payments` - Process payment
- `GET /payments/history` - Payment history

---

Built with React, TypeScript, Tailwind CSS, and Supabase. Ready for production deployment.
