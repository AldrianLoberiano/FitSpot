# FitSpot: Gym Membership & Class Booking Website

## Group Members

Yzabelle Grace Cane, Viena Grace Echavez, Maria Chesam Leonor, Jeah May Pareja

## GitHub Repository URL

_(To be added)_

## Concept

FitSpot is a website where users can check gym membership plans, view available fitness classes, and book their preferred schedule online. It makes it easier for both members and gym staff to manage memberships and class reservations.

## Login Credentials

Demo accounts (login is still handled client-side in `js/script.js`; the same accounts are seeded in the MySQL database):

| Role   | Email              | Password  | Redirect      |
|--------|--------------------|-----------|---------------|
| Admin  | admin@fitspot.com  | admin123  | Admin panel   |
| Member | member@fitspot.com | member123 | Member portal |

Note: Register is UI-only, so new member accounts cannot log in yet - use the demo member account above.

## Main Features

- User registration and login (MySQL database ready - see [Database](#database); pages not connected yet)
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
| 1 | User registration and login | Partial | Login popup + `pages/login.html` with demo logins (admin `admin@fitspot.com` / `admin123`, member `member@fitspot.com` / `member123`), session flags, and page guards for the admin panel and member portal; Register is UI-only - `users` table is ready in `database/fitspot.sql` but not connected yet |
| 2 | View membership plans, prices, and inclusions | Partial | Plans shown on the site (Basic ₱999, Premium ₱1,499); admin can add/edit/delete them in-session (not saved after refresh); member portal has plan cards with inclusions and a choose-plan demo; `membership_plans` table ready |
| 3 | Browse fitness classes (Zumba, Yoga, Pilates, Boxing, Strength Training) | Partial | Zumba, Yoga, and Strength Training listed on the site and in the member portal; **Pilates and Boxing still missing on the pages** (all 5 are seeded in the `fitness_classes` table) |
| 4 | View available dates, times, and slots | Partial | Site schedule is static; admin panel and member portal show per-class slot usage bars (booked/capacity); `class_schedules` table ready |
| 5 | Book or cancel a class | Partial | Member portal (`pages/users/classes.html` + `pages/users/bookings.html`) can book and cancel classes client-side (demo state kept in `sessionStorage` so it survives page navigation, resets on logout/close); `bookings` table ready with capacity/overbooking rules - no backend yet; main site booking form still has no functionality |
| 6 | View upcoming bookings | Partial | Member portal "My Bookings" page with statuses, cancel buttons, and empty state; upcoming-bookings query documented in `database/database.md` |
| 7 | Admin: add, edit, remove membership plans and classes | Partial | Working client-side add/edit/delete with modal forms on `pages/admin/memberships.html` and `pages/admin/classes.html` - tables exist in MySQL but the panel is not connected yet |
| 8 | Admin: manage schedules, members, and reservations | Partial | Each section is its own page (`pages/admin/schedules.html`, `members.html`, `reservations.html`) with delete and confirm/cancel actions - same tables exist in MySQL (`class_schedules`, `users`, `memberships`, `bookings`), not connected yet |
| 9 | Monitor available slots to avoid overbooking | Partial | Slot usage bars with Open/Full status in admin panel and member portal; enforced when a member books (full classes are disabled); `v_slot_usage` view ready for the real counts |

### Completed So Far

- Site layout and styling (HTML/CSS) - home page, sections, forms, footer
- Header with logo on the left, centered navigation, search bar, and login button (right)
- Sticky responsive header
- Full-screen responsive hero with badge, headline, CTAs, and stats
- Automatic image carousel in the hero (4 slides, dots, 3-second autoplay)
- Login/Register popup with branding panel and demo admin/member credentials
- Admin panel (one HTML file per section): sidebar links, dashboard stats (`pages/admin/dashboard.html`), plans/classes CRUD with modal forms (`memberships.html`, `classes.html`), schedules with slot bars, members, reservations (confirm/cancel), avatar menu (Profile, Settings, Logout)
- Member portal (one HTML file per section): overview stats (`pages/users/dashboard.html`), membership plan cards with choose-plan demo (`memberships.html`), class browsing with slot bars and book/cancel (`classes.html`), My Bookings table with empty state (`bookings.html`), profile form (`profile.html`) - demo state persists across pages in the same tab
- MySQL database: feature-to-table design in `database/database.md`, importable schema + seed data in `database/fitspot.sql` (6 tables, slot-usage view, demo accounts)
- Feature-folder structure (`css/`, `js/`, `images/`, `database/`, `pages/admin/`, `pages/users/`)

## Tech Stack (Current)

- HTML5
- CSS3
- JavaScript (login demo, modals, hero carousel, admin panel, member portal)
- MySQL 8.0 (schema, slot-usage view, and seed data ready)

_Planned: a backend (PHP/Node) to connect the pages to the MySQL database for accounts, bookings, and admin CRUD._

## Database

Full design, queries, and the overbooking-transaction pattern are in [`database/database.md`](database/database.md). Import the ready-made file to create the `fitspot` database:

```bash
mysql -u root -p < database/fitspot.sql
```

| Table / View | Purpose (Feature #) |
|---|---|
| `users` | Registration + login, admin and member accounts (1) |
| `membership_plans` | Plans, prices, inclusions (2, 7) |
| `memberships` | Member's current plan and validity |
| `fitness_classes` | Zumba, Yoga, Pilates, Boxing, Strength Training (3, 7) |
| `class_schedules` | Class dates, times, and slots (4, 8) |
| `bookings` | Book/cancel reservations, upcoming bookings (5, 6, 8) |
| `v_slot_usage` (view) | Booked/capacity counts and Open/Full status (9) |

Seed data included: 2 membership plans, 5 fitness classes, 5 schedules, and the demo admin/member accounts from [Login Credentials](#login-credentials). Status: schema and seed are created - the pages are **not connected to the database yet** (still client-side demo).

## Folder Structure

```
FitSpot/
├── index.html              # Home page (hero, plans, classes, schedule, booking)
├── README.md
├── css/
│   ├── style.css            # Site styles
│   ├── admin.css            # Admin panel styles
│   └── user.css             # Member portal styles
├── database/
│   ├── database.md          # MySQL database design and queries
│   └── fitspot.sql          # Ready-to-import MySQL database file (schema + seed)
├── images/
│   ├── fitstop_white_logo.png   # Header/logo image
│   ├── fitstop_logo_trans.png   # Logo with transparent background
│   ├── jogging.jpg              # Hero carousel slide 1
│   ├── rope.jpg                 # Hero carousel slide 2
│   ├── kettlebellswings.jpg     # Hero carousel slide 3
│   └── jumping.jpg              # Hero carousel slide 4
├── js/
│   ├── script.js           # Login/Register popup + hero carousel logic
│   ├── admin.js            # Admin panel logic (CRUD demo, modals, avatar menu)
│   └── user.js             # Member portal logic (booking/cancel, demo state, profile)
└── pages/
    ├── login.html          # Standalone login / registration page
    ├── admin/
    │   ├── dashboard.html      # Overview: stats + reservations preview
    │   ├── memberships.html    # Membership plans CRUD
    │   ├── classes.html        # Fitness classes CRUD
    │   ├── schedules.html      # Schedules with slot usage bars
    │   ├── members.html        # Members table
    │   └── reservations.html   # Reservations (confirm/cancel)
    └── users/
        ├── dashboard.html      # Overview: stats + upcoming bookings
        ├── memberships.html    # Plan cards with choose-plan demo
        ├── classes.html        # Browse classes, book with slot bars
        ├── bookings.html       # My Bookings table (statuses, cancel)
        └── profile.html        # Profile form + membership summary
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