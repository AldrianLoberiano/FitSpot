# FitSpot: Gym Membership & Class Booking Website

## Group Members

Yzabelle Grace Cane, Viena Grace Echavez, Maria Chesam Leonor, Jeah May Pareja

## GitHub Repository URL

_(To be added)_

## Concept

FitSpot is a website where users can check gym membership plans, view available fitness classes, and book their preferred schedule online. It makes it easier for both members and gym staff to manage memberships and class reservations.

## Login Credentials

Demo accounts (no database yet - login is handled in `js/script.js`):

| Role   | Email              | Password  | Redirect      |
|--------|--------------------|-----------|---------------|
| Admin  | admin@fitspot.com  | admin123  | Admin panel   |
| Member | member@fitspot.com | member123 | Member portal |

Note: Register is UI-only, so new member accounts cannot log in yet - use the demo member account above.

## Main Features

- User registration and login (Need to implement database for this  )
- View membership plans, prices, and inclusions
- Browse fitness classes such as Zumba, Yoga, Pilates, Boxing, and Strength Training
- View available dates, times, and slots
- Book or cancel a class
- View upcoming bookings
- Admin can add, edit, or remove membership plans and classes
- Admin can manage schedules, members, and reservations
- Monitor available slots to avoid overbooking

## Benefits

Members don't have to message or visit the gym just to ask about schedules, available slots, or membership plans. They can check and book directly through the website. For the gym, it makes managing members, schedules, and reservations more organized and reduces manual work.

## Why It's Good for Our Project

The website is simple and manageable to develop but still has enough features for a complete system. It includes user and admin accounts, booking, scheduling, and basic CRUD functions, so we can easily divide the tasks among the group members.

## Feature Status

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | User registration and login | Partial | Login popup + `pages/login.html` with demo logins (admin `admin@fitspot.com` / `admin123`, member `member@fitspot.com` / `member123`), session flags, and page guards for the admin panel and member portal; Register is UI-only, no backend/member accounts |
| 2 | View membership plans, prices, and inclusions | Partial | Plans shown on the site (Basic ₱999, Premium ₱1,499); admin can add/edit/delete them in-session (not saved after refresh); member portal has plan cards with inclusions and a choose-plan demo |
| 3 | Browse fitness classes (Zumba, Yoga, Pilates, Boxing, Strength Training) | Partial | Zumba, Yoga, and Strength Training listed on the site and in the member portal; **Pilates and Boxing still missing** (admin can add them in the panel) |
| 4 | View available dates, times, and slots | Partial | Site schedule is static; admin panel and member portal show per-class slot usage bars (booked/capacity) |
| 5 | Book or cancel a class | Partial | Member portal (`pages/users/dashboard.html`) can book and cancel classes client-side (session-only demo, no database); main site booking form still has no functionality |
| 6 | View upcoming bookings | Partial | Member portal "My Bookings" view with statuses, cancel buttons, and empty state; demo data resets on refresh |
| 7 | Admin: add, edit, remove membership plans and classes | Partial | Working client-side add/edit/delete with modal forms in `pages/admin/dashboard.html` - no database persistence yet |
| 8 | Admin: manage schedules, members, and reservations | Partial | Admin tables with delete, confirm/cancel actions - no database persistence yet |
| 9 | Monitor available slots to avoid overbooking | Partial | Slot usage bars with Open/Full status in admin panel and member portal; enforced when a member books (full classes are disabled), not yet on the main site booking form |

### Completed So Far

- Site layout and styling (HTML/CSS) - home page, sections, forms, footer
- Header with logo on the left, centered navigation, search bar, and login button (right)
- Sticky responsive header
- Full-screen responsive hero with badge, headline, CTAs, and stats
- Automatic image carousel in the hero (3 slides, dots, 3-second autoplay)
- Login/Register popup with branding panel and demo admin/member credentials
- Admin panel: sidebar tabs, dashboard stats, plans/classes CRUD (client-side), schedules with slot bars, members, reservations (confirm/cancel), avatar menu (Profile, Settings, Logout)
- Member portal (`pages/users/dashboard.html`): overview stats, membership plan cards with choose-plan demo, class browsing with slot bars, book/cancel with statuses, My Bookings table with empty state, profile form (all client-side)
- Feature-folder structure (`css/`, `js/`, `images/`, `pages/admin/`, `pages/users/`)

## Tech Stack (Current)

- HTML5
- CSS3
- JavaScript (login demo, modals, hero carousel, admin panel, member portal)

_Planned: a backend/database for accounts, bookings, and admin CRUD._

## Folder Structure

```
FitSpot/
├── index.html              # Home page (hero, plans, classes, schedule, booking)
├── README.md
├── css/
│   ├── style.css            # Site styles
│   ├── admin.css            # Admin panel styles
│   └── user.css             # Member portal styles
├── images/
│   ├── fitstop_white_logo.png   # Header/logo image
│   ├── fitstop_logo_trans.png   # Logo with transparent background
│   ├── jogging.jpg              # Hero carousel slide 1
│   ├── rope.jpg                 # Hero carousel slide 2
│   └── kettlebellswings.jpg     # Hero carousel slide 3
├── js/
│   ├── script.js           # Login/Register popup + hero carousel logic
│   ├── admin.js            # Admin panel logic (tabs, CRUD demo)
│   └── user.js             # Member portal logic (tabs, booking/cancel demo)
└── pages/
    ├── login.html          # Standalone login / registration page
    ├── admin/
    │   └── dashboard.html  # Admin panel (plans, classes, schedules, members, reservations)
    └── users/
        └── dashboard.html  # Member portal (overview, plans, classes, my bookings, profile)
```

## Development Progress Tracking

| Course Week | Current Revisions or Updates |
|-------------|------------------------------|
| Week 2 | Finalized the FitSpot concept and identified the main purpose and intended users |
| Week 3 | Created and refined the initial HTML structure of FitSpot, including the navigation, membership plans, fitness classes, schedules, and booking section. |
| Week 4 | |
| Week 5 | |
| Week 6 | |
| Week 7 | |
| Week 8 | |
| Week 9 | |
| Week 10 | |
| Week 11 | |
| Week 12 | |