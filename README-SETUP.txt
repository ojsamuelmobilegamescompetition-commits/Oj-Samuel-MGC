OJ SAMUEL — LIVE REGISTRATION UPGRADE

WHAT CHANGES
- Registration is submitted directly on your website (not WhatsApp-only).
- Every entry is saved in a shared Supabase database with Pending status.
- Admin signs in to the LIVE REGISTRATIONS button on admin.html.
- Admin can approve or reject each entry and leave an internal note.
- Players can check status using their registration reference and phone number.
- Database access is protected with Supabase Row Level Security; do not expose a service_role key.

SETUP (REQUIRED BEFORE IT WORKS LIVE)
1. Create a Supabase project at https://supabase.com/.
2. Open SQL Editor and run all of supabase-setup.sql.
3. In Project Settings > API, copy Project URL and anon/public key into supabase-config.js. Do not use the service_role/secret key.
4. In Supabase Authentication > Users, create your admin account with an email and strong password.
5. Copy that user's UUID and run the final INSERT statement in supabase-setup.sql, replacing the placeholder with the UUID. Only allow trusted administrators.
6. Upload index.html, admin.html, and supabase-config.js together to the same Netlify site root. Keep the filenames exactly as shown.
7. Open the public site, submit a test registration, then open /admin.html and sign in to approve/reject it. Test status lookup too.

IMPORTANT
- Existing website pages and visual design are retained. The admin live-review panel is added as a floating button.
- Current demo/sample registrations already inside the admin preview are not imported into the live database. New website registrations are shared.
- This package does not make the site magically live until you complete the Supabase setup and deploy all three files.
- Do not publish admin passwords, Supabase service_role keys, or personal player data.
