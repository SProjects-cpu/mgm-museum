# MGM Museum Platform - Critical Issues & Resolution Requirements

## Project Overview
**Client Site URL**: https://mgm-museum-buh5z7otb-shivam-s-projects-fd1d92c1.vercel.app  
**Priority**: HIGH - System currently non-functional for testing and production

---

## CRITICAL ISSUE #1: Cart Page Application Error

### Problem Statement
The cart page is completely broken and displaying a client-side exception error.

**Error Details:**
- **URL Affected**: `/cart`
- **Error Message**: "Application error: a client-side exception has occurred while loading mgm-museum-buh5z7otb-shivam-s-projects-fd1d92c1.vercel.app (see the browser console for more information)."
- **Impact**: Login page actions are not functioning after this error occurs

### Required Resolution
1. Debug and fix the client-side exception in the cart page
2. Review browser console logs to identify the root cause
3. Ensure login functionality works properly after cart page access
4. Implement proper error handling to prevent complete page crashes

---

## CRITICAL ISSUE #2: Uncontrollable Ticket Showcase Widget

### Problem Statement
A hardcoded ticket pricing and booking widget is floating on the client site with no admin panel control.

**Current State:**
- The widget displays fixed pricing (₹150/person)
- Includes hardcoded amenities and features list
- Contains date picker, visitor count, and experience type selectors
- No ability to enable/disable or modify content from admin panel

### Required Resolution

#### A. Create New Admin Panel Section: "Ticket Showcase"
Create a dedicated admin section with the following capabilities:

**1. Toggle Control**
- ON/OFF switch to show/hide the widget on the client site
- Real-time synchronization between admin toggle and site display

**2. Editable Fields**
- **Pricing**: Ability to set price per person (currently ₹150)
- **Currency Symbol**: Editable currency display
- **Features List**: Manage all three feature categories:
  - Interactive Exhibitions
  - Planetarium Shows
  - 3D Theatre Experience
  - Educational Programs
  - Group Discounts
  - Free Parking
  - Accessibility Support
  - Multilingual Guides
  - Cafeteria Available

**3. Settings Controls**
- Minimum date selection
- Closed days configuration (currently Mondays)
- Visitor count options (1-5, 10+)
- Experience type options:
  - General Admission
  - Planetarium Show
  - 3D Theatre
  - Combo Package

**4. Opening Hours Configuration**
- Start time (currently 9:30 AM)
- End time (currently 5:30 PM)
- Closed days management

**5. CTA Button**
- Editable button text (currently "Find Available Tickets")
- Link destination configuration

#### B. Database Schema Requirements
- Create `ticket_showcase_config` table with fields for all editable elements
- Ensure real-time sync between admin changes and client site display
- Implement proper caching strategy for performance

---

## CRITICAL ISSUE #3: Non-Functional Booking System

### Problem Statement
The entire booking flow is displaying dummy/fake data with NO connection to admin panel configurations.

**Affected URL**: `/book-visit?exhibitionId=[ID]&exhibitionName=[NAME]`

**Non-Functional Elements:**
1. **Calendar Selection** - Shows dummy dates, not synced with admin
2. **Time Slot Selection** - Displays fake time slots, not from admin panel
3. **Seat Selection** - Not connected to actual availability
4. **Ticket Type Selection** - Not reflecting admin panel configurations
5. **Show Booking System** - Same issues as exhibitions

### Current vs. Required Behavior

| Component | Current Behavior | Required Behavior |
|-----------|------------------|-------------------|
| Calendar | Static/dummy dates | Dynamic dates from admin panel exhibition settings |
| Time Slots | Hardcoded fake times | Real time slots configured per exhibition in admin |
| Seat Selection | Fake availability | Actual seat availability from database |
| Ticket Types | Static options | Admin-configurable ticket categories with pricing |
| Availability | No real-time updates | Live availability checking and updates |

### Required Resolution

#### A. Exhibition Management Sync
1. **Calendar Integration**
   - Pull available dates from admin panel exhibition configurations
   - Disable dates where exhibition is not scheduled
   - Block fully booked dates automatically
   - Show real-time date availability

2. **Time Slot Management**
   - Display only time slots configured in admin for specific exhibition
   - Show remaining capacity per time slot
   - Update availability in real-time as bookings occur
   - Handle multiple shows per day correctly

3. **Seat Selection System**
   - Connect to actual venue seating configuration from admin
   - Display real-time seat availability
   - Implement seat locking during booking process (5-10 min timeout)
   - Show different seat categories with proper pricing

4. **Ticket Types**
   - Load ticket types from admin panel configurations
   - Display correct pricing per ticket type
   - Apply dynamic pricing rules if configured
   - Handle group discounts and special pricing

#### B. Shows Booking System
Apply the same real-time sync requirements as exhibitions:
- Dynamic show schedules from admin
- Real seat availability
- Proper time slot management
- Actual ticket type configurations

#### C. Database & API Requirements
1. Create proper API endpoints for:
   - `GET /api/exhibitions/{id}/available-dates`
   - `GET /api/exhibitions/{id}/time-slots?date={date}`
   - `GET /api/exhibitions/{id}/seats?date={date}&time={time}`
   - `GET /api/exhibitions/{id}/ticket-types`
   - `POST /api/bookings/lock-seats` (temporary reservation)

2. Implement real-time availability checking:
   - Check current bookings before displaying availability
   - Update availability counts dynamically
   - Prevent overbooking with proper locks

3. Admin panel changes must immediately reflect on client site:
   - WebSocket or polling mechanism for real-time updates
   - Cache invalidation on admin updates
   - Proper state management on frontend

---

## CRITICAL ISSUE #4: System Untestable in Current State

### Problem Statement
Due to issues #1-3, the platform cannot be properly tested, validated, or used in production.

**Testing Blockers:**
- Cannot test checkout flow (cart broken)
- Cannot verify booking functionality (fake data)
- Cannot validate admin panel changes (no sync)
- Cannot perform end-to-end user journey testing

### Required Resolution
1. Fix all critical issues #1-3 first
2. Implement proper error logging and monitoring
3. Create test environment with sample data
4. Provide comprehensive testing documentation

---

## Implementation Approach

### Phase 1: Immediate Fixes (Priority 1)
1. Fix cart page error and login functionality
2. Implement basic admin panel sync for existing features

### Phase 2: Ticket Showcase Control (Priority 2)
1. Create "Ticket Showcase" admin section
2. Implement ON/OFF toggle with real-time sync
3. Make all content fields editable

### Phase 3: Booking System Integration (Priority 3)
1. Connect calendar to admin configurations
2. Implement real-time time slot management
3. Build actual seat selection system
4. Sync ticket types with admin panel

### Phase 4: Testing & Validation (Priority 4)
1. Comprehensive testing of all flows
2. Performance optimization
3. Security audit
4. Production deployment

---

## Technical Requirements

### Real-Time Synchronization
- All admin panel changes must reflect on client site within 2-5 seconds maximum
- Implement proper caching strategy with cache invalidation
- Consider WebSocket connections for critical real-time features
- Database triggers for automatic updates where applicable

### Error Handling
- Implement comprehensive error logging
- User-friendly error messages on frontend
- Admin notifications for critical errors
- Rollback mechanisms for failed updates

### Performance
- Optimize database queries for availability checking
- Implement proper indexing on booking-related tables
- Use caching for frequently accessed data
- Load testing for concurrent bookings

### Security
- Prevent double bookings with proper transaction handling
- Implement seat locking mechanism during checkout
- Validate all admin inputs before saving
- Secure API endpoints with proper authentication

---

## Success Criteria

✅ Cart page loads without errors and login works properly  
✅ Ticket Showcase widget is fully controllable from admin panel  
✅ Admin panel changes reflect immediately on client site (< 5 seconds)  
✅ Calendar shows only actual available dates from admin configurations  
✅ Time slots display real availability and capacity  
✅ Seat selection shows actual venue layout and availability  
✅ Ticket types and pricing match admin panel exactly  
✅ Booking flow can be completed end-to-end successfully  
✅ System is fully testable with real data  
✅ No dummy/fake data anywhere on the platform  

---

## Next Steps

1. **Kiro's Review**: Analyze all issues and provide implementation timeline
2. **Technical Discussion**: Clarify any architectural questions or concerns
3. **Development Sprints**: Break down work into manageable sprints
4. **Testing Checkpoints**: Define testing milestones after each phase
5. **Deployment Plan**: Staged rollout with rollback capability

---

**Document Version**: 1.0  
**Date**: November 03, 2025  
**Prepared For**: Kiro (Development Team)  
**Status**: Awaiting Technical Review & Timeline