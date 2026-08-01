# SYNALYX ANALYTICS — School Platform

A public marketing site plus a full student/admin portal for a data analytics school. Dark Midnight Indigo theme, bold display typography, restrained motion.

## Public site

- **Home** — bold hero with the SYNALYX mark and tagline "Synchronized data, Simplified decisions", animated stat counters, course highlights, how-it-works, testimonials, CTA to enrol.
- **Courses** — track cards (Excel & Data Foundations, SQL, Power BI, Python for Analytics, Full Data Analytics Bootcamp) with duration, level, outline and fee placeholders you can edit later.
- **About** — mission, instructors, why SYNALYX.
- **Contact** — enquiry form, email/phone/location placeholders.
- **Enrol** — the multi-step application form.

## Enrolment form (multi-step, animated)

Step 1 Personal: full name, email, phone, date of birth, gender, city/state.
Step 2 Background: highest education, current occupation, prior analytics experience level, computer access (laptop yes/no).
Step 3 Programme: course/track, preferred cohort start, preferred schedule (weekday / weekend / evening), learning mode (online / physical / hybrid).
Step 4 Motivation: "What do you plan to achieve?", "Where did you hear about us?" (Instagram, LinkedIn, friend, Google, other), any questions, agree to terms.

Every field validated with Zod. On submit the application is saved as **pending** and the applicant sees a confirmation screen.

## Access flow

Enrol form → application lands in admin queue → admin approves → student account is created and credentials/invite are issued → student signs in and lands on their dashboard. Rejected applications get a recorded status and reason.

## Student portal

- **Dashboard** — next class, attendance rate, assignment status, progress ring, announcements.
- **Assignments** — list with due dates and status; open one to read the brief and submit text + file link/upload; see grade and instructor feedback once marked.
- **Schedule** — upcoming and past sessions with date, time, topic, instructor and meeting link.
- **Attendance** — personal record per session with present/absent/late and overall percentage.
- **Profile** — edit own details, view cohort and course.

## Admin portal

- **Overview analytics** — enrolments over time, applications by status, students per course, attendance rate trend, assignment submission and grading rates, top referral sources — all charted.
- **Applications** — review queue, view full submission, approve (creates the student account) or reject with a reason.
- **Students** — searchable table, view/edit a student, assign to a cohort, activate/suspend access.
- **Courses & cohorts** — create courses and cohorts, set start dates and capacity.
- **Sessions** — schedule classes, attach meeting link, mark attendance for the whole class in one screen.
- **Assignments** — create assignments per cohort, see all submissions, grade with a score and feedback.
- **Announcements** — post notices to a cohort or everyone.

## Design

- Palette: `#0a0a1a` base, `#141432` surface, `#1e1e5a` elevated, `#4f46e5` indigo accent — as oklch semantic tokens in `src/styles.css`, dark-first.
- Bold geometric display type for headings, clean sans for body, heavy tracking-tight headlines.
- Motion: staggered section reveals on scroll, animated counters, smooth multi-step form transitions, subtle card hover lift. Restrained, no motion on every element.
- Logo mark and wordmark recreated as a component using your uploaded logo as reference.

## Technical

- **Lovable Cloud** for database, auth and storage (enabled as the first step).
- Tables: `profiles`, `user_roles` (separate table, `app_role` enum `admin | instructor | student`, `has_role` security-definer function), `applications`, `courses`, `cohorts`, `enrollments`, `sessions`, `attendance`, `assignments`, `submissions`, `announcements`. RLS on every table plus explicit grants; students read only their own rows, admins gated through `has_role`.
- Storage bucket for assignment submissions with owner-scoped policies.
- Auth: email + password, plus Google sign-in. Admin approval creates the account via a privileged server function that verifies the caller is an admin.
- Routing: public routes at top level; portal routes under `_authenticated/`, admin routes behind a role-gated nested layout. Data via server functions + TanStack Query.
- Seed data in the migration: courses, one active cohort, sample sessions and assignments so the dashboards are not empty on first load.
- Per-route SEO metadata on every public page.

## Notes

Course fees, contact details and instructor bios ship as clear placeholders — send me the real ones and I'll swap them in.
