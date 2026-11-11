OJ SAMUEL MOBILE GAMING CHAMPIONSHIP — COMPLETE ADMIN CMS

FILES
- index.html: existing public website plus live CMS feed.
- admin.html: admin login, registration review, and content-management dashboard.
- supabase-config.js: existing Supabase URL and anon/public key settings.
- supabase-cms-setup.sql: creates CMS tables and admin allow-list policies.

SETUP
1. Keep your existing Supabase project and registration database setup.
2. Run supabase-cms-setup.sql in Supabase SQL Editor.
3. Create your administrator in Supabase Authentication > Users.
4. Copy that user's UUID. At the bottom of the SQL file, uncomment the INSERT statement, replace the placeholder with the UUID, and run it.
5. Put your Supabase Project URL and anon/public key in supabase-config.js. Never use a service_role key in a browser file.
6. Upload index.html, admin.html, and supabase-config.js to the same Netlify site root.
7. Open /admin.html, sign in, and add published content. Drafts remain private.
8. Visit the public site and scroll near the footer to see published CMS content.

CONTROLS
Registrations: search, status filter, CSV export, approve/reject, private admin note.
Announcements, tournaments, fixtures, leaderboard, winners/prizes, sponsors, gallery: create, edit, publish/unpublish, delete, sort order, date, category, image URL, link URL and extra details.
Website settings: competition title, announcement strip, welcome message and WhatsApp URL.

IMPORTANT
The original homepage design and hard-coded content remain intact. CMS-managed items appear in a new live content area near the footer; they do not automatically replace every original homepage card, statistic or sentence. Registration access still depends on your original registration SQL/RLS policies. If registration updates report a permissions error, those existing policies need review; do not disable RLS or make phone numbers public.
Images are entered as public image URLs. Never publish private player details, passwords, payment information or Supabase secret/service_role keys.
